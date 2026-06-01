import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DomainVerificationStatus,
  OrganizationDomainType,
} from '@prisma/client';
import { randomBytes } from 'node:crypto';
import * as dns from 'node:dns/promises';
import {
  isPlatformUser,
  requireCurrentOrganizationId,
} from '../../common/organization-scope';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../database/prisma.service';
import { CreateOrganizationDomainDto } from './dto/create-organization-domain.dto';
import { DomainReviewDto } from './dto/domain-review.dto';

@Injectable()
export class OrganizationDomainsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async findMine(currentUser: AuthenticatedRequestUser) {
    const organizationId = requireCurrentOrganizationId(currentUser);
    this.assertAnyPermission(currentUser, [
      'organization_domains.view_own',
      'organization_domains.manage_own',
    ]);

    const domains = await this.prisma.organizationDomainVerification.findMany({
      where: { organizationId },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });

    return domains.map((domain) => this.toResponse(domain));
  }

  async createMine(
    dto: CreateOrganizationDomainDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    const organizationId = requireCurrentOrganizationId(currentUser);
    this.assertAnyPermission(currentUser, ['organization_domains.manage_own']);

    const type = this.parseType(dto.type);
    const domain = this.normalizeDomain(dto.domain, type);

    const record = await this.prisma.organizationDomainVerification.upsert({
      where: {
        organizationId_domain: {
          organizationId,
          domain,
        },
      },
      create: {
        organizationId,
        domain,
        type,
        status:
          type === OrganizationDomainType.SUBDOMAIN
            ? DomainVerificationStatus.VERIFIED
            : DomainVerificationStatus.PENDING,
        verificationToken: this.verificationToken(),
        verifiedAt:
          type === OrganizationDomainType.SUBDOMAIN ? new Date() : undefined,
        statusNote:
          type === OrganizationDomainType.SUBDOMAIN
            ? 'subdomain_auto_verified'
            : 'created_pending_dns',
      },
      update: {
        type,
        status:
          type === OrganizationDomainType.SUBDOMAIN
            ? DomainVerificationStatus.VERIFIED
            : DomainVerificationStatus.PENDING,
        verificationToken: this.verificationToken(),
        verifiedAt:
          type === OrganizationDomainType.SUBDOMAIN ? new Date() : null,
        failureReason: null,
        statusNote:
          type === OrganizationDomainType.SUBDOMAIN
            ? 'subdomain_auto_verified'
            : 'created_pending_dns',
      },
    });

    await this.auditLogs.record({
      action: 'organization_domain.created',
      entityType: 'OrganizationDomainVerification',
      entityId: record.id,
      actor: currentUser,
      organizationId,
      metadata: { domain: record.domain, type: record.type, status: record.status },
    });

    return this.toResponse(record);
  }

  async requestVerification(
    id: string,
    currentUser: AuthenticatedRequestUser,
  ) {
    const record = await this.findDomainForOrganization(id, currentUser);

    const updated = await this.prisma.organizationDomainVerification.update({
      where: { id: record.id },
      data: {
        status: DomainVerificationStatus.PENDING,
        verificationToken: this.verificationToken(),
        lastCheckedAt: new Date(),
        verifiedAt: null,
        failureReason: null,
        statusNote: 'verification_requested',
      },
    });

    await this.auditLogs.record({
      action: 'organization_domain.verification_requested',
      entityType: 'OrganizationDomainVerification',
      entityId: updated.id,
      actor: currentUser,
      organizationId: updated.organizationId,
      metadata: { domain: updated.domain, type: updated.type },
    });

    return this.toResponse(updated);
  }

  async markVerifiedDevOnly(
    id: string,
    currentUser: AuthenticatedRequestUser,
  ) {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Dev-only verification is disabled in production.');
    }

    const record = await this.findDomainForOrganization(id, currentUser);
    const updated = await this.markVerified(record.id, currentUser);

    await this.auditLogs.record({
      action: 'organization_domain.dev_verified',
      entityType: 'OrganizationDomainVerification',
      entityId: updated.id,
      actor: currentUser,
      organizationId: updated.organizationId,
      metadata: { domain: updated.domain, type: updated.type },
    });

    return this.toResponse(updated);
  }

  async checkDns(id: string, currentUser: AuthenticatedRequestUser) {
    const record = await this.findDomainForOrganization(id, currentUser);
    const txtName = this.txtName(record.domain);

    try {
      const records = await this.resolveTxtRecords(txtName);
      const flattened = records.map((parts) => parts.join(''));

      if (!flattened.includes(record.verificationToken)) {
        const updated = await this.prisma.organizationDomainVerification.update({
          where: { id: record.id },
          data: {
            status: DomainVerificationStatus.PENDING,
            lastCheckedAt: new Date(),
            failureReason: 'DNS TXT verification token was not found.',
            statusNote: 'dns_txt_missing',
          },
        });

        await this.auditLogs.record({
          action: 'organization_domain.dns_check_missing',
          entityType: 'OrganizationDomainVerification',
          entityId: updated.id,
          actor: currentUser,
          organizationId: updated.organizationId,
          metadata: { domain: updated.domain, txtName },
        });

        return this.toResponse(updated);
      }

      const updated = await this.markVerified(record.id, currentUser, {
        statusNote: 'dns_txt_verified',
      });

      await this.auditLogs.record({
        action: 'organization_domain.dns_check_verified',
        entityType: 'OrganizationDomainVerification',
        entityId: updated.id,
        actor: currentUser,
        organizationId: updated.organizationId,
        metadata: { domain: updated.domain, txtName },
      });

      return this.toResponse(updated);
    } catch (error) {
      const updated = await this.prisma.organizationDomainVerification.update({
        where: { id: record.id },
        data: {
          status: DomainVerificationStatus.PENDING,
          lastCheckedAt: new Date(),
          failureReason: 'DNS TXT lookup failed or record was not found.',
          statusNote: 'dns_txt_lookup_failed',
        },
      });

      await this.auditLogs.record({
        action: 'organization_domain.dns_check_failed',
        entityType: 'OrganizationDomainVerification',
        entityId: updated.id,
        actor: currentUser,
        organizationId: updated.organizationId,
        metadata: {
          domain: updated.domain,
          txtName,
          error: error instanceof Error ? error.message : 'Unknown DNS error',
        },
      });

      return this.toResponse(updated);
    }
  }

  async findAllForPlatform(currentUser: AuthenticatedRequestUser) {
    this.assertPlatformDomainReviewer(currentUser);

    const domains = await this.prisma.organizationDomainVerification.findMany({
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            status: true,
          },
        },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });

    return domains.map((domain) => this.toResponse(domain));
  }

  async approve(id: string, currentUser: AuthenticatedRequestUser) {
    this.assertPlatformDomainReviewer(currentUser);

    const updated = await this.markVerified(id, currentUser);

    await this.auditLogs.record({
      action: 'organization_domain.approved',
      entityType: 'OrganizationDomainVerification',
      entityId: updated.id,
      actor: currentUser,
      organizationId: updated.organizationId,
      metadata: { domain: updated.domain, type: updated.type },
    });

    return this.toResponse(updated);
  }

  async reject(
    id: string,
    dto: DomainReviewDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    this.assertPlatformDomainReviewer(currentUser);

    const record = await this.prisma.organizationDomainVerification.findUnique({
      where: { id },
    });

    if (!record) {
      throw new NotFoundException('Domain verification not found.');
    }

    const updated = await this.prisma.organizationDomainVerification.update({
      where: { id },
      data: {
        status: DomainVerificationStatus.FAILED,
        failureReason:
          this.optionalString(dto.reason) ??
          this.optionalString(dto.notes) ??
          'Rejected by platform review.',
        verifiedAt: null,
        lastCheckedAt: new Date(),
        statusNote: 'platform_rejected',
      },
    });

    await this.auditLogs.record({
      action: 'organization_domain.rejected',
      entityType: 'OrganizationDomainVerification',
      entityId: updated.id,
      actor: currentUser,
      organizationId: updated.organizationId,
      metadata: { domain: updated.domain, reason: updated.failureReason },
    });

    return this.toResponse(updated);
  }

  private async findDomainForOrganization(
    id: string,
    currentUser: AuthenticatedRequestUser,
  ) {
    const organizationId = requireCurrentOrganizationId(currentUser);
    this.assertAnyPermission(currentUser, ['organization_domains.manage_own']);

    const record = await this.prisma.organizationDomainVerification.findFirst({
      where: { id, organizationId },
    });

    if (!record) {
      const exists = await this.prisma.organizationDomainVerification.findUnique({
        where: { id },
      });
      if (exists) {
        throw new ForbiddenException('Domain is outside your organization scope.');
      }
      throw new NotFoundException('Domain verification not found.');
    }

    return record;
  }

  private async markVerified(
    id: string,
    currentUser: AuthenticatedRequestUser,
    options: { statusNote?: string } = {},
  ) {
    const record = await this.prisma.organizationDomainVerification.findUnique({
      where: { id },
    });

    if (!record) {
      throw new NotFoundException('Domain verification not found.');
    }

    const updated = await this.prisma.organizationDomainVerification.update({
      where: { id },
      data: {
        status: DomainVerificationStatus.VERIFIED,
        verifiedAt: new Date(),
        lastCheckedAt: new Date(),
        failureReason: null,
        statusNote: options.statusNote,
      },
    });

    if (updated.type === OrganizationDomainType.CUSTOM_DOMAIN) {
      await this.prisma.organizationWebsiteSettings.updateMany({
        where: { organizationId: updated.organizationId },
        data: { customDomain: updated.domain },
      });
    }

    return updated;
  }

  private assertPlatformDomainReviewer(currentUser: AuthenticatedRequestUser) {
    if (
      !isPlatformUser(currentUser) ||
      !currentUser.permissions?.includes('organization_domains.verify')
    ) {
      throw new ForbiddenException('Missing organization_domains.verify permission.');
    }
  }

  private assertAnyPermission(
    currentUser: AuthenticatedRequestUser,
    permissions: string[],
  ) {
    if (
      !permissions.some((permission) =>
        currentUser.permissions?.includes(permission),
      )
    ) {
      throw new ForbiddenException(`Missing ${permissions[0]} permission.`);
    }
  }

  private parseType(type: OrganizationDomainType | undefined) {
    if (!type) {
      return OrganizationDomainType.CUSTOM_DOMAIN;
    }

    if (!Object.values(OrganizationDomainType).includes(type)) {
      throw new BadRequestException('Domain type is invalid.');
    }

    return type;
  }

  private normalizeDomain(domain: string, type: OrganizationDomainType) {
    const normalized = domain
      ?.trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .replace(/:\d+$/, '');

    if (!normalized) {
      throw new BadRequestException('domain is required.');
    }

    if (type === OrganizationDomainType.SUBDOMAIN) {
      const subdomain = normalized.endsWith('.popwam.com')
        ? normalized.slice(0, -'.popwam.com'.length)
        : normalized;
      if (!subdomain.match(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/)) {
        throw new BadRequestException('subdomain is invalid.');
      }
      return `${subdomain}.popwam.com`;
    }

    if (!normalized.match(/^[a-z0-9.-]+\.[a-z]{2,}$/)) {
      throw new BadRequestException('custom domain is invalid.');
    }

    return normalized;
  }

  private verificationToken() {
    return `popwam-domain-${randomBytes(24).toString('hex')}`;
  }

  private toResponse(domain: any) {
    return {
      id: domain.id,
      organizationId: domain.organizationId,
      domain: domain.domain,
      type: domain.type,
      status: domain.status,
      verificationToken: domain.verificationToken,
      lastCheckedAt: domain.lastCheckedAt,
      verifiedAt: domain.verifiedAt,
      failureReason: domain.failureReason,
      statusNote: domain.statusNote,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
      organization: domain.organization,
      verificationInstructions: {
        txtName: this.txtName(domain.domain),
        txtValue: domain.verificationToken,
      },
    };
  }

  private txtName(domain: string) {
    return `_popwam.${domain}`;
  }

  private resolveTxtRecords(txtName: string) {
    const mockRecords = this.mockTxtRecords(txtName);
    if (mockRecords) {
      return Promise.resolve(mockRecords);
    }

    return dns.resolveTxt(txtName);
  }

  private mockTxtRecords(txtName: string) {
    if (process.env.NODE_ENV === 'production') {
      return null;
    }

    const raw = process.env.PUBLIC_DOMAIN_DNS_MOCK_TXT_JSON;
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as Record<string, string[] | string[][]>;
      const value = parsed[txtName];
      if (!value) {
        return null;
      }

      return value.map((entry) => (Array.isArray(entry) ? entry : [entry]));
    } catch {
      return null;
    }
  }

  private optionalString(value: string | undefined | null) {
    const trimmed = value?.trim();
    return trimmed || undefined;
  }
}

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  isPlatformUser,
  requireCurrentOrganizationId,
} from '../../common/organization-scope';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../database/prisma.service';
import { UpdateOrganizationWebsiteSettingsDto } from './dto/update-organization-website-settings.dto';

@Injectable()
export class OrganizationWebsiteSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async findMine(currentUser: AuthenticatedRequestUser) {
    const organizationId = requireCurrentOrganizationId(currentUser);

    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: { websiteSettings: true },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found.');
    }

    return (
      organization.websiteSettings ??
      this.defaultSettings(organization.id, organization.slug, organization.name)
    );
  }

  async updateMine(
    dto: UpdateOrganizationWebsiteSettingsDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    if (isPlatformUser(currentUser)) {
      throw new ForbiddenException(
        'Use a scoped organization user for own website settings.',
      );
    }

    const organizationId = requireCurrentOrganizationId(currentUser);
    if (
      !currentUser.permissions?.includes('organization_website.update_own') &&
      !currentUser.permissions?.includes('organizations.update_own')
    ) {
      throw new ForbiddenException(
        'Missing organization_website.update_own permission.',
      );
    }

    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, slug: true, name: true },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found.');
    }

    this.assertDto(dto);

    const updated = await this.prisma.organizationWebsiteSettings.upsert({
      where: { organizationId },
      create: {
        organizationId,
        publicSlug: this.slugOrDefault(dto.publicSlug, organization.slug),
        subdomain: this.slugOrDefault(dto.subdomain, organization.slug),
        customDomain: this.nullableDomain(dto.customDomain),
        siteTitle: this.optionalString(dto.siteTitle) ?? organization.name,
        siteDescription: this.nullableString(dto.siteDescription),
        logoUrl: this.nullableString(dto.logoUrl),
        primaryColor: this.nullableString(dto.primaryColor),
        secondaryColor: this.nullableString(dto.secondaryColor),
        contactPhone: this.nullableString(dto.contactPhone),
        contactEmail: this.nullableEmail(dto.contactEmail),
        whatsappUrl: this.nullableString(dto.whatsappUrl),
        isPublished: dto.isPublished ?? false,
      },
      update: {
        publicSlug: dto.publicSlug
          ? this.slugOrDefault(dto.publicSlug, organization.slug)
          : undefined,
        subdomain: dto.subdomain
          ? this.slugOrDefault(dto.subdomain, organization.slug)
          : undefined,
        customDomain:
          dto.customDomain === undefined
            ? undefined
            : this.nullableDomain(dto.customDomain),
        siteTitle: this.optionalString(dto.siteTitle),
        siteDescription:
          dto.siteDescription === undefined
            ? undefined
            : this.nullableString(dto.siteDescription),
        logoUrl:
          dto.logoUrl === undefined ? undefined : this.nullableString(dto.logoUrl),
        primaryColor:
          dto.primaryColor === undefined
            ? undefined
            : this.nullableString(dto.primaryColor),
        secondaryColor:
          dto.secondaryColor === undefined
            ? undefined
            : this.nullableString(dto.secondaryColor),
        contactPhone:
          dto.contactPhone === undefined
            ? undefined
            : this.nullableString(dto.contactPhone),
        contactEmail:
          dto.contactEmail === undefined
            ? undefined
            : this.nullableEmail(dto.contactEmail),
        whatsappUrl:
          dto.whatsappUrl === undefined
            ? undefined
            : this.nullableString(dto.whatsappUrl),
        isPublished: dto.isPublished,
      },
    });

    await this.ensureSubdomainVerification(
      organizationId,
      updated.subdomain,
    );

    if (updated.customDomain) {
      await this.ensureCustomDomainVerification(
        organizationId,
        updated.customDomain,
      );
    }

    await this.auditLogs.record({
      action: 'organization_website_settings.updated',
      entityType: 'OrganizationWebsiteSettings',
      entityId: updated.id,
      organizationId,
      actor: currentUser,
      metadata: {
        isPublished: updated.isPublished,
        subdomain: updated.subdomain,
        customDomain: updated.customDomain,
      },
    });

    return updated;
  }

  private async ensureSubdomainVerification(
    organizationId: string,
    subdomain: string,
  ) {
    await this.prisma.organizationDomainVerification.upsert({
      where: {
        organizationId_domain: {
          organizationId,
          domain: `${subdomain}.popwam.com`,
        },
      },
      create: {
        organizationId,
        domain: `${subdomain}.popwam.com`,
        type: 'SUBDOMAIN',
        status: 'VERIFIED',
        verificationToken: this.verificationToken(),
        verifiedAt: new Date(),
      },
      update: {},
    });
  }

  private async ensureCustomDomainVerification(
    organizationId: string,
    domain: string,
  ) {
    await this.prisma.organizationDomainVerification.upsert({
      where: {
        organizationId_domain: {
          organizationId,
          domain,
        },
      },
      create: {
        organizationId,
        domain,
        type: 'CUSTOM_DOMAIN',
        status: 'PENDING',
        verificationToken: this.verificationToken(),
      },
      update: {},
    });
  }

  private defaultSettings(
    organizationId: string,
    slug: string,
    name: string,
  ) {
    return {
      id: null,
      organizationId,
      publicSlug: slug,
      subdomain: slug,
      customDomain: null,
      siteTitle: name,
      siteDescription: null,
      logoUrl: null,
      primaryColor: null,
      secondaryColor: null,
      contactPhone: null,
      contactEmail: null,
      whatsappUrl: null,
      isPublished: false,
      createdAt: null,
      updatedAt: null,
    };
  }

  private assertDto(dto: UpdateOrganizationWebsiteSettingsDto) {
    if (dto.contactEmail && !this.isValidEmail(dto.contactEmail)) {
      throw new BadRequestException('contactEmail is invalid.');
    }

    for (const [field, value] of Object.entries({
      publicSlug: dto.publicSlug,
      subdomain: dto.subdomain,
    })) {
      if (value !== undefined && !this.slugPattern(value)) {
        throw new BadRequestException(`${field} is invalid.`);
      }
    }

    if (
      dto.customDomain &&
      !dto.customDomain.trim().match(/^[a-z0-9.-]+\.[a-z]{2,}$/i)
    ) {
      throw new BadRequestException('customDomain is invalid.');
    }
  }

  private slugOrDefault(value: string | undefined, fallback: string) {
    return this.slugify(value ?? fallback);
  }

  private slugify(value: string) {
    const slug = value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    return slug || `site-${Date.now()}`;
  }

  private slugPattern(value: string) {
    return /^[a-z0-9][a-z0-9-]*[a-z0-9]$/i.test(value.trim());
  }

  private nullableDomain(value: string | null | undefined) {
    const domain = this.nullableString(value)?.toLowerCase();
    return domain ?? null;
  }

  private nullableEmail(value: string | null | undefined) {
    const email = this.nullableString(value)?.toLowerCase();
    if (email && !this.isValidEmail(email)) {
      throw new BadRequestException('contactEmail is invalid.');
    }

    return email ?? null;
  }

  private nullableString(value: string | null | undefined) {
    if (value === null) {
      return null;
    }

    return this.optionalString(value);
  }

  private optionalString(value: string | undefined | null) {
    const trimmed = value?.trim();
    return trimmed || undefined;
  }

  private isValidEmail(value: string | undefined | null) {
    return Boolean(value?.trim().match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/));
  }

  private verificationToken() {
    return `popwam-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

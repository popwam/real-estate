import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { OrganizationType, UserRole } from '@prisma/client';
import { isPlatformUser } from '../../common/organization-scope';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../database/prisma.service';
import { OrganizationVerificationsService } from '../organization-verifications/organization-verifications.service';
import { HashService } from '../auth/hash.service';
import { CreatePlatformOrganizationDto } from './dto/create-platform-organization.dto';
import { CreateOrganizationInvitationDto } from './dto/create-organization-invitation.dto';
import { PlatformReviewDto } from './dto/platform-review.dto';

@Injectable()
export class PlatformAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
    private readonly organizationVerifications: OrganizationVerificationsService,
    private readonly hashService: HashService,
  ) {}

  async createOrganization(
    dto: CreatePlatformOrganizationDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    this.assertPlatform(currentUser);
    if (!dto.name?.trim()) throw new BadRequestException('name is required.');
    if (!['DEVELOPER', 'BROKERAGE', 'INDIVIDUAL_BROKER'].includes(dto.type)) {
      throw new BadRequestException('type must be a company organization type.');
    }

    const slug = await this.createUniqueSlug(dto.slug ?? dto.name);
    const organization = await this.prisma.organization.create({
      data: {
        name: dto.name.trim(),
        slug,
        type: dto.type as OrganizationType,
        status: 'DRAFT',
        country: this.optionalString(dto.country),
        city: this.optionalString(dto.city),
        profile: {
          create: {
            legalName: this.optionalString(dto.legalName),
            tradeName: this.optionalString(dto.tradeName),
          },
        },
      },
      include: { profile: true },
    });

    await this.auditLogs.record({
      action: 'organization.platform_created',
      entityType: 'Organization',
      entityId: organization.id,
      organizationId: organization.id,
      actor: currentUser,
      metadata: { type: organization.type, status: organization.status },
    });
    return organization;
  }

  async listInvitations(
    organizationId: string,
    currentUser: AuthenticatedRequestUser,
  ) {
    this.assertPlatform(currentUser);
    await this.findOrganization(organizationId);
    await this.expireInvitations(organizationId);
    const invitations = await this.prisma.organizationInvitation.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
    return invitations.map((item) => this.toInvitationResponse(item));
  }

  async createInvitation(
    organizationId: string,
    dto: CreateOrganizationInvitationDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    this.assertPlatform(currentUser);
    const organization = await this.findOrganization(organizationId);
    const email = dto.email?.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('email is invalid.');
    }
    const intendedRole = dto.intendedRole as UserRole;
    if (!Object.values(UserRole).includes(intendedRole)) {
      throw new BadRequestException('intendedRole is invalid.');
    }
    this.assertRoleMatchesOrganization(intendedRole, organization.type);
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (
      existingUser &&
      (existingUser.passwordHash || existingUser.organizationId !== organizationId)
    ) {
      throw new ConflictException('Email is already registered.');
    }

    const hours = dto.expiresInHours ?? 72;
    if (!Number.isInteger(hours) || hours < 1 || hours > 24 * 30) {
      throw new BadRequestException('expiresInHours must be between 1 and 720.');
    }
    await this.prisma.organizationInvitation.updateMany({
      where: { organizationId, email, status: 'PENDING' },
      data: { status: 'REVOKED' },
    });

    const token = randomBytes(32).toString('base64url');
    const invitation = await this.prisma.organizationInvitation.create({
      data: {
        organizationId,
        email,
        intendedRole,
        tokenHash: this.hashService.fingerprint(token),
        expiresAt: new Date(Date.now() + hours * 60 * 60 * 1000),
        createdByUserId: currentUser.userId,
      },
    });
    await this.auditLogs.record({
      action: 'organization.invitation_created',
      entityType: 'OrganizationInvitation',
      entityId: invitation.id,
      organizationId,
      actor: currentUser,
      metadata: { intendedRole, expiresAt: invitation.expiresAt },
    });

    return {
      ...this.toInvitationResponse(invitation),
      delivery: 'MANUAL_LINK',
      inviteUrl: `${this.adminWebBaseUrl()}/invite/${token}`,
    };
  }

  async verificationQueue(currentUser: AuthenticatedRequestUser) {
    this.assertPlatform(currentUser);

    return this.organizationVerifications.findPending(currentUser);
  }

  async organizationReview(
    organizationId: string,
    currentUser: AuthenticatedRequestUser,
  ) {
    this.assertPlatform(currentUser);

    return this.organizationVerifications.findOrganizationReview(
      organizationId,
      currentUser,
    );
  }

  async approveOrganization(
    organizationId: string,
    dto: PlatformReviewDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    this.assertPlatform(currentUser);

    const organization = await this.findOrganization(organizationId);
    const updated = await this.prisma.organization.update({
      where: { id: organizationId },
      data: { status: 'APPROVED' },
      include: { profile: true },
    });

    await this.prisma.organizationVerification.updateMany({
      where: {
        organizationId,
        status: { in: ['PENDING_REVIEW', 'UNDER_REVIEW'] },
      },
      data: {
        status: 'APPROVED',
        verifiedById: currentUser.userId,
        verifiedAt: new Date(),
        notes: dto.notes?.trim() || undefined,
        rejectionReason: null,
      },
    });

    await this.auditLogs.record({
      action: 'organization.verification_approved',
      entityType: 'Organization',
      entityId: organizationId,
      organizationId,
      actor: currentUser,
      metadata: {
        before: { status: organization.status },
        after: { status: updated.status },
        notes: dto.notes?.trim() || undefined,
      },
    });

    return updated;
  }

  async rejectOrganization(
    organizationId: string,
    dto: PlatformReviewDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    this.assertPlatform(currentUser);
    this.assertReason(dto, 'Rejection reason is required.');

    const organization = await this.findOrganization(organizationId);
    const updated = await this.prisma.organization.update({
      where: { id: organizationId },
      data: { status: 'DRAFT' },
      include: { profile: true },
    });

    await this.prisma.organizationVerification.updateMany({
      where: {
        organizationId,
        status: { in: ['PENDING_REVIEW', 'UNDER_REVIEW'] },
      },
      data: {
        status: 'REJECTED',
        verifiedById: currentUser.userId,
        verifiedAt: new Date(),
        rejectionReason: dto.reason!.trim(),
        notes: dto.notes?.trim() || undefined,
      },
    });

    await this.auditLogs.record({
      action: 'organization.verification_rejected',
      entityType: 'Organization',
      entityId: organizationId,
      organizationId,
      actor: currentUser,
      metadata: {
        before: { status: organization.status },
        after: { status: updated.status },
        reason: dto.reason!.trim(),
      },
    });

    return updated;
  }

  async suspendOrganization(
    organizationId: string,
    dto: PlatformReviewDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    this.assertPlatform(currentUser);
    this.assertReason(dto, 'Suspension reason is required.');

    const organization = await this.findOrganization(organizationId);
    const updated = await this.prisma.organization.update({
      where: { id: organizationId },
      data: { status: 'SUSPENDED' },
      include: { profile: true },
    });

    await this.auditLogs.record({
      action: 'organization.suspended',
      entityType: 'Organization',
      entityId: organizationId,
      organizationId,
      actor: currentUser,
      metadata: {
        before: { status: organization.status },
        after: { status: updated.status },
        reason: dto.reason!.trim(),
      },
    });

    return updated;
  }

  async reactivateOrganization(
    organizationId: string,
    dto: PlatformReviewDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    this.assertPlatform(currentUser);

    const organization = await this.findOrganization(organizationId);
    const updated = await this.prisma.organization.update({
      where: { id: organizationId },
      data: { status: 'APPROVED' },
      include: { profile: true },
    });

    await this.auditLogs.record({
      action: 'organization.reactivated',
      entityType: 'Organization',
      entityId: organizationId,
      organizationId,
      actor: currentUser,
      metadata: {
        before: { status: organization.status },
        after: { status: updated.status },
        reason: dto.reason?.trim() || undefined,
      },
    });

    return updated;
  }

  private async findOrganization(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found.');
    }

    return organization;
  }

  private assertPlatform(currentUser: AuthenticatedRequestUser) {
    if (
      isPlatformUser(currentUser) &&
      currentUser.permissions.includes('organizations.verify')
    ) {
      return;
    }

    throw new ForbiddenException('Platform admin permission is required.');
  }

  private assertReason(dto: PlatformReviewDto, message: string) {
    if (!dto.reason?.trim()) {
      throw new BadRequestException(message);
    }
  }

  private assertRoleMatchesOrganization(role: UserRole, type: OrganizationType) {
    const allowed: Record<OrganizationType, UserRole[]> = {
      PLATFORM: [],
      DEVELOPER: [
        UserRole.DEVELOPER_OWNER,
        UserRole.DEVELOPER_ADMIN,
        UserRole.DEVELOPER_SALES_MANAGER,
        UserRole.DEVELOPER_SALES_AGENT,
      ],
      BROKERAGE: [
        UserRole.BROKERAGE_OWNER,
        UserRole.BROKERAGE_ADMIN,
        UserRole.BROKER,
      ],
      INDIVIDUAL_BROKER: [UserRole.INDIVIDUAL_BROKER],
    };
    if (!allowed[type].includes(role)) {
      throw new BadRequestException('intendedRole is not valid for this organization.');
    }
  }

  private expireInvitations(organizationId: string) {
    return this.prisma.organizationInvitation.updateMany({
      where: { organizationId, status: 'PENDING', expiresAt: { lte: new Date() } },
      data: { status: 'EXPIRED' },
    });
  }

  private toInvitationResponse(invitation: any) {
    return {
      id: invitation.id,
      organizationId: invitation.organizationId,
      email: invitation.email,
      intendedRole: invitation.intendedRole,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      acceptedAt: invitation.acceptedAt,
      createdAt: invitation.createdAt,
    };
  }

  private async createUniqueSlug(value: string) {
    const base = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `organization-${Date.now()}`;
    let slug = base;
    let suffix = 1;
    while (await this.prisma.organization.findUnique({ where: { slug } })) {
      suffix += 1;
      slug = `${base}-${suffix}`;
    }
    return slug;
  }

  private optionalString(value?: string) {
    return value?.trim() || undefined;
  }

  private adminWebBaseUrl() {
    return (
      process.env.ADMIN_WEB_URL ??
      process.env.ADMIN_WEB_BASE_URL ??
      'http://localhost:3203'
    ).replace(/\/$/, '');
  }
}

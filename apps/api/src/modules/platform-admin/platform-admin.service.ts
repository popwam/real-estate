import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isPlatformUser } from '../../common/organization-scope';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../database/prisma.service';
import { OrganizationVerificationsService } from '../organization-verifications/organization-verifications.service';
import { PlatformReviewDto } from './dto/platform-review.dto';

@Injectable()
export class PlatformAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
    private readonly organizationVerifications: OrganizationVerificationsService,
  ) {}

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
}

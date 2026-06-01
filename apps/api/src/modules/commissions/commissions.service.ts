import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CommissionStatus } from '@prisma/client';
import { isPlatformUser } from '../../common/organization-scope';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../database/prisma.service';
import { RejectCommissionDto } from './dto/reject-commission.dto';

@Injectable()
export class CommissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async findMany(currentUser: AuthenticatedRequestUser) {
    if (isPlatformUser(currentUser)) {
      return this.prisma.commissionEntry.findMany({
        include: this.commissionInclude(),
        orderBy: { createdAt: 'desc' },
      });
    }

    if (currentUser.organizationType === 'DEVELOPER' && currentUser.organizationId) {
      this.assertHasAnyPermission(currentUser, [
        'commissions.view',
        'commissions.view_own',
      ]);
      return this.prisma.commissionEntry.findMany({
        where: { developerId: currentUser.organizationId },
        include: this.commissionInclude(),
        orderBy: { createdAt: 'desc' },
      });
    }

    if (currentUser.organizationType === 'BROKERAGE' && currentUser.organizationId) {
      this.assertHasAnyPermission(currentUser, [
        'commissions.view',
        'commissions.view_own',
      ]);
      return this.prisma.commissionEntry.findMany({
        where: {
          OR: [
            { brokerUserId: currentUser.userId },
            { brokerageId: currentUser.organizationId },
            { recipientOrganizationId: currentUser.organizationId },
            { recipientUserId: currentUser.userId },
          ],
        },
        include: this.commissionInclude(),
        orderBy: { createdAt: 'desc' },
      });
    }

    if (currentUser.organizationType === 'INDIVIDUAL_BROKER') {
      this.assertHasAnyPermission(currentUser, ['commissions.view_own']);
      return this.prisma.commissionEntry.findMany({
        where: {
          OR: [
            { brokerUserId: currentUser.userId },
            { recipientUserId: currentUser.userId },
          ],
        },
        include: this.commissionInclude(),
        orderBy: { createdAt: 'desc' },
      });
    }

    throw new ForbiddenException('Cannot list commissions.');
  }

  async findOne(id: string, currentUser: AuthenticatedRequestUser) {
    const commission = await this.prisma.commissionEntry.findUnique({
      where: { id },
      include: this.commissionInclude(),
    });

    if (!commission) {
      throw new NotFoundException('Commission entry not found.');
    }

    this.assertCanReadCommission(commission, currentUser);

    return commission;
  }

  async approve(id: string, currentUser: AuthenticatedRequestUser) {
    const commission = await this.findOne(id, currentUser);
    this.assertCanApproveCommission(commission.developerId, currentUser);

    if (commission.status !== CommissionStatus.PENDING) {
      throw new BadRequestException('Only pending commissions can be approved.');
    }

    const updated = await this.prisma.commissionEntry.update({
      where: { id },
      data: {
        status: CommissionStatus.APPROVED,
        approvedAt: new Date(),
      },
      include: this.commissionInclude(),
    });

    await this.auditLogs.record({
      action: 'commission.approved',
      entityType: 'CommissionEntry',
      entityId: updated.id,
      actor: currentUser,
      organizationId: updated.developerId,
      metadata: { dealId: updated.dealId, amount: updated.amount.toString() },
    });

    return updated;
  }

  async reject(
    id: string,
    dto: RejectCommissionDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    const commission = await this.findOne(id, currentUser);
    this.assertCanApproveCommission(commission.developerId, currentUser);

    if (!dto.reason?.trim()) {
      throw new BadRequestException('reason is required.');
    }

    if (commission.status !== CommissionStatus.PENDING) {
      throw new BadRequestException('Only pending commissions can be rejected.');
    }

    const updated = await this.prisma.commissionEntry.update({
      where: { id },
      data: {
        status: CommissionStatus.REJECTED,
        rejectedAt: new Date(),
        rejectionReason: dto.reason.trim(),
      },
      include: this.commissionInclude(),
    });

    await this.auditLogs.record({
      action: 'commission.rejected',
      entityType: 'CommissionEntry',
      entityId: updated.id,
      actor: currentUser,
      organizationId: updated.developerId,
      metadata: { dealId: updated.dealId, reason: updated.rejectionReason },
    });

    return updated;
  }

  private assertCanReadCommission(
    commission: any,
    currentUser: AuthenticatedRequestUser,
  ) {
    if (isPlatformUser(currentUser)) {
      return;
    }

    this.assertHasAnyPermission(currentUser, [
      'commissions.view',
      'commissions.view_own',
    ]);

    if (
      currentUser.organizationType === 'DEVELOPER' &&
      currentUser.organizationId === commission.developerId
    ) {
      return;
    }

    if (
      currentUser.organizationType === 'BROKERAGE' &&
      currentUser.organizationId &&
      (commission.brokerageId === currentUser.organizationId ||
        commission.recipientOrganizationId === currentUser.organizationId ||
        commission.brokerUserId === currentUser.userId ||
        commission.recipientUserId === currentUser.userId)
    ) {
      return;
    }

    if (
      currentUser.organizationType === 'INDIVIDUAL_BROKER' &&
      (commission.brokerUserId === currentUser.userId ||
        commission.recipientUserId === currentUser.userId)
    ) {
      return;
    }

    throw new ForbiddenException('Cannot access this commission entry.');
  }

  private assertCanApproveCommission(
    developerId: string,
    currentUser: AuthenticatedRequestUser,
  ) {
    if (isPlatformUser(currentUser)) {
      return;
    }

    if (
      currentUser.organizationType !== 'DEVELOPER' ||
      currentUser.organizationId !== developerId
    ) {
      throw new ForbiddenException(
        'Cannot approve another developer organization commission.',
      );
    }

    if (!currentUser.permissions?.includes('commissions.approve')) {
      throw new ForbiddenException('Missing commissions.approve permission.');
    }
  }

  private assertHasAnyPermission(
    currentUser: AuthenticatedRequestUser,
    permissions: string[],
  ) {
    if (isPlatformUser(currentUser)) {
      return;
    }

    if (!permissions.some((permission) => currentUser.permissions?.includes(permission))) {
      throw new ForbiddenException('Missing commission view permission.');
    }
  }

  private commissionInclude() {
    return {
      deal: true,
      commissionRule: true,
      project: true,
      unit: true,
      developer: true,
      brokerage: true,
      broker: true,
      recipientOrganization: true,
      recipientUser: true,
    };
  }
}

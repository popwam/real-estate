import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CommissionPartyType,
  CommissionStatus,
  DealRoomStatus,
  DealStatus,
  Prisma,
  UnitStatus,
} from '@prisma/client';
import { isPlatformUser } from '../../common/organization-scope';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../database/prisma.service';
import { CancelDealDto } from './dto/cancel-deal.dto';
import { CreateDealFromRoomDto } from './dto/create-deal-from-room.dto';

@Injectable()
export class DealsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async createFromDealRoom(
    dealRoomId: string,
    dto: CreateDealFromRoomDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    this.assertCanMarkSold(currentUser);

    const dealRoom = await this.prisma.dealRoom.findUnique({
      where: { id: dealRoomId },
      include: this.dealRoomForFinalizationInclude(),
    });

    if (!dealRoom) {
      throw new NotFoundException('Deal room not found.');
    }

    this.assertCanManageDeveloper(dealRoom.developerId, currentUser);

    const existingDeal = await this.prisma.deal.findUnique({
      where: { dealRoomId: dealRoom.id },
    });

    if (existingDeal) {
      throw new ConflictException('A deal already exists for this deal room.');
    }

    if (
      dealRoom.status !== DealRoomStatus.APPROVED &&
      dealRoom.status !== DealRoomStatus.PENDING_APPROVAL
    ) {
      throw new BadRequestException(
        'Deal room must be APPROVED or PENDING_APPROVAL before finalization.',
      );
    }

    const finalPrice =
      dto.finalPrice === undefined
        ? dealRoom.unit.basePrice
        : new Prisma.Decimal(dto.finalPrice);

    if (finalPrice && finalPrice.lessThan(0)) {
      throw new BadRequestException('finalPrice must be a non-negative number.');
    }

    const currency = this.optionalString(dto.currency) ?? dealRoom.unit.currency;

    const result = await this.prisma.$transaction(async (tx: any) => {
      const deal = await tx.deal.create({
        data: {
          dealRoomId: dealRoom.id,
          projectId: dealRoom.projectId,
          unitId: dealRoom.unitId,
          developerId: dealRoom.developerId,
          brokerageId: dealRoom.brokerageId,
          brokerUserId: dealRoom.brokerUserId,
          leadId: dealRoom.leadId,
          leadClaimId: dealRoom.leadClaimId,
          clientId: dealRoom.clientId,
          status: DealStatus.SOLD,
          finalPrice,
          currency,
          createdByUserId: currentUser.userId,
          approvedById: currentUser.userId,
          approvedAt: new Date(),
          soldAt: new Date(),
        },
      });

      await tx.dealRoom.update({
        where: { id: dealRoom.id },
        data: { status: DealRoomStatus.SOLD },
      });

      await tx.inventoryUnit.update({
        where: { id: dealRoom.unitId },
        data: { status: UnitStatus.SOLD },
      });

      await tx.unitAvailability.updateMany({
        where: {
          unitId: dealRoom.unitId,
          releasedAt: null,
        },
        data: { releasedAt: new Date() },
      });

      const commissionEntries = await this.createCommissionEntries(
        tx,
        deal,
        dealRoom,
        finalPrice,
        currency,
      );

      return {
        deal: await tx.deal.findUniqueOrThrow({
          where: { id: deal.id },
          include: this.dealInclude(),
        }),
        commissionEntries,
      };
    });

    await this.auditLogs.record({
      action: 'deal.created',
      entityType: 'Deal',
      entityId: result.deal.id,
      actor: currentUser,
      organizationId: result.deal.developerId,
      metadata: { dealRoomId: result.deal.dealRoomId },
    });

    await this.auditLogs.record({
      action: 'deal.marked_sold',
      entityType: 'Deal',
      entityId: result.deal.id,
      actor: currentUser,
      organizationId: result.deal.developerId,
      metadata: { unitId: result.deal.unitId, finalPrice: finalPrice?.toString() },
    });

    await this.auditLogs.record({
      action: 'inventory.marked_sold',
      entityType: 'InventoryUnit',
      entityId: result.deal.unitId,
      actor: currentUser,
      organizationId: result.deal.developerId,
      metadata: { dealId: result.deal.id },
    });

    for (const commission of result.commissionEntries) {
      await this.auditLogs.record({
        action: 'commission.created',
        entityType: 'CommissionEntry',
        entityId: commission.id,
        actor: currentUser,
        organizationId: result.deal.developerId,
        metadata: {
          dealId: result.deal.id,
          amount: commission.amount.toString(),
          partyType: commission.partyType,
        },
      });
    }

    return result.deal;
  }

  async findMany(currentUser: AuthenticatedRequestUser) {
    if (isPlatformUser(currentUser)) {
      return this.prisma.deal.findMany({
        include: this.dealInclude(),
        orderBy: { createdAt: 'desc' },
      });
    }

    if (currentUser.organizationType === 'DEVELOPER' && currentUser.organizationId) {
      return this.prisma.deal.findMany({
        where: { developerId: currentUser.organizationId },
        include: this.dealInclude(),
        orderBy: { createdAt: 'desc' },
      });
    }

    if (currentUser.organizationType === 'BROKERAGE' && currentUser.organizationId) {
      return this.prisma.deal.findMany({
        where: {
          OR: [
            { brokerUserId: currentUser.userId },
            { brokerageId: currentUser.organizationId },
          ],
        },
        include: this.dealInclude(),
        orderBy: { createdAt: 'desc' },
      });
    }

    if (currentUser.organizationType === 'INDIVIDUAL_BROKER') {
      return this.prisma.deal.findMany({
        where: { brokerUserId: currentUser.userId },
        include: this.dealInclude(),
        orderBy: { createdAt: 'desc' },
      });
    }

    throw new ForbiddenException('Cannot list deals.');
  }

  async findOne(id: string, currentUser: AuthenticatedRequestUser) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      include: this.dealInclude(),
    });

    if (!deal) {
      throw new NotFoundException('Deal not found.');
    }

    this.assertCanReadDeal(deal, currentUser);

    return deal;
  }

  async approve(id: string, currentUser: AuthenticatedRequestUser) {
    const existing = await this.findOne(id, currentUser);
    this.assertCanApproveDeal(existing.developerId, currentUser);

    if (existing.status !== DealStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Only pending approval deals can be approved.');
    }

    const deal = await this.prisma.deal.update({
      where: { id },
      data: {
        status: DealStatus.APPROVED,
        approvedById: currentUser.userId,
        approvedAt: new Date(),
      },
      include: this.dealInclude(),
    });

    await this.auditLogs.record({
      action: 'deal.approved',
      entityType: 'Deal',
      entityId: deal.id,
      actor: currentUser,
      organizationId: deal.developerId,
      metadata: { dealRoomId: deal.dealRoomId },
    });

    return deal;
  }

  async cancel(
    id: string,
    dto: CancelDealDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    const existing = await this.findOne(id, currentUser);
    this.assertCanApproveDeal(existing.developerId, currentUser);

    if (existing.status === DealStatus.SOLD) {
      throw new BadRequestException('Sold deals cannot be cancelled in Slice 6.');
    }

    const deal = await this.prisma.deal.update({
      where: { id },
      data: {
        status: DealStatus.CANCELLED,
        cancelledById: currentUser.userId,
        cancelledAt: new Date(),
        cancellationReason: this.optionalString(dto.reason),
      },
      include: this.dealInclude(),
    });

    await this.auditLogs.record({
      action: 'deal.cancelled',
      entityType: 'Deal',
      entityId: deal.id,
      actor: currentUser,
      organizationId: deal.developerId,
      metadata: { reason: deal.cancellationReason },
    });

    return deal;
  }

  private async createCommissionEntries(
    tx: any,
    deal: any,
    dealRoom: any,
    finalPrice: Prisma.Decimal | null,
    currency: string,
  ) {
    const rules = await tx.commissionRule.findMany({
      where: {
        projectId: dealRoom.projectId,
        developerId: dealRoom.developerId,
        isActive: true,
        OR: [
          { targetOrganizationId: null, targetUserId: null },
          { targetOrganizationId: dealRoom.brokerageId },
          { targetUserId: dealRoom.brokerUserId },
        ],
      },
    });

    const entries: any[] = [];

    for (const rule of rules) {
      const amount = this.calculateCommissionAmount(rule, finalPrice);

      if (amount.lessThanOrEqualTo(0)) {
        continue;
      }

      const recipient = this.resolveRecipient(rule, dealRoom);

      entries.push(
        await tx.commissionEntry.create({
          data: {
            dealId: deal.id,
            commissionRuleId: rule.id,
            projectId: dealRoom.projectId,
            unitId: dealRoom.unitId,
            developerId: dealRoom.developerId,
            brokerageId: dealRoom.brokerageId,
            brokerUserId: dealRoom.brokerUserId,
            partyType: rule.partyType,
            recipientOrganizationId: recipient.organizationId,
            recipientUserId: recipient.userId,
            commissionType: rule.commissionType,
            amount,
            currency: rule.currency || currency,
            status: CommissionStatus.PENDING,
          },
        }),
      );
    }

    return entries;
  }

  private calculateCommissionAmount(rule: any, finalPrice: Prisma.Decimal | null) {
    const value = new Prisma.Decimal(rule.value);

    if (rule.commissionType === 'PERCENTAGE') {
      if (!finalPrice) {
        return new Prisma.Decimal(0);
      }

      return finalPrice.mul(value).div(100).toDecimalPlaces(2);
    }

    return value.toDecimalPlaces(2);
  }

  private resolveRecipient(rule: any, dealRoom: any) {
    if (rule.targetOrganizationId || rule.targetUserId) {
      return {
        organizationId: rule.targetOrganizationId,
        userId: rule.targetUserId,
      };
    }

    if (rule.partyType === CommissionPartyType.BROKER) {
      return { organizationId: null, userId: dealRoom.brokerUserId };
    }

    if (rule.partyType === CommissionPartyType.BROKERAGE) {
      return { organizationId: dealRoom.brokerageId, userId: null };
    }

    if (rule.partyType === CommissionPartyType.DEVELOPER) {
      return { organizationId: dealRoom.developerId, userId: null };
    }

    return { organizationId: null, userId: null };
  }

  private assertCanReadDeal(deal: any, currentUser: AuthenticatedRequestUser) {
    if (isPlatformUser(currentUser)) {
      return;
    }

    if (
      currentUser.organizationType === 'DEVELOPER' &&
      currentUser.organizationId === deal.developerId
    ) {
      return;
    }

    if (deal.brokerUserId === currentUser.userId) {
      return;
    }

    if (
      currentUser.organizationType === 'BROKERAGE' &&
      currentUser.organizationId &&
      deal.brokerageId === currentUser.organizationId
    ) {
      return;
    }

    throw new ForbiddenException('Cannot access this deal.');
  }

  private assertCanMarkSold(currentUser: AuthenticatedRequestUser) {
    if (isPlatformUser(currentUser)) {
      return;
    }

    if (!currentUser.permissions?.includes('deals.mark_sold')) {
      throw new ForbiddenException('Missing deals.mark_sold permission.');
    }
  }

  private assertCanApproveDeal(
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
        'Cannot approve another developer organization deal.',
      );
    }

    if (!currentUser.permissions?.includes('deals.approve')) {
      throw new ForbiddenException('Missing deals.approve permission.');
    }
  }

  private assertCanManageDeveloper(
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
        'Cannot finalize another developer organization deal.',
      );
    }
  }

  private dealRoomForFinalizationInclude() {
    return {
      unit: true,
      project: true,
      reservationRequest: true,
    };
  }

  private dealInclude() {
    return {
      dealRoom: true,
      project: true,
      unit: true,
      developer: true,
      brokerage: true,
      broker: true,
      lead: true,
      leadClaim: true,
      client: true,
      commissionEntries: true,
    };
  }

  private optionalString(value: string | undefined | null) {
    const trimmed = value?.trim();
    return trimmed || undefined;
  }
}

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AvailabilityHoldType,
  LeadClaimStatus,
  ReservationRequestStatus,
  UnitStatus,
} from '@prisma/client';
import { isPlatformUser } from '../../common/organization-scope';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../database/prisma.service';
import { LeadClaimsService } from '../lead-claims/lead-claims.service';
import { MarketplaceAccessService } from '../marketplace/marketplace-access.service';
import { CreateReservationRequestDto } from './dto/create-reservation-request.dto';
import { RejectReservationRequestDto } from './dto/reject-reservation-request.dto';

@Injectable()
export class ReservationRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly marketplaceAccess: MarketplaceAccessService,
    private readonly leadClaimsService: LeadClaimsService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async create(
    dto: CreateReservationRequestDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    this.assertCanCreateReservation(currentUser);

    if (!dto.leadClaimId?.trim()) {
      throw new BadRequestException('leadClaimId is required.');
    }

    const claim = await this.prisma.leadClaim.findUnique({
      where: { id: dto.leadClaimId },
      include: {
        lead: true,
        project: true,
        unit: true,
      },
    });

    if (!claim) {
      throw new NotFoundException('Lead claim not found.');
    }

    this.leadClaimsService.assertCanReadClaim(claim, currentUser);

    if (claim.brokerUserId !== currentUser.userId) {
      throw new ForbiddenException('Only the claiming broker can create a reservation request.');
    }

    if (
      claim.status !== LeadClaimStatus.ACTIVE ||
      claim.expiresAt.getTime() <= Date.now()
    ) {
      throw new BadRequestException('Lead claim is not active.');
    }

    const unitId = dto.unitId ?? claim.unitId;
    if (!unitId) {
      throw new BadRequestException('unitId is required.');
    }

    const unit = await this.prisma.inventoryUnit.findUnique({
      where: { id: unitId },
      include: { project: true },
    });

    if (!unit || unit.projectId !== claim.projectId) {
      throw new BadRequestException('unitId does not belong to the claimed project.');
    }

    if (
      !(await this.marketplaceAccess.canViewUnitForMarketplace(
        currentUser,
        unit,
      ))
    ) {
      throw new ForbiddenException('Unit is not visible to this broker.');
    }

    const request = await this.prisma.reservationRequest.create({
      data: {
        leadId: claim.leadId,
        leadClaimId: claim.id,
        projectId: claim.projectId,
        unitId: unit.id,
        developerId: unit.developerId,
        brokerUserId: currentUser.userId,
        brokerageId: currentUser.organizationId,
        notes: dto.notes?.trim(),
      },
      include: this.requestInclude(),
    });

    await this.auditLogs.record({
      action: 'reservation_request.created',
      entityType: 'ReservationRequest',
      entityId: request.id,
      actor: currentUser,
      organizationId: request.developerId,
      metadata: {
        projectId: request.projectId,
        unitId: request.unitId,
        leadClaimId: request.leadClaimId,
      },
    });

    return request;
  }

  async findMany(currentUser: AuthenticatedRequestUser) {
    if (isPlatformUser(currentUser)) {
      return this.prisma.reservationRequest.findMany({
        include: this.requestInclude(),
        orderBy: { createdAt: 'desc' },
      });
    }

    if (currentUser.organizationType === 'DEVELOPER' && currentUser.organizationId) {
      return this.prisma.reservationRequest.findMany({
        where: { developerId: currentUser.organizationId },
        include: this.requestInclude(),
        orderBy: { createdAt: 'desc' },
      });
    }

    this.assertBrokerParticipant(currentUser);

    return this.prisma.reservationRequest.findMany({
      where:
        currentUser.organizationType === 'BROKERAGE' && currentUser.organizationId
          ? {
              OR: [
                { brokerUserId: currentUser.userId },
                { brokerageId: currentUser.organizationId },
              ],
            }
          : { brokerUserId: currentUser.userId },
      include: this.requestInclude(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, currentUser: AuthenticatedRequestUser) {
    const request = await this.prisma.reservationRequest.findUnique({
      where: { id },
      include: this.requestInclude(),
    });

    if (!request) {
      throw new NotFoundException('Reservation request not found.');
    }

    this.assertCanReadRequest(request, currentUser);

    return request;
  }

  async approve(id: string, currentUser: AuthenticatedRequestUser) {
    const existing = await this.findOne(id, currentUser);
    this.assertCanManageDeveloperRequest(existing.developerId, currentUser);

    if (existing.status !== ReservationRequestStatus.PENDING) {
      throw new BadRequestException('Only pending reservation requests can be approved.');
    }

    if (existing.unit.status !== UnitStatus.AVAILABLE) {
      throw new BadRequestException('Unit is not available for reservation.');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const request = await tx.reservationRequest.update({
        where: { id },
        data: {
          status: ReservationRequestStatus.APPROVED,
          approvedAt: new Date(),
        },
        include: this.requestInclude(),
      });

      await tx.inventoryUnit.update({
        where: { id: request.unitId },
        data: { status: UnitStatus.HELD },
      });

      const existingHold = await tx.unitAvailability.findFirst({
        where: {
          reservationRequestId: request.id,
          heldType: AvailabilityHoldType.RESERVATION,
          releasedAt: null,
        },
      });

      const availability = existingHold
        ? await tx.unitAvailability.update({
            where: { id: existingHold.id },
            data: {
              unitId: request.unitId,
              heldById: request.brokerUserId,
              heldAt: new Date(),
            },
          })
        : await tx.unitAvailability.create({
            data: {
              unitId: request.unitId,
              heldById: request.brokerUserId,
              reservationRequestId: request.id,
              heldType: AvailabilityHoldType.RESERVATION,
              heldAt: new Date(),
            },
          });

      const updatedRequest = await tx.reservationRequest.findUniqueOrThrow({
        where: { id: request.id },
        include: this.requestInclude(),
      });

      return { request: updatedRequest, availability };
    });

    await this.auditLogs.record({
      action: 'reservation_request.approved',
      entityType: 'ReservationRequest',
      entityId: result.request.id,
      actor: currentUser,
      organizationId: result.request.developerId,
      metadata: {
        projectId: result.request.projectId,
        unitId: result.request.unitId,
      },
    });

    await this.auditLogs.record({
      action: 'unit.held_for_reservation',
      entityType: 'InventoryUnit',
      entityId: result.request.unitId,
      actor: currentUser,
      organizationId: result.request.developerId,
      metadata: {
        reservationRequestId: result.request.id,
        availabilityId: result.availability.id,
      },
    });

    return result.request;
  }

  async reject(
    id: string,
    dto: RejectReservationRequestDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    const existing = await this.findOne(id, currentUser);
    this.assertCanManageDeveloperRequest(existing.developerId, currentUser);

    if (!dto.reason?.trim()) {
      throw new BadRequestException('reason is required.');
    }

    if (existing.status !== ReservationRequestStatus.PENDING) {
      throw new BadRequestException('Only pending reservation requests can be rejected.');
    }

    const request = await this.prisma.reservationRequest.update({
      where: { id },
      data: {
        status: ReservationRequestStatus.REJECTED,
        rejectedAt: new Date(),
        rejectionReason: dto.reason.trim(),
      },
      include: this.requestInclude(),
    });

    await this.auditLogs.record({
      action: 'reservation_request.rejected',
      entityType: 'ReservationRequest',
      entityId: request.id,
      actor: currentUser,
      organizationId: request.developerId,
      metadata: { reason: request.rejectionReason },
    });

    return request;
  }

  async cancel(id: string, currentUser: AuthenticatedRequestUser) {
    const existing = await this.findOne(id, currentUser);

    if (
      !isPlatformUser(currentUser) &&
      existing.brokerUserId !== currentUser.userId
    ) {
      throw new ForbiddenException('Only the requesting broker can cancel this request.');
    }

    if (existing.status !== ReservationRequestStatus.PENDING) {
      throw new BadRequestException('Only pending reservation requests can be cancelled.');
    }

    const request = await this.prisma.reservationRequest.update({
      where: { id },
      data: {
        status: ReservationRequestStatus.CANCELLED,
        cancelledAt: new Date(),
      },
      include: this.requestInclude(),
    });

    await this.auditLogs.record({
      action: 'reservation_request.cancelled',
      entityType: 'ReservationRequest',
      entityId: request.id,
      actor: currentUser,
      organizationId: request.developerId,
    });

    return request;
  }

  private assertCanCreateReservation(currentUser: AuthenticatedRequestUser) {
    this.assertBrokerParticipant(currentUser);

    if (!currentUser.permissions?.includes('deal_requests.create')) {
      throw new ForbiddenException('Missing deal_requests.create permission.');
    }
  }

  private assertBrokerParticipant(currentUser: AuthenticatedRequestUser) {
    if (
      !['BROKERAGE', 'INDIVIDUAL_BROKER'].includes(
        currentUser.organizationType ?? '',
      )
    ) {
      throw new ForbiddenException('Only broker users can access reservation requests.');
    }
  }

  private assertCanReadRequest(
    request: any,
    currentUser: AuthenticatedRequestUser,
  ) {
    if (isPlatformUser(currentUser)) {
      return;
    }

    if (request.brokerUserId === currentUser.userId) {
      return;
    }

    if (
      currentUser.organizationType === 'BROKERAGE' &&
      currentUser.organizationId &&
      request.brokerageId === currentUser.organizationId
    ) {
      return;
    }

    if (
      currentUser.organizationType === 'DEVELOPER' &&
      currentUser.organizationId === request.developerId
    ) {
      return;
    }

    throw new ForbiddenException('Cannot access this reservation request.');
  }

  private assertCanManageDeveloperRequest(
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
      throw new ForbiddenException('Cannot manage another developer reservation request.');
    }

    if (!currentUser.permissions?.includes('reservation_requests.approve')) {
      throw new ForbiddenException('Missing reservation_requests.approve permission.');
    }
  }

  private requestInclude() {
    return {
      lead: true,
      leadClaim: true,
      project: true,
      unit: {
        include: {
          availabilityRecords: true,
        },
      },
      broker: true,
      availabilityRecords: true,
    };
  }
}

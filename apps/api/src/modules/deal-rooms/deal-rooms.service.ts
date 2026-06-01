import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DealRoomMessageType,
  DealRoomParticipantRole,
  DealRoomParticipantStatus,
  DealRoomStatus,
  ReservationRequestStatus,
} from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { isPlatformUser } from '../../common/organization-scope';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../database/prisma.service';
import { AddDealRoomParticipantDto } from './dto/add-deal-room-participant.dto';
import { CreateDealRoomMessageDto } from './dto/create-deal-room-message.dto';
import { UpdateDealRoomStatusDto } from './dto/update-deal-room-status.dto';

@Injectable()
export class DealRoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async createFromReservation(
    reservationRequestId: string,
    currentUser: AuthenticatedRequestUser,
  ) {
    this.assertCanCreateDealRoom(currentUser);

    const reservation = await this.prisma.reservationRequest.findUnique({
      where: { id: reservationRequestId },
      include: {
        lead: true,
        leadClaim: true,
        project: true,
        unit: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation request not found.');
    }

    if (reservation.status !== ReservationRequestStatus.APPROVED) {
      throw new BadRequestException(
        'Deal room can be created only from an approved reservation request.',
      );
    }

    this.assertCanManageReservationDealRoom(reservation.developerId, currentUser);

    const existing = await this.prisma.dealRoom.findUnique({
      where: { reservationRequestId: reservation.id },
      include: this.dealRoomInclude(),
    });

    if (existing) {
      throw new ConflictException(
        'A deal room already exists for this reservation request.',
      );
    }

    const dealRoom = await this.prisma.$transaction(async (tx) => {
      const room = await tx.dealRoom.create({
        data: {
          reservationRequestId: reservation.id,
          leadClaimId: reservation.leadClaimId,
          leadId: reservation.leadId,
          clientId: reservation.lead.clientId,
          projectId: reservation.projectId,
          unitId: reservation.unitId,
          developerId: reservation.developerId,
          brokerageId: reservation.brokerageId,
          brokerUserId: reservation.brokerUserId,
          createdByUserId: currentUser.userId,
        },
      });

      await tx.dealRoomParticipant.create({
        data: {
          dealRoomId: room.id,
          userId: reservation.brokerUserId,
          organizationId: reservation.brokerageId,
          role: DealRoomParticipantRole.BROKER,
          status: DealRoomParticipantStatus.ACTIVE,
          joinedAt: new Date(),
        },
      });

      if (
        currentUser.organizationType === 'DEVELOPER' &&
        currentUser.organizationId === reservation.developerId
      ) {
        await tx.dealRoomParticipant.create({
          data: {
            dealRoomId: room.id,
            userId: currentUser.userId,
            organizationId: currentUser.organizationId,
            role: this.developerParticipantRole(currentUser),
            status: DealRoomParticipantStatus.ACTIVE,
            joinedAt: new Date(),
          },
        });
      }

      await tx.dealRoomMessage.create({
        data: {
          dealRoomId: room.id,
          messageType: DealRoomMessageType.SYSTEM,
          body: 'Deal room opened from approved reservation request.',
          metadata: {
            reservationRequestId: reservation.id,
            projectId: reservation.projectId,
            unitId: reservation.unitId,
          },
        },
      });

      return tx.dealRoom.findUniqueOrThrow({
        where: { id: room.id },
        include: this.dealRoomInclude(),
      });
    });

    await this.auditLogs.record({
      action: 'deal_room.created',
      entityType: 'DealRoom',
      entityId: dealRoom.id,
      actor: currentUser,
      organizationId: dealRoom.developerId,
      metadata: {
        reservationRequestId: dealRoom.reservationRequestId,
        projectId: dealRoom.projectId,
        unitId: dealRoom.unitId,
      },
    });

    return dealRoom;
  }

  async findMany(currentUser: AuthenticatedRequestUser) {
    if (isPlatformUser(currentUser)) {
      return this.prisma.dealRoom.findMany({
        include: this.dealRoomInclude(),
        orderBy: { createdAt: 'desc' },
      });
    }

    if (currentUser.organizationType === 'DEVELOPER' && currentUser.organizationId) {
      return this.prisma.dealRoom.findMany({
        where: { developerId: currentUser.organizationId },
        include: this.dealRoomInclude(),
        orderBy: { createdAt: 'desc' },
      });
    }

    if (currentUser.organizationType === 'BROKERAGE' && currentUser.organizationId) {
      return this.prisma.dealRoom.findMany({
        where: {
          OR: [
            { brokerUserId: currentUser.userId },
            { brokerageId: currentUser.organizationId },
            { participants: { some: { userId: currentUser.userId } } },
          ],
        },
        include: this.dealRoomInclude(),
        orderBy: { createdAt: 'desc' },
      });
    }

    if (currentUser.organizationType === 'INDIVIDUAL_BROKER') {
      return this.prisma.dealRoom.findMany({
        where: {
          OR: [
            { brokerUserId: currentUser.userId },
            { participants: { some: { userId: currentUser.userId } } },
          ],
        },
        include: this.dealRoomInclude(),
        orderBy: { createdAt: 'desc' },
      });
    }

    throw new ForbiddenException('Cannot list deal rooms.');
  }

  async findOne(id: string, currentUser: AuthenticatedRequestUser) {
    const dealRoom = await this.prisma.dealRoom.findUnique({
      where: { id },
      include: this.dealRoomInclude(),
    });

    if (!dealRoom) {
      throw new NotFoundException('Deal room not found.');
    }

    await this.assertCanReadDealRoom(dealRoom, currentUser);

    return dealRoom;
  }

  async addParticipant(
    id: string,
    dto: AddDealRoomParticipantDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    const dealRoom = await this.findOne(id, currentUser);
    this.assertCanManageDealRoom(dealRoom, currentUser);

    if (!Object.values(DealRoomParticipantRole).includes(dto.role as any)) {
      throw new BadRequestException('role is invalid.');
    }

    const status =
      (dto.status as DealRoomParticipantStatus | undefined) ??
      DealRoomParticipantStatus.ACTIVE;

    if (!Object.values(DealRoomParticipantStatus).includes(status)) {
      throw new BadRequestException('status is invalid.');
    }

    if (!dto.userId && !dto.clientId && !dto.organizationId) {
      throw new BadRequestException(
        'At least one of userId, clientId, or organizationId is required.',
      );
    }

    const participant = await this.prisma.dealRoomParticipant.create({
      data: {
        dealRoomId: dealRoom.id,
        userId: this.optionalString(dto.userId),
        clientId: this.optionalString(dto.clientId),
        organizationId: this.optionalString(dto.organizationId),
        role: dto.role as DealRoomParticipantRole,
        status,
        invitedAt:
          status === DealRoomParticipantStatus.INVITED ? new Date() : undefined,
        joinedAt:
          status === DealRoomParticipantStatus.ACTIVE ? new Date() : undefined,
      },
      include: this.participantInclude(),
    });

    await this.auditLogs.record({
      action: 'deal_room.participant_added',
      entityType: 'DealRoomParticipant',
      entityId: participant.id,
      actor: currentUser,
      organizationId: dealRoom.developerId,
      metadata: { dealRoomId: dealRoom.id, role: participant.role },
    });

    return participant;
  }

  async inviteClient(id: string, currentUser: AuthenticatedRequestUser) {
    const dealRoom = await this.findOne(id, currentUser);
    this.assertCanManageDealRoom(dealRoom, currentUser, true);

    const existing = await this.prisma.dealRoomParticipant.findFirst({
      where: {
        dealRoomId: dealRoom.id,
        clientId: dealRoom.clientId,
        role: DealRoomParticipantRole.CLIENT,
        status: { not: DealRoomParticipantStatus.REMOVED },
      },
    });

    const token = randomBytes(24).toString('hex');
    const participant = existing
      ? await this.prisma.dealRoomParticipant.update({
          where: { id: existing.id },
          data: {
            status: DealRoomParticipantStatus.INVITED,
            invitedAt: new Date(),
          },
          include: this.participantInclude(),
        })
      : await this.prisma.dealRoomParticipant.create({
          data: {
            dealRoomId: dealRoom.id,
            clientId: dealRoom.clientId,
            role: DealRoomParticipantRole.CLIENT,
            status: DealRoomParticipantStatus.INVITED,
            invitedAt: new Date(),
          },
          include: this.participantInclude(),
        });

    await this.prisma.dealRoom.update({
      where: { id: dealRoom.id },
      data: {
        clientInviteToken: token,
        clientInvitedAt: new Date(),
      },
    });

    await this.auditLogs.record({
      action: 'deal_room.client_invited',
      entityType: 'DealRoomParticipant',
      entityId: participant.id,
      actor: currentUser,
      organizationId: dealRoom.developerId,
      metadata: { dealRoomId: dealRoom.id },
    });

    return {
      participant,
      invite: {
        token,
        delivery: 'placeholder',
      },
    };
  }

  async updateStatus(
    id: string,
    dto: UpdateDealRoomStatusDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    const dealRoom = await this.findOne(id, currentUser);

    if (!Object.values(DealRoomStatus).includes(dto.status as DealRoomStatus)) {
      throw new BadRequestException('status is invalid.');
    }

    const nextStatus = dto.status as DealRoomStatus;

    if (nextStatus === DealRoomStatus.SOLD) {
      throw new BadRequestException('SOLD transition is reserved for a later slice.');
    }

    if (nextStatus === DealRoomStatus.APPROVED) {
      this.assertHasPermission(currentUser, 'deals.approve');
    }

    const updated = await this.prisma.dealRoom.update({
      where: { id: dealRoom.id },
      data: { status: nextStatus },
      include: this.dealRoomInclude(),
    });

    await this.prisma.dealRoomMessage.create({
      data: {
        dealRoomId: dealRoom.id,
        senderUserId: currentUser.userId,
        messageType: DealRoomMessageType.STATUS_UPDATE,
        body: `Deal room status changed from ${dealRoom.status} to ${updated.status}.`,
        metadata: {
          previousStatus: dealRoom.status,
          status: updated.status,
        },
      },
    });

    await this.auditLogs.record({
      action: 'deal_room.status_changed',
      entityType: 'DealRoom',
      entityId: updated.id,
      actor: currentUser,
      organizationId: updated.developerId,
      metadata: {
        previousStatus: dealRoom.status,
        status: updated.status,
      },
    });

    return updated;
  }

  async createMessage(
    id: string,
    dto: CreateDealRoomMessageDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    const dealRoom = await this.findOne(id, currentUser);

    if (!dto.body?.trim()) {
      throw new BadRequestException('body is required.');
    }

    const messageType =
      (dto.messageType as DealRoomMessageType | undefined) ??
      DealRoomMessageType.TEXT;

    if (!Object.values(DealRoomMessageType).includes(messageType)) {
      throw new BadRequestException('messageType is invalid.');
    }

    const message = await this.prisma.dealRoomMessage.create({
      data: {
        dealRoomId: dealRoom.id,
        senderUserId: currentUser.userId,
        messageType,
        body: dto.body.trim(),
        metadata: dto.metadata as any,
      },
      include: this.messageInclude(),
    });

    await this.auditLogs.record({
      action: 'deal_room.message_created',
      entityType: 'DealRoomMessage',
      entityId: message.id,
      actor: currentUser,
      organizationId: dealRoom.developerId,
      metadata: { dealRoomId: dealRoom.id, messageType: message.messageType },
    });

    return message;
  }

  async findMessages(id: string, currentUser: AuthenticatedRequestUser) {
    const dealRoom = await this.findOne(id, currentUser);

    return this.prisma.dealRoomMessage.findMany({
      where: { dealRoomId: dealRoom.id },
      include: this.messageInclude(),
      orderBy: { createdAt: 'asc' },
    });
  }

  private assertCanCreateDealRoom(currentUser: AuthenticatedRequestUser) {
    if (isPlatformUser(currentUser)) {
      return;
    }

    if (
      currentUser.organizationType !== 'DEVELOPER' ||
      !currentUser.organizationId
    ) {
      throw new ForbiddenException(
        'Only developer users can create deal rooms from reservations.',
      );
    }

    this.assertHasPermission(currentUser, 'deal_rooms.create');
  }

  private assertCanManageReservationDealRoom(
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
        'Cannot create a deal room for another developer organization.',
      );
    }
  }

  private async assertCanReadDealRoom(
    dealRoom: any,
    currentUser: AuthenticatedRequestUser,
  ) {
    if (isPlatformUser(currentUser)) {
      return;
    }

    if (
      currentUser.organizationType === 'DEVELOPER' &&
      currentUser.organizationId === dealRoom.developerId
    ) {
      return;
    }

    if (dealRoom.brokerUserId === currentUser.userId) {
      return;
    }

    if (
      currentUser.organizationType === 'BROKERAGE' &&
      currentUser.organizationId &&
      dealRoom.brokerageId === currentUser.organizationId
    ) {
      return;
    }

    const participant = await this.prisma.dealRoomParticipant.findFirst({
      where: {
        dealRoomId: dealRoom.id,
        userId: currentUser.userId,
        status: { in: [DealRoomParticipantStatus.ACTIVE, DealRoomParticipantStatus.INVITED] },
      },
    });

    if (participant) {
      return;
    }

    throw new ForbiddenException('Cannot access this deal room.');
  }

  private assertCanManageDealRoom(
    dealRoom: any,
    currentUser: AuthenticatedRequestUser,
    allowBroker = false,
  ) {
    if (isPlatformUser(currentUser)) {
      return;
    }

    if (
      currentUser.organizationType === 'DEVELOPER' &&
      currentUser.organizationId === dealRoom.developerId
    ) {
      return;
    }

    if (allowBroker && dealRoom.brokerUserId === currentUser.userId) {
      return;
    }

    throw new ForbiddenException('Cannot manage this deal room.');
  }

  private assertHasPermission(
    currentUser: AuthenticatedRequestUser,
    permission: string,
  ) {
    if (isPlatformUser(currentUser)) {
      return;
    }

    if (!currentUser.permissions?.includes(permission)) {
      throw new ForbiddenException(`Missing ${permission} permission.`);
    }
  }

  private developerParticipantRole(currentUser: AuthenticatedRequestUser) {
    if (currentUser.role === 'developer_sales_manager') {
      return DealRoomParticipantRole.SALES_MANAGER;
    }

    return DealRoomParticipantRole.DEVELOPER_SALES;
  }

  private dealRoomInclude() {
    return {
      reservationRequest: true,
      leadClaim: true,
      lead: true,
      client: true,
      project: true,
      unit: true,
      developer: true,
      brokerage: true,
      broker: true,
      createdBy: true,
      participants: {
        include: this.participantInclude(),
        orderBy: { createdAt: 'asc' as const },
      },
      _count: { select: { messages: true } },
    };
  }

  private participantInclude() {
    return {
      user: true,
      client: true,
      organization: true,
    };
  }

  private messageInclude() {
    return {
      senderUser: true,
      senderClient: true,
    };
  }

  private optionalString(value: string | undefined) {
    const trimmed = value?.trim();
    return trimmed || undefined;
  }
}

import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/current-user.decorator';
import { Permissions } from '../../common/permissions.decorator';
import { PermissionsGuard } from '../../common/permissions.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { AddDealRoomParticipantDto } from './dto/add-deal-room-participant.dto';
import { CreateDealRoomMessageDto } from './dto/create-deal-room-message.dto';
import { UpdateDealRoomStatusDto } from './dto/update-deal-room-status.dto';
import { DealRoomsService } from './deal-rooms.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('deal-rooms')
export class DealRoomsController {
  constructor(private readonly dealRoomsService: DealRoomsService) {}

  @Permissions('deal_rooms.join')
  @Get()
  findMany(@CurrentUser() currentUser: AuthenticatedRequestUser) {
    return this.dealRoomsService.findMany(currentUser);
  }

  @Permissions('deal_rooms.join')
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.dealRoomsService.findOne(id, currentUser);
  }

  @Permissions('deal_rooms.create')
  @Post('from-reservation/:reservationRequestId')
  createFromReservation(
    @Param('reservationRequestId') reservationRequestId: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.dealRoomsService.createFromReservation(
      reservationRequestId,
      currentUser,
    );
  }

  @Permissions('deal_rooms.create')
  @Post(':id/participants')
  addParticipant(
    @Param('id') id: string,
    @Body() dto: AddDealRoomParticipantDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.dealRoomsService.addParticipant(id, dto, currentUser);
  }

  @Permissions('deal_rooms.join')
  @Post(':id/invite-client')
  inviteClient(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.dealRoomsService.inviteClient(id, currentUser);
  }

  @Permissions('deal_rooms.join')
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateDealRoomStatusDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.dealRoomsService.updateStatus(id, dto, currentUser);
  }

  @Permissions('deal_rooms.join')
  @Post(':id/messages')
  createMessage(
    @Param('id') id: string,
    @Body() dto: CreateDealRoomMessageDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.dealRoomsService.createMessage(id, dto, currentUser);
  }

  @Permissions('deal_rooms.join')
  @Get(':id/messages')
  findMessages(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.dealRoomsService.findMessages(id, currentUser);
  }
}

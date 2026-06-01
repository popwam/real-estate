import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/current-user.decorator';
import { Permissions } from '../../common/permissions.decorator';
import { PermissionsGuard } from '../../common/permissions.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { CreateReservationRequestDto } from './dto/create-reservation-request.dto';
import { RejectReservationRequestDto } from './dto/reject-reservation-request.dto';
import { ReservationRequestsService } from './reservation-requests.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('reservation-requests')
export class ReservationRequestsController {
  constructor(
    private readonly reservationRequestsService: ReservationRequestsService,
  ) {}

  @Permissions('deal_requests.create')
  @Post()
  create(
    @Body() dto: CreateReservationRequestDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.reservationRequestsService.create(dto, currentUser);
  }

  @Get()
  findMany(@CurrentUser() currentUser: AuthenticatedRequestUser) {
    return this.reservationRequestsService.findMany(currentUser);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.reservationRequestsService.findOne(id, currentUser);
  }

  @Permissions('reservation_requests.approve')
  @Patch(':id/approve')
  approve(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.reservationRequestsService.approve(id, currentUser);
  }

  @Permissions('reservation_requests.approve')
  @Patch(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() dto: RejectReservationRequestDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.reservationRequestsService.reject(id, dto, currentUser);
  }

  @Patch(':id/cancel')
  cancel(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.reservationRequestsService.cancel(id, currentUser);
  }
}

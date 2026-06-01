import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/current-user.decorator';
import { Permissions } from '../../common/permissions.decorator';
import { PermissionsGuard } from '../../common/permissions.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { CancelDealDto } from './dto/cancel-deal.dto';
import { CreateDealFromRoomDto } from './dto/create-deal-from-room.dto';
import { DealsService } from './deals.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Get()
  findMany(@CurrentUser() currentUser: AuthenticatedRequestUser) {
    return this.dealsService.findMany(currentUser);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.dealsService.findOne(id, currentUser);
  }

  @Permissions('deals.mark_sold')
  @Post('from-deal-room/:dealRoomId')
  createFromDealRoom(
    @Param('dealRoomId') dealRoomId: string,
    @Body() dto: CreateDealFromRoomDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.dealsService.createFromDealRoom(dealRoomId, dto, currentUser);
  }

  @Permissions('deals.approve')
  @Patch(':id/approve')
  approve(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.dealsService.approve(id, currentUser);
  }

  @Patch(':id/cancel')
  cancel(
    @Param('id') id: string,
    @Body() dto: CancelDealDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.dealsService.cancel(id, dto, currentUser);
  }
}

import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/current-user.decorator';
import { Permissions } from '../../common/permissions.decorator';
import { PermissionsGuard } from '../../common/permissions.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { CommissionsService } from './commissions.service';
import { RejectCommissionDto } from './dto/reject-commission.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('commissions')
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  @Get()
  findMany(@CurrentUser() currentUser: AuthenticatedRequestUser) {
    return this.commissionsService.findMany(currentUser);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.commissionsService.findOne(id, currentUser);
  }

  @Permissions('commissions.approve')
  @Patch(':id/approve')
  approve(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.commissionsService.approve(id, currentUser);
  }

  @Permissions('commissions.approve')
  @Patch(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() dto: RejectCommissionDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.commissionsService.reject(id, dto, currentUser);
  }
}

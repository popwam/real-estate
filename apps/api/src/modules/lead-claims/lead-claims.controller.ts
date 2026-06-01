import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/current-user.decorator';
import { Permissions } from '../../common/permissions.decorator';
import { PermissionsGuard } from '../../common/permissions.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { CreateLeadClaimDto } from './dto/create-lead-claim.dto';
import { ResolveLeadClaimConflictDto } from './dto/resolve-lead-claim-conflict.dto';
import { LeadClaimsService } from './lead-claims.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('lead-claims')
export class LeadClaimsController {
  constructor(private readonly leadClaimsService: LeadClaimsService) {}

  @Permissions('lead_claims.create')
  @Post()
  create(
    @Body() dto: CreateLeadClaimDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.leadClaimsService.create(dto, currentUser);
  }

  @Permissions('lead_claims.view_own')
  @Get('my')
  findMy(@CurrentUser() currentUser: AuthenticatedRequestUser) {
    return this.leadClaimsService.findMy(currentUser);
  }

  @Get('conflicts')
  findConflicts(@CurrentUser() currentUser: AuthenticatedRequestUser) {
    return this.leadClaimsService.findConflicts(currentUser);
  }

  @Patch('conflicts/:id/resolve')
  resolveConflict(
    @Param('id') id: string,
    @Body() dto: ResolveLeadClaimConflictDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.leadClaimsService.resolveConflict(id, dto, currentUser);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.leadClaimsService.findOne(id, currentUser);
  }

  @Patch(':id/release')
  release(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.leadClaimsService.release(id, currentUser);
  }
}

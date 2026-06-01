import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/current-user.decorator';
import { Permissions } from '../../common/permissions.decorator';
import { PermissionsGuard } from '../../common/permissions.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { CommissionRulesService } from './commission-rules.service';
import { CreateCommissionRuleDto } from './dto/create-commission-rule.dto';
import { UpdateCommissionRuleDto } from './dto/update-commission-rule.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('commission-rules')
export class CommissionRulesController {
  constructor(private readonly commissionRulesService: CommissionRulesService) {}

  @Permissions('commission_rules.manage')
  @Post()
  create(
    @Body() dto: CreateCommissionRuleDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.commissionRulesService.create(dto, currentUser);
  }

  @Permissions('commission_rules.manage')
  @Get()
  findMany(@CurrentUser() currentUser: AuthenticatedRequestUser) {
    return this.commissionRulesService.findMany(currentUser);
  }

  @Permissions('commission_rules.manage')
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.commissionRulesService.findOne(id, currentUser);
  }

  @Permissions('commission_rules.manage')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCommissionRuleDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.commissionRulesService.update(id, dto, currentUser);
  }
}

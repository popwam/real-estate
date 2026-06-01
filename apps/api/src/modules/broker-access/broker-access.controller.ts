import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/current-user.decorator';
import { Permissions } from '../../common/permissions.decorator';
import { PermissionsGuard } from '../../common/permissions.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { BrokerAccessService } from './broker-access.service';
import { CreateBrokerAccessRuleDto } from './dto/create-broker-access-rule.dto';
import { UpdateBrokerAccessRuleDto } from './dto/update-broker-access-rule.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('broker-access-rules')
export class BrokerAccessController {
  constructor(private readonly brokerAccessService: BrokerAccessService) {}

  @Permissions('broker_access.grant')
  @Post()
  create(
    @Body() dto: CreateBrokerAccessRuleDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.brokerAccessService.create(dto, currentUser);
  }

  @Get()
  findMany(@CurrentUser() currentUser: AuthenticatedRequestUser) {
    return this.brokerAccessService.findMany(currentUser);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.brokerAccessService.findOne(id, currentUser);
  }

  @Permissions('broker_access.grant')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBrokerAccessRuleDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.brokerAccessService.update(id, dto, currentUser);
  }

  @Permissions('broker_access.grant')
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.brokerAccessService.remove(id, currentUser);
  }
}

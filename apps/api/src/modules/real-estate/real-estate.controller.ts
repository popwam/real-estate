import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/current-user.decorator';
import { Permissions } from '../../common/permissions.decorator';
import { PermissionsGuard } from '../../common/permissions.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { RealEstateService } from './real-estate.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Customers')
@ApiBearerAuth()
@Controller('customers')
export class CustomersController {
  constructor(private readonly service: RealEstateService) {}

  @Permissions('customers.view')
  @Get()
  list(@CurrentUser() user: AuthenticatedRequestUser, @Query('organizationId') organizationId?: string) {
    return this.service.listCustomers(user, organizationId);
  }

  @Permissions('customers.manage')
  @Post()
  create(@CurrentUser() user: AuthenticatedRequestUser, @Body() body: any) {
    return this.service.createCustomer(user, body);
  }

  @Permissions('customers.view')
  @Get(':id')
  get(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string) {
    return this.service.getCustomer(user, id);
  }

  @Permissions('customers.manage')
  @Patch(':id')
  update(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string, @Body() body: any) {
    return this.service.updateCustomer(user, id, body);
  }
}

@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Real Estate')
@ApiBearerAuth()
@Controller('real-estate')
export class RealEstateController {
  constructor(private readonly service: RealEstateService) {}

  @Permissions('real_estate.projects.view')
  @Get('projects')
  listProjects(@CurrentUser() user: AuthenticatedRequestUser, @Query('organizationId') organizationId?: string) {
    return this.service.listProjects(user, organizationId);
  }

  @Permissions('real_estate.projects.manage')
  @Post('projects')
  createProject(@CurrentUser() user: AuthenticatedRequestUser, @Body() body: any) {
    return this.service.createProject(user, body);
  }

  @Permissions('real_estate.projects.view')
  @Get('projects/:id')
  getProject(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string) {
    return this.service.getProject(user, id);
  }

  @Permissions('real_estate.projects.manage')
  @Patch('projects/:id')
  updateProject(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string, @Body() body: any) {
    return this.service.updateProject(user, id, body);
  }

  @Permissions('real_estate.buildings.view')
  @Get('buildings')
  listBuildings(@CurrentUser() user: AuthenticatedRequestUser, @Query('organizationId') organizationId?: string) {
    return this.service.listBuildings(user, organizationId);
  }

  @Permissions('real_estate.buildings.manage')
  @Post('buildings')
  createBuilding(@CurrentUser() user: AuthenticatedRequestUser, @Body() body: any) {
    return this.service.createBuilding(user, body);
  }

  @Permissions('real_estate.buildings.view')
  @Get('buildings/:id')
  getBuilding(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string) {
    return this.service.getBuilding(user, id);
  }

  @Permissions('real_estate.buildings.manage')
  @Patch('buildings/:id')
  updateBuilding(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string, @Body() body: any) {
    return this.service.updateBuilding(user, id, body);
  }

  @Permissions('real_estate.units.view')
  @Get('units')
  listUnits(@CurrentUser() user: AuthenticatedRequestUser, @Query('organizationId') organizationId?: string) {
    return this.service.listUnits(user, organizationId);
  }

  @Permissions('real_estate.units.manage')
  @Post('units')
  createUnit(@CurrentUser() user: AuthenticatedRequestUser, @Body() body: any) {
    return this.service.createUnit(user, body);
  }

  @Permissions('real_estate.units.view')
  @Get('units/:id')
  getUnit(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string) {
    return this.service.getUnit(user, id);
  }

  @Permissions('real_estate.units.manage')
  @Patch('units/:id')
  updateUnit(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string, @Body() body: any) {
    return this.service.updateUnit(user, id, body);
  }

  @Permissions('real_estate.unit_assignments.view')
  @Get('units/:id/assignments')
  listAssignments(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string) {
    return this.service.listAssignments(user, id);
  }

  @Permissions('real_estate.unit_assignments.manage')
  @Post('units/:id/assignments')
  createAssignment(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string, @Body() body: any) {
    return this.service.createAssignment(user, id, body);
  }

  @Permissions('real_estate.unit_assignments.manage')
  @Patch('unit-assignments/:id')
  updateAssignment(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string, @Body() body: any) {
    return this.service.updateAssignment(user, id, body);
  }

  @Permissions('real_estate.unit_assignments.manage')
  @Delete('unit-assignments/:id')
  deleteAssignment(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string) {
    return this.service.deleteAssignment(user, id);
  }

  @Permissions('qr_passes.manage')
  @Post('units/:id/qr-passes')
  createQrPass(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string, @Body() body: any) {
    return this.service.createQrPass(user, id, body);
  }

  @Permissions('qr_passes.manage')
  @Post('qr-passes/:id/regenerate')
  regenerateQrPass(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string) {
    return this.service.regenerateQrPass(user, id);
  }

  @Permissions('qr_passes.manage')
  @Post('qr-passes/:id/revoke')
  revokeQrPass(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string) {
    return this.service.revokeQrPass(user, id);
  }

  @Permissions('qr_passes.manage')
  @Post('qr-passes/:id/suspend')
  suspendQrPass(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string) {
    return this.service.suspendQrPass(user, id);
  }
}

@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('My Real Estate')
@ApiBearerAuth()
@Controller('me')
export class MyRealEstateController {
  constructor(private readonly service: RealEstateService) {}

  @Permissions('self.units.view')
  @Get('units')
  listMyUnits(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.listMyUnits(user);
  }

  @Permissions('self.units.view')
  @Get('units/:id')
  getMyUnit(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string) {
    return this.service.getMyUnit(user, id);
  }

  @Permissions('self.qr_passes.view')
  @Get('qr-passes')
  listMyQrPasses(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.listMyQrPasses(user);
  }
}

@ApiTags('QR')
@Controller('qr')
export class QrPassController {
  constructor(private readonly service: RealEstateService) {}

  @Get('pass/:token')
  scan(@Param('token') token: string) {
    return this.service.scanQrPass(token);
  }
}

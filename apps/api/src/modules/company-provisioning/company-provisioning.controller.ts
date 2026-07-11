import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/current-user.decorator';
import { Permissions } from '../../common/permissions.decorator';
import { PermissionsGuard } from '../../common/permissions.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { CompanyProvisioningService } from './company-provisioning.service';
import {
  AttendanceLocationInputDto,
  CreatePlatformCompanyDto,
  DomainInputDto,
  LimitsInputDto,
  OfficeInputDto,
  OrganizationProfileInputDto,
  SubscriptionInputDto,
  WifiRuleInputDto,
} from './dto/company-provisioning.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Platform Organizations')
@ApiBearerAuth()
@Controller('platform/organizations')
export class PlatformOrganizationsController {
  constructor(private readonly service: CompanyProvisioningService) {}

  @Permissions('platform.organizations.view')
  @Get()
  @ApiOperation({ summary: 'List platform-managed companies.' })
  list(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.listPlatformOrganizations(user);
  }

  @Permissions('platform.organizations.manage')
  @Post()
  @ApiOperation({ summary: 'Create and provision a company in one platform flow.' })
  create(@Body() dto: CreatePlatformCompanyDto, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.createPlatformOrganization(dto, user);
  }

  @Permissions('platform.organizations.view')
  @Get(':id')
  @ApiOperation({ summary: 'Get platform company provisioning detail.' })
  get(@Param('id') id: string, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.getPlatformOrganization(id, user);
  }

  @Permissions('platform.organizations.manage')
  @Patch(':id')
  @ApiOperation({ summary: 'Update platform-owned company profile fields.' })
  update(
    @Param('id') id: string,
    @Body() dto: OrganizationProfileInputDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.service.updatePlatformOrganization(id, dto, user);
  }

  @Permissions('platform.organizations.view')
  @Get(':id/subscription')
  getSubscription(@Param('id') id: string, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.getSubscription(id, user);
  }

  @Permissions('platform.subscriptions.manage')
  @Patch(':id/subscription')
  updateSubscription(
    @Param('id') id: string,
    @Body() dto: SubscriptionInputDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.service.updateSubscription(id, dto, user);
  }

  @Permissions('platform.organizations.view')
  @Get(':id/limits')
  getLimits(@Param('id') id: string, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.getLimits(id, user);
  }

  @Permissions('platform.organizations.manage')
  @Patch(':id/limits')
  updateLimits(
    @Param('id') id: string,
    @Body() dto: LimitsInputDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.service.updateLimits(id, dto, user);
  }
}

@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Organization Provisioning Settings')
@ApiBearerAuth()
@Controller()
export class OrganizationProvisioningController {
  constructor(private readonly service: CompanyProvisioningService) {}

  @Get('organizations/:id/offices')
  listOffices(@Param('id') id: string, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.listOffices(id, user);
  }

  @Post('organizations/:id/offices')
  createOffice(
    @Param('id') id: string,
    @Body() dto: OfficeInputDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.service.createOffice(id, dto, user);
  }

  @Patch('organizations/:id/offices/:officeId')
  updateOffice(
    @Param('id') id: string,
    @Param('officeId') officeId: string,
    @Body() dto: OfficeInputDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.service.updateOffice(id, officeId, dto, user);
  }

  @Get('organizations/:id/attendance-locations')
  listAttendanceLocations(@Param('id') id: string, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.listAttendanceLocations(id, user);
  }

  @Post('organizations/:id/attendance-locations')
  createAttendanceLocation(
    @Param('id') id: string,
    @Body() dto: AttendanceLocationInputDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.service.createAttendanceLocation(id, dto, user);
  }

  @Patch('organizations/:id/attendance-locations/:locationId')
  updateAttendanceLocation(
    @Param('id') id: string,
    @Param('locationId') locationId: string,
    @Body() dto: AttendanceLocationInputDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.service.updateAttendanceLocation(id, locationId, dto, user);
  }

  @Get('organizations/:id/wifi-rules')
  listWifiRules(@Param('id') id: string, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.listWifiRules(id, user);
  }

  @Post('organizations/:id/wifi-rules')
  createWifiRule(
    @Param('id') id: string,
    @Body() dto: WifiRuleInputDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.service.createWifiRule(id, dto, user);
  }

  @Patch('organizations/:id/wifi-rules/:ruleId')
  updateWifiRule(
    @Param('id') id: string,
    @Param('ruleId') ruleId: string,
    @Body() dto: WifiRuleInputDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.service.updateWifiRule(id, ruleId, dto, user);
  }

  @Get('organizations/:id/domains')
  listDomains(@Param('id') id: string, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.listDomains(id, user);
  }

  @Post('organizations/:id/domains')
  createDomain(
    @Param('id') id: string,
    @Body() dto: DomainInputDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.service.createDomain(id, dto, user);
  }

  @Patch('organizations/:id/domains/:domainId')
  updateDomain(
    @Param('id') id: string,
    @Param('domainId') domainId: string,
    @Body() dto: DomainInputDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.service.updateDomain(id, domainId, dto, user);
  }

  @Post('organizations/:id/domains/:domainId/test')
  testDomain(
    @Param('id') id: string,
    @Param('domainId') domainId: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.service.testDomain(id, domainId, user);
  }

  @Post('organizations/:id/domains/:domainId/verify')
  verifyDomain(
    @Param('id') id: string,
    @Param('domainId') domainId: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.service.verifyDomain(id, domainId, user);
  }

  @Post('organizations/:id/domains/:domainId/set-default')
  setDefaultDomain(
    @Param('id') id: string,
    @Param('domainId') domainId: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.service.setDefaultDomain(id, domainId, user);
  }

  @Get('company/settings')
  getCompanySettings(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.getCompanySettings(user);
  }

  @Patch('company/settings')
  updateCompanySettings(
    @Body() dto: OrganizationProfileInputDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.service.updateCompanySettings(dto, user);
  }

  @Get('company/offices')
  listCompanyOffices(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.listOffices(user.organizationId!, user);
  }

  @Post('company/offices')
  createCompanyOffice(@Body() dto: OfficeInputDto, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.createOffice(user.organizationId!, dto, user);
  }

  @Get('company/domains')
  listCompanyDomains(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.listDomains(user.organizationId!, user);
  }

  @Post('company/domains')
  createCompanyDomain(@Body() dto: DomainInputDto, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.createDomain(user.organizationId!, dto, user);
  }

  @Get('company/wifi-rules')
  listCompanyWifiRules(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.listWifiRules(user.organizationId!, user);
  }

  @Post('company/wifi-rules')
  createCompanyWifiRule(@Body() dto: WifiRuleInputDto, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.createWifiRule(user.organizationId!, dto, user);
  }
}

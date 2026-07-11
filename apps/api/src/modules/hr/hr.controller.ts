import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/current-user.decorator';
import { Permissions } from '../../common/permissions.decorator';
import { PermissionsGuard } from '../../common/permissions.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { HrService } from './hr.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Human Resources')
@ApiBearerAuth()
@Controller('hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Permissions('hr.view')
  @Get('summary')
  @ApiOperation({ summary: 'Get scoped HR dashboard summary.' })
  summary(@Query('organizationId') organizationId: string | undefined, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.hrService.summary(user, organizationId);
  }

  @Permissions('hr.employees.view')
  @Get('employees')
  listEmployees(@Query() query: Record<string, string | undefined>, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.hrService.listEmployees(user, query);
  }

  @Permissions('hr.employees.create')
  @Post('employees')
  createEmployee(@Body() body: Record<string, unknown>, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.hrService.createEmployee(user, body);
  }

  @Permissions('hr.employees.view')
  @Get('employees/:id')
  getEmployee(@Param('id') id: string, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.hrService.getEmployee(user, id);
  }

  @Permissions('hr.employees.update')
  @Patch('employees/:id')
  updateEmployee(@Param('id') id: string, @Body() body: Record<string, unknown>, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.hrService.updateEmployee(user, id, body);
  }

  @Permissions('hr.employees.reset_password')
  @Post('employees/:id/reset-password')
  resetPassword(@Param('id') id: string, @Body() body: Record<string, unknown>, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.hrService.resetPassword(user, id, body);
  }

  @Permissions('hr.employees.deactivate')
  @Post('employees/:id/activate')
  activateEmployee(@Param('id') id: string, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.hrService.setEmployeeActive(user, id, true);
  }

  @Permissions('hr.employees.deactivate')
  @Post('employees/:id/deactivate')
  deactivateEmployee(@Param('id') id: string, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.hrService.setEmployeeActive(user, id, false);
  }

  @Permissions('hr.employees.update')
  @Patch('employees/:id/role')
  updateEmployeeRole(@Param('id') id: string, @Body() body: Record<string, unknown>, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.hrService.updateEmployeeRole(user, id, String(body.role ?? 'employee_self_service'));
  }

  @Permissions('hr.employees.permissions.manage')
  @Patch('employees/:id/permissions')
  updateEmployeePermissions(@Param('id') id: string, @Body() body: Record<string, unknown>, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.hrService.updateEmployeePermissions(user, id, Array.isArray(body.permissions) ? body.permissions.map(String) : []);
  }

  @Permissions('hr.employees.delete')
  @Delete('employees/:id')
  deleteEmployee(@Param('id') id: string, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.hrService.softDeleteEmployee(user, id);
  }

  @Permissions('hr.work_groups.view')
  @Get('work-groups')
  listWorkGroups(@Query('organizationId') organizationId: string | undefined, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.hrService.listWorkGroups(user, organizationId);
  }

  @Permissions('hr.work_groups.manage')
  @Post('work-groups')
  createWorkGroup(@Body() body: Record<string, unknown>, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.hrService.createWorkGroup(user, body);
  }

  @Permissions('hr.work_groups.view')
  @Get('work-groups/:id')
  getWorkGroup(@Param('id') id: string, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.hrService.getWorkGroup(user, id);
  }

  @Permissions('hr.work_groups.manage')
  @Patch('work-groups/:id')
  updateWorkGroup(@Param('id') id: string, @Body() body: Record<string, unknown>, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.hrService.updateWorkGroup(user, id, body);
  }

  @Permissions('hr.teams.view')
  @Get('teams')
  listTeams(@Query('organizationId') organizationId: string | undefined, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.hrService.listTeams(user, organizationId);
  }

  @Permissions('hr.teams.manage')
  @Post('teams')
  createTeam(@Body() body: Record<string, unknown>, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.hrService.createTeam(user, body);
  }

  @Permissions('hr.teams.view')
  @Get('teams/:id')
  getTeam(@Param('id') id: string, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.hrService.getTeam(user, id);
  }

  @Permissions('hr.teams.manage')
  @Patch('teams/:id')
  updateTeam(@Param('id') id: string, @Body() body: Record<string, unknown>, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.hrService.updateTeam(user, id, body);
  }

  @Permissions('hr.documents.view')
  @Get('employee-documents')
  listEmployeeDocuments(@Query() query: Record<string, string | undefined>, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.hrService.listEmployeeDocuments(user, query);
  }

  @Permissions('hr.documents.manage')
  @Post('employee-documents')
  createEmployeeDocument(@Body() body: Record<string, unknown>, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.hrService.createEmployeeDocument(user, body);
  }

  @Permissions('hr.documents.manage')
  @Patch('employee-documents/:id/review')
  reviewEmployeeDocument(@Param('id') id: string, @Body() body: Record<string, unknown>, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.hrService.reviewEmployeeDocument(user, id, body);
  }

  @Permissions('hr.actions.apply')
  @Post('employee-actions/apply')
  applyEmployeeAction(@Body() body: Record<string, unknown>, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.hrService.applyEmployeeAction(user, body);
  }

  @Permissions('hr.org_chart.view')
  @Get('org-chart')
  orgChart(@Query('organizationId') organizationId: string | undefined, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.hrService.orgChart(user, organizationId);
  }

  @Permissions('hr.transfer_log.view')
  @Get('transfer-log')
  transferLog(@Query('organizationId') organizationId: string | undefined, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.hrService.transferLog(user, organizationId);
  }

  @Permissions('hr.title_changes.view')
  @Get('title-changes')
  titleChanges(@Query('organizationId') organizationId: string | undefined, @CurrentUser() user: AuthenticatedRequestUser) {
    return this.hrService.titleChanges(user, organizationId);
  }
}

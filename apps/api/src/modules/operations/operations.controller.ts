import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { CurrentUser } from '../../common/current-user.decorator';
import { assertRateLimit } from '../../common/rate-limit/rate-limit-check';
import { rateLimitOptionsFromEnv } from '../../common/rate-limit/rate-limit-config';
import { RateLimitExceededException } from '../../common/rate-limit/rate-limit-exceeded.exception';
import { setRateLimitHeaders } from '../../common/rate-limit/rate-limit-headers';
import {
  buildRateLimitKey,
  requestIpHash,
} from '../../common/rate-limit/rate-limit-keys';
import { RATE_LIMITER } from '../../common/rate-limit/rate-limiter';
import type { RateLimiter } from '../../common/rate-limit/rate-limiter';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { OperationsService } from './operations.service';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Operations')
@Controller()
export class OperationsController {
  constructor(
    private readonly operations: OperationsService,
    @Inject(RATE_LIMITER) private readonly rateLimiter: RateLimiter,
  ) {}

  @Get('operations/activities') listActivities(
    @Query() query: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.operations.listActivities(query, user);
  }
  @Get('operations/activities/:module') listModuleActivities(
    @Param('module') module: string,
    @Query() query: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.operations.listModuleActivities(module, query, user);
  }
  @Get('operations/activities/:module/:entityType/:entityId')
  listEntityActivities(
    @Param('module') module: string,
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Query() query: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.operations.listEntityActivities(
      module,
      entityType,
      entityId,
      query,
      user,
    );
  }
  @Get('operations/summary') operationsSummary(
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.operations.operationsSummary(user);
  }
  @Get('operations/export/activities') exportActivities(
    @Query() query: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsExportRateLimitHeaders(
      res,
      req,
      user,
      query,
      'operations.activities',
      () => this.operations.exportActivities(query, user),
    );
  }
  @Get('operations/reports/overview') operationsReportOverview(
    @Query() query: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsReportRateLimitHeaders(
      res,
      req,
      user,
      'operations.overview',
      () => this.operations.operationsReportOverview(query, user),
    );
  }
  @Get('operations/reports/trends') operationsReportTrends(
    @Query() query: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsReportRateLimitHeaders(
      res,
      req,
      user,
      'operations.trends',
      () => this.operations.operationsReportTrends(query, user),
    );
  }
  @Get('operations/reports/activity') operationsReportActivity(
    @Query() query: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsReportRateLimitHeaders(
      res,
      req,
      user,
      'operations.activity',
      () => this.operations.operationsReportActivity(query, user),
    );
  }

  @Get('hr/departments') listHrDepartments(
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.operations.listHrDepartments(user);
  }
  @Get('hr/departments/:id') getHrDepartment(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.operations.getHrDepartment(id, user);
  }
  @Post('hr/departments') createHrDepartment(
    @Body() body: any,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsRateLimitHeaders(
      res,
      req,
      user,
      'hr-department-create',
      () => this.operations.createHrDepartment(body, user),
    );
  }
  @Patch('hr/departments/:id') updateHrDepartment(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsRateLimitHeaders(
      res,
      req,
      user,
      'hr-department-update',
      () => this.operations.updateHrDepartment(id, body, user),
    );
  }
  @Patch('hr/departments/bulk/status') bulkUpdateHrDepartmentStatus(
    @Body() body: any,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsRateLimitHeaders(
      res,
      req,
      user,
      'hr-department-bulk-status',
      () => this.operations.bulkUpdateHrDepartmentStatus(body, user),
    );
  }

  @Get('hr/branches') listOrganizationBranches(
    @Query() query: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.operations.listOrganizationBranches(query, user);
  }

  @Post('hr/branches') upsertOrganizationBranch(
    @Body() body: any,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsRateLimitHeaders(
      res,
      req,
      user,
      'hr-branch-upsert',
      () => this.operations.upsertOrganizationBranch(body, user),
    );
  }

  @Patch('hr/branches/:id/activate') activateOrganizationBranch(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.operations.setOrganizationBranchActive(id, true, user);
  }

  @Patch('hr/branches/:id/deactivate') deactivateOrganizationBranch(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.operations.setOrganizationBranchActive(id, false, user);
  }

  @Get('hr/attendance/settings') getAttendanceSettings(
    @Query() query: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.operations.getAttendanceSettings(query, user);
  }

  @Patch('hr/attendance/settings') updateAttendanceSettings(
    @Body() body: any,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsRateLimitHeaders(
      res,
      req,
      user,
      'hr-attendance-settings',
      () => this.operations.updateAttendanceSettings(body, user),
    );
  }

  @Get('hr/employees') listHrEmployees(
    @Query() query: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.operations.listHrEmployees(query, user);
  }
  @Get('hr/export/employees') exportHrEmployees(
    @Query() query: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsExportRateLimitHeaders(
      res,
      req,
      user,
      query,
      'hr.employees',
      () => this.operations.exportHrEmployees(query, user),
    );
  }
  @Get('hr/export/attendance') exportHrAttendance(
    @Query() query: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsExportRateLimitHeaders(
      res,
      req,
      user,
      query,
      'hr.attendance',
      () => this.operations.exportHrAttendance(query, user),
    );
  }
  @Get('hr/employees/:id') getHrEmployee(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.operations.getHrEmployee(id, user);
  }
  @Post('hr/employees') createHrEmployee(
    @Body() body: any,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsRateLimitHeaders(
      res,
      req,
      user,
      'hr-employee-create',
      () => this.operations.createHrEmployee(body, user),
    );
  }
  @Patch('hr/employees/:id') updateHrEmployee(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsRateLimitHeaders(
      res,
      req,
      user,
      'hr-employee-update',
      () => this.operations.updateHrEmployee(id, body, user),
    );
  }
  @Post('hr/employees/:id/reset-password') resetHrEmployeePassword(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsRateLimitHeaders(
      res,
      req,
      user,
      'hr-employee-reset-password',
      () => this.operations.resetHrEmployeePassword(id, body, user),
    );
  }
  @Post('hr/employees/:id/activate') activateHrEmployee(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsRateLimitHeaders(
      res,
      req,
      user,
      'hr-employee-activate',
      () => this.operations.setHrEmployeeActive(id, true, user),
    );
  }
  @Post('hr/employees/:id/deactivate') deactivateHrEmployee(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsRateLimitHeaders(
      res,
      req,
      user,
      'hr-employee-deactivate',
      () => this.operations.setHrEmployeeActive(id, false, user),
    );
  }
  @Patch('hr/employees/:id/role') updateHrEmployeeRole(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsRateLimitHeaders(
      res,
      req,
      user,
      'hr-employee-role',
      () => this.operations.updateHrEmployeeRole(id, body, user),
    );
  }
  @Patch('hr/employees/:id/permissions') updateHrEmployeePermissions(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsRateLimitHeaders(
      res,
      req,
      user,
      'hr-employee-permissions',
      () => this.operations.updateHrEmployeePermissions(id, body, user),
    );
  }
  @Patch('hr/employees/bulk/status') bulkUpdateHrEmployeeStatus(
    @Body() body: any,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsRateLimitHeaders(
      res,
      req,
      user,
      'hr-employee-bulk-status',
      () => this.operations.bulkUpdateHrEmployeeStatus(body, user),
    );
  }

  @Get('hr/attendance') listHrAttendance(
    @Query() query: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.operations.listHrAttendance(user, query);
  }
  @Get('hr/attendance/me/today') myAttendanceToday(
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.operations.myAttendanceToday(user);
  }
  @Get('hr/attendance/me/policy') myAttendancePolicy(
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.operations.myAttendancePolicy(user);
  }
  @Get('hr/attendance/schedules') listAttendanceSchedules(
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.operations.listAttendanceSchedules(user);
  }
  @Get('hr/employees/:employeeId/attendance-override') getEmployeeAttendanceOverride(@Param('employeeId') employeeId: string, @CurrentUser() user: AuthenticatedRequestUser) { return this.operations.getEmployeeAttendanceOverride(employeeId, user); }
  @Post('hr/employees/:employeeId/attendance-override') createEmployeeAttendanceOverride(@Param('employeeId') employeeId: string, @Body() body: any, @CurrentUser() user: AuthenticatedRequestUser) { return this.operations.createEmployeeAttendanceOverride(employeeId, body, user); }
  @Patch('hr/employees/:employeeId/attendance-override/:overrideId') updateEmployeeAttendanceOverride(@Param('employeeId') employeeId: string, @Param('overrideId') overrideId: string, @Body() body: any, @CurrentUser() user: AuthenticatedRequestUser) { return this.operations.updateEmployeeAttendanceOverride(employeeId, overrideId, body, user); }
  @Get('hr/attendance/me/history') myAttendanceHistory(
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.operations.myAttendanceHistory(user);
  }
  @Get('hr/attendance/me/locations') myWebAttendanceLocations(
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.operations.myWebAttendanceLocations(user);
  }
  @Get('hr/employees/:employeeId/attendance-references') listEmployeeAttendanceReferences(
    @Param('employeeId') employeeId: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.operations.listEmployeeAttendanceReferences(employeeId, user);
  }
  @Patch('hr/attendance-references/:id/review') reviewAttendanceReference(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.operations.reviewAttendanceReference(id, body, user);
  }
  @Patch('hr/attendance/:id/face-verification') reviewAttendanceFaceVerification(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.operations.reviewAttendanceFaceVerification(id, body, user);
  }
  @Post('hr/attendance/evidence-photo')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  uploadAttendanceEvidencePhoto(
    @UploadedFile() file: any,
    @Body('purpose') purpose: string | undefined,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsRateLimitHeaders(
      res,
      req,
      user,
      'hr-attendance-evidence-photo',
      () => this.operations.uploadAttendanceEvidencePhoto(file, purpose, user),
    );
  }
  @Post('hr/attendance/check-in') checkInHrAttendance(
    @Body() body: any,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsRateLimitHeaders(
      res,
      req,
      user,
      'hr-attendance-self-check-in',
      () => this.operations.checkInHrAttendance(body, user),
    );
  }
  @Post('hr/attendance/check-in/preflight') preflightHrAttendanceCheckIn(
    @Body() body: any,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsRateLimitHeaders(
      res, req, user, 'hr-attendance-self-check-in-preflight',
      () => this.operations.preflightHrAttendanceCheckIn(body, user),
    );
  }
  @Post('hr/attendance/check-out') checkOutHrAttendance(
    @Body() body: any,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsRateLimitHeaders(
      res,
      req,
      user,
      'hr-attendance-self-check-out',
      () => this.operations.checkOutHrAttendance(body, user),
    );
  }
  @Post('hr/attendance/check-out/preflight') preflightHrAttendanceCheckOut(
    @Body() body: any,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsRateLimitHeaders(
      res,
      req,
      user,
      'hr-attendance-self-check-out-preflight',
      () => this.operations.preflightHrAttendanceCheckOut(body, user),
    );
  }
  @Get('hr/attendance/:id') getHrAttendance(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.operations.getHrAttendance(id, user);
  }
  @Post('hr/attendance') createHrAttendance(
    @Body() body: any,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsRateLimitHeaders(
      res,
      req,
      user,
      'hr-attendance-create',
      () => this.operations.createHrAttendance(body, user),
    );
  }
  @Patch('hr/attendance/:id') updateHrAttendance(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsRateLimitHeaders(
      res,
      req,
      user,
      'hr-attendance-update',
      () => this.operations.updateHrAttendance(id, body, user),
    );
  }

  @Get('accounting/categories') listAccountingCategories(
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.operations.listAccountingCategories(user);
  }
  @Get('accounting/categories/:id') getAccountingCategory(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.operations.getAccountingCategory(id, user);
  }
  @Post('accounting/categories') createAccountingCategory(
    @Body() body: any,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsRateLimitHeaders(
      res,
      req,
      user,
      'accounting-category-create',
      () => this.operations.createAccountingCategory(body, user),
    );
  }
  @Patch('accounting/categories/:id') updateAccountingCategory(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsRateLimitHeaders(
      res,
      req,
      user,
      'accounting-category-update',
      () => this.operations.updateAccountingCategory(id, body, user),
    );
  }

  @Get('accounting/transactions') listAccountingTransactions(
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.operations.listAccountingTransactions(user);
  }
  @Get('accounting/export/transactions') exportAccountingTransactions(
    @Query() query: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsExportRateLimitHeaders(
      res,
      req,
      user,
      query,
      'accounting.transactions',
      () => this.operations.exportAccountingTransactions(query, user),
    );
  }
  @Get('accounting/transactions/:id') getAccountingTransaction(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.operations.getAccountingTransaction(id, user);
  }
  @Post('accounting/transactions') createAccountingTransaction(
    @Body() body: any,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsRateLimitHeaders(
      res,
      req,
      user,
      'accounting-transaction-create',
      () => this.operations.createAccountingTransaction(body, user),
    );
  }
  @Patch('accounting/transactions/:id') updateAccountingTransaction(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsRateLimitHeaders(
      res,
      req,
      user,
      'accounting-transaction-update',
      () => this.operations.updateAccountingTransaction(id, body, user),
    );
  }
  @Patch('accounting/transactions/:id/approve') approveAccountingTransaction(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsRateLimitHeaders(
      res,
      req,
      user,
      'accounting-transaction-approve',
      () => this.operations.approveAccountingTransaction(id, body, user),
    );
  }
  @Patch('accounting/transactions/:id/reject') rejectAccountingTransaction(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsRateLimitHeaders(
      res,
      req,
      user,
      'accounting-transaction-reject',
      () => this.operations.rejectAccountingTransaction(id, body, user),
    );
  }
  @Get('accounting/summary') accountingSummary(
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.operations.accountingSummary(user);
  }
  @Get('hr/summary') hrSummary(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.operations.hrSummary(user);
  }
  @Get('legal/summary') legalSummary(
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.operations.legalSummary(user);
  }
  @Get('ads/summary') adsSummary(
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.operations.adsSummary(user);
  }
  @Get('cameras/summary') camerasSummary(
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.operations.camerasSummary(user);
  }
  @Get('hr/reports/workforce') hrReportWorkforce(
    @Query() query: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsReportRateLimitHeaders(
      res,
      req,
      user,
      'hr.workforce',
      () => this.operations.hrReportWorkforce(query, user),
    );
  }
  @Get('accounting/reports/cashflow') accountingReportCashflow(
    @Query() query: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsReportRateLimitHeaders(
      res,
      req,
      user,
      'accounting.cashflow',
      () => this.operations.accountingReportCashflow(query, user),
    );
  }
  @Get('legal/reports/risk') legalReportRisk(
    @Query() query: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsReportRateLimitHeaders(
      res,
      req,
      user,
      'legal.risk',
      () => this.operations.legalReportRisk(query, user),
    );
  }
  @Get('ads/reports/campaigns') adsReportCampaigns(
    @Query() query: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsReportRateLimitHeaders(
      res,
      req,
      user,
      'ads.campaigns',
      () => this.operations.adsReportCampaigns(query, user),
    );
  }
  @Get('cameras/reports/devices') camerasReportDevices(
    @Query() query: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsReportRateLimitHeaders(
      res,
      req,
      user,
      'cameras.devices',
      () => this.operations.camerasReportDevices(query, user),
    );
  }

  @Get('legal/documents') listLegalDocuments(
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.operations.listLegalDocuments(user);
  }
  @Get('legal/export/documents') exportLegalDocuments(
    @Query() query: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsExportRateLimitHeaders(
      res,
      req,
      user,
      query,
      'legal.documents',
      () => this.operations.exportLegalDocuments(query, user),
    );
  }
  @Get('legal/export/cases') exportLegalCases(
    @Query() query: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsExportRateLimitHeaders(
      res,
      req,
      user,
      query,
      'legal.cases',
      () => this.operations.exportLegalCases(query, user),
    );
  }
  @Get('legal/documents/:id') getLegalDocument(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.operations.getLegalDocument(id, user);
  }
  @Post('legal/documents') createLegalDocument(
    @Body() body: any,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsRateLimitHeaders(
      res,
      req,
      user,
      'legal-document-create',
      () => this.operations.createLegalDocument(body, user),
    );
  }
  @Patch('legal/documents/:id') updateLegalDocument(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsRateLimitHeaders(
      res,
      req,
      user,
      'legal-document-update',
      () => this.operations.updateLegalDocument(id, body, user),
    );
  }
  @Patch('legal/documents/bulk/status') bulkUpdateLegalDocumentStatus(
    @Body() body: any,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsRateLimitHeaders(
      res,
      req,
      user,
      'legal-document-bulk-status',
      () => this.operations.bulkUpdateLegalDocumentStatus(body, user),
    );
  }
  @Patch('legal/documents/:id/approve') approveLegalDocument(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsRateLimitHeaders(
      res,
      req,
      user,
      'legal-document-approve',
      () => this.operations.approveLegalDocument(id, body, user),
    );
  }
  @Patch('legal/documents/:id/reject') rejectLegalDocument(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsRateLimitHeaders(
      res,
      req,
      user,
      'legal-document-reject',
      () => this.operations.rejectLegalDocument(id, body, user),
    );
  }
  @Get('legal/cases') listLegalCases(
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.operations.listLegalCases(user);
  }
  @Get('legal/cases/:id') getLegalCase(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.operations.getLegalCase(id, user);
  }
  @Post('legal/cases') createLegalCase(
    @Body() body: any,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsRateLimitHeaders(
      res,
      req,
      user,
      'legal-case-create',
      () => this.operations.createLegalCase(body, user),
    );
  }
  @Patch('legal/cases/:id') updateLegalCase(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsRateLimitHeaders(
      res,
      req,
      user,
      'legal-case-update',
      () => this.operations.updateLegalCase(id, body, user),
    );
  }
  @Patch('legal/cases/bulk/status') bulkUpdateLegalCaseStatus(
    @Body() body: any,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsRateLimitHeaders(
      res,
      req,
      user,
      'legal-case-bulk-status',
      () => this.operations.bulkUpdateLegalCaseStatus(body, user),
    );
  }

  @Get('ads/campaigns') listAdsCampaigns(
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.operations.listAdsCampaigns(user);
  }
  @Get('ads/export/campaigns') exportAdsCampaigns(
    @Query() query: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsExportRateLimitHeaders(
      res,
      req,
      user,
      query,
      'ads.campaigns',
      () => this.operations.exportAdsCampaigns(query, user),
    );
  }
  @Get('ads/campaigns/:id') getAdsCampaign(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.operations.getAdsCampaign(id, user);
  }
  @Post('ads/campaigns') createAdsCampaign(
    @Body() body: any,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsRateLimitHeaders(
      res,
      req,
      user,
      'ads-campaign-create',
      () => this.operations.createAdsCampaign(body, user),
    );
  }
  @Patch('ads/campaigns/:id') updateAdsCampaign(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsRateLimitHeaders(
      res,
      req,
      user,
      'ads-campaign-update',
      () => this.operations.updateAdsCampaign(id, body, user),
    );
  }
  @Patch('ads/campaigns/bulk/status') bulkUpdateAdsCampaignStatus(
    @Body() body: any,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsRateLimitHeaders(
      res,
      req,
      user,
      'ads-campaign-bulk-status',
      () => this.operations.bulkUpdateAdsCampaignStatus(body, user),
    );
  }

  @Get('cameras/devices') listCameraDevices(
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.operations.listCameraDevices(user);
  }
  @Get('cameras/export/devices') exportCameraDevices(
    @Query() query: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsExportRateLimitHeaders(
      res,
      req,
      user,
      query,
      'cameras.devices',
      () => this.operations.exportCameraDevices(query, user),
    );
  }
  @Get('cameras/devices/:id') getCameraDevice(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.operations.getCameraDevice(id, user);
  }
  @Post('cameras/devices') createCameraDevice(
    @Body() body: any,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsRateLimitHeaders(
      res,
      req,
      user,
      'camera-device-create',
      () => this.operations.createCameraDevice(body, user),
    );
  }
  @Patch('cameras/devices/:id') updateCameraDevice(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsRateLimitHeaders(
      res,
      req,
      user,
      'camera-device-update',
      () => this.operations.updateCameraDevice(id, body, user),
    );
  }
  @Patch('cameras/devices/bulk/status') bulkUpdateCameraDeviceStatus(
    @Body() body: any,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.withOperationsRateLimitHeaders(
      res,
      req,
      user,
      'camera-device-bulk-status',
      () => this.operations.bulkUpdateCameraDeviceStatus(body, user),
    );
  }

  private async withOperationsRateLimitHeaders<T>(
    response: Response,
    request: Request,
    currentUser: AuthenticatedRequestUser,
    actionName: string,
    action: () => Promise<T>,
  ) {
    const options = rateLimitOptionsFromEnv(
      'OPERATIONS_MUTATION_RATE_LIMIT_WINDOW_SECONDS',
      'OPERATIONS_MUTATION_RATE_LIMIT_MAX',
      { windowSeconds: 300, max: 100 },
    );
    const key = buildRateLimitKey('operations-mutation', {
      action: actionName,
      organizationId: currentUser.organizationId,
      userId: currentUser.userId,
      ip: requestIpHash(request),
    });

    try {
      const rateLimit = await assertRateLimit(
        this.rateLimiter,
        key,
        options,
        'Too many operations requests. Please try again shortly.',
      );
      setRateLimitHeaders(response, rateLimit);
      return await action();
    } catch (error) {
      if (error instanceof RateLimitExceededException) {
        setRateLimitHeaders(response, error.rateLimit);
      }
      throw error;
    }
  }

  private async withOperationsExportRateLimitHeaders<T>(
    response: Response,
    request: Request,
    currentUser: AuthenticatedRequestUser,
    query: Record<string, unknown>,
    dataset: string,
    action: () => Promise<T>,
  ) {
    const options = rateLimitOptionsFromEnv(
      'OPERATIONS_EXPORT_RATE_LIMIT_WINDOW_SECONDS',
      'OPERATIONS_EXPORT_RATE_LIMIT_MAX',
      { windowSeconds: 300, max: 30 },
    );
    const key = buildRateLimitKey('operations-export', {
      action: dataset,
      organizationId: currentUser.organizationId,
      userId: currentUser.userId,
      ip: requestIpHash(request),
    });

    try {
      const rateLimit = await assertRateLimit(
        this.rateLimiter,
        key,
        options,
        'Too many operations export requests. Please try again shortly.',
      );
      setRateLimitHeaders(response, rateLimit);
      if (query.format === 'csv') {
        response.type('text/csv');
      }
      return await action();
    } catch (error) {
      if (error instanceof RateLimitExceededException) {
        setRateLimitHeaders(response, error.rateLimit);
      }
      throw error;
    }
  }

  private async withOperationsReportRateLimitHeaders<T>(
    response: Response,
    request: Request,
    currentUser: AuthenticatedRequestUser,
    reportName: string,
    action: () => Promise<T>,
  ) {
    const options = rateLimitOptionsFromEnv(
      'OPERATIONS_REPORT_RATE_LIMIT_WINDOW_SECONDS',
      'OPERATIONS_REPORT_RATE_LIMIT_MAX',
      { windowSeconds: 300, max: 60 },
    );
    const key = buildRateLimitKey('operations-report', {
      action: reportName,
      organizationId: currentUser.organizationId,
      userId: currentUser.userId,
      ip: requestIpHash(request),
    });

    try {
      const rateLimit = await assertRateLimit(
        this.rateLimiter,
        key,
        options,
        'Too many operations report requests. Please try again shortly.',
      );
      setRateLimitHeaders(response, rateLimit);
      return await action();
    } catch (error) {
      if (error instanceof RateLimitExceededException) {
        setRateLimitHeaders(response, error.rateLimit);
      }
      throw error;
    }
  }
}

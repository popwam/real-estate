import { Body, Controller, Get, Inject, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CurrentUser } from '../../common/current-user.decorator';
import { assertRateLimit } from '../../common/rate-limit/rate-limit-check';
import { rateLimitOptionsFromEnv } from '../../common/rate-limit/rate-limit-config';
import { RateLimitExceededException } from '../../common/rate-limit/rate-limit-exceeded.exception';
import { setRateLimitHeaders } from '../../common/rate-limit/rate-limit-headers';
import { buildRateLimitKey, requestIpHash } from '../../common/rate-limit/rate-limit-keys';
import { RATE_LIMITER } from '../../common/rate-limit/rate-limiter';
import type { RateLimiter } from '../../common/rate-limit/rate-limiter';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { PreviewProjectInventoryImportDto } from './dto/preview-project-inventory-import.dto';
import { ImportExportService } from './import-export.service';

@UseGuards(JwtAuthGuard)
@ApiTags('Import Export')
@ApiBearerAuth()
@Controller('import-export')
export class ImportExportController {
  constructor(
    private readonly importExportService: ImportExportService,
    @Inject(RATE_LIMITER) private readonly rateLimiter: RateLimiter,
  ) {}

  @Post('project-inventory/preview')
  @ApiOperation({ summary: 'Preview a project and inventory import.' })
  @ApiBody({ type: PreviewProjectInventoryImportDto })
  async previewProjectInventory(
    @Body() dto: PreviewProjectInventoryImportDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.withImportExportRateLimitHeaders(
      response,
      request,
      currentUser,
      'preview',
      () => this.importExportService.previewProjectInventory(dto, currentUser),
    );
  }

  @Post('operations/:type/preview')
  @ApiOperation({ summary: 'Preview an operations import.' })
  async previewOperationsImport(
    @Param('type') type: string,
    @Body() dto: PreviewProjectInventoryImportDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.withImportExportRateLimitHeaders(
      response,
      request,
      currentUser,
      'preview',
      () => this.importExportService.previewOperationsImport(type, dto, currentUser),
    );
  }

  @Get('jobs')
  @ApiOperation({ summary: 'List import jobs in the authenticated scope.' })
  listJobs(@CurrentUser() currentUser: AuthenticatedRequestUser) {
    return this.importExportService.listJobs(currentUser);
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'Get import job detail and rows.' })
  getJob(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.importExportService.getJob(id, currentUser);
  }

  @Post('jobs/:id/commit')
  @ApiOperation({ summary: 'Commit valid rows from an import job.' })
  async commitJob(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.withImportExportRateLimitHeaders(
      response,
      request,
      currentUser,
      'commit',
      () => this.importExportService.commitJob(id, currentUser),
    );
  }

  @Post('jobs/:id/cancel')
  @ApiOperation({ summary: 'Cancel an import job before commit.' })
  async cancelJob(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.withImportExportRateLimitHeaders(
      response,
      request,
      currentUser,
      'cancel',
      () => this.importExportService.cancelJob(id, currentUser),
    );
  }

  @Get('export/projects')
  exportProjects(@CurrentUser() currentUser: AuthenticatedRequestUser) {
    return this.importExportService.exportProjects(currentUser);
  }

  @Get('export/inventory')
  exportInventory(@CurrentUser() currentUser: AuthenticatedRequestUser) {
    return this.importExportService.exportInventory(currentUser);
  }

  @Get('export/deals')
  exportDeals(@CurrentUser() currentUser: AuthenticatedRequestUser) {
    return this.importExportService.exportDeals(currentUser);
  }

  @Get('export/commissions')
  exportCommissions(@CurrentUser() currentUser: AuthenticatedRequestUser) {
    return this.importExportService.exportCommissions(currentUser);
  }

  @Get('export/account')
  exportAccount(@CurrentUser() currentUser: AuthenticatedRequestUser) {
    return this.importExportService.exportAccount(currentUser);
  }

  private async withImportExportRateLimitHeaders<T>(
    response: Response,
    request: Request,
    currentUser: AuthenticatedRequestUser,
    actionName: 'preview' | 'commit' | 'cancel',
    action: () => Promise<T>,
  ) {
    const options = rateLimitOptionsFromEnv(
      'IMPORT_EXPORT_RATE_LIMIT_WINDOW_SECONDS',
      'IMPORT_EXPORT_RATE_LIMIT_MAX',
      { windowSeconds: 300, max: 20 },
    );
    const key = buildRateLimitKey('import-export', {
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
        'Too many import/export requests. Please try again shortly.',
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

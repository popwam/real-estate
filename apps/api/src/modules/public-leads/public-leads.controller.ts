import { Body, Controller, Get, Inject, Param, Patch, Req, Res, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
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
import { UpdatePublicLeadStatusDto } from './dto/update-public-lead-status.dto';
import { PublicLeadsService } from './public-leads.service';

@UseGuards(JwtAuthGuard)
@ApiTags('Public Leads')
@ApiBearerAuth()
@Controller('public-leads')
export class PublicLeadsController {
  constructor(
    private readonly publicLeadsService: PublicLeadsService,
    @Inject(RATE_LIMITER) private readonly rateLimiter: RateLimiter,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List public leads in the authenticated scope.' })
  findMany(@CurrentUser() currentUser: AuthenticatedRequestUser) {
    return this.publicLeadsService.findMany(currentUser);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one public lead in the authenticated scope.' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.publicLeadsService.findOne(id, currentUser);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update public lead status.' })
  @ApiBody({ type: UpdatePublicLeadStatusDto })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePublicLeadStatusDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.withPublicLeadManagementRateLimitHeaders(
      response,
      request,
      currentUser,
      'status',
      () => this.publicLeadsService.updateStatus(id, dto, currentUser),
    );
  }

  @Patch(':id/mark-spam')
  @ApiOperation({ summary: 'Mark a public lead as spam.' })
  async markSpam(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.withPublicLeadManagementRateLimitHeaders(
      response,
      request,
      currentUser,
      'mark-spam',
      () => this.publicLeadsService.markSpam(id, currentUser),
    );
  }

  @Patch(':id/convert-placeholder')
  @ApiOperation({
    summary: 'Convert a public lead into CRM client/lead foundation records.',
  })
  async convertPlaceholder(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.withPublicLeadManagementRateLimitHeaders(
      response,
      request,
      currentUser,
      'convert-placeholder',
      () => this.publicLeadsService.convertPlaceholder(id, currentUser),
    );
  }

  private async withPublicLeadManagementRateLimitHeaders<T>(
    response: Response,
    request: Request,
    currentUser: AuthenticatedRequestUser,
    actionName: 'status' | 'mark-spam' | 'convert-placeholder',
    action: () => Promise<T>,
  ) {
    const options = rateLimitOptionsFromEnv(
      'PUBLIC_LEAD_MANAGEMENT_RATE_LIMIT_WINDOW_SECONDS',
      'PUBLIC_LEAD_MANAGEMENT_RATE_LIMIT_MAX',
      { windowSeconds: 300, max: 60 },
    );
    const key = buildRateLimitKey('public-lead-management', {
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
        'Too many public lead management requests. Please try again shortly.',
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

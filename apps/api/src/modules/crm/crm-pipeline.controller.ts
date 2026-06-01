import { Body, Controller, Get, Inject, Param, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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
import { CrmPipelineService } from './crm-pipeline.service';

@UseGuards(JwtAuthGuard)
@ApiTags('CRM Pipeline')
@ApiBearerAuth()
@Controller()
export class CrmPipelineController {
  constructor(
    private readonly pipeline: CrmPipelineService,
    @Inject(RATE_LIMITER) private readonly rateLimiter: RateLimiter,
  ) {}

  @Get('crm/pipeline/stages')
  @ApiOperation({ summary: 'List CRM pipeline stages.' })
  listStages(@CurrentUser() currentUser: AuthenticatedRequestUser) {
    return this.pipeline.listStages(currentUser);
  }

  @Post('crm/pipeline/stages')
  createStage(
    @Body() body: Record<string, unknown>,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.withOperationsRateLimitHeaders(response, request, currentUser, 'crm-pipeline-stage-create', () =>
      this.pipeline.createStage(body, currentUser),
    );
  }

  @Patch('crm/pipeline/stages/reorder')
  reorder(
    @Body() body: Record<string, unknown>,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.withOperationsRateLimitHeaders(response, request, currentUser, 'crm-pipeline-stage-reorder', () =>
      this.pipeline.reorderStages(body, currentUser),
    );
  }

  @Patch('crm/pipeline/stages/:id')
  updateStage(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.withOperationsRateLimitHeaders(response, request, currentUser, 'crm-pipeline-stage-update', () =>
      this.pipeline.updateStage(id, body, currentUser),
    );
  }

  @Patch('crm/leads/:id/stage')
  changeLeadStage(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.withOperationsRateLimitHeaders(response, request, currentUser, 'crm-lead-stage-update', () =>
      this.pipeline.changeLeadStage(id, body, currentUser),
    );
  }

  @Get('crm/leads/:id/stage-history')
  stageHistory(@Param('id') id: string, @CurrentUser() currentUser: AuthenticatedRequestUser) {
    return this.pipeline.stageHistory(id, currentUser);
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
}

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
import { CrmNotesTasksService } from './crm-notes-tasks.service';

@UseGuards(JwtAuthGuard)
@ApiTags('CRM Notes and Tasks')
@ApiBearerAuth()
@Controller()
export class CrmNotesTasksController {
  constructor(
    private readonly service: CrmNotesTasksService,
    @Inject(RATE_LIMITER) private readonly rateLimiter: RateLimiter,
  ) {}

  @Get('crm/notes')
  listNotes(@CurrentUser() currentUser: AuthenticatedRequestUser) {
    return this.service.listNotes(currentUser);
  }

  @Post('crm/notes')
  createNote(
    @Body() body: Record<string, unknown>,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.withOperationsRateLimitHeaders(response, request, currentUser, 'crm-note-create', () =>
      this.service.createNote(body, currentUser),
    );
  }

  @Get('crm/leads/:id/notes')
  listLeadNotes(@Param('id') id: string, @CurrentUser() currentUser: AuthenticatedRequestUser) {
    return this.service.listLeadNotes(id, currentUser);
  }

  @Post('crm/leads/:id/notes')
  createLeadNote(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.withOperationsRateLimitHeaders(response, request, currentUser, 'crm-lead-note-create', () =>
      this.service.createNote(body, currentUser, id),
    );
  }

  @Get('crm/tasks')
  listTasks(@CurrentUser() currentUser: AuthenticatedRequestUser) {
    return this.service.listTasks(currentUser);
  }

  @Post('crm/tasks')
  createTask(
    @Body() body: Record<string, unknown>,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.withOperationsRateLimitHeaders(response, request, currentUser, 'crm-task-create', () =>
      this.service.createTask(body, currentUser),
    );
  }

  @Patch('crm/tasks/:id')
  updateTask(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.withOperationsRateLimitHeaders(response, request, currentUser, 'crm-task-update', () =>
      this.service.updateTask(id, body, currentUser),
    );
  }

  @Patch('crm/tasks/:id/complete')
  completeTask(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.withOperationsRateLimitHeaders(response, request, currentUser, 'crm-task-complete', () =>
      this.service.completeTask(id, currentUser),
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
}

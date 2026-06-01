import { Body, Controller, Get, Inject, Param, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
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
import { ClaimCrmLeadDto } from './dto/claim-crm-lead.dto';
import { CrmLeadsService } from './crm-leads.service';
import { ListCrmLeadsQueryDto } from './dto/list-crm-leads-query.dto';
import { UpdateCrmLeadStatusDto } from './dto/update-crm-lead-status.dto';

@UseGuards(JwtAuthGuard)
@ApiTags('CRM Leads')
@ApiBearerAuth()
@Controller('crm/leads')
export class CrmLeadsController {
  constructor(
    private readonly crmLeadsService: CrmLeadsService,
    @Inject(RATE_LIMITER) private readonly rateLimiter: RateLimiter,
  ) {}

  @Get('marketplace')
  @ApiOperation({ summary: 'List marketplace CRM leads for broker claiming.' })
  listMarketplace(
    @Query() query: ListCrmLeadsQueryDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.crmLeadsService.listMarketplace(currentUser, query);
  }

  @Get()
  @ApiOperation({ summary: 'List CRM leads in authenticated scope.' })
  findMany(
    @Query() query: ListCrmLeadsQueryDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.crmLeadsService.findMany(currentUser, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one CRM lead in authenticated scope.' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.crmLeadsService.findOne(id, currentUser);
  }

  @Post(':id/claim')
  @ApiOperation({ summary: 'Claim an available CRM lead.' })
  async claim(
    @Param('id') id: string,
    @Body() _dto: ClaimCrmLeadDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.withCrmRateLimitHeaders(response, request, currentUser, 'lead-claim', () =>
      this.crmLeadsService.claim(id, currentUser),
    );
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update a CRM lead status in authenticated scope.' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCrmLeadStatusDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.withCrmRateLimitHeaders(
      response,
      request,
      currentUser,
      'lead-status',
      () => this.crmLeadsService.updateStatus(id, dto, currentUser),
    );
  }

  private async withCrmRateLimitHeaders<T>(
    response: Response,
    request: Request,
    currentUser: AuthenticatedRequestUser,
    actionName: 'lead-claim' | 'lead-status',
    action: () => Promise<T>,
  ) {
    const options = rateLimitOptionsFromEnv(
      'CRM_MUTATION_RATE_LIMIT_WINDOW_SECONDS',
      'CRM_MUTATION_RATE_LIMIT_MAX',
      { windowSeconds: 60, max: 60 },
    );
    const key = buildRateLimitKey('crm-mutation', {
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
        'Too many CRM requests. Please try again shortly.',
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

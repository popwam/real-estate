import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
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
import { CreateOrganizationDomainDto } from './dto/create-organization-domain.dto';
import { DomainReviewDto } from './dto/domain-review.dto';
import { OrganizationDomainsService } from './organization-domains.service';

@UseGuards(JwtAuthGuard)
@ApiTags('Organization Domains')
@ApiBearerAuth()
@Controller('organization-domains')
export class OrganizationDomainsController {
  constructor(
    private readonly domainsService: OrganizationDomainsService,
    @Inject(RATE_LIMITER) private readonly rateLimiter: RateLimiter,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'List current organization domain records.' })
  findMine(@CurrentUser() currentUser: AuthenticatedRequestUser) {
    return this.domainsService.findMine(currentUser);
  }

  @Post('me')
  @ApiOperation({ summary: 'Add a current organization domain record.' })
  @ApiBody({ type: CreateOrganizationDomainDto })
  async createMine(
    @Body() dto: CreateOrganizationDomainDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.withDomainRateLimitHeaders(
      response,
      request,
      currentUser,
      'create',
      () => this.domainsService.createMine(dto, currentUser),
    );
  }

  @Patch(':id/request-verification')
  @ApiOperation({ summary: 'Request verification for an organization domain.' })
  async requestVerification(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.withDomainRateLimitHeaders(
      response,
      request,
      currentUser,
      'request-verification',
      () => this.domainsService.requestVerification(id, currentUser),
    );
  }

  @Patch(':id/check-dns')
  @ApiOperation({ summary: 'Check DNS TXT verification record for an organization domain.' })
  checkDns(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.domainsService.checkDns(id, currentUser);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Test an organization domain DNS verification record.' })
  testDomain(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.domainsService.checkDns(id, currentUser);
  }

  @Patch(':id/default')
  @ApiOperation({ summary: 'Mark an organization domain as default.' })
  setDefault(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.domainsService.setDefault(id, currentUser);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove an organization domain.' })
  remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.domainsService.remove(id, currentUser);
  }

  @Patch(':id/mark-verified-dev-only')
  @ApiOperation({ summary: 'Mark an organization domain verified in local/dev only.' })
  async markVerifiedDevOnly(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.withDomainRateLimitHeaders(
      response,
      request,
      currentUser,
      'mark-verified-dev-only',
      () => this.domainsService.markVerifiedDevOnly(id, currentUser),
    );
  }

  private async withDomainRateLimitHeaders<T>(
    response: Response,
    request: Request,
    currentUser: AuthenticatedRequestUser,
    actionName: 'create' | 'request-verification' | 'mark-verified-dev-only',
    action: () => Promise<T>,
  ) {
    const options = rateLimitOptionsFromEnv(
      'DOMAIN_MUTATION_RATE_LIMIT_WINDOW_SECONDS',
      'DOMAIN_MUTATION_RATE_LIMIT_MAX',
      { windowSeconds: 300, max: 30 },
    );
    const key = buildRateLimitKey('domain-mutation', {
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
        'Too many domain requests. Please try again shortly.',
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

@UseGuards(JwtAuthGuard)
@ApiTags('Platform Admin')
@ApiBearerAuth()
@Controller('platform-admin/domains')
export class PlatformDomainsController {
  constructor(
    private readonly domainsService: OrganizationDomainsService,
    @Inject(RATE_LIMITER) private readonly rateLimiter: RateLimiter,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List domain verification records for platform review.' })
  findAll(@CurrentUser() currentUser: AuthenticatedRequestUser) {
    return this.domainsService.findAllForPlatform(currentUser);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve a domain verification record.' })
  async approve(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.withDomainRateLimitHeaders(
      response,
      request,
      currentUser,
      'approve',
      () => this.domainsService.approve(id, currentUser),
    );
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject a domain verification record.' })
  @ApiBody({ type: DomainReviewDto })
  async reject(
    @Param('id') id: string,
    @Body() dto: DomainReviewDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.withDomainRateLimitHeaders(
      response,
      request,
      currentUser,
      'reject',
      () => this.domainsService.reject(id, dto, currentUser),
    );
  }

  private async withDomainRateLimitHeaders<T>(
    response: Response,
    request: Request,
    currentUser: AuthenticatedRequestUser,
    actionName: 'approve' | 'reject',
    action: () => Promise<T>,
  ) {
    const options = rateLimitOptionsFromEnv(
      'DOMAIN_MUTATION_RATE_LIMIT_WINDOW_SECONDS',
      'DOMAIN_MUTATION_RATE_LIMIT_MAX',
      { windowSeconds: 300, max: 30 },
    );
    const key = buildRateLimitKey('domain-mutation', {
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
        'Too many domain requests. Please try again shortly.',
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

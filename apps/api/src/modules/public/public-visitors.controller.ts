import { Body, Controller, Inject, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { RATE_LIMITER } from '../../common/rate-limit/rate-limiter';
import type { RateLimiter } from '../../common/rate-limit/rate-limiter';
import { assertRateLimit } from '../../common/rate-limit/rate-limit-check';
import { buildRateLimitKey, requestIpHash } from '../../common/rate-limit/rate-limit-keys';
import { setRateLimitHeaders } from '../../common/rate-limit/rate-limit-headers';
import { RateLimitExceededException } from '../../common/rate-limit/rate-limit-exceeded.exception';
import { CreateVisitorEventsDto } from './dto/create-visitor-events.dto';
import { CreateVisitorSessionDto } from './dto/create-visitor-session.dto';
import { PublicVisitorsService } from './public-visitors.service';

@Controller('public/visitors')
export class PublicVisitorsController {
  constructor(
    private readonly visitors: PublicVisitorsService,
    @Inject(RATE_LIMITER) private readonly rateLimiter: RateLimiter,
  ) {}

  @Post('session')
  async session(
    @Body() dto: CreateVisitorSessionDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.rateLimited(request, response, 'session', dto.anonymousKey, () =>
      this.visitors.createOrUpdateSession(dto, request),
    );
  }

  @Post('events')
  async events(
    @Body() dto: CreateVisitorEventsDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.rateLimited(request, response, 'events', dto.sessionId, () =>
      this.visitors.createEvents(dto),
    );
  }

  private async rateLimited<T>(
    request: Request,
    response: Response,
    action: string,
    identity: string,
    run: () => Promise<T>,
  ) {
    try {
      const limit = await assertRateLimit(
        this.rateLimiter,
        buildRateLimitKey('public-visitor', {
          action,
          identity: identity?.slice(0, 128),
          ip: requestIpHash(request),
        }),
        {
          windowSeconds: Number(process.env.PUBLIC_VISITOR_RATE_LIMIT_WINDOW_SECONDS) || 60,
          max: Number(process.env.PUBLIC_VISITOR_RATE_LIMIT_MAX) || 120,
        },
        'Too many visitor tracking requests.',
      );
      setRateLimitHeaders(response, limit);
      return await run();
    } catch (error) {
      if (error instanceof RateLimitExceededException) {
        setRateLimitHeaders(response, error.rateLimit);
      }
      throw error;
    }
  }
}

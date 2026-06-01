import type { Response } from 'express';
import { RateLimitHeaders } from './rate-limiter';

export function setRateLimitHeaders(response: Response, rateLimit: RateLimitHeaders) {
  response.setHeader('x-rate-limit-limit', String(rateLimit.limit));
  response.setHeader('x-rate-limit-remaining', String(Math.max(0, rateLimit.remaining)));
  response.setHeader('x-rate-limit-reset', rateLimit.resetAt.toISOString());
}


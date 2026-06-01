import { RateLimitExceededException } from './rate-limit-exceeded.exception';
import { RateLimitHeaders, RateLimiter, RateLimitOptions } from './rate-limiter';

export async function assertRateLimit(
  rateLimiter: RateLimiter,
  key: string,
  options: RateLimitOptions,
  exceededMessage: string,
): Promise<RateLimitHeaders> {
  const result = await rateLimiter.check(key, options);
  const rateLimit = {
    limit: options.max,
    remaining: result.remaining,
    resetAt: result.resetAt,
  };

  if (!result.allowed) {
    throw new RateLimitExceededException(exceededMessage, rateLimit);
  }

  return rateLimit;
}

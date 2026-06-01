import { Global, Module } from '@nestjs/common';
import { MemoryRateLimiter } from './memory-rate-limiter';
import { RedisRateLimiter } from './redis-rate-limiter';
import { RATE_LIMITER, RateLimitBackend, RateLimiter } from './rate-limiter';

export function createRateLimiterFromEnv(env: NodeJS.ProcessEnv): RateLimiter {
  const backend = parseRateLimitBackend(env.RATE_LIMIT_BACKEND);

  if (backend === 'redis') {
    const redisUrl = env.RATE_LIMIT_REDIS_URL?.trim();
    if (!redisUrl) {
      throw new Error('RATE_LIMIT_REDIS_URL is required when RATE_LIMIT_BACKEND=redis.');
    }

    return new RedisRateLimiter(redisUrl);
  }

  return new MemoryRateLimiter();
}

@Global()
@Module({
  providers: [
    {
      provide: RATE_LIMITER,
      useFactory: () => createRateLimiterFromEnv(process.env),
    },
  ],
  exports: [RATE_LIMITER],
})
export class RateLimitModule {}

function parseRateLimitBackend(value: string | undefined): RateLimitBackend {
  if (!value || value === 'memory') {
    return 'memory';
  }

  if (value === 'redis') {
    return 'redis';
  }

  throw new Error('Invalid RATE_LIMIT_BACKEND. Expected memory or redis.');
}

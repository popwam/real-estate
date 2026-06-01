import { RedisRateLimiter } from './redis-rate-limiter';

describe('RedisRateLimiter', () => {
  it('fails clearly when constructed without a Redis URL', () => {
    expect(() => new RedisRateLimiter('')).toThrow(
      'RATE_LIMIT_REDIS_URL is required when RATE_LIMIT_BACKEND=redis.',
    );
  });

  const redisTestUrl = process.env.REDIS_TEST_URL;
  const maybeIt = redisTestUrl ? it : it.skip;

  maybeIt('allows and blocks using Redis when REDIS_TEST_URL is available', async () => {
    const limiter = new RedisRateLimiter(redisTestUrl as string);
    const key = `redis-spec-${Date.now()}`;

    try {
      const first = await limiter.check(key, { windowSeconds: 30, max: 2 });
      const second = await limiter.check(key, { windowSeconds: 30, max: 2 });
      const third = await limiter.check(key, { windowSeconds: 30, max: 2 });

      expect(first.allowed).toBe(true);
      expect(second.allowed).toBe(true);
      expect(third.allowed).toBe(false);
      expect(third.remaining).toBe(0);
      expect(third.resetAt).toBeInstanceOf(Date);
    } finally {
      await limiter.disconnect();
    }
  });
});


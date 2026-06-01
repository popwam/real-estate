import { MemoryRateLimiter } from './memory-rate-limiter';
import { createRateLimiterFromEnv } from './rate-limit.module';

describe('MemoryRateLimiter', () => {
  it('allows requests within the configured max', async () => {
    const limiter = new MemoryRateLimiter();

    const first = await limiter.check('key-a', { windowSeconds: 60, max: 2 });
    const second = await limiter.check('key-a', { windowSeconds: 60, max: 2 });

    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(1);
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(0);
  });

  it('blocks after the configured max', async () => {
    const limiter = new MemoryRateLimiter();

    await limiter.check('key-b', { windowSeconds: 60, max: 1 });
    const blocked = await limiter.check('key-b', { windowSeconds: 60, max: 1 });

    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetAt).toBeInstanceOf(Date);
  });

  it('resets after the window expires', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-26T00:00:00.000Z'));
    const limiter = new MemoryRateLimiter();

    await limiter.check('key-c', { windowSeconds: 1, max: 1 });
    const blocked = await limiter.check('key-c', { windowSeconds: 1, max: 1 });
    jest.advanceTimersByTime(1001);
    const afterReset = await limiter.check('key-c', { windowSeconds: 1, max: 1 });

    expect(blocked.allowed).toBe(false);
    expect(afterReset.allowed).toBe(true);
    jest.useRealTimers();
  });

  it('fails clearly when redis backend is selected without a URL', () => {
    expect(() =>
      createRateLimiterFromEnv({
        RATE_LIMIT_BACKEND: 'redis',
      } as NodeJS.ProcessEnv),
    ).toThrow('RATE_LIMIT_REDIS_URL is required when RATE_LIMIT_BACKEND=redis.');
  });
});


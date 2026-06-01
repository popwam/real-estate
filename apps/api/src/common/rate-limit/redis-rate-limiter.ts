import Redis from 'ioredis';
import { RateLimiter, RateLimitOptions, RateLimitResult } from './rate-limiter';

const CHECK_SCRIPT = `
local current = redis.call("INCR", KEYS[1])
if current == 1 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
end
local ttl = redis.call("PTTL", KEYS[1])
return { current, ttl }
`;

export class RedisRateLimiter implements RateLimiter {
  private readonly redis: Redis;
  private connectPromise: Promise<void> | null = null;

  constructor(private readonly redisUrl: string) {
    if (!redisUrl.trim()) {
      throw new Error('RATE_LIMIT_REDIS_URL is required when RATE_LIMIT_BACKEND=redis.');
    }

    this.redis = new Redis(redisUrl, {
      enableOfflineQueue: false,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
  }

  async check(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
    await this.ensureConnected();

    const windowMs = Math.max(1, options.windowSeconds) * 1000;
    const max = Math.max(1, options.max);
    const redisKey = `popwam:rate-limit:${key}`;

    const result = (await this.redis.eval(
      CHECK_SCRIPT,
      1,
      redisKey,
      String(windowMs),
    )) as [number | string, number | string];
    const count = Number(result[0]);
    const ttlMs = Number(result[1]);
    const resetInMs = ttlMs > 0 ? ttlMs : windowMs;

    return {
      allowed: count <= max,
      remaining: Math.max(0, max - count),
      resetAt: new Date(Date.now() + resetInMs),
    };
  }

  async disconnect() {
    await this.redis.quit().catch(() => {
      this.redis.disconnect();
    });
  }

  private async ensureConnected() {
    if (this.redis.status === 'ready') {
      return;
    }

    if (!this.connectPromise) {
      this.connectPromise = this.redis.connect().then(() => undefined);
    }

    await this.connectPromise;
  }
}

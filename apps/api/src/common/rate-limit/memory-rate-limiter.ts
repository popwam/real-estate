import { Injectable } from '@nestjs/common';
import { RateLimiter, RateLimitOptions, RateLimitResult } from './rate-limiter';

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

@Injectable()
export class MemoryRateLimiter implements RateLimiter {
  private readonly entries = new Map<string, RateLimitEntry>();

  async check(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
    const now = Date.now();
    const windowMs = Math.max(1, options.windowSeconds) * 1000;
    const max = Math.max(1, options.max);
    const entry = this.entries.get(key);

    if (!entry || entry.resetAt <= now) {
      const resetAt = now + windowMs;
      this.entries.set(key, { count: 1, resetAt });

      return {
        allowed: true,
        remaining: Math.max(0, max - 1),
        resetAt: new Date(resetAt),
      };
    }

    if (entry.count >= max) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(entry.resetAt),
      };
    }

    entry.count += 1;

    return {
      allowed: true,
      remaining: Math.max(0, max - entry.count),
      resetAt: new Date(entry.resetAt),
    };
  }
}


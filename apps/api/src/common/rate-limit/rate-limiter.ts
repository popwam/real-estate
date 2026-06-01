export const RATE_LIMITER = Symbol('RATE_LIMITER');

export type RateLimitOptions = {
  windowSeconds: number;
  max: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
};

export type RateLimitHeaders = {
  limit: number;
  remaining: number;
  resetAt: Date;
};

export type RateLimitedResponse<T> = {
  body: T;
  rateLimit: RateLimitHeaders;
};

export interface RateLimiter {
  check(key: string, options: RateLimitOptions): Promise<RateLimitResult>;
}

export type RateLimitBackend = 'memory' | 'redis';

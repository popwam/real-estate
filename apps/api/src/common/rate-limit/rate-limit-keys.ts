import { createHash } from 'crypto';
import type { Request } from 'express';

type RateLimitKeyPart = string | number | boolean | null | undefined;

export function buildRateLimitKey(
  scope: string,
  parts: Record<string, RateLimitKeyPart>,
) {
  const safeParts = Object.entries(parts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${hashRateLimitValue(String(value ?? 'unknown'))}`)
    .join('|');

  return hashRateLimitValue(`${scope}:${safeParts}`);
}

export function normalizedEmailForRateLimit(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : undefined;
}

export function hashRateLimitValue(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export function requestIpHash(request: Request | undefined) {
  const forwarded = request?.headers['x-forwarded-for'];
  const firstForwarded = Array.isArray(forwarded)
    ? forwarded[0]
    : forwarded?.split(',')[0];
  const ip =
    firstForwarded?.trim() ||
    request?.ip ||
    request?.socket?.remoteAddress ||
    'unknown';

  return hashRateLimitValue(`ip:${ip}`);
}

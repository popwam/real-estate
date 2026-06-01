import { RateLimitOptions } from './rate-limiter';

export function rateLimitOptionsFromEnv(
  windowEnvName: string,
  maxEnvName: string,
  defaults: RateLimitOptions,
): RateLimitOptions {
  return {
    windowSeconds: envPositiveInt(windowEnvName, defaults.windowSeconds),
    max: envPositiveInt(maxEnvName, defaults.max),
  };
}

function envPositiveInt(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

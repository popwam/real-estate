import { randomBytes, randomUUID } from 'crypto';
import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import type { AuthenticatedRequestUser } from '../modules/auth/types/jwt-payload';
import { hashLogValue, sanitizeRequestPath } from './request-log-sanitizer';

type RequestWithLoggingContext = Request & {
  requestId?: string;
  user?: AuthenticatedRequestUser;
};

interface RequestLogEntry {
  timestamp: string;
  level: 'info' | 'error';
  service: 'api';
  environment: string;
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  ipHash?: string;
  userAgentHash?: string;
  userId?: string;
  organizationId?: string | null;
  role?: string;
  errorName?: string;
  errorMessage?: string;
}

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  use(request: RequestWithLoggingContext, response: Response, next: NextFunction) {
    const startedAt = Date.now();
    const requestId = resolveRequestId(request);

    request.requestId = requestId;
    response.setHeader('x-request-id', requestId);

    response.once('finish', () => {
      this.logRequest(request, response, requestId, Date.now() - startedAt);
    });

    next();
  }

  private logRequest(
    request: RequestWithLoggingContext,
    response: Response,
    requestId: string,
    durationMs: number,
  ) {
    if (
      process.env.NODE_ENV === 'test' ||
      request.method === 'OPTIONS' ||
      process.env.REQUEST_LOG_SUCCESS !== 'true'
    ) {
      return;
    }

    const statusCode = response.statusCode;
    // Failed requests are logged once by ApiExceptionFilter with the underlying
    // error name and Prisma code. This opt-in middleware log is for successful
    // request diagnostics only and is disabled by default in every environment.
    if (statusCode >= 500) return;
    const level = 'info' as const;
    const entry: RequestLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: 'api',
      environment: process.env.NODE_ENV ?? 'development',
      requestId,
      method: request.method,
      path: sanitizeRequestPath(request.originalUrl ?? request.url),
      statusCode,
      durationMs,
      ipHash: hashLogValue(resolveSourceIp(request), 'ip'),
      userAgentHash: hashLogValue(request.headers['user-agent'], 'user-agent'),
      userId: request.user?.userId,
      organizationId: request.user?.organizationId,
      role: request.user?.role,
    };

    console.log(JSON.stringify(entry));
  }
}

function resolveRequestId(request: Request): string {
  const incomingRequestId = firstHeaderValue(request.headers['x-request-id']);
  const incomingCorrelationId = firstHeaderValue(request.headers['x-correlation-id']);
  const incoming = sanitizeIncomingRequestId(incomingRequestId ?? incomingCorrelationId);

  return incoming ?? generateRequestId();
}

function firstHeaderValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function sanitizeIncomingRequestId(value: string | undefined): string | undefined {
  const normalized = value?.trim();

  if (!normalized || normalized.length > 128) {
    return undefined;
  }

  return /^[A-Za-z0-9._:-]+$/.test(normalized) ? normalized : undefined;
}

function generateRequestId(): string {
  if (typeof randomUUID === 'function') {
    return randomUUID();
  }

  return randomBytes(16).toString('hex');
}

function resolveSourceIp(request: Request): string | undefined {
  const forwardedFor = firstHeaderValue(request.headers['x-forwarded-for']);

  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim();
  }

  return request.ip || request.socket.remoteAddress || undefined;
}

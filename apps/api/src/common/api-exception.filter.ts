import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { sanitizeRequestPath } from './request-log-sanitizer';

type RequestWithId = Request & { requestId?: string };

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const request = http.getRequest<RequestWithId>();
    const response = http.getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const requestId = request.requestId ?? response.getHeader('x-request-id');
    const body = this.responseBody(exception, status, requestId);

    if (status >= 500) {
      this.logger.error({
        event: 'api_request_failed',
        requestId: requestId ?? null,
        method: request.method,
        path: sanitizeRequestPath(request.originalUrl ?? request.url ?? request.path),
        errorName: this.errorName(exception),
        prismaCode: this.prismaCode(exception),
      });
    }

    response.status(status).json(body);
  }

  private responseBody(exception: unknown, status: number, requestId: unknown) {
    if (!(exception instanceof HttpException)) {
      return {
        statusCode: status,
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        requestId: requestId ?? null,
      };
    }

    const source = exception.getResponse();
    const body: Record<string, unknown> =
      source && typeof source === 'object'
        ? { ...(source as Record<string, unknown>) }
        : { message: String(source) };

    return {
      statusCode: status,
      code: this.errorCode(status, body.code),
      ...body,
      requestId: requestId ?? null,
    };
  }

  private errorCode(status: number, code: unknown) {
    if (typeof code === 'string' && code) return code;
    if (status === 401) return 'AUTHENTICATION_REQUIRED';
    if (status === 403) return 'ACCESS_DENIED';
    if (status === 404) return 'NOT_FOUND';
    if (status === 400) return 'INVALID_REQUEST';
    return status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_FAILED';
  }

  private prismaCode(exception: unknown) {
    let current = exception;
    for (let depth = 0; depth < 4 && current && typeof current === 'object'; depth += 1) {
      if ('code' in current) {
        const code = (current as { code?: unknown }).code;
        if (typeof code === 'string' && /^P\d{4}$/.test(code)) return code;
      }
      current = 'cause' in current ? (current as { cause?: unknown }).cause : undefined;
    }
    return null;
  }

  private errorName(exception: unknown) {
    let current = exception;
    let fallback = 'UnknownError';
    for (let depth = 0; depth < 4 && current && typeof current === 'object'; depth += 1) {
      if (current instanceof Error && /^[A-Za-z0-9_.-]{1,80}$/.test(current.name)) {
        fallback = current.name;
      }
      current = 'cause' in current ? (current as { cause?: unknown }).cause : undefined;
    }
    return fallback;
  }
}

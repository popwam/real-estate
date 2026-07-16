import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

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
        path: request.route?.path ?? request.path,
        errorName:
          exception instanceof Error ? exception.name : 'UnknownError',
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
    if (!exception || typeof exception !== 'object' || !('code' in exception)) {
      return null;
    }
    const code = (exception as { code?: unknown }).code;
    return typeof code === 'string' && /^P\d{4}$/.test(code) ? code : null;
  }
}

import { ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import { ApiExceptionFilter } from './api-exception.filter';

describe('ApiExceptionFilter', () => {
  function harness(exception: unknown) {
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const response = { status, json, getHeader: () => 'request-123' };
    const request = {
      requestId: 'request-123',
      method: 'GET',
      path: '/platform/settings',
    };
    const host = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as any;
    const filter = new ApiExceptionFilter();
    (filter as any).logger.error = jest.fn();
    filter.catch(exception, host);
    return { status, json, logger: (filter as any).logger };
  }

  it('preserves a structured permission error and request ID', () => {
    const result = harness(new ForbiddenException({
      statusCode: 403,
      code: 'PERMISSION_REQUIRED',
      requiredPermission: 'platform.settings.view',
      message: 'Required permission is missing.',
    }));

    expect(result.status).toHaveBeenCalledWith(403);
    expect(result.json).toHaveBeenCalledWith({
      statusCode: 403,
      code: 'PERMISSION_REQUIRED',
      requiredPermission: 'platform.settings.view',
      message: 'Required permission is missing.',
      requestId: 'request-123',
    });
  });

  it('returns a safe 500 and logs only the Prisma code with the request ID', () => {
    const error = Object.assign(new Error('database secret'), { code: 'P2021' });
    const result = harness(error);

    expect(result.status).toHaveBeenCalledWith(500);
    expect(result.json).toHaveBeenCalledWith({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      requestId: 'request-123',
    });
    expect(result.logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ requestId: 'request-123', prismaCode: 'P2021' }),
    );
    expect(JSON.stringify(result.logger.error.mock.calls)).not.toContain('database secret');
  });

  it('logs a wrapped P2028 once with a sanitized path and keeps the safe response', () => {
    const cause = Object.assign(new Error('transaction details'), {
      name: 'PrismaClientKnownRequestError',
      code: 'P2028',
    });
    const exception = new ServiceUnavailableException(
      {
        code: 'FIRST_ADMIN_TEMPORARILY_UNAVAILABLE',
        message: 'The first administrator could not be created safely. Please retry.',
      },
      { cause },
    );
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const request = {
      requestId: 'request-2028',
      method: 'POST',
      originalUrl: '/platform/settings/company-sensitive-id/first-admin?debug=true',
    };
    const response = { status, getHeader: () => 'request-2028' };
    const host = {
      switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }),
    } as any;
    const filter = new ApiExceptionFilter();
    (filter as any).logger.error = jest.fn();

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(503);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      code: 'FIRST_ADMIN_TEMPORARILY_UNAVAILABLE',
      requestId: 'request-2028',
    }));
    expect((filter as any).logger.error).toHaveBeenCalledTimes(1);
    expect((filter as any).logger.error).toHaveBeenCalledWith({
      event: 'api_request_failed',
      requestId: 'request-2028',
      method: 'POST',
      path: '/platform/settings/:id/first-admin',
      errorName: 'PrismaClientKnownRequestError',
      prismaCode: 'P2028',
    });
    expect(JSON.stringify((filter as any).logger.error.mock.calls)).not.toContain('transaction details');
    expect(JSON.stringify((filter as any).logger.error.mock.calls)).not.toContain('company-sensitive-id');
  });
});

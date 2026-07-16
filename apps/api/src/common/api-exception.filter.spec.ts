import { ForbiddenException } from '@nestjs/common';
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
});

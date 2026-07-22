import { RequestLoggingMiddleware } from './request-logging.middleware';

describe('RequestLoggingMiddleware', () => {
  const originalRequestLogSuccess = process.env.REQUEST_LOG_SUCCESS;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = 'production';
  });

  afterEach(() => {
    if (originalRequestLogSuccess === undefined) delete process.env.REQUEST_LOG_SUCCESS;
    else process.env.REQUEST_LOG_SUCCESS = originalRequestLogSuccess;
    process.env.NODE_ENV = originalNodeEnv;
    jest.restoreAllMocks();
  });

  function run(method = 'GET') {
    let finish: (() => void) | undefined;
    const request = {
      method,
      originalUrl: '/platform/settings/company-id/first-admin?token=secret',
      headers: {},
      socket: {},
    } as any;
    const response = {
      statusCode: 200,
      setHeader: jest.fn(),
      once: jest.fn((_event, callback) => { finish = callback; }),
    } as any;
    const next = jest.fn();

    new RequestLoggingMiddleware().use(request, response, next);
    finish?.();
    return { next, request, response };
  }

  it('keeps successful request logging disabled by default while assigning a request ID', () => {
    delete process.env.REQUEST_LOG_SUCCESS;
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    const result = run();

    expect(result.next).toHaveBeenCalledTimes(1);
    expect(result.request.requestId).toBeDefined();
    expect(result.response.setHeader).toHaveBeenCalledWith('x-request-id', result.request.requestId);
    expect(log).not.toHaveBeenCalled();
  });

  it('never logs CORS preflight requests even when success logging is explicitly enabled', () => {
    process.env.REQUEST_LOG_SUCCESS = 'true';
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    run('OPTIONS');

    expect(log).not.toHaveBeenCalled();
  });
});

import { HttpException, HttpStatus } from '@nestjs/common';
import { RateLimitHeaders } from './rate-limiter';

export class RateLimitExceededException extends HttpException {
  constructor(
    message: string,
    readonly rateLimit: RateLimitHeaders,
  ) {
    super(message, HttpStatus.TOO_MANY_REQUESTS);
  }
}


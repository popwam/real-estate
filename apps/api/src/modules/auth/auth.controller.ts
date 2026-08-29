import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { Response } from 'express';
import { assertRateLimit } from '../../common/rate-limit/rate-limit-check';
import { rateLimitOptionsFromEnv } from '../../common/rate-limit/rate-limit-config';
import { RateLimitExceededException } from '../../common/rate-limit/rate-limit-exceeded.exception';
import { setRateLimitHeaders } from '../../common/rate-limit/rate-limit-headers';
import {
  buildRateLimitKey,
  normalizedEmailForRateLimit,
  requestIpHash,
} from '../../common/rate-limit/rate-limit-keys';
import { RATE_LIMITER } from '../../common/rate-limit/rate-limiter';
import type { RateLimiter } from '../../common/rate-limit/rate-limiter';
import { AuthenticatedRequestUser } from './types/jwt-payload';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterOrganizationDto } from './dto/register-organization.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(RATE_LIMITER) private readonly rateLimiter: RateLimiter,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register an organization and owner user.' })
  @ApiBody({ type: RegisterOrganizationDto })
  async register(
    @Body() dto: RegisterOrganizationDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const key = buildRateLimitKey('auth-register', {
      email: normalizedEmailForRateLimit(dto.email),
      phone: dto.phone,
      ip: requestIpHash(request),
    });

    return this.withRateLimitHeaders(
      response,
      key,
      rateLimitOptionsFromEnv(
        'AUTH_REGISTER_RATE_LIMIT_WINDOW_SECONDS',
        'AUTH_REGISTER_RATE_LIMIT_MAX',
        { windowSeconds: 300, max: 5 },
      ),
      'Too many registration attempts. Please try again shortly.',
      () => this.authService.register(dto),
    );
  }

  @Post('login')
  @ApiOperation({
    summary: 'Login with an email or phone identifier and password.',
  })
  @ApiBody({ type: LoginDto })
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const identifier = dto.identifier ?? dto.email ?? dto.phone;
    const key = buildRateLimitKey('auth-login', {
      identifier: normalizedEmailForRateLimit(identifier),
      ip: requestIpHash(request),
    });

    return this.withRateLimitHeaders(
      response,
      key,
      rateLimitOptionsFromEnv(
        'AUTH_LOGIN_RATE_LIMIT_WINDOW_SECONDS',
        'AUTH_LOGIN_RATE_LIMIT_MAX',
        { windowSeconds: 60, max: 10 },
      ),
      'Too many login attempts. Please try again shortly.',
      () => this.authService.login(dto),
    );
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Rotate a refresh token and issue new tokens.' })
  @ApiBody({ type: RefreshTokenDto })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const key = buildRateLimitKey('auth-refresh', {
      refreshToken: dto.refreshToken,
      ip: requestIpHash(request),
    });

    return this.withRateLimitHeaders(
      response,
      key,
      rateLimitOptionsFromEnv(
        'AUTH_REFRESH_RATE_LIMIT_WINDOW_SECONDS',
        'AUTH_REFRESH_RATE_LIMIT_MAX',
        { windowSeconds: 60, max: 30 },
      ),
      'Too many refresh attempts. Please try again shortly.',
      () => this.authService.refresh(dto),
    );
  }

  @Post('logout')
  @ApiOperation({ summary: 'Revoke a refresh token.' })
  @ApiBody({ type: LogoutDto })
  logout(@Body() dto: LogoutDto) {
    return this.authService.logout(dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('change-password')
  @ApiOperation({ summary: 'Change the current user password.' })
  changePassword(
    @Body() dto: { currentPassword?: string; newPassword?: string },
    @Req() request: Request,
  ) {
    return this.authService.changePassword(
      (request as Request & { user: AuthenticatedRequestUser }).user,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user context.' })
  @Get('me')
  me(@Req() request: Request) {
    return this.authService.me(
      (request as Request & { user: AuthenticatedRequestUser }).user,
    );
  }

  private async withRateLimitHeaders<T>(
    response: Response,
    key: string,
    options: { windowSeconds: number; max: number },
    exceededMessage: string,
    action: () => Promise<T>,
  ) {
    try {
      const rateLimit = await assertRateLimit(
        this.rateLimiter,
        key,
        options,
        exceededMessage,
      );
      setRateLimitHeaders(response, rateLimit);
      return await action();
    } catch (error) {
      if (error instanceof RateLimitExceededException) {
        setRateLimitHeaders(response, error.rateLimit);
      }
      throw error;
    }
  }
}

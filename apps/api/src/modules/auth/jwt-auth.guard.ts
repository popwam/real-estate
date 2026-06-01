import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthenticatedRequestUser } from './types/jwt-payload';
import { JwtService } from './jwt.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext) {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedRequestUser }>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token.');
    }

    const payload = this.jwtService.verifyAccessToken(authHeader.slice(7));

    request.user = {
      userId: payload.userId,
      organizationId: payload.organizationId,
      organizationType: payload.organizationType,
      role: payload.role,
      permissions: payload.permissions,
    };

    return true;
  }
}

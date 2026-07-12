import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../database/prisma.service';
import { AuthenticatedRequestUser } from './types/jwt-payload';
import { JwtService } from './jwt.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedRequestUser }>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token.');
    }

    const payload = this.jwtService.verifyAccessToken(authHeader.slice(7));

    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        organization: { include: { subscription: true } },
        hrEmployeeProfile: true,
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!user?.isActive) {
      throw new UnauthorizedException('User is not active.');
    }

    if (user.organization && ['SUSPENDED', 'REVOKED', 'REJECTED', 'EXPIRED'].includes(user.organization.status)) {
      throw new UnauthorizedException('Organization is not active.');
    }

    if (user.organization && !this.isPlatformRole(user.role?.name ?? payload.role)) {
      if (!['ACTIVE', 'APPROVED'].includes(user.organization.status)) {
        throw new UnauthorizedException('Company is awaiting platform verification.');
      }
      const subscription = user.organization.subscription;
      if (subscription?.status && ['EXPIRED', 'SUSPENDED', 'CANCELLED'].includes(subscription.status)) {
        throw new UnauthorizedException('Subscription expired or suspended.');
      }
      if (subscription?.endsAt && subscription.endsAt <= new Date() && !subscription.autoRenew) {
        throw new UnauthorizedException('Subscription expired or suspended.');
      }
    }

    if (user.hrEmployeeProfile && user.hrEmployeeProfile.status !== 'ACTIVE') {
      throw new UnauthorizedException('Employee is not active.');
    }

    if (
      user.mustChangePassword &&
      !this.passwordChangeAllowedPath(request.path)
    ) {
      throw new UnauthorizedException('Password change is required.');
    }

    const permissions =
      user.role?.permissions.map((rolePermission) => rolePermission.permission.key) ??
      payload.permissions;

    request.user = {
      userId: user.id,
      organizationId: user.organizationId,
      organizationType: user.organization?.type ?? payload.organizationType,
      role: user.role?.name ?? payload.role,
      permissions,
      mustChangePassword: user.mustChangePassword,
    };

    return true;
  }

  private passwordChangeAllowedPath(path: string) {
    return ['/auth/me', '/auth/logout', '/auth/change-password'].includes(path);
  }

  private isPlatformRole(role: string | undefined) {
    return Boolean(role?.startsWith('platform_'));
  }
}

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
import { buildAccessVersion } from './access-version';
import {
  isBlockedOrganizationStatus,
  isOperationalOrganizationStatus,
} from '../../common/organization-status';

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

    if (user.organization && isBlockedOrganizationStatus(user.organization.status)) {
      throw new UnauthorizedException('Organization is not active.');
    }

    if (user.organization && !this.isPlatformRole(user.role?.name ?? payload.role)) {
      if (!isOperationalOrganizationStatus(user.organization.status)) {
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
    const role = user.role?.name ?? payload.role;
    const accessVersion = buildAccessVersion(user);

    request.user = {
      userId: user.id,
      organizationId: user.organizationId,
      organizationType: user.organization?.type ?? payload.organizationType,
      role,
      permissions,
      mustChangePassword: user.mustChangePassword,
      accessVersion,
      session: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role,
          mustChangePassword: user.mustChangePassword,
        },
        organization: {
          id: user.organization?.id ?? null,
          name: user.organization?.name ?? null,
          slug: user.organization?.slug ?? null,
          type: user.organization?.type ?? null,
          status: user.organization?.status ?? null,
          country: user.organization?.country ?? null,
        },
        permissions,
        hrEmployee: user.hrEmployeeProfile
          ? {
              id: user.hrEmployeeProfile.id,
              status: user.hrEmployeeProfile.status,
              attendanceEnabled: user.hrEmployeeProfile.status === 'ACTIVE',
            }
          : null,
        accessVersion,
      },
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

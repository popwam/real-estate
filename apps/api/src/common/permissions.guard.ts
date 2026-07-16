import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PERMISSIONS_KEY } from './permissions.decorator';
import { ROLES_KEY } from './roles.decorator';
import { AuthenticatedRequestUser } from '../modules/auth/types/jwt-payload';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext) {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length && !requiredPermissions?.length) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedRequestUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authenticated user is required.');
    }

    if (requiredRoles?.length && !requiredRoles.includes(user.role)) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'ROLE_REQUIRED',
        message: 'Required role is missing.',
      });
    }

    if (requiredPermissions?.length) {
      const permissions = new Set(user.permissions ?? []);
      const hasAllPermissions = requiredPermissions.every((permission) =>
        this.hasPermission(permissions, permission),
      );

      if (!hasAllPermissions) {
        const requiredPermission = requiredPermissions.find(
          (permission) => !this.hasPermission(permissions, permission),
        );
        throw new ForbiddenException({
          statusCode: 403,
          code: 'PERMISSION_REQUIRED',
          requiredPermission,
          message: 'Required permission is missing.',
        });
      }
    }

    return true;
  }

  private hasPermission(permissions: Set<string>, permission: string) {
    if (permissions.has(permission)) return true;
    if (permission.startsWith('hr.') && permissions.has('hr.manage')) return true;
    if (permission.endsWith('.view') && permissions.has('hr.view')) {
      return permission.startsWith('hr.');
    }
    return false;
  }
}

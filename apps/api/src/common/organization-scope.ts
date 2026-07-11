import {
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthenticatedRequestUser } from '../modules/auth/types/jwt-payload';

const PLATFORM_ROLES = new Set([
  'platform_owner',
  'platform_admin',
  'platform_support',
  'platform_auditor',
  'platform_hr',
]);

export function isPlatformUser(user: AuthenticatedRequestUser | undefined) {
  return Boolean(user?.role && PLATFORM_ROLES.has(user.role));
}

export function requireCurrentOrganizationId(
  user: AuthenticatedRequestUser | undefined,
) {
  if (!user) {
    throw new UnauthorizedException('Missing authenticated user.');
  }

  if (!user.organizationId) {
    throw new ForbiddenException('Current organization is required.');
  }

  return user.organizationId;
}

export function assertSameOrganizationOrPlatform(
  user: AuthenticatedRequestUser | undefined,
  organizationId: string | null | undefined,
) {
  if (!user) {
    throw new UnauthorizedException('Missing authenticated user.');
  }

  if (isPlatformUser(user)) {
    return;
  }

  if (!organizationId || user.organizationId !== organizationId) {
    throw new ForbiddenException('Organization scope violation.');
  }
}

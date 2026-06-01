import { ForbiddenException } from '@nestjs/common';
import { OrganizationType } from '@prisma/client';
import type { AuthenticatedRequestUser } from '../modules/auth/types/jwt-payload';
import { isPlatformUser, requireCurrentOrganizationId } from './organization-scope';

export function requireOperationPermission(
  currentUser: AuthenticatedRequestUser,
  permissions: string[],
) {
  if (!permissions.some((permission) => currentUser.permissions?.includes(permission))) {
    throw new ForbiddenException(`Missing permission: ${permissions[0]}.`);
  }
}

export function operationOrganizationWhere(currentUser: AuthenticatedRequestUser) {
  if (isPlatformUser(currentUser)) {
    return {};
  }

  return { organizationId: requireCurrentOrganizationId(currentUser) };
}

export function requireOperationOrganizationId(
  currentUser: AuthenticatedRequestUser,
) {
  if (isPlatformUser(currentUser)) {
    const organizationId = currentUser.organizationId;
    if (!organizationId) {
      throw new ForbiddenException('Platform organization context is required.');
    }
    return organizationId;
  }

  return requireCurrentOrganizationId(currentUser);
}

export function requireDeveloperOrPlatform(currentUser: AuthenticatedRequestUser) {
  if (isPlatformUser(currentUser)) {
    return;
  }

  if (currentUser.organizationType !== OrganizationType.DEVELOPER) {
    throw new ForbiddenException('This module is available to developer organizations only.');
  }
}

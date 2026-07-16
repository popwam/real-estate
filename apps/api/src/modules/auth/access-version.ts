import { createHash } from 'node:crypto';

export function buildAccessVersion(user: any) {
  const permissions =
    user.role?.permissions
      ?.map((item: any) => item.permission?.key)
      .filter((key: unknown): key is string => typeof key === 'string')
      .sort() ?? [];
  const source = JSON.stringify({
    userId: user.id,
    userUpdatedAt: dateValue(user.updatedAt),
    active: Boolean(user.isActive),
    organizationId: user.organizationId ?? null,
    organizationStatus: user.organization?.status ?? null,
    roleId: user.roleId ?? null,
    roleUpdatedAt: dateValue(user.role?.updatedAt),
    permissions,
  });

  return createHash('sha256').update(source).digest('hex').slice(0, 24);
}

function dateValue(value: unknown) {
  return value instanceof Date ? value.toISOString() : value ?? null;
}

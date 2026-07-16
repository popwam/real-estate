export const OPERATIONAL_ORGANIZATION_STATUSES = [
  'ACTIVE',
  'APPROVED',
] as const;

export const BLOCKED_ORGANIZATION_STATUSES = [
  'SUSPENDED',
  'REVOKED',
  'REJECTED',
  'EXPIRED',
] as const;

export function isOperationalOrganizationStatus(status: string | null | undefined) {
  return OPERATIONAL_ORGANIZATION_STATUSES.includes(
    status as (typeof OPERATIONAL_ORGANIZATION_STATUSES)[number],
  );
}

export function isBlockedOrganizationStatus(status: string | null | undefined) {
  return BLOCKED_ORGANIZATION_STATUSES.includes(
    status as (typeof BLOCKED_ORGANIZATION_STATUSES)[number],
  );
}

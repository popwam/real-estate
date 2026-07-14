import { BadRequestException } from '@nestjs/common';

export const ORGANIZATION_TYPE_CODES = [
  'PLATFORM',
  'DEVELOPER',
  'BROKERAGE',
  'INDIVIDUAL_BROKER',
] as const;

export type CanonicalOrganizationType = (typeof ORGANIZATION_TYPE_CODES)[number];

export const ORGANIZATION_TYPE_METADATA = [
  { code: 'PLATFORM', labelKey: 'organizationTypes.platform' },
  { code: 'DEVELOPER', labelKey: 'organizationTypes.developer' },
  { code: 'BROKERAGE', labelKey: 'organizationTypes.brokerage' },
  { code: 'INDIVIDUAL_BROKER', labelKey: 'organizationTypes.individualBroker' },
] as const satisfies ReadonlyArray<{ code: CanonicalOrganizationType; labelKey: string }>;

export function requireCanonicalOrganizationType(value: unknown): CanonicalOrganizationType {
  if (typeof value === 'string' && ORGANIZATION_TYPE_CODES.includes(value as CanonicalOrganizationType)) {
    return value as CanonicalOrganizationType;
  }
  throw new BadRequestException({
    statusCode: 400,
    code: 'ORGANIZATION_TYPE_INVALID',
    message: 'Organization type is invalid.',
    allowedValues: [...ORGANIZATION_TYPE_CODES],
    receivedValue: typeof value === 'string' ? value.slice(0, 80) : null,
  });
}

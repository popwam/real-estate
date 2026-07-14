export const ORGANIZATION_TYPE_CODES = [
  "PLATFORM",
  "DEVELOPER",
  "BROKERAGE",
  "INDIVIDUAL_BROKER",
] as const;

export type OrganizationTypeCode = (typeof ORGANIZATION_TYPE_CODES)[number];

export type OrganizationTypeOption = {
  code: OrganizationTypeCode;
  labelKey: `organizationTypes.${"platform" | "developer" | "brokerage" | "individualBroker"}`;
};

export function isOrganizationTypeCode(value: unknown): value is OrganizationTypeCode {
  return typeof value === "string" && ORGANIZATION_TYPE_CODES.includes(value as OrganizationTypeCode);
}

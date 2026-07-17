import type { SupportedOrganizationType } from "@/types/platform";

export function verificationPolicyOrganizationTypeOptions(types: SupportedOrganizationType[], locale: string) {
  const localeKey = locale === "ar" || locale === "fr" ? locale : "en";
  return types
    .filter((type) =>
      type.isActive
      && !type.isArchived
      && type.code.toUpperCase() !== "PLATFORM"
      && type.legacyOrganizationType !== "PLATFORM"
    )
    .map((type) => ({
      value: type.id,
      label: type.names?.[localeKey] ?? type.names?.en ?? type.code,
    }));
}

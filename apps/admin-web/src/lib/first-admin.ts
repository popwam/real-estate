export function firstAdminRoleTemplateOptions(type?: string) {
  if (type === "INDIVIDUAL_BROKER") return ["company_owner"] as const;
  if (type === "DEVELOPER" || type === "BROKERAGE") {
    return ["company_owner", "company_admin"] as const;
  }
  return [] as const;
}

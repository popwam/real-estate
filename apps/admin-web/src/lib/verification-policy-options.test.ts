import { describe, expect, it } from "vitest";
import type { SupportedOrganizationType } from "@/types/platform";
import { verificationPolicyOrganizationTypeOptions } from "./verification-policy-options";

const base: SupportedOrganizationType = {
  id: "developer",
  code: "DEVELOPER",
  legacyOrganizationType: "DEVELOPER",
  names: { en: "Developer", ar: "مطور" },
  descriptions: {},
  allowedCountryCodes: [],
  allowedLegalForms: [],
  requiredFieldCodes: [],
  isIndividual: false,
  isActive: true,
  isArchived: false,
  sortOrder: 10,
};

describe("verification policy organization type options", () => {
  it("uses the localized name and dynamic id", () => {
    expect(verificationPolicyOrganizationTypeOptions([base], "ar")).toEqual([
      { value: "developer", label: "مطور" },
    ]);
  });

  it("excludes PLATFORM, inactive, and archived types", () => {
    const options = verificationPolicyOrganizationTypeOptions([
      { ...base, id: "platform", code: "PLATFORM", legacyOrganizationType: "PLATFORM" },
      { ...base, id: "inactive", isActive: false },
      { ...base, id: "archived", isArchived: true },
    ], "en");
    expect(options).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import { firstAdminRoleTemplateOptions } from "@/lib/first-admin";

describe("first admin role templates", () => {
  it.each(["DEVELOPER", "BROKERAGE"])("offers owner and admin for %s", (type) => {
    expect(firstAdminRoleTemplateOptions(type)).toEqual(["company_owner", "company_admin"]);
  });

  it("offers only owner for an individual broker", () => {
    expect(firstAdminRoleTemplateOptions("INDIVIDUAL_BROKER")).toEqual(["company_owner"]);
  });

  it("offers no role through this flow for the Platform organization", () => {
    expect(firstAdminRoleTemplateOptions("PLATFORM")).toEqual([]);
  });
});

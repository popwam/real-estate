import { describe, expect, it } from "vitest";
import { addDays, isDateOnly, organizationDate } from "@/components/hr/team-attendance-section";

describe("team attendance date controls", () => {
  it("uses the organization timezone instead of the browser/UTC calendar date", () => {
    expect(organizationDate(new Date("2026-08-03T01:30:00.000Z"), "America/Los_Angeles")).toBe("2026-08-02");
    expect(organizationDate(new Date("2026-08-03T01:30:00.000Z"), "Asia/Dubai")).toBe("2026-08-03");
  });

  it("moves one calendar day in either direction and validates URL dates", () => {
    expect(addDays("2026-08-03", -1)).toBe("2026-08-02");
    expect(addDays("2026-08-03", 1)).toBe("2026-08-04");
    expect(isDateOnly("2026-08-03")).toBe(true);
    expect(isDateOnly("2026-02-30")).toBe(false);
    expect(isDateOnly("not-a-date")).toBe(false);
  });
});

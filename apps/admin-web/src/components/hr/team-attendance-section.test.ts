import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  isDateOnly,
  isMonthOnly,
  organizationDate,
} from "@/components/hr/team-attendance-section";

describe("team attendance date controls", () => {
  it("uses the organization timezone instead of the browser/UTC calendar date", () => {
    expect(
      organizationDate(
        new Date("2026-08-03T01:30:00.000Z"),
        "America/Los_Angeles",
      ),
    ).toBe("2026-08-02");
    expect(
      organizationDate(new Date("2026-08-03T01:30:00.000Z"), "Asia/Dubai"),
    ).toBe("2026-08-03");
  });

  it("moves one calendar day in either direction and validates URL dates", () => {
    expect(addDays("2026-08-03", -1)).toBe("2026-08-02");
    expect(addDays("2026-08-03", 1)).toBe("2026-08-04");
    expect(isDateOnly("2026-08-03")).toBe(true);
    expect(isDateOnly("2026-02-30")).toBe(false);
    expect(isDateOnly("not-a-date")).toBe(false);
  });

  it("moves between complete calendar months and validates month filters", () => {
    expect(addMonths("2026-01", -1)).toBe("2025-12");
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(isMonthOnly("2026-08")).toBe(true);
    expect(isMonthOnly("2026-13")).toBe(false);
    expect(isMonthOnly("2026-08-01")).toBe(false);
  });
});

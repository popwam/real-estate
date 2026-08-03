import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getAccessToken: () => "token" }));

import { createHrEmployeeAttendanceOverrideApi, getHrEmployeeAttendanceOverrideApi, updateHrEmployeeAttendanceOverrideApi } from "@/lib/hr-employees-api";

const payload = { effectiveFrom: "2026-08-03", effectiveTo: null, timezone: "UTC", weeklyRules: [{ dayOfWeek: 1, isWorkingDay: true, startTime: "09:00", endTime: "17:00", lateUntilMinutes: 15, severeLateUntilMinutes: 60, absentAfterMinutes: 60, earlyLeaveGraceMinutes: 0, overnightShift: false }] };

describe("employee attendance override API client", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(
      JSON.stringify({ id: "override_1", ...payload, isActive: true }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )));
  });

  it("loads the saved override", async () => {
    await getHrEmployeeAttendanceOverrideApi("employee_1");
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain("/hr/employees/employee_1/attendance-override");
  });

  it("uses POST for a new override and PATCH for an existing override", async () => {
    await createHrEmployeeAttendanceOverrideApi("employee_1", payload);
    expect(vi.mocked(fetch).mock.calls[0][1]).toMatchObject({ method: "POST" });
    await updateHrEmployeeAttendanceOverrideApi("employee_1", "override_1", payload);
    expect(vi.mocked(fetch).mock.calls[1][1]).toMatchObject({ method: "PATCH" });
  });
});

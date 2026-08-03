import { describe, expect, it } from "vitest";
import { attendanceActionState } from "@/lib/attendance-action-state";

const ready = {
  isLoading: false, hasError: false, employeeLinked: true, hasOpenAttendance: false,
  isCompleted: false, webCheckInAllowed: true, webWifiBlocked: false,
  eligibleLocationCount: 1, hasSelectedLocation: true,
};

describe("self attendance action state", () => {
  it("shows Check in for one eligible auto-selected location", () => {
    expect(attendanceActionState(ready)).toBe("check-in");
  });
  it("shows Check out only for an open attendance record", () => {
    expect(attendanceActionState({ ...ready, hasOpenAttendance: true })).toBe("check-out");
  });
  it("explains a web policy block instead of silently hiding the action", () => {
    expect(attendanceActionState({ ...ready, webCheckInAllowed: false })).toBe("policy-web-disabled");
    expect(attendanceActionState({ ...ready, webWifiBlocked: true })).toBe("policy-wifi-blocked");
  });
  it("explains a missing active employee link", () => {
    expect(attendanceActionState({ ...ready, employeeLinked: false })).toBe("employee-unlinked");
  });
  it("explains missing eligible locations and unresolved selection", () => {
    expect(attendanceActionState({ ...ready, eligibleLocationCount: 0, hasSelectedLocation: false })).toBe("location-setup-required");
    expect(attendanceActionState({ ...ready, eligibleLocationCount: 2, hasSelectedLocation: false })).toBe("location-selection-required");
  });
});

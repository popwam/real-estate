import { describe, expect, it } from "vitest";
import { attendanceWorkspaceAccess } from "@/components/hr/attendance-workspace";

describe("AttendanceWorkspace access", () => {
  it("gives an active employee the My Attendance tab only", () => {
    expect(attendanceWorkspaceAccess({ permissions: ["hr.attendance.self"], hrEmployee: { id: "employee-1", status: "ACTIVE", attendanceEnabled: true } }))
      .toEqual({ canManage: false, canSelf: true, defaultTab: "self" });
  });

  it("gives a linked HR manager both sections, defaulting to My Attendance", () => {
    expect(attendanceWorkspaceAccess({ permissions: ["hr.attendance.manage"], hrEmployee: { id: "employee-1", status: "ACTIVE", attendanceEnabled: true } }))
      .toEqual({ canManage: true, canSelf: true, defaultTab: "self" });
  });

  it("keeps an unlinked HR manager in the team section without rendering self-service", () => {
    expect(attendanceWorkspaceAccess({ permissions: ["hr.attendance.manage"], hrEmployee: null }))
      .toEqual({ canManage: true, canSelf: false, defaultTab: "team" });
  });

  it("returns a safe no-section state for an unlinked user without attendance access", () => {
    expect(attendanceWorkspaceAccess({ permissions: [], hrEmployee: null }))
      .toEqual({ canManage: false, canSelf: false, defaultTab: "team" });
  });
});

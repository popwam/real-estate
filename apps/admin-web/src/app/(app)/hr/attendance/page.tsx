"use client";

import { AttendanceWorkspace } from "@/components/hr/attendance-workspace";
import { TeamAttendanceSection } from "@/components/hr/team-attendance-section";

/** The single navigation route for employee self-service and HR attendance management. */
export default function HrAttendancePage() {
  return <AttendanceWorkspace teamAttendance={<TeamAttendanceSection queryKey="global-hr-attendance" />} />;
}

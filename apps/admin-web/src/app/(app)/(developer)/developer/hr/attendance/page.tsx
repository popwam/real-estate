"use client";

import { AttendanceWorkspace } from "@/components/hr/attendance-workspace";
import { TeamAttendanceSection } from "@/components/hr/team-attendance-section";

/** Keeps the existing developer URL functional without creating a self-attendance route. */
export default function DeveloperHrAttendancePage() {
  return <AttendanceWorkspace teamAttendance={<TeamAttendanceSection queryKey="hr-attendance" detailBasePath="/developer/hr/attendance" />} />;
}

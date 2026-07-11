import { HrFoundationPage } from "@/components/hr/global-hr-pages";

export default function Page() {
  return <HrFoundationPage pageKey="attendance" permission="hr.attendance.view" sections={["workCalendar", "attendanceLog", "penalties", "assignments", "taskTemplates", "penaltyEdits", "openCheckIns", "checkIns", "openShifts"]} />;
}

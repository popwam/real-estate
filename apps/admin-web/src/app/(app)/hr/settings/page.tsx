import { HrFoundationPage } from "@/components/hr/global-hr-pages";

export default function Page() {
  return <HrFoundationPage pageKey="settings" permission="hr.settings.view" sections={["offices", "departments", "grades", "positions", "accessLevels", "customFields", "announcements", "attendanceProfile", "workSchedules", "leaveBreakProfiles", "holidays", "payrollOptions", "employeeDocuments", "notificationRules", "misc"]} />;
}

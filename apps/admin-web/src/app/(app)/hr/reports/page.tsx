import { HrFoundationPage } from "@/components/hr/global-hr-pages";

export default function Page() {
  return <HrFoundationPage pageKey="reports" permission="hr.reports.view" sections={["monthlyReports", "annualReports", "customReport", "faceReport", "activeEmployeeReport", "reportBuilder"]} />;
}

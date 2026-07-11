import { HrFoundationPage } from "@/components/hr/global-hr-pages";

export default function Page() {
  return <HrFoundationPage pageKey="tasks" permission="hr.tasks.view" sections={["tasks", "assignmentRules"]} />;
}

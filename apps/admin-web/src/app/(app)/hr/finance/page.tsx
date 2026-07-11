import { HrFoundationPage } from "@/components/hr/global-hr-pages";

export default function Page() {
  return <HrFoundationPage pageKey="finance" permission="hr.finance.view" sections={["salaries", "bonuses", "bonusPolicies", "deductions", "deductionPolicies", "loans", "expenses"]} />;
}

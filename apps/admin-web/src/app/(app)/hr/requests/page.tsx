import { HrFoundationPage } from "@/components/hr/global-hr-pages";

export default function Page() {
  return <HrFoundationPage pageKey="requests" permission="hr.requests.view" sections={["inbox", "outgoing", "settings", "requestRules", "approvalLayers", "restrictions", "exchangePolicy"]} />;
}

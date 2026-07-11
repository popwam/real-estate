import { HrFoundationPage } from "@/components/hr/global-hr-pages";

export default function Page() {
  return <HrFoundationPage pageKey="assets" permission="hr.assets.view" sections={["companyAssets", "assetRequests", "assetTypes", "storageLocations", "scrappedAssets", "assetLog"]} />;
}

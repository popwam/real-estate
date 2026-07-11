import { HrFoundationPage } from "@/components/hr/global-hr-pages";

export default function Page() {
  return <HrFoundationPage pageKey="hrDocuments" permission="hr.hr_documents.view" sections={["requests", "issuedLetters", "templates"]} />;
}

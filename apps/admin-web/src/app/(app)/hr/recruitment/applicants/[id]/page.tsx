import { HrApplicantDetailPage } from "@/components/hr/hr-recruitment-pages";

export default async function RecruitmentApplicantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <HrApplicantDetailPage id={id} />;
}

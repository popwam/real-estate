import { HrEmployeeDetailPage } from "@/components/hr/global-hr-pages";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <HrEmployeeDetailPage id={id} />;
}

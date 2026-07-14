import { notFound } from "next/navigation";

export default function HrRecruitmentInterviewsFeatureLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NEXT_PUBLIC_ENABLE_HR_RECRUITMENT_FOUNDATIONS !== "true") notFound();
  return children;
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { BriefcaseBusiness, Plus, UserPlus, UsersRound } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/components/empty-state";
import { FeedbackState } from "@/components/feedback-state";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { PagePermissionGuard } from "@/components/page-permission-guard";
import { DetailCard } from "@/components/platform/detail-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n";
import {
  convertHrApplicantApi,
  createHrApplicantApi,
  createHrApplicantInterviewApi,
  createHrApplicantOfferApi,
  extractHrApplicantDocumentApi,
  getHrApplicantApi,
  getHrRecruitmentSettingsApi,
  getRecruitmentDashboardApi,
  listHrApplicantsApi,
  listHrJobsApi,
  reviewHrApplicantDocumentApi,
  saveHrJobApi,
  updateHrApplicantApi,
  updateHrRecruitmentSettingsApi,
  uploadHrApplicantDocumentApi,
  type HrApplicant,
  type HrApplicantDocument,
  type HrJobOpening,
} from "@/lib/hr-recruitment-api";

const applicantStatuses = [
  "PENDING_REVIEW",
  "DOCUMENTS_MISSING",
  "DOCUMENTS_UNDER_REVIEW",
  "READY_FOR_INTERVIEW",
  "AI_REVIEW_NEEDED",
  "SHORTLISTED",
  "INTERVIEW_SCHEDULED",
  "INTERVIEWED",
  "OFFER_PENDING",
  "OFFER_ACCEPTED",
  "HIRED",
  "REJECTED",
  "WITHDRAWN",
  "CONVERTED_TO_EMPLOYEE",
];

const documentTypes = [
  "CV",
  "GRADUATION_CERTIFICATE",
  "NATIONAL_ID_FRONT",
  "NATIONAL_ID_BACK",
  "PASSPORT",
  "MILITARY_CERTIFICATE",
  "LAST_SALARY_PROOF",
  "EXPERIENCE_CERTIFICATE",
  "PORTFOLIO",
  "OTHER",
];

export function HrRecruitmentDashboardPage() {
  const { t, formatNumber } = useI18n();
  const dashboard = useQuery({ queryKey: ["hr-recruitment-dashboard"], queryFn: () => getRecruitmentDashboardApi() });
  const cards = [
    ["totalApplicants", "hr.recruitment.totalApplicants"],
    ["pendingReview", "hr.recruitment.pendingReview"],
    ["documentsMissing", "hr.recruitment.documentsMissing"],
    ["aiReviewNeeded", "hr.recruitment.aiReviewNeeded"],
    ["shortlisted", "hr.recruitment.shortlisted"],
    ["interviewsToday", "hr.recruitment.interviewsToday"],
    ["offersPending", "hr.recruitment.offersPending"],
    ["convertedThisMonth", "hr.recruitment.convertedThisMonth"],
    ["rejected", "hr.recruitment.rejected"],
  ] as const;
  return (
    <PagePermissionGuard permissions={["hr.recruitment.view"]}>
      <PageHeader
        title={t("hr.recruitment.title")}
        description={t("hr.recruitment.description")}
        actions={<RecruitmentActions />}
      />
      {dashboard.isLoading ? <LoadingState label={t("hr.recruitment.loading")} /> : null}
      {dashboard.error ? <FeedbackState tone="error" title={t("hr.recruitment.loadError")} description={dashboard.error.message} /> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map(([key, label]) => (
          <DetailCard key={key} title={t(label)}>
            <p className="text-3xl font-semibold text-[var(--color-foreground)]">{formatNumber(Number(dashboard.data?.[key] ?? 0))}</p>
          </DetailCard>
        ))}
      </div>
    </PagePermissionGuard>
  );
}

export function HrJobsPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Partial<HrJobOpening>>({ status: "OPEN", publicApplyEnabled: true });
  const jobs = useQuery({ queryKey: ["hr-recruitment-jobs"], queryFn: () => listHrJobsApi() });
  const save = useMutation({
    mutationFn: saveHrJobApi,
    onSuccess: () => {
      setForm({ status: "OPEN", publicApplyEnabled: true });
      queryClient.invalidateQueries({ queryKey: ["hr-recruitment-jobs"] });
    },
  });
  return (
    <PagePermissionGuard permissions={["hr.recruitment.view"]}>
      <PageHeader title={t("hr.recruitment.jobs")} description={t("hr.recruitment.jobsDescription")} actions={<RecruitmentActions />} />
      <DetailCard title={t("hr.recruitment.createJob")}>
        <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" onSubmit={(event) => { event.preventDefault(); save.mutate(form); }}>
          <Field label={t("hr.recruitment.jobTitle")} value={form.title ?? ""} onChange={(value) => setForm((current) => ({ ...current, title: value }))} required />
          <Select label={t("common.status")} value={form.status ?? "OPEN"} onChange={(value) => setForm((current) => ({ ...current, status: value as HrJobOpening["status"] }))} options={["DRAFT", "OPEN", "PAUSED", "CLOSED"]} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.publicApplyEnabled === true} onChange={(event) => setForm((current) => ({ ...current, publicApplyEnabled: event.target.checked }))} />
            {t("hr.recruitment.publicApplyEnabled")}
          </label>
          <div className="flex items-end">
            <Button disabled={save.isPending}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("common.save")}
            </Button>
          </div>
        </form>
      </DetailCard>
      <ListShell loading={jobs.isLoading} error={jobs.error?.message}>
        <div className="grid gap-3 xl:grid-cols-2">
          {(jobs.data ?? []).map((job) => (
            <article key={job.id} className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-[var(--color-foreground)]">{job.title}</h2>
                  <p className="text-sm text-[var(--color-muted)]">{statusText(job.status, t)} · {job.publicApplyEnabled ? t("hr.recruitment.publicApplyEnabled") : t("common.disabled")}</p>
                </div>
                <span className="rounded bg-[var(--color-surface-muted)] px-2 py-1 text-xs text-[var(--color-muted)]">{job._count?.applicants ?? 0}</span>
              </div>
            </article>
          ))}
        </div>
      </ListShell>
    </PagePermissionGuard>
  );
}

export function HrApplicantsPage() {
  const { t, formatDate } = useI18n();
  const [filters, setFilters] = useState<Record<string, string | number>>({ page: 1, pageSize: 10 });
  const applicants = useQuery({ queryKey: ["hr-recruitment-applicants", filters], queryFn: () => listHrApplicantsApi(filters) });
  const page = applicants.data?.page ?? 1;
  const pageSize = applicants.data?.pageSize ?? 10;
  const total = applicants.data?.total ?? 0;
  const maxPage = Math.max(1, Math.ceil(total / pageSize));
  return (
    <PagePermissionGuard permissions={["hr.recruitment.applicants.view"]}>
      <PageHeader title={t("hr.recruitment.applicants")} description={t("hr.recruitment.applicantsDescription")} actions={<RecruitmentActions />} />
      <DetailCard title={t("hr.filters.title")}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Field label={t("common.search")} value={String(filters.search ?? "")} onChange={(value) => setFilters((current) => ({ ...current, search: value, page: 1 }))} />
          <Select label={t("common.status")} value={String(filters.status ?? "")} onChange={(value) => setFilters((current) => ({ ...current, status: value, page: 1 }))} options={["", ...applicantStatuses]} />
          <Select label={t("hr.recruitment.aiReviewStatus")} value={String(filters.aiReviewStatus ?? "")} onChange={(value) => setFilters((current) => ({ ...current, aiReviewStatus: value, page: 1 }))} options={["", "NOT_REQUESTED", "PENDING", "COMPLETED", "FAILED", "NEEDS_MANUAL_REVIEW"]} />
        </div>
      </DetailCard>
      <ListShell loading={applicants.isLoading} error={applicants.error?.message}>
        {!applicants.data?.items.length ? <EmptyState icon={<UsersRound className="h-5 w-5" />} title={t("hr.recruitment.noApplicants")} description={t("hr.recruitment.noApplicantsDescription")} /> : null}
        <div className="grid gap-3 xl:grid-cols-2">
          {(applicants.data?.items ?? []).map((applicant) => (
            <article key={applicant.id} className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-[var(--color-foreground)]">{applicant.fullName}</h2>
                  <p className="text-sm text-[var(--color-muted)]">{applicant.jobOpening?.title ?? t("hr.recruitment.generalApplication")}</p>
                </div>
                <StatusBadge value={applicant.status} />
              </div>
              <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                <Info label={t("common.email")} value={applicant.email ?? t("common.notSet")} />
                <Info label={t("common.phone")} value={applicant.phone ?? t("common.notSet")} />
                <Info label={t("hr.recruitment.aiReviewStatus")} value={statusText(applicant.aiReviewStatus, t)} />
                <Info label={t("hr.recruitment.submittedAt")} value={applicant.submittedAt ? formatDate(applicant.submittedAt) : t("common.notSet")} />
              </div>
              <div className="mt-4">
                <Link className="ui-button ui-button-primary text-xs" href={`/hr/recruitment/applicants/${applicant.id}`}>{t("employeeAccess.manage")}</Link>
              </div>
            </article>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[var(--color-muted)]">{t("hr.recruitment.pagination", { page, maxPage, total })}</p>
          <div className="flex gap-2">
            <Button className="ui-button-secondary" disabled={page <= 1} onClick={() => setFilters((current) => ({ ...current, page: page - 1 }))}>{t("common.previous")}</Button>
            <Button className="ui-button-secondary" disabled={page >= maxPage} onClick={() => setFilters((current) => ({ ...current, page: page + 1 }))}>{t("common.next")}</Button>
          </div>
        </div>
      </ListShell>
    </PagePermissionGuard>
  );
}

export function NewHrApplicantPage() {
  const { t } = useI18n();
  const create = useMutation({ mutationFn: createHrApplicantApi });
  const [form, setForm] = useState<Record<string, unknown>>({ status: "PENDING_REVIEW", source: "INTERNAL_SECRETARY" });
  return (
    <PagePermissionGuard permissions={["hr.recruitment.applicants.manage"]}>
      <PageHeader title={t("hr.recruitment.secretaryIntake")} description={t("hr.recruitment.secretaryIntakeDescription")} actions={<RecruitmentActions />} />
      <ApplicantForm form={form} setForm={setForm} onSubmit={() => create.mutate(form)} pending={create.isPending} />
      {create.data ? <FeedbackState tone="success" title={t("hr.recruitment.applicantCreated")} description={create.data.fullName} /> : null}
      {create.error ? <FeedbackState tone="error" title={t("hr.recruitment.saveError")} description={create.error.message} /> : null}
    </PagePermissionGuard>
  );
}

export function HrApplicantDetailPage({ id }: { id: string }) {
  const { t, formatDate } = useI18n();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("overview");
  const applicant = useQuery({ queryKey: ["hr-recruitment-applicant", id], queryFn: () => getHrApplicantApi(id) });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["hr-recruitment-applicant", id] });
  const updateStatus = useMutation({ mutationFn: (status: string) => updateHrApplicantApi(id, { status }), onSuccess: invalidate });
  const convert = useMutation({ mutationFn: (input: Record<string, unknown>) => convertHrApplicantApi(id, input), onSuccess: invalidate });
  const tabs = ["overview", "personal", "documents", "ai", "interviews", "offer", "activity", "convert"];

  return (
    <PagePermissionGuard permissions={["hr.recruitment.applicants.view"]}>
      <PageHeader title={applicant.data?.fullName ?? t("hr.recruitment.applicant")} description={t("hr.recruitment.applicantNotEmployee")} actions={<RecruitmentActions />} />
      {applicant.isLoading ? <LoadingState label={t("hr.recruitment.loading")} /> : null}
      {applicant.error ? <FeedbackState tone="error" title={t("hr.recruitment.loadError")} description={applicant.error.message} /> : null}
      {applicant.data ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {tabs.map((item) => (
              <Button key={item} className={item === tab ? "ui-button-primary" : "ui-button-secondary"} onClick={() => setTab(item)}>
                {t(`hr.recruitment.tab.${item}`)}
              </Button>
            ))}
          </div>
          {tab === "overview" ? <ApplicantOverview applicant={applicant.data} onStatus={(status) => updateStatus.mutate(status)} /> : null}
          {tab === "personal" ? <PersonalData applicant={applicant.data} /> : null}
          {tab === "documents" ? <ApplicantDocuments applicant={applicant.data} onChanged={invalidate} /> : null}
          {tab === "ai" ? <AiReview applicant={applicant.data} /> : null}
          {tab === "interviews" ? <InterviewPanel applicant={applicant.data} onChanged={invalidate} /> : null}
          {tab === "offer" ? <OfferPanel applicant={applicant.data} onChanged={invalidate} /> : null}
          {tab === "activity" ? <DetailCard title={t("hr.recruitment.activityLog")}><p className="text-sm text-[var(--color-muted)]">{formatDate(applicant.data.updatedAt ?? applicant.data.submittedAt ?? new Date().toISOString())}</p></DetailCard> : null}
          {tab === "convert" ? <ConvertPanel pending={convert.isPending} result={convert.data} error={convert.error?.message} onConvert={(input) => convert.mutate(input)} /> : null}
        </div>
      ) : null}
    </PagePermissionGuard>
  );
}

export function HrRecruitmentSettingsPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const settings = useQuery({ queryKey: ["hr-recruitment-settings"], queryFn: () => getHrRecruitmentSettingsApi() });
  const save = useMutation({ mutationFn: updateHrRecruitmentSettingsApi, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hr-recruitment-settings"] }) });
  const data = settings.data;
  return (
    <PagePermissionGuard permissions={["hr.recruitment.view"]}>
      <PageHeader title={t("hr.recruitment.requiredDocuments")} description={t("hr.recruitment.requiredDocumentsDescription")} actions={<RecruitmentActions />} />
      {settings.isLoading ? <LoadingState label={t("hr.recruitment.loading")} /> : null}
      {data ? (
        <DetailCard title={t("hr.recruitment.requiredDocuments")}>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              ["requiredCv", "hr.recruitment.cv"],
              ["requiredGraduationCertificate", "hr.recruitment.graduationCertificate"],
              ["requiredNationalId", "hr.recruitment.nationalId"],
              ["requiredMilitaryCertificate", "hr.recruitment.militaryCertificate"],
              ["requiredLastSalaryProof", "hr.recruitment.lastSalaryProof"],
              ["requiredExperienceCertificates", "hr.recruitment.experienceCertificate"],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input type="checkbox" defaultChecked={Boolean(data[key as keyof typeof data])} onChange={(event) => save.mutate({ [key]: event.target.checked })} />
                {t(label)}
              </label>
            ))}
          </div>
        </DetailCard>
      ) : null}
    </PagePermissionGuard>
  );
}

export function HrRecruitmentPlaceholderPage({ titleKey }: { titleKey: string }) {
  const { t } = useI18n();
  return (
    <PagePermissionGuard permissions={["hr.recruitment.view"]}>
      <PageHeader title={t(titleKey)} description={t("hr.recruitment.sectionDescription")} actions={<RecruitmentActions />} />
      <DetailCard title={t("hr.recruitment.title")}>
        <p className="text-sm text-[var(--color-muted)]">{t("hr.recruitment.sectionDescription")}</p>
      </DetailCard>
    </PagePermissionGuard>
  );
}

function ApplicantForm({ form, setForm, onSubmit, pending }: { form: Record<string, unknown>; setForm: (value: Record<string, unknown>) => void; onSubmit: () => void; pending: boolean }) {
  const { t } = useI18n();
  const update = (key: string, value: unknown) => setForm({ ...form, [key]: value });
  return (
    <DetailCard title={t("hr.recruitment.walkInApplicant")}>
      <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
        <Field label={t("hr.recruitment.fullName")} value={String(form.fullName ?? "")} onChange={(value) => update("fullName", value)} required />
        <Field label={t("common.email")} value={String(form.email ?? "")} onChange={(value) => update("email", value)} />
        <Field label={t("common.phone")} value={String(form.phone ?? "")} onChange={(value) => update("phone", value)} />
        <Field label={t("hr.recruitment.nationality")} value={String(form.nationalityCountryCode ?? "")} onChange={(value) => update("nationalityCountryCode", value)} />
        <Field label={t("hr.recruitment.lastSalary")} value={String(form.lastSalaryAmount ?? "")} onChange={(value) => update("lastSalaryAmount", value)} />
        <Field label={t("hr.recruitment.lastSalaryCurrency")} value={String(form.lastSalaryCurrency ?? "")} onChange={(value) => update("lastSalaryCurrency", value)} />
        <Field label={t("hr.recruitment.portfolio")} value={String(form.portfolioUrl ?? "")} onChange={(value) => update("portfolioUrl", value)} />
        <Field label={t("hr.recruitment.linkedin")} value={String(form.linkedinUrl ?? "")} onChange={(value) => update("linkedinUrl", value)} />
        <Field label={t("hr.recruitment.notes")} value={String(form.notes ?? "")} onChange={(value) => update("notes", value)} />
        <div className="flex items-end">
          <Button disabled={pending}>
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            {t("hr.recruitment.createApplicant")}
          </Button>
        </div>
      </form>
    </DetailCard>
  );
}

function ApplicantOverview({ applicant, onStatus }: { applicant: HrApplicant; onStatus: (status: string) => void }) {
  const { t } = useI18n();
  return (
    <DetailCard title={t("hr.recruitment.overview")}>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Info label={t("hr.recruitment.status")} value={statusText(applicant.status, t)} />
        <Info label={t("hr.recruitment.source")} value={statusText(applicant.source, t)} />
        <Info label={t("hr.recruitment.jobOpening")} value={applicant.jobOpening?.title ?? t("hr.recruitment.generalApplication")} />
        <Info label={t("hr.recruitment.applicantNotEmployee")} value={t("common.enabled")} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {["DOCUMENTS_MISSING", "DOCUMENTS_UNDER_REVIEW", "READY_FOR_INTERVIEW", "OFFER_PENDING", "REJECTED", "WITHDRAWN"].map((status) => (
          <Button key={status} className="ui-button-secondary text-xs" onClick={() => onStatus(status)}>{statusText(status, t)}</Button>
        ))}
      </div>
    </DetailCard>
  );
}

function PersonalData({ applicant }: { applicant: HrApplicant }) {
  const { t } = useI18n();
  return (
    <DetailCard title={t("hr.recruitment.personalData")}>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Info label={t("hr.recruitment.fullName")} value={applicant.fullName} />
        <Info label={t("common.email")} value={applicant.email ?? t("common.notSet")} />
        <Info label={t("common.phone")} value={applicant.phone ?? t("common.notSet")} />
        <Info label={t("hr.recruitment.nationality")} value={applicant.nationalityCountryCode ?? t("common.notSet")} />
        <Info label={t("hr.recruitment.education")} value={applicant.educationLevel ?? t("common.notSet")} />
        <Info label={t("hr.recruitment.university")} value={applicant.university ?? t("common.notSet")} />
        <Info label={t("hr.recruitment.experienceYears")} value={String(applicant.yearsOfExperience ?? t("common.notSet"))} />
        <Info label={t("hr.recruitment.expectedSalary")} value={String(applicant.expectedSalaryAmount ?? t("common.notSet"))} />
      </div>
    </DetailCard>
  );
}

function ApplicantDocuments({ applicant, onChanged }: { applicant: HrApplicant; onChanged: () => void }) {
  const { t } = useI18n();
  const [documentType, setDocumentType] = useState("CV");
  const upload = useMutation({ mutationFn: uploadHrApplicantDocumentApi, onSuccess: onChanged });
  const extract = useMutation({ mutationFn: (document: HrApplicantDocument) => extractHrApplicantDocumentApi(applicant.id, document.id), onSuccess: onChanged });
  const review = useMutation({ mutationFn: (input: { document: HrApplicantDocument; status: string }) => reviewHrApplicantDocumentApi(applicant.id, input.document.id, { status: input.status }), onSuccess: onChanged });
  return (
    <DetailCard title={t("hr.recruitment.candidateDocuments")}>
      <form className="mb-4 flex flex-wrap items-end gap-3" onSubmit={(event) => event.preventDefault()}>
        <Select label={t("hr.recruitment.documentType")} value={documentType} onChange={setDocumentType} options={documentTypes} />
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-[var(--color-foreground)]">{t("hr.recruitment.uploadOfficialDocument")}</span>
          <Input type="file" onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) upload.mutate({ applicantId: applicant.id, documentType, file });
          }} />
        </label>
      </form>
      <div className="grid gap-3">
        {(applicant.documents ?? []).map((document) => (
          <article key={document.id} className="rounded-md border border-[var(--color-border)] p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-[var(--color-foreground)]">{statusText(document.documentType, t)}</p>
                <p className="text-sm text-[var(--color-muted)]">{statusText(document.status, t)} · {statusText(document.extractionStatus, t)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button className="ui-button-secondary text-xs" disabled={extract.isPending} onClick={() => extract.mutate(document)}>{t("hr.recruitment.extractData")}</Button>
                <Button className="ui-button-secondary text-xs" onClick={() => review.mutate({ document, status: "APPROVED" })}>{t("common.approve")}</Button>
                <Button className="ui-button-secondary text-xs" onClick={() => review.mutate({ document, status: "REJECTED" })}>{t("common.reject")}</Button>
              </div>
            </div>
            {document.extractedData ? <pre className="mt-3 overflow-auto rounded bg-[var(--color-surface-muted)] p-3 text-xs">{JSON.stringify(document.extractedData, null, 2)}</pre> : null}
          </article>
        ))}
      </div>
    </DetailCard>
  );
}

function AiReview({ applicant }: { applicant: HrApplicant }) {
  const { t } = useI18n();
  return (
    <DetailCard title={t("hr.recruitment.aiReview")}>
      <p className="text-sm text-[var(--color-muted)]">{t("hr.recruitment.noFakeAi")}</p>
      <pre className="mt-3 overflow-auto rounded bg-[var(--color-surface-muted)] p-3 text-xs">{JSON.stringify({ aiReviewStatus: applicant.aiReviewStatus, aiReviewSummary: applicant.aiReviewSummary }, null, 2)}</pre>
    </DetailCard>
  );
}

function InterviewPanel({ applicant, onChanged }: { applicant: HrApplicant; onChanged: () => void }) {
  const { t } = useI18n();
  const create = useMutation({ mutationFn: (input: Record<string, unknown>) => createHrApplicantInterviewApi(applicant.id, input), onSuccess: onChanged });
  return <SimpleActionPanel title={t("hr.recruitment.interviews")} button={t("hr.recruitment.scheduleInterview")} onSubmit={(value) => create.mutate({ scheduledAt: value, interviewType: "PHONE" })} records={applicant.interviews ?? []} />;
}

function OfferPanel({ applicant, onChanged }: { applicant: HrApplicant; onChanged: () => void }) {
  const { t } = useI18n();
  const create = useMutation({ mutationFn: (input: Record<string, unknown>) => createHrApplicantOfferApi(applicant.id, input), onSuccess: onChanged });
  return <SimpleActionPanel title={t("hr.recruitment.offers")} button={t("hr.recruitment.createOffer")} onSubmit={(value) => create.mutate({ salaryAmount: value, status: "SENT" })} records={applicant.offers ?? []} />;
}

function ConvertPanel({ pending, result, error, onConvert }: { pending: boolean; result?: { employee: { id: string; name: string }; defaultPassword?: string }; error?: string; onConvert: (input: Record<string, unknown>) => void }) {
  const { t } = useI18n();
  const [form, setForm] = useState<Record<string, unknown>>({ allowLogin: false, paymentFrequency: "MONTHLY" });
  return (
    <DetailCard title={t("hr.recruitment.convertToEmployee")}>
      <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" onSubmit={(event) => { event.preventDefault(); onConvert(form); }}>
        <Field label={t("hr360.office")} value={String(form.officeId ?? "")} onChange={(value) => setForm({ ...form, officeId: value })} />
        <Field label={t("employeeAccess.department")} value={String(form.departmentId ?? "")} onChange={(value) => setForm({ ...form, departmentId: value })} />
        <Field label={t("hr360.position")} value={String(form.positionId ?? "")} onChange={(value) => setForm({ ...form, positionId: value })} />
        <Field label={t("hr.recruitment.salary")} value={String(form.salaryAmount ?? "")} onChange={(value) => setForm({ ...form, salaryAmount: value })} />
        <Field label={t("hr.recruitment.salaryCurrency")} value={String(form.salaryCurrency ?? "")} onChange={(value) => setForm({ ...form, salaryCurrency: value })} />
        <Field label={t("hr.recruitment.startDate")} type="date" value={String(form.startDate ?? "")} onChange={(value) => setForm({ ...form, startDate: value })} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.allowLogin === true} onChange={(event) => setForm({ ...form, allowLogin: event.target.checked })} />
          {t("hr360.allowEmployeeLogin")}
        </label>
        <div className="flex items-end">
          <Button disabled={pending}>{t("hr.recruitment.convertToEmployee")}</Button>
        </div>
      </form>
      {result ? <FeedbackState tone="success" title={t("hr.recruitment.convertedToEmployee")} description={`${result.employee.name}${result.defaultPassword ? ` · ${result.defaultPassword}` : ""}`} /> : null}
      {error ? <FeedbackState tone="error" title={t("hr.recruitment.saveError")} description={error} /> : null}
    </DetailCard>
  );
}

function SimpleActionPanel({ title, button, onSubmit, records }: { title: string; button: string; onSubmit: (value: string) => void; records: Array<Record<string, unknown>> }) {
  const { t } = useI18n();
  const [value, setValue] = useState("");
  return (
    <DetailCard title={title}>
      <form className="mb-4 flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); onSubmit(value); }}>
        <Field label={title} value={value} onChange={setValue} />
        <Button>{button}</Button>
      </form>
      <div className="grid gap-2">
        {records.length ? records.map((record, index) => <pre key={index} className="overflow-auto rounded bg-[var(--color-surface-muted)] p-3 text-xs">{JSON.stringify(record, null, 2)}</pre>) : <p className="text-sm text-[var(--color-muted)]">{t("common.noResults")}</p>}
      </div>
    </DetailCard>
  );
}

function RecruitmentActions() {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap gap-2">
      <Link href="/hr/recruitment/applicants/new"><Button><UserPlus className="h-4 w-4" />{t("hr.recruitment.newApplicant")}</Button></Link>
      <Link href="/hr/recruitment/jobs"><Button className="ui-button-secondary"><BriefcaseBusiness className="h-4 w-4" />{t("hr.recruitment.jobs")}</Button></Link>
    </div>
  );
}

function ListShell({ loading, error, children }: { loading?: boolean; error?: string; children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      {loading ? <LoadingState label={t("hr.recruitment.loading")} /> : null}
      {error ? <FeedbackState tone="error" title={t("hr.recruitment.loadError")} description={error} /> : null}
      {children}
    </div>
  );
}

function Field({ label, value, onChange, required, type = "text" }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium text-[var(--color-foreground)]">{label}</span>
      <Input type={type} value={value} required={required} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium text-[var(--color-foreground)]">{label}</span>
      <select className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option || "All"}</option>)}
      </select>
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs uppercase text-[var(--color-muted)]">{label}</p><p className="font-medium text-[var(--color-foreground)]">{value}</p></div>;
}

function StatusBadge({ value }: { value: string }) {
  const { t } = useI18n();
  return <span className="rounded bg-[var(--color-surface-muted)] px-2 py-1 text-xs font-semibold text-[var(--color-muted)]">{statusText(value, t)}</span>;
}

function statusText(value: string | undefined | null, t: (key: string) => string) {
  if (!value) return t("common.notSet");
  const key = `hr.recruitment.status.${value.toLowerCase()}`;
  const translated = t(key);
  return translated === key ? value.replace(/_/g, " ") : translated;
}

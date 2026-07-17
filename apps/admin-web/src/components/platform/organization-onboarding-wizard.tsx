"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, FileSearch, Upload } from "lucide-react";
import { FeedbackState } from "@/components/feedback-state";
import { LoadingState } from "@/components/loading-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMetadataCountries, useMetadataCurrencies, useMetadataLanguages } from "@/hooks/use-platform-admin";
import { useI18n } from "@/i18n";
import {
  completeOrganizationOnboardingApi,
  createOrganizationOnboardingApi,
  getOnboardingRequiredDocumentsApi,
  listSupportedOrganizationTypesApi,
  reviewOnboardingFieldApi,
  runOnboardingExtractionApi,
  uploadOnboardingDocumentApi,
} from "@/lib/api";
import { localizedApiError } from "@/lib/api-errors";
import type { OrganizationOnboardingSession, RequiredDocumentPolicy } from "@/types/platform";

export function OrganizationOnboardingWizard() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const countries = useMetadataCountries();
  const currencies = useMetadataCurrencies();
  const languages = useMetadataLanguages();
  const types = useQuery({ queryKey: ["platform", "supported-organization-types"], queryFn: listSupportedOrganizationTypesApi });
  const [session, setSession] = useState<OrganizationOnboardingSession | null>(null);
  const [policies, setPolicies] = useState<RequiredDocumentPolicy[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const create = useMutation({ mutationFn: createOrganizationOnboardingApi, onSuccess: async (created) => { setSession(created); const required = await getOnboardingRequiredDocumentsApi(created.id); setPolicies(required); setSelectedPolicy(required[0]?.id ?? ""); } });
  const upload = useMutation({ mutationFn: async () => {
    if (!session || !file) throw new Error("A document file is required.");
    const policy = policies.find((item) => item.id === selectedPolicy);
    if (!policy) throw new Error("Select a required document.");
    const document = await uploadOnboardingDocumentApi(session.id, { file, documentType: policy.documentType, policyId: policy.id });
    return runOnboardingExtractionApi(session.id, document.id);
  }, onSuccess: (updated) => { setSession(updated); setFile(null); } });
  const review = useMutation({ mutationFn: async (input: { evidenceId: string; action: "CONFIRMED" | "CORRECTED" | "REJECTED"; finalValue?: string; reason?: string }) => {
    if (!session) return;
    await reviewOnboardingFieldApi(session.id, input.evidenceId, input);
    const refreshed = await runRefresh(session.id);
    setSession(refreshed);
  } });
  const complete = useMutation({ mutationFn: () => completeOrganizationOnboardingApi(session!.id), onSuccess: (organization) => router.push(`/platform/organizations/${organization.id}`) });
  const busy = create.isPending || upload.isPending || review.isPending || complete.isPending;
  const error = create.error ?? upload.error ?? review.error ?? complete.error;

  async function start(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await create.mutateAsync({
      countryCode: String(form.get("countryCode") ?? ""),
      supportedOrganizationTypeId: String(form.get("supportedOrganizationTypeId") ?? ""),
      legalForm: String(form.get("legalForm") ?? "") || undefined,
      operationalData: {
        displayName: String(form.get("displayName") ?? ""),
        preferredLanguage: String(form.get("preferredLanguage") ?? ""),
        currency: String(form.get("currency") ?? ""),
      },
    });
  }

  if (types.isLoading || countries.isLoading || currencies.isLoading || languages.isLoading) return <LoadingState label={t("common.loading")} />;
  const availableTypes = (types.data ?? []).filter((item) => item.isActive && !item.isArchived && item.legacyOrganizationType !== "PLATFORM");
  const currentPolicy = policies.find((item) => item.id === selectedPolicy);
  const visibleEvidence = session?.fieldEvidence.filter((item) => item.reviewStatus !== "REJECTED") ?? [];

  return <div className="space-y-5">
    <ol className="grid gap-2 sm:grid-cols-4" aria-label="Onboarding progress">
      {["Selection", "Documents", "Review", "Create"].map((label, index) => <li key={label} className={`rounded-[var(--radius-md)] border p-3 text-sm ${step(session) >= index + 1 ? "border-[var(--color-accent)] text-[var(--color-accent)]" : "border-[var(--color-border)] text-[var(--color-muted)]"}`}>{index + 1}. {label}</li>)}
    </ol>

    {!session ? <form className="ui-card grid gap-4 p-5 sm:grid-cols-2" onSubmit={start}>
      <Select label={t("provisioning.country")} name="countryCode" required options={(countries.data ?? []).map((item) => ({ value: item.code ?? item.countryCode ?? "", label: item.label ?? item.name?.[locale] ?? item.name?.en ?? item.code ?? "" })).filter((item) => item.value)} />
      <Select label={t("provisioning.organizationType")} name="supportedOrganizationTypeId" required options={availableTypes.map((item) => ({ value: item.id, label: item.names?.[locale] ?? item.names?.en ?? item.code }))} />
      <Select label={t("provisioning.legalForm")} name="legalForm" options={[{ value: "", label: t("common.optional") }, ...["SOLE_PROPRIETORSHIP", "LLC", "JOINT_STOCK", "PARTNERSHIP", "BRANCH", "OTHER"].map((value) => ({ value, label: value }))]} />
      <Field label={t("organizationOnboarding.workingName")} name="displayName" required />
      <Select label={t("provisioning.defaultLanguage")} name="preferredLanguage" required options={(languages.data ?? []).map((item) => ({ value: item.code ?? "", label: item.label ?? item.name?.[locale] ?? item.name?.en ?? item.code ?? "" })).filter((item) => item.value)} />
      <Select label={t("provisioning.currency")} name="currency" required options={(currencies.data ?? []).map((item) => ({ value: item.code ?? "", label: item.label ?? item.name?.[locale] ?? item.name?.en ?? item.code ?? "" })).filter((item) => item.value)} />
      <p className="sm:col-span-2 text-sm text-[var(--color-muted)]">Legal name, registration, tax, incorporation, and legal address fields are populated only from reviewed document evidence.</p>
      <div className="sm:col-span-2 flex justify-end"><Button type="submit" disabled={busy}><FileSearch className="h-4 w-4" />{t("organizationOnboarding.continueToDocuments")}</Button></div>
    </form> : null}

    {session && policies.length > 0 && session.status !== "READY_TO_CREATE" && session.status !== "COMPLETED" ? <section className="ui-card space-y-4 p-5">
      <div><h2 className="font-semibold">Required documents</h2><p className="text-sm text-[var(--color-muted)]">Requirements come only from the active policy for {session.countryCode}; no default documents are injected.</p></div>
      <Select label={t("provisioning.documentType")} name="policy" value={selectedPolicy} onChange={setSelectedPolicy} options={policies.map((policy) => ({ value: policy.id, label: `${policy.documentType} · ${policy.requiredFieldCodes.join(", ") || "No mapped fields"}` }))} />
      {currentPolicy ? <p className="text-sm text-[var(--color-muted)]">Accepted: {currentPolicy.acceptedMimeTypes.join(", ")} · max {currentPolicy.maxFileSizeMb} MB · confidence {String(currentPolicy.minimumConfidence ?? 0.9)}</p> : null}
      <label className="block space-y-2"><Label htmlFor="onboarding-document">Document file</Label><Input id="onboarding-document" type="file" accept={currentPolicy?.acceptedMimeTypes.join(",")} onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label>
      <Button type="button" disabled={!file || busy} onClick={() => upload.mutate()}><Upload className="h-4 w-4" />{upload.isPending ? "Processing…" : "Upload and run extraction"}</Button>
      {session.documents.length ? <div className="space-y-2">{session.documents.map((document) => <div key={document.id} className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 text-sm"><strong>{document.documentType}</strong> · {document.qualityStatus} · {document.extractionStatus}</div>)}</div> : null}
    </section> : null}

    {session && (visibleEvidence.length > 0 || session.status === "READY_TO_CREATE") ? <section className="ui-card space-y-4 p-5">
      <div><h2 className="font-semibold">Review extracted fields</h2><p className="text-sm text-[var(--color-muted)]">Confirm, correct, or reject each value. Every correction is audited and its document source remains available.</p></div>
      <div className="space-y-2">{visibleEvidence.map((field) => <div key={field.id} className="grid gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 lg:grid-cols-[1fr_2fr_auto] lg:items-center">
        <div><strong className="text-sm">{field.fieldCode}</strong><p className="text-xs text-[var(--color-muted)]">{field.documentType} · confidence {String(field.confidence ?? "—")} · {field.reviewStatus}</p></div>
        <p className="text-sm">{field.finalValue ?? field.normalizedValue ?? field.rawValue ?? "—"}</p>
        <div className="flex flex-wrap gap-2"><Button className="ui-button-secondary" type="button" disabled={busy} onClick={() => review.mutate({ evidenceId: field.id, action: "CONFIRMED" })}>Confirm</Button><Button className="ui-button-secondary" type="button" disabled={busy} onClick={() => { const value = window.prompt("Corrected value", field.normalizedValue ?? field.rawValue ?? ""); if (value !== null) review.mutate({ evidenceId: field.id, action: "CORRECTED", finalValue: value, reason: "Platform owner correction" }); }}>Correct</Button><Button className="ui-button-danger" type="button" disabled={busy} onClick={() => review.mutate({ evidenceId: field.id, action: "REJECTED" })}>Reject</Button></div>
      </div>)}</div>
      <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 text-sm"><p>Missing: {session.missingFields.join(", ") || "none"}</p><p>Conflicts: {session.conflictFields.join(", ") || "none"}</p></div>
      <div className="flex justify-end"><Button type="button" disabled={busy || session.status !== "READY_TO_CREATE"} onClick={() => complete.mutate()}><CheckCircle2 className="h-4 w-4" />Create organization</Button></div>
    </section> : null}

    {session && policies.length === 0 ? <FeedbackState tone="success" title="No verification policy" description="No documents are required for this country and organization type. The draft is ready for final creation." action={<Button type="button" disabled={busy} onClick={() => complete.mutate()}>Create organization</Button>} /> : null}
    {error ? <FeedbackState tone="error" title={t("organizationCreate.error")} description={localizedApiError(error, t)} /> : null}
  </div>;
}

async function runRefresh(id: string) {
  const { getOrganizationOnboardingApi } = await import("@/lib/api");
  return getOrganizationOnboardingApi(id);
}

function step(session: OrganizationOnboardingSession | null) { if (!session) return 1; if (session.status === "READY_TO_CREATE") return 4; if (session.fieldEvidence.length) return 3; return 2; }

function Field({ label, name, required }: { label: string; name: string; required?: boolean }) { return <label className="space-y-2"><Label htmlFor={`onboarding-${name}`}>{label}</Label><Input id={`onboarding-${name}`} name={name} required={required} /></label>; }
function Select({ label, name, options, required, value, onChange }: { label: string; name: string; options: Array<{ value: string; label: string }>; required?: boolean; value?: string; onChange?: (value: string) => void }) { return <label className="space-y-2"><Label htmlFor={`onboarding-${name}`}>{label}</Label><select id={`onboarding-${name}`} name={name} className="ui-input" required={required} value={value} onChange={onChange ? (event) => onChange(event.target.value) : undefined}><option value="">{label}</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>; }

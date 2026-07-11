"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Check, ChevronLeft, ChevronRight, KeyRound, Save, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { DetailCard, DetailGrid } from "@/components/platform/detail-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useI18n } from "@/i18n";
import { listOrganizationsApi } from "@/lib/api";
import type { HrEmployee, HrEmployeeInput } from "@/lib/hr-employees-api";
import { employeePermissionKeys } from "@/lib/hr-employees-api";
import { isPlatformRole } from "@/lib/permissions";
import {
  EMPLOYEE_PERMISSION_GROUPS,
  EMPLOYEE_ROLE_OPTIONS,
  PERMISSION_LABEL_KEYS,
} from "@/components/hr/employee-permission-data";

export type EmployeeFormValues = HrEmployeeInput & {
  permissions: string[];
  identifiers?: Array<Record<string, unknown>>;
};

type StepId =
  | "personal"
  | "contact"
  | "country"
  | "job"
  | "schedule"
  | "payroll"
  | "documents"
  | "permissions"
  | "review";

const steps: Array<{ id: StepId; labelKey: string }> = [
  { id: "personal", labelKey: "hr360.step.personal" },
  { id: "contact", labelKey: "hr360.step.contact" },
  { id: "country", labelKey: "hr360.step.country" },
  { id: "job", labelKey: "hr360.step.job" },
  { id: "schedule", labelKey: "hr360.step.schedule" },
  { id: "payroll", labelKey: "hr360.step.payroll" },
  { id: "documents", labelKey: "hr360.step.documents" },
  { id: "permissions", labelKey: "hr360.step.permissions" },
  { id: "review", labelKey: "hr360.step.review" },
];

export function EmployeeForm({
  employee,
  mode,
  isSaving,
  onSubmit,
}: {
  employee?: HrEmployee | null;
  mode: "create" | "edit";
  isSaving?: boolean;
  onSubmit: (values: EmployeeFormValues) => Promise<void>;
}) {
  const { t } = useI18n();
  const { data } = useCurrentUser();
  const isPlatform = isPlatformRole(data?.user.role);
  const organizations = useQuery({
    queryKey: ["organizations", "employee-form"],
    queryFn: listOrganizationsApi,
    enabled: isPlatform && mode === "create",
  });
  const existingPermissions = useMemo(() => employeePermissionKeys(employee), [employee]);
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<EmployeeFormValues>(() => ({
    firstName: employee?.user?.firstName ?? firstNameFromName(employee?.name),
    lastName: employee?.user?.lastName ?? lastNameFromName(employee?.name),
    name: employee?.name ?? "",
    legalName: employee?.legalName ?? employee?.name ?? "",
    displayName: employee?.displayName ?? employee?.name ?? "",
    localizedNames: employee?.localizedNames ?? {},
    photoFileId: employee?.photoFileId ?? "",
    faceReferenceFileId: employee?.faceReferenceFileId ?? "",
    faceVerificationConsent: Boolean(employee?.faceVerificationConsent),
    faceVerificationStatus: employee?.faceVerificationStatus ?? "NOT_CONFIGURED",
    maritalStatus: employee?.maritalStatus ?? "",
    gender: employee?.gender ?? "",
    dateOfBirth: dateInput(employee?.dateOfBirth),
    nationalityCountryCode: employee?.nationalityCountryCode ?? "",
    residenceCountryCode: employee?.residenceCountryCode ?? "",
    employeeIdentifierType: employee?.identifiers?.[0]?.type ?? "NATIONAL_ID",
    employeeIdentifierCountryCode: employee?.identifiers?.[0]?.countryCode ?? "",
    employeeIdentifierValue: employee?.identifiers?.[0]?.value ?? "",
    employeeIdentifierExpiresAt: dateInput(employee?.identifiers?.[0]?.expiresAt),
    disabilityStatus: employee?.disabilityStatus ?? "NONE",
    hasDisability: Boolean(employee?.hasDisability),
    disabilityNotes: "",
    workStartDate: dateInput(employee?.workStartDate),
    hireDate: dateInput(employee?.hireDate),
    isUnderProbation: Boolean(employee?.isUnderProbation),
    probationEndDate: dateInput(employee?.probationEndDate),
    employeeCode: employee?.employeeCode ?? "",
    phone: employee?.phone ?? employee?.user?.phone ?? "",
    email: employee?.email ?? employee?.user?.email ?? "",
    allowLogin: employee?.loginEnabled ?? true,
    loginEnabled: employee?.loginEnabled ?? true,
    preferredContactMethod: "EMAIL",
    emergencyContactName: "",
    emergencyContactPhone: "",
    preferredLanguage: employee?.preferredLanguage ?? "en",
    timezone: employee?.timezone ?? "",
    locale: employee?.locale ?? "",
    currency: employee?.currency ?? "",
    jobTitle: employee?.jobTitle ?? employee?.roleTitle ?? "",
    roleTitle: employee?.roleTitle ?? employee?.jobTitle ?? "",
    departmentId: employee?.departmentId ?? "",
    officeId: employee?.officeId ?? "",
    branchId: employee?.branchId ?? "",
    positionId: employee?.positionId ?? "",
    jobLevelId: employee?.jobLevelId ?? "",
    employmentType: employee?.employmentType ?? "FULL_TIME",
    contractType: employee?.contractType ?? "",
    directManagerId: employee?.directManagerId ?? "",
    secondaryManagerId: employee?.secondaryManagerId ?? "",
    workGroupId: employee?.workGroupId ?? "",
    teamId: employee?.teamId ?? "",
    role: initialRole(employee?.user?.role?.name),
    accessLevel: "",
    workScheduleType: employee?.workScheduleType ?? "FIXED_OFFICE_HOURS",
    workScheduleId: employee?.workScheduleId ?? "",
    shiftGroupId: employee?.shiftGroupId ?? "",
    attendanceProfileId: employee?.attendanceProfileId ?? "",
    leaveProfileId: employee?.leaveProfileId ?? "",
    breakProfileId: employee?.breakProfileId ?? "",
    allowedAttendanceLocationId: employee?.allowedAttendanceLocationId ?? "",
    exactRadiusMeters: employee?.exactRadiusMeters ?? "",
    expandedRadiusMeters: employee?.expandedRadiusMeters ?? "",
    webCheckInAllowed: employee?.webCheckInAllowed ?? true,
    mobileCheckInAllowed: employee?.mobileCheckInAllowed ?? true,
    requireLivePhoto: employee?.requireLivePhoto ?? false,
    requireFaceVerification: employee?.requireFaceVerification ?? false,
    requireDvrReview: employee?.requireDvrReview ?? false,
    webWifiPolicy: employee?.webWifiPolicy ?? "MANUAL_REVIEW",
    remoteWorkAllowed: employee?.remoteWorkAllowed ?? false,
    holidayWorkPolicy: employee?.holidayWorkPolicy ?? "",
    salaryAmount: employee?.salaryAmount ?? "",
    salaryCurrency: employee?.salaryCurrency ?? employee?.currency ?? "",
    paymentFrequency: employee?.paymentFrequency ?? "MONTHLY",
    paymentMethod: employee?.paymentMethod ?? "BANK_TRANSFER",
    payrollProfileId: employee?.payrollProfileId ?? "",
    allowancesProfileId: employee?.allowancesProfileId ?? "",
    deductionsProfileId: employee?.deductionsProfileId ?? "",
    requiredDocumentType: "",
    requiredDocumentExpiresAt: "",
    documentAiReviewStatus: "NOT_REVIEWED",
    temporaryPassword: mode === "create" ? "123456" : "",
    status: employee?.status ?? "ACTIVE",
    organizationId: employee?.organization?.id ?? "",
    phoneCountry: data?.organization?.country ?? "",
    permissions: existingPermissions,
  }));

  const selectedOrganizationCountry =
    organizations.data?.find((organization) => organization.id === values.organizationId)?.country ??
    data?.organization?.country ??
    "";
  const roleOptions = EMPLOYEE_ROLE_OPTIONS.filter((role) => isPlatform || !role.startsWith("platform_"));
  const visibleGroups = EMPLOYEE_PERMISSION_GROUPS.filter(
    (group) => !("platformOnly" in group) || !group.platformOnly || isPlatform,
  );
  const currentStep = steps[stepIndex];

  function update<K extends keyof EmployeeFormValues>(key: K, value: EmployeeFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function togglePermission(permission: string) {
    setValues((current) => {
      const exists = current.permissions.includes(permission);
      return {
        ...current,
        permissions: exists
          ? current.permissions.filter((item) => item !== permission)
          : [...current.permissions, permission],
      };
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const identifiers =
      values.employeeIdentifierValue
        ? [
            {
              type: values.employeeIdentifierType,
              countryCode: values.employeeIdentifierCountryCode,
              value: values.employeeIdentifierValue,
              expiresAt: values.employeeIdentifierExpiresAt,
              isPrimary: true,
              verificationStatus: "NOT_REVIEWED",
            },
          ]
        : [];
    await onSubmit({
      ...values,
      name: values.name || [values.firstName, values.lastName].filter(Boolean).join(" "),
      roleTitle: values.jobTitle,
      loginEnabled: values.allowLogin,
      temporaryPassword: values.temporaryPassword || undefined,
      departmentId: values.departmentId || undefined,
      organizationId: isPlatform ? values.organizationId || undefined : undefined,
      phoneCountry: values.phoneCountry || selectedOrganizationCountry,
      identifiers,
    });
  }

  return (
    <form className="space-y-6" onSubmit={submit}>
      <div className="overflow-x-auto rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-2">
        <div className="flex min-w-max gap-2">
          {steps.map((step, index) => (
            <button
              key={step.id}
              type="button"
              className={`rounded-md px-3 py-2 text-xs font-semibold ${
                index === stepIndex
                  ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                  : "text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)]"
              }`}
              onClick={() => setStepIndex(index)}
            >
              {index < stepIndex ? <Check className="mr-1 inline h-3 w-3" aria-hidden="true" /> : null}
              {t(step.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <DetailCard title={t(currentStep.labelKey)}>
        {currentStep.id === "personal" ? (
          <FieldGrid>
            <TextField id="photoFileId" label={t("hr360.photoFileId")} value={values.photoFileId} update={update} />
            <TextField id="faceReferenceFileId" label={t("hr360.faceReferenceFileId")} value={values.faceReferenceFileId} update={update} />
            <SelectField id="faceVerificationStatus" label={t("hr360.faceVerificationStatus")} value={values.faceVerificationStatus} update={update} options={["NOT_CONFIGURED", "PENDING_REVIEW", "APPROVED", "REJECTED"]} t={t} />
            <CheckboxField id="faceVerificationConsent" label={t("hr360.faceVerificationConsent")} value={Boolean(values.faceVerificationConsent)} update={update} />
            <TextField id="legalName" label={t("hr360.legalName")} value={values.legalName} update={update} required />
            <TextField id="displayName" label={t("hr360.displayName")} value={values.displayName} update={update} />
            <TextField id="name" label={t("hr360.employeeName")} value={values.name} update={update} />
            <TextField id="localizedNames.ar" label={t("hr360.arabicName")} value={(values.localizedNames as Record<string, string>)?.ar ?? ""} update={(_, value) => update("localizedNames", { ...(values.localizedNames as object), ar: value })} />
            <TextField id="localizedNames.en" label={t("hr360.englishName")} value={(values.localizedNames as Record<string, string>)?.en ?? ""} update={(_, value) => update("localizedNames", { ...(values.localizedNames as object), en: value })} />
            <TextField id="localizedNames.fr" label={t("hr360.frenchName")} value={(values.localizedNames as Record<string, string>)?.fr ?? ""} update={(_, value) => update("localizedNames", { ...(values.localizedNames as object), fr: value })} />
            <SelectField id="gender" label={t("hr360.gender")} value={values.gender} update={update} options={["", "MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]} t={t} />
            <SelectField id="maritalStatus" label={t("hr360.maritalStatus")} value={values.maritalStatus} update={update} options={["", "SINGLE", "MARRIED", "DIVORCED", "WIDOWED", "PREFER_NOT_TO_SAY"]} t={t} />
            <TextField id="dateOfBirth" label={t("hr360.dateOfBirth")} type="date" value={values.dateOfBirth} update={update} />
            <TextField id="nationalityCountryCode" label={t("hr360.nationality")} value={values.nationalityCountryCode} update={update} />
            <TextField id="residenceCountryCode" label={t("hr360.countryOfResidence")} value={values.residenceCountryCode} update={update} />
            <SelectField id="employeeIdentifierType" label={t("hr360.identifierType")} value={values.employeeIdentifierType} update={update} options={["NATIONAL_ID", "PASSPORT", "RESIDENCE_ID", "TAX_ID", "WORK_PERMIT", "OTHER"]} t={t} />
            <TextField id="employeeIdentifierCountryCode" label={t("hr360.identifierCountry")} value={values.employeeIdentifierCountryCode} update={update} />
            <TextField id="employeeIdentifierValue" label={t("hr360.identifierValue")} value={values.employeeIdentifierValue} update={update} />
            <TextField id="employeeIdentifierExpiresAt" label={t("hr360.identifierExpiry")} type="date" value={values.employeeIdentifierExpiresAt} update={update} />
            <SelectField id="disabilityStatus" label={t("hr360.disabilityStatus")} value={values.disabilityStatus} update={update} options={["NONE", "HAS_DISABILITY", "PREFER_NOT_TO_SAY"]} t={t} />
            <CheckboxField id="hasDisability" label={t("hr360.hasDisability")} value={Boolean(values.hasDisability)} update={update} />
            <TextField id="workStartDate" label={t("hr360.workStartDate")} type="date" value={values.workStartDate} update={update} />
            <TextField id="hireDate" label={t("hr360.hireDate")} type="date" value={values.hireDate} update={update} />
            <CheckboxField id="isUnderProbation" label={t("hr360.underProbation")} value={Boolean(values.isUnderProbation)} update={update} />
            <TextField id="probationEndDate" label={t("hr360.probationEndDate")} type="date" value={values.probationEndDate} update={update} />
            <TextField id="employeeCode" label={t("hr360.employeeCode")} value={values.employeeCode} update={update} />
          </FieldGrid>
        ) : null}

        {currentStep.id === "contact" ? (
          <FieldGrid>
            {isPlatform && mode === "create" ? (
              <Field label={t("employeeAccess.organization")} id="organizationId">
                <select id="organizationId" className="ui-input" value={values.organizationId ?? ""} onChange={(event) => update("organizationId", event.target.value)}>
                  <option value="">{t("employeeAccess.selectOrganization")}</option>
                  {(organizations.data ?? []).map((organization) => (
                    <option key={organization.id} value={organization.id}>{organization.name}</option>
                  ))}
                </select>
              </Field>
            ) : null}
            <TextField id="firstName" label={t("employeeAccess.firstName")} value={values.firstName} update={update} />
            <TextField id="lastName" label={t("employeeAccess.lastName")} value={values.lastName} update={update} />
            <TextField id="phoneCountry" label={t("employeeAccess.country")} value={values.phoneCountry || selectedOrganizationCountry} update={update} />
            <TextField id="phone" label={t("employeeAccess.phone")} value={values.phone} update={update} />
            <TextField id="email" label={t("employeeAccess.email")} type="email" value={values.email} update={update} />
            <CheckboxField id="allowLogin" label={t("hr360.allowEmployeeLogin")} value={Boolean(values.allowLogin)} update={update} />
            <Field label={t("hr360.loginIdentifierPreview")} id="loginPreview">
              <div className="ui-input bg-[var(--color-surface-muted)]">{values.email || values.phone || t("common.notSet")}</div>
            </Field>
            <SelectField id="preferredContactMethod" label={t("hr360.preferredContactMethod")} value={values.preferredContactMethod} update={update} options={["EMAIL", "PHONE", "WHATSAPP"]} t={t} />
            <TextField id="emergencyContactName" label={t("hr360.emergencyContactName")} value={values.emergencyContactName} update={update} />
            <TextField id="emergencyContactPhone" label={t("hr360.emergencyContactPhone")} value={values.emergencyContactPhone} update={update} />
            <TextField id="temporaryPassword" label={mode === "create" ? t("employeeAccess.temporaryPassword") : t("employeeAccess.newPasswordOptional")} type="password" value={values.temporaryPassword} update={update} />
          </FieldGrid>
        ) : null}

        {currentStep.id === "country" ? (
          <FieldGrid>
            <TextField id="residenceCountryCode" label={t("hr360.employeeCountry")} value={values.residenceCountryCode} update={update} />
            <TextField id="nationalityCountryCode" label={t("hr360.nationality")} value={values.nationalityCountryCode} update={update} />
            <SelectField id="preferredLanguage" label={t("hr360.preferredLanguage")} value={values.preferredLanguage} update={update} options={["en", "ar", "fr"]} t={t} />
            <TextField id="timezone" label={t("hr360.timezone")} value={values.timezone} update={update} />
            <TextField id="locale" label={t("hr360.locale")} value={values.locale} update={update} />
            <TextField id="currency" label={t("hr360.currency")} value={values.currency} update={update} />
          </FieldGrid>
        ) : null}

        {currentStep.id === "job" ? (
          <FieldGrid>
            <TextField id="officeId" label={t("hr360.office")} value={values.officeId} update={update} />
            <TextField id="branchId" label={t("hr360.branch")} value={values.branchId} update={update} />
            <TextField id="departmentId" label={t("employeeAccess.department")} value={values.departmentId} update={update} />
            <TextField id="positionId" label={t("hr360.position")} value={values.positionId} update={update} />
            <TextField id="jobTitle" label={t("employeeAccess.jobTitle")} value={values.jobTitle} update={update} />
            <TextField id="jobLevelId" label={t("hr360.jobLevel")} value={values.jobLevelId} update={update} />
            <SelectField id="employmentType" label={t("hr360.employmentType")} value={values.employmentType} update={update} options={["FULL_TIME", "PART_TIME", "CONTRACTOR", "TRAINEE", "TEMPORARY", "INTERN"]} t={t} />
            <TextField id="contractType" label={t("hr360.contractType")} value={values.contractType} update={update} />
            <TextField id="directManagerId" label={t("hr360.directManager")} value={values.directManagerId} update={update} />
            <TextField id="secondaryManagerId" label={t("hr360.secondaryManager")} value={values.secondaryManagerId} update={update} />
            <TextField id="workGroupId" label={t("hr360.workGroup")} value={values.workGroupId} update={update} />
            <TextField id="teamId" label={t("hr360.team")} value={values.teamId} update={update} />
            <SelectField id="role" label={t("employeeAccess.role")} value={values.role} update={update} options={roleOptions as unknown as string[]} t={t} prefix="employeeAccess.role." />
            <TextField id="accessLevel" label={t("hr360.accessLevel")} value={values.accessLevel} update={update} />
            <SelectField id="status" label={t("employeeAccess.status")} value={values.status} update={update} options={["ACTIVE", "INACTIVE"]} t={t} />
          </FieldGrid>
        ) : null}

        {currentStep.id === "schedule" ? (
          <FieldGrid>
            <SelectField id="workScheduleType" label={t("hr360.workMode")} value={values.workScheduleType} update={update} options={["FIXED_OFFICE_HOURS", "SHIFTS", "FLEXIBLE", "REMOTE", "HYBRID"]} t={t} />
            <TextField id="workScheduleId" label={t("hr360.workSchedule")} value={values.workScheduleId} update={update} />
            <TextField id="shiftGroupId" label={t("hr360.shiftGroup")} value={values.shiftGroupId} update={update} />
            <TextField id="attendanceProfileId" label={t("hr360.attendanceProfile")} value={values.attendanceProfileId} update={update} />
            <TextField id="leaveProfileId" label={t("hr360.leaveProfile")} value={values.leaveProfileId} update={update} />
            <TextField id="breakProfileId" label={t("hr360.breakProfile")} value={values.breakProfileId} update={update} />
            <TextField id="allowedAttendanceLocationId" label={t("hr360.allowedCheckInLocations")} value={values.allowedAttendanceLocationId} update={update} />
            <TextField id="exactRadiusMeters" label={t("hr360.exactRadiusMeters")} type="number" value={values.exactRadiusMeters} update={update} />
            <TextField id="expandedRadiusMeters" label={t("hr360.expandedRadiusMeters")} type="number" value={values.expandedRadiusMeters} update={update} />
            <CheckboxField id="webCheckInAllowed" label={t("hr360.webCheckInAllowed")} value={Boolean(values.webCheckInAllowed)} update={update} />
            <CheckboxField id="mobileCheckInAllowed" label={t("hr360.mobileCheckInAllowed")} value={Boolean(values.mobileCheckInAllowed)} update={update} />
            <CheckboxField id="requireLivePhoto" label={t("hr360.requireLivePhoto")} value={Boolean(values.requireLivePhoto)} update={update} />
            <CheckboxField id="requireFaceVerification" label={t("hr360.requireFaceVerification")} value={Boolean(values.requireFaceVerification)} update={update} />
            <CheckboxField id="requireDvrReview" label={t("hr360.requireDvrReview")} value={Boolean(values.requireDvrReview)} update={update} />
            <SelectField id="webWifiPolicy" label={t("hr360.webWifiPolicy")} value={values.webWifiPolicy} update={update} options={["BLOCK", "MANUAL_REVIEW", "IGNORE_FOR_WEB"]} t={t} />
            <CheckboxField id="remoteWorkAllowed" label={t("hr360.remoteWorkAllowed")} value={Boolean(values.remoteWorkAllowed)} update={update} />
            <TextField id="holidayWorkPolicy" label={t("hr360.holidayWorkPolicy")} value={values.holidayWorkPolicy} update={update} />
          </FieldGrid>
        ) : null}

        {currentStep.id === "payroll" ? (
          <FieldGrid>
            <TextField id="salaryAmount" label={t("hr360.salaryAmount")} type="number" value={values.salaryAmount} update={update} />
            <TextField id="salaryCurrency" label={t("hr360.salaryCurrency")} value={values.salaryCurrency} update={update} />
            <SelectField id="paymentFrequency" label={t("hr360.paymentFrequency")} value={values.paymentFrequency} update={update} options={["MONTHLY", "WEEKLY", "BIWEEKLY", "DAILY", "HOURLY"]} t={t} />
            <SelectField id="paymentMethod" label={t("hr360.paymentMethod")} value={values.paymentMethod} update={update} options={["BANK_TRANSFER", "CASH", "WALLET", "CHEQUE", "OTHER"]} t={t} />
            <TextField id="payrollProfileId" label={t("hr360.payrollProfile")} value={values.payrollProfileId} update={update} />
            <TextField id="allowancesProfileId" label={t("hr360.allowancesProfile")} value={values.allowancesProfileId} update={update} />
            <TextField id="deductionsProfileId" label={t("hr360.deductionsProfile")} value={values.deductionsProfileId} update={update} />
          </FieldGrid>
        ) : null}

        {currentStep.id === "documents" ? (
          <FieldGrid>
            <TextField id="requiredDocumentType" label={t("hr360.documentType")} value={values.requiredDocumentType} update={update} />
            <TextField id="requiredDocumentExpiresAt" label={t("hr360.documentExpiryDate")} type="date" value={values.requiredDocumentExpiresAt} update={update} />
            <SelectField id="documentAiReviewStatus" label={t("hr360.aiReviewStatus")} value={values.documentAiReviewStatus} update={update} options={["NOT_REVIEWED", "PENDING", "APPROVED", "REJECTED", "NEEDS_MANUAL_REVIEW"]} t={t} />
            <Field label={t("hr360.manualReview")} id="manualReview">
              <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3 text-sm text-[var(--color-muted)]">
                {t("hr360.manualReviewDescription")}
              </div>
            </Field>
          </FieldGrid>
        ) : null}

        {currentStep.id === "permissions" ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-sm text-[var(--color-foreground)]">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-accent)]" aria-hidden="true" />
              <p>{t("employeeAccess.doNotShareWarning")}</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {visibleGroups.map((group) => (
                <section key={group.id} className="rounded-md border border-[var(--color-border)] p-4">
                  <h3 className="mb-3 text-sm font-semibold text-[var(--color-foreground)]">{t(group.labelKey)}</h3>
                  <div className="grid gap-2">
                    {group.permissions.map((permission) => (
                      <label key={permission} className="flex items-start gap-3 text-sm text-[var(--color-foreground)]">
                        <input type="checkbox" className="mt-1 h-4 w-4" checked={values.permissions.includes(permission)} onChange={() => togglePermission(permission)} />
                        <span>
                          <span className="block font-medium">{t(PERMISSION_LABEL_KEYS[permission] ?? permission)}</span>
                          <span className="block text-xs text-[var(--color-muted)]">{permission}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        ) : null}

        {currentStep.id === "review" ? (
          <DetailGrid
            items={[
              { label: t("hr360.legalName"), value: displayValue(values.legalName, t) },
              { label: t("employeeAccess.email"), value: displayValue(values.email, t) },
              { label: t("hr360.allowEmployeeLogin"), value: values.allowLogin ? t("common.yes") : t("common.no") },
              { label: t("employeeAccess.jobTitle"), value: displayValue(values.jobTitle, t) },
              { label: t("hr360.workMode"), value: optionLabel(values.workScheduleType, t) },
              { label: t("hr360.salaryCurrency"), value: displayValue(values.salaryCurrency, t) },
              { label: t("employeeAccess.permissions"), value: t("employeeAccess.permissionCount", { count: values.permissions.length }) },
              { label: t("hr360.identifierType"), value: optionLabel(values.employeeIdentifierType, t) },
            ]}
          />
        ) : null}
      </DetailCard>

      <div className="flex flex-wrap justify-between gap-3">
        <Button type="button" className="ui-button-secondary" disabled={stepIndex === 0} onClick={() => setStepIndex((current) => Math.max(0, current - 1))}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {t("common.previous")}
        </Button>
        <div className="flex gap-3">
          {stepIndex < steps.length - 1 ? (
            <Button type="button" onClick={() => setStepIndex((current) => Math.min(steps.length - 1, current + 1))}>
              {t("common.next")}
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : null}
          <Button type="submit" disabled={isSaving}>
            {mode === "create" ? <KeyRound className="h-4 w-4" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
            {isSaving ? t("common.saving") : mode === "create" ? t("employeeAccess.createEmployee") : t("employeeAccess.saveEmployee")}
          </Button>
        </div>
      </div>
    </form>
  );
}

function FieldGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>;
}

function Field({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function TextField({
  id,
  label,
  value,
  type = "text",
  required,
  update,
}: {
  id: string;
  label: string;
  value: unknown;
  type?: string;
  required?: boolean;
  update: (key: string, value: unknown) => void;
}) {
  return (
    <Field label={label} id={id}>
      <Input id={id} type={type} value={value == null ? "" : String(value)} required={required} onChange={(event) => update(id, event.target.value)} />
    </Field>
  );
}

function SelectField({
  id,
  label,
  value,
  options,
  update,
  t,
  prefix = "hr360.option.",
}: {
  id: string;
  label: string;
  value: unknown;
  options: string[];
  update: (key: string, value: unknown) => void;
  t: (key: string) => string;
  prefix?: string;
}) {
  return (
    <Field label={label} id={id}>
      <select id={id} className="ui-input" value={value == null ? "" : String(value)} onChange={(event) => update(id, event.target.value)}>
        {options.map((option) => (
          <option key={option || "blank"} value={option}>
            {option ? t(`${prefix}${option}`) : t("common.notSet")}
          </option>
        ))}
      </select>
    </Field>
  );
}

function CheckboxField({
  id,
  label,
  value,
  update,
}: {
  id: string;
  label: string;
  value: boolean;
  update: (key: string, value: unknown) => void;
}) {
  return (
    <label className="flex min-h-10 items-center gap-3 rounded-md border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-foreground)]">
      <input type="checkbox" className="h-4 w-4" checked={value} onChange={(event) => update(id, event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function firstNameFromName(name?: string | null) {
  return name?.split(" ")[0] ?? "";
}

function lastNameFromName(name?: string | null) {
  return name?.split(" ").slice(1).join(" ") ?? "";
}

function initialRole(role?: string) {
  return EMPLOYEE_ROLE_OPTIONS.some((option) => option === role)
    ? role
    : "employee_self_service";
}

function dateInput(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function optionLabel(value: unknown, t: (key: string) => string) {
  return value ? t(`hr360.option.${String(value)}`) : t("common.notSet");
}

function displayValue(value: unknown, t: (key: string) => string) {
  return value ? String(value) : t("common.notSet");
}

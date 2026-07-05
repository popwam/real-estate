"use client";

import { FormEvent, useState } from "react";
import { KeyRound, LoaderCircle, ShieldCheck, Store, UserRoundCheck } from "lucide-react";
import { FeedbackState } from "@/components/feedback-state";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import {
  useCreateProjectBrokerAuthorization,
  useProjectBrokerAuthorizations,
  useRemoveProjectBrokerAuthorization,
  useUpdateProjectSellingMode,
} from "@/hooks/use-developer";
import type { ProjectSellingMode } from "@/types/developer";

const sellingModes: Array<{
  value: ProjectSellingMode;
  title: string;
  description: string;
  icon: typeof KeyRound;
}> = [
  { value: "OWNER_ONLY", title: "Owner only", description: "The developer team owns lead handling and broker attribution is not accepted.", icon: ShieldCheck },
  { value: "AUTHORIZED_BROKERS", title: "Authorized brokers", description: "Only brokerages or brokers explicitly added below can sell and receive attribution.", icon: UserRoundCheck },
  { value: "OPEN_BROKERAGE", title: "Open brokerage", description: "Eligible marketplace brokerages can participate without a project-specific authorization record.", icon: Store },
];

export function ProjectSellingPermissions({ projectId, sellingMode }: { projectId: string; sellingMode: ProjectSellingMode }) {
  const { t } = useI18n();
  const [mode, setMode] = useState(sellingMode);
  const list = useProjectBrokerAuthorizations(projectId);
  const updateMode = useUpdateProjectSellingMode(projectId);
  const create = useCreateProjectBrokerAuthorization(projectId);
  const remove = useRemoveProjectBrokerAuthorization(projectId);

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const granteeType = String(data.get("granteeType") ?? "organization");
    const granteeId = String(data.get("granteeId") ?? "").trim();
    await create.mutateAsync(granteeType === "broker" ? { brokerUserId: granteeId } : { organizationId: granteeId });
    form.reset();
  }

  const actionError = updateMode.error ?? create.error ?? remove.error;

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="text-sm font-semibold text-[var(--color-foreground)]">{t("projectSelling.title")}</legend>
        <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">{t("projectSelling.description")}</p>
        <div className="mt-4 grid gap-3">
          {sellingModes.map((option) => {
            const Icon = option.icon;
            const selected = mode === option.value;
            return (
              <label key={option.value} className={`flex cursor-pointer gap-3 rounded-[var(--radius-md)] border p-4 ${selected ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]" : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-muted)]"}`}>
                <input type="radio" name="sellingMode" value={option.value} checked={selected} onChange={() => setMode(option.value)} className="mt-1 accent-[var(--color-accent)]" />
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-accent)]" aria-hidden="true" />
                  <span><span className="block text-sm font-semibold text-[var(--color-foreground)]">{t(`projectSelling.mode.${option.value}.title`)}</span><span className="mt-1 block text-sm leading-6 text-[var(--color-muted)]">{t(`projectSelling.mode.${option.value}.description`)}</span></span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
        <p className="text-sm text-[var(--color-muted)]">{t("projectSelling.currentMode")} <strong className="text-[var(--color-foreground)]">{formatLabel(sellingMode)}</strong></p>
        <Button disabled={updateMode.isPending || mode === sellingMode} onClick={() => updateMode.mutate(mode)}>
          {updateMode.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <KeyRound className="h-4 w-4" aria-hidden="true" />}
          {updateMode.isPending ? "Saving…" : "Save selling mode"}
        </Button>
      </div>

      {updateMode.isSuccess ? <FeedbackState tone="success" title={t("projectSelling.updated")} description={t("projectSelling.updatedDescription")} /> : null}
      {actionError ? <FeedbackState tone="error" title={t("projectSelling.error")} description={actionError.message} /> : null}

      <section aria-labelledby="broker-authorizations-title">
        <h3 id="broker-authorizations-title" className="text-sm font-semibold text-[var(--color-foreground)]">{t("projectSelling.authorizations")}</h3>
        <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">{t("projectSelling.authorizationsDescription")}</p>
        <form className="mt-4 grid gap-3 md:grid-cols-[12rem_minmax(0,1fr)_auto]" onSubmit={add}>
          <label className="grid gap-2 text-xs font-semibold text-[var(--color-muted)]">{t("projectSelling.authorizationType")}<select name="granteeType" className="ui-input"><option value="organization">{t("projectSelling.brokerageOrganization")}</option><option value="broker">{t("projectSelling.brokerUser")}</option></select></label>
          <label className="grid gap-2 text-xs font-semibold text-[var(--color-muted)]">{t("projectSelling.organizationOrUserId")}<input required name="granteeId" placeholder={t("projectSelling.existingIdPlaceholder")} className="ui-input" /></label>
          <Button disabled={create.isPending} type="submit" className="self-end">{create.isPending ? "Authorizing…" : "Authorize"}</Button>
        </form>

        <div className="mt-4 space-y-2">
          {list.isLoading ? <p className="text-sm text-[var(--color-muted)]" role="status">{t("adminSweep.loading.broker.authorizations.1dfd493a")}</p> : null}
          {(list.data ?? []).map((authorization) => (
            <div className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:flex-row sm:items-center sm:justify-between" key={authorization.id}>
              <div><p className="text-sm font-semibold text-[var(--color-foreground)]">{authorization.organization?.name ?? ([authorization.brokerUser?.firstName, authorization.brokerUser?.lastName].filter(Boolean).join(" ") || authorization.organizationId || authorization.brokerUserId)}</p><p className="mt-1 text-xs text-[var(--color-muted)]">{formatLabel(authorization.status)}</p></div>
              <button type="button" className="ui-button ui-button-secondary" disabled={remove.isPending} onClick={() => remove.mutate(authorization.id)} aria-label={`Remove authorization for ${authorization.organization?.name ?? authorization.organizationId ?? authorization.brokerUserId ?? "broker"}`}>{t("adminSweep.remove.e963907d")}</button>
            </div>
          ))}
          {!list.isLoading && !list.error && !list.data?.length ? <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] p-4 text-sm text-[var(--color-muted)]">{t("adminSweep.no.explicit.broker.authorizations.have.been.adde.b2b32cd8")}</p> : null}
          {list.error ? <FeedbackState tone="error" title={t("adminSweep.authorizations.could.not.be.loaded.2091d429")} description={list.error.message} /> : null}
        </div>
      </section>
    </div>
  );
}

function formatLabel(value: string) {
  return value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

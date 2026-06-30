"use client";

import { FormEvent, useState } from "react";
import { useCreateOrganizationInvitation, useOrganizationInvitations } from "@/hooks/use-platform-admin";
import { EmptyState } from "@/components/empty-state";
import { FeedbackState } from "@/components/feedback-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n";
import { formatDate } from "@/lib/format";

export function OrganizationInvitationsCard({ id, organizationType }: { id: string; organizationType: string }) {
  const { t } = useI18n();
  const invitations = useOrganizationInvitations(id);
  const create = useCreateOrganizationInvitation(id);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const roles = organizationType === "DEVELOPER"
    ? ["DEVELOPER_OWNER", "DEVELOPER_ADMIN", "DEVELOPER_SALES_MANAGER", "DEVELOPER_SALES_AGENT"]
    : organizationType === "BROKERAGE"
      ? ["BROKERAGE_OWNER", "BROKERAGE_ADMIN", "BROKER"]
      : ["INDIVIDUAL_BROKER"];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const result = await create.mutateAsync({
      email: String(data.get("email") ?? ""),
      intendedRole: String(data.get("intendedRole") ?? roles[0]),
      expiresInHours: 72,
    });
    setInviteUrl(result.inviteUrl ?? null);
    setCopied(false);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
        <h3 className="text-sm font-semibold text-[var(--color-foreground)]">{t("organizationInvites.createLink")}</h3>
        <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
          {t("organizationInvites.description")}
        </p>
      </div>
      <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]" onSubmit={submit}>
        <div className="space-y-2">
          <Label htmlFor="organization-invite-email">{t("organizationInvites.recipientEmail")}</Label>
          <Input required type="email" id="organization-invite-email" name="email" placeholder="owner@company.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="organization-invite-role">{t("organizationInvites.intendedRole")}</Label>
          <select id="organization-invite-role" name="intendedRole" className="ui-input">
            {roles.map((role) => <option key={role} value={role}>{role.replaceAll("_", " ")}</option>)}
        </select>
        </div>
        <div className="flex items-end">
          <Button className="w-full" disabled={create.isPending} type="submit">
            {create.isPending ? t("common.creating") : t("organizationInvites.createInvite")}
          </Button>
        </div>
      </form>
      {create.error ? (
        <FeedbackState tone="error" title={t("organizationInvites.errorCreate")} description={create.error.message} />
      ) : null}
      {inviteUrl ? (
        <div className="ui-feedback ui-feedback-success space-y-2" role="status">
          <p className="text-sm font-medium">{t("organizationInvites.created")}</p>
          <div className="flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 break-all text-xs">{inviteUrl}</code>
            <Button
              className="ui-button-secondary"
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(inviteUrl);
                setCopied(true);
              }}
            >
              {copied ? t("common.copied") : t("organizationInvites.copyLink")}
            </Button>
          </div>
        </div>
      ) : null}
      <div className="space-y-2">
        {(invitations.data ?? []).map((invite) => (
          <div className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm md:grid-cols-[minmax(0,1fr)_180px_130px_170px]" key={invite.id}>
            <span className="min-w-0 break-all font-medium text-[var(--color-foreground)]">{invite.email}</span>
            <span className="text-[var(--color-muted)]">{invite.intendedRole.replaceAll("_", " ")}</span>
            <span className="ui-badge w-fit">{invite.status.replaceAll("_", " ")}</span>
            <span className="text-[var(--color-muted)]">
              {invite.acceptedAt
                ? t("organizationInvites.accepted", { date: formatDate(invite.acceptedAt) })
                : t("organizationInvites.expires", { date: formatDate(invite.expiresAt) })}
            </span>
          </div>
        ))}
        {invitations.isLoading ? (
          <p className="text-sm text-[var(--color-muted)]">{t("organizationInvites.loading")}</p>
        ) : null}
        {!invitations.isLoading && !invitations.data?.length ? (
          <EmptyState
            title={t("organizationInvites.emptyTitle")}
            description={t("organizationInvites.emptyDescription")}
          />
        ) : null}
      </div>
    </div>
  );
}

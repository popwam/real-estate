"use client";

import { FormEvent, useState } from "react";
import { useCreateOrganizationInvitation, useOrganizationInvitations } from "@/hooks/use-platform-admin";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";

export function OrganizationInvitationsCard({ id, organizationType }: { id: string; organizationType: string }) {
  const invitations = useOrganizationInvitations(id);
  const create = useCreateOrganizationInvitation(id);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
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
  }

  return (
    <div className="space-y-4">
      <form className="grid gap-3 md:grid-cols-[1fr_220px_auto]" onSubmit={submit}>
        <input required type="email" name="email" placeholder="owner@company.com" aria-label="Invite email" className="h-10 rounded-md border border-zinc-300 px-3 text-sm" />
        <select name="intendedRole" aria-label="Intended role" className="h-10 rounded-md border border-zinc-300 px-3 text-sm">
          {roles.map((role) => <option key={role} value={role}>{role.replaceAll("_", " ")}</option>)}
        </select>
        <Button disabled={create.isPending} type="submit">{create.isPending ? "Creating" : "Create invite"}</Button>
      </form>
      {create.error ? <p className="text-sm text-red-700">{create.error.message}</p> : null}
      {inviteUrl ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3">
          <code className="min-w-0 flex-1 break-all text-xs text-emerald-950">{inviteUrl}</code>
          <Button type="button" onClick={() => void navigator.clipboard.writeText(inviteUrl)}>Copy invite link</Button>
        </div>
      ) : null}
      <div className="space-y-2">
        {(invitations.data ?? []).map((invite) => (
          <div className="grid gap-1 rounded-md border border-zinc-200 p-3 text-sm md:grid-cols-4" key={invite.id}>
            <span>{invite.email}</span><span>{invite.intendedRole.replaceAll("_", " ")}</span>
            <span>{invite.status}</span><span>Expires {formatDate(invite.expiresAt)}</span>
          </div>
        ))}
        {!invitations.isLoading && !invitations.data?.length ? <p className="text-sm text-zinc-500">No invitations yet.</p> : null}
      </div>
    </div>
  );
}

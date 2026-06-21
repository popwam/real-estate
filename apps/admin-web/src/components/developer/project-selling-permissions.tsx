"use client";

import { FormEvent, useState } from "react";
import {
  useCreateProjectBrokerAuthorization,
  useProjectBrokerAuthorizations,
  useRemoveProjectBrokerAuthorization,
  useUpdateProjectSellingMode,
} from "@/hooks/use-developer";
import type { ProjectSellingMode } from "@/types/developer";
import { Button } from "@/components/ui/button";

export function ProjectSellingPermissions({ projectId, sellingMode }: { projectId: string; sellingMode: ProjectSellingMode }) {
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

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <label className="grid flex-1 gap-2 text-sm font-medium text-zinc-700">
          Selling mode
          <select value={mode} onChange={(event) => setMode(event.target.value as ProjectSellingMode)} className="h-10 rounded-md border border-zinc-300 px-3">
            <option value="OWNER_ONLY">Owner only</option>
            <option value="AUTHORIZED_BROKERS">Authorized brokers</option>
            <option value="OPEN_BROKERAGE">Open brokerage</option>
          </select>
        </label>
        <Button disabled={updateMode.isPending || mode === sellingMode} onClick={() => updateMode.mutate(mode)}>Save mode</Button>
      </div>
      <p className="text-sm text-zinc-600">Owner-only leads remain with the developer. Broker attribution is accepted only for eligible or explicitly authorized sellers.</p>
      <form className="grid gap-3 md:grid-cols-[180px_1fr_auto]" onSubmit={add}>
        <select name="granteeType" className="h-10 rounded-md border border-zinc-300 px-3 text-sm">
          <option value="organization">Brokerage organization</option>
          <option value="broker">Broker user</option>
        </select>
        <input required name="granteeId" placeholder="Organization or user ID" className="h-10 rounded-md border border-zinc-300 px-3 text-sm" />
        <Button disabled={create.isPending} type="submit">Authorize</Button>
      </form>
      {updateMode.error || create.error || remove.error ? <p className="text-sm text-red-700">{(updateMode.error ?? create.error ?? remove.error)?.message}</p> : null}
      <div className="space-y-2">
        {(list.data ?? []).map((authorization) => (
          <div className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 p-3 text-sm" key={authorization.id}>
            <span>{authorization.organization?.name ?? [authorization.brokerUser?.firstName, authorization.brokerUser?.lastName].filter(Boolean).join(" ") ?? authorization.organizationId ?? authorization.brokerUserId}</span>
            <div className="flex items-center gap-3"><span>{authorization.status}</span><Button disabled={remove.isPending} onClick={() => remove.mutate(authorization.id)} type="button">Remove</Button></div>
          </div>
        ))}
        {!list.isLoading && !list.data?.length ? <p className="text-sm text-zinc-500">No broker authorizations.</p> : null}
      </div>
    </div>
  );
}

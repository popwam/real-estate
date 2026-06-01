"use client";

import { FormEvent, useState } from "react";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard, DetailGrid } from "@/components/platform/detail-card";
import { OperationsActivityTimeline } from "@/components/admin-operations/operations-activity-timeline";
import { useOperationDetail, usePatchOperation } from "@/hooks/use-admin-operations";

type Field = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "select";
  options?: string[];
};

export function OperationsDetailPage({
  title,
  description,
  path,
  queryKey,
  fields,
  activityPath,
}: {
  title: string;
  description: string;
  path: string;
  queryKey: string;
  fields: Field[];
  activityPath: string;
}) {
  const detail = useOperationDetail(queryKey, path);
  const patch = usePatchOperation(queryKey);
  const record = detail.data;
  const [form, setForm] = useState<Record<string, string>>({});

  function valueFor(field: Field) {
    return form[field.name] ?? (record?.[field.name] === null || record?.[field.name] === undefined ? "" : String(record?.[field.name]));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const payload = Object.fromEntries(Object.entries(form).filter(([, value]) => value !== ""));
    await patch.mutateAsync({ path, input: payload });
    setForm({});
    await detail.refetch();
  }

  return (
    <>
      <PageHeader title={title} description={description} />
      {detail.isLoading ? <LoadingState label={`Loading ${title}`} /> : null}
      {detail.error ? <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{detail.error.message}</p> : null}
      {record ? (
        <div className="space-y-6">
          <DetailCard title="Record summary">
            <DetailGrid items={Object.entries(record).slice(0, 12).map(([key, value]) => ({ label: key, value: formatValue(value) }))} />
          </DetailCard>
          <DetailCard title="Edit record">
            <form className="grid gap-3 md:grid-cols-3" onSubmit={submit}>
              {fields.map((field) => (
                <label className="grid gap-1 text-sm" key={field.name}>
                  <span className="font-medium text-zinc-700">{field.label}</span>
                  {field.type === "select" ? (
                    <select
                      className="h-10 rounded-md border border-zinc-300 px-3"
                      value={valueFor(field)}
                      onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}
                    >
                      <option value="">Select</option>
                      {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  ) : (
                    <input
                      className="h-10 rounded-md border border-zinc-300 px-3"
                      type={field.type ?? "text"}
                      value={valueFor(field)}
                      onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}
                    />
                  )}
                </label>
              ))}
              <div className="flex items-end">
                <button className="h-10 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800" disabled={patch.isPending}>
                  {patch.isPending ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
            {patch.error ? <p className="mt-3 text-sm text-red-700">{patch.error.message}</p> : null}
          </DetailCard>
          <DetailCard title="Operations activity">
            <OperationsActivityTimeline path={activityPath} queryKey={`${queryKey}-activity`} />
          </DetailCard>
        </div>
      ) : null}
    </>
  );
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

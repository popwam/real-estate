"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { useCreateOperation, useOperationList, usePatchOperation } from "@/hooks/use-admin-operations";

type Field = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "select";
  options?: string[];
};

export function OperationsPage({
  title,
  description,
  listPath,
  createPath = listPath,
  queryKey,
  fields,
  columns,
  note,
  detailBasePath,
}: {
  title: string;
  description: string;
  listPath: string;
  createPath?: string;
  queryKey: string;
  fields: Field[];
  columns: string[];
  note?: string;
  detailBasePath?: string;
}) {
  const { data = [], isLoading, error } = useOperationList(queryKey, listPath);
  const create = useCreateOperation(queryKey, createPath);
  const patch = usePatchOperation(queryKey);
  const [form, setForm] = useState<Record<string, string>>({});
  const [editId, setEditId] = useState("");
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});

  const filterFields = fields.filter((field) => field.type === "select");
  const filteredData = useMemo(() => {
    const query = search.trim().toLowerCase();
    return data.filter((row) => {
      const matchesSearch = !query || Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(query));
      const matchesFilters = Object.entries(filters).every(([key, value]) => !value || String(row[key] ?? "") === value);
      return matchesSearch && matchesFilters;
    });
  }, [data, filters, search]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const payload = Object.fromEntries(
      Object.entries(form).filter(([, value]) => value !== ""),
    );
    await create.mutateAsync(payload);
    setForm({});
  }

  async function onEditSubmit(event: FormEvent) {
    event.preventDefault();
    if (!editId) return;
    const payload = Object.fromEntries(Object.entries(editForm).filter(([, value]) => value !== ""));
    await patch.mutateAsync({ path: `${listPath}/${editId}`, input: payload });
    setEditId("");
    setEditForm({});
  }

  function startEdit(row: Record<string, unknown>) {
    const id = String(row.id ?? "");
    if (!id) return;
    setEditId(id);
    setEditForm(
      Object.fromEntries(
        fields.map((field) => [field.name, row[field.name] === null || row[field.name] === undefined ? "" : String(row[field.name])]),
      ),
    );
  }

  return (
    <>
      <PageHeader title={title} description={description} />
      <div className="space-y-6">
        <DetailCard title="Filters">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-zinc-700">Search</span>
              <input
                className="h-10 rounded-md border border-zinc-300 px-3"
                placeholder="Search visible records"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            {filterFields.map((field) => (
              <label className="grid gap-1 text-sm" key={field.name}>
                <span className="font-medium text-zinc-700">{field.label}</span>
                <select
                  className="h-10 rounded-md border border-zinc-300 px-3"
                  value={filters[field.name] ?? ""}
                  onChange={(event) => setFilters((current) => ({ ...current, [field.name]: event.target.value }))}
                >
                  <option value="">All</option>
                  {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            ))}
          </div>
        </DetailCard>
        <DetailCard title="Create record">
          {note ? <p className="mb-4 text-sm text-zinc-600">{note}</p> : null}
          <form className="grid gap-3 md:grid-cols-3" onSubmit={onSubmit}>
            {fields.map((field) => (
              <label className="grid gap-1 text-sm" key={field.name}>
                <span className="font-medium text-zinc-700">{field.label}</span>
                {field.type === "select" ? (
                  <select
                    className="h-10 rounded-md border border-zinc-300 px-3"
                    value={form[field.name] ?? ""}
                    onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}
                  >
                    <option value="">Select</option>
                    {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                ) : (
                  <input
                    className="h-10 rounded-md border border-zinc-300 px-3"
                    type={field.type ?? "text"}
                    value={form[field.name] ?? ""}
                    onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}
                  />
                )}
              </label>
            ))}
            <div className="flex items-end">
              <button className="h-10 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800" disabled={create.isPending}>
                {create.isPending ? "Saving..." : "Create"}
              </button>
            </div>
          </form>
          {create.error ? <p className="mt-3 text-sm text-red-700">{create.error.message}</p> : null}
        </DetailCard>
        {editId ? (
          <DetailCard title="Edit record">
            <form className="grid gap-3 md:grid-cols-3" onSubmit={onEditSubmit}>
              {fields.map((field) => (
                <label className="grid gap-1 text-sm" key={field.name}>
                  <span className="font-medium text-zinc-700">{field.label}</span>
                  {field.type === "select" ? (
                    <select
                      className="h-10 rounded-md border border-zinc-300 px-3"
                      value={editForm[field.name] ?? ""}
                      onChange={(event) => setEditForm((current) => ({ ...current, [field.name]: event.target.value }))}
                    >
                      <option value="">Select</option>
                      {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  ) : (
                    <input
                      className="h-10 rounded-md border border-zinc-300 px-3"
                      type={field.type ?? "text"}
                      value={editForm[field.name] ?? ""}
                      onChange={(event) => setEditForm((current) => ({ ...current, [field.name]: event.target.value }))}
                    />
                  )}
                </label>
              ))}
              <div className="flex items-end gap-2">
                <button className="h-10 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800" disabled={patch.isPending}>
                  {patch.isPending ? "Saving..." : "Save"}
                </button>
                <button className="h-10 rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-700" onClick={() => setEditId("")} type="button">
                  Cancel
                </button>
              </div>
            </form>
            {patch.error ? <p className="mt-3 text-sm text-red-700">{patch.error.message}</p> : null}
          </DetailCard>
        ) : null}
        <DetailCard title="Records">
          {isLoading ? <LoadingState label={`Loading ${title}`} /> : null}
          {error ? <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</p> : null}
          {!isLoading && !error ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200 text-sm">
                <thead>
                  <tr>
                    {columns.map((column) => <th className="px-3 py-2 text-left font-semibold text-zinc-700" key={column}>{column}</th>)}
                    <th className="px-3 py-2 text-left font-semibold text-zinc-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredData.map((row, index) => (
                    <tr key={String(row.id ?? index)}>
                      {columns.map((column) => <td className="px-3 py-2 text-zinc-700" key={column}>{formatValue(row[column])}</td>)}
                      <td className="px-3 py-2">
                        <div className="flex gap-3">
                          {detailBasePath ? (
                            <Link className="text-sm font-medium text-zinc-950 hover:underline" href={`${detailBasePath}/${String(row.id)}`}>
                              Detail
                            </Link>
                          ) : null}
                          <button className="text-sm font-medium text-zinc-950 hover:underline" onClick={() => startEdit(row)} type="button">
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!filteredData.length ? <tr><td className="px-3 py-6 text-zinc-500" colSpan={columns.length + 1}>No records match these filters.</td></tr> : null}
                </tbody>
              </table>
            </div>
          ) : null}
        </DetailCard>
      </div>
    </>
  );
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

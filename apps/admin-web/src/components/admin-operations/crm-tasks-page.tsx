"use client";

import { FormEvent, useMemo, useState } from "react";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { DetailCard } from "@/components/platform/detail-card";
import { Button } from "@/components/ui/button";
import { useCompleteCrmTask, useCreateCrmTask, useCrmTasks } from "@/hooks/use-admin-crm";
import { formatDate } from "@/lib/format";

export function CrmTasksPage({ title = "CRM tasks", description = "Follow-up tasks for CRM leads." }: { title?: string; description?: string }) {
  const tasks = useCrmTasks();
  const createTask = useCreateCrmTask();
  const completeTask = useCompleteCrmTask();
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [due, setDue] = useState("");
  const [now] = useState(() => Date.now());
  const [form, setForm] = useState({ title: "", crmLeadId: "", priority: "NORMAL", dueAt: "" });

  const filtered = useMemo(() => {
    return (tasks.data ?? []).filter((task) => {
      if (status && task.status !== status) return false;
      if (priority && task.priority !== priority) return false;
      if (due && (task.dueAt ?? "").slice(0, 10) !== due) return false;
      return true;
    });
  }, [due, priority, status, tasks.data]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.title.trim()) return;
    await createTask.mutateAsync({
      title: form.title.trim(),
      priority: form.priority,
      dueAt: form.dueAt || undefined,
      ...(form.crmLeadId ? { crmLeadId: form.crmLeadId } : {}),
    });
    setForm({ title: "", crmLeadId: "", priority: "NORMAL", dueAt: "" });
  }

  return (
    <>
      <PageHeader title={title} description={description} />
      <div className="space-y-6">
        <DetailCard title="Filters">
          <div className="grid gap-3 md:grid-cols-3">
            <select className="h-10 rounded-md border border-zinc-300 px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">All statuses</option>
              <option value="OPEN">OPEN</option>
              <option value="DONE">DONE</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
            <select className="h-10 rounded-md border border-zinc-300 px-3 text-sm" value={priority} onChange={(event) => setPriority(event.target.value)}>
              <option value="">All priorities</option>
              <option value="LOW">LOW</option>
              <option value="NORMAL">NORMAL</option>
              <option value="HIGH">HIGH</option>
            </select>
            <input className="h-10 rounded-md border border-zinc-300 px-3 text-sm" type="date" value={due} onChange={(event) => setDue(event.target.value)} />
          </div>
        </DetailCard>
        <DetailCard title="Create task">
          <form className="grid gap-3 md:grid-cols-[1fr_220px_160px_160px_auto]" onSubmit={submit}>
            <input className="h-10 rounded-md border border-zinc-300 px-3 text-sm" placeholder="Task title" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
            <input className="h-10 rounded-md border border-zinc-300 px-3 text-sm" placeholder="Optional CRM lead id" value={form.crmLeadId} onChange={(event) => setForm((current) => ({ ...current, crmLeadId: event.target.value }))} />
            <select className="h-10 rounded-md border border-zinc-300 px-3 text-sm" value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}>
              <option value="LOW">LOW</option>
              <option value="NORMAL">NORMAL</option>
              <option value="HIGH">HIGH</option>
            </select>
            <input className="h-10 rounded-md border border-zinc-300 px-3 text-sm" type="date" value={form.dueAt} onChange={(event) => setForm((current) => ({ ...current, dueAt: event.target.value }))} />
            <Button disabled={createTask.isPending || !form.title.trim()}>{createTask.isPending ? "Saving..." : "Create"}</Button>
          </form>
          {createTask.error ? <p className="mt-3 text-sm text-red-700">{createTask.error.message}</p> : null}
        </DetailCard>
        <DetailCard title="Task list">
          {tasks.isLoading ? <LoadingState label="Loading CRM tasks" /> : null}
          {tasks.error ? <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{tasks.error.message}</p> : null}
          {!tasks.isLoading && !tasks.error ? (
            <div className="divide-y divide-zinc-100 rounded-md border border-zinc-200">
              {filtered.map((task) => {
                const overdue = task.status === "OPEN" && task.dueAt && new Date(task.dueAt).getTime() < now;
                return (
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm" key={task.id}>
                    <div>
                      <p className="font-medium text-zinc-950">{task.title}</p>
                      <p className="text-zinc-500">
                        {task.status} · {task.priority} · Due {formatDate(task.dueAt)} {overdue ? "· Overdue" : ""}
                      </p>
                      {task.crmLead?.client?.name ? <p className="text-zinc-500">Lead: {task.crmLead.client.name}</p> : null}
                    </div>
                    {task.status === "OPEN" ? (
                      <Button disabled={completeTask.isPending} onClick={() => completeTask.mutate(task.id)}>
                        Mark complete
                      </Button>
                    ) : null}
                  </div>
                );
              })}
              {!filtered.length ? <p className="p-4 text-sm text-zinc-500">No tasks match these filters.</p> : null}
            </div>
          ) : null}
        </DetailCard>
      </div>
    </>
  );
}

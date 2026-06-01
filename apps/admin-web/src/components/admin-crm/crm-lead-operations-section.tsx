"use client";

import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  useCompleteCrmTask,
  useCreateCrmLeadNote,
  useCreateCrmLeadTask,
  useCrmLeadNotes,
  useCrmLeadStageHistory,
  useCrmPipelineStages,
  useCrmTasks,
  useUpdateCrmLeadStage,
} from "@/hooks/use-admin-crm";
import { formatDate } from "@/lib/format";

export function CrmLeadOperationsSection({ leadId, currentStageId }: { leadId: string; currentStageId?: string | null }) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <LeadStageSection leadId={leadId} currentStageId={currentStageId} />
      <LeadNotesSection leadId={leadId} />
      <LeadTasksSection leadId={leadId} />
    </div>
  );
}

function LeadStageSection({ leadId, currentStageId }: { leadId: string; currentStageId?: string | null }) {
  const stages = useCrmPipelineStages();
  const history = useCrmLeadStageHistory(leadId);
  const updateStage = useUpdateCrmLeadStage(leadId);
  const [stageId, setStageId] = useState(currentStageId ?? "");
  const [note, setNote] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!stageId) return;
    await updateStage.mutateAsync({ stageId, note: note.trim() || undefined });
    setNote("");
  }

  return (
    <section className="rounded-md border border-zinc-200 p-4">
      <h3 className="text-sm font-semibold text-zinc-900">Pipeline stage</h3>
      <form className="mt-3 grid gap-3" onSubmit={submit}>
        <select className="h-10 rounded-md border border-zinc-300 px-3 text-sm" value={stageId} onChange={(event) => setStageId(event.target.value)}>
          <option value="">Select stage</option>
          {(stages.data ?? []).map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.name}
            </option>
          ))}
        </select>
        <input
          className="h-10 rounded-md border border-zinc-300 px-3 text-sm"
          placeholder="Optional stage note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
        <Button disabled={updateStage.isPending || !stageId}>{updateStage.isPending ? "Updating..." : "Update stage"}</Button>
      </form>
      {updateStage.error ? <p className="mt-3 text-sm text-red-700">{updateStage.error.message}</p> : null}
      <div className="mt-4 space-y-2">
        {(history.data ?? []).slice(0, 5).map((item) => (
          <div className="rounded-md bg-zinc-50 p-3 text-sm" key={item.id}>
            <p className="font-medium text-zinc-800">{item.toStage?.name ?? "Stage changed"}</p>
            <p className="text-zinc-500">{formatDate(item.createdAt)}</p>
            {item.note ? <p className="mt-1 text-zinc-600">{item.note}</p> : null}
          </div>
        ))}
        {!history.isLoading && !(history.data ?? []).length ? <p className="text-sm text-zinc-500">No stage history yet.</p> : null}
      </div>
    </section>
  );
}

function LeadNotesSection({ leadId }: { leadId: string }) {
  const notes = useCrmLeadNotes(leadId);
  const createNote = useCreateCrmLeadNote(leadId);
  const [body, setBody] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    await createNote.mutateAsync({ body: trimmed });
    setBody("");
  }

  return (
    <section className="rounded-md border border-zinc-200 p-4">
      <h3 className="text-sm font-semibold text-zinc-900">Internal notes</h3>
      <form className="mt-3 grid gap-3" onSubmit={submit}>
        <textarea
          className="min-h-24 rounded-md border border-zinc-300 px-3 py-2 text-sm"
          placeholder="Add an internal CRM note"
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
        <Button disabled={createNote.isPending || !body.trim()}>{createNote.isPending ? "Saving..." : "Add note"}</Button>
      </form>
      {createNote.error ? <p className="mt-3 text-sm text-red-700">{createNote.error.message}</p> : null}
      <div className="mt-4 space-y-2">
        {(notes.data ?? []).map((note) => (
          <div className="rounded-md bg-zinc-50 p-3 text-sm" key={note.id}>
            <p className="whitespace-pre-wrap text-zinc-800">{note.body}</p>
            <p className="mt-1 text-zinc-500">{formatDate(note.createdAt)}</p>
          </div>
        ))}
        {!notes.isLoading && !(notes.data ?? []).length ? <p className="text-sm text-zinc-500">No notes yet.</p> : null}
      </div>
    </section>
  );
}

function LeadTasksSection({ leadId }: { leadId: string }) {
  const tasks = useCrmTasks();
  const createTask = useCreateCrmLeadTask(leadId);
  const completeTask = useCompleteCrmTask();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const leadTasks = useMemo(() => (tasks.data ?? []).filter((task) => task.crmLeadId === leadId), [leadId, tasks.data]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    await createTask.mutateAsync({ title: trimmed, priority });
    setTitle("");
    setPriority("NORMAL");
  }

  return (
    <section className="rounded-md border border-zinc-200 p-4 xl:col-span-2">
      <h3 className="text-sm font-semibold text-zinc-900">Follow-up tasks</h3>
      <form className="mt-3 grid gap-3 md:grid-cols-[1fr_160px_auto]" onSubmit={submit}>
        <input
          className="h-10 rounded-md border border-zinc-300 px-3 text-sm"
          placeholder="Task title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <select className="h-10 rounded-md border border-zinc-300 px-3 text-sm" value={priority} onChange={(event) => setPriority(event.target.value)}>
          <option value="LOW">LOW</option>
          <option value="NORMAL">NORMAL</option>
          <option value="HIGH">HIGH</option>
        </select>
        <Button disabled={createTask.isPending || !title.trim()}>{createTask.isPending ? "Saving..." : "Create task"}</Button>
      </form>
      {createTask.error ? <p className="mt-3 text-sm text-red-700">{createTask.error.message}</p> : null}
      <div className="mt-4 divide-y divide-zinc-100 rounded-md border border-zinc-200">
        {leadTasks.map((task) => (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm" key={task.id}>
            <div>
              <p className="font-medium text-zinc-900">{task.title}</p>
              <p className="text-zinc-500">{task.priority} · {task.status} · {formatDate(task.dueAt)}</p>
            </div>
            {task.status === "OPEN" ? (
              <Button disabled={completeTask.isPending} onClick={() => completeTask.mutate(task.id)}>
                Complete
              </Button>
            ) : null}
          </div>
        ))}
        {!tasks.isLoading && !leadTasks.length ? <p className="p-3 text-sm text-zinc-500">No tasks yet.</p> : null}
      </div>
      {completeTask.error ? <p className="mt-3 text-sm text-red-700">{completeTask.error.message}</p> : null}
    </section>
  );
}

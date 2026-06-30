"use client";

import { FormEvent, useMemo, useState } from "react";
import { Check, LoaderCircle, MessageSquareText, Plus, Route } from "lucide-react";
import { FeedbackState } from "@/components/feedback-state";
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
import { useI18n } from "@/i18n";
import { formatDate } from "@/lib/format";

type Translate = (key: string) => string;

export function CrmLeadOperationsSection({
  leadId,
  currentStageId,
}: {
  leadId: string;
  currentStageId?: string | null;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <LeadStageSection leadId={leadId} currentStageId={currentStageId} />
      <LeadNotesSection leadId={leadId} />
      <div className="xl:col-span-2">
        <LeadTasksSection leadId={leadId} />
      </div>
    </div>
  );
}

function LeadStageSection({
  leadId,
  currentStageId,
}: {
  leadId: string;
  currentStageId?: string | null;
}) {
  const { t } = useI18n();
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
    <OperationCard
      icon={<Route className="h-4 w-4" aria-hidden="true" />}
      title={t("crm.leadOperations.stage.title")}
      description={t("crm.leadOperations.stage.description")}
    >
      <form className="grid gap-3" onSubmit={submit}>
        <label className="grid gap-2 text-xs font-semibold text-[var(--color-muted)]">
          {t("crm.leadOperations.stage.field.stage")}
          <select
            className="ui-input"
            value={stageId}
            onChange={(event) => setStageId(event.target.value)}
          >
            <option value="">{t("crm.leadOperations.stage.field.selectStage")}</option>
            {(stages.data ?? []).map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-xs font-semibold text-[var(--color-muted)]">
          {t("crm.leadOperations.stage.field.note")}
          <input
            className="ui-input"
            placeholder={t("crm.leadOperations.stage.field.notePlaceholder")}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
        <Button disabled={updateStage.isPending || !stageId}>
          {updateStage.isPending ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Route className="h-4 w-4" aria-hidden="true" />
          )}
          {updateStage.isPending
            ? t("crm.leadOperations.stage.updating")
            : t("crm.leadOperations.stage.update")}
        </Button>
      </form>
      {updateStage.error ? (
        <div className="mt-3">
          <FeedbackState
            tone="error"
            title={t("crm.leadOperations.stage.error.update")}
            description={updateStage.error.message}
          />
        </div>
      ) : null}
      {updateStage.isSuccess ? (
        <div className="mt-3">
          <FeedbackState tone="success" title={t("crm.leadOperations.stage.success")} />
        </div>
      ) : null}
      <div className="mt-4 space-y-2">
        {history.isLoading ? (
          <MiniEmpty>{t("crm.leadOperations.stage.loadingHistory")}</MiniEmpty>
        ) : null}
        {history.error ? (
          <FeedbackState
            tone="error"
            title={t("crm.leadOperations.stage.error.history")}
            description={history.error.message}
          />
        ) : null}
        {(history.data ?? []).slice(0, 5).map((item) => (
          <div
            className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3"
            key={item.id}
          >
            <p className="text-sm font-semibold text-[var(--color-foreground)]">
              {item.toStage?.name ?? t("crm.leadOperations.stage.changed")}
            </p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">{formatDate(item.createdAt)}</p>
            {item.note ? <p className="mt-2 text-sm text-[var(--color-muted)]">{item.note}</p> : null}
          </div>
        ))}
        {!history.isLoading && !history.error && !(history.data ?? []).length ? (
          <MiniEmpty>{t("crm.leadOperations.stage.emptyHistory")}</MiniEmpty>
        ) : null}
      </div>
    </OperationCard>
  );
}

function LeadNotesSection({ leadId }: { leadId: string }) {
  const { t } = useI18n();
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
    <OperationCard
      icon={<MessageSquareText className="h-4 w-4" aria-hidden="true" />}
      title={t("crm.leadOperations.notes.title")}
      description={t("crm.leadOperations.notes.description")}
    >
      <form className="grid gap-3" onSubmit={submit}>
        <label className="grid gap-2 text-xs font-semibold text-[var(--color-muted)]">
          {t("crm.leadOperations.notes.field.body")}
          <textarea
            className="ui-input min-h-24 py-2"
            placeholder={t("crm.leadOperations.notes.field.bodyPlaceholder")}
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
        </label>
        <Button disabled={createNote.isPending || !body.trim()}>
          {createNote.isPending ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Plus className="h-4 w-4" aria-hidden="true" />
          )}
          {createNote.isPending ? t("common.saving") : t("crm.leadOperations.notes.add")}
        </Button>
      </form>
      {createNote.error ? (
        <div className="mt-3">
          <FeedbackState
            tone="error"
            title={t("crm.leadOperations.notes.error.add")}
            description={createNote.error.message}
          />
        </div>
      ) : null}
      <div className="mt-4 space-y-2">
        {notes.isLoading ? <MiniEmpty>{t("crm.leadOperations.notes.loading")}</MiniEmpty> : null}
        {notes.error ? (
          <FeedbackState
            tone="error"
            title={t("crm.leadOperations.notes.error.load")}
            description={notes.error.message}
          />
        ) : null}
        {(notes.data ?? []).map((note) => (
          <article
            className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3"
            key={note.id}
          >
            <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--color-foreground)]">
              {note.body}
            </p>
            <p className="mt-2 text-xs text-[var(--color-muted)]">{formatDate(note.createdAt)}</p>
          </article>
        ))}
        {!notes.isLoading && !notes.error && !(notes.data ?? []).length ? (
          <MiniEmpty>{t("crm.leadOperations.notes.empty")}</MiniEmpty>
        ) : null}
      </div>
    </OperationCard>
  );
}

function LeadTasksSection({ leadId }: { leadId: string }) {
  const { t } = useI18n();
  const tasks = useCrmTasks();
  const createTask = useCreateCrmLeadTask(leadId);
  const completeTask = useCompleteCrmTask();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [dueAt, setDueAt] = useState("");
  const leadTasks = useMemo(
    () => (tasks.data ?? []).filter((task) => task.crmLeadId === leadId),
    [leadId, tasks.data],
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    await createTask.mutateAsync({ title: trimmed, priority, dueAt: dueAt || undefined });
    setTitle("");
    setPriority("NORMAL");
    setDueAt("");
  }

  return (
    <OperationCard
      icon={<Check className="h-4 w-4" aria-hidden="true" />}
      title={t("crm.leadOperations.tasks.title")}
      description={t("crm.leadOperations.tasks.description")}
    >
      <form
        className="grid gap-3 md:grid-cols-[minmax(0,1fr)_10rem_11rem_auto]"
        onSubmit={submit}
      >
        <label className="grid gap-2 text-xs font-semibold text-[var(--color-muted)]">
          {t("crm.tasks.field.title")}
          <input
            className="ui-input"
            placeholder={t("crm.leadOperations.tasks.titlePlaceholder")}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label className="grid gap-2 text-xs font-semibold text-[var(--color-muted)]">
          {t("common.priority")}
          <select
            className="ui-input"
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
          >
            <option value="LOW">{t("status.low")}</option>
            <option value="NORMAL">{t("status.normal")}</option>
            <option value="HIGH">{t("status.high")}</option>
          </select>
        </label>
        <label className="grid gap-2 text-xs font-semibold text-[var(--color-muted)]">
          {t("common.dueDate")}
          <input
            className="ui-input"
            type="date"
            value={dueAt}
            onChange={(event) => setDueAt(event.target.value)}
          />
        </label>
        <Button className="self-end" disabled={createTask.isPending || !title.trim()}>
          {createTask.isPending ? t("common.saving") : t("crm.tasks.create.title")}
        </Button>
      </form>
      {createTask.error ? (
        <div className="mt-3">
          <FeedbackState
            tone="error"
            title={t("crm.tasks.error.create")}
            description={createTask.error.message}
          />
        </div>
      ) : null}
      <div className="mt-4 grid gap-2">
        {tasks.isLoading ? <MiniEmpty>{t("crm.tasks.loading")}</MiniEmpty> : null}
        {tasks.error ? (
          <FeedbackState
            tone="error"
            title={t("crm.tasks.error.load")}
            description={tasks.error.message}
          />
        ) : null}
        {leadTasks.map((task) => (
          <article
            className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 sm:flex-row sm:items-center sm:justify-between"
            key={task.id}
          >
            <div>
              <p className="text-sm font-semibold text-[var(--color-foreground)]">{task.title}</p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                {formatLabel(task.priority, t)} {" · "} {formatLabel(task.status, t)} {" · "}
                {t("crm.tasks.duePrefix")} {formatDate(task.dueAt)}
              </p>
            </div>
            {task.status === "OPEN" ? (
              <button
                type="button"
                className="ui-button ui-button-secondary"
                disabled={completeTask.isPending}
                onClick={() => completeTask.mutate(task.id)}
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                {t("crm.leadOperations.tasks.complete")}
              </button>
            ) : null}
          </article>
        ))}
        {!tasks.isLoading && !tasks.error && !leadTasks.length ? (
          <MiniEmpty>{t("crm.leadOperations.tasks.empty")}</MiniEmpty>
        ) : null}
      </div>
      {completeTask.error ? (
        <div className="mt-3">
          <FeedbackState
            tone="error"
            title={t("crm.tasks.error.complete")}
            description={completeTask.error.message}
          />
        </div>
      ) : null}
    </OperationCard>
  );
}

function OperationCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4">
      <div className="flex gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
          {icon}
        </span>
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-foreground)]">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">{description}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function MiniEmpty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] p-3 text-sm text-[var(--color-muted)]">
      {children}
    </p>
  );
}

function formatLabel(value: string, t: Translate) {
  const normalized = value.toLowerCase();
  const key = `status.${normalized}`;
  const translated = t(key);
  if (translated !== key) return translated;
  return normalized
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

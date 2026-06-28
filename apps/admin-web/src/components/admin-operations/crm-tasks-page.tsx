"use client";

import { FormEvent, useMemo, useState } from "react";
import { Check, ClipboardCheck, LoaderCircle, Plus, RotateCcw } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { FeedbackState } from "@/components/feedback-state";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { useI18n } from "@/i18n";
import {
  useCompleteCrmTask,
  useCreateCrmTask,
  useCrmLeads,
  useCrmTasks,
} from "@/hooks/use-admin-crm";
import { formatDate } from "@/lib/format";

const statuses = ["OPEN", "DONE", "CANCELLED"] as const;
const priorities = ["LOW", "NORMAL", "HIGH"] as const;

export function CrmTasksPage({
  title,
  description,
}: {
  title?: string;
  description?: string;
}) {
  const { t, formatNumber } = useI18n();
  const tasks = useCrmTasks();
  const leads = useCrmLeads({ page: 1, pageSize: 100 });
  const createTask = useCreateCrmTask();
  const completeTask = useCompleteCrmTask();
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [due, setDue] = useState("");
  const [now] = useState(() => Date.now());
  const [form, setForm] = useState({
    title: "",
    crmLeadId: "",
    priority: "NORMAL",
    dueAt: "",
  });

  const filtered = useMemo(
    () =>
      (tasks.data ?? []).filter(
        (task) =>
          (!status || task.status === status) &&
          (!priority || task.priority === priority) &&
          (!due || (task.dueAt ?? "").slice(0, 10) === due),
      ),
    [due, priority, status, tasks.data],
  );

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

  const taskTitle = title ?? t("crm.tasks.title");
  const taskDescription = description ?? t("crm.tasks.description");

  return (
    <div className="space-y-6">
      <PageHeader title={taskTitle} description={taskDescription} />

      <section className="ui-card p-4 sm:p-5" aria-labelledby="task-filters-title">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="task-filters-title" className="text-sm font-semibold text-[var(--color-foreground)]">
              {t("crm.tasks.filters.title")}
            </h2>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              {t("crm.tasks.filters.description")}
            </p>
          </div>
          <button
            type="button"
            className="ui-button ui-button-secondary"
            onClick={() => {
              setStatus("");
              setPriority("");
              setDue("");
            }}
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            {t("common.reset")}
          </button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Filter
            label={t("common.status")}
            value={status}
            onChange={setStatus}
            options={statuses}
            t={t}
          />
          <Filter
            label={t("common.priority")}
            value={priority}
            onChange={setPriority}
            options={priorities}
            t={t}
          />
          <label className="grid gap-2 text-xs font-semibold text-[var(--color-muted)]">
            {t("common.dueDate")}
            <input
              className="ui-input"
              type="date"
              value={due}
              onChange={(event) => setDue(event.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="ui-card p-4 sm:p-5" aria-labelledby="create-task-title">
        <h2 id="create-task-title" className="text-sm font-semibold text-[var(--color-foreground)]">
          {t("crm.tasks.create.title")}
        </h2>
        <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
          {t("crm.tasks.create.description")}
        </p>
        <form
          className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(12rem,0.7fr)_9rem_11rem_auto]"
          onSubmit={submit}
        >
          <label className="grid gap-2 text-xs font-semibold text-[var(--color-muted)]">
            {t("crm.tasks.field.title")}
            <input
              className="ui-input"
              placeholder={t("crm.tasks.field.titlePlaceholder")}
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
            />
          </label>
          <label className="grid gap-2 text-xs font-semibold text-[var(--color-muted)]">
            {t("crm.tasks.field.lead")}
            <select
              className="ui-input"
              value={form.crmLeadId}
              onChange={(event) =>
                setForm((current) => ({ ...current, crmLeadId: event.target.value }))
              }
            >
              <option value="">{t("crm.tasks.field.noLinkedLead")}</option>
              {(leads.data?.items ?? []).map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.client?.name ?? t("crm.tasks.unnamedLead")}
                  {lead.project?.name ? ` - ${lead.project.name}` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-xs font-semibold text-[var(--color-muted)]">
            {t("common.priority")}
            <select
              className="ui-input"
              value={form.priority}
              onChange={(event) =>
                setForm((current) => ({ ...current, priority: event.target.value }))
              }
            >
              {priorities.map((option) => (
                <option key={option} value={option}>
                  {t(statusLabelKey(option))}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-xs font-semibold text-[var(--color-muted)]">
            {t("common.dueDate")}
            <input
              className="ui-input"
              type="date"
              value={form.dueAt}
              onChange={(event) =>
                setForm((current) => ({ ...current, dueAt: event.target.value }))
              }
            />
          </label>
          <button
            className="ui-button ui-button-primary self-end"
            disabled={createTask.isPending || !form.title.trim()}
          >
            {createTask.isPending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Plus className="h-4 w-4" aria-hidden="true" />
            )}
            {createTask.isPending ? t("common.saving") : t("common.create")}
          </button>
        </form>
        {createTask.error ? (
          <div className="mt-4">
            <FeedbackState
              tone="error"
              title={t("crm.tasks.error.create")}
              description={createTask.error.message}
            />
          </div>
        ) : null}
      </section>

      <section className="ui-card p-4 sm:p-5" aria-labelledby="task-results-title">
        <div className="mb-4">
          <h2 id="task-results-title" className="text-lg font-semibold text-[var(--color-foreground)]">
            {t("crm.tasks.results.title")}
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {t("crm.tasks.results.count", { count: formatNumber(filtered.length) })}
          </p>
        </div>
        {tasks.isLoading ? <LoadingState label={t("crm.tasks.loading")} /> : null}
        {tasks.error ? (
          <FeedbackState
            tone="error"
            title={t("crm.tasks.error.load")}
            description={tasks.error.message}
          />
        ) : null}
        {!tasks.isLoading && !tasks.error ? (
          <div className="grid gap-3">
            {filtered.map((task) => {
              const overdue =
                task.status === "OPEN" && task.dueAt && new Date(task.dueAt).getTime() < now;
              return (
                <article
                  className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-4 sm:flex-row sm:items-center sm:justify-between"
                  key={task.id}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-[var(--color-foreground)]">{task.title}</p>
                      <span className="ui-badge">{t(statusLabelKey(task.status))}</span>
                      <span className="ui-badge">{t(statusLabelKey(task.priority))}</span>
                      {overdue ? (
                        <span className="inline-flex rounded-full border border-[var(--color-danger)] bg-[var(--color-danger-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--color-danger)]">
                          {t("crm.tasks.overdue")}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-[var(--color-muted)]">
                      {t("crm.tasks.duePrefix")} {formatDate(task.dueAt)}
                      {task.crmLead?.client?.name
                        ? ` - ${t("crm.tasks.leadPrefix")}: ${task.crmLead.client.name}`
                        : ` - ${t("crm.tasks.unlinked")}`}
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
                      {t("crm.tasks.markComplete")}
                    </button>
                  ) : null}
                </article>
              );
            })}
            {!filtered.length ? (
              <EmptyState
                icon={<ClipboardCheck className="h-5 w-5" aria-hidden="true" />}
                title={t("crm.tasks.empty.title")}
                description={t("crm.tasks.empty.description")}
              />
            ) : null}
          </div>
        ) : null}
        {completeTask.error ? (
          <div className="mt-4">
            <FeedbackState
              tone="error"
              title={t("crm.tasks.error.complete")}
              description={completeTask.error.message}
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}

function Filter({
  label,
  value,
  onChange,
  options,
  t,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  t: (key: string) => string;
}) {
  return (
    <label className="grid gap-2 text-xs font-semibold text-[var(--color-muted)]">
      {label}
      <select className="ui-input" value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{t("common.all")}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {t(statusLabelKey(option))}
          </option>
        ))}
      </select>
    </label>
  );
}

function statusLabelKey(value: string) {
  return `status.${value.toLowerCase()}`;
}

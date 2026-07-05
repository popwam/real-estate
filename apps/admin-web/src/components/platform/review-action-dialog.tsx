"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ReviewActionInput } from "@/types/platform";
import { useI18n } from "@/i18n";

type Tone = "primary" | "danger" | "warning" | "neutral";
const reviewActionSchema = z.object({
  reason: z.string(),
  notes: z.string(),
});
type ReviewActionFormValues = z.infer<typeof reviewActionSchema>;

const toneClasses: Record<Tone, string> = {
  primary: "ui-button-primary",
  danger: "bg-[var(--color-danger)] text-[var(--color-danger-foreground)] hover:opacity-90",
  warning: "bg-[var(--color-warning)] text-[var(--color-warning-foreground)] hover:opacity-90",
  neutral: "ui-button-secondary",
};

export function ReviewActionDialog({
  trigger,
  title,
  description,
  confirmLabel,
  requireReason = false,
  tone = "primary",
  isPending,
  error,
  onConfirm,
}: {
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  requireReason?: boolean;
  tone?: Tone;
  isPending?: boolean;
  error?: Error | null;
  onConfirm: (input: ReviewActionInput) => Promise<unknown>;
}) {
  const { t } = useI18n();

  const [open, setOpen] = useState(false);
  const schema = reviewActionSchema.superRefine((values, context) => {
    if (requireReason && !values.reason.trim()) {
      context.addIssue({
        code: "custom",
        path: ["reason"],
        message: "Reason is required.",
      });
    }
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReviewActionFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { reason: "", notes: "" },
  });
  const dialogId = `review-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  async function submit(values: ReviewActionInput) {
    await onConfirm({
      reason: values.reason?.trim() || undefined,
      notes: values.notes?.trim() || undefined,
    });
    reset();
    setOpen(false);
  }

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-overlay)] px-4 py-6">
          <div className="ui-dialog w-full max-w-lg" role="dialog" aria-modal="true" aria-labelledby={dialogId}>
            <form onSubmit={handleSubmit(submit)}>
              <div className="border-b border-[var(--color-border)] px-5 py-4">
                <h2 id={dialogId} className="text-base font-semibold text-[var(--color-foreground)]">{title}</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">{description}</p>
              </div>
              <div className="space-y-4 px-5 py-5">
                <div className="space-y-2">
                  <Label htmlFor={`${title}-reason`}>{t("adminSweep.reason.f219cc06")}{requireReason ? "" : "(optional)"}
                  </Label>
                  <Textarea
                    id={`${title}-reason`}
                    placeholder={t("adminSweep.add.a.clear.compliance.reason.4fdaac7c")}
                    {...register("reason")}
                  />
                  {errors.reason ? (
                    <p className="text-sm text-[var(--color-danger)]">{errors.reason.message}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${title}-notes`}>{t("adminSweep.internal.notes.optional.0170b302")}</Label>
                  <Textarea
                    id={`${title}-notes`}
                    placeholder={t("adminSweep.add.notes.for.the.platform.audit.trail.7c0fad75")}
                    {...register("notes")}
                  />
                </div>
                {error ? (
                  <div className="ui-feedback ui-feedback-error flex gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{error.message}</span>
                  </div>
                ) : null}
              </div>
              <div className="flex justify-end gap-2 border-t border-[var(--color-border)] px-5 py-4">
                <Button
                  className="ui-button-secondary"
                  onClick={() => {
                    reset();
                    setOpen(false);
                  }}
                >{t("adminSweep.cancel.77dfd213")}</Button>
                <Button className={cn(toneClasses[tone])} disabled={isPending} type="submit">
                  {isPending ? "Working" : confirmLabel}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

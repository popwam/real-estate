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

const reasonSchema = z.object({ reason: z.string(), notes: z.string() });
type ReasonValues = z.infer<typeof reasonSchema>;
type Tone = "primary" | "danger" | "warning" | "neutral";

const toneClasses: Record<Tone, string> = {
  primary: "ui-button-primary",
  danger: "bg-[var(--color-danger)] text-white hover:opacity-90",
  warning: "ui-button-secondary",
  neutral: "ui-button-secondary",
};

export function ReasonDialog({
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
  onConfirm: (input: { reason?: string; notes?: string }) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const schema = reasonSchema.superRefine((values, context) => {
    if (requireReason && !values.reason.trim()) {
      context.addIssue({ code: "custom", path: ["reason"], message: "Reason is required." });
    }
  });
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ReasonValues>({
    resolver: zodResolver(schema),
    defaultValues: { reason: "", notes: "" },
  });

  async function submit(values: ReasonValues) {
    await onConfirm({
      reason: values.reason.trim() || undefined,
      notes: values.notes.trim() || undefined,
    });
    reset();
    setOpen(false);
  }

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-overlay)] px-4 py-6" role="dialog" aria-modal="true" aria-labelledby={`${title}-title`}>
          <div className="ui-card w-full max-w-lg shadow-xl">
            <form onSubmit={handleSubmit(submit)}>
              <div className="border-b border-[var(--color-border)] px-5 py-4">
                <h2 id={`${title}-title`} className="text-base font-semibold text-[var(--color-text)]">{title}</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">{description}</p>
              </div>
              <div className="space-y-4 px-5 py-5">
                <div className="space-y-2">
                  <Label htmlFor={`${title}-reason`}>Reason {requireReason ? "" : "(optional)"}</Label>
                  <Textarea id={`${title}-reason`} {...register("reason")} />
                  {errors.reason ? <p className="text-sm text-[var(--color-danger)]" role="alert">{errors.reason.message}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${title}-notes`}>Notes (optional)</Label>
                  <Textarea id={`${title}-notes`} {...register("notes")} />
                </div>
                {error ? (
                  <div className="ui-feedback ui-feedback-error flex gap-2 text-sm" role="alert">
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
                >
                  Cancel
                </Button>
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

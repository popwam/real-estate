"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n";

const schema = z.object({ reason: z.string() });
type Values = z.infer<typeof schema>;

export function CommissionActionDialog({
  action,
  trigger,
  isPending,
  error,
  onConfirm,
}: {
  action: "approve" | "reject";
  trigger: ReactNode;
  isPending?: boolean;
  error?: Error | null;
  onConfirm: (input: { reason?: string }) => Promise<unknown>;
}) {
  const { t } = useI18n();

  const [open, setOpen] = useState(false);
  const scopedSchema = schema.superRefine((values, context) => {
    if (action === "reject" && !values.reason.trim()) {
      context.addIssue({ code: "custom", path: ["reason"], message: "Reason is required." });
    }
  });
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(scopedSchema),
    defaultValues: { reason: "" },
  });

  async function submit(values: Values) {
    await onConfirm({ reason: values.reason || undefined });
    reset();
    setOpen(false);
  }

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-overlay)] px-4 py-6" role="dialog" aria-modal="true" aria-label={action === "approve" ? "Approve commission" : "Reject commission"}>
          <div className="ui-card w-full max-w-lg shadow-xl">
            <form onSubmit={handleSubmit(submit)}>
              <div className="border-b border-[var(--color-border)] px-5 py-4">
                <h2 className="text-base font-semibold text-[var(--color-text)]">{action === "approve" ? "Approve commission" : "Reject commission"}</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">{t("adminSweep.this.reviews.the.calculated.entry.only.it.does.n.04f0337a")}</p>
              </div>
              <div className="space-y-4 px-5 py-5">
                {action === "reject" ? (
                  <div className="space-y-2">
                    <Label>{t("adminSweep.reason.f219cc06")}</Label>
                    <Textarea {...register("reason")} />
                    {errors.reason ? <p className="text-sm text-[var(--color-danger)]" role="alert">{errors.reason.message}</p> : null}
                  </div>
                ) : null}
                {error ? <div className="ui-feedback ui-feedback-error flex gap-2 text-sm" role="alert"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error.message}</span></div> : null}
              </div>
              <div className="flex justify-end gap-2 border-t border-[var(--color-border)] px-5 py-4">
                <Button className="ui-button-secondary" onClick={() => setOpen(false)}>{t("adminSweep.cancel.77dfd213")}</Button>
                <Button className={action === "reject" ? "bg-[var(--color-danger)] text-white hover:opacity-90" : undefined} disabled={isPending} type="submit">{isPending ? "Working" : action === "approve" ? "Approve" : "Reject"}</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

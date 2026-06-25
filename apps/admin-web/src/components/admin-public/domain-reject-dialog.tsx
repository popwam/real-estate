"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({ reason: z.string().min(1, "Reason is required.") });
type Values = z.infer<typeof schema>;

export function DomainRejectDialog({
  trigger,
  isPending,
  error,
  onConfirm,
}: {
  trigger: ReactNode;
  isPending?: boolean;
  error?: Error | null;
  onConfirm: (reason: string) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { reason: "" },
  });
  const dialogTitleId = "domain-reject-title";

  async function submit(values: Values) {
    await onConfirm(values.reason.trim());
    reset();
    setOpen(false);
  }

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-overlay)] px-4 py-6">
          <div className="ui-dialog w-full max-w-lg" role="dialog" aria-modal="true" aria-labelledby={dialogTitleId}>
            <form onSubmit={handleSubmit(submit)}>
              <div className="border-b border-[var(--color-border)] px-5 py-4">
                <h2 id={dialogTitleId} className="text-base font-semibold text-[var(--color-foreground)]">Reject domain</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                  Store a clear reason for the organization before this domain is rejected.
                </p>
              </div>
              <div className="space-y-4 px-5 py-5">
                <div className="space-y-2">
                  <Label htmlFor="domain-reject-reason">Reason</Label>
                  <Textarea id="domain-reject-reason" {...register("reason")} aria-invalid={Boolean(errors.reason)} />
                  {errors.reason ? <p className="text-sm text-[var(--color-danger)]">{errors.reason.message}</p> : null}
                </div>
                {error ? (
                  <div className="ui-feedback ui-feedback-error flex gap-2" role="alert">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{error.message}</span>
                  </div>
                ) : null}
              </div>
              <div className="flex justify-end gap-2 border-t border-[var(--color-border)] px-5 py-4">
                <Button className="ui-button-secondary" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button className="bg-[var(--color-danger)] text-[var(--color-danger-foreground)] hover:opacity-90" disabled={isPending} type="submit">
                  {isPending ? "Rejecting" : "Reject"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Action = "finalize" | "approve" | "cancel";
const schema = z.object({
  dealRoomId: z.string(),
  finalPrice: z.string(),
  currency: z.string(),
  reason: z.string(),
});
type Values = z.infer<typeof schema>;

export function DealActionDialog({
  action,
  trigger,
  defaultDealRoomId = "",
  isPending,
  error,
  onConfirm,
}: {
  action: Action;
  trigger: ReactNode;
  defaultDealRoomId?: string;
  isPending?: boolean;
  error?: Error | null;
  onConfirm: (input: { dealRoomId?: string; finalPrice?: number; currency?: string; reason?: string }) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm<Values>({
    resolver: zodResolver(schema),
    values: { dealRoomId: defaultDealRoomId, finalPrice: "", currency: "EGP", reason: "" },
  });
  const copy = {
    finalize: ["Finalize deal", "Create a deal from an eligible room. Record a final price only when the parties have agreed it."],
    approve: ["Approve deal", "Confirm this deal as an authorized reviewer. This action does not process a payment."],
    cancel: ["Cancel deal", "Close this deal with an audit reason. This cannot be used for a deal already recorded as sold."],
  }[action];

  async function submit(values: Values) {
    await onConfirm({
      dealRoomId: values.dealRoomId || undefined,
      finalPrice: values.finalPrice ? Number(values.finalPrice) : undefined,
      currency: values.currency || undefined,
      reason: values.reason || undefined,
    });
    reset();
    setOpen(false);
  }

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-overlay)] px-4 py-6" role="dialog" aria-modal="true" aria-label={copy[0]}>
          <div className="ui-card w-full max-w-lg shadow-xl">
            <form onSubmit={handleSubmit(submit)}>
              <div className="border-b border-[var(--color-border)] px-5 py-4">
                <h2 className="text-base font-semibold text-[var(--color-text)]">{copy[0]}</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">{copy[1]}</p>
              </div>
              <div className="space-y-4 px-5 py-5">
                {action === "finalize" ? (
                  <>
                    <Field label="Deal Room ID"><Input {...register("dealRoomId")} /></Field>
                    <Field label="Final price (optional)"><Input type="number" min="0" step="0.01" {...register("finalPrice")} /></Field>
                    <Field label="Currency"><Input {...register("currency")} /></Field>
                  </>
                ) : null}
                {action === "cancel" ? <Field label="Reason"><Textarea {...register("reason")} /></Field> : null}
                {error ? (
                  <div className="ui-feedback ui-feedback-error flex gap-2 text-sm" role="alert">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{error.message}</span>
                  </div>
                ) : null}
              </div>
              <div className="flex justify-end gap-2 border-t border-[var(--color-border)] px-5 py-4">
                <Button className="ui-button-secondary" onClick={() => setOpen(false)}>Cancel</Button>
                <Button disabled={isPending} type="submit">{isPending ? "Working" : copy[0]}</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}

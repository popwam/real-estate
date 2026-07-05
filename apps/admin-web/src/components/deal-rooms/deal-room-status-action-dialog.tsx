"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { DealRoomStatus } from "@/types/deal-rooms";
import { useI18n } from "@/i18n";

const schema = z.object({
  status: z.enum(["NEGOTIATION", "PENDING_APPROVAL", "APPROVED"]),
});
type Values = z.infer<typeof schema>;

export function DealRoomStatusActionDialog({
  trigger,
  currentStatus,
  isPending,
  error,
  onConfirm,
}: {
  trigger: ReactNode;
  currentStatus: DealRoomStatus;
  isPending?: boolean;
  error?: Error | null;
  onConfirm: (status: DealRoomStatus) => Promise<unknown>;
}) {
  const { t } = useI18n();

  const [open, setOpen] = useState(false);
  const { register, handleSubmit } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { status: currentStatus === "OPEN" ? "NEGOTIATION" : "PENDING_APPROVAL" },
  });

  async function submit(values: Values) {
    await onConfirm(values.status);
    setOpen(false);
  }

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-overlay)] px-4 py-6" role="dialog" aria-modal="true" aria-label={t("adminSweep.update.deal.room.status.e73c790b")}>
          <div className="ui-card w-full max-w-lg shadow-xl">
            <form onSubmit={handleSubmit(submit)}>
              <div className="border-b border-[var(--color-border)] px-5 py-4">
                <h2 className="text-base font-semibold text-[var(--color-text)]">{t("adminSweep.update.deal.room.status.e73c790b")}</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">{t("adminSweep.sold.is.intentionally.hidden.in.team.3.slice.5.f.27ed9bab")}</p>
              </div>
              <div className="space-y-4 px-5 py-5">
                <div className="space-y-2">
                  <Label>{t("adminSweep.status.bae7d5be")}</Label>
                  <select className="ui-input" {...register("status")}>
                    <option value="NEGOTIATION">NEGOTIATION</option>
                    <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
                    <option value="APPROVED">APPROVED</option>
                  </select>
                </div>
                {error ? (
                  <div className="ui-feedback ui-feedback-error flex gap-2 text-sm" role="alert">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{error.message}</span>
                  </div>
                ) : null}
              </div>
              <div className="flex justify-end gap-2 border-t border-[var(--color-border)] px-5 py-4">
                <Button className="ui-button-secondary" onClick={() => setOpen(false)}>{t("adminSweep.cancel.77dfd213")}</Button>
                <Button disabled={isPending} type="submit">{isPending ? "Updating" : "Update status"}</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { LeadClaimConflictResolution } from "@/types/lead-reservations";
import { useI18n } from "@/i18n";

const schema = z.object({
  resolution: z.enum(["FIRST_WINS", "ESCALATED", "MANUAL_REVIEW"]),
  notes: z.string(),
});
type Values = z.infer<typeof schema>;

export function ConflictResolutionDialog({
  trigger,
  isPending,
  error,
  onConfirm,
}: {
  trigger: ReactNode;
  isPending?: boolean;
  error?: Error | null;
  onConfirm: (input: { resolution: LeadClaimConflictResolution; notes?: string }) => Promise<unknown>;
}) {
  const { t } = useI18n();

  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { resolution: "FIRST_WINS", notes: "" },
  });

  async function submit(values: Values) {
    await onConfirm({ resolution: values.resolution, notes: values.notes.trim() || undefined });
    reset();
    setOpen(false);
  }

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 px-4 py-6">
          <div className="w-full max-w-lg rounded-md bg-white shadow-xl">
            <form onSubmit={handleSubmit(submit)}>
              <div className="border-b border-zinc-200 px-5 py-4">
                <h2 className="text-base font-semibold text-zinc-950">{t("adminSweep.resolve.claim.conflict.e79ebc8f")}</h2>
                <p className="mt-1 text-sm leading-6 text-zinc-500">{t("adminSweep.choose.the.platform.resolution.outcome.broker.id.5ab97e3f")}</p>
              </div>
              <div className="space-y-4 px-5 py-5">
                <div className="space-y-2">
                  <Label htmlFor="resolution">{t("adminSweep.resolution.516aae52")}</Label>
                  <select
                    id="resolution"
                    className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm"
                    {...register("resolution")}
                  >
                    <option value="FIRST_WINS">FIRST_WINS</option>
                    <option value="ESCALATED">ESCALATED</option>
                    <option value="MANUAL_REVIEW">MANUAL_REVIEW</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resolution-notes">{t("adminSweep.notes.optional.4d56ca9b")}</Label>
                  <Textarea id="resolution-notes" {...register("notes")} />
                </div>
                {error ? (
                  <div className="flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{error.message}</span>
                  </div>
                ) : null}
              </div>
              <div className="flex justify-end gap-2 border-t border-zinc-200 px-5 py-4">
                <Button className="bg-white text-zinc-700 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50" onClick={() => setOpen(false)}>{t("adminSweep.cancel.77dfd213")}</Button>
                <Button disabled={isPending} type="submit">
                  {isPending ? "Resolving" : "Resolve conflict"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

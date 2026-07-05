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
import type { PublicLeadStatusInput } from "@/types/admin-public";
import { useI18n } from "@/i18n";

const schema = z.object({ note: z.string() });
type Values = z.infer<typeof schema>;
type Action = "review" | "spam" | "convert";

const content: Record<Action, { title: string; description: string; confirm: string; tone: string }> = {
  review: {
    title: "Mark public lead reviewed",
    description: "This only updates the public lead status in the organization inbox.",
    confirm: "Mark reviewed",
    tone: "bg-zinc-950 hover:bg-zinc-800",
  },
  spam: {
    title: "Mark public lead spam",
    description: "This hides the lead from normal follow-up queues but does not delete it.",
    confirm: "Mark spam",
    tone: "bg-red-600 hover:bg-red-700",
  },
  convert: {
    title: "Convert placeholder",
    description: "This marks the public lead converted. It does not create a LeadClaim, ReservationRequest, broker assignment, deal, or CRM record.",
    confirm: "Convert placeholder",
    tone: "bg-emerald-700 hover:bg-emerald-800",
  },
};

export function PublicLeadActionDialog({
  action,
  trigger,
  isPending,
  error,
  onConfirm,
}: {
  action: Action;
  trigger: ReactNode;
  isPending?: boolean;
  error?: Error | null;
  onConfirm: (input: Partial<PublicLeadStatusInput>) => Promise<unknown>;
}) {
  const { t } = useI18n();

  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { note: "" },
  });
  const copy = content[action];

  async function submit(values: Values) {
    await onConfirm({ note: values.note.trim() || undefined });
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
                <h2 className="text-base font-semibold text-zinc-950">{copy.title}</h2>
                <p className="mt-1 text-sm leading-6 text-zinc-500">{copy.description}</p>
              </div>
              <div className="space-y-4 px-5 py-5">
                {action === "review" ? (
                  <div className="space-y-2">
                    <Label>{t("adminSweep.note.optional.4e395670")}</Label>
                    <Textarea {...register("note")} />
                  </div>
                ) : null}
                {error ? (
                  <div className="flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{error.message}</span>
                  </div>
                ) : null}
              </div>
              <div className="flex justify-end gap-2 border-t border-zinc-200 px-5 py-4">
                <Button
                  className="bg-white text-zinc-700 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50"
                  onClick={() => {
                    reset();
                    setOpen(false);
                  }}
                >{t("adminSweep.cancel.77dfd213")}</Button>
                <Button className={cn(copy.tone)} disabled={isPending} type="submit">
                  {isPending ? "Working" : copy.confirm}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

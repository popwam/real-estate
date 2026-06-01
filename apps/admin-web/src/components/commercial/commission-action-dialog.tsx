"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 px-4 py-6">
          <div className="w-full max-w-lg rounded-md bg-white shadow-xl">
            <form onSubmit={handleSubmit(submit)}>
              <div className="border-b border-zinc-200 px-5 py-4">
                <h2 className="text-base font-semibold text-zinc-950">{action === "approve" ? "Approve commission" : "Reject commission"}</h2>
                <p className="mt-1 text-sm leading-6 text-zinc-500">No paid or settlement action is available in this UI.</p>
              </div>
              <div className="space-y-4 px-5 py-5">
                {action === "reject" ? (
                  <div className="space-y-2">
                    <Label>Reason</Label>
                    <Textarea {...register("reason")} />
                    {errors.reason ? <p className="text-sm text-red-600">{errors.reason.message}</p> : null}
                  </div>
                ) : null}
                {error ? <div className="flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error.message}</span></div> : null}
              </div>
              <div className="flex justify-end gap-2 border-t border-zinc-200 px-5 py-4">
                <Button className="bg-white text-zinc-700 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50" onClick={() => setOpen(false)}>Cancel</Button>
                <Button className={action === "reject" ? "bg-red-600 hover:bg-red-700" : undefined} disabled={isPending} type="submit">{isPending ? "Working" : action === "approve" ? "Approve" : "Reject"}</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

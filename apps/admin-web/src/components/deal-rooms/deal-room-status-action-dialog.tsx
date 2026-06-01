"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { DealRoomStatus } from "@/types/deal-rooms";

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 px-4 py-6">
          <div className="w-full max-w-lg rounded-md bg-white shadow-xl">
            <form onSubmit={handleSubmit(submit)}>
              <div className="border-b border-zinc-200 px-5 py-4">
                <h2 className="text-base font-semibold text-zinc-950">Update deal room status</h2>
                <p className="mt-1 text-sm leading-6 text-zinc-500">
                  SOLD is intentionally hidden in Team 3 Slice 5; finalization belongs to the later deal/commission flow.
                </p>
              </div>
              <div className="space-y-4 px-5 py-5">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm" {...register("status")}>
                    <option value="NEGOTIATION">NEGOTIATION</option>
                    <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
                    <option value="APPROVED">APPROVED</option>
                  </select>
                </div>
                {error ? (
                  <div className="flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{error.message}</span>
                  </div>
                ) : null}
              </div>
              <div className="flex justify-end gap-2 border-t border-zinc-200 px-5 py-4">
                <Button className="bg-white text-zinc-700 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button disabled={isPending} type="submit">{isPending ? "Updating" : "Update status"}</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

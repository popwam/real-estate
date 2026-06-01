"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ReasonDialog } from "@/components/lead-reservations/reason-dialog";

export function ReservationActionDialog({
  action,
  trigger,
  isPending,
  error,
  onConfirm,
}: {
  action: "approve" | "reject" | "cancel";
  trigger: ReactNode;
  isPending?: boolean;
  error?: Error | null;
  onConfirm: (input: { reason?: string }) => Promise<unknown>;
}) {
  const copy = {
    approve: {
      title: "Approve reservation",
      description: "Approving this request will place the unit on hold for the broker reservation workflow.",
      confirmLabel: "Approve and hold unit",
      requireReason: false,
      tone: "primary" as const,
    },
    reject: {
      title: "Reject reservation",
      description: "Add a clear reason so the broker understands why this reservation cannot proceed.",
      confirmLabel: "Reject request",
      requireReason: true,
      tone: "danger" as const,
    },
    cancel: {
      title: "Cancel reservation",
      description: "Cancel this pending reservation request. This does not approve or hold the unit.",
      confirmLabel: "Cancel request",
      requireReason: false,
      tone: "warning" as const,
    },
  }[action];

  return (
    <ReasonDialog
      trigger={trigger}
      title={copy.title}
      description={copy.description}
      confirmLabel={copy.confirmLabel}
      requireReason={copy.requireReason}
      tone={copy.tone}
      isPending={isPending}
      error={error}
      onConfirm={onConfirm}
    />
  );
}

export function ReservationActionButton({ children, className }: { children: ReactNode; className?: string }) {
  return <Button className={className}>{children}</Button>;
}

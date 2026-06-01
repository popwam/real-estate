"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  AddDealRoomParticipantInput,
  DealRoomParticipantRole,
  DealRoomParticipantStatus,
} from "@/types/deal-rooms";

const schema = z.object({
  userId: z.string(),
  clientId: z.string(),
  organizationId: z.string(),
  role: z.enum(["BROKER", "DEVELOPER_SALES", "SALES_MANAGER", "CLIENT", "PLATFORM_SUPPORT"]),
  status: z.enum(["INVITED", "ACTIVE", "LEFT", "REMOVED"]),
}).superRefine((values, context) => {
  if (!values.userId.trim() && !values.clientId.trim() && !values.organizationId.trim()) {
    context.addIssue({ code: "custom", path: ["userId"], message: "Provide at least one raw ID." });
  }
});
type Values = z.infer<typeof schema>;

export function DealRoomParticipantForm({
  isPending,
  error,
  onSubmit,
}: {
  isPending?: boolean;
  error?: Error | null;
  onSubmit: (input: AddDealRoomParticipantInput) => Promise<unknown>;
}) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { userId: "", clientId: "", organizationId: "", role: "DEVELOPER_SALES", status: "ACTIVE" },
  });

  async function submit(values: Values) {
    await onSubmit({
      userId: values.userId || undefined,
      clientId: values.clientId || undefined,
      organizationId: values.organizationId || undefined,
      role: values.role as DealRoomParticipantRole,
      status: values.status as DealRoomParticipantStatus,
    });
    reset();
  }

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(submit)}>
      <Field label="User ID" error={errors.userId?.message}><Input {...register("userId")} /></Field>
      <Field label="Client ID"><Input {...register("clientId")} /></Field>
      <Field label="Organization ID"><Input {...register("organizationId")} /></Field>
      <Field label="Role">
        <select className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm" {...register("role")}>
          <option value="BROKER">BROKER</option>
          <option value="DEVELOPER_SALES">DEVELOPER_SALES</option>
          <option value="SALES_MANAGER">SALES_MANAGER</option>
          <option value="CLIENT">CLIENT</option>
          <option value="PLATFORM_SUPPORT">PLATFORM_SUPPORT</option>
        </select>
      </Field>
      <Field label="Status">
        <select className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm" {...register("status")}>
          <option value="INVITED">INVITED</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="LEFT">LEFT</option>
          <option value="REMOVED">REMOVED</option>
        </select>
      </Field>
      {error ? (
        <div className="flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 md:col-span-2">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error.message}</span>
        </div>
      ) : null}
      <div className="md:col-span-2">
        <Button disabled={isPending} type="submit">{isPending ? "Adding" : "Add participant"}</Button>
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

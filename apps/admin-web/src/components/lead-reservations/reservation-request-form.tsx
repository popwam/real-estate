"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CreateReservationRequestInput } from "@/types/lead-reservations";
import { useI18n } from "@/i18n";

const schema = z.object({
  leadClaimId: z.string().min(1, "Lead claim id is required."),
  unitId: z.string(),
  notes: z.string(),
});
type Values = z.infer<typeof schema>;

export function ReservationRequestForm({
  defaultLeadClaimId = "",
  isPending,
  error,
  onSubmit,
}: {
  defaultLeadClaimId?: string;
  isPending?: boolean;
  error?: Error | null;
  onSubmit: (input: CreateReservationRequestInput) => Promise<unknown>;
}) {
  const { t } = useI18n();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    values: { leadClaimId: defaultLeadClaimId, unitId: "", notes: "" },
  });

  async function submit(values: Values) {
    await onSubmit({
      leadClaimId: values.leadClaimId,
      unitId: values.unitId || undefined,
      notes: values.notes || undefined,
    });
    reset({ leadClaimId: defaultLeadClaimId, unitId: "", notes: "" });
  }

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(submit)}>
      <div className="space-y-2">
        <Label>{t("adminSweep.lead.claim.id.49128b44")}</Label>
        <Input {...register("leadClaimId")} />
        {errors.leadClaimId ? <p className="text-sm text-[var(--color-danger)]" role="alert">{errors.leadClaimId.message}</p> : null}
      </div>
      <div className="space-y-2">
        <Label>{t("adminSweep.unit.id.optional.bb89c3e5")}</Label>
        <Input {...register("unitId")} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>{t("adminSweep.notes.70440046")}</Label>
        <Textarea {...register("notes")} />
      </div>
      {error ? (
        <div className="ui-feedback ui-feedback-error flex gap-2 text-sm md:col-span-2" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error.message}</span>
        </div>
      ) : null}
      <div className="md:col-span-2">
        <Button disabled={isPending} type="submit">{isPending ? "Creating" : "Create reservation request"}</Button>
      </div>
    </form>
  );
}

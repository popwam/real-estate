"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n";
import type { CreateDealRoomMessageInput, DealRoomMessageType } from "@/types/deal-rooms";

const schema = z.object({
  messageType: z.enum(["TEXT", "SYSTEM", "DOCUMENT", "STATUS_UPDATE"]),
  body: z.string().min(1, "Message is required."),
});
type Values = z.infer<typeof schema>;

export function DealRoomMessageComposer({
  isPending,
  error,
  onSubmit,
}: {
  isPending?: boolean;
  error?: Error | null;
  onSubmit: (input: CreateDealRoomMessageInput) => Promise<unknown>;
}) {
  const { t } = useI18n();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { messageType: "TEXT", body: "" },
  });

  async function submit(values: Values) {
    await onSubmit({
      messageType: values.messageType as DealRoomMessageType,
      body: values.body,
    });
    reset();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(submit)}>
      <div className="space-y-2">
        <Label>{t("common.type")}</Label>
        <select className="ui-input" {...register("messageType")}>
          <option value="TEXT">{t("dealRooms.messageType.message")}</option>
          <option value="SYSTEM">{t("dealRooms.messageType.system")}</option>
          <option value="DOCUMENT">{t("dealRooms.messageType.document")}</option>
          <option value="STATUS_UPDATE">{t("dealRooms.messageType.status")}</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label>{t("dealRooms.message")}</Label>
        <Textarea placeholder={t("dealRooms.messagePlaceholder")} {...register("body")} />
        {errors.body ? <p className="text-sm text-[var(--color-danger)]" role="alert">{t("dealRooms.messageRequired")}</p> : null}
      </div>
      {error ? (
        <div className="ui-feedback ui-feedback-error flex gap-2 text-sm" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error.message}</span>
        </div>
      ) : null}
      <Button disabled={isPending} type="submit">{isPending ? t("common.sending") : t("dealRooms.sendMessage")}</Button>
    </form>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FeedbackState } from "@/components/feedback-state";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CreateConversationMessageInput } from "@/types/admin-crm";
import { useI18n } from "@/i18n";

const schema = z.object({ body: z.string().trim().min(1, "Message is required.") });
type Values = z.infer<typeof schema>;

export function ConversationMessageComposer({ isPending, error, onSubmit }: { isPending?: boolean; error?: Error | null; onSubmit: (input: CreateConversationMessageInput) => Promise<unknown> }) {
  const { t } = useI18n();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { body: "" } });
  async function submit(values: Values) { await onSubmit({ type: "TEXT", body: values.body.trim() }); reset(); }
  return <form className="space-y-3" onSubmit={handleSubmit(submit)}><div className="space-y-2"><Label htmlFor="conversation-message">{t("adminSweep.message.68f4145f")}</Label><Textarea id="conversation-message" className="min-h-24 resize-y" placeholder={t("adminSweep.write.a.clear.reply.7f680879")} aria-invalid={Boolean(errors.body)} aria-describedby={errors.body ? "conversation-message-error" : undefined} {...register("body")} />{errors.body ? <p id="conversation-message-error" className="text-sm text-[var(--color-danger)]" role="alert">{errors.body.message}</p> : null}</div>{error ? <FeedbackState tone="error" title={t("adminSweep.message.could.not.be.sent.c8e1407a")} description={error.message} /> : null}<div className="flex items-center justify-between gap-3"><p className="text-xs text-[var(--color-muted)]">{t("adminSweep.messages.are.sent.through.the.existing.conversat.fa0757c1")}</p><Button disabled={isPending} type="submit">{isPending ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}{isPending ? "Sending…" : "Send message"}</Button></div></form>;
}

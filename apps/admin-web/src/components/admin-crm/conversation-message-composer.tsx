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

const schema = z.object({ body: z.string().trim().min(1, "Message is required.") });
type Values = z.infer<typeof schema>;

export function ConversationMessageComposer({ isPending, error, onSubmit }: { isPending?: boolean; error?: Error | null; onSubmit: (input: CreateConversationMessageInput) => Promise<unknown> }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { body: "" } });
  async function submit(values: Values) { await onSubmit({ type: "TEXT", body: values.body.trim() }); reset(); }
  return <form className="space-y-3" onSubmit={handleSubmit(submit)}><div className="space-y-2"><Label htmlFor="conversation-message">Message</Label><Textarea id="conversation-message" className="min-h-24 resize-y" placeholder="Write a clear reply…" aria-invalid={Boolean(errors.body)} aria-describedby={errors.body ? "conversation-message-error" : undefined} {...register("body")} />{errors.body ? <p id="conversation-message-error" className="text-sm text-[var(--color-danger)]" role="alert">{errors.body.message}</p> : null}</div>{error ? <FeedbackState tone="error" title="Message could not be sent" description={error.message} /> : null}<div className="flex items-center justify-between gap-3"><p className="text-xs text-[var(--color-muted)]">Messages are sent through the existing conversation API.</p><Button disabled={isPending} type="submit">{isPending ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}{isPending ? "Sending…" : "Send message"}</Button></div></form>;
}

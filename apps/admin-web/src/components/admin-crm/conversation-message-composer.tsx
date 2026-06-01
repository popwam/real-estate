"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CreateConversationMessageInput } from "@/types/admin-crm";

const schema = z.object({
  body: z.string().min(1, "Message is required."),
});
type Values = z.infer<typeof schema>;

export function ConversationMessageComposer({
  isPending,
  error,
  onSubmit,
}: {
  isPending?: boolean;
  error?: Error | null;
  onSubmit: (input: CreateConversationMessageInput) => Promise<unknown>;
}) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { body: "" },
  });

  async function submit(values: Values) {
    await onSubmit({ type: "TEXT", body: values.body });
    reset();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(submit)}>
      <div className="space-y-2">
        <Label>Message</Label>
        <Textarea placeholder="Write a conversation message." {...register("body")} />
        {errors.body ? <p className="text-sm text-red-600">{errors.body.message}</p> : null}
      </div>
      {error ? (
        <div className="flex gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error.message}</span>
        </div>
      ) : null}
      <Button disabled={isPending} type="submit">{isPending ? "Sending" : "Send message"}</Button>
    </form>
  );
}

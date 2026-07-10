"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { FeedbackState } from "@/components/feedback-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useI18n } from "@/i18n";
import { changePasswordApi } from "@/lib/api";
import { getRoleHome } from "@/lib/auth";

export function ChangePasswordForm() {
  const { t } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUser = useCurrentUser();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const mutation = useMutation({
    mutationFn: changePasswordApi,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      const session = await currentUser.refetch();
      router.replace(getRoleHome(session.data?.user.role, session.data?.organization?.type, session.data?.permissions));
    },
  });

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (newPassword !== confirmPassword) return;
    await mutation.mutateAsync({ currentPassword, newPassword });
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
          {t("auth.changePassword.eyebrow")}
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-[var(--color-foreground)]">
          {t("auth.changePassword.title")}
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
          {t("auth.changePassword.description")}
        </p>
      </div>
      <Field id="currentPassword" label={t("auth.changePassword.currentPassword")}>
        <Input id="currentPassword" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
      </Field>
      <Field id="newPassword" label={t("auth.changePassword.newPassword")}>
        <Input id="newPassword" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required minLength={8} />
      </Field>
      <Field id="confirmPassword" label={t("auth.changePassword.confirmPassword")}>
        <Input id="confirmPassword" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={8} />
      </Field>
      {newPassword && confirmPassword && newPassword !== confirmPassword ? (
        <FeedbackState tone="error" title={t("auth.changePassword.passwordMismatch")} />
      ) : null}
      {mutation.error ? <FeedbackState tone="error" title={t("auth.changePassword.error")} description={mutation.error.message} /> : null}
      <Button type="submit" className="w-full" disabled={mutation.isPending || newPassword !== confirmPassword}>
        <KeyRound className="h-4 w-4" aria-hidden="true" />
        {mutation.isPending ? t("common.saving") : t("auth.changePassword.submit")}
      </Button>
    </form>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

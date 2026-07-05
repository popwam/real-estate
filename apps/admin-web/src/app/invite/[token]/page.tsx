"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { acceptInvitationApi, getInvitationApi } from "@/lib/api";
import { FeedbackState } from "@/components/feedback-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n";

type Invitation = Awaited<ReturnType<typeof getInvitationApi>>;

export default function InvitationPage() {
  const { t } = useI18n();

  const { token } = useParams<{ token: string }>();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void getInvitationApi(token)
      .then(setInvitation)
      .catch(() => setError("This invitation is invalid or unavailable."));
  }, [token]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    try {
      await acceptInvitationApi(token, {
        password: String(data.get("password") ?? ""),
        firstName: optional(data.get("firstName")),
        lastName: optional(data.get("lastName")),
        phone: optional(data.get("phone")),
      });
      setAccepted(true);
    } catch {
      setError("The invitation could not be accepted. It may be expired or already used.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg items-center bg-[var(--color-background)] px-6 py-12 text-[var(--color-foreground)]">
      <div className="ui-card w-full p-7">
        <p className="text-sm font-medium text-[var(--color-muted)]">{t("adminSweep.company.invitation.45b88642")}</p>
        <h1 className="mt-2 text-2xl font-semibold">{t("adminSweep.join.e0d73143")}{invitation?.organization.name ?? "POPWAM"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{t("adminSweep.set.your.password.to.activate.your.popwam.login..400a6c68")}</p>

        {accepted ? (
          <div className="mt-5 space-y-4">
            <FeedbackState
              tone="success"
              title={t("adminSweep.invitation.accepted.62114516")}
              description="Your account is ready. Sign in with your invited email or phone number and the password you just set."
            />
            <Link className="ui-button w-full" href="/login">{t("adminSweep.sign.in.ada2e9e9")}</Link>
          </div>
        ) : null}

        {!accepted && invitation ? (
          <form className="mt-6 grid gap-4" onSubmit={submit}>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3 text-sm text-[var(--color-muted)]">
              {invitation.email} - {invitation.intendedRole.replaceAll("_", " ")}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="firstName">{t("adminSweep.first.name.7e568a90")}</Label>
              <Input id="firstName" name="firstName" autoComplete="given-name" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">{t("adminSweep.last.name.adec36a8")}</Label>
              <Input id="lastName" name="lastName" autoComplete="family-name" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">{t("adminSweep.phone.number.for.login.optional.dce75820")}</Label>
              <Input id="phone" name="phone" autoComplete="tel" inputMode="tel" placeholder="+201001234567" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">{t("adminSweep.password.8be3c943")}</Label>
              <Input
                required
                minLength={10}
                type="password"
                id="password"
                name="password"
                autoComplete="new-password"
                placeholder={t("adminSweep.at.least.10.characters.41addac0")}
              />
            </div>
            {!invitation.canAccept ? (
              <FeedbackState
                tone="error"
                title={t("adminSweep.invitation.unavailable.8fe7a384")}
                description={`This invitation is ${invitation.status.toLowerCase().replaceAll("_", " ")}.`}
              />
            ) : null}
            <Button disabled={submitting || !invitation.canAccept} type="submit">
              {submitting ? "Accepting..." : "Accept invitation"}
            </Button>
          </form>
        ) : null}

        {error ? (
          <div className="mt-4">
            <FeedbackState tone="error" title={t("adminSweep.invitation.error.de7c519d")} description={error} />
          </div>
        ) : null}
      </div>
    </main>
  );
}

function optional(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || undefined;
}

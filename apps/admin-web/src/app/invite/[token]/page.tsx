"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { acceptInvitationApi, getInvitationApi } from "@/lib/api";
import { FeedbackState } from "@/components/feedback-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Invitation = Awaited<ReturnType<typeof getInvitationApi>>;

export default function InvitationPage() {
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
        <p className="text-sm font-medium text-[var(--color-muted)]">Company invitation</p>
        <h1 className="mt-2 text-2xl font-semibold">
          Join {invitation?.organization.name ?? "POPWAM"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
          Set your password to activate your POPWAM login for this organization.
        </p>

        {accepted ? (
          <div className="mt-5 space-y-4">
            <FeedbackState
              tone="success"
              title="Invitation accepted"
              description="Your account is ready. Sign in with your invited email or phone number and the password you just set."
            />
            <Link className="ui-button w-full" href="/login">
              Sign in
            </Link>
          </div>
        ) : null}

        {!accepted && invitation ? (
          <form className="mt-6 grid gap-4" onSubmit={submit}>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3 text-sm text-[var(--color-muted)]">
              {invitation.email} - {invitation.intendedRole.replaceAll("_", " ")}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" name="firstName" autoComplete="given-name" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" name="lastName" autoComplete="family-name" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone number for login (optional)</Label>
              <Input id="phone" name="phone" autoComplete="tel" inputMode="tel" placeholder="+201001234567" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                required
                minLength={10}
                type="password"
                id="password"
                name="password"
                autoComplete="new-password"
                placeholder="At least 10 characters"
              />
            </div>
            {!invitation.canAccept ? (
              <FeedbackState
                tone="error"
                title="Invitation unavailable"
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
            <FeedbackState tone="error" title="Invitation error" description={error} />
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

"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { acceptInvitationApi, getInvitationApi } from "@/lib/api";
import { Button } from "@/components/ui/button";

type Invitation = Awaited<ReturnType<typeof getInvitationApi>>;

export default function InvitationPage() {
  const { token } = useParams<{ token: string }>();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void getInvitationApi(token).then(setInvitation).catch(() => setError("This invitation is invalid or unavailable."));
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
    <main className="mx-auto flex min-h-screen max-w-lg items-center px-6 py-12">
      <div className="w-full rounded-xl border border-zinc-200 bg-white p-7 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-950">Join {invitation?.organization.name ?? "POPWAM"}</h1>
        {accepted ? <p className="mt-4 text-sm text-emerald-700">Invitation accepted. You can now sign in.</p> : null}
        {!accepted && invitation ? (
          <form className="mt-6 grid gap-4" onSubmit={submit}>
            <p className="text-sm text-zinc-600">{invitation.email} · {invitation.intendedRole.replaceAll("_", " ")}</p>
            <input name="firstName" placeholder="First name" className="h-10 rounded-md border border-zinc-300 px-3" />
            <input name="lastName" placeholder="Last name" className="h-10 rounded-md border border-zinc-300 px-3" />
            <input name="phone" placeholder="Phone optional" className="h-10 rounded-md border border-zinc-300 px-3" />
            <input required minLength={10} type="password" name="password" placeholder="Password (10+ characters)" className="h-10 rounded-md border border-zinc-300 px-3" />
            <Button disabled={submitting || !invitation.canAccept} type="submit">{submitting ? "Accepting" : "Accept invitation"}</Button>
          </form>
        ) : null}
        {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
      </div>
    </main>
  );
}

function optional(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || undefined;
}

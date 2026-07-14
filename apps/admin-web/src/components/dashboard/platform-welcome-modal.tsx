"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Rocket, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import {
  getPlatformWelcomePreferenceApi,
  savePlatformWelcomePreferenceApi,
} from "@/lib/user-preferences-api";

const SESSION_KEY = "popwam.platform-welcome.closed";

export function PlatformWelcomeModal() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const preference = useQuery({
    queryKey: ["user-preferences", "platform-welcome"],
    queryFn: getPlatformWelcomePreferenceApi,
  });
  const [forcedOpen, setForcedOpen] = useState(false);
  const [sessionClosed, setSessionClosed] = useState(() => typeof window !== "undefined" && sessionStorage.getItem(SESSION_KEY) === "true");
  const [doNotShowAgain, setDoNotShowAgain] = useState(false);
  const save = useMutation({
    mutationFn: savePlatformWelcomePreferenceApi,
    onSuccess: (data) => queryClient.setQueryData(["user-preferences", "platform-welcome"], data),
  });

  const open = forcedOpen || Boolean(preference.data && !preference.data.hasDismissedPlatformWelcome && !sessionClosed);

  useEffect(() => {
    const reopen = () => {
      setDoNotShowAgain(false);
      setForcedOpen(true);
    };
    window.addEventListener("popwam:open-platform-welcome", reopen);
    return () => window.removeEventListener("popwam:open-platform-welcome", reopen);
  }, []);

  async function close() {
    try {
      if (doNotShowAgain) await save.mutateAsync(true);
      else {
        sessionStorage.setItem(SESSION_KEY, "true");
        setSessionClosed(true);
      }
      setForcedOpen(false);
    } catch {
      // Keep the modal open so a failed persistent dismissal is never mistaken for a saved preference.
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] grid place-items-center bg-[var(--color-overlay)] p-4" role="presentation">
      <section className="w-full max-w-xl rounded-[var(--radius-lg)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-xl)]" role="dialog" aria-modal="true" aria-labelledby="platform-welcome-title">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]"><Rocket className="h-5 w-5" aria-hidden="true" /></span>
            <div>
              <p className="text-xs font-bold uppercase text-[var(--color-accent)]">{t("platformWelcome.eyebrow")}</p>
              <h2 id="platform-welcome-title" className="text-xl font-semibold text-[var(--color-foreground)]">{t("platformWelcome.title")}</h2>
            </div>
          </div>
          <button type="button" className="grid h-10 w-10 place-items-center rounded-[var(--radius-md)] text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)]" onClick={() => void close()} aria-label={t("common.close")}><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4 p-5 text-sm leading-6 text-[var(--color-muted)]">
          <p>{t("platformWelcome.description")}</p>
          <ul className="list-disc space-y-2 ps-5">
            <li>{t("platformWelcome.organizations")}</li>
            <li>{t("platformWelcome.operations")}</li>
            <li>{t("platformWelcome.security")}</li>
          </ul>
          <label className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 text-[var(--color-foreground)]">
            <input type="checkbox" checked={doNotShowAgain} onChange={(event) => setDoNotShowAgain(event.target.checked)} />
            {t("platformWelcome.doNotShowAgain")}
          </label>
          {save.isError ? <p role="alert" className="text-sm text-[var(--color-danger)]">{t("platformWelcome.saveError")}</p> : null}
        </div>
        <div className="flex justify-end gap-3 border-t border-[var(--color-border)] p-5">
          <Button type="button" className="ui-button-secondary" onClick={() => void close()}>{t("common.close")}</Button>
          <Button type="button" onClick={() => void close()} disabled={save.isPending}>{t("platformWelcome.getStarted")}</Button>
        </div>
      </section>
    </div>
  );
}

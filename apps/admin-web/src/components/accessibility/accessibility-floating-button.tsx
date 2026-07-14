"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Accessibility, Languages, Monitor, Moon, RotateCcw, Sun, Type, X } from "lucide-react";
import { useTheme, type FontScale, type InterfaceLocale, type Theme } from "@/components/providers/theme-provider";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

const themeOptions: Theme[] = ["light", "dark", "system", "comfort"];
const fontOptions: FontScale[] = ["normal", "large", "larger"];
const localeOptions: InterfaceLocale[] = ["en", "ar", "fr"];

export function AccessibilityFloatingButton() {
  const { t, locale } = useI18n();
  const { theme, setTheme, fontScale, setFontScale, setLocale } = useTheme();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom)+1rem)] end-4 z-[var(--z-fixed)] inline-flex h-12 w-12 items-center justify-center rounded-[var(--radius-full)] border border-[var(--color-border)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-[var(--shadow-lg)] hover:bg-[var(--color-primary-hover)] lg:bottom-5"
        aria-label={t("accessibility.title")}
        title={t("accessibility.title")}
        aria-expanded={open}
      >
        <Accessibility className="h-5 w-5" aria-hidden="true" />
      </button>

      {open ? (
        <section
          className="fixed bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom)+4.75rem)] end-4 z-[var(--z-popover)] flex max-h-[min(44rem,calc(100vh-7rem))] w-[min(28rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-xl)] lg:bottom-20"
          role="dialog"
          aria-modal="false"
          aria-labelledby="accessibility-panel-title"
        >
          <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3">
            <h2 id="accessibility-panel-title" className="text-base font-semibold text-[var(--color-foreground)]">{t("accessibility.title")}</h2>
            <button type="button" onClick={() => setOpen(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)]" aria-label={t("common.close")} title={t("common.close")}>
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
            <ControlGroup title={t("accessibility.language")} icon={<Languages className="h-4 w-4" aria-hidden="true" />}>
              <div className="grid grid-cols-3 gap-2">
                {localeOptions.map((option) => (
                  <button key={option} type="button" onClick={() => setLocale(option)} className={choiceClass(locale === option)}>
                    {t(`accessibility.language.${option}`)}
                  </button>
                ))}
              </div>
            </ControlGroup>

            <ControlGroup title={t("accessibility.theme")} icon={<Monitor className="h-4 w-4" aria-hidden="true" />}>
              <div className="grid grid-cols-2 gap-2">
                {themeOptions.map((option) => {
                  const Icon = option === "light" ? Sun : option === "dark" ? Moon : Monitor;
                  return (
                    <button key={option} type="button" onClick={() => setTheme(option)} className={choiceClass(theme === option)}>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      <span>{t(`accessibility.theme.${option}`)}</span>
                    </button>
                  );
                })}
              </div>
            </ControlGroup>

            <ControlGroup title={t("accessibility.font")} icon={<Type className="h-4 w-4" aria-hidden="true" />}>
              <div className="grid grid-cols-4 gap-2">
                {fontOptions.map((option) => (
                  <button key={option} type="button" onClick={() => setFontScale(option)} className={choiceClass(fontScale === option)}>
                    {t(`accessibility.font.${option}`)}
                  </button>
                ))}
                <button type="button" onClick={() => setFontScale("normal")} className={choiceClass(fontScale === "normal")}>
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  {t("accessibility.font.reset")}
                </button>
              </div>
            </ControlGroup>
          </div>
        </section>
      ) : null}
    </>
  );
}

function ControlGroup({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--color-foreground)]">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

function choiceClass(active: boolean) {
  return cn(
    "inline-flex min-h-10 min-w-0 items-center justify-center gap-2 rounded-[var(--radius-md)] border px-2 text-xs font-semibold",
    active
      ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
      : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)]",
  );
}

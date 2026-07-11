"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Accessibility, Languages, Monitor, Moon, Play, Plus, StopCircle, Sun, Type, Volume2, X } from "lucide-react";
import { useTheme, type FontScale, type InterfaceLocale, type Theme } from "@/components/providers/theme-provider";
import { Button } from "@/components/ui/button";
import { useAllowedNavigation } from "@/hooks/use-navigation";
import { useI18n } from "@/i18n";
import { clearTokens } from "@/lib/auth";
import { cn } from "@/lib/utils";

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

const themeOptions: Theme[] = ["light", "dark", "system"];
const fontOptions: FontScale[] = ["normal", "large", "larger"];
const localeOptions: InterfaceLocale[] = ["en", "ar", "fr"];

export function AccessibilityFloatingButton() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const navigation = useAllowedNavigation();
  const { theme, setTheme, fontScale, setFontScale, setLocale } = useTheme();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      recognitionRef.current?.stop();
    };
  }, []);

  function readScreen() {
    if (!("speechSynthesis" in window)) {
      setMessage(t("accessibility.screenReaderUnsupported"));
      return;
    }
    const main = document.querySelector("main, [role='main'], [data-dashboard-content]");
    const title = document.title || document.querySelector("h1")?.textContent || "";
    const text = `${title}. ${main?.textContent ?? ""}`.replace(/\s+/g, " ").trim().slice(0, 3500);
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale === "ar" ? "ar" : locale === "fr" ? "fr-FR" : "en-US";
    window.speechSynthesis.speak(utterance);
  }

  function stopReading() {
    window.speechSynthesis?.cancel();
  }

  function toggleVoiceNavigation() {
    if (voiceEnabled) {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      setVoiceEnabled(false);
      return;
    }

    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      setMessage(t("accessibility.voiceUnsupported"));
      return;
    }

    const recognition = new Recognition();
    recognition.lang = locale === "ar" ? "ar" : locale === "fr" ? "fr-FR" : "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1]?.[0]?.transcript ?? "";
      handleVoiceCommand(result);
    };
    recognition.onerror = () => setMessage(t("accessibility.voiceUnsupported"));
    recognition.onend = () => setVoiceEnabled(false);
    recognitionRef.current = recognition;
    recognition.start();
    setVoiceEnabled(true);
  }

  function handleVoiceCommand(rawCommand: string) {
    const command = rawCommand.trim().toLowerCase();
    const destination = voiceDestination(command);

    if (destination === "logout") {
      if (window.confirm(t("account.logoutCurrentConfirm"))) {
        clearTokens();
        router.replace("/login");
      }
      return;
    }

    if (!destination) return;
    const item = navigation.find((navItem) => navItem.href === destination || navItem.id.includes(destination));
    if (!item) {
      setMessage(t("employeeAccess.forbiddenTitle"));
      return;
    }
    router.push(item.href);
  }

  function voiceDestination(command: string) {
    const commands: Record<string, string> = {
      "go to dashboard": "dashboard",
      "go to employees": "hr",
      "go to attendance": "attendance",
      "open settings": "settings",
      "open reports": "accounting",
      logout: "logout",
      "افتح الرئيسية": "dashboard",
      "افتح الموظفين": "hr",
      "افتح الحضور": "attendance",
      "افتح الإعدادات": "settings",
      "افتح التقارير": "accounting",
      "تسجيل خروج": "logout",
      "ouvrir le tableau de bord": "dashboard",
      "ouvrir les employés": "hr",
      "ouvrir la présence": "attendance",
      "ouvrir les paramètres": "settings",
      "ouvrir les rapports": "accounting",
      "se déconnecter": "logout",
    };
    return commands[command];
  }

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
          className="fixed bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom)+4.75rem)] end-4 z-[var(--z-popover)] flex max-h-[min(36rem,calc(100vh-7rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-xl)] lg:bottom-20"
          role="dialog"
          aria-modal="false"
          aria-labelledby="accessibility-panel-title"
        >
          <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3">
            <h2 id="accessibility-panel-title" className="text-base font-semibold text-[var(--color-foreground)]">{t("accessibility.title")}</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)]"
              aria-label={t("common.close")}
              title={t("common.close")}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
            <ControlGroup title={t("accessibility.language")} icon={<Languages className="h-4 w-4" aria-hidden="true" />}>
              <div className="grid grid-cols-3 gap-2">
                {localeOptions.map((option) => (
                  <button key={option} type="button" onClick={() => setLocale(option)} className={choiceClass(locale === option)}>
                    {option.toUpperCase()}
                  </button>
                ))}
              </div>
            </ControlGroup>

            <ControlGroup title={t("accessibility.theme")} icon={<Monitor className="h-4 w-4" aria-hidden="true" />}>
              <div className="grid grid-cols-3 gap-2">
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
              <div className="grid grid-cols-3 gap-2">
                {fontOptions.map((option) => (
                  <button key={option} type="button" onClick={() => setFontScale(option)} className={choiceClass(fontScale === option)}>
                    {t(`accessibility.font.${option}`)}
                  </button>
                ))}
              </div>
            </ControlGroup>

            <div className="grid grid-cols-2 gap-2">
              <Button type="button" className="ui-button-secondary px-2" onClick={readScreen}>
                <Play className="h-4 w-4" aria-hidden="true" />
                {t("accessibility.readScreen")}
              </Button>
              <Button type="button" className="ui-button-secondary px-2" onClick={stopReading}>
                <StopCircle className="h-4 w-4" aria-hidden="true" />
                {t("accessibility.stopReading")}
              </Button>
            </div>

            <Button
              type="button"
              className={cn("w-full", voiceEnabled ? "ui-button-primary" : "ui-button-secondary")}
              onClick={toggleVoiceNavigation}
              aria-pressed={voiceEnabled}
            >
              {voiceEnabled ? <Volume2 className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
              {t("accessibility.voiceNavigation")}
            </Button>

            <p className="text-xs leading-5 text-[var(--color-muted)]">{t("accessibility.help")}</p>
            {message ? <p className="rounded-[var(--radius-md)] bg-[var(--color-warning-soft)] px-3 py-2 text-sm text-[var(--color-warning)]">{message}</p> : null}
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

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  const speechWindow = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

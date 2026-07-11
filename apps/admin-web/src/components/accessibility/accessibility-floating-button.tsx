"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Accessibility,
  Languages,
  Mic,
  MicOff,
  Monitor,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Square,
  Sun,
  Type,
  Volume2,
  X,
} from "lucide-react";
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

const themeOptions: Theme[] = ["light", "dark", "system", "comfort"];
const fontOptions: FontScale[] = ["normal", "large", "larger"];
const localeOptions: InterfaceLocale[] = ["en", "ar", "fr"];

export function AccessibilityFloatingButton() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const navigation = useAllowedNavigation();
  const { theme, setTheme, fontScale, setFontScale, setLocale } = useTheme();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [listening, setListening] = useState(false);
  const [lastCommand, setLastCommand] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceName, setVoiceName] = useState("");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speechSupported = typeof window !== "undefined" && "speechSynthesis" in window;
  const recognitionSupported = typeof window !== "undefined" && Boolean(getSpeechRecognition());

  const voiceCommands = useMemo(
    () => buildVoiceCommands(locale),
    [locale],
  );

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  useEffect(() => {
    if (!speechSupported) return;
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, [speechSupported]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      recognitionRef.current?.stop();
    };
  }, []);

  function readCurrentPage() {
    if (!speechSupported) {
      setMessage(t("accessibility.screenReaderUnsupported"));
      return;
    }
    const main = document.querySelector("[data-dashboard-content], main, [role='main']");
    const heading = document.querySelector("h1")?.textContent ?? "";
    const text = `${heading}. ${main?.textContent ?? ""}`.replace(/\s+/g, " ").trim().slice(0, 4500);
    if (!text) {
      setMessage(t("accessibility.noReadableText"));
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale === "ar" ? "ar" : locale === "fr" ? "fr-FR" : "en-US";
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;
    utterance.voice = voices.find((voice) => voice.name === voiceName) ?? null;
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setMessage(t("accessibility.readingStarted"));
  }

  function stopReading() {
    window.speechSynthesis?.cancel();
    utteranceRef.current = null;
    setMessage(t("accessibility.readingStopped"));
  }

  function pauseReading() {
    if (!speechSupported || !window.speechSynthesis.speaking) {
      setMessage(t("accessibility.pauseUnsupported"));
      return;
    }
    window.speechSynthesis.pause();
    setMessage(t("accessibility.readingPaused"));
  }

  function resumeReading() {
    if (!speechSupported) {
      setMessage(t("accessibility.screenReaderUnsupported"));
      return;
    }
    window.speechSynthesis.resume();
    setMessage(t("accessibility.readingResumed"));
  }

  function startListening() {
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
      setLastCommand(result);
      handleVoiceCommand(result);
    };
    recognition.onerror = () => setMessage(t("accessibility.voiceUnsupported"));
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    setMessage(t("accessibility.listeningStarted"));
  }

  function stopListening() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
    setMessage(t("accessibility.listeningStopped"));
  }

  function handleVoiceCommand(rawCommand: string) {
    const command = normalizeCommand(rawCommand);
    const destination = voiceCommands[command];
    if (!destination) {
      setMessage(t("accessibility.commandNotRecognized"));
      return;
    }
    if (destination === "logout") {
      if (window.confirm(t("account.logoutCurrentConfirm"))) {
        clearTokens();
        router.replace("/login");
      }
      return;
    }
    const item = navigation.find((navItem) => navItem.href === destination || navItem.href.endsWith(destination));
    if (!item) {
      setMessage(t("accessibility.voiceRouteForbidden"));
      return;
    }
    if (item.href === pathname) {
      setMessage(t("accessibility.alreadyOnPage"));
      return;
    }
    router.push(item.href);
    setMessage(t("accessibility.voiceNavigated"));
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

            <ControlGroup title={t("accessibility.screenReader")} icon={<Volume2 className="h-4 w-4" aria-hidden="true" />}>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" className="ui-button-secondary px-2" onClick={readCurrentPage} disabled={!speechSupported} title={!speechSupported ? t("accessibility.screenReaderUnsupported") : undefined}>
                  <Play className="h-4 w-4" aria-hidden="true" />
                  {t("accessibility.readCurrentPage")}
                </Button>
                <Button type="button" className="ui-button-secondary px-2" onClick={stopReading} disabled={!speechSupported}>
                  <Square className="h-4 w-4" aria-hidden="true" />
                  {t("accessibility.stopReading")}
                </Button>
                <Button type="button" className="ui-button-secondary px-2" onClick={pauseReading} disabled={!speechSupported}>
                  <Pause className="h-4 w-4" aria-hidden="true" />
                  {t("accessibility.pauseReading")}
                </Button>
                <Button type="button" className="ui-button-secondary px-2" onClick={resumeReading} disabled={!speechSupported}>
                  <Play className="h-4 w-4" aria-hidden="true" />
                  {t("accessibility.resumeReading")}
                </Button>
              </div>
              <div className="mt-3 grid gap-3">
                <RangeControl label={t("accessibility.voiceSpeed")} value={rate} min={0.5} max={2} step={0.1} onChange={setRate} />
                <RangeControl label={t("accessibility.voicePitch")} value={pitch} min={0} max={2} step={0.1} onChange={setPitch} />
                <RangeControl label={t("accessibility.voiceVolume")} value={volume} min={0} max={1} step={0.1} onChange={setVolume} />
                <label className="grid gap-1.5 text-sm">
                  <span className="font-medium text-[var(--color-foreground)]">{t("accessibility.selectVoice")}</span>
                  <select className="ui-input" value={voiceName} disabled={!speechSupported || !voices.length} onChange={(event) => setVoiceName(event.target.value)}>
                    <option value="">{t("accessibility.defaultVoice")}</option>
                    {voices.map((voice) => (
                      <option key={`${voice.name}-${voice.lang}`} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </ControlGroup>

            <ControlGroup title={t("accessibility.voiceNavigation")} icon={listening ? <Mic className="h-4 w-4" aria-hidden="true" /> : <MicOff className="h-4 w-4" aria-hidden="true" />}>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" className="ui-button-secondary" onClick={startListening} disabled={!recognitionSupported || listening} title={!recognitionSupported ? t("accessibility.voiceUnsupported") : undefined}>
                  <Mic className="h-4 w-4" aria-hidden="true" />
                  {t("accessibility.startListening")}
                </Button>
                <Button type="button" className="ui-button-secondary" onClick={stopListening} disabled={!listening}>
                  <MicOff className="h-4 w-4" aria-hidden="true" />
                  {t("accessibility.stopListening")}
                </Button>
              </div>
              <p className="mt-2 text-xs text-[var(--color-muted)]">
                {listening ? t("accessibility.listening") : t("accessibility.notListening")}
              </p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                {t("accessibility.lastCommand")}: {lastCommand || t("common.notSet")}
              </p>
            </ControlGroup>

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

function RangeControl({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="flex justify-between gap-3 font-medium text-[var(--color-foreground)]">
        <span>{label}</span>
        <span>{value.toFixed(1)}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
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

function buildVoiceCommands(locale: InterfaceLocale) {
  const dashboard = "/hr/dashboard";
  const commands: Record<string, string> = {
    "go to dashboard": dashboard,
    "go to employees": "/hr/employees",
    "go to attendance": "/hr/attendance",
    "open settings": "/hr/settings",
    "open reports": "/hr/reports",
    logout: "logout",
    "افتح الرئيسية": dashboard,
    "افتح الموظفين": "/hr/employees",
    "افتح الحضور": "/hr/attendance",
    "افتح الإعدادات": "/hr/settings",
    "افتح التقارير": "/hr/reports",
    "تسجيل خروج": "logout",
    "ouvrir le tableau de bord": dashboard,
    "ouvrir les employés": "/hr/employees",
    "ouvrir la présence": "/hr/attendance",
    "ouvrir les paramètres": "/hr/settings",
    "ouvrir les rapports": "/hr/reports",
    "se déconnecter": "logout",
  };
  if (locale === "ar") commands["افتح لوحة التحكم"] = dashboard;
  if (locale === "fr") commands["ouvrir tableau de bord"] = dashboard;
  return Object.fromEntries(Object.entries(commands).map(([key, value]) => [normalizeCommand(key), value]));
}

function normalizeCommand(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

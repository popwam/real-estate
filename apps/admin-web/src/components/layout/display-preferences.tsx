"use client";

import { Eye, Languages, Monitor, Moon, Sun, Type } from "lucide-react";
import { useTheme, type FontScale, type Theme } from "@/components/providers/theme-provider";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

const themeOrder: Theme[] = ["light", "dark", "system", "comfort"];
const fontScaleOrder: FontScale[] = ["normal", "large", "larger"];

const themeMeta: Record<Theme, { label: string; icon: typeof Sun }> = {
  light: { label: "Light", icon: Sun },
  dark: { label: "Dark", icon: Moon },
  system: { label: "System", icon: Monitor },
  comfort: { label: "Eye comfort", icon: Eye },
};

export function DisplayPreferences({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const {
    theme,
    setTheme,
    fontScale,
    setFontScale,
    locale,
    setLocale,
    mounted,
  } = useTheme();
  const ThemeIcon = themeMeta[theme].icon;
  const translatedThemeLabel = t(`preferences.theme.${theme}`);
  const translatedFontScaleLabel = t(`preferences.font.${fontScale}`);

  function cycleTheme() {
    const index = themeOrder.indexOf(theme);
    setTheme(themeOrder[(index + 1) % themeOrder.length]);
  }

  function cycleFontScale() {
    const index = fontScaleOrder.indexOf(fontScale);
    setFontScale(fontScaleOrder[(index + 1) % fontScaleOrder.length]);
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1",
        !mounted && "opacity-70",
      )}
      aria-label={t("preferences.display")}
    >
      <button
        type="button"
        onClick={cycleTheme}
        className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)]"
        aria-label={t("preferences.theme.aria", { theme: translatedThemeLabel })}
        title={t("preferences.theme.aria", { theme: translatedThemeLabel })}
      >
        <ThemeIcon className="h-4 w-4" aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={cycleFontScale}
        className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)]"
        aria-label={t("preferences.font.aria", { scale: translatedFontScaleLabel })}
        title={translatedFontScaleLabel}
      >
        {compact ? <Type className="h-4 w-4" aria-hidden="true" /> : <span className="text-xs font-bold">Aa</span>}
      </button>

      <div className="relative">
        <Languages
          className="pointer-events-none absolute start-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]"
          aria-hidden="true"
        />
        <select
          value={locale}
          onChange={(event) => setLocale(event.target.value as "en" | "ar" | "fr")}
          className="h-9 appearance-none rounded-[var(--radius-sm)] bg-transparent ps-8 pe-6 text-xs font-semibold text-[var(--color-foreground)] hover:bg-[var(--color-surface-muted)]"
          aria-label={t("preferences.language")}
          title={t("preferences.language.title")}
        >
          <option value="en">EN</option>
          <option value="ar">AR</option>
          <option value="fr">FR</option>
        </select>
      </div>
    </div>
  );
}

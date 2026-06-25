"use client";

import { useI18n } from "@/i18n";
import { useTheme, type FontScale, type Theme } from "@/providers/theme-provider";

const themeOrder: Theme[] = ["light", "dark", "comfort"];
const fontScaleOrder: FontScale[] = ["normal", "large", "extra-large"];

export function PublicPreferences({ expanded = false }: { expanded?: boolean }) {
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

  function cycleTheme() {
    const index = themeOrder.indexOf(theme);
    setTheme(themeOrder[(index + 1) % themeOrder.length]);
  }

  function cycleFontScale() {
    const index = fontScaleOrder.indexOf(fontScale);
    setFontScale(fontScaleOrder[(index + 1) % fontScaleOrder.length]);
  }

  const translatedThemeLabel = t(`preferences.theme.${theme}`);
  const translatedFontScaleLabel = t(`preferences.font.${fontScale}`);

  return (
    <div
      className={`flex items-center gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1 ${
        expanded ? "w-full justify-between" : ""
      } ${mounted ? "" : "opacity-70"}`}
      aria-label={t("preferences.display")}
    >
      <button
        type="button"
        onClick={cycleTheme}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-[var(--radius-sm)] px-2 text-sm font-semibold text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)]"
        aria-label={t("preferences.theme.aria", { theme: translatedThemeLabel })}
      >
        <span>{expanded ? translatedThemeLabel : translatedThemeLabel}</span>
      </button>

      <button
        type="button"
        onClick={cycleFontScale}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-[var(--radius-sm)] px-2 text-xs font-bold text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)]"
        aria-label={t("preferences.font.aria", { scale: translatedFontScaleLabel })}
      >
        Aa
        {expanded ? <span className="font-semibold">{translatedFontScaleLabel}</span> : null}
      </button>

      <select
        value={locale}
        onChange={(event) => setLocale(event.target.value as "en" | "ar" | "fr")}
        className="h-9 rounded-[var(--radius-sm)] border-0 bg-transparent px-2 text-xs font-bold text-[var(--color-foreground)] hover:bg-[var(--color-surface-muted)]"
        aria-label={t("preferences.language")}
      >
        <option value="en">EN</option>
        <option value="ar">AR</option>
        <option value="fr">FR</option>
      </select>
    </div>
  );
}

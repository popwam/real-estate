"use client";

import type { ReactNode } from "react";
import { useEffect, useLayoutEffect, useState } from "react";

export type Theme = "light" | "dark" | "comfort";
export type FontScale = "normal" | "large" | "extra-large";
export type InterfaceLocale = "en" | "ar" | "fr";

const THEME_STORAGE_KEY = "popwam-theme";
const FONT_SCALE_STORAGE_KEY = "popwam-font-scale";
const LOCALE_STORAGE_KEY = "popwam-locale";
const PREFERENCES_EVENT = "popwam-preferences-change";

type Preferences = {
  theme: Theme;
  fontScale: FontScale;
  locale: InterfaceLocale;
};

const defaults: Preferences = {
  theme: "light",
  fontScale: "normal",
  locale: "en",
};

function readPreferences(): Preferences {
  if (typeof window === "undefined") return defaults;

  const theme = localStorage.getItem(THEME_STORAGE_KEY);
  const fontScale = localStorage.getItem(FONT_SCALE_STORAGE_KEY);
  const locale = localStorage.getItem(LOCALE_STORAGE_KEY);

  return {
    theme: theme === "dark" || theme === "comfort" ? theme : "light",
    fontScale:
      fontScale === "large" || fontScale === "extra-large" ? fontScale : "normal",
    locale: locale === "ar" || locale === "fr" ? locale : "en",
  };
}

function applyPreferences(preferences: Preferences) {
  const root = document.documentElement;
  root.dataset.theme = preferences.theme;
  root.dataset.fontScale = preferences.fontScale;
  root.lang = preferences.locale;
  root.dir = preferences.locale === "ar" ? "rtl" : "ltr";
}

function announcePreferenceChange() {
  window.dispatchEvent(new Event(PREFERENCES_EVENT));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    applyPreferences(readPreferences());
  }, []);

  return <>{children}</>;
}

export function useTheme() {
  const [state, setState] = useState<Preferences & { mounted: boolean }>({
    ...defaults,
    mounted: false,
  });

  useLayoutEffect(() => {
    const sync = () => {
      const next = readPreferences();
      applyPreferences(next);
      setState({ ...next, mounted: true });
    };

    sync();
    window.addEventListener(PREFERENCES_EVENT, sync);
    return () => window.removeEventListener(PREFERENCES_EVENT, sync);
  }, []);

  useEffect(() => {
    const syncAcrossTabs = () => announcePreferenceChange();
    window.addEventListener("storage", syncAcrossTabs);
    return () => window.removeEventListener("storage", syncAcrossTabs);
  }, []);

  const setTheme = (theme: Theme) => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    announcePreferenceChange();
  };

  const setFontScale = (fontScale: FontScale) => {
    localStorage.setItem(FONT_SCALE_STORAGE_KEY, fontScale);
    announcePreferenceChange();
  };

  const setLocale = (locale: InterfaceLocale) => {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    announcePreferenceChange();
  };

  return {
    ...state,
    setTheme,
    setFontScale,
    setLocale,
    direction: state.locale === "ar" ? ("rtl" as const) : ("ltr" as const),
  };
}

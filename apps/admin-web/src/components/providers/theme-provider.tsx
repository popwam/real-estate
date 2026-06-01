"use client";

import type { ReactNode } from "react";
import { useLayoutEffect, useState } from "react";

type Theme = "light" | "dark" | "comfort";
type FontScale = "normal" | "large" | "extra-large";

const THEME_STORAGE_KEY = "popwam-theme";
const FONT_SCALE_STORAGE_KEY = "popwam-font-scale";

export function ThemeProvider({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    // Get saved theme from localStorage
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    const savedFontScale = localStorage.getItem(FONT_SCALE_STORAGE_KEY) as FontScale | null;

    // Set theme on document
    const theme = savedTheme ?? "light";
    document.documentElement.setAttribute("data-theme", theme);

    // Set font scale on html element
    const fontScale = savedFontScale ?? "normal";
    document.documentElement.setAttribute("data-font-scale", fontScale);
  }, []);

  // Return children with theme applied via layout effect
  return <>{children}</>;
}

/**
 * Hook to get current theme and set theme
 * Use this in client components to read/write theme
 */
export function useTheme() {
  type ThemeState = {
    theme: Theme;
    fontScale: FontScale;
    mounted: boolean;
  };

  const [state, setState] = useState<ThemeState>({
    theme: "light",
    fontScale: "normal",
    mounted: false,
  });

  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Valid hydration pattern: reading from localStorage and initializing state
    setState({
      theme: (localStorage.getItem(THEME_STORAGE_KEY) as Theme) ?? "light",
      fontScale: (localStorage.getItem(FONT_SCALE_STORAGE_KEY) as FontScale) ?? "normal",
      mounted: true,
    });
  }, []);

  const setTheme = (newTheme: Theme) => {
    setState((prev) => ({ ...prev, theme: newTheme }));
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const setFontScale = (scale: FontScale) => {
    setState((prev) => ({ ...prev, fontScale: scale }));
    localStorage.setItem(FONT_SCALE_STORAGE_KEY, scale);
    document.documentElement.setAttribute("data-font-scale", scale);
  };

  return {
    theme: state.theme,
    setTheme,
    fontScale: state.fontScale,
    setFontScale,
    mounted: state.mounted,
  };
}

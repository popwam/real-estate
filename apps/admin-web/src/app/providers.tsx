"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "@/lib/query-client";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { I18nProvider } from "@/i18n";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <QueryProvider>{children}</QueryProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "@/lib/query-client";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { I18nProvider } from "@/i18n";
import { AuthSessionProvider } from "@/components/providers/auth-session-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <QueryProvider>
          <AuthSessionProvider>{children}</AuthSessionProvider>
        </QueryProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

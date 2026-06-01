"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@/providers/theme-provider";

export function PublicWebProviders({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

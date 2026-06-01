"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { LoadingState } from "@/components/loading-state";
import { getAccessToken } from "@/lib/auth";

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLogin = pathname === "/login";
  const hasToken = typeof window !== "undefined" && Boolean(getAccessToken());

  useEffect(() => {
    if (!isLogin && !getAccessToken()) {
      router.replace("/login");
    }
  }, [isLogin, router]);

  if (!isLogin && !hasToken) {
    return <LoadingState label="Checking session" />;
  }

  return <>{children}</>;
}

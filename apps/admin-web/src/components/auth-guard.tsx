"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { LoadingState } from "@/components/loading-state";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getAccessToken } from "@/lib/auth";

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLogin = pathname === "/login";
  const isChangePassword = pathname === "/change-password";
  const hasToken = typeof window !== "undefined" && Boolean(getAccessToken());
  const currentUser = useCurrentUser();

  useEffect(() => {
    if (!isLogin && !getAccessToken()) {
      router.replace("/login");
    }
  }, [isLogin, router]);

  useEffect(() => {
    if (!hasToken || isLogin) return;
    if (currentUser.data?.user.mustChangePassword && !isChangePassword) {
      router.replace("/change-password");
    }
    if (currentUser.data && !currentUser.data.user.mustChangePassword && isChangePassword) {
      router.replace("/");
    }
  }, [currentUser.data, hasToken, isChangePassword, isLogin, router]);

  if (!isLogin && !hasToken) {
    return <LoadingState label="Checking session" />;
  }

  if (hasToken && currentUser.isLoading && !isLogin) {
    return <LoadingState label="Checking session" />;
  }

  return <>{children}</>;
}

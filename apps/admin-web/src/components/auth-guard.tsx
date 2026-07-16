"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { LoadingState } from "@/components/loading-state";
import { FeedbackState } from "@/components/feedback-state";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useI18n } from "@/i18n";
import { getAccessToken } from "@/lib/auth";
import { localizedApiError } from "@/lib/api-errors";

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useI18n();
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
    if (!isLogin && currentUser.isError && !getAccessToken()) {
      router.replace("/login");
    }
  }, [currentUser.isError, isLogin, router]);

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
    return <LoadingState fullscreen label={t("auth.checkingSession")} />;
  }

  if (hasToken && currentUser.isLoading && !isLogin) {
    return <LoadingState fullscreen label={t("auth.checkingSession")} />;
  }

  if (hasToken && currentUser.isError && !isLogin) {
    return (
      <div className="grid min-h-dvh place-items-center p-6">
        <FeedbackState
          tone="error"
          title={t("statusPage.500.title")}
          description={localizedApiError(currentUser.error, t)}
          action={<Button onClick={() => currentUser.refetch()}>{t("common.retry")}</Button>}
        />
      </div>
    );
  }

  return <>{children}</>;
}

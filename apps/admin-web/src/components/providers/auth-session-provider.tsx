"use client";

import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { ApiError, getCurrentUserApi } from "@/lib/api";
import { getAccessToken, onAuthChange, saveActiveAccountFromMe } from "@/lib/auth";
import type { MeResponse } from "@/types/auth";

export const SESSION_QUERY_KEY = ["auth", "session"] as const;
export const SESSION_STALE_TIME = 5 * 60_000;

const AuthSessionContext = createContext<UseQueryResult<MeResponse, Error> | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [hasToken, setHasToken] = useState(
    () => typeof window !== "undefined" && Boolean(getAccessToken()),
  );
  const query = useQuery<MeResponse, Error>({
    queryKey: SESSION_QUERY_KEY,
    queryFn: getCurrentUserApi,
    enabled: hasToken,
    staleTime: SESSION_STALE_TIME,
    gcTime: 30 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: (failureCount, error) =>
      !(error instanceof ApiError && error.status === 401) && failureCount < 1,
  });

  useEffect(() => {
    return onAuthChange((change) => {
      const tokenAvailable = Boolean(getAccessToken());
      setHasToken(tokenAvailable);

      if (change.type === "refresh" && change.session) {
        queryClient.setQueryData<MeResponse>(SESSION_QUERY_KEY, {
          user: change.session.user,
          organization: change.session.organization,
          permissions: change.session.permissions,
          hrEmployee: change.session.hrEmployee,
          accessVersion: change.session.accessVersion,
        });
        return;
      }

      queryClient.removeQueries({ queryKey: SESSION_QUERY_KEY });
    });
  }, [queryClient]);

  useEffect(() => {
    if (query.data) saveActiveAccountFromMe(query.data);
  }, [query.data]);

  return <AuthSessionContext.Provider value={query}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);
  if (!context) throw new Error("useAuthSession must be used within AuthSessionProvider.");
  return context;
}

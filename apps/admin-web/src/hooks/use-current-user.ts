"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUserApi } from "@/lib/api";
import { getAccessToken, onAuthChange, saveActiveAccountFromMe } from "@/lib/auth";

export function useCurrentUser() {
  const [authVersion, setAuthVersion] = useState(0);
  const query = useQuery({
    queryKey: ["auth", "me", authVersion],
    queryFn: getCurrentUserApi,
    enabled: typeof window !== "undefined" && Boolean(getAccessToken()),
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  useEffect(() => onAuthChange(() => setAuthVersion((version) => version + 1)), []);

  useEffect(() => {
    if (query.data) saveActiveAccountFromMe(query.data);
  }, [query.data]);

  return query;
}

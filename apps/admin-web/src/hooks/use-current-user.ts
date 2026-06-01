"use client";

import { useQuery } from "@tanstack/react-query";
import { getCurrentUserApi } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: getCurrentUserApi,
    enabled: typeof window !== "undefined" && Boolean(getAccessToken()),
  });
}

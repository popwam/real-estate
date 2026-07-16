"use client";

import { useAuthSession } from "@/components/providers/auth-session-provider";

export function useCurrentUser() {
  return useAuthSession();
}

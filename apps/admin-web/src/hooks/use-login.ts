"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loginApi } from "@/lib/api";
import { storeTokens } from "@/lib/auth";

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: loginApi,
    onSuccess: (session, variables) => {
      storeTokens(session, { persist: variables.keepSignedIn ?? true });
      queryClient.setQueryData(["auth", "me", 0], {
        user: session.user,
        organization: session.organization,
        permissions: session.permissions,
      });
    },
  });
}

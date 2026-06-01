"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loginApi } from "@/lib/api";
import { storeTokens } from "@/lib/auth";

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: loginApi,
    onSuccess: (session) => {
      storeTokens(session);
      queryClient.setQueryData(["auth", "me"], {
        user: session.user,
        organization: session.organization,
        permissions: session.permissions,
      });
    },
  });
}

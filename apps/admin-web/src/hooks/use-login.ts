"use client";

import { useMutation } from "@tanstack/react-query";
import { loginApi } from "@/lib/api";
import { storeTokens } from "@/lib/auth";

export function useLogin() {
  return useMutation({
    mutationFn: loginApi,
    onSuccess: (session, variables) => {
      storeTokens(session, {
        persist: variables.keepSignedIn ?? true,
        reason: "login",
      });
    },
  });
}

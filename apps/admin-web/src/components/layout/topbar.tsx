"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { clearTokens } from "@/lib/auth";

export function Topbar() {
  const router = useRouter();
  const { data } = useCurrentUser();
  const name = [data?.user.firstName, data?.user.lastName].filter(Boolean).join(" ");

  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-950">
            {data?.organization?.name ?? "POPWAM"}
          </p>
          <p className="text-xs text-zinc-500">
            {name || data?.user.email || "Authenticated workspace"}
          </p>
        </div>
      </div>
      <Button
        className="h-9 bg-white px-3 text-zinc-700 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50"
        onClick={() => {
          clearTokens();
          router.replace("/login");
        }}
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        Sign out
      </Button>
    </header>
  );
}

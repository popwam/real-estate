import { useState } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthSessionProvider } from "@/components/providers/auth-session-provider";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getCurrentUserApi } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number) {
      super("api error");
      this.status = status;
    }
  },
  getCurrentUserApi: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getAccessToken: () => "access-token",
  onAuthChange: () => () => undefined,
  saveActiveAccountFromMe: vi.fn(),
}));

const session = {
  user: {
    id: "owner",
    email: "owner@example.test",
    role: "platform_owner" as const,
    mustChangePassword: false,
  },
  organization: {
    id: "platform",
    name: "POPWAM",
    type: "PLATFORM" as const,
    status: "ACTIVE" as const,
  },
  permissions: ["platform.settings.view"],
  accessVersion: "v1",
};

function Consumer({ name }: { name: string }) {
  const query = useCurrentUser();
  return <span>{query.data ? `${name}:${query.data.user.id}` : `${name}:loading`}</span>;
}

function NavigationFixture() {
  const [page, setPage] = useState("settings");
  return (
    <>
      <button onClick={() => setPage(page === "settings" ? "organizations" : "settings")}>navigate</button>
      <Consumer name={page} />
      <Consumer name="sidebar" />
      <Consumer name="guard" />
    </>
  );
}

describe("stable session bootstrap", () => {
  beforeEach(() => {
    vi.mocked(getCurrentUserApi).mockResolvedValue(session);
  });

  afterEach(cleanup);

  it("shares one /auth/me request across concurrent session consumers", async () => {
    renderFixture();
    await screen.findByText("sidebar:owner");
    expect(getCurrentUserApi).toHaveBeenCalledTimes(1);
  });

  it("reuses the cached session across protected navigation and return", async () => {
    renderFixture();
    await screen.findByText("settings:owner");
    fireEvent.click(screen.getByText("navigate"));
    await screen.findByText("organizations:owner");
    fireEvent.click(screen.getByText("navigate"));
    await screen.findByText("settings:owner");
    expect(getCurrentUserApi).toHaveBeenCalledTimes(1);
  });

  it("does not refetch on browser focus", async () => {
    renderFixture();
    await waitFor(() => expect(getCurrentUserApi).toHaveBeenCalledTimes(1));
    window.dispatchEvent(new Event("focus"));
    await Promise.resolve();
    expect(getCurrentUserApi).toHaveBeenCalledTimes(1);
  });
});

function renderFixture() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthSessionProvider>
        <NavigationFixture />
      </AuthSessionProvider>
    </QueryClientProvider>,
  );
}

import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  accessToken: "old-token",
  clearTokens: vi.fn(),
  storeTokens: vi.fn((session: { accessToken: string }) => {
    auth.accessToken = session.accessToken;
  }),
}));

vi.mock("@/lib/auth", () => ({
  clearTokens: auth.clearTokens,
  getAccessToken: () => auth.accessToken,
  getRefreshToken: () => "refresh-token",
  isActiveAccountPersisted: () => true,
  storeTokens: auth.storeTokens,
}));

import {
  ApiError,
  apiRequest,
  createOrganizationFirstAdminApi,
} from "@/lib/api";
import { getMyAttendancePolicyApi } from "@/lib/hr-settings-api";
import { localizedApiError } from "@/lib/api-errors";

describe("API authentication error handling", () => {
  beforeEach(() => {
    auth.accessToken = "old-token";
    vi.stubGlobal("fetch", vi.fn());
  });

  it.each([403, 500])(
    "does not log out or refresh the session for HTTP %s",
    async (status) => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(
          JSON.stringify({
            code:
              status === 403
                ? "PERMISSION_REQUIRED"
                : "INTERNAL_ERROR",
            message: "raw",
          }),
          {
            status,
            headers: {
              "Content-Type": "application/json",
              "x-request-id": "request-1",
            },
          },
        ),
      );

      await expect(apiRequest("/protected")).rejects.toBeInstanceOf(
        ApiError,
      );

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(auth.clearTokens).not.toHaveBeenCalled();
      expect(auth.storeTokens).not.toHaveBeenCalled();
    },
  );

  it(
    "deduplicates concurrent refreshes and retries each request once",
    async () => {
      vi.mocked(fetch).mockImplementation(async (input, init) => {
        const url = String(input);

        if (url.endsWith("/auth/refresh")) {
          return new Response(
            JSON.stringify({
              accessToken: "new-token",
              refreshToken: "new-refresh-token",
              user: {
                id: "owner",
                email: "owner@example.test",
                role: "platform_owner",
                mustChangePassword: false,
              },
              organization: null,
              permissions: ["platform.settings.view"],
              accessVersion: "v2",
            }),
            {
              status: 200,
              headers: {
                "Content-Type": "application/json",
              },
            },
          );
        }

        const authorization = new Headers(
          init?.headers,
        ).get("Authorization");

        return authorization === "Bearer new-token"
          ? new Response(JSON.stringify({ ok: true }), {
              status: 200,
              headers: {
                "Content-Type": "application/json",
              },
            })
          : new Response(
              JSON.stringify({
                message: "expired",
              }),
              {
                status: 401,
                headers: {
                  "Content-Type": "application/json",
                },
              },
            );
      });

      await expect(
        Promise.all([
          apiRequest("/protected/one"),
          apiRequest("/protected/two"),
        ]),
      ).resolves.toEqual([{ ok: true }, { ok: true }]);

      const refreshCalls = vi
        .mocked(fetch)
        .mock.calls.filter(([input]) =>
          String(input).endsWith("/auth/refresh"),
        );

      expect(refreshCalls).toHaveLength(1);
      expect(auth.storeTokens).toHaveBeenCalledTimes(1);
    },
  );

  it(
    "maps permission failures to Arabic without exposing the raw English message",
    () => {
      const error = new ApiError(
        403,
        "Required permission is missing.",
        {
          code: "PERMISSION_REQUIRED",
          requiredPermission: "platform.settings.view",
        },
        "request-2",
      );

      const messages: Record<string, string> = {
        "apiErrors.permissionRequired":
          "لا تملك الصلاحية المطلوبة لعرض هذا المحتوى.",
        "apiErrors.requestId":
          "معرّف الطلب: {requestId}.",
      };

      const translated = localizedApiError(
        error,
        (key, values) =>
          (messages[key] ?? key).replace(
            "{requestId}",
            String(values?.requestId ?? ""),
          ),
      );

      expect(translated).toContain(
        "لا تملك الصلاحية",
      );
      expect(translated).toContain("request-2");
      expect(translated).not.toContain(
        "Required permission is missing",
      );
    },
  );

  it(
    "posts the complete first-admin payload to the platform settings endpoint",
    async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(
          JSON.stringify({
            user: {
              id: "user-1",
              organizationId: "company/one",
            },
            activationCheck: {
              canActivate: true,
            },
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          },
        ),
      );

      const input = {
        name: "Company Owner",
        email: "owner@example.test",
        phoneCountry: "MD",
        phone: "69123456",
        temporaryPassword:
          "temporary-password-123",
        roleTemplate: "company_owner" as const,
      };

      await createOrganizationFirstAdminApi(
        "company/one",
        input,
      );

      expect(fetch).toHaveBeenCalledWith(
        expect.stringMatching(
          /\/platform\/settings\/company%2Fone\/first-admin$/,
        ),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(input),
        }),
    );
  },
  );

  it("calls the limited self-service attendance policy endpoint", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ allowWebCheckIn: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await getMyAttendancePolicyApi();

    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/hr\/attendance\/me\/policy$/),
      expect.anything(),
    );
    expect(String(vi.mocked(fetch).mock.calls[0][0])).not.toContain("/hr/attendance/settings");
  });

  it("does not refresh or retry an expired self-service policy request", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ message: "expired" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(getMyAttendancePolicyApi()).rejects.toMatchObject({ status: 401 });

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toMatch(/\/hr\/attendance\/me\/policy$/);
  });
});

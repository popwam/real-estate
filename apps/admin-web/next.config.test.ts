import { describe, expect, it } from "vitest";
import nextConfig from "./next.config";

describe("Admin Web permissions policy", () => {
  it("allows same-origin attendance pages to use geolocation and camera", async () => {
    const headers = await nextConfig.headers?.();
    expect(headers).toContainEqual({
      source: "/(.*)",
      headers: [{ key: "Permissions-Policy", value: "geolocation=(self), camera=(self)" }],
    });
  });
});

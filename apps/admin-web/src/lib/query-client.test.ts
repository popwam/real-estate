import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api";
import { retryTransientQuery } from "@/lib/query-client";

describe("query retry policy", () => {
  it.each([401, 403])("does not retry HTTP %s authorization failures", (status) => {
    expect(retryTransientQuery(0, new ApiError(status, "authorization failure"))).toBe(false);
  });

  it("retries a transient gateway failure only once", () => {
    const error = new ApiError(503, "temporarily unavailable");
    expect(retryTransientQuery(0, error)).toBe(true);
    expect(retryTransientQuery(1, error)).toBe(false);
  });
});

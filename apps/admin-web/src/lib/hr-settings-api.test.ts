import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  getAccessToken: () => "test-token",
  getRefreshToken: () => null,
  isActiveAccountPersisted: () => true,
  clearTokens: vi.fn(),
  storeTokens: vi.fn(),
}));

vi.mock("@/lib/auth", () => auth);

import {
  checkInApi,
  exportAttendanceCsvApi,
  getMonthlyAttendanceApi,
  preflightCheckInApi,
  saveMonthlyAttendanceDayApi,
  uploadAttendanceEvidencePhotoApi,
} from "@/lib/hr-settings-api";

describe("web self-service attendance API", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify({ fileId: "photo-1", allowed: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        ),
      ),
    );
  });

  it("uses the self-service preflight and always identifies the browser as WEB", async () => {
    await preflightCheckInApi({ latitude: 47.01, longitude: 28.86 });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/hr\/attendance\/check-in\/preflight$/),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          latitude: 47.01,
          longitude: 28.86,
          clientPlatform: "WEB",
        }),
      }),
    );
  });

  it("sends only the uploaded photo file ID to the final self-service check-in", async () => {
    await checkInApi({
      latitude: 47.01,
      longitude: 28.86,
      photoFileId: "photo-1",
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/hr\/attendance\/check-in$/),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          latitude: 47.01,
          longitude: 28.86,
          photoFileId: "photo-1",
          clientPlatform: "WEB",
        }),
      }),
    );
    expect(String(vi.mocked(fetch).mock.calls[0][0])).not.toMatch(
      /\/hr\/attendance$/,
    );
  });

  it("uploads the camera image as multipart evidence", async () => {
    await uploadAttendanceEvidencePhotoApi(
      new File(["image"], "live.jpg", { type: "image/jpeg" }),
    );

    const [, options] = vi.mocked(fetch).mock.calls[0];
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toMatch(
      /\/hr\/attendance\/evidence-photo$/,
    );
    expect(options?.body).toBeInstanceOf(FormData);
    expect((options?.body as FormData).get("purpose")).toBe("CHECK_IN");
    expect((options?.body as FormData).get("file")).toBeInstanceOf(File);
  });

  it("requests a CSV export for the full month containing the selected date", async () => {
    await exportAttendanceCsvApi("2026-08-04");

    expect(String(vi.mocked(fetch).mock.calls[0][0])).toMatch(
      /\/hr\/export\/attendance\?dateFrom=2026-08-01&dateTo=2026-08-31&format=csv$/,
    );
  });

  it("uses the correct final day for a leap-year February", async () => {
    await exportAttendanceCsvApi("2028-02-10");

    expect(String(vi.mocked(fetch).mock.calls[0][0])).toMatch(
      /dateFrom=2028-02-01&dateTo=2028-02-29&format=csv$/,
    );
  });

  it("loads the monthly employee-by-day attendance matrix", async () => {
    await getMonthlyAttendanceApi("2026-08");

    expect(String(vi.mocked(fetch).mock.calls[0][0])).toMatch(
      /\/hr\/attendance\/monthly\?month=2026-08$/,
    );
  });

  it("creates a missing day and patches an existing attendance record", async () => {
    const input = {
      employeeId: "employee-1",
      date: "2026-08-04",
      status: "PRESENT",
      checkInAt: "2026-08-04T06:00:00.000Z",
    };
    await saveMonthlyAttendanceDayApi(null, input);
    await saveMonthlyAttendanceDayApi("attendance-1", input);

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      expect.stringMatching(/\/hr\/attendance$/),
      expect.objectContaining({ method: "POST", body: JSON.stringify(input) }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(/\/hr\/attendance\/attendance-1$/),
      expect.objectContaining({ method: "PATCH", body: JSON.stringify(input) }),
    );
  });
});

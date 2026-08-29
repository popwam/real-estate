import { afterEach, describe, expect, it, vi } from "vitest";
import { geolocationFailureReason, getBrowserLocation } from "@/lib/attendance-geolocation";
import { messages as enMessages } from "@/i18n/messages/en";

type PositionError = { code: number; message: string };

const originalGeolocation = navigator.geolocation;
const originalSecureContext = window.isSecureContext;
const originalPermissionsPolicy = Object.getOwnPropertyDescriptor(document, "permissionsPolicy");

function installGeolocation(...results: Array<PositionError | GeolocationPosition>) {
  const getCurrentPosition = vi.fn((success: PositionCallback, error: PositionErrorCallback, _options?: PositionOptions) => {
    void _options;
    const result = results.shift();
    if (!result) throw new Error("Unexpected geolocation request");
    if ("coords" in result) success(result);
    else error(result as GeolocationPositionError);
  });
  Object.defineProperty(navigator, "geolocation", { configurable: true, value: { getCurrentPosition } });
  return getCurrentPosition;
}

function location(): GeolocationPosition {
  return {
    coords: { latitude: 47.01, longitude: 28.86, accuracy: 10, altitude: null, altitudeAccuracy: null, heading: null, speed: null, toJSON: () => ({}) },
    timestamp: Date.now(),
    toJSON: () => ({}),
  };
}

afterEach(() => {
  Object.defineProperty(navigator, "geolocation", { configurable: true, value: originalGeolocation });
  Object.defineProperty(window, "isSecureContext", { configurable: true, value: originalSecureContext });
  if (originalPermissionsPolicy) Object.defineProperty(document, "permissionsPolicy", originalPermissionsPolicy);
  else delete (document as Document & { permissionsPolicy?: unknown }).permissionsPolicy;
  vi.restoreAllMocks();
});

describe("attendance browser geolocation", () => {
  it.each([
    [1, "LOCATION_PERMISSION_DENIED"],
    [2, "LOCATION_POSITION_UNAVAILABLE"],
    [3, "LOCATION_TIMEOUT"],
  ] as const)("maps browser error code %s to %s", (code, reason) => {
    expect(geolocationFailureReason({ code, message: "Safari failure" } as GeolocationPositionError)).toBe(reason);
  });

  it("does not retry an iOS PERMISSION_DENIED error", async () => {
    const getCurrentPosition = installGeolocation({ code: 1, message: "Permission denied" });

    await expect(getBrowserLocation("location-1")).rejects.toMatchObject({ reason: "LOCATION_PERMISSION_DENIED", code: 1 });
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
  });

  it("provides the iOS Settings guidance for PERMISSION_DENIED", () => {
    expect(enMessages["attendance.self.reason.LOCATION_PERMISSION_DENIED"]).toContain("Settings → Privacy & Security → Location Services → Safari Websites → While Using → Precise Location");
  });

  it("logs only the safe development diagnostic for a browser error", async () => {
    const debug = vi.spyOn(console, "debug").mockImplementation(() => undefined);
    installGeolocation({ code: 1, message: "Permission denied" });

    await expect(getBrowserLocation("location-1")).rejects.toMatchObject({ reason: "LOCATION_PERMISSION_DENIED" });
    expect(debug).toHaveBeenCalledWith("[attendance:self-service:geolocation-error]", expect.objectContaining({
      code: 1,
      message: "Permission denied",
      isSecureContext: window.isSecureContext,
      userAgent: navigator.userAgent,
      visibilityState: document.visibilityState,
      selectedAttendanceLocationId: "location-1",
    }));
    expect(JSON.stringify(debug.mock.calls[0]?.[1])).not.toMatch(/latitude|longitude|token/i);
  });

  it("retries TIMEOUT exactly once with low accuracy", async () => {
    const getCurrentPosition = installGeolocation({ code: 3, message: "Timed out" }, location());

    await expect(getBrowserLocation("location-1")).resolves.toMatchObject({ locationAccuracyMeters: 10 });
    expect(getCurrentPosition).toHaveBeenCalledTimes(2);
    expect(getCurrentPosition.mock.calls[0]?.[2]).toMatchObject({ enableHighAccuracy: true, maximumAge: 0, timeout: 30_000 });
    expect(getCurrentPosition.mock.calls[1]?.[2]).toMatchObject({ enableHighAccuracy: false, maximumAge: 0, timeout: 15_000 });
  });

  it("shows POSITION_UNAVAILABLE instead of permission denied after its one retry", async () => {
    const getCurrentPosition = installGeolocation({ code: 2, message: "Unavailable" }, { code: 2, message: "Unavailable" });

    await expect(getBrowserLocation("location-1")).rejects.toMatchObject({ reason: "LOCATION_POSITION_UNAVAILABLE", code: 2 });
    expect(getCurrentPosition).toHaveBeenCalledTimes(2);
  });

  it("does not enter a retry loop when both requests time out", async () => {
    const getCurrentPosition = installGeolocation({ code: 3, message: "Timed out" }, { code: 3, message: "Timed out" });

    await expect(getBrowserLocation("location-1")).rejects.toMatchObject({ reason: "LOCATION_TIMEOUT", code: 3 });
    expect(getCurrentPosition).toHaveBeenCalledTimes(2);
  });

  it("rejects an insecure page before requesting location", async () => {
    const getCurrentPosition = installGeolocation(location());
    Object.defineProperty(window, "isSecureContext", { configurable: true, value: false });

    await expect(getBrowserLocation("location-1")).rejects.toMatchObject({ reason: "LOCATION_INSECURE_CONTEXT" });
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it("reports a blocked Permissions-Policy as a configuration error", async () => {
    const getCurrentPosition = installGeolocation(location());
    Object.defineProperty(document, "permissionsPolicy", { configurable: true, value: { allowsFeature: (feature: string) => feature !== "geolocation" } });

    await expect(getBrowserLocation("location-1")).rejects.toMatchObject({ reason: "LOCATION_PERMISSION_POLICY_BLOCKED" });
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it("starts getCurrentPosition synchronously when called by the click handler", () => {
    const getCurrentPosition = installGeolocation(location());
    void getBrowserLocation("location-1");
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
  });
});

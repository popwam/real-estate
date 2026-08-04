export type LocationPayload = {
  latitude: number;
  longitude: number;
  locationAccuracyMeters: number;
  locationCapturedAt: string;
};

export type GeolocationFailureReason =
  | "LOCATION_PERMISSION_DENIED"
  | "LOCATION_POSITION_UNAVAILABLE"
  | "LOCATION_TIMEOUT"
  | "LOCATION_INSECURE_CONTEXT"
  | "LOCATION_PERMISSION_POLICY_BLOCKED"
  | "LOCATION_NOT_AVAILABLE";

type GeolocationErrorLike = Pick<GeolocationPositionError, "code" | "message">;

type GeolocationOptions = PositionOptions;

const HIGH_ACCURACY_OPTIONS: GeolocationOptions = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 30_000,
};

const LOW_ACCURACY_OPTIONS: GeolocationOptions = {
  enableHighAccuracy: false,
  maximumAge: 0,
  timeout: 15_000,
};

export class BrowserLocationError extends Error {
  constructor(
    readonly reason: GeolocationFailureReason,
    readonly code?: number,
  ) {
    super(reason);
    this.name = "BrowserLocationError";
  }
}

export function isBrowserLocationError(error: unknown): error is BrowserLocationError {
  return error instanceof BrowserLocationError;
}

export function geolocationFailureReason(error: GeolocationErrorLike): GeolocationFailureReason {
  switch (error.code) {
    case 1:
      return "LOCATION_PERMISSION_DENIED";
    case 2:
      return "LOCATION_POSITION_UNAVAILABLE";
    case 3:
      return "LOCATION_TIMEOUT";
    default:
      return "LOCATION_NOT_AVAILABLE";
  }
}

/**
 * This function must only be called from an explicit user action. It calls
 * getCurrentPosition synchronously before its first await so Safari retains
 * the button-click user gesture.
 */
export async function getBrowserLocation(selectedAttendanceLocationId: string | null): Promise<LocationPayload> {
  if (typeof window === "undefined" || typeof navigator === "undefined" || !navigator.geolocation) {
    throw new BrowserLocationError("LOCATION_NOT_AVAILABLE");
  }
  if (window.isSecureContext === false) {
    throw new BrowserLocationError("LOCATION_INSECURE_CONTEXT");
  }
  if (!geolocationAllowedByPermissionsPolicy()) {
    throw new BrowserLocationError("LOCATION_PERMISSION_POLICY_BLOCKED");
  }

  try {
    return await requestPosition(HIGH_ACCURACY_OPTIONS, selectedAttendanceLocationId);
  } catch (error) {
    if (!isBrowserLocationError(error) || (error.reason !== "LOCATION_TIMEOUT" && error.reason !== "LOCATION_POSITION_UNAVAILABLE")) {
      throw error;
    }

    // iOS Safari can fail high-accuracy acquisition indoors. Retry exactly once
    // with a shorter, low-accuracy request; never retry a denied permission.
    return requestPosition(LOW_ACCURACY_OPTIONS, selectedAttendanceLocationId);
  }
}

function requestPosition(options: GeolocationOptions, selectedAttendanceLocationId: string | null): Promise<LocationPayload> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        locationAccuracyMeters: position.coords.accuracy,
        locationCapturedAt: new Date(position.timestamp).toISOString(),
      }),
      (error) => {
        logGeolocationError(error, selectedAttendanceLocationId);
        reject(new BrowserLocationError(geolocationFailureReason(error), error.code));
      },
      options,
    );
  });
}

function geolocationAllowedByPermissionsPolicy() {
  const policyDocument = document as Document & {
    permissionsPolicy?: { allowsFeature?: (feature: string) => boolean };
    featurePolicy?: { allowsFeature?: (feature: string) => boolean };
  };
  const policy = policyDocument.permissionsPolicy ?? policyDocument.featurePolicy;

  // Safari does not consistently expose this API. Its absence is not a denial;
  // the real getCurrentPosition request below remains the source of truth.
  if (typeof policy?.allowsFeature !== "function") return true;

  try {
    return policy.allowsFeature("geolocation");
  } catch {
    return true;
  }
}

function logGeolocationError(error: GeolocationErrorLike, selectedAttendanceLocationId: string | null) {
  if (process.env.NODE_ENV === "production") return;

  console.debug("[attendance:self-service:geolocation-error]", {
    code: error.code,
    message: error.message,
    isSecureContext: window.isSecureContext,
    userAgent: navigator.userAgent,
    visibilityState: document.visibilityState,
    selectedAttendanceLocationId,
  });
}

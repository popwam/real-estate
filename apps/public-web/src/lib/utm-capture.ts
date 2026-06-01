export const utmParamNames = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "gclid",
] as const;

export type UtmParamName = (typeof utmParamNames)[number];
export type CapturedUtmParams = Partial<Record<UtmParamName, string>>;

const storageKey = "popwam_public_utm";

export function readUtmParams(searchParams: URLSearchParams): CapturedUtmParams {
  return utmParamNames.reduce<CapturedUtmParams>((captured, key) => {
    const value = searchParams.get(key);

    if (value) {
      captured[key] = value;
    }

    return captured;
  }, {});
}

export function hasUtmParams(params: CapturedUtmParams) {
  return Object.keys(params).length > 0;
}

export function storeUtmParams(params: CapturedUtmParams) {
  if (typeof window === "undefined" || !hasUtmParams(params)) {
    return;
  }

  window.localStorage.setItem(
    storageKey,
    JSON.stringify({
      capturedAt: new Date().toISOString(),
      params,
    }),
  );
}

export function readStoredUtmParams(): CapturedUtmParams {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.params ?? {};
  } catch {
    return {};
  }
}

export function captureUtmFromCurrentUrl() {
  if (typeof window === "undefined") {
    return {};
  }

  const current = readUtmParams(new URLSearchParams(window.location.search));

  if (hasUtmParams(current)) {
    storeUtmParams(current);
    return current;
  }

  return readStoredUtmParams();
}

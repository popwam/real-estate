import { ApiError } from "@/lib/api";

type Translate = (key: string, values?: Record<string, string | number>) => string;

export function localizedApiError(
  error: unknown,
  t: Translate,
  fallbackKey = "statusPage.500.body",
) {
  if (!(error instanceof ApiError)) return t(fallbackKey);

  let message: string;
  if (error.status === 403 || error.code === "PERMISSION_REQUIRED") {
    message = t("apiErrors.permissionRequired");
  } else if (error.status === 404) {
    message = t("apiErrors.notFound");
  } else if (error.status === 0) {
    message = t("apiErrors.network");
  } else if (error.status >= 500) {
    message = t("apiErrors.server");
  } else {
    message = t(fallbackKey);
  }

  return error.requestId
    ? `${message} ${t("apiErrors.requestId", { requestId: error.requestId })}`
    : message;
}

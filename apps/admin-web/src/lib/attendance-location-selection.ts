import type { WebAttendanceLocation } from "@/lib/hr-settings-api";

/** Defense in depth for a self-service response: a branch is never enough on its own. */
export function eligibleWebAttendanceLocations(locations: WebAttendanceLocation[] | undefined) {
  return (locations ?? []).filter((location) =>
    location.isActive &&
    location.allowedForWeb &&
    Boolean(location.branchId) &&
    Number.isFinite(location.latitude) &&
    Number.isFinite(location.longitude) &&
    location.latitude >= -90 && location.latitude <= 90 &&
    location.longitude >= -180 && location.longitude <= 180 &&
    Number.isFinite(location.radiusMeters) && location.radiusMeters > 0,
  );
}

export function selectedAttendanceLocationId(locations: WebAttendanceLocation[], currentId: string) {
  if (locations.length === 1) return locations[0].id;
  return locations.some((location) => location.id === currentId) ? currentId : "";
}

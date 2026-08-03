import { describe, expect, it } from "vitest";
import { eligibleWebAttendanceLocations, selectedAttendanceLocationId } from "@/lib/attendance-location-selection";
import type { WebAttendanceLocation } from "@/lib/hr-settings-api";

function location(overrides: Partial<WebAttendanceLocation> = {}): WebAttendanceLocation {
  return { id: "location-1", organizationId: "org-1", branchId: "branch-1", branchName: "Head office", name: "Head office attendance", latitude: 47.01, longitude: 28.86, radiusMeters: 30, exactRadiusMeters: 30, expandedRadiusMeters: 100, isActive: true, allowedForWeb: true, ...overrides };
}

describe("web attendance location selection", () => {
  it("automatically selects the only eligible configured branch", () => {
    const locations = eligibleWebAttendanceLocations([location()]);
    expect(selectedAttendanceLocationId(locations, "")).toBe("location-1");
  });

  it("keeps multiple eligible attendance locations available for the dropdown", () => {
    const locations = eligibleWebAttendanceLocations([location(), location({ id: "location-2", branchId: "branch-2", branchName: "Capital Gate" })]);
    expect(locations.map((item) => item.branchName)).toEqual(["Head office", "Capital Gate"]);
    expect(selectedAttendanceLocationId(locations, "")).toBe("");
  });

  it.each([
    ["inactive", location({ isActive: false })],
    ["web-ineligible", location({ allowedForWeb: false })],
    ["missing branch link", location({ branchId: "" })],
    ["missing geofence", location({ latitude: Number.NaN })],
  ])("excludes a %s record rather than treating an organization branch as an attendance location", (_name, item) => {
    expect(eligibleWebAttendanceLocations([item])).toEqual([]);
  });

  it("returns no selection when no attendance location is configured", () => {
    expect(selectedAttendanceLocationId([], "branch-1")).toBe("");
  });
});

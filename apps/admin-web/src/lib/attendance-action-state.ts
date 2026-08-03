export type AttendanceActionState =
  | "loading"
  | "error"
  | "employee-unlinked"
  | "check-out"
  | "completed"
  | "policy-web-disabled"
  | "policy-wifi-blocked"
  | "location-setup-required"
  | "location-selection-required"
  | "check-in";

type AttendanceActionStateInput = {
  isLoading: boolean;
  hasError: boolean;
  employeeLinked: boolean;
  hasOpenAttendance: boolean;
  isCompleted: boolean;
  webCheckInAllowed: boolean;
  webWifiBlocked: boolean;
  eligibleLocationCount: number;
  hasSelectedLocation: boolean;
};

/** An Organization Branch alone can never produce a self-service action. */
export function attendanceActionState(input: AttendanceActionStateInput): AttendanceActionState {
  if (input.isLoading) return "loading";
  if (!input.employeeLinked) return "employee-unlinked";
  if (input.hasError) return "error";
  if (input.hasOpenAttendance) return "check-out";
  if (input.isCompleted) return "completed";
  if (!input.webCheckInAllowed) return "policy-web-disabled";
  if (input.webWifiBlocked) return "policy-wifi-blocked";
  if (!input.eligibleLocationCount) return "location-setup-required";
  if (!input.hasSelectedLocation) return "location-selection-required";
  return "check-in";
}

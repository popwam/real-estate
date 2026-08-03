import { describe, expect, it } from "vitest";
import { attendanceThresholdPreview, validateAttendanceOverride, type AttendanceOverrideDraft } from "@/components/hr/employee-form";

const workingRule = { dayOfWeek: 1, isWorkingDay: true, startTime: "09:00", endTime: "17:00", lateUntilMinutes: 15, severeLateUntilMinutes: 60, absentAfterMinutes: 60, earlyLeaveGraceMinutes: 0, overnightShift: false };
const override = (): AttendanceOverrideDraft => ({ effectiveFrom: "2026-08-03", effectiveTo: "", timezone: "Europe/Chisinau", weeklyRules: Array.from({ length: 7 }, (_, dayOfWeek) => ({ ...workingRule, dayOfWeek, isWorkingDay: dayOfWeek < 5 })) });

describe("employee weekly attendance override editor helpers", () => {
  it("accepts all seven unique days and a non-working day without times", () => {
    const draft = override();
    draft.weeklyRules[6] = { dayOfWeek: 6, isWorkingDay: false };
    expect(validateAttendanceOverride(draft)).toBe("");
  });

  it.each([
    ["duplicate day", (draft: AttendanceOverrideDraft) => { draft.weeklyRules[6] = { ...draft.weeklyRules[0] }; }],
    ["invalid threshold order", (draft: AttendanceOverrideDraft) => { draft.weeklyRules[0] = { ...workingRule, dayOfWeek: 0, lateUntilMinutes: 60, severeLateUntilMinutes: 15 }; }],
    ["missing working time", (draft: AttendanceOverrideDraft) => { draft.weeklyRules[0] = { ...workingRule, dayOfWeek: 0, startTime: "" }; }],
    ["non-overnight reversed time", (draft: AttendanceOverrideDraft) => { draft.weeklyRules[0] = { ...workingRule, dayOfWeek: 0, startTime: "18:00", endTime: "09:00" }; }],
    ["reversed effective dates", (draft: AttendanceOverrideDraft) => { draft.effectiveTo = "2026-08-02"; }],
  ])("rejects %s in the editor before save", (_name, mutate) => {
    const draft = override(); mutate(draft);
    expect(validateAttendanceOverride(draft)).not.toBe("");
  });

  it("allows an overnight shift and renders the requested lateness preview", () => {
    const draft = override();
    draft.weeklyRules[0] = { ...workingRule, dayOfWeek: 0, startTime: "22:00", endTime: "06:00", overnightShift: true };
    expect(validateAttendanceOverride(draft)).toBe("");
    expect(attendanceThresholdPreview(workingRule)).toEqual({ onTimeUntil: "09:00", late: "09:01 – 09:15", severeLate: "09:16 – 10:00", absent: "After 10:00", severeThreshold: null });
  });
});

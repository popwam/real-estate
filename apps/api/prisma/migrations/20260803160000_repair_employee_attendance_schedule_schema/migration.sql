-- Repair the schema drift from the previously recorded attendance-schedule
-- migration. This is deliberately additive: historical attendance remains
-- untouched and snapshot fields remain nullable for pre-existing records.
ALTER TYPE "HrAttendanceStatus" ADD VALUE IF NOT EXISTS 'SEVERE_LATE';

ALTER TABLE "hr_attendance_records"
  ADD COLUMN IF NOT EXISTS "lateUntilAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "severeLateUntilAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "absentAfterAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "attendanceStatusAtCheckIn" "HrAttendanceStatus";

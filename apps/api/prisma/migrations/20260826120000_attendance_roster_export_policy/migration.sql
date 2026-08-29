ALTER TYPE "HrAttendanceStatus" ADD VALUE IF NOT EXISTS 'LEAVE';
ALTER TYPE "AttendanceSource" ADD VALUE IF NOT EXISTS 'AUTO_GENERATED';

CREATE TYPE "AttendanceEntryChannel" AS ENUM ('WEB', 'MOBILE_APP', 'MANUAL_ADMIN', 'AUTO');
CREATE TYPE "MissingAttendanceDisposition" AS ENUM ('ABSENT', 'LEAVE');

ALTER TABLE "hr_attendance_records"
  ADD COLUMN "entryChannel" "AttendanceEntryChannel" NOT NULL DEFAULT 'MANUAL_ADMIN';

ALTER TABLE "organization_attendance_settings"
  ALTER COLUMN "workStartTime" SET DEFAULT '11:15',
  ALTER COLUMN "workEndTime" SET DEFAULT '19:00',
  ADD COLUMN "monthlyLateAllowanceHours" INTEGER NOT NULL DEFAULT 4,
  ADD COLUMN "lateAllowanceChargeHoursPerDay" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "missingAttendanceDisposition" "MissingAttendanceDisposition" NOT NULL DEFAULT 'ABSENT';

-- Existing untouched installations still carry the former defaults. Preserve
-- any organization that configured a different schedule explicitly.
UPDATE "organization_attendance_settings"
SET "workStartTime" = '11:15', "workEndTime" = '19:00'
WHERE "workStartTime" = '09:00' AND "workEndTime" = '17:00';

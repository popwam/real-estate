-- Repair an unapplied attendance schema migration without modifying historical rows.
-- This migration is intentionally additive and idempotent.

ALTER TYPE "HrAttendanceStatus" ADD VALUE IF NOT EXISTS 'LEAVE';
ALTER TYPE "AttendanceSource" ADD VALUE IF NOT EXISTS 'AUTO_GENERATED';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AttendanceEntryChannel') THEN
    CREATE TYPE "AttendanceEntryChannel" AS ENUM ('WEB', 'MOBILE_APP', 'MANUAL_ADMIN', 'AUTO');
  END IF;
END
$$;

ALTER TYPE "AttendanceEntryChannel" ADD VALUE IF NOT EXISTS 'WEB';
ALTER TYPE "AttendanceEntryChannel" ADD VALUE IF NOT EXISTS 'MOBILE_APP';
ALTER TYPE "AttendanceEntryChannel" ADD VALUE IF NOT EXISTS 'MANUAL_ADMIN';
ALTER TYPE "AttendanceEntryChannel" ADD VALUE IF NOT EXISTS 'AUTO';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MissingAttendanceDisposition') THEN
    CREATE TYPE "MissingAttendanceDisposition" AS ENUM ('ABSENT', 'LEAVE');
  END IF;
END
$$;

ALTER TYPE "MissingAttendanceDisposition" ADD VALUE IF NOT EXISTS 'ABSENT';
ALTER TYPE "MissingAttendanceDisposition" ADD VALUE IF NOT EXISTS 'LEAVE';

ALTER TABLE "hr_attendance_records"
  ADD COLUMN IF NOT EXISTS "entryChannel" "AttendanceEntryChannel" NOT NULL DEFAULT 'MANUAL_ADMIN';

ALTER TABLE "organization_attendance_settings"
  ADD COLUMN IF NOT EXISTS "monthlyLateAllowanceHours" INTEGER NOT NULL DEFAULT 4,
  ADD COLUMN IF NOT EXISTS "lateAllowanceChargeHoursPerDay" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "missingAttendanceDisposition" "MissingAttendanceDisposition" NOT NULL DEFAULT 'ABSENT';

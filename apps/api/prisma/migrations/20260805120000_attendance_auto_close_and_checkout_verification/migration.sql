-- Additive attendance hardening. Historical attendance is deliberately left
-- unchanged: every newly introduced record-level field is nullable or has a
-- safe default and this migration performs no backfill.
CREATE TYPE "RegularShiftAutoCloseMode" AS ENUM ('END_OF_WORK_DAY', 'PLANNED_CHECK_OUT_PLUS_GRACE');
CREATE TYPE "CheckOutMethod" AS ENUM ('SELF_SERVICE', 'ADMIN_MANUAL', 'AUTO_CLOSE');
CREATE TYPE "AutoCloseReason" AS ENUM ('MISSED_CHECK_OUT_END_OF_DAY', 'MISSED_CHECK_OUT_AFTER_SHIFT', 'STALE_OPEN_RECORD');
CREATE TYPE "CheckOutVerificationStatus" AS ENUM ('VERIFIED', 'PENDING_REVIEW', 'NOT_VERIFIED', 'AUTO_CLOSED');
CREATE TYPE "CheckOutOutsideLocationPolicy" AS ENUM ('BLOCK', 'MANUAL_REVIEW', 'ALLOW_WITH_EVIDENCE');

ALTER TABLE "organization_attendance_settings"
  ADD COLUMN "autoCloseOpenAttendance" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "regularShiftAutoCloseMode" "RegularShiftAutoCloseMode" NOT NULL DEFAULT 'END_OF_WORK_DAY',
  ADD COLUMN "autoCloseGraceMinutes" INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN "autoCloseAtLocalMidnight" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "checkOutOutsideLocationPolicy" "CheckOutOutsideLocationPolicy" NOT NULL DEFAULT 'BLOCK';

ALTER TABLE "hr_attendance_records"
  ADD COLUMN "actualCheckInAt" TIMESTAMP(3),
  ADD COLUMN "actualCheckOutAt" TIMESTAMP(3),
  ADD COLUMN "calculatedWorkMinutes" INTEGER,
  ADD COLUMN "approvedWorkMinutes" INTEGER,
  ADD COLUMN "overnightShift" BOOLEAN,
  ADD COLUMN "checkOutMethod" "CheckOutMethod",
  ADD COLUMN "checkOutVerificationStatus" "CheckOutVerificationStatus",
  ADD COLUMN "autoClosed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "autoClosedAt" TIMESTAMP(3),
  ADD COLUMN "autoCloseReason" "AutoCloseReason",
  ADD COLUMN "autoCloseWarningSentAt" TIMESTAMP(3),
  ADD COLUMN "requiresManualReview" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "reviewReason" TEXT;

ALTER TABLE "hr_attendance_attempts"
  ADD COLUMN "attendanceRecordId" TEXT,
  ADD COLUMN "actionType" TEXT,
  ADD COLUMN "result" TEXT,
  ADD CONSTRAINT "hr_attendance_attempts_attendanceRecordId_fkey"
    FOREIGN KEY ("attendanceRecordId") REFERENCES "hr_attendance_records"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "hr_attendance_attempts_attendanceRecordId_createdAt_idx"
  ON "hr_attendance_attempts"("attendanceRecordId", "createdAt");

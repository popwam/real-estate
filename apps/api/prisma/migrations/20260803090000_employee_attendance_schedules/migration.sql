-- Additive employee attendance schedules. Existing employees remain on the
-- organization default and existing attendance rows keep their original values.
CREATE TYPE "AttendanceScheduleMode" AS ENUM ('ORGANIZATION_DEFAULT', 'ASSIGNED_SCHEDULE', 'EMPLOYEE_OVERRIDE');
ALTER TYPE "HrAttendanceStatus" ADD VALUE IF NOT EXISTS 'EARLY_LEAVE';

CREATE TABLE "hr_attendance_schedules" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "timezone" TEXT,
  "weeklyRules" JSONB NOT NULL,
  "effectiveFrom" TIMESTAMP(3) NOT NULL,
  "effectiveTo" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hr_attendance_schedules_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "hr_attendance_schedules_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "hr_attendance_schedules_organizationId_isActive_effectiveFrom_idx" ON "hr_attendance_schedules"("organizationId", "isActive", "effectiveFrom");

CREATE TABLE "hr_employee_attendance_schedule_overrides" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "weeklyRules" JSONB NOT NULL,
  "timezone" TEXT,
  "effectiveFrom" TIMESTAMP(3) NOT NULL,
  "effectiveTo" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hr_employee_attendance_schedule_overrides_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "hr_employee_attendance_schedule_overrides_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "hr_employee_attendance_schedule_overrides_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "hr_employee_attendance_schedule_overrides_employeeId_isActive_effectiveFrom_idx" ON "hr_employee_attendance_schedule_overrides"("employeeId", "isActive", "effectiveFrom");
CREATE INDEX "hr_employee_attendance_schedule_overrides_organizationId_effectiveFrom_idx" ON "hr_employee_attendance_schedule_overrides"("organizationId", "effectiveFrom");

ALTER TABLE "hr_employees" ADD COLUMN "attendanceScheduleMode" "AttendanceScheduleMode" NOT NULL DEFAULT 'ORGANIZATION_DEFAULT';
ALTER TABLE "hr_employees" ADD COLUMN "attendanceScheduleId" TEXT;
ALTER TABLE "hr_employees" ADD CONSTRAINT "hr_employees_attendanceScheduleId_fkey" FOREIGN KEY ("attendanceScheduleId") REFERENCES "hr_attendance_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "hr_employees_attendanceScheduleId_idx" ON "hr_employees"("attendanceScheduleId");

ALTER TABLE "hr_attendance_records"
  ADD COLUMN "scheduleSource" "AttendanceScheduleMode",
  ADD COLUMN "scheduleId" TEXT,
  ADD COLUMN "scheduleTimezone" TEXT,
  ADD COLUMN "plannedCheckInAt" TIMESTAMP(3),
  ADD COLUMN "plannedCheckOutAt" TIMESTAMP(3),
  ADD COLUMN "graceMinutes" INTEGER,
  ADD COLUMN "expectedWorkMinutes" INTEGER;

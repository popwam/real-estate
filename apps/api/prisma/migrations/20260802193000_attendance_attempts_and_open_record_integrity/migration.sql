-- Rejected self-service evidence is diagnostic data, not attendance.
CREATE TABLE "hr_attendance_attempts" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "action" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "decision" TEXT NOT NULL,
  "failureReasons" JSONB,
  "matchedLocationId" TEXT,
  "distanceMeters" INTEGER,
  "gpsAccuracy" DOUBLE PRECISION,
  "deviceId" TEXT,
  "requestId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "hr_attendance_attempts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "hr_attendance_attempts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "hr_attendance_attempts_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "hr_attendance_attempts_organizationId_employeeId_attemptedAt_idx" ON "hr_attendance_attempts"("organizationId", "employeeId", "attemptedAt");
CREATE INDEX "hr_attendance_attempts_employeeId_requestId_idx" ON "hr_attendance_attempts"("employeeId", "requestId");
CREATE UNIQUE INDEX "hr_attendance_records_one_open_accepted_record_idx"
  ON "hr_attendance_records"("organizationId", "employeeId")
  WHERE "checkInAt" IS NOT NULL AND "checkOutAt" IS NULL
    AND "verificationStatus" NOT IN ('REJECTED', 'FAILED');

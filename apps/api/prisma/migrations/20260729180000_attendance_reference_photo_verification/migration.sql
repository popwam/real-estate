-- Additive attendance evidence and reference-photo workflow. This migration is
-- intentionally not applied by this change.
CREATE TYPE "AttendanceFaceVerificationStatus" AS ENUM (
  'NOT_REQUIRED', 'PENDING', 'MATCHED', 'NOT_MATCHED',
  'MANUAL_REVIEW_REQUIRED', 'APPROVED_MANUALLY', 'REJECTED'
);
CREATE TYPE "AttendanceReferencePhotoStatus" AS ENUM (
  'PENDING_REFERENCE_APPROVAL', 'APPROVED_REFERENCE', 'REVOKED', 'REJECTED'
);

ALTER TABLE "organization_attendance_settings"
  ADD COLUMN "maxGpsAccuracyMeters" INTEGER,
  ADD COLUMN "firstAttendancePhotoRequiresApproval" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "requireFaceVerification" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "organization_attendance_settings"
  ADD CONSTRAINT "organization_attendance_settings_maxGpsAccuracyMeters_check"
  CHECK ("maxGpsAccuracyMeters" IS NULL OR "maxGpsAccuracyMeters" > 0);

ALTER TABLE "hr_attendance_records"
  ADD COLUMN "checkInLocationAccuracyMeters" DOUBLE PRECISION,
  ADD COLUMN "checkInLocationCapturedAt" TIMESTAMP(3),
  ADD COLUMN "checkOutLocationAccuracyMeters" DOUBLE PRECISION,
  ADD COLUMN "checkOutLocationCapturedAt" TIMESTAMP(3),
  ADD COLUMN "referenceImageId" TEXT,
  ADD COLUMN "capturedImageId" TEXT,
  ADD COLUMN "faceVerificationProvider" TEXT,
  ADD COLUMN "faceVerificationConfidence" DOUBLE PRECISION,
  ADD COLUMN "faceVerificationStatus" "AttendanceFaceVerificationStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
  ADD COLUMN "faceVerificationReviewedById" TEXT,
  ADD COLUMN "faceVerificationReviewedAt" TIMESTAMP(3),
  ADD COLUMN "faceVerificationRejectionReason" TEXT;

ALTER TABLE "hr_employees"
  ADD CONSTRAINT "hr_employees_id_organizationId_key" UNIQUE ("id", "organizationId");

ALTER TABLE "hr_attendance_records"
  ADD CONSTRAINT "hr_attendance_records_referenceImageId_fkey"
    FOREIGN KEY ("referenceImageId") REFERENCES "uploaded_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "hr_attendance_records_capturedImageId_fkey"
    FOREIGN KEY ("capturedImageId") REFERENCES "uploaded_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "hr_attendance_records_faceVerificationReviewedById_fkey"
    FOREIGN KEY ("faceVerificationReviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "employee_attendance_reference_photos" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "fileId" TEXT NOT NULL,
  "status" "AttendanceReferencePhotoStatus" NOT NULL DEFAULT 'PENDING_REFERENCE_APPROVAL',
  "sourceAttendanceId" TEXT,
  "approvedById" TEXT,
  "approvedAt" TIMESTAMP(3),
  "revokedById" TEXT,
  "revokedAt" TIMESTAMP(3),
  "rejectionReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "employee_attendance_reference_photos_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "employee_attendance_reference_photos_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "employee_attendance_reference_photos_employee_organization_fkey" FOREIGN KEY ("employeeId", "organizationId") REFERENCES "hr_employees"("id", "organizationId") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "employee_attendance_reference_photos_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "uploaded_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "employee_attendance_reference_photos_sourceAttendanceId_fkey" FOREIGN KEY ("sourceAttendanceId") REFERENCES "hr_attendance_records"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "employee_attendance_reference_photos_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "employee_attendance_reference_photos_revokedById_fkey" FOREIGN KEY ("revokedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "employee_attendance_reference_photos_employeeId_status_idx" ON "employee_attendance_reference_photos"("employeeId", "status");
CREATE INDEX "employee_attendance_reference_photos_organizationId_status_idx" ON "employee_attendance_reference_photos"("organizationId", "status");
CREATE UNIQUE INDEX "employee_attendance_reference_photos_one_approved_per_employee_idx"
  ON "employee_attendance_reference_photos" ("employeeId")
  WHERE "status" = 'APPROVED_REFERENCE';

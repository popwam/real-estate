CREATE TYPE "AttendanceVerificationStatus" AS ENUM ('VERIFIED', 'PENDING_REVIEW', 'REJECTED', 'FAILED');
CREATE TYPE "DvrVerificationStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'MATCHED', 'NOT_MATCHED', 'MANUAL_REVIEW', 'UNAVAILABLE');
CREATE TYPE "AttendanceSource" AS ENUM ('SELF_SERVICE', 'MANUAL_ADMIN');

ALTER TABLE "hr_attendance_records"
  ADD COLUMN "checkInLatitude" DOUBLE PRECISION,
  ADD COLUMN "checkInLongitude" DOUBLE PRECISION,
  ADD COLUMN "checkOutLatitude" DOUBLE PRECISION,
  ADD COLUMN "checkOutLongitude" DOUBLE PRECISION,
  ADD COLUMN "checkInWifiSsid" TEXT,
  ADD COLUMN "checkInWifiBssid" TEXT,
  ADD COLUMN "checkOutWifiSsid" TEXT,
  ADD COLUMN "checkOutWifiBssid" TEXT,
  ADD COLUMN "checkInPhotoFileId" TEXT,
  ADD COLUMN "checkOutPhotoFileId" TEXT,
  ADD COLUMN "checkInDeviceId" TEXT,
  ADD COLUMN "checkOutDeviceId" TEXT,
  ADD COLUMN "developerOptionsEnabled" BOOLEAN,
  ADD COLUMN "usbDebuggingEnabled" BOOLEAN,
  ADD COLUMN "verificationStatus" "AttendanceVerificationStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
  ADD COLUMN "verificationFailureReasons" JSONB,
  ADD COLUMN "dvrVerificationStatus" "DvrVerificationStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
  ADD COLUMN "dvrReferenceId" TEXT,
  ADD COLUMN "attendanceSource" "AttendanceSource" NOT NULL DEFAULT 'MANUAL_ADMIN';

CREATE INDEX "hr_attendance_records_organizationId_verificationStatus_idx"
  ON "hr_attendance_records"("organizationId", "verificationStatus");

CREATE TABLE "organization_attendance_settings" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "requireLocation" BOOLEAN NOT NULL DEFAULT false,
  "allowedLatitude" DOUBLE PRECISION,
  "allowedLongitude" DOUBLE PRECISION,
  "allowedRadiusMeters" INTEGER,
  "requireWifi" BOOLEAN NOT NULL DEFAULT false,
  "allowedWifiSsids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "allowedWifiBssids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "blockDeveloperOptions" BOOLEAN NOT NULL DEFAULT true,
  "blockUsbDebugging" BOOLEAN NOT NULL DEFAULT true,
  "requirePhoto" BOOLEAN NOT NULL DEFAULT false,
  "requireDvrReview" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "organization_attendance_settings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "organization_attendance_settings_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "organization_attendance_settings_organizationId_key"
  ON "organization_attendance_settings"("organizationId");

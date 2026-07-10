CREATE TYPE "AttendancePenaltyType" AS ENUM ('NONE', 'WARNING', 'DEDUCT_MINUTES', 'DEDUCT_AMOUNT', 'MARK_LATE', 'HALF_DAY', 'ABSENT', 'MANUAL_REVIEW');
CREATE TYPE "AttendanceLateLevel" AS ENUM ('ON_TIME', 'GRACE', 'FIRST_SLICE', 'SECOND_SLICE', 'BEYOND_SECOND');
CREATE TYPE "WebWifiPolicy" AS ENUM ('BLOCK', 'MANUAL_REVIEW', 'IGNORE_FOR_WEB');

ALTER TABLE "users"
ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "organization_domain_verifications"
ADD COLUMN "isDefault" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "organization_domain_verifications_default_unique"
ON "organization_domain_verifications" ("organizationId")
WHERE "isDefault" = true;

CREATE TABLE "organization_branches" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT,
  "address" TEXT,
  "city" TEXT,
  "country" TEXT,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "exactRadiusMeters" INTEGER NOT NULL DEFAULT 30,
  "expandedRadiusMeters" INTEGER NOT NULL DEFAULT 1000,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "organization_branches_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "organization_branches_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "organization_branches_organizationId_code_key"
ON "organization_branches" ("organizationId", "code");
CREATE INDEX "organization_branches_organizationId_isActive_idx"
ON "organization_branches" ("organizationId", "isActive");

ALTER TABLE "hr_attendance_records"
ADD COLUMN "branchId" TEXT,
ADD COLUMN "minutesLate" INTEGER,
ADD COLUMN "lateLevel" "AttendanceLateLevel",
ADD COLUMN "penaltyType" "AttendancePenaltyType",
ADD COLUMN "penaltyValue" TEXT,
ADD COLUMN "requiresReview" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "hr_attendance_records_branchId_idx"
ON "hr_attendance_records" ("branchId");

ALTER TABLE "hr_attendance_records"
ADD CONSTRAINT "hr_attendance_records_branchId_fkey"
FOREIGN KEY ("branchId") REFERENCES "organization_branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "organization_attendance_settings"
ADD COLUMN "exactRadiusMeters" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN "expandedRadiusMeters" INTEGER NOT NULL DEFAULT 1000,
ADD COLUMN "gracePeriodMinutes" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN "firstLateSliceMinutes" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN "firstLatePenaltyType" "AttendancePenaltyType" NOT NULL DEFAULT 'MARK_LATE',
ADD COLUMN "firstLatePenaltyValue" TEXT,
ADD COLUMN "secondLateSliceMinutes" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN "secondLatePenaltyType" "AttendancePenaltyType" NOT NULL DEFAULT 'MANUAL_REVIEW',
ADD COLUMN "secondLatePenaltyValue" TEXT,
ADD COLUMN "beyondSecondSlicePenaltyType" "AttendancePenaltyType" NOT NULL DEFAULT 'MANUAL_REVIEW',
ADD COLUMN "allowWebCheckIn" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "allowMobileCheckIn" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "allowExpandedRadiusWithReview" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "webWifiPolicy" "WebWifiPolicy" NOT NULL DEFAULT 'MANUAL_REVIEW',
ADD COLUMN "workStartTime" TEXT NOT NULL DEFAULT '09:00',
ADD COLUMN "workEndTime" TEXT NOT NULL DEFAULT '17:00';

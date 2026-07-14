-- Bring the two platform provisioning models that already exist in the Prisma
-- contract under migration management. Both operations are additive.
CREATE TABLE "platform_plans" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "localizedName" JSONB,
  "description" TEXT,
  "priceAmount" DECIMAL(12,2),
  "priceCurrency" TEXT NOT NULL DEFAULT 'USD',
  "billingCycle" "OrganizationBillingCycle" NOT NULL DEFAULT 'MONTHLY',
  "trialDays" INTEGER NOT NULL DEFAULT 0,
  "limits" JSONB NOT NULL DEFAULT '{}',
  "enabledModules" JSONB NOT NULL DEFAULT '{}',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isArchived" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "platform_plans_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "platform_plans_code_key" ON "platform_plans"("code");
CREATE INDEX "platform_plans_isActive_isArchived_idx" ON "platform_plans"("isActive", "isArchived");

CREATE TABLE "required_document_policies" (
  "id" TEXT NOT NULL,
  "countryCode" TEXT NOT NULL,
  "organizationType" "OrganizationType" NOT NULL,
  "legalForm" "OrganizationLegalForm",
  "documentType" "OrganizationDocumentType" NOT NULL,
  "isRequired" BOOLEAN NOT NULL DEFAULT true,
  "requiresExpiryDate" BOOLEAN NOT NULL DEFAULT false,
  "ownerDocumentRequired" BOOLEAN NOT NULL DEFAULT false,
  "appliesToOwnerRoles" JSONB NOT NULL DEFAULT '[]',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "required_document_policies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "required_document_policies_countryCode_organizationType_legalForm_documentType_key"
  ON "required_document_policies"("countryCode", "organizationType", "legalForm", "documentType");
CREATE INDEX "required_document_policies_countryCode_organizationType_isActive_idx"
  ON "required_document_policies"("countryCode", "organizationType", "isActive");

ALTER TYPE "HrApplicantStatus" ADD VALUE IF NOT EXISTS 'DOCUMENTS_UNDER_REVIEW';
ALTER TYPE "HrApplicantStatus" ADD VALUE IF NOT EXISTS 'READY_FOR_INTERVIEW';
ALTER TYPE "HrApplicantStatus" ADD VALUE IF NOT EXISTS 'INTERVIEWED';
ALTER TYPE "HrApplicantStatus" ADD VALUE IF NOT EXISTS 'HIRED';
ALTER TYPE "HrApplicantStatus" ADD VALUE IF NOT EXISTS 'WITHDRAWN';

-- Prevent concurrent self-service requests from creating more than one open
-- attendance record for the same employee. This migration never rewrites or
-- deletes attendance data; existing duplicates must be reviewed explicitly.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "hr_attendance_records"
    WHERE "checkInAt" IS NOT NULL
      AND "checkOutAt" IS NULL
      AND "verificationStatus" NOT IN ('REJECTED', 'FAILED')
    GROUP BY "organizationId", "employeeId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot add open attendance uniqueness constraint: duplicate open records require manual review';
  END IF;
END $$;

CREATE UNIQUE INDEX "hr_attendance_one_open_per_employee_idx"
  ON "hr_attendance_records" ("organizationId", "employeeId")
  WHERE "checkInAt" IS NOT NULL
    AND "checkOutAt" IS NULL
    AND "verificationStatus" NOT IN ('REJECTED', 'FAILED');

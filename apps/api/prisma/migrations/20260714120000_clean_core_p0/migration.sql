-- Additive P0 clean-core structures. This migration does not delete or rewrite business data.
ALTER TYPE "OrganizationBillingCycle" ADD VALUE IF NOT EXISTS 'DAY';

CREATE TYPE "PlatformPlanType" AS ENUM ('FREE', 'TRIAL', 'PAID', 'CUSTOM');
CREATE TYPE "PlanDurationUnit" AS ENUM ('DAY', 'MONTH', 'YEAR');

ALTER TABLE "organizations"
  ADD COLUMN "archivedAt" TIMESTAMP(3),
  ADD COLUMN "archivedPreviousStatus" "OrganizationStatus",
  ADD COLUMN "companySetupCompletedAt" TIMESTAMP(3),
  ADD COLUMN "enabledLoginMethods" JSONB NOT NULL DEFAULT '["EMAIL_PASSWORD","PHONE_PASSWORD"]';

ALTER TABLE "organization_profiles"
  ADD COLUMN "responsibleSubmitterName" TEXT,
  ADD COLUMN "responsibleSubmitterEmail" TEXT,
  ADD COLUMN "responsibleSubmitterPhone" TEXT;

ALTER TABLE "organization_branches" ADD COLUMN "parentBranchId" TEXT;
CREATE INDEX "organization_branches_organizationId_parentBranchId_idx" ON "organization_branches"("organizationId", "parentBranchId");
ALTER TABLE "organization_branches" ADD CONSTRAINT "organization_branches_parentBranchId_fkey" FOREIGN KEY ("parentBranchId") REFERENCES "organization_branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "platform_plans"
  ADD COLUMN "planType" "PlatformPlanType" NOT NULL DEFAULT 'PAID',
  ADD COLUMN "durationValue" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "durationUnit" "PlanDurationUnit" NOT NULL DEFAULT 'MONTH',
  ADD COLUMN "allowsNoExpiry" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "allowedLoginMethods" JSONB NOT NULL DEFAULT '["EMAIL_PASSWORD","PHONE_PASSWORD"]';

ALTER TABLE "organization_subscriptions"
  ADD COLUMN "endDateOverridden" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "endDateOverrideReason" TEXT;

ALTER TABLE "user_navigation_preferences"
  ADD COLUMN "hasDismissedPlatformWelcome" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "platformWelcomeDismissedAt" TIMESTAMP(3);

CREATE TABLE "platform_navigation_configurations" (
  "id" TEXT NOT NULL,
  "sectionKey" TEXT NOT NULL,
  "localizedTitle" JSONB NOT NULL DEFAULT '{}',
  "sortOrder" INTEGER NOT NULL,
  "isVisible" BOOLEAN NOT NULL DEFAULT true,
  "allowedItemKeys" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "platform_navigation_configurations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "platform_navigation_configurations_sectionKey_key"
  ON "platform_navigation_configurations"("sectionKey");
CREATE INDEX "platform_navigation_configurations_isVisible_sortOrder_idx"
  ON "platform_navigation_configurations"("isVisible", "sortOrder");

CREATE TABLE "platform_metadata_records" (
  "id" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "localizedName" JSONB NOT NULL DEFAULT '{}',
  "configuration" JSONB NOT NULL DEFAULT '{}',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "platform_metadata_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "platform_metadata_records_category_code_key"
  ON "platform_metadata_records"("category", "code");
CREATE INDEX "platform_metadata_records_category_isActive_sortOrder_idx"
  ON "platform_metadata_records"("category", "isActive", "sortOrder");

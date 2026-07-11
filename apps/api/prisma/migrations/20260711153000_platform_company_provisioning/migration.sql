-- Platform company provisioning, subscriptions, limits, attendance locations, Wi-Fi rules, and domain routing metadata.

CREATE TYPE "OrganizationSubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'EXPIRED', 'CANCELLED', 'SUSPENDED');
CREATE TYPE "OrganizationBillingCycle" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM');
CREATE TYPE "OrganizationBranchType" AS ENUM ('HEAD_OFFICE', 'BRANCH', 'SALES_OFFICE', 'SITE', 'REMOTE_HUB');
CREATE TYPE "OrganizationRedirectMode" AS ENUM ('NONE', 'REDIRECT_TO_EXTERNAL', 'PROXY_OR_SHOW_COMPANY_PROFILE');
CREATE TYPE "OrganizationInboundSourceMode" AS ENUM ('NONE', 'TRACK_REFERRER', 'ACCEPT_LEADS', 'WEBHOOK');
CREATE TYPE "OrganizationWifiRuleAppliesTo" AS ENUM ('WEB', 'MOBILE', 'BOTH');

ALTER TYPE "OrganizationDomainType" ADD VALUE IF NOT EXISTS 'SYSTEM_SUBDOMAIN';
ALTER TYPE "OrganizationDomainType" ADD VALUE IF NOT EXISTS 'PATH_ALIAS';
ALTER TYPE "DomainVerificationStatus" ADD VALUE IF NOT EXISTS 'ACTIVE';
ALTER TYPE "DomainVerificationStatus" ADD VALUE IF NOT EXISTS 'DISABLED';

ALTER TABLE "organizations"
  ADD COLUMN "companyCode" TEXT,
  ADD COLUMN "timezone" TEXT,
  ADD COLUMN "currency" TEXT,
  ADD COLUMN "defaultLanguage" TEXT;

CREATE UNIQUE INDEX "organizations_companyCode_key" ON "organizations"("companyCode");

ALTER TABLE "organization_profiles"
  ADD COLUMN "registrationNumber" TEXT;

ALTER TABLE "organization_domain_verifications"
  ADD COLUMN "redirectMode" "OrganizationRedirectMode" NOT NULL DEFAULT 'NONE',
  ADD COLUMN "redirectUrl" TEXT,
  ADD COLUMN "inboundSourceMode" "OrganizationInboundSourceMode" NOT NULL DEFAULT 'NONE';

CREATE TABLE "organization_subscriptions" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "planCode" TEXT NOT NULL,
  "planName" TEXT NOT NULL,
  "status" "OrganizationSubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "trialEndsAt" TIMESTAMP(3),
  "billingCycle" "OrganizationBillingCycle" NOT NULL DEFAULT 'MONTHLY',
  "autoRenew" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "organization_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "organization_subscriptions_organizationId_key" ON "organization_subscriptions"("organizationId");
CREATE INDEX "organization_subscriptions_status_endsAt_idx" ON "organization_subscriptions"("status", "endsAt");
ALTER TABLE "organization_subscriptions" ADD CONSTRAINT "organization_subscriptions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "organization_limits" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "maxEmployees" INTEGER NOT NULL DEFAULT 25,
  "maxOffices" INTEGER NOT NULL DEFAULT 1,
  "maxBranches" INTEGER NOT NULL DEFAULT 1,
  "maxWorkGroups" INTEGER NOT NULL DEFAULT 5,
  "maxTeams" INTEGER NOT NULL DEFAULT 10,
  "maxStorageMb" INTEGER NOT NULL DEFAULT 1024,
  "maxMonthlyCheckIns" INTEGER NOT NULL DEFAULT 1000,
  "enabledModules" JSONB NOT NULL DEFAULT '{}',
  "allowWebCheckIn" BOOLEAN NOT NULL DEFAULT true,
  "allowMobileCheckIn" BOOLEAN NOT NULL DEFAULT true,
  "allowPublicWebsite" BOOLEAN NOT NULL DEFAULT true,
  "allowCustomDomain" BOOLEAN NOT NULL DEFAULT false,
  "allowSubdomain" BOOLEAN NOT NULL DEFAULT true,
  "allowDvrReview" BOOLEAN NOT NULL DEFAULT false,
  "allowFaceVerification" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "organization_limits_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "organization_limits_organizationId_key" ON "organization_limits"("organizationId");
ALTER TABLE "organization_limits" ADD CONSTRAINT "organization_limits_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "organization_branches"
  ADD COLUMN "type" "OrganizationBranchType" NOT NULL DEFAULT 'BRANCH',
  ADD COLUMN "timezone" TEXT,
  ADD COLUMN "isDefault" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "organization_attendance_locations" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "officeId" TEXT,
  "name" TEXT NOT NULL,
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "exactRadiusMeters" INTEGER NOT NULL DEFAULT 30,
  "expandedRadiusMeters" INTEGER NOT NULL DEFAULT 1000,
  "allowedForWeb" BOOLEAN NOT NULL DEFAULT true,
  "allowedForMobile" BOOLEAN NOT NULL DEFAULT true,
  "requiresReviewOutsideExactRadius" BOOLEAN NOT NULL DEFAULT true,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "organization_attendance_locations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "organization_attendance_locations_organizationId_isActive_idx" ON "organization_attendance_locations"("organizationId", "isActive");
CREATE INDEX "organization_attendance_locations_officeId_idx" ON "organization_attendance_locations"("officeId");
ALTER TABLE "organization_attendance_locations" ADD CONSTRAINT "organization_attendance_locations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_attendance_locations" ADD CONSTRAINT "organization_attendance_locations_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "organization_branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "organization_wifi_rules" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "officeId" TEXT,
  "name" TEXT NOT NULL,
  "ssid" TEXT,
  "bssid" TEXT,
  "macAddress" TEXT,
  "description" TEXT,
  "appliesTo" "OrganizationWifiRuleAppliesTo" NOT NULL DEFAULT 'BOTH',
  "isRequired" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "organization_wifi_rules_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "organization_wifi_rules_organizationId_isActive_idx" ON "organization_wifi_rules"("organizationId", "isActive");
CREATE INDEX "organization_wifi_rules_officeId_idx" ON "organization_wifi_rules"("officeId");
ALTER TABLE "organization_wifi_rules" ADD CONSTRAINT "organization_wifi_rules_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_wifi_rules" ADD CONSTRAINT "organization_wifi_rules_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "organization_branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

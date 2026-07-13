-- Reset safety, sidebar/quick-action preferences, and resident QR access foundation.

DO $$ BEGIN
  CREATE TYPE "CustomerProfileStatus" AS ENUM ('LEAD', 'BUYER', 'OWNER', 'TENANT', 'RESIDENT', 'GUEST', 'BLOCKED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "RealEstateProjectStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "RealEstateUnitType" AS ENUM ('APARTMENT', 'VILLA', 'OFFICE', 'RETAIL', 'CHALET', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "RealEstateUnitStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD', 'RENTED', 'OCCUPIED', 'UNDER_MAINTENANCE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "UnitCustomerRelationType" AS ENUM ('BUYER', 'OWNER', 'TENANT', 'RESIDENT', 'FAMILY_MEMBER', 'GUEST', 'MAINTENANCE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "UnitQrPassType" AS ENUM ('UNIT', 'RESIDENT', 'VISITOR', 'MAINTENANCE', 'DELIVERY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "UnitQrPassStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED', 'SUSPENDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "AccessIntegrationType" AS ENUM ('QR_ONLY', 'GATE_VENDOR_API', 'SMART_LOCK', 'NFC');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "AccessIntegrationStatus" AS ENUM ('NOT_CONFIGURED', 'CONFIGURED', 'DISABLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "customer_profiles" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT,
  "fullName" TEXT NOT NULL,
  "localizedName" JSONB,
  "phone" TEXT NOT NULL,
  "email" TEXT,
  "nationalId" TEXT,
  "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
  "status" "CustomerProfileStatus" NOT NULL DEFAULT 'LEAD',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "customer_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "real_estate_projects" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "localizedName" JSONB,
  "code" TEXT NOT NULL,
  "address" TEXT,
  "status" "RealEstateProjectStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "real_estate_projects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "buildings" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "floorsCount" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "buildings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "floors" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "buildingId" TEXT NOT NULL,
  "number" INTEGER NOT NULL,
  "label" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "floors_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "units" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "buildingId" TEXT NOT NULL,
  "floorId" TEXT,
  "unitNumber" TEXT NOT NULL,
  "unitCode" TEXT NOT NULL,
  "unitType" "RealEstateUnitType" NOT NULL,
  "status" "RealEstateUnitStatus" NOT NULL DEFAULT 'AVAILABLE',
  "area" DECIMAL(12,2),
  "bedrooms" INTEGER,
  "bathrooms" INTEGER,
  "qrPassEnabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "unit_customer_assignments" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "unitId" TEXT NOT NULL,
  "customerProfileId" TEXT NOT NULL,
  "userId" TEXT,
  "relationType" "UnitCustomerRelationType" NOT NULL,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "permissions" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "unit_customer_assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "unit_qr_passes" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "unitId" TEXT NOT NULL,
  "customerProfileId" TEXT,
  "userId" TEXT,
  "passType" "UnitQrPassType" NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "displayCode" TEXT,
  "status" "UnitQrPassStatus" NOT NULL DEFAULT 'ACTIVE',
  "startsAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "maxUses" INTEGER,
  "useCount" INTEGER NOT NULL DEFAULT 0,
  "lastUsedAt" TIMESTAMP(3),
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "unit_qr_passes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "access_integrations" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'QR',
  "type" "AccessIntegrationType" NOT NULL DEFAULT 'QR_ONLY',
  "status" "AccessIntegrationStatus" NOT NULL DEFAULT 'NOT_CONFIGURED',
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "access_integrations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_navigation_preferences" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "layout" JSONB NOT NULL DEFAULT '{}',
  "hiddenItems" JSONB NOT NULL DEFAULT '[]',
  "pinnedItems" JSONB NOT NULL DEFAULT '[]',
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_navigation_preferences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_quick_action_preferences" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "widgetKey" TEXT NOT NULL,
  "position" JSONB NOT NULL DEFAULT '{}',
  "isCollapsed" BOOLEAN NOT NULL DEFAULT true,
  "selectedActions" JSONB NOT NULL DEFAULT '[]',
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_quick_action_preferences_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "customer_profiles_organizationId_status_idx" ON "customer_profiles"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "customer_profiles_organizationId_phone_idx" ON "customer_profiles"("organizationId", "phone");
CREATE INDEX IF NOT EXISTS "customer_profiles_userId_idx" ON "customer_profiles"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "real_estate_projects_organizationId_code_key" ON "real_estate_projects"("organizationId", "code");
CREATE INDEX IF NOT EXISTS "real_estate_projects_organizationId_status_idx" ON "real_estate_projects"("organizationId", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "buildings_organizationId_code_key" ON "buildings"("organizationId", "code");
CREATE INDEX IF NOT EXISTS "buildings_organizationId_projectId_idx" ON "buildings"("organizationId", "projectId");
CREATE UNIQUE INDEX IF NOT EXISTS "floors_buildingId_number_key" ON "floors"("buildingId", "number");
CREATE INDEX IF NOT EXISTS "floors_organizationId_buildingId_idx" ON "floors"("organizationId", "buildingId");
CREATE UNIQUE INDEX IF NOT EXISTS "units_organizationId_unitCode_key" ON "units"("organizationId", "unitCode");
CREATE UNIQUE INDEX IF NOT EXISTS "units_buildingId_unitNumber_key" ON "units"("buildingId", "unitNumber");
CREATE INDEX IF NOT EXISTS "units_organizationId_status_idx" ON "units"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "units_projectId_buildingId_idx" ON "units"("projectId", "buildingId");
CREATE INDEX IF NOT EXISTS "unit_customer_assignments_organizationId_isActive_idx" ON "unit_customer_assignments"("organizationId", "isActive");
CREATE INDEX IF NOT EXISTS "unit_customer_assignments_unitId_isActive_idx" ON "unit_customer_assignments"("unitId", "isActive");
CREATE INDEX IF NOT EXISTS "unit_customer_assignments_customerProfileId_isActive_idx" ON "unit_customer_assignments"("customerProfileId", "isActive");
CREATE INDEX IF NOT EXISTS "unit_customer_assignments_userId_isActive_idx" ON "unit_customer_assignments"("userId", "isActive");
CREATE UNIQUE INDEX IF NOT EXISTS "unit_qr_passes_tokenHash_key" ON "unit_qr_passes"("tokenHash");
CREATE INDEX IF NOT EXISTS "unit_qr_passes_organizationId_status_idx" ON "unit_qr_passes"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "unit_qr_passes_unitId_status_idx" ON "unit_qr_passes"("unitId", "status");
CREATE INDEX IF NOT EXISTS "unit_qr_passes_customerProfileId_status_idx" ON "unit_qr_passes"("customerProfileId", "status");
CREATE INDEX IF NOT EXISTS "unit_qr_passes_userId_status_idx" ON "unit_qr_passes"("userId", "status");
CREATE INDEX IF NOT EXISTS "access_integrations_organizationId_type_status_idx" ON "access_integrations"("organizationId", "type", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "user_navigation_preferences_userId_key" ON "user_navigation_preferences"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "user_quick_action_preferences_userId_widgetKey_key" ON "user_quick_action_preferences"("userId", "widgetKey");

ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "real_estate_projects" ADD CONSTRAINT "real_estate_projects_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "buildings" ADD CONSTRAINT "buildings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "buildings" ADD CONSTRAINT "buildings_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "real_estate_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "floors" ADD CONSTRAINT "floors_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "floors" ADD CONSTRAINT "floors_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "units" ADD CONSTRAINT "units_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "units" ADD CONSTRAINT "units_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "real_estate_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "units" ADD CONSTRAINT "units_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "units" ADD CONSTRAINT "units_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "floors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "unit_customer_assignments" ADD CONSTRAINT "unit_customer_assignments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "unit_customer_assignments" ADD CONSTRAINT "unit_customer_assignments_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "unit_customer_assignments" ADD CONSTRAINT "unit_customer_assignments_customerProfileId_fkey" FOREIGN KEY ("customerProfileId") REFERENCES "customer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "unit_customer_assignments" ADD CONSTRAINT "unit_customer_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "unit_qr_passes" ADD CONSTRAINT "unit_qr_passes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "unit_qr_passes" ADD CONSTRAINT "unit_qr_passes_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "unit_qr_passes" ADD CONSTRAINT "unit_qr_passes_customerProfileId_fkey" FOREIGN KEY ("customerProfileId") REFERENCES "customer_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "unit_qr_passes" ADD CONSTRAINT "unit_qr_passes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "access_integrations" ADD CONSTRAINT "access_integrations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_navigation_preferences" ADD CONSTRAINT "user_navigation_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_quick_action_preferences" ADD CONSTRAINT "user_quick_action_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

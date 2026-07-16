-- Add the company access-level table referenced by the Prisma schema.
-- This migration is additive and does not rewrite or delete existing data.
CREATE TABLE IF NOT EXISTS "company_role_templates" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "localizedName" JSONB,
  "description" TEXT,
  "permissions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "isSystem" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "company_role_templates_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "company_role_templates_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "company_role_templates_organizationId_code_key"
  ON "company_role_templates"("organizationId", "code");

CREATE INDEX IF NOT EXISTS "company_role_templates_organizationId_isActive_sortOrder_idx"
  ON "company_role_templates"("organizationId", "isActive", "sortOrder");

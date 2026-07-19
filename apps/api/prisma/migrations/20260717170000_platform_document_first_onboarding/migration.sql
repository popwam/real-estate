-- Additive platform metadata and document-first onboarding foundation.
CREATE TYPE "ExchangeRateSourceType" AS ENUM ('MANUAL', 'API');
CREATE TYPE "OrganizationOnboardingStatus" AS ENUM ('DRAFT', 'DOCUMENTS_REQUIRED', 'EXTRACTION_PENDING', 'REVIEW_REQUIRED', 'READY_TO_CREATE', 'COMPLETED', 'CANCELLED', 'EXPIRED');
CREATE TYPE "OnboardingDocumentQualityStatus" AS ENUM ('ACCEPTED', 'LOW_RESOLUTION', 'BLUR_SUSPECTED', 'CROPPED_SUSPECTED', 'DARK_IMAGE', 'CORRUPTED', 'PASSWORD_PROTECTED', 'UNSUPPORTED');
CREATE TYPE "FieldEvidenceReviewStatus" AS ENUM ('EXTRACTED', 'AUTO_ACCEPTED', 'REVIEW_REQUIRED', 'CONFIRMED', 'CORRECTED', 'REJECTED', 'CONFLICT');

ALTER TABLE "platform_metadata_records"
  ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "units" ADD COLUMN "archivedAt" TIMESTAMP(3);
CREATE INDEX "units_organizationId_archivedAt_status_idx" ON "units"("organizationId", "archivedAt", "status");

CREATE TABLE "supported_organization_types" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "legacyOrganizationType" "OrganizationType",
  "names" JSONB NOT NULL DEFAULT '{}',
  "descriptions" JSONB NOT NULL DEFAULT '{}',
  "iconObjectKey" TEXT,
  "allowedCountryCodes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "allowedLegalForms" "OrganizationLegalForm"[] NOT NULL DEFAULT ARRAY[]::"OrganizationLegalForm"[],
  "requiredFieldCodes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "isIndividual" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isArchived" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "supported_organization_types_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "supported_organization_types_code_key" ON "supported_organization_types"("code");
CREATE INDEX "supported_organization_types_isActive_isArchived_sortOrder_idx" ON "supported_organization_types"("isActive", "isArchived", "sortOrder");
CREATE INDEX "supported_organization_types_legacyOrganizationType_idx" ON "supported_organization_types"("legacyOrganizationType");

INSERT INTO "supported_organization_types" ("id", "code", "legacyOrganizationType", "names", "descriptions", "isIndividual", "sortOrder", "updatedAt") VALUES
  ('supported_developer', 'DEVELOPER', 'DEVELOPER', '{"en":"Real estate developer","ar":"مطور عقاري","fr":"Promoteur immobilier"}', '{}', false, 10, CURRENT_TIMESTAMP),
  ('supported_brokerage', 'BROKERAGE', 'BROKERAGE', '{"en":"Real estate brokerage","ar":"شركة وساطة عقارية","fr":"Agence immobilière"}', '{}', false, 20, CURRENT_TIMESTAMP),
  ('supported_individual_broker', 'INDIVIDUAL_BROKER', 'INDIVIDUAL_BROKER', '{"en":"Individual broker","ar":"وسيط فردي","fr":"Courtier individuel"}', '{}', true, 30, CURRENT_TIMESTAMP),
  ('supported_platform', 'PLATFORM', 'PLATFORM', '{"en":"Platform","ar":"المنصة","fr":"Plateforme"}', '{}', false, 1000, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

ALTER TABLE "organizations" ADD COLUMN "supportedOrganizationTypeId" TEXT;
UPDATE "organizations" o
SET "supportedOrganizationTypeId" = s."id"
FROM "supported_organization_types" s
WHERE s."legacyOrganizationType" = o."type" AND o."supportedOrganizationTypeId" IS NULL;
CREATE INDEX "organizations_supportedOrganizationTypeId_idx" ON "organizations"("supportedOrganizationTypeId");
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_supportedOrganizationTypeId_fkey" FOREIGN KEY ("supportedOrganizationTypeId") REFERENCES "supported_organization_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "required_document_policies"
  ALTER COLUMN "organizationType" DROP NOT NULL,
  ADD COLUMN "supportedOrganizationTypeId" TEXT,
  ADD COLUMN "requiredFieldCodes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "acceptedMimeTypes" TEXT[] NOT NULL DEFAULT ARRAY['application/pdf','image/jpeg','image/png','image/webp']::TEXT[],
  ADD COLUMN "maxFileSizeMb" INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN "minimumConfidence" DECIMAL(5,4),
  ADD COLUMN "blocksActivation" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT false;
UPDATE "required_document_policies" p
SET "supportedOrganizationTypeId" = s."id"
FROM "supported_organization_types" s
WHERE s."legacyOrganizationType" = p."organizationType" AND p."supportedOrganizationTypeId" IS NULL;
-- The legacy uniqueness rule cannot distinguish dynamic organization types that
-- share the same enum value. Removing it does not remove or alter policy data.
DROP INDEX IF EXISTS "required_document_policies_countryCode_organizationType_legalForm_documentType_key";
CREATE UNIQUE INDEX "required_document_policies_unarchived_dynamic_type_no_legal_form_key"
  ON "required_document_policies"("countryCode", "supportedOrganizationTypeId", "documentType")
  WHERE "isArchived" = false
    AND "legalForm" IS NULL
    AND "supportedOrganizationTypeId" IS NOT NULL;
CREATE UNIQUE INDEX "required_document_policies_unarchived_dynamic_type_legal_form_key"
  ON "required_document_policies"("countryCode", "supportedOrganizationTypeId", "legalForm", "documentType")
  WHERE "isArchived" = false
    AND "legalForm" IS NOT NULL
    AND "supportedOrganizationTypeId" IS NOT NULL;
CREATE INDEX "required_document_policies_supportedOrganizationTypeId_countryCode_isActive_isArchived_sortOrder_idx" ON "required_document_policies"("supportedOrganizationTypeId", "countryCode", "isActive", "isArchived", "sortOrder");
ALTER TABLE "required_document_policies" ADD CONSTRAINT "required_document_policies_supportedOrganizationTypeId_fkey" FOREIGN KEY ("supportedOrganizationTypeId") REFERENCES "supported_organization_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "exchange_rates" (
  "id" TEXT NOT NULL,
  "baseCurrencyCode" TEXT NOT NULL,
  "quoteCurrencyCode" TEXT NOT NULL,
  "rate" DECIMAL(24,10) NOT NULL,
  "provider" TEXT,
  "sourceType" "ExchangeRateSourceType" NOT NULL DEFAULT 'MANUAL',
  "fetchedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "exchange_rates_baseCurrencyCode_quoteCurrencyCode_sourceType_key" ON "exchange_rates"("baseCurrencyCode", "quoteCurrencyCode", "sourceType");
CREATE INDEX "exchange_rates_baseCurrencyCode_quoteCurrencyCode_isActive_idx" ON "exchange_rates"("baseCurrencyCode", "quoteCurrencyCode", "isActive");

CREATE TABLE "organization_onboarding_sessions" (
  "id" TEXT NOT NULL,
  "status" "OrganizationOnboardingStatus" NOT NULL DEFAULT 'DRAFT',
  "countryCode" TEXT NOT NULL,
  "supportedOrganizationTypeId" TEXT NOT NULL,
  "legalForm" "OrganizationLegalForm",
  "operationalData" JSONB NOT NULL DEFAULT '{}',
  "completedFields" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "missingFields" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "conflictFields" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdById" TEXT NOT NULL,
  "organizationId" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "organization_onboarding_sessions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "organization_onboarding_sessions_organizationId_key" ON "organization_onboarding_sessions"("organizationId");
CREATE INDEX "organization_onboarding_sessions_status_expiresAt_idx" ON "organization_onboarding_sessions"("status", "expiresAt");
CREATE INDEX "organization_onboarding_sessions_countryCode_supportedOrganizationTypeId_status_idx" ON "organization_onboarding_sessions"("countryCode", "supportedOrganizationTypeId", "status");
ALTER TABLE "organization_onboarding_sessions" ADD CONSTRAINT "organization_onboarding_sessions_supportedOrganizationTypeId_fkey" FOREIGN KEY ("supportedOrganizationTypeId") REFERENCES "supported_organization_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "organization_onboarding_sessions" ADD CONSTRAINT "organization_onboarding_sessions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "organization_onboarding_sessions" ADD CONSTRAINT "organization_onboarding_sessions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "organization_onboarding_documents" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "policyId" TEXT,
  "documentType" "OrganizationDocumentType" NOT NULL,
  "fileId" TEXT NOT NULL,
  "qualityStatus" "OnboardingDocumentQualityStatus" NOT NULL DEFAULT 'ACCEPTED',
  "qualityWarnings" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "extractionProvider" TEXT,
  "extractionModel" TEXT,
  "extractionStatus" "OrganizationDocumentExtractionStatus" NOT NULL DEFAULT 'NOT_REQUESTED',
  "extractionResult" JSONB,
  "providerRequestId" TEXT,
  "extractedAt" TIMESTAMP(3),
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "organization_onboarding_documents_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "organization_onboarding_documents_sessionId_documentType_extractionStatus_idx" ON "organization_onboarding_documents"("sessionId", "documentType", "extractionStatus");
CREATE INDEX "organization_onboarding_documents_policyId_idx" ON "organization_onboarding_documents"("policyId");
ALTER TABLE "organization_onboarding_documents" ADD CONSTRAINT "organization_onboarding_documents_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "organization_onboarding_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_onboarding_documents" ADD CONSTRAINT "organization_onboarding_documents_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "required_document_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "organization_onboarding_documents" ADD CONSTRAINT "organization_onboarding_documents_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "uploaded_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "organization_field_evidence" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "fieldCode" TEXT NOT NULL,
  "rawValue" TEXT,
  "normalizedValue" TEXT,
  "finalValue" TEXT,
  "confidence" DECIMAL(5,4),
  "documentType" "OrganizationDocumentType" NOT NULL,
  "pageNumber" INTEGER,
  "boundingBox" JSONB,
  "extractionProvider" TEXT NOT NULL,
  "model" TEXT,
  "modelVersion" TEXT,
  "manuallyEdited" BOOLEAN NOT NULL DEFAULT false,
  "reviewStatus" "FieldEvidenceReviewStatus" NOT NULL DEFAULT 'EXTRACTED',
  "reviewedByUserId" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "correctionReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "organization_field_evidence_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "organization_field_evidence_sessionId_fieldCode_reviewStatus_idx" ON "organization_field_evidence"("sessionId", "fieldCode", "reviewStatus");
CREATE INDEX "organization_field_evidence_documentId_fieldCode_idx" ON "organization_field_evidence"("documentId", "fieldCode");
ALTER TABLE "organization_field_evidence" ADD CONSTRAINT "organization_field_evidence_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "organization_onboarding_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_field_evidence" ADD CONSTRAINT "organization_field_evidence_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "organization_onboarding_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_field_evidence" ADD CONSTRAINT "organization_field_evidence_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

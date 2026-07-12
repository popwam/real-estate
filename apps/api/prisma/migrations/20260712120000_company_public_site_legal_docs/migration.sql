-- Company public site, legal profile, owners, documents, and extraction workflow.

CREATE TYPE "OrganizationPublicSiteMode" AS ENUM ('DISABLED', 'PORTAL', 'GALLERY', 'REDIRECT');
CREATE TYPE "OrganizationPublicSiteTheme" AS ENUM ('MINIMAL', 'MODERN', 'REAL_ESTATE', 'CORPORATE', 'GALLERY', 'DARK_PREMIUM');
CREATE TYPE "OrganizationLegalForm" AS ENUM ('SOLE_PROPRIETORSHIP', 'LLC', 'JOINT_STOCK', 'PARTNERSHIP', 'BRANCH', 'OTHER');
CREATE TYPE "OrganizationOwnerType" AS ENUM ('PERSON', 'COMPANY');
CREATE TYPE "OrganizationOwnerIdentifierType" AS ENUM ('NATIONAL_ID', 'PASSPORT', 'RESIDENCE_ID', 'TAX_ID', 'COMMERCIAL_REGISTER', 'OTHER');
CREATE TYPE "OrganizationOwnerRole" AS ENUM ('OWNER', 'PARTNER', 'SHAREHOLDER', 'AUTHORIZED_SIGNATORY', 'LEGAL_REPRESENTATIVE');
CREATE TYPE "OrganizationOwnerVerificationStatus" AS ENUM ('NOT_REVIEWED', 'PENDING', 'APPROVED', 'REJECTED', 'NEEDS_MANUAL_REVIEW');
CREATE TYPE "OrganizationDocumentType" AS ENUM ('COMMERCIAL_REGISTER', 'TAX_CARD', 'VAT_CERTIFICATE', 'NATIONAL_ADDRESS', 'LICENSE', 'OWNER_ID', 'CONTRACT', 'OTHER');
CREATE TYPE "OrganizationDocumentStatus" AS ENUM ('MISSING', 'UPLOADED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED');
CREATE TYPE "OrganizationDocumentExtractionStatus" AS ENUM ('NOT_REQUESTED', 'PENDING', 'COMPLETED', 'FAILED', 'NEEDS_MANUAL_REVIEW');
CREATE TYPE "DocumentExtractionProvider" AS ENUM ('NONE', 'MANUAL', 'OCR_PROVIDER', 'AI_PROVIDER');

ALTER TABLE "organization_profiles"
  ADD COLUMN "displayName" TEXT,
  ADD COLUMN "commercialRegisterNumber" TEXT,
  ADD COLUMN "commercialRegisterOffice" TEXT,
  ADD COLUMN "commercialRegisterIssuedAt" TIMESTAMP(3),
  ADD COLUMN "commercialRegisterExpiresAt" TIMESTAMP(3),
  ADD COLUMN "vatNumber" TEXT,
  ADD COLUMN "taxOffice" TEXT,
  ADD COLUMN "legalForm" "OrganizationLegalForm",
  ADD COLUMN "incorporationDate" TIMESTAMP(3),
  ADD COLUMN "countryCode" TEXT,
  ADD COLUMN "regionCode" TEXT,
  ADD COLUMN "cityCode" TEXT,
  ADD COLUMN "cityName" TEXT,
  ADD COLUMN "addressLine1" TEXT,
  ADD COLUMN "addressLine2" TEXT,
  ADD COLUMN "postalCode" TEXT,
  ADD COLUMN "preferredLanguage" TEXT,
  ADD COLUMN "defaultCurrency" TEXT,
  ADD COLUMN "publicEmail" TEXT,
  ADD COLUMN "publicPhone" TEXT,
  ADD COLUMN "localizedDisplayName" JSONB;

CREATE TABLE "organization_public_site_settings" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "mode" "OrganizationPublicSiteMode" NOT NULL DEFAULT 'PORTAL',
  "theme" "OrganizationPublicSiteTheme" NOT NULL DEFAULT 'REAL_ESTATE',
  "defaultLanguage" TEXT NOT NULL DEFAULT 'en',
  "supportedLanguages" TEXT[] NOT NULL DEFAULT ARRAY['en', 'ar', 'fr']::TEXT[],
  "showLogo" BOOLEAN NOT NULL DEFAULT true,
  "showContactInfo" BOOLEAN NOT NULL DEFAULT true,
  "showOffices" BOOLEAN NOT NULL DEFAULT true,
  "showGallery" BOOLEAN NOT NULL DEFAULT true,
  "showProjects" BOOLEAN NOT NULL DEFAULT true,
  "showLeadForm" BOOLEAN NOT NULL DEFAULT true,
  "redirectUrl" TEXT,
  "seoTitle" JSONB,
  "seoDescription" JSONB,
  "publicHeadline" JSONB,
  "publicDescription" JSONB,
  "galleryImages" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "organization_public_site_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "organization_owners" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "ownerType" "OrganizationOwnerType" NOT NULL DEFAULT 'PERSON',
  "name" TEXT NOT NULL,
  "localizedName" JSONB,
  "nationalityCountryCode" TEXT,
  "identifierType" "OrganizationOwnerIdentifierType",
  "identifierValue" TEXT,
  "identifierCountryCode" TEXT,
  "ownershipPercentage" DECIMAL(5,2),
  "role" "OrganizationOwnerRole" NOT NULL DEFAULT 'OWNER',
  "phone" TEXT,
  "email" TEXT,
  "idFrontFileId" TEXT,
  "idBackFileId" TEXT,
  "passportFileId" TEXT,
  "proofFileId" TEXT,
  "verificationStatus" "OrganizationOwnerVerificationStatus" NOT NULL DEFAULT 'NOT_REVIEWED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "organization_owners_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "organization_documents" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "documentType" "OrganizationDocumentType" NOT NULL,
  "fileId" TEXT,
  "status" "OrganizationDocumentStatus" NOT NULL DEFAULT 'MISSING',
  "expiresAt" TIMESTAMP(3),
  "issuedAt" TIMESTAMP(3),
  "issuingAuthority" TEXT,
  "extractedData" JSONB,
  "extractionProvider" "DocumentExtractionProvider" NOT NULL DEFAULT 'NONE',
  "extractionStatus" "OrganizationDocumentExtractionStatus" NOT NULL DEFAULT 'NOT_REQUESTED',
  "extractionMessage" TEXT,
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "organization_documents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "organization_public_site_settings_organizationId_key" ON "organization_public_site_settings"("organizationId");
CREATE INDEX "organization_public_site_settings_mode_theme_idx" ON "organization_public_site_settings"("mode", "theme");
CREATE INDEX "organization_owners_organizationId_verificationStatus_idx" ON "organization_owners"("organizationId", "verificationStatus");
CREATE INDEX "organization_documents_organizationId_documentType_status_idx" ON "organization_documents"("organizationId", "documentType", "status");
CREATE INDEX "organization_documents_organizationId_extractionStatus_idx" ON "organization_documents"("organizationId", "extractionStatus");

ALTER TABLE "organization_public_site_settings" ADD CONSTRAINT "organization_public_site_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_owners" ADD CONSTRAINT "organization_owners_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_owners" ADD CONSTRAINT "organization_owners_idFrontFileId_fkey" FOREIGN KEY ("idFrontFileId") REFERENCES "uploaded_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "organization_owners" ADD CONSTRAINT "organization_owners_idBackFileId_fkey" FOREIGN KEY ("idBackFileId") REFERENCES "uploaded_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "organization_owners" ADD CONSTRAINT "organization_owners_passportFileId_fkey" FOREIGN KEY ("passportFileId") REFERENCES "uploaded_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "organization_owners" ADD CONSTRAINT "organization_owners_proofFileId_fkey" FOREIGN KEY ("proofFileId") REFERENCES "uploaded_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "organization_documents" ADD CONSTRAINT "organization_documents_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_documents" ADD CONSTRAINT "organization_documents_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "uploaded_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "organization_documents" ADD CONSTRAINT "organization_documents_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "organization_public_site_settings" (
  "id",
  "organizationId",
  "mode",
  "theme",
  "defaultLanguage",
  "supportedLanguages",
  "showLogo",
  "showContactInfo",
  "showOffices",
  "showGallery",
  "showProjects",
  "showLeadForm",
  "publicHeadline",
  "publicDescription",
  "createdAt",
  "updatedAt"
)
SELECT
  'opss_' || md5("id" || CURRENT_TIMESTAMP::TEXT),
  "id",
  CASE WHEN "status" = 'APPROVED' THEN 'PORTAL'::"OrganizationPublicSiteMode" ELSE 'DISABLED'::"OrganizationPublicSiteMode" END,
  'REAL_ESTATE'::"OrganizationPublicSiteTheme",
  COALESCE("defaultLanguage", 'en'),
  ARRAY['en', 'ar', 'fr']::TEXT[],
  true,
  true,
  true,
  true,
  true,
  true,
  jsonb_build_object('en', "name", 'ar', "name", 'fr', "name"),
  NULL,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "organizations"
ON CONFLICT ("organizationId") DO NOTHING;

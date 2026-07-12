-- HR recruitment, applicant intake, private applicant documents, and conversion foundation.

CREATE TYPE "HrJobOpeningStatus" AS ENUM ('DRAFT', 'OPEN', 'PAUSED', 'CLOSED');
CREATE TYPE "HrApplicantSource" AS ENUM ('PUBLIC_SITE', 'INTERNAL_SECRETARY', 'HR_MANUAL', 'REFERRAL', 'IMPORT');
CREATE TYPE "HrApplicantStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'PENDING_REVIEW', 'DOCUMENTS_MISSING', 'AI_REVIEW_NEEDED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'OFFER_PENDING', 'OFFER_ACCEPTED', 'REJECTED', 'CONVERTED_TO_EMPLOYEE');
CREATE TYPE "HrApplicantAiReviewStatus" AS ENUM ('NOT_REQUESTED', 'PENDING', 'COMPLETED', 'FAILED', 'NEEDS_MANUAL_REVIEW');
CREATE TYPE "HrApplicantDocumentType" AS ENUM ('CV', 'GRADUATION_CERTIFICATE', 'NATIONAL_ID_FRONT', 'NATIONAL_ID_BACK', 'PASSPORT', 'MILITARY_CERTIFICATE', 'LAST_SALARY_PROOF', 'EXPERIENCE_CERTIFICATE', 'PORTFOLIO', 'OTHER');
CREATE TYPE "HrApplicantDocumentStatus" AS ENUM ('MISSING', 'UPLOADED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED', 'NEEDS_MANUAL_REVIEW');
CREATE TYPE "HrApplicantInterviewType" AS ENUM ('PHONE', 'ONLINE', 'ONSITE');
CREATE TYPE "HrApplicantInterviewStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
CREATE TYPE "HrApplicantOfferStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED');

CREATE TABLE "hr_job_openings" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "localizedTitle" JSONB,
  "departmentId" TEXT,
  "positionId" TEXT,
  "branchId" TEXT,
  "employmentType" "HrEmploymentType",
  "workMode" "HrWorkScheduleType",
  "description" JSONB,
  "requirements" JSONB,
  "status" "HrJobOpeningStatus" NOT NULL DEFAULT 'DRAFT',
  "publicApplyEnabled" BOOLEAN NOT NULL DEFAULT false,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hr_job_openings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hr_applicants" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "jobOpeningId" TEXT,
  "source" "HrApplicantSource" NOT NULL DEFAULT 'HR_MANUAL',
  "status" "HrApplicantStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
  "fullName" TEXT NOT NULL,
  "localizedName" JSONB,
  "email" TEXT,
  "phoneCountry" TEXT,
  "phone" TEXT,
  "normalizedPhone" TEXT,
  "countryCode" TEXT,
  "nationalityCountryCode" TEXT,
  "preferredLanguage" TEXT,
  "address" TEXT,
  "educationLevel" TEXT,
  "university" TEXT,
  "graduationYear" INTEGER,
  "currentJobTitle" TEXT,
  "yearsOfExperience" DECIMAL(5,2),
  "lastSalaryAmount" DECIMAL(14,2),
  "lastSalaryCurrency" TEXT,
  "expectedSalaryAmount" DECIMAL(14,2),
  "expectedSalaryCurrency" TEXT,
  "noticePeriod" TEXT,
  "linkedinUrl" TEXT,
  "portfolioUrl" TEXT,
  "notes" TEXT,
  "aiReviewStatus" "HrApplicantAiReviewStatus" NOT NULL DEFAULT 'NOT_REQUESTED',
  "aiReviewSummary" JSONB,
  "convertedEmployeeId" TEXT,
  "submittedAt" TIMESTAMP(3),
  "reviewedAt" TIMESTAMP(3),
  "reviewedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hr_applicants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hr_applicant_documents" (
  "id" TEXT NOT NULL,
  "applicantId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "documentType" "HrApplicantDocumentType" NOT NULL,
  "fileId" TEXT,
  "status" "HrApplicantDocumentStatus" NOT NULL DEFAULT 'UPLOADED',
  "extractionStatus" "HrApplicantAiReviewStatus" NOT NULL DEFAULT 'NOT_REQUESTED',
  "extractedData" JSONB,
  "reviewerNotes" TEXT,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hr_applicant_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hr_applicant_interviews" (
  "id" TEXT NOT NULL,
  "applicantId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "interviewType" "HrApplicantInterviewType" NOT NULL DEFAULT 'PHONE',
  "location" TEXT,
  "interviewerId" TEXT,
  "status" "HrApplicantInterviewStatus" NOT NULL DEFAULT 'SCHEDULED',
  "notes" TEXT,
  "score" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hr_applicant_interviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hr_applicant_offers" (
  "id" TEXT NOT NULL,
  "applicantId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "status" "HrApplicantOfferStatus" NOT NULL DEFAULT 'DRAFT',
  "salaryAmount" DECIMAL(14,2),
  "salaryCurrency" TEXT,
  "officeId" TEXT,
  "departmentId" TEXT,
  "positionId" TEXT,
  "managerId" TEXT,
  "workScheduleId" TEXT,
  "startsAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hr_applicant_offers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hr_recruitment_settings" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "requiredCv" BOOLEAN NOT NULL DEFAULT true,
  "requiredGraduationCertificate" BOOLEAN NOT NULL DEFAULT false,
  "requiredNationalId" BOOLEAN NOT NULL DEFAULT true,
  "requiredMilitaryCertificate" BOOLEAN NOT NULL DEFAULT false,
  "requiredLastSalaryProof" BOOLEAN NOT NULL DEFAULT false,
  "requiredExperienceCertificates" BOOLEAN NOT NULL DEFAULT false,
  "countrySpecificRequirements" JSONB,
  "jobSpecificOverrides" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hr_recruitment_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "hr_applicants_convertedEmployeeId_key" ON "hr_applicants"("convertedEmployeeId");
CREATE UNIQUE INDEX "hr_recruitment_settings_organizationId_key" ON "hr_recruitment_settings"("organizationId");
CREATE INDEX "hr_job_openings_organizationId_status_idx" ON "hr_job_openings"("organizationId", "status");
CREATE INDEX "hr_job_openings_organizationId_publicApplyEnabled_idx" ON "hr_job_openings"("organizationId", "publicApplyEnabled");
CREATE INDEX "hr_applicants_organizationId_status_idx" ON "hr_applicants"("organizationId", "status");
CREATE INDEX "hr_applicants_organizationId_jobOpeningId_idx" ON "hr_applicants"("organizationId", "jobOpeningId");
CREATE INDEX "hr_applicants_organizationId_submittedAt_idx" ON "hr_applicants"("organizationId", "submittedAt");
CREATE INDEX "hr_applicants_organizationId_source_idx" ON "hr_applicants"("organizationId", "source");
CREATE INDEX "hr_applicant_documents_organizationId_status_idx" ON "hr_applicant_documents"("organizationId", "status");
CREATE INDEX "hr_applicant_documents_applicantId_documentType_idx" ON "hr_applicant_documents"("applicantId", "documentType");
CREATE INDEX "hr_applicant_documents_fileId_idx" ON "hr_applicant_documents"("fileId");
CREATE INDEX "hr_applicant_interviews_organizationId_scheduledAt_idx" ON "hr_applicant_interviews"("organizationId", "scheduledAt");
CREATE INDEX "hr_applicant_interviews_applicantId_status_idx" ON "hr_applicant_interviews"("applicantId", "status");
CREATE INDEX "hr_applicant_offers_organizationId_status_idx" ON "hr_applicant_offers"("organizationId", "status");
CREATE INDEX "hr_applicant_offers_applicantId_status_idx" ON "hr_applicant_offers"("applicantId", "status");

ALTER TABLE "hr_job_openings" ADD CONSTRAINT "hr_job_openings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hr_job_openings" ADD CONSTRAINT "hr_job_openings_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "hr_applicants" ADD CONSTRAINT "hr_applicants_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hr_applicants" ADD CONSTRAINT "hr_applicants_jobOpeningId_fkey" FOREIGN KEY ("jobOpeningId") REFERENCES "hr_job_openings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "hr_applicants" ADD CONSTRAINT "hr_applicants_convertedEmployeeId_fkey" FOREIGN KEY ("convertedEmployeeId") REFERENCES "hr_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "hr_applicants" ADD CONSTRAINT "hr_applicants_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "hr_applicant_documents" ADD CONSTRAINT "hr_applicant_documents_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "hr_applicants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hr_applicant_documents" ADD CONSTRAINT "hr_applicant_documents_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hr_applicant_documents" ADD CONSTRAINT "hr_applicant_documents_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "uploaded_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "hr_applicant_interviews" ADD CONSTRAINT "hr_applicant_interviews_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "hr_applicants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hr_applicant_interviews" ADD CONSTRAINT "hr_applicant_interviews_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hr_applicant_interviews" ADD CONSTRAINT "hr_applicant_interviews_interviewerId_fkey" FOREIGN KEY ("interviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "hr_applicant_offers" ADD CONSTRAINT "hr_applicant_offers_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "hr_applicants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hr_applicant_offers" ADD CONSTRAINT "hr_applicant_offers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hr_recruitment_settings" ADD CONSTRAINT "hr_recruitment_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "hr_recruitment_settings" (
  "id",
  "organizationId",
  "updatedAt"
)
SELECT
  'hrs_' || md5("id"),
  "id",
  CURRENT_TIMESTAMP
FROM "organizations"
ON CONFLICT ("organizationId") DO NOTHING;

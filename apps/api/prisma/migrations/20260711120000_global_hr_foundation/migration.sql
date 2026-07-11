CREATE TYPE "HrTodayStatus" AS ENUM ('PRESENT', 'LATE', 'ABSENT', 'LEAVE', 'HOLIDAY', 'REMOTE', 'PENDING_REVIEW');
CREATE TYPE "HrFaceVerificationStatus" AS ENUM ('NOT_CONFIGURED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED');
CREATE TYPE "EmployeeIdentifierType" AS ENUM ('NATIONAL_ID', 'PASSPORT', 'RESIDENCE_ID', 'TAX_ID', 'WORK_PERMIT', 'OTHER');
CREATE TYPE "EmployeeVerificationStatus" AS ENUM ('NOT_REVIEWED', 'PENDING', 'APPROVED', 'REJECTED', 'NEEDS_MANUAL_REVIEW');
CREATE TYPE "HrDocumentStatus" AS ENUM ('MISSING', 'PENDING', 'VALID', 'EXPIRED', 'REJECTED');
CREATE TYPE "HrManualReviewStatus" AS ENUM ('NOT_REVIEWED', 'PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "HrEmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'TRAINEE', 'TEMPORARY', 'INTERN');
CREATE TYPE "HrWorkScheduleType" AS ENUM ('FIXED_OFFICE_HOURS', 'SHIFTS', 'FLEXIBLE', 'REMOTE', 'HYBRID');
CREATE TYPE "HrPaymentFrequency" AS ENUM ('MONTHLY', 'WEEKLY', 'BIWEEKLY', 'DAILY', 'HOURLY');
CREATE TYPE "HrPaymentMethod" AS ENUM ('BANK_TRANSFER', 'CASH', 'WALLET', 'CHEQUE', 'OTHER');

ALTER TABLE "hr_employees"
ADD COLUMN "officeId" TEXT,
ADD COLUMN "branchId" TEXT,
ADD COLUMN "positionId" TEXT,
ADD COLUMN "jobLevelId" TEXT,
ADD COLUMN "directManagerId" TEXT,
ADD COLUMN "secondaryManagerId" TEXT,
ADD COLUMN "workGroupId" TEXT,
ADD COLUMN "teamId" TEXT,
ADD COLUMN "photoFileId" TEXT,
ADD COLUMN "faceReferenceFileId" TEXT,
ADD COLUMN "faceVerificationConsent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "faceVerificationStatus" "HrFaceVerificationStatus" NOT NULL DEFAULT 'NOT_CONFIGURED',
ADD COLUMN "employeeCode" TEXT,
ADD COLUMN "legalName" TEXT,
ADD COLUMN "displayName" TEXT,
ADD COLUMN "localizedNames" JSONB,
ADD COLUMN "maritalStatus" TEXT,
ADD COLUMN "gender" TEXT,
ADD COLUMN "dateOfBirth" TIMESTAMP(3),
ADD COLUMN "nationalityCountryCode" TEXT,
ADD COLUMN "residenceCountryCode" TEXT,
ADD COLUMN "preferredLanguage" TEXT,
ADD COLUMN "timezone" TEXT,
ADD COLUMN "locale" TEXT,
ADD COLUMN "currency" TEXT,
ADD COLUMN "workStartDate" TIMESTAMP(3),
ADD COLUMN "hireDate" TIMESTAMP(3),
ADD COLUMN "isUnderProbation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "probationEndDate" TIMESTAMP(3),
ADD COLUMN "hasDisability" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "disabilityStatus" TEXT,
ADD COLUMN "disabilityNotes" TEXT,
ADD COLUMN "employmentType" "HrEmploymentType",
ADD COLUMN "contractType" TEXT,
ADD COLUMN "jobTitle" TEXT,
ADD COLUMN "workScheduleType" "HrWorkScheduleType",
ADD COLUMN "workScheduleId" TEXT,
ADD COLUMN "shiftGroupId" TEXT,
ADD COLUMN "attendanceProfileId" TEXT,
ADD COLUMN "leaveProfileId" TEXT,
ADD COLUMN "breakProfileId" TEXT,
ADD COLUMN "allowedAttendanceLocationId" TEXT,
ADD COLUMN "exactRadiusMeters" INTEGER,
ADD COLUMN "expandedRadiusMeters" INTEGER,
ADD COLUMN "webCheckInAllowed" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "mobileCheckInAllowed" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "requireLivePhoto" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "requireFaceVerification" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "requireDvrReview" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "webWifiPolicy" "WebWifiPolicy",
ADD COLUMN "remoteWorkAllowed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "holidayWorkPolicy" TEXT,
ADD COLUMN "payrollProfileId" TEXT,
ADD COLUMN "allowancesProfileId" TEXT,
ADD COLUMN "deductionsProfileId" TEXT,
ADD COLUMN "salaryAmount" DECIMAL(14,2),
ADD COLUMN "salaryCurrency" TEXT,
ADD COLUMN "paymentFrequency" "HrPaymentFrequency",
ADD COLUMN "paymentMethod" "HrPaymentMethod",
ADD COLUMN "loginEnabled" BOOLEAN NOT NULL DEFAULT true;

CREATE UNIQUE INDEX "hr_employees_organizationId_employeeCode_key"
ON "hr_employees" ("organizationId", "employeeCode");
CREATE INDEX "hr_employees_officeId_idx" ON "hr_employees" ("officeId");
CREATE INDEX "hr_employees_branchId_idx" ON "hr_employees" ("branchId");
CREATE INDEX "hr_employees_workGroupId_idx" ON "hr_employees" ("workGroupId");
CREATE INDEX "hr_employees_teamId_idx" ON "hr_employees" ("teamId");

CREATE TABLE "employee_identifiers" (
  "id" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "type" "EmployeeIdentifierType" NOT NULL,
  "countryCode" TEXT,
  "value" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "verificationStatus" "EmployeeVerificationStatus" NOT NULL DEFAULT 'NOT_REVIEWED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "employee_identifiers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "employee_identifiers_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "employee_identifiers_employeeId_isPrimary_idx" ON "employee_identifiers" ("employeeId", "isPrimary");

CREATE TABLE "hr_work_groups" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "workScheduleId" TEXT,
  "allowedAttendanceLocationId" TEXT,
  "attendanceProfileId" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hr_work_groups_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "hr_work_groups_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "hr_work_groups_organizationId_name_key" ON "hr_work_groups" ("organizationId", "name");
CREATE INDEX "hr_work_groups_organizationId_isActive_idx" ON "hr_work_groups" ("organizationId", "isActive");

CREATE TABLE "hr_work_group_managers" (
  "workGroupId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "hr_work_group_managers_pkey" PRIMARY KEY ("workGroupId", "userId"),
  CONSTRAINT "hr_work_group_managers_workGroupId_fkey" FOREIGN KEY ("workGroupId") REFERENCES "hr_work_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "hr_work_group_managers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "hr_teams" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "workGroupId" TEXT,
  "managerId" TEXT,
  "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hr_teams_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "hr_teams_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "hr_teams_workGroupId_fkey" FOREIGN KEY ("workGroupId") REFERENCES "hr_work_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "hr_teams_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "hr_teams_organizationId_name_key" ON "hr_teams" ("organizationId", "name");
CREATE INDEX "hr_teams_organizationId_isActive_idx" ON "hr_teams" ("organizationId", "isActive");
CREATE INDEX "hr_teams_workGroupId_idx" ON "hr_teams" ("workGroupId");

CREATE TABLE "hr_employee_documents" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "documentType" TEXT NOT NULL,
  "fileId" TEXT,
  "status" "HrDocumentStatus" NOT NULL DEFAULT 'MISSING',
  "expiresAt" TIMESTAMP(3),
  "aiReviewStatus" "EmployeeVerificationStatus" NOT NULL DEFAULT 'NOT_REVIEWED',
  "manualReviewStatus" "HrManualReviewStatus" NOT NULL DEFAULT 'NOT_REVIEWED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hr_employee_documents_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "hr_employee_documents_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "hr_employee_documents_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "hr_employee_documents_organizationId_status_idx" ON "hr_employee_documents" ("organizationId", "status");
CREATE INDEX "hr_employee_documents_employeeId_expiresAt_idx" ON "hr_employee_documents" ("employeeId", "expiresAt");

CREATE TABLE "hr_employee_transfer_logs" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "fromOfficeId" TEXT,
  "fromDepartmentId" TEXT,
  "fromPositionId" TEXT,
  "fromManagerId" TEXT,
  "toOfficeId" TEXT,
  "toDepartmentId" TEXT,
  "toPositionId" TEXT,
  "toManagerId" TEXT,
  "reason" TEXT,
  "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "hr_employee_transfer_logs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "hr_employee_transfer_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "hr_employee_transfer_logs_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "hr_employee_transfer_logs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "hr_employee_transfer_logs_organizationId_effectiveDate_idx" ON "hr_employee_transfer_logs" ("organizationId", "effectiveDate");
CREATE INDEX "hr_employee_transfer_logs_employeeId_effectiveDate_idx" ON "hr_employee_transfer_logs" ("employeeId", "effectiveDate");

CREATE TABLE "hr_employee_title_change_logs" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "fromTitle" TEXT,
  "fromPositionId" TEXT,
  "fromJobLevelId" TEXT,
  "toTitle" TEXT,
  "toPositionId" TEXT,
  "toJobLevelId" TEXT,
  "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "hr_employee_title_change_logs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "hr_employee_title_change_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "hr_employee_title_change_logs_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "hr_employee_title_change_logs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "hr_employee_title_change_logs_organizationId_effectiveDate_idx" ON "hr_employee_title_change_logs" ("organizationId", "effectiveDate");
CREATE INDEX "hr_employee_title_change_logs_employeeId_effectiveDate_idx" ON "hr_employee_title_change_logs" ("employeeId", "effectiveDate");

ALTER TABLE "hr_employees"
ADD CONSTRAINT "hr_employees_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "organization_branches"("id") ON DELETE SET NULL ON UPDATE CASCADE,
ADD CONSTRAINT "hr_employees_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "organization_branches"("id") ON DELETE SET NULL ON UPDATE CASCADE,
ADD CONSTRAINT "hr_employees_directManagerId_fkey" FOREIGN KEY ("directManagerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
ADD CONSTRAINT "hr_employees_secondaryManagerId_fkey" FOREIGN KEY ("secondaryManagerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
ADD CONSTRAINT "hr_employees_workGroupId_fkey" FOREIGN KEY ("workGroupId") REFERENCES "hr_work_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE,
ADD CONSTRAINT "hr_employees_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "hr_teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Repair a historical migration/schema-ledger drift on staging.  The Prisma
-- schema and the deployed API use these UploadedFile fields, but the applied
-- database did not contain them.  This is additive and preserves every row.
DO $$ BEGIN
  CREATE TYPE "FilePurpose" AS ENUM (
    'PUBLIC_MEDIA', 'PROJECT_MEDIA', 'COMPANY_DOCUMENT', 'CHAT_ATTACHMENT',
    'HR_DOCUMENT', 'ATTENDANCE_EVIDENCE', 'QUARANTINE'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "FileVisibility" AS ENUM ('PUBLIC', 'PRIVATE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "uploaded_files"
  ADD COLUMN IF NOT EXISTS "filePurpose" "FilePurpose" NOT NULL DEFAULT 'QUARANTINE',
  ADD COLUMN IF NOT EXISTS "visibility" "FileVisibility" NOT NULL DEFAULT 'PRIVATE';

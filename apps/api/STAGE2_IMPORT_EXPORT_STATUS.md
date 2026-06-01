# STAGE2_IMPORT_EXPORT_STATUS.md

## Current Slice

Slice 1 — Project/Inventory Import + Organization Export Foundation

## Percentage Completed

20%

## What Was Done

- Added backend import/export foundation for developer project and inventory data.
- Added import preview for JSON parsed rows and CSV text.
- Added row-level validation with stored import jobs and import job rows.
- Added commit flow for valid rows only.
- Added idempotent recommit behavior for already committed jobs.
- Added organization-scoped export endpoints for projects, inventory, deals, commissions, and account data.
- Added safe export serialization for account data that excludes password hashes, refresh tokens, token hashes, audit logs, and domain verification tokens.
- Added import/export API contract documentation.
- Added focused e2e coverage for required Slice 1 behaviors.
- Kept the work backend-only and did not touch Admin Web, Mobile, Public Web, Workers, or AI/DVR.

## Files Created

- `apps/api/src/modules/import-export/dto/preview-project-inventory-import.dto.ts`
- `apps/api/src/modules/import-export/import-export.controller.ts`
- `apps/api/src/modules/import-export/import-export.module.ts`
- `apps/api/src/modules/import-export/import-export.service.ts`
- `apps/api/test/stage2-import-export-slice1.e2e-spec.ts`
- `apps/api/IMPORT_EXPORT_CONTRACTS.md`
- `apps/api/STAGE2_IMPORT_EXPORT_STATUS.md`

## Files Modified

- `apps/api/prisma/schema.prisma`
- `apps/api/src/app.module.ts`
- `apps/api/src/modules/permissions/rbac.seed.ts`
- `apps/api/src/modules/conversations/conversations.service.ts`

## Prisma Models Added/Changed

- Added `ImportJob`.
- Added `ImportJobRow`.
- Added `ImportJobType`:
  - `PROJECT_INVENTORY`
- Added `ImportJobStatus`:
  - `DRAFT`
  - `VALIDATING`
  - `READY`
  - `COMMITTED`
  - `FAILED`
  - `CANCELLED`
- Added `ImportSourceFormat`:
  - `CSV`
  - `JSON`
  - `XLSX`
- Added `ImportRowStatus`:
  - `VALID`
  - `INVALID`
  - `SKIPPED`
  - `COMMITTED`
- Added relations from `Organization` and `User` to import jobs.

## Endpoints Added

- `POST /import-export/project-inventory/preview`
- `GET /import-export/jobs`
- `GET /import-export/jobs/:id`
- `POST /import-export/jobs/:id/commit`
- `POST /import-export/jobs/:id/cancel`
- `GET /import-export/export/projects`
- `GET /import-export/export/inventory`
- `GET /import-export/export/deals`
- `GET /import-export/export/commissions`
- `GET /import-export/export/account`

## Permissions Added

- `imports.project_inventory`
- `exports.organization_data`
- `exports.platform_data`

Seed behavior:

- Developer owner/admin roles receive import and organization export permissions.
- Developer sales roles receive organization export permission.
- Brokerage owner/admin roles receive organization export permission.
- Platform owner/admin roles receive import/export permissions, but platform import-on-behalf remains disabled in Slice 1.

## Import Rules

- Only developer organizations can preview and commit project/inventory imports in Slice 1.
- Brokerage and broker users cannot import developer project data.
- Platform import-on-behalf is intentionally disabled until a later slice adds explicit target organization controls.
- Preview creates only `ImportJob` and `ImportJobRow` records.
- Preview does not mutate project, phase, inventory, or payment plan records.
- Validation is row-level and stores errors/warnings as JSON.
- Commit uses a Prisma transaction.
- Commit creates or updates projects, phases, inventory units, and project-level payment plans.
- Commit skips invalid rows.
- Re-committing an already committed job returns `alreadyCommitted: true` and does not duplicate records.

## Export Rules

- Organization users export only their own organization scope.
- Platform users can export all supported data only with `exports.platform_data`.
- Project and inventory exports are developer-data scoped.
- Deal and commission exports are scoped by developer or brokerage organization as applicable.
- Account export uses allowlisted fields and excludes private auth/security data.
- JSON is the only export response format in Slice 1.

## Tests / Manual Checks

Implemented e2e coverage for:

- Developer can preview valid project/inventory rows.
- Invalid rows return row-level validation errors.
- Preview does not create projects/inventory.
- Developer can commit valid rows.
- Invalid rows are not committed.
- Re-committing the same job does not duplicate records.
- Brokerage cannot import developer projects.
- Developer can export own projects/inventory.
- Developer cannot export another developer's data.
- Export does not include password/token/private auth data.

Commands run during implementation:

- `pnpm.cmd exec prisma validate --config prisma/prisma.config.ts` from `apps/api` — PASS.
- `pnpm.cmd exec prisma generate --config prisma/prisma.config.ts` from `apps/api` — PASS.
- `pnpm.cmd exec prisma db push --config prisma/prisma.config.ts` from `apps/api` — PASS, database already in sync.
- `pnpm.cmd --filter api build` — PASS after a small existing conversation include typing fix.
- `pnpm.cmd --filter api test --runInBand` — PASS: 7 suites, 15 tests.
- `pnpm.cmd --filter api test:e2e -- --runInBand test/stage2-import-export-slice1.e2e-spec.ts` — PASS.
- `pnpm.cmd --filter api test:e2e --runInBand` — PASS: 12 suites, 12 tests.
- Final `pnpm.cmd exec prisma validate --config prisma/prisma.config.ts` from `apps/api` — PASS.
- Final `pnpm.cmd exec prisma generate --config prisma/prisma.config.ts` from `apps/api` — PASS.
- Final `pnpm.cmd exec prisma db push --config prisma/prisma.config.ts` from `apps/api` — PASS, database already in sync.
- Final `pnpm.cmd --filter api build` — PASS.
- Final `pnpm.cmd --filter api test --runInBand` — PASS: 7 suites, 15 tests.

Note: e2e still emits the existing non-failing `pg` deprecation warning about `client.query()` concurrency.

## Missing / Not Done

- No Admin Web UI.
- No Mobile UI.
- No Public Web changes.
- No Workers changes.
- No CRM changes.
- No HR, accounting, legal, cameras/DVR/AI, or ads integrations.
- No Word/PDF import.
- No OCR.
- No AI parsing.
- No binary file upload.
- No cloud storage upload.
- No XLSX binary parsing.
- No CSV export formatting.
- No background import worker.

## Blockers

- No blocker for Slice 1 backend foundation.
- Admin Web needs a later slice for UI integration.
- Production-scale imports may need file upload/storage and worker processing before large spreadsheets are supported.

## Dependencies For Admin Web Team

- Use `POST /import-export/project-inventory/preview` with parsed JSON rows or CSV text.
- Show returned `rowErrors` and `warnings` before enabling commit.
- Commit with `POST /import-export/jobs/:id/commit`.
- Show job history from `GET /import-export/jobs`.
- Treat `alreadyCommitted: true` as safe idempotent behavior.
- Use JSON export endpoints for local review/demo/compliance downloads until CSV export is added.

## Next Slice Recommendation

- Add Admin Web import/export screens.
- Add downloadable import templates and better row mapping UX.
- Add CSV export response format.
- Add platform import-on-behalf with explicit target organization selection and permission checks.
- Add import job filtering by status and date.
- Add larger-file strategy with upload metadata and background worker processing.

## Codex Prompt Used

```text
Stage 2 Team Import Export — Project Data Import/Export

Implement Stage 2 Import/Export Slice 1 only.

Goal:
Add backend foundation for importing developer project/inventory data from CSV/XLSX-like structured data and exporting organization data safely.

Work only inside apps/api, packages/shared-types, packages/api-contracts, and root docs if needed.

Implement import job foundation, project/inventory import preview, project/inventory import commit, row-level validation errors, organization export foundation, developer-safe export endpoints, docs, and tests.

Support CSV and JSON payloads representing parsed spreadsheet rows. Do not implement Word, PDF, OCR, AI parsing, document extraction, Admin Web UI, Mobile UI, Public Web changes, Workers changes, CRM, real cloud storage upload, or binary file upload.
```

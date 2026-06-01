## Current Slice

Backend Slice 7 - Final Backend Freeze, QA, Contracts, and Smoke

## Percentage Completed

100%

## What Was Done

- Finalized Stage 4 backend documentation and contract consistency.
- Hardened the backend smoke script for health-only and authenticated smoke modes.
- Added the root `qa:stage4:backend` script for backend-only release checks.
- Created the final Stage 4 backend release report.
- Reviewed Stage 4 e2e coverage and confirmed existing Slice 4, Slice 5, and Slice 6 tests cover the required freeze checks without adding duplicate large tests.

## Files Created

- `STAGE4_BACKEND_RELEASE_REPORT.md`

## Files Modified

- `package.json`
- `scripts/stage4-backend-smoke.ps1`
- `STAGE4_OPERATIONS_STATUS.md`
- `apps/api/API_CONTRACTS.md`
- `STAGE2_KNOWN_GAPS.md`
- `PRODUCTION_RATE_LIMIT_PLAN.md`
- `PRODUCTION_ENV_CHECKLIST.md`

## API Contract Cleanup

- Confirmed operations bulk endpoints, JSON/CSV exports, import jobs, report endpoints, import RBAC permissions, and rate-limit env vars are documented consistently.
- Confirmed worker execution remains design-only.
- Confirmed non-goals and remaining backend gaps are documented.
- Removed stale rate-limit wording that implied only two protected endpoints.

## Smoke Script Behavior

- `scripts/stage4-backend-smoke.ps1` now checks `/health` with only an API URL.
- Authenticated checks run when full developer credentials are supplied.
- Optional platform checks run when full platform credentials are supplied.
- It checks operations summaries, module summaries, reports, activities, one JSON export, one CSV export, report rate-limit headers, and export rate-limit headers.
- It never prints passwords or tokens.
- It reports request ids on failures when the API returns request/correlation headers.

## QA Script Behavior

- Added `pnpm qa:stage4:backend`.
- The script runs API build, API unit tests, and API e2e tests.
- It does not start servers, seed data, run UI builds, or run browser tests.

## Test Coverage

- Stage 4 e2e coverage includes foundations, scoping, bulk actions, JSON exports, CSV exports, sensitive-field exclusion, import preview/commit, import RBAC, approval foundations, report aggregates, report safety, platform scope, cross-organization isolation, and rate-limit headers/429 behavior.
- No new large test was added in Slice 7 because Slice 4-6 tests already cover the freeze checklist.

## Commands Run

- `pnpm --filter api build`
- `pnpm --filter api test --runInBand`
- `pnpm --filter api test:e2e --runInBand`
- `pnpm qa:stage4:backend`

## Build/Test Result

- API build: passed.
- API unit tests: passed.
- API e2e tests: passed.
- Stage 4 backend QA script: passed.

## Remaining Non-Backend Gaps

- UI/UX Phase 3 is still paused.
- No mobile/public UI changes were made.
- No real background worker execution, queue/outbox schema, scheduled reports, provider integrations, payment gateway, payroll, e-signature, camera streaming, DVR provider API, AI video analysis, OCR, XLSX parsing, file upload, or production deployment was implemented.

## Ready To Resume UI Phase 3

Yes. Stage 4 backend is frozen at 100% for current scope and is ready for UI Phase 3 to resume against stable backend contracts.

## Codex Prompt Used

Stage 4 Backend Slice 7 - Final Backend Freeze QA Contracts Smoke.

---

## Current Slice

Backend Slice 6 - Advanced Operations Reporting, Import RBAC, and Worker Design

## Percentage Completed

90%

## What Was Done

- Added advanced internal operations reporting endpoints for overview, trends, activity, HR workforce, accounting cashflow, legal risk, ads campaigns, and camera devices.
- Added dedicated operations import permissions: `imports.hr`, `imports.accounting`, `imports.legal`, `imports.ads`, and `imports.cameras`.
- Preserved backwards compatibility with `imports.project_inventory` for existing seed/demo roles.
- Added report-specific rate limits and standard rate-limit headers.
- Added a backend-only operations import worker design package.
- Updated the Stage 4 backend smoke script with report and report rate-limit header checks.
- Added focused Slice 6 e2e coverage for reporting, report rate limits, import RBAC, platform scope, and cross-organization isolation.

## Files Created

- `apps/api/OPERATIONS_IMPORT_WORKER_PLAN.md`
- `apps/api/test/stage4-operations-slice6.e2e-spec.ts`

## Files Modified

- `apps/api/src/modules/import-export/import-export.service.ts`
- `apps/api/src/modules/operations/operations.controller.ts`
- `apps/api/src/modules/operations/operations.service.ts`
- `apps/api/src/modules/permissions/rbac.seed.ts`
- `apps/api/src/modules/permissions/rbac.seed.spec.ts`
- `scripts/stage4-backend-smoke.ps1`
- `STAGE4_OPERATIONS_STATUS.md`
- `apps/api/API_CONTRACTS.md`
- `STAGE2_KNOWN_GAPS.md`
- `PRODUCTION_RATE_LIMIT_PLAN.md`
- `PRODUCTION_ENV_CHECKLIST.md`

## Prisma Changes

- No Prisma schema changes.
- RBAC seed metadata was extended with dedicated operations import permissions.

## API Endpoints Added

- `GET /operations/reports/overview`
- `GET /operations/reports/trends`
- `GET /operations/reports/activity`
- `GET /hr/reports/workforce`
- `GET /accounting/reports/cashflow`
- `GET /legal/reports/risk`
- `GET /ads/reports/campaigns`
- `GET /cameras/reports/devices`

## Reporting Behavior

- Reports return aggregate counts and totals only.
- Overview includes employee counts, attendance today, accounting income/expense/net, legal counts, ads aggregates, camera aggregates, and recent activity count.
- Trends support `dateFrom`, `dateTo`, and `granularity=day|week|month`.
- Accounting cashflow returns income, expense, net, category totals, and trend buckets.
- Legal risk returns grouped case/document counts without legal text dumps.
- Ads reports return provider/status aggregates and planned budget totals without provider calls.
- Camera reports return provider/status/AI counts without stream URL fields.

## Import RBAC Behavior

- Operations imports now require the matching specific permission or the existing broad permission.
- `HR_EMPLOYEES` and `HR_ATTENDANCE`: `imports.hr`.
- `ACCOUNTING_TRANSACTIONS`: `imports.accounting`.
- `LEGAL_DOCUMENTS` and `LEGAL_CASES`: `imports.legal`.
- `ADS_CAMPAIGNS`: `imports.ads`.
- `CAMERA_DEVICES`: `imports.cameras`.
- `imports.project_inventory` still works as a compatibility fallback.

## Report Rate Limit Behavior

- New env vars: `OPERATIONS_REPORT_RATE_LIMIT_WINDOW_SECONDS` default `300`, `OPERATIONS_REPORT_RATE_LIMIT_MAX` default `60`.
- Applies to all new operations report endpoints.
- Keys include authenticated user id, organization id, report/action name, and hashed IP/fallback.
- Final keys are hashed and raw query values are not included.
- Responses emit `x-rate-limit-limit`, `x-rate-limit-remaining`, and `x-rate-limit-reset`.

## Worker Design Summary

- Created `apps/api/OPERATIONS_IMPORT_WORKER_PLAN.md`.
- The plan covers current synchronous behavior, switch criteria, statuses, retries, dead-letter handling, batch sizes, idempotency, privacy, progress reporting, queue options, and API-vs-worker boundaries.
- No real background worker execution was added in this slice.

## Security/Scoping

- JWT required for report and import endpoints.
- Existing organization scoping is preserved.
- Platform reporting scope follows existing operations platform behavior.
- Cross-organization report data is not leaked to developer users.
- Reports avoid raw PII, secrets, provider credentials, stream URLs, and legal text dumps.

## Commands Run

- `pnpm --filter api build`
- `pnpm --filter api test:e2e --runInBand stage4-operations-slice6.e2e-spec.ts`
- `pnpm --filter api build`
- `pnpm --filter api test --runInBand`
- `pnpm --filter api test:e2e --runInBand`

## Build/Test Result

- API build: passed.
- Focused Slice 6 e2e: passed.
- Full API unit tests: passed.
- Full API e2e tests: passed.

## Missing / Not Done

- No production background worker execution yet.
- No import queue/outbox schema yet.
- No scheduled reports, report subscriptions, XLSX/PDF/Word exports, file upload, OCR, AI parsing, provider integrations, streaming, payroll, payment gateway, ledger automation, or e-signature.

## Next Recommendation

Backend Slice 7 should add an import queue/outbox implementation and scheduled report delivery design, then harden reporting performance with persisted rollups if production telemetry requires it.

## Codex Prompt Used

Stage 4 Backend Slice 6 - Advanced Operations Reporting Import RBAC Worker Design.

---

## Current Slice

Backend Slice 5 - Operations Import Jobs, CSV Exports, and Export Rate Limits

## Percentage Completed

80%

## What Was Done

- Added operations import preview and commit support using the existing `ImportJob` / `ImportJobRow` infrastructure.
- Added operations import job types for HR employees, HR attendance, accounting transactions, legal documents, legal cases, ads campaigns, and camera devices.
- Added CSV support to all Stage 4 operations export endpoints while keeping JSON as the default.
- Added dedicated operations export rate limits with standard rate-limit response headers.
- Updated the backend smoke script with optional JSON export, CSV export, and operations import preview checks.
- Added focused Slice 5 e2e coverage for imports, CSV escaping/sanitization, and export rate limits.

## Files Created

- `apps/api/test/stage4-operations-slice5.e2e-spec.ts`

## Files Modified

- `apps/api/prisma/schema.prisma`
- `apps/api/src/modules/import-export/import-export.controller.ts`
- `apps/api/src/modules/import-export/import-export.service.ts`
- `apps/api/src/modules/operations/operations.controller.ts`
- `apps/api/src/modules/operations/operations.service.ts`
- `scripts/stage4-backend-smoke.ps1`
- `STAGE4_OPERATIONS_STATUS.md`
- `apps/api/API_CONTRACTS.md`
- `STAGE2_KNOWN_GAPS.md`
- `PRODUCTION_RATE_LIMIT_PLAN.md`
- `PRODUCTION_ENV_CHECKLIST.md`

## Prisma Changes

- Extended `ImportJobType` with `HR_EMPLOYEES`, `HR_ATTENDANCE`, `ACCOUNTING_TRANSACTIONS`, `LEGAL_DOCUMENTS`, `LEGAL_CASES`, `ADS_CAMPAIGNS`, and `CAMERA_DEVICES`.

## API Endpoints Added/Extended

- `POST /import-export/operations/:type/preview`
- `POST /import-export/jobs/:id/commit` now commits operations import jobs.
- `GET /import-export/jobs` and `GET /import-export/jobs/:id` now include operations import jobs.
- `POST /import-export/jobs/:id/cancel` supports operations jobs before commit.
- Existing operations export endpoints now support `?format=json` and `?format=csv`.

## Import Job Behavior

- Supports JSON parsed rows and CSV text.
- Stores row-level validation errors and warnings.
- Commits valid rows and skips invalid rows.
- Commit is idempotent for already committed jobs.
- Operations imports require developer organization context and the existing import permission.
- Cross-organization optional references are rejected during commit.
- Camera imports ignore and sanitize stream URL, credential, password, and token-like raw fields.

## CSV Export Behavior

- JSON remains the default format.
- CSV responses use `text/csv`.
- Commas, quotes, and newlines are escaped.
- Exports keep the 1000-row max and safe selected columns only.
- Sensitive fields remain excluded, including stream URLs, auth/password fields, provider secrets, raw tokens, private verification tokens, and legal storage URLs.

## Export Rate Limit Behavior

- New env vars: `OPERATIONS_EXPORT_RATE_LIMIT_WINDOW_SECONDS` default `300`, `OPERATIONS_EXPORT_RATE_LIMIT_MAX` default `30`.
- Applies to all Stage 4 operations export endpoints.
- Rate-limit keys include authenticated user id, organization id, export dataset/action, and hashed IP/fallback.
- Final limiter keys are hashed and do not include raw query/filter values.
- Responses emit `x-rate-limit-limit`, `x-rate-limit-remaining`, and `x-rate-limit-reset`.
- 429 responses use a friendly operations export message.

## Security/Scoping

- JWT required.
- Existing operations/export/import permissions are enforced.
- Developer organization scope is required for operations imports.
- Platform users retain existing export visibility behavior, but platform import-on-behalf remains blocked.
- No UI, public web, mobile, worker, provider, OCR, AI, payment, ledger, payroll, e-signature, streaming, or deployment changes were made.

## Commands Run

- `pnpm --filter api exec prisma validate --config prisma/prisma.config.ts`
- `pnpm --filter api exec prisma generate --config prisma/prisma.config.ts`
- `pnpm --filter api exec prisma db push --config prisma/prisma.config.ts`
- `pnpm --filter api build`
- `pnpm --filter api test --runInBand`
- `pnpm --filter api test:e2e --runInBand`
- `pnpm --filter api build`
- `pnpm --filter api test --runInBand`

## Build/Test Result

- Prisma validate: passed.
- Prisma generate: passed.
- Prisma db push: passed.
- API build: passed.
- API unit tests: passed.
- API e2e tests: passed, 21 suites and 27 tests.

## Missing / Not Done

- XLSX parsing, file upload, cloud import, OCR, AI parsing, background workers, PDF/Word exports, and advanced reporting are not implemented.
- Dedicated per-module import permissions are still a future RBAC refinement; Slice 5 reuses the existing import permission.

## Next Recommendation

Backend Slice 6 should add a background import worker, richer import permissions, and advanced operations reporting while keeping provider integrations out of scope.

## Codex Prompt Used

Stage 4 Backend Slice 5 - Operations Import Export Jobs CSV Exports Rate Limits.

---

## Current Slice

Backend Slice 4 — Operations Bulk Actions, Exports, and Approval Foundation

## Percentage Completed

70%

## What Was Done

- Added scoped bulk status endpoints for HR employees, HR departments, legal documents, legal cases, ads campaigns, and camera devices.
- Added JSON export endpoints for operations activities, HR employees, HR attendance, accounting transactions, legal documents, legal cases, ads campaigns, and camera devices.
- Added approval foundation for accounting transactions and legal documents.
- Added per-entity OperationsActivity records for bulk updates and approval/rejection actions.
- Added a backend-only Stage 4 smoke script that checks summary/activity endpoints without printing tokens or passwords.
- Added focused e2e coverage for bulk scoping, export sanitization, operations activity export scoping, and approval/rejection flows.

## Files Created

- `apps/api/test/stage4-operations-slice4.e2e-spec.ts`
- `scripts/stage4-backend-smoke.ps1`

## Files Modified

- `apps/api/prisma/schema.prisma`
- `apps/api/src/modules/operations/operations.controller.ts`
- `apps/api/src/modules/operations/operations.service.ts`
- `STAGE4_OPERATIONS_STATUS.md`
- `apps/api/API_CONTRACTS.md`
- `STAGE2_KNOWN_GAPS.md`

## Prisma Changes

- Added `AccountingTransactionStatus` enum: `DRAFT`, `APPROVED`, `REJECTED`.
- Added accounting approval fields: `status`, `approvedByUserId`, `approvedAt`, `approvalNote`.
- Added legal document review fields: `reviewedByUserId`, `reviewedAt`, `reviewNote`.
- Added user relations for approved accounting transactions and reviewed legal documents.

## API Endpoints Added

- `PATCH /hr/employees/bulk/status`
- `PATCH /hr/departments/bulk/status`
- `PATCH /legal/documents/bulk/status`
- `PATCH /legal/cases/bulk/status`
- `PATCH /ads/campaigns/bulk/status`
- `PATCH /cameras/devices/bulk/status`
- `GET /operations/export/activities`
- `GET /hr/export/employees`
- `GET /hr/export/attendance`
- `GET /accounting/export/transactions`
- `GET /legal/export/documents`
- `GET /legal/export/cases`
- `GET /ads/export/campaigns`
- `GET /cameras/export/devices`
- `PATCH /accounting/transactions/:id/approve`
- `PATCH /accounting/transactions/:id/reject`
- `PATCH /legal/documents/:id/approve`
- `PATCH /legal/documents/:id/reject`

## Bulk Action Behavior

- Bulk payloads accept `ids` arrays with a max of 100 unique ids.
- Cross-organization or unavailable ids reject the full request with `400`.
- Developer users are scoped to their organization.
- Platform users keep the existing operations platform scope behavior.
- Each affected entity gets an OperationsActivity record with privacy-safe metadata.
- No real provider calls, payment settlement, ledger automation, e-signature, camera streaming, DVR, or AI video analysis were added.

## Export Behavior

- Exports are JSON only in this slice.
- Exports return `{ dataset, format, generatedAt, filters, count, items }`.
- Supported filters include `dateFrom`, `dateTo`, `status`, and `type/module` where relevant.
- Exports are capped at 1000 records per request.
- Camera exports exclude stream URLs, provider credentials, tokens, and secrets.
- HR employee exports exclude user/auth fields such as `userId` and password data.
- Legal document exports exclude storage URLs.

## Approval Behavior

- Accounting transactions now default to `DRAFT`.
- Accounting approve/reject sets `APPROVED` or `REJECTED`, reviewer user id, timestamp, and optional note.
- Legal document approve sets status to `ACTIVE` with reviewer fields.
- Legal document reject sets status to `ARCHIVED` with reviewer fields.
- Approval actions create OperationsActivity records.

## Security/Scoping

- All endpoints require JWT authentication.
- Module permissions are enforced before bulk mutations and exports.
- Export endpoints require both module view/manage permission and export permission.
- Organization scoping uses existing operations scoping helpers.
- Cross-organization bulk ids are rejected instead of partially updated.

## Rate Limit Notes

- All new bulk mutation and approval endpoints use the existing operations mutation rate-limit family.
- Export endpoints are authenticated and scoped, but export-specific rate limiting is left as a next hardening step.

## Commands Run

- `pnpm --filter api exec prisma validate --config prisma/prisma.config.ts`
- `pnpm --filter api exec prisma generate --config prisma/prisma.config.ts`
- `pnpm --filter api exec prisma db push --config prisma/prisma.config.ts`
- `pnpm --filter api build`
- `pnpm --filter api test --runInBand`
- `pnpm --filter api test:e2e --runInBand`

## Build/Test Result

- Prisma validate: passed.
- Prisma generate: passed.
- Prisma db push: passed.
- API build: passed.
- API unit tests: passed, 11 suites, 26 passed, 1 skipped.
- API e2e tests: passed, 20 suites, 25 tests.

## Missing / Not Done

- No CSV exports yet.
- No import workflows for HR/accounting/legal/ads/cameras yet.
- No advanced reporting dashboards.
- No export-specific rate-limit family yet.
- No workflow engine, e-signature, real ads provider publishing, camera streaming, DVR provider API, AI video analysis, payroll, payment gateway, or double-entry ledger automation.

## Next Recommendation

Backend Slice 5 should add import/export job support for HR, accounting, legal, ads, and cameras, then add CSV exports and export-specific rate limits.

## Codex Prompt Used

Stage 4 Backend First — Operations Backend Hardening and Bulk Workflows.

---

## Navigation Reconciliation After UI Phase 2

Date: June 1, 2026

Conflicts found:
- UI/UX Phase 2 metadata and icon sidebar integration were present in `nav.ts`.
- Stage 4 overview links were preserved, but several Stage 4 developer department routes existed as pages/tests without individual navigation entries after the Phase 2 nav metadata rewrite.

Files fixed:
- `apps/admin-web/src/components/layout/nav.ts`

Routes preserved:
- `/developer/operations/overview`
- `/platform/operations/overview`
- `/developer/hr/employees`
- `/developer/hr/departments`
- `/developer/hr/attendance`
- `/developer/accounting/transactions`
- `/developer/accounting/summary`
- `/developer/accounting/categories`
- `/developer/legal/documents`
- `/developer/legal/cases`
- `/developer/ads/campaigns`
- `/developer/cameras/devices`
- `/platform/hr/overview`
- `/platform/accounting/overview`
- `/platform/legal/overview`
- `/platform/ads/overview`
- `/platform/cameras/overview`

Commands run:
- `git status --short`
- `git diff -- apps/admin-web/src/components/layout/nav.ts apps/admin-web/src/lib/navigation-engine.ts apps/admin-web/src/components/layout/icon-sidebar.tsx apps/admin-web/src/components/layout/icon-sidebar-more-menu.tsx apps/admin-web/src/components/layout/dashboard-shell.tsx tests/stage4-browser/stage4-operations-smoke.spec.ts STAGE4_OPERATIONS_STATUS.md POPWAM_UI_UX_IMPLEMENTATION_STATUS.md`
- `pnpm --filter api build`
- `pnpm --filter api test:e2e --runInBand`
- `pnpm --filter admin-web build`
- `pnpm --filter admin-web lint`
- `pnpm test:stage4:browser`

Results:
- `pnpm --filter api build`: passed.
- `pnpm --filter api test:e2e --runInBand`: passed, 19 suites and 24 tests.
- `pnpm --filter admin-web build`: passed, 74 routes generated including Stage 4 operations pages.
- `pnpm --filter admin-web lint`: passed.
- `pnpm test:stage4:browser`: first run failed because the expected API service was not listening on `localhost:3000`; after starting the built API on `3000` and admin-web on `3203`, rerun passed with 2 tests.

Confirmation:
- Stage 4 Operations routes are present in the Phase 2 navigation model with safe metadata (`id`, `group`, `desktopPriority`, `mobilePriority`, `icon`, `href`, `label`).
- UI Phase 2 icon sidebar, overflow More menu, and dashboard shell integration continue to build and lint successfully.
- No backend/API/Prisma/auth/RBAC/business logic changes were made during this reconciliation.
## Current Slice

Backend Slice 5 — Operations Import Jobs, CSV Exports, and Export Rate Limits

## Percentage Completed

80%

## What Was Done

- Added operations import job support for HR employees, HR attendance, accounting transactions, legal documents, legal cases, ads campaigns, and camera devices.
- Extended existing import job preview/commit/cancel/list/detail lifecycle for operations job types.
- Added CSV support to all Stage 4 operations export endpoints.
- Added export-specific rate limiting with `OPERATIONS_EXPORT_RATE_LIMIT_WINDOW_SECONDS` and `OPERATIONS_EXPORT_RATE_LIMIT_MAX`.
- Updated the backend smoke script with optional JSON export, CSV export, and HR employee import preview checks.
- Added focused Slice 5 e2e coverage for imports, CSV escaping/sanitization, and export rate limits.

## Files Created

- `apps/api/test/stage4-operations-slice5.e2e-spec.ts`

## Files Modified

- `apps/api/prisma/schema.prisma`
- `apps/api/src/modules/import-export/import-export.controller.ts`
- `apps/api/src/modules/import-export/import-export.service.ts`
- `apps/api/src/modules/operations/operations.controller.ts`
- `apps/api/src/modules/operations/operations.service.ts`
- `scripts/stage4-backend-smoke.ps1`
- `STAGE4_OPERATIONS_STATUS.md`
- `apps/api/API_CONTRACTS.md`
- `STAGE2_KNOWN_GAPS.md`
- `PRODUCTION_RATE_LIMIT_PLAN.md`
- `PRODUCTION_ENV_CHECKLIST.md`

## Prisma Changes

- Extended `ImportJobType` with `HR_EMPLOYEES`, `HR_ATTENDANCE`, `ACCOUNTING_TRANSACTIONS`, `LEGAL_DOCUMENTS`, `LEGAL_CASES`, `ADS_CAMPAIGNS`, and `CAMERA_DEVICES`.

## API Endpoints Added/Extended

- Added `POST /import-export/operations/:type/preview`.
- Extended `POST /import-export/jobs/:id/commit` for operations import job types.
- Existing `GET /import-export/jobs`, `GET /import-export/jobs/:id`, and `POST /import-export/jobs/:id/cancel` now include operations import jobs.
- Extended all operations export endpoints with `?format=json|csv`.

## Import Job Behavior

- Supports JSON parsed rows and CSV text.
- Stores valid and invalid rows in `ImportJobRow`.
- Commit skips invalid rows and commits valid rows only.
- Already committed jobs return idempotent `alreadyCommitted` responses.
- Camera imports ignore stream URLs and credential-like fields.
- Developer-only operations import scope is enforced; platform import-on-behalf and brokerage operations imports remain blocked.

## CSV Export Behavior

- `format=json` remains the default.
- `format=csv` returns `text/csv`.
- CSV values escape commas, quotes, and newlines.
- CSV exports use safe selected columns and keep the 1000-row max.
- Sensitive fields remain excluded, including stream URLs, auth/password fields, provider secrets, raw tokens, private verification tokens, and legal storage URLs.

## Export Rate Limit Behavior

- New env vars: `OPERATIONS_EXPORT_RATE_LIMIT_WINDOW_SECONDS` default `300`, `OPERATIONS_EXPORT_RATE_LIMIT_MAX` default `30`.
- Applies to all operations export endpoints.
- Keys include export dataset/action, authenticated organization id, authenticated user id, and hashed IP/fallback through the shared hashed key builder.
- Emits `x-rate-limit-limit`, `x-rate-limit-remaining`, and `x-rate-limit-reset`.
- Returns friendly 429 responses.

## Security/Scoping

- JWT required.
- Existing module permissions and export permissions are still enforced.
- Operations import jobs require developer organization context and the existing import permission.
- Platform users retain existing export visibility behavior.
- No UI/public/mobile/worker changes were made.

## Commands Run

- `pnpm --filter api exec prisma validate --config prisma/prisma.config.ts`
- `pnpm --filter api exec prisma generate --config prisma/prisma.config.ts`
- `pnpm --filter api exec prisma db push --config prisma/prisma.config.ts`
- `pnpm --filter api build`
- `pnpm --filter api test --runInBand`
- `pnpm --filter api test:e2e --runInBand`
- `pnpm --filter api build` after final test fix
- `pnpm --filter api test --runInBand` after final test fix

## Build/Test Result

- Prisma validate: passed.
- Prisma generate: passed.
- Prisma db push: passed.
- API build: passed.
- API unit tests: passed, 11 suites, 26 passed, 1 skipped.
- API e2e tests: passed, 21 suites, 27 passed.

## Missing / Not Done

- No XLSX parsing.
- No file upload/cloud storage import.
- No OCR or AI import parsing.
- No background import worker.
- No advanced reporting engine.
- No PDF/Word exports.
- No payroll, e-signature, real ads provider publishing, camera streaming, DVR provider API, or AI video analysis.

## Next Recommendation

Backend Slice 6 should add advanced operations reporting and optionally a background import worker design, while keeping XLSX/OCR/AI parsing as separate future epics.

## Codex Prompt Used

Stage 4 Backend Slice 5 — Operations Import Export Jobs CSV Exports Rate Limits.

---

# STAGE2_ADMIN_IMPORT_EXPORT_STATUS.md

## Current Slice

Slice 1 — Import/Export Admin UI

## Percentage Completed

20%

## What Was Done

- Added Admin Web integration for Stage 2 import/export backend endpoints.
- Added developer project/inventory import preview page for pasted CSV text and pasted JSON rows.
- Added import preview summary, row validation errors, warnings, and template helper samples.
- Added import commit action from preview and job detail screens.
- Added import job history pages for developer and platform roles.
- Added import job detail pages with status, metadata, summary JSON, and row table.
- Added safe export pages for developer, brokerage, and platform roles.
- Added JSON export preview and browser-side Download JSON button.
- Added reusable import/export components, API client functions, and React Query hooks.
- Added role navigation entries for developer import/export, platform import jobs/exports, and brokerage exports.
- Kept the UI backend-scoped and did not add binary upload, XLSX parsing, Word/PDF/OCR/AI parsing, file storage, or background workers.

## Files Created

- `apps/admin-web/src/types/admin-import-export.ts`
- `apps/admin-web/src/lib/admin-import-export-api.ts`
- `apps/admin-web/src/hooks/use-admin-import-export.ts`
- `apps/admin-web/src/components/admin-import-export/badges.tsx`
- `apps/admin-web/src/components/admin-import-export/import-preview-form.tsx`
- `apps/admin-web/src/components/admin-import-export/import-summary-card.tsx`
- `apps/admin-web/src/components/admin-import-export/import-row-errors-table.tsx`
- `apps/admin-web/src/components/admin-import-export/import-jobs-table.tsx`
- `apps/admin-web/src/components/admin-import-export/import-job-detail-view.tsx`
- `apps/admin-web/src/components/admin-import-export/import-jobs-page-content.tsx`
- `apps/admin-web/src/components/admin-import-export/export-data-panel.tsx`
- `apps/admin-web/src/components/admin-import-export/json-preview-block.tsx`
- `apps/admin-web/src/components/admin-import-export/download-json-button.tsx`
- `apps/admin-web/src/app/(app)/(developer)/developer/import-export/page.tsx`
- `apps/admin-web/src/app/(app)/(developer)/developer/import-export/jobs/page.tsx`
- `apps/admin-web/src/app/(app)/(developer)/developer/import-export/jobs/[id]/page.tsx`
- `apps/admin-web/src/app/(app)/(developer)/developer/import-export/export/page.tsx`
- `apps/admin-web/src/app/(app)/(platform-admin)/platform/import-export/jobs/page.tsx`
- `apps/admin-web/src/app/(app)/(platform-admin)/platform/import-export/jobs/[id]/page.tsx`
- `apps/admin-web/src/app/(app)/(platform-admin)/platform/import-export/export/page.tsx`
- `apps/admin-web/src/app/(app)/(brokerage)/brokerage/import-export/export/page.tsx`
- `apps/admin-web/STAGE2_ADMIN_IMPORT_EXPORT_STATUS.md`

## Files Modified

- `apps/admin-web/src/components/layout/nav.ts`

## Pages Added

- `/developer/import-export`
- `/developer/import-export/jobs`
- `/developer/import-export/jobs/[id]`
- `/developer/import-export/export`
- `/platform/import-export/jobs`
- `/platform/import-export/jobs/[id]`
- `/platform/import-export/export`
- `/brokerage/import-export/export`

## Components Added

- `ImportPreviewForm`
- `ImportSummaryCard`
- `ImportRowErrorsTable`
- `ImportJobsTable`
- `ImportJobDetailView`
- `ExportDataPanel`
- `JsonPreviewBlock`
- `DownloadJsonButton`

Additional shared helpers:

- `ImportJobStatusBadge`
- `ImportRowStatusBadge`
- `ImportJobsPageContent`

## API Hooks Added

- `useImportJobs`
- `useImportJob`
- `usePreviewProjectInventoryImport`
- `useCommitImportJob`
- `useCancelImportJob`
- `useExportProjects`
- `useExportInventory`
- `useExportDeals`
- `useExportCommissions`
- `useExportAccount`

## Import Preview Behavior

- Developer users can paste parsed JSON rows or CSV text.
- The form submits to `POST /import-export/project-inventory/preview`.
- Preview displays `jobId`, total rows, valid rows, invalid rows, row-level errors, and warnings.
- Commit is enabled only after a job exists and there is at least one valid row.
- JSON rows must parse as a non-empty array before the frontend submits.
- A small static JSON/CSV template helper is included for sample project/inventory rows.
- No binary XLSX upload or parsing was added.

## Job History Behavior

- Developer and platform users can list import jobs from `GET /import-export/jobs`.
- Job tables show job id, status, source format, row totals, created date, committed date, and view action.
- Job detail calls `GET /import-export/jobs/:id`.
- Job detail shows status, source format, original file name, totals, summary JSON, metadata, and rows.
- Job detail can commit valid rows with `POST /import-export/jobs/:id/commit`.
- Job detail can cancel cancellable jobs with `POST /import-export/jobs/:id/cancel`.
- Already committed jobs show committed state; `alreadyCommitted: true` is treated as a safe success response.

## Export Behavior

- Developer export page can request projects, inventory, deals, commissions, and account exports as backend permissions allow.
- Brokerage export page exposes the same export choices and relies on backend authorization/scoping for allowed datasets.
- Platform export page can request all supported datasets when backend permissions allow.
- Export calls use:
  - `GET /import-export/export/projects`
  - `GET /import-export/export/inventory`
  - `GET /import-export/export/deals`
  - `GET /import-export/export/commissions`
  - `GET /import-export/export/account`
- Export responses render as JSON preview.
- Download JSON uses a browser Blob.
- No CSV export formatting was added.

## Commands Run

- `pnpm.cmd --filter admin-web build`
- `pnpm.cmd --filter admin-web lint`

## Build/Lint Result

- Build PASS. Next.js production build and TypeScript completed successfully.
- Build route output confirmed the new developer, brokerage, and platform import/export pages.
- Lint PASS.

## Missing / Not Done

- No backend changes.
- No Public Web changes.
- No Mobile, Workers, or AI/DVR changes.
- No XLSX binary parsing.
- No Word/PDF/OCR/AI import.
- No binary file upload.
- No cloud storage upload.
- No background import worker.
- No CSV export download formatting.
- No platform import-on-behalf target organization picker.
- No live browser smoke was run against a running API in this pass.

## Dependencies

- Requires Stage 2 Import/Export Backend Slice 1 endpoints from `apps/api/IMPORT_EXPORT_CONTRACTS.md`.
- Live import use requires developer users with `imports.project_inventory`.
- Live organization export use requires `exports.organization_data`.
- Live platform job/export use requires `exports.platform_data`.
- Backend remains source of truth for scoping and access decisions.

## Next Slice Recommendation

- Run browser smoke with seeded API data for preview, commit, job history, and export flows.
- Add import job status/date filters if backend adds query parameters.
- Add CSV export formatting when backend supports it.
- Add platform import-on-behalf only after backend exposes explicit target organization controls.
- Add file upload/background-worker import flow only after storage and worker contracts are approved.

## Codex Prompt Used

```text
Stage 2 Team 3 — Import Export Admin UI

Implement Stage 2 Team 3 Import/Export UI Slice 1 only.

Goal:
Add Admin Web UI for developer project/inventory import preview, commit, job history, and safe exports.

Work only inside apps/admin-web. Do not modify apps/api, apps/public-web, apps/mobile, workers, or apps/ai-dvr.

Add developer import preview/job history/job detail/export pages, platform import job/export pages, and brokerage export page. Integrate POST /import-export/project-inventory/preview, GET /import-export/jobs, GET /import-export/jobs/:id, POST /import-export/jobs/:id/commit, POST /import-export/jobs/:id/cancel, and JSON export endpoints for projects, inventory, deals, commissions, and account. Support pasted CSV text and pasted JSON rows only. Create reusable import/export components and hooks; update status; run admin-web build and lint.
```

# STAGE2_ADMIN_CRM_STATUS.md

## Current Slice

Slice 3 - CRM Activity Timeline UI

## Percentage Completed

60%

## What Was Done

- Added Admin Web integration for CRM activity timeline backend endpoints.
- Added activity timeline sections to CRM lead detail pages.
- Added activity timeline sections to conversation detail pages.
- Added platform global CRM activity page.
- Added reusable activity timeline, item, type badge, filters, and pagination controls.
- Added React Query hooks and API client functions for global, lead-scoped, and conversation-scoped activities.
- Added platform navigation entry for CRM Activity.
- Kept the UI backend-scoped and did not add activity creation, note authoring, backend changes, WebSocket, real chat provider, WhatsApp provider, payments, ledger, or redesign work.

## Files Created

- `apps/admin-web/src/components/admin-crm/crm-activities-page-content.tsx`
- `apps/admin-web/src/components/admin-crm/crm-activity-filters.tsx`
- `apps/admin-web/src/components/admin-crm/crm-activity-item.tsx`
- `apps/admin-web/src/components/admin-crm/crm-activity-pagination-controls.tsx`
- `apps/admin-web/src/components/admin-crm/crm-activity-timeline.tsx`
- `apps/admin-web/src/components/admin-crm/crm-activity-type-badge.tsx`
- `apps/admin-web/src/app/(app)/(platform-admin)/platform/crm/activities/page.tsx`

## Files Modified

- `apps/admin-web/src/types/admin-crm.ts`
- `apps/admin-web/src/lib/admin-crm-api.ts`
- `apps/admin-web/src/hooks/use-admin-crm.ts`
- `apps/admin-web/src/components/admin-crm/crm-lead-detail-view.tsx`
- `apps/admin-web/src/components/admin-crm/conversation-detail-view.tsx`
- `apps/admin-web/src/components/layout/nav.ts`
- `apps/admin-web/STAGE2_ADMIN_CRM_STATUS.md`

## Pages Updated/Added

Updated:

- `/developer/crm/leads/[id]`
- `/brokerage/crm/leads/[id]`
- `/platform/crm/leads/[id]`
- `/developer/conversations/[id]`
- `/brokerage/conversations/[id]`
- `/platform/conversations/[id]`

Added:

- `/platform/crm/activities`

## Components Added

- `CrmActivityTimeline`
- `CrmActivityItem`
- `CrmActivityTypeBadge`
- `CrmActivityFilters`
- `CrmActivityPaginationControls`
- `CrmActivitiesPageContent`

## Hooks Added

- `useCrmActivities`
- `useCrmLeadActivities`
- `useConversationActivities`

## Activity Timeline Behavior

- CRM lead detail pages call `GET /crm/leads/:id/activities`.
- Conversation detail pages call `GET /conversations/:id/activities`.
- Activity timeline shows type badge, title, body, safe actor label, created date, related lead/project/conversation summary, and a filtered metadata preview.
- Metadata preview hides obvious internal id/token keys and only shows simple primitive values.
- Empty timelines show a quiet empty state.
- Pagination supports previous, next, current page, total pages, total count, and page size.

## Global Activity Page Behavior

- Platform page `/platform/crm/activities` calls `GET /crm/activities`.
- Page supports activity type and date range filters.
- Page supports paginated activity browsing.
- Backend remains source of truth for platform/global scoping.

## Commands Run

- `pnpm.cmd --filter admin-web build`
- `pnpm.cmd --filter admin-web lint`

## Build/Lint Result

- Build PASS. Next.js production build and TypeScript completed successfully.
- Build output confirmed the new `/platform/crm/activities` route.
- Lint PASS.

## Missing / Not Done

- No backend changes.
- No Public Web changes.
- No Mobile, Workers, or AI/DVR changes.
- No activity note authoring UI.
- No `NOTE_ADDED` creation flow.
- No developer/brokerage global activity pages in this slice.
- No WebSocket.
- No real chat provider.
- No WhatsApp provider.
- No payments or ledger.
- Existing Playwright smoke was not rerun in this pass.

## Dependencies

- Requires Stage 2 CRM Backend Slice 5 endpoints from `apps/api/CRM_CONTRACTS.md`.
- Backend remains source of truth for activity authorization, scoping, and serialization.
- Live activity timelines require existing CRM events to have generated activity rows.

## Next Slice Recommendation

- Rerun Playwright browser smoke with API/Admin/Public servers and include platform CRM activity route.
- Add Admin timeline filters for lead/conversation detail if product wants per-detail filtering.
- Add activity note authoring only after backend `NOTE_ADDED` creation scope is approved.
- Add Mobile CRM activity timeline surfaces after Admin patterns settle.

## Codex Prompt Used

```text
Stage 2 Team 3 - Admin CRM Activity Timeline UI

Implement Stage 2 Admin CRM Slice 3 only.

Goal:
Add CRM activity timeline UI to Admin Web lead detail, conversation detail, and platform/global CRM activity page.

Work only inside apps/admin-web. Do not modify apps/api, apps/public-web, apps/mobile, workers, or apps/ai-dvr.

Integrate GET /crm/leads/:id/activities, GET /conversations/:id/activities, and GET /crm/activities. Add reusable activity timeline, item, type badge, filters, and pagination controls. Add /platform/crm/activities. Keep the UI backend-scoped; do not add activity creation, NOTE_ADDED authoring, backend changes, WebSocket, real chat provider, WhatsApp provider, payments/ledger, HR/accounting/legal/cameras/ads, or redesign work.
```

# STAGE2_CRM_STATUS.md

## Current Slice

Slice 5 - CRM Activity Timeline Backend

## Percentage Completed

100%

## What Was Done

- Added backend CRM activity timeline foundation.
- Added `CrmActivity` Prisma model and `CrmActivityType` enum.
- Added an activity writer service for safe internal CRM activity creation.
- Added authenticated activity list endpoints for global CRM activity, lead activity, and conversation activity.
- Added activity writes for public lead conversion, lead claim, lead status update, conversation creation, authenticated messages, public token messages, and conversation status update.
- Kept public token endpoints activity-free in their responses.
- Kept all work backend-only and did not add Admin Web, Public Web, Mobile, Workers, WebSocket, real chat provider, notifications, WhatsApp provider, payments, ledger, HR, accounting, legal, cameras, or ads.

## Files Created

- `apps/api/src/modules/crm/crm-activities.controller.ts`
- `apps/api/src/modules/crm/crm-activities.service.ts`
- `apps/api/src/modules/crm/dto/list-crm-activities-query.dto.ts`
- `apps/api/test/stage2-crm-activities.e2e-spec.ts`

## Files Modified

- `apps/api/prisma/schema.prisma`
- `apps/api/src/modules/crm/crm.module.ts`
- `apps/api/src/modules/crm/crm-conversion.service.ts`
- `apps/api/src/modules/crm/crm-leads.service.ts`
- `apps/api/src/modules/conversations/conversations.controller.ts`
- `apps/api/src/modules/conversations/conversations.service.ts`
- `apps/api/CRM_CONTRACTS.md`
- `apps/api/STAGE2_CRM_STATUS.md`

## Prisma Models/Enums Added

- Added enum `CrmActivityType`:
  - `LEAD_CREATED`
  - `LEAD_CONVERTED`
  - `LEAD_CLAIMED`
  - `LEAD_STATUS_CHANGED`
  - `CONVERSATION_CREATED`
  - `CONVERSATION_STATUS_CHANGED`
  - `MESSAGE_SENT`
  - `PUBLIC_MESSAGE_SENT`
  - `NOTE_ADDED`
- Added model `CrmActivity` with:
  - organization scope
  - optional lead/conversation links
  - optional authenticated actor user/organization
  - optional public actor name
  - activity type, title, body, metadata, and created timestamp
- Added relations from organizations, users, CRM leads, and conversations to activities.

## Endpoints Added

- `GET /crm/activities`
- `GET /crm/leads/:id/activities`
- `GET /conversations/:id/activities`

## Activity Types

- `LEAD_CREATED`
- `LEAD_CONVERTED`
- `LEAD_CLAIMED`
- `LEAD_STATUS_CHANGED`
- `CONVERSATION_CREATED`
- `CONVERSATION_STATUS_CHANGED`
- `MESSAGE_SENT`
- `PUBLIC_MESSAGE_SENT`
- `NOTE_ADDED`

## Activity Write Behavior

- Public lead conversion writes `LEAD_CREATED` and `LEAD_CONVERTED`.
- Broker claim writes `LEAD_CLAIMED`.
- CRM lead status update writes `LEAD_STATUS_CHANGED`.
- Conversation creation writes `CONVERSATION_CREATED`.
- Authenticated message posting writes `MESSAGE_SENT`.
- Public token message posting writes `PUBLIC_MESSAGE_SENT`.
- Conversation status update writes `CONVERSATION_STATUS_CHANGED`.
- Activity writes do not create LeadClaim, ReservationRequest, DealRoom, deal, commission, broker assignment, payment, notification, WebSocket, chat provider, or WhatsApp provider records.

## Activity Access Rules

- Activity endpoints require bearer authentication.
- Developer users see activities for their own organization/projects.
- Broker/brokerage users see activities for their own claimed leads and accessible conversations.
- Platform users see all activities.
- Public token users cannot call activity endpoints.
- Public token conversation endpoints do not expose activity rows.
- Backend authorization remains the source of truth for activity visibility.

## Tests / Manual Checks

Added focused e2e coverage for:

- Public lead conversion creates activity.
- Lead claim creates activity.
- Lead status update creates activity.
- Conversation creation creates activity.
- Authenticated message creates activity.
- Public token message creates activity.
- Conversation status update creates activity.
- Developer can list own lead/activity timeline.
- Unauthorized developer cannot list another organization lead activity.
- Broker can see activities for an owned claimed lead/conversation.
- Platform can list activities.
- Unauthenticated/public-token style access cannot call activity endpoints.
- Pagination metadata works.

Commands run during implementation:

- `pnpm.cmd exec prisma validate --config prisma/prisma.config.ts` - PASS.
- `pnpm.cmd exec prisma generate --config prisma/prisma.config.ts` - PASS.
- `pnpm.cmd exec prisma db push --config prisma/prisma.config.ts` - PASS.
- `pnpm.cmd --filter api test:e2e --runInBand -- stage2-crm-activities.e2e-spec.ts` - PASS.
- `pnpm.cmd --filter api build` - PASS.
- `pnpm.cmd --filter api test --runInBand` - PASS: 7 suites, 15 tests.
- `pnpm.cmd --filter api test:e2e --runInBand` - PASS: 16 suites, 16 tests.

Note: the first targeted e2e run failed before `db push` because the new activity table was not yet present in the local database. After `db push`, the focused activity test passed.
Full e2e still emits the existing non-failing `pg` deprecation warning about `client.query()` concurrency.

## Missing / Not Done

- No Admin Web timeline UI.
- No Mobile timeline UI.
- No Public Web timeline UI.
- No Workers or AI/DVR changes.
- No WebSocket.
- No real chat provider.
- No WhatsApp provider.
- No notifications.
- No payments or ledger.
- No HR, accounting, legal, cameras, or ads work.
- No CRM activity note creation endpoint yet; `NOTE_ADDED` is reserved for a future note slice.

## Blockers

- No blocker for backend Slice 5 completion identified.

## Dependencies For Admin/Mobile

- Admin Web can consume `GET /crm/activities`, `GET /crm/leads/:id/activities`, and `GET /conversations/:id/activities` for timeline UI.
- Mobile can consume the same authenticated endpoints for lead/conversation history.
- Public Web should not consume activity endpoints; public token views remain conversation-only.

## Next Slice Recommendation

- Add Admin Web CRM lead/conversation activity timeline UI.
- Add Mobile CRM activity timeline surfaces after Admin patterns settle.
- Add a scoped `NOTE_ADDED` endpoint only after note authoring and privacy requirements are approved.
- Add production-grade activity retention/export policy before production rollout.

## Codex Prompt Used

```text
Stage 2 CRM - Activity Timeline Backend

Implement Stage 2 CRM Slice 5 only.

Goal:
Add CRM activity timeline backend foundation.

Backend-only. Work only inside apps/api, packages/shared-types, packages/api-contracts, and root docs if needed. Do not modify Admin Web, Public Web, Mobile, Workers, or AI/DVR. Add CrmActivity model/enum, activity writer service, write activities for CRM/conversation events, authenticated activity endpoints, docs/status/tests. Do not implement UI, Workers, WebSocket, real chat provider, WhatsApp provider, notifications, payments/ledger, HR/accounting/legal/cameras/ads.
```

# TEAM2_MARKETPLACE_STATUS.md

## Current Slice
Slice 6 - Deal Finalization + Commissions Foundation

## Percentage Completed
100%

## What Was Done
- Implemented Team 2 Slice 6 only.
- Added Deal finalization foundation from approved/pending-approved Deal Rooms.
- Added mark-sold flow that atomically:
  - creates a `Deal`
  - marks the `DealRoom` as `SOLD`
  - marks the `InventoryUnit` as `SOLD`
  - releases active `UnitAvailability` holds for the unit
  - creates pending commission entries from active commission rules
- Added Commission Rule foundation for developer-managed project rules.
- Added Commission Entry foundation with approve/reject workflow.
- Added optional `CommissionDispute` placeholder model only.
- Added audit logs and event contracts for deal, commission, and inventory sold workflows.
- Added focused Slice 6 e2e coverage.
- Updated Slice 5 e2e boundary assertions now that commission/deal models exist.
- Did not implement real payments, full ledger/accounting, payment gateways, or real e-signature.

## Files Created
- `apps/api/src/modules/deals/deals.module.ts`
- `apps/api/src/modules/deals/deals.controller.ts`
- `apps/api/src/modules/deals/deals.service.ts`
- `apps/api/src/modules/deals/dto/create-deal-from-room.dto.ts`
- `apps/api/src/modules/deals/dto/cancel-deal.dto.ts`
- `apps/api/src/modules/commission-rules/commission-rules.module.ts`
- `apps/api/src/modules/commission-rules/commission-rules.controller.ts`
- `apps/api/src/modules/commission-rules/commission-rules.service.ts`
- `apps/api/src/modules/commission-rules/dto/create-commission-rule.dto.ts`
- `apps/api/src/modules/commission-rules/dto/update-commission-rule.dto.ts`
- `apps/api/src/modules/commissions/commissions.module.ts`
- `apps/api/src/modules/commissions/commissions.controller.ts`
- `apps/api/src/modules/commissions/commissions.service.ts`
- `apps/api/src/modules/commissions/dto/reject-commission.dto.ts`
- `apps/api/test/team2-marketplace-slice6.e2e-spec.ts`

## Files Modified
- `apps/api/prisma/schema.prisma`
- `apps/api/src/app.module.ts`
- `apps/api/EVENT_CONTRACTS.md`
- `apps/api/src/modules/notifications/event-contracts.ts`
- `apps/api/test/jest-e2e.json`
- `apps/api/test/team2-marketplace-slice5.e2e-spec.ts`
- `apps/api/TEAM2_MARKETPLACE_STATUS.md`

## Prisma Models Added/Changed
- Added `Deal`.
- Added `CommissionRule`.
- Added `CommissionEntry`.
- Added optional placeholder `CommissionDispute`.
- Added `DealStatus`:
  - `PENDING_APPROVAL`
  - `APPROVED`
  - `SOLD`
  - `CANCELLED`
  - `DISPUTED`
- Added `CommissionStatus`:
  - `PENDING`
  - `APPROVED`
  - `REJECTED`
  - `PAID`
  - `CANCELLED`
- Added `CommissionType`:
  - `PERCENTAGE`
  - `FIXED`
- Added `CommissionPartyType`:
  - `DEVELOPER`
  - `BROKERAGE`
  - `BROKER`
  - `PLATFORM`
- Added `DisputeStatus`:
  - `OPEN`
  - `UNDER_REVIEW`
  - `RESOLVED`
  - `REJECTED`
- Added inverse relations from organizations, users, projects, inventory units, clients, leads, lead claims, and deal rooms.

## Endpoints Added
- `GET /deals`
- `GET /deals/:id`
- `POST /deals/from-deal-room/:dealRoomId`
- `PATCH /deals/:id/approve`
- `PATCH /deals/:id/cancel`
- `POST /commission-rules`
- `GET /commission-rules`
- `GET /commission-rules/:id`
- `PATCH /commission-rules/:id`
- `GET /commissions`
- `GET /commissions/:id`
- `PATCH /commissions/:id/approve`
- `PATCH /commissions/:id/reject`

## Permission Checks Added
- `POST /deals/from-deal-room/:dealRoomId` requires `deals.mark_sold`.
- `PATCH /deals/:id/approve` requires `deals.approve`.
- Deal cancellation uses service-level `deals.approve` checks for developer-owned projects.
- `POST /commission-rules` requires `commission_rules.manage`.
- `GET /commission-rules`, `GET /commission-rules/:id`, and `PATCH /commission-rules/:id` require `commission_rules.manage`.
- `PATCH /commissions/:id/approve` and `PATCH /commissions/:id/reject` require `commissions.approve`.
- Commission read endpoints use service-level `commissions.view` / `commissions.view_own` checks.
- Platform users can read all supported deal/commission resources.
- Developers can manage deals, commission rules, and commissions for their own projects.
- Brokers can read their own deals and commissions.
- Brokerage users/admins can read brokerage-related deals and commissions.
- Unauthorized developers are blocked from another developer organization's deal and commission resources.

## Deal Finalization Rules Implemented
- Deals can be created only from a `DealRoom`.
- Deal Room must be `APPROVED` or `PENDING_APPROVAL` before finalization.
- Duplicate Deal creation for the same Deal Room is blocked with a conflict response.
- Only the owning developer organization or platform can finalize a Deal Room.
- Mark-sold flow is wrapped in a Prisma transaction.
- Finalization creates a `Deal` with `SOLD` status.
- Finalization sets the related `DealRoom` to `SOLD`.
- Finalization sets the related `InventoryUnit` to `SOLD`.
- Finalization releases existing active `UnitAvailability` holds for the sold unit.
- Sold deals cannot be cancelled in Slice 6.
- No payment, ledger, or external settlement behavior was added.

## Commission Rules Implemented
- Developers can create/update commission rules for their own projects.
- Rules can be `PERCENTAGE` or `FIXED`.
- Rules can target:
  - developer
  - brokerage
  - broker
  - platform placeholder
- Rules can be scoped to a target organization or target user.
- Active rules are evaluated when a deal is finalized.
- Commission entries are created as `PENDING`.
- Percentage commissions are calculated from final price.
- Fixed commissions use the configured fixed value.
- If no active matching rule exists, no commission entry is created; this is documented placeholder behavior for Slice 6.
- Commission entries can be approved or rejected by authorized developer/platform users.
- Commission entries are not marked paid by this slice.

## Event Contracts Added
- Added event names to `apps/api/EVENT_CONTRACTS.md`.
- Added runtime constants/contracts to `apps/api/src/modules/notifications/event-contracts.ts`.
- Added:
  - `deal.created`
  - `deal.approved`
  - `deal.cancelled`
  - `deal.marked_sold`
  - `commission.created`
  - `commission.approved`
  - `commission.rejected`
  - `inventory.marked_sold`
- No external notification delivery was implemented.

## Manual Tests
- Prisma validate passed:
  - `pnpm.cmd --filter api exec prisma validate --config prisma/prisma.config.ts`
- Prisma generate passed:
  - `pnpm.cmd --filter api exec prisma generate --config prisma/prisma.config.ts`
- Prisma db push passed:
  - `pnpm.cmd --filter api exec prisma db push --config prisma/prisma.config.ts`
  - Result: database already in sync after Slice 6 push.
- Build passed:
  - `pnpm.cmd --filter api build`
- Unit tests passed:
  - `pnpm.cmd --filter api test --runInBand`
  - Result: 7 test suites passed, 15 tests passed.
- E2E tests passed:
  - `pnpm.cmd --filter api test:e2e --runInBand`
  - Result: 7 test suites passed, 7 tests passed.
- Focused Slice 6 e2e passed:
  - `pnpm.cmd --filter api test:e2e -- --runInBand test/team2-marketplace-slice6.e2e-spec.ts`
  - Result: 1 test suite passed, 1 test passed.
- Runtime smoke test passed against built API on temporary port `3218`:
  - Developer created active open project/unit.
  - Broker viewed project in marketplace.
  - Broker created lead claim.
  - Broker created reservation request.
  - Developer approved reservation.
  - Developer created Deal Room.
  - Developer created commission rule.
  - Unauthorized developer was blocked from creating/finalizing the deal.
  - Developer finalized deal from Deal Room.
  - Duplicate deal finalization was blocked.
  - Unit became `SOLD`.
  - Deal Room became `SOLD`.
  - Commission entry was created and visible to broker.
  - No payment or ledger model/record was created.
- Runtime DB confirmation for latest smoke deal:
  - Deal status: `SOLD`
  - Unit status: `SOLD`
  - Deal Room status: `SOLD`
  - Commission entry count: `1`
- No Team 3-6 folders were intentionally modified by this slice.

## Missing
- No real payments.
- No full accounting ledger.
- No payment gateway integration.
- No real e-signature.
- No final commission payout flow.
- No paid commission settlement.
- No full dispute workflow beyond placeholder model foundation.
- No real Stream Chat integration.

## Blockers From Team 1
- No active Team 1 blocker.
- Slice 6 successfully uses Team 1 auth, JWT payload, permissions, Prisma service, and audit log service.

## Dependencies For Team 3/4/5/6
- Team 3 can build:
  - Developer deal finalization UI
  - Deal list/detail UI
  - Commission rule management UI
  - Commission approval/rejection UI
  - Sold inventory status display
- Team 4 can build:
  - Broker deal read-only screens
  - Broker commission visibility screens
  - Mobile sold-status tracking
- Team 5 has no new public-web dependency from Slice 6 because deal finalization and commissions remain authenticated/private.
- Team 6 can consume/audit against these event names:
  - `deal.created`
  - `deal.approved`
  - `deal.cancelled`
  - `deal.marked_sold`
  - `commission.created`
  - `commission.approved`
  - `commission.rejected`
  - `inventory.marked_sold`
- Team 6 should still wait for a queue/notification delivery layer before external delivery.

## Final Handoff Notes
- Team 2 Marketplace Backend is now complete through Slice 6 at 100%.
- Slice 6 intentionally stops at deal finalization and commission foundation.
- Payments, ledger posting, settlement, payout status, and payment gateway integrations remain future backend work outside Team 2 Slice 6.
- Deal finalization currently creates `SOLD` deals directly from eligible Deal Rooms; the separate `PATCH /deals/:id/approve` endpoint remains available for future pending-deal workflows.
- Commission entries are generated only when matching active rules exist.

## Codex Prompt Used
```text
Team 2 - Marketplace Backend for POPWAM Verified Real Estate Marketplace.

Implement Team 2 Slice 6 only, moving Team 2 from 90% to 100%.

Slice 6 Scope - Deal Finalization + Commissions Foundation:
1. Deal finalization foundation
2. Mark sold flow
3. Commission rule foundation
4. Commission entry foundation
5. Basic dispute placeholder if needed
6. Audit/event contracts for deal/commission workflows

Do not implement real payments.
Do not implement full accounting ledger.
Do not integrate payment gateways.
Do not implement real e-signature.
Do not touch Team 3-6 folders.
```

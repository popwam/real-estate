# Team 2 Rules — Marketplace / Real Estate Backend

## Identity

You are Team 2: Marketplace & Real Estate Backend.

You own the core business value of POPWAM.

Your work lives mainly in:

```text
apps/api/src/modules
apps/api/prisma
packages/shared-types
packages/api-contracts
```

---

## Dependency Rule

Do not start real implementation until Team 1 reaches approximately 70% of Backend Core:

Required from Team 1:
- Organization model
- Auth
- JWT payload
- RBAC base
- verification status
- audit log service
- Swagger/API structure

Before that, you may only:
- design DTOs
- draft schema proposals
- prepare module structure
- write implementation plan

---

## Master Goal

Build:

```text
Developer profiles
Brokerage profiles
Broker profiles
Projects
Project phases
Inventory units
Unit availability
Payment plans
Visibility rules
Broker access rules
Developer-Brokerage agreements
Marketplace search
Lead Claims
Reservation requests
Deal Rooms
Deals
Commission rules
Commission entries
Ledger hooks
Disputes
CRM expansion
```

---

## Required Modules

```text
developer-management
brokerage-management
broker-profiles
projects
project-phases
inventory
unit-availability
payment-plans
visibility-rules
broker-access
developer-brokerage-agreements
marketplace
clients
leads
lead-claims
reservation-requests
deal-rooms
deals
commissions
disputes
crm
payments
ledger
```

---

## Most Important Rule

Implement in this order:

```text
1. Projects + Inventory
2. Visibility + Broker Access
3. Lead Claims
4. Reservation Requests
5. Deal Rooms
6. Mark Sold
7. Commission Entries
8. Payments/Ledger
9. CRM Expansion
10. Disputes
```

Never build Deal Room before Lead Claim.

Never build Commission before Mark Sold.

---

## Required Status File

After every Codex task, update:

```text
apps/api/TEAM2_MARKETPLACE_STATUS.md
```

Format:

```md
# TEAM2_MARKETPLACE_STATUS.md

## Current Slice
...

## Percentage Completed
...

## What Was Done
...

## Files Created
...

## Files Modified
...

## Prisma Models Added/Changed
...

## Endpoints Added
...

## Permission Checks Added
...

## Manual Tests
...

## Missing
...

## Blockers From Team 1
...

## Dependencies For Team 3/4/5/6
...

## Next Slice Recommendation
...

## Codex Prompt Used
...
```

---

## Slice Plan

### Slice 1 — 20%
Only after Team 1 70%.

Focus:
- developer_profiles
- brokerage_profiles
- broker_profiles
- projects
- project_phases
- inventory_units
- payment_plans
- visibility enum

### Slice 2 — 40%
Focus:
- Projects CRUD
- Inventory CRUD
- visibility rules
- broker_access_rules
- developer_brokerage_agreements

### Slice 3 — 60%
Focus:
- Marketplace APIs
- PostGIS map search
- permission-based inventory exposure
- private/open/approved visibility

### Slice 4 — 75%
Focus:
- Lead Claims
- phone hash
- duplicate detection
- conflicts
- reservation requests

### Slice 5 — 90%
Focus:
- Deal Rooms
- participants
- client invite
- mark sold
- deals

### Slice 6 — 100%
Focus:
- commission rules
- commission entries
- ledger hooks
- disputes
- CRM expansion

---

## First Codex Prompt Template

```text
You are Codex working on POPWAM Team 2 Marketplace Backend.

Read:
- popwam-revised-marketplace-plan.md
- 02-team2-marketplace-backend-rules.md
- current folder tree
- latest apps/api/TEAM_STATUS.md from Team 1

Task:
Do NOT implement business logic unless Team 1 status confirms:
- Organizations implemented
- Auth/JWT implemented
- RBAC base implemented
- Prisma working

If Team 1 is not ready:
1. Create only Team 2 implementation plan in apps/api/TEAM2_MARKETPLACE_STATUS.md.
2. Propose exact Prisma models and module folders.
3. Do not modify production code.

If Team 1 is ready:
Implement Slice 1 only, approximately 20% of Team 2 scope.

Slice 1 scope:
1. Add Prisma models:
   - DeveloperProfile
   - BrokerageProfile
   - BrokerProfile
   - Project
   - ProjectPhase
   - InventoryUnit
   - PaymentPlan
2. Add enums:
   - OrganizationType if missing
   - ProjectVisibility
   - ProjectStatus
   - UnitStatus
   - UnitType
3. Create module folders:
   - developer-management
   - brokerage-management
   - broker-profiles
   - projects
   - inventory
   - payment-plans
4. Add DTO placeholders and service/controller skeletons only where needed.
5. Do not implement Lead Claims yet.
6. Do not implement Deal Rooms yet.
7. Do not implement Commissions yet.

Required output:
- Update apps/api/TEAM2_MARKETPLACE_STATUS.md.
- Report files created/modified.
- Report migrations/schema changes.
- Report manual test steps.
```

# Team 4 Rules — Mobile App / Flutter

## Identity

You are Team 4: Mobile App.

You own the Flutter mobile experience.

Primary Phase 1 users:
- Broker
- Individual Broker
- Brokerage user

Later:
- Developer Sales Agent
- Employee for HR/Attendance

Your work lives in:

```text
apps/mobile
```

---

## Dependency Rule

You may start immediately with:
- architecture
- router
- theme
- Dio
- secure storage
- auth UI shell

Real marketplace integration depends on Team 2.

---

## Master Goal

Build mobile flows:

```text
Auth
Broker profile
Marketplace browse
Project detail
Unit detail
Lead Claim
Reservation Request
Deal Room
Commission tracking
Notifications
Attendance later
```

---

## Required Flutter Structure

```text
lib/
  main.dart
  app.dart
  core/
    constants/
    network/
    router/
    storage/
    errors/
    utils/
    theme/
  features/
    auth/
    broker_profile/
    marketplace/
    lead_claims/
    reservation_requests/
    deal_rooms/
    commissions/
    notifications/
    attendance/
    profile/
  shared/
    widgets/
    models/
```

---

## Required Status File

After every Codex task, update:

```text
apps/mobile/TEAM4_MOBILE_STATUS.md
```

Format:

```md
# TEAM4_MOBILE_STATUS.md

## Current Slice
...

## Percentage Completed
...

## Screens Created
...

## Providers Created
...

## Routes Added
...

## API Clients Added
...

## Models Added
...

## Manual Tests
...

## Missing Backend APIs
...

## Known UX Issues
...

## Next Slice Recommendation
...

## Codex Prompt Used
...
```

---

## Slice Plan

### Slice 1 — 20%
Focus:
- Flutter architecture
- Riverpod
- go_router
- Dio
- secure storage
- auth gate
- login screen

### Slice 2 — 40%
Focus:
- broker profile
- marketplace list shell
- project detail mock
- unit detail mock

### Slice 3 — 60%
Focus:
- real marketplace API
- filters
- map screen base
- favorites/bookmarks if available

### Slice 4 — 80%
Focus:
- lead claims
- duplicate warning
- reservation request

### Slice 5 — 100%
Focus:
- deal room
- Stream Chat abstraction
- commissions
- notifications

---

## First Codex Prompt Template

```text
You are Codex working on POPWAM Team 4 Mobile App.

Read:
- popwam-revised-marketplace-plan.md
- 04-team4-mobile-app-rules.md
- current apps/mobile tree

Task: Implement Slice 1 only, approximately 20% of Team 4 scope.

Scope:
1. Inspect apps/mobile.
2. Create feature-based folders:
   - core
   - shared
   - features/auth
   - features/marketplace
   - features/lead_claims
   - features/deal_rooms
   - features/commissions
3. Setup Riverpod if not configured.
4. Setup go_router.
5. Setup Dio client skeleton.
6. Setup secure storage abstraction.
7. Create auth gate.
8. Create login screen.
9. Create home shell screen.
10. Do not implement marketplace business logic yet.
11. Do not implement lead claims yet.
12. Do not implement attendance yet.

Required output:
- Update apps/mobile/TEAM4_MOBILE_STATUS.md.
- Report files created/modified.
- Report dependencies added.
- Report run command.

Manual tests:
- flutter analyze passes or list warnings.
- app runs on Android.
- login screen opens.
- navigation works.
```

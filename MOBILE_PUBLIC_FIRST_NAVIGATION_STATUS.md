# Mobile Public-First Navigation Status

Date: 2026-06-28

## Summary

The mobile app now opens to the public marketplace instead of forcing login. Authentication is optional for browsing, and protected workspace actions route guests to login with a return target.

## Initial Route Behavior

- Initial route: `/marketplace/projects`.
- Signed-out users stay in the public marketplace.
- Public project/unit detail aliases are available at `/marketplace/projects/:id` and `/marketplace/units/:id`.
- Existing detail routes `/projects/:id` and `/units/:id` remain available.

## Public Guest Behavior

- Guests can browse projects, units, map search, project detail, unit detail, public conversation links, and profile/settings.
- Login is available from the Profile tab.
- Login screen includes `Continue as guest`.
- Lead-claim/request actions from project/unit detail send guests to login with a protected return route.

## Role-Based Routing

Central policy: `apps/mobile/lib/core/router/auth_route_policy.dart`.

- `PLATFORM_*`: best available mobile workspace is CRM leads.
- `DEVELOPER_*`: best available mobile workspace is CRM leads.
- `BROKERAGE_*` and `BROKER`: best available mobile workspace is lead claims.
- `CLIENT`, `USER`, `VISITOR`, or unknown public users: public marketplace.
- Permission hints are preferred when present; role fallback is used when permissions are absent.

Exact platform/developer/brokerage dashboard screens do not exist in mobile yet, so routing uses existing workspace screens instead of creating placeholder dashboards.

## Permission Gating

Protected workspace routes require a signed-in session:

- CRM leads
- Marketplace CRM leads
- CRM conversations
- Broker profile
- Lead claims
- Reservation requests
- Deal rooms
- Deals
- Commissions

Profile shortcuts are hidden unless the signed-in user role or permissions indicate access.

## Verification

- `flutter gen-l10n`: passed.
- `flutter analyze`: passed.
- `flutter test`: passed.

## Remaining Manual QA

Device/emulator QA was not run in this slice. Remaining checks:

- signed-out launch opens marketplace
- project detail works signed out
- developer login lands on CRM leads
- brokerage login lands on lead claims
- logout returns to marketplace
- wrong password stays on login with error
- expired/stale token clears session and returns to marketplace
- Arabic RTL and French LTR on device

# Pre-Demo Readiness Report

## Stage 8 Addendum — 2026-06-19

Stage 8 marketplace governance is implemented and passes API unit/build plus both web build/lint gates. The demo should not rely on Stage 8 persistence until the additive migration has been applied and the new database-backed e2e suite has passed in staging. The e2e command was attempted, but 22 database-backed suites stopped at their first Prisma query with `ECONNREFUSED`; local PostgreSQL at `localhost:5432` and local browser-smoke services were unavailable during this verification pass.

New demo-safe UI after migration verification:

- Platform company creation and copyable invitations.
- Developer project selling-mode and authorization controls.
- CRM lead visitor behavior summaries.

Privacy guardrails: hashed invite/visitor keys, redacted token paths, bounded event payloads, no browser fingerprinting, no raw analytics read endpoint, and existing lead/project scope checks.

---

## Date

2026-06-01

## Overall Readiness

Current status: demo-safe for smoke-tested flows, with the strict Public Web staging gate now clean.

The Stage 4 backend freeze remains healthy, Admin Web builds and lints successfully, Mobile static analysis passes, Public Web lints and builds successfully, current navigation surfaces have been visually stabilized, and both Stage 2 and Stage 4 browser smoke suites pass.

## Backend Readiness

Status: ready for demo/staging prep.

- `pnpm qa:stage4:backend` passed.
- API build passed.
- API unit tests passed: 11 suites, 26 passed, 1 skipped.
- API e2e tests passed: 22 suites, 29 passed.
- Known non-failing `pg` deprecation warnings still appear during e2e.
- Stage 4 backend scope remains frozen at 100%.

## Admin Web Readiness

Status: ready for demo prep.

- `pnpm --filter admin-web build` passed.
- `pnpm --filter admin-web lint` passed.
- Stage 4 browser smoke passed for developer and platform operations pages.
- Admin browser flows in Stage 2 smoke passed before the public flow failed.

## Public Web Readiness

Status: demo-safe for smoke-tested flows.

- `pnpm --filter public-web build` passed after the missing `@/lib/utils` import was removed from the public bottom navigation component.
- `pnpm test:stage2:browser` passed, including the public contact and conversation reply route.
- `pnpm --filter public-web lint` passed after minimal lint-only fixes in public project/contact/lead files.
- Public mobile header and bottom navigation were visually stabilized so desktop header links no longer compete with the mobile bottom nav.

## Mobile Readiness

Status: ready for static-analysis gate.

- `flutter analyze` was run in `apps/mobile`.
- Result: no issues found.
- Flutter reported that a newer Flutter version is available; this is not a demo blocker.

## Browser Smoke Result

Environment:

- `127.0.0.1:3000` reachable.
- `127.0.0.1:3203` reachable.
- `127.0.0.1:3205` reachable.

Results:

- `pnpm test:stage4:browser`: passed, 2 tests.
- `pnpm test:stage2:browser`: passed, 5 tests.
- `pnpm test:stage4:browser`: passed, 2 tests.
- After UI rebuilds, local smoke servers were restarted on `3000`, `3203`, and `3205` to avoid stale Next chunk errors before final browser-smoke verification.

## Known Blockers

- None for the smoke-tested demo and strict staging gate covered in this pass.

## Non-Blocking Issues

- Physical iOS/Android safe-area behavior still needs device QA before production.
- Older non-nav page content still has some hardcoded color utility classes and can receive a broader token migration later.
- Real provider integrations remain out of scope.
- Worker execution remains design-only.

## Demo-Safe Flows

- Admin login and role-based navigation.
- Developer operations overview and module pages.
- Platform operations overview pages.
- Operations backend summaries, activities, reports, exports, import jobs, RBAC, and rate limits.
- Admin CRM/import-export flows covered by browser smoke.
- Mobile app static-analysis gate.

## Flows Not Ready For Demo

- Real payment, payroll, e-signature, provider ad publishing, camera streaming, DVR, and AI video flows.
- Background import worker execution.
- XLSX/PDF/Word/OCR/AI import workflows.
- Production deployment.

## Recommended Demo Script

1. Start from Admin Web and log in as the developer demo account.
2. Show dashboard, projects, CRM, conversations, and operations overview.
3. Open HR/accounting/legal/ads/cameras operations pages.
4. Demonstrate backend-supported operations reports and exports only where seeded data is present.
5. Switch to platform demo account and show platform operations overview and organization-level visibility.
6. Show Public Web project browse, lead/contact options, Start Chat, and public conversation reply route.

## Stop Conditions

Stop or delay the demo if:

- Public Web build fails.
- API health fails.
- Admin Web cannot log in.
- Stage 4 operations browser smoke fails.
- Stage 2 public browser smoke fails.
- Any export or report visibly exposes private auth tokens, stream credentials, provider secrets, or raw legal/camera sensitive fields.

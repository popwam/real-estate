# QA_FULL_PLATFORM_STATUS.md

## QA Scope

Full platform foundation smoke audit for:

- `apps/api`
- `apps/admin-web`
- `apps/mobile`
- `apps/public-web`
- `workers`
- `infra`

No product features were added. No business logic was changed.

## Environment Checklist

| Item | Status | Notes |
| --- | --- | --- |
| Node version | PASS | `v24.15.0` |
| pnpm version | PASS | `11.1.2` |
| Docker/Postgres status | PASS | `popwam-postgres` is up; `pg_isready` reports accepting connections. |
| Docker Redis/RabbitMQ status | NOT CONFIGURED | `infra/docker/docker-compose.dev.yml` currently defines Postgres/PostGIS only. Workers keep RabbitMQ disabled unless env enables it. |
| `DATABASE_URL` | PASS | API default: `postgresql://postgres:postgres@localhost:5432/popwam?schema=public`; no root `.env` override found. |
| API URL | PASS | API default port is `3000`; local URL is `http://localhost:3000`. |
| Admin Web API URL | WARN | Code reads `NEXT_PUBLIC_API_BASE_URL` with fallback `http://localhost:3000`; `.env.local` currently sets `NEXT_PUBLIC_API_URL=http://localhost:3000`. Local fallback still works. |
| Public Web env | PASS | `.env.example` documents `NEXT_PUBLIC_SITE_URL` and optional tracking placeholders; all tracking disabled unless values exist. |
| Mobile API base URL | PASS | `API_BASE_URL` Dart define, defaulting to `http://10.0.2.2:3000` for Android emulator. |

## Build/Test Commands

### API

- `pnpm.cmd --filter api build`
  - PASS
- `pnpm.cmd --filter api test --runInBand`
  - PASS: 7 suites, 15 tests
- `pnpm.cmd --filter api test:e2e --runInBand`
  - PASS: 7 suites, 7 tests
  - WARN: repeated `pg` deprecation warning during e2e.

### Admin Web

- `pnpm.cmd --filter admin-web build`
  - PASS
- `pnpm.cmd --filter admin-web lint`
  - PASS

### Public Web

- `pnpm.cmd --filter public-web build`
  - PASS
  - Confirmed `/robots.txt` and `/sitemap.xml` in build output.

### Mobile

- From `apps/mobile`: `flutter analyze`
  - PASS: no issues found

### Workers

- `node workers\notification-worker\src\index.js health`
  - PASS
- `node workers\notification-worker\src\index.js sample deal-marked-sold`
  - PASS: console email, push, SMS
- `node workers\notification-worker\src\index.js sample commission-approved`
  - PASS: console email, push, SMS

## Seed/Demo Data Plan

Recommended demo accounts for repeatable local demos:

| Account | Organization Type | Role | Purpose |
| --- | --- | --- | --- |
| `platform.admin@popwam.local` | `PLATFORM` | `platform_admin` or platform owner equivalent | Verification review, platform dashboards, cross-org QA. |
| `developer.owner@popwam.local` | `DEVELOPER` | `developer_owner` | Create projects, inventory, commission rules, approve reservations, finalize deals. |
| `brokerage.owner@popwam.local` | `BROKERAGE` | `brokerage_owner` | Brokerage dashboard, deal/commission visibility, broker management. |
| `broker.user@popwam.local` | `BROKERAGE` | `broker` | Marketplace browse, lead claim, reservation request, deal room access, read-only deals/commissions. |

Current e2e tests create timestamped runtime users and organizations. For a stable live demo, add a dev-only seed script that creates the accounts above, an approved developer organization, an approved brokerage organization, one active open-marketplace project, one available unit, one active commission rule, and one broker user.

## Full Flow Smoke Test

| Flow Step | Status | Verification Source |
| --- | --- | --- |
| Platform login | PASS | API auth e2e creates and uses platform account; admin-web build includes platform routes. |
| Developer registration/login | PASS | API e2e registers/logs in developer users. |
| Brokerage registration/login | PASS | API e2e registers brokerage organization and broker user. |
| Developer creates project | PASS | Team 2 e2e creates project through `POST /projects`. |
| Developer creates inventory unit | PASS | Team 2 e2e creates unit through `POST /inventory/units`. |
| Project made `OPEN_MARKETPLACE` | PASS | Team 2 e2e creates active open-marketplace project. |
| Brokerage/broker sees project | PASS | Team 2 e2e checks `GET /marketplace/projects/:id` as broker. |
| Broker creates lead claim | PASS | Team 2 e2e uses `POST /lead-claims`. |
| Broker creates reservation request | PASS | Team 2 e2e uses `POST /reservation-requests`. |
| Developer approves reservation | PASS | Team 2 e2e uses `PATCH /reservation-requests/:id/approve`. |
| Developer creates deal room | PASS | Team 2 e2e uses `POST /deal-rooms/from-reservation/:id`. |
| Message added to deal room | PASS | Team 2 e2e uses `POST /deal-rooms/:id/messages`. |
| Commission rule created | PASS | Team 2 e2e uses `POST /commission-rules`. |
| Deal finalized / sold | PASS | Team 2 e2e uses `POST /deals/from-deal-room/:dealRoomId`. |
| Unit becomes `SOLD` | PASS | Team 2 e2e checks inventory unit status. |
| Commission entry created | PASS | Team 2 e2e verifies commission entries count and visibility. |
| Commission approved/rejected | PASS | Team 2 e2e approves one commission and rejects another. |
| Worker sample notifications run | PASS | Deal sold and commission approved samples ran successfully. |
| Public web builds and routes exist | PASS | Public build passed; `/robots.txt` and `/sitemap.xml` route output confirmed. |
| Mobile analyze passes | PASS | `flutter analyze` reported no issues. |
| Live browser admin flow | MANUAL PENDING | Build/lint pass, but role-by-role browser login and UI clickthrough were not run in this command-only QA pass. |
| Live mobile emulator flow | MANUAL PENDING | Static analysis passes; emulator login/clickthrough still needs a running API and device session. |

## Issues Found

### Issue 1: Admin Web API Env Var Name Mismatch

- Severity: Low
- File/path:
  - `apps/admin-web/.env.local`
  - `apps/admin-web/src/lib/api.ts`
- Exact cause:
  - `.env.local` defines `NEXT_PUBLIC_API_URL`.
  - API client code reads `NEXT_PUBLIC_API_BASE_URL`.
  - Local behavior still works because the code falls back to `http://localhost:3000`.
- Suggested fix:
  - Rename `.env.local` key to `NEXT_PUBLIC_API_BASE_URL`, or update the API client to accept both names during transition.
- Fixed or not:
  - Fixed in Phase 1 Final Polish. `apps/admin-web/src/lib/api.ts` now supports `NEXT_PUBLIC_API_BASE_URL`, then legacy `NEXT_PUBLIC_API_URL`, then `http://localhost:3000`.

### Issue 2: API E2E Emits `pg` Deprecation Warning

- Severity: Low
- File/path:
  - Observed while running `pnpm.cmd --filter api test:e2e --runInBand`.
  - Likely related to Prisma/Postgres adapter query flow during e2e app/database setup.
- Exact cause:
  - Runtime output repeats: `Calling client.query() when the client is already executing a query is deprecated and will be removed in pg@9.0`.
  - Tests still pass.
- Suggested fix:
  - Trace with `node --trace-deprecation` in a focused follow-up and update the DB adapter/test setup if the warning points to local code.
- Fixed or not:
  - Not fixed. It is non-blocking for current QA.

### Issue 3: No Stable Demo Seed Script Yet

- Severity: Medium
- File/path:
  - `apps/api` demo/seed tooling
- Exact cause:
  - Current automated tests create timestamped throwaway data.
  - No single dev-only script currently seeds the exact platform/developer/brokerage/broker demo accounts required for a repeatable client walkthrough.
- Suggested fix:
  - Add a dev-only seed script after the account/password convention is approved.
- Fixed or not:
  - Fixed in Phase 1 Final Polish. Added `pnpm --filter api seed:demo` and `DEMO_LOGIN.md`.

## No-Go / Go Checklist

| Target | Decision | Reason |
| --- | --- | --- |
| Local demo | GO WITH PREP | Builds/tests pass. Needs stable demo seed data and running API/admin/mobile sessions. |
| Internal QA | GO | Automated API, web, mobile analyze, and worker checks pass; manual role-by-role UI QA can proceed. |
| Client demo | CONDITIONAL GO | Good for a foundation/mock demo after stable demo data is seeded and browser/mobile flows are manually rehearsed. Avoid presenting mock providers/forms as production integrations. |
| Production | NO-GO | Missing production provider integrations, queue/outbox delivery, stable lead/public APIs for public-web, production payments/ledger, observability, full security/load testing, and real domain/provider setup. |

## Final QA Summary

The foundation is coherent and buildable across backend, admin-web, public-web, mobile, and workers. The strongest automated coverage is in `apps/api/test/team2-marketplace-slice6.e2e-spec.ts`, which exercises the core marketplace lifecycle through sold inventory and commission state changes. Web and mobile passed static/build validation; live UI walkthroughs remain the main QA activity before any client-facing demo.

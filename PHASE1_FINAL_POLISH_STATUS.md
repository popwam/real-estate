# PHASE1_FINAL_POLISH_STATUS.md

## Current Phase

Phase 1 Final Polish

## What Was Fixed

- Fixed Admin Web API env compatibility.
  - Canonical env var: `NEXT_PUBLIC_API_BASE_URL`
  - Transitional fallback supported: `NEXT_PUBLIC_API_URL`
  - Final fallback remains `http://localhost:3000`
- Added idempotent dev-only API demo seed.
- Added root demo login/runbook documentation.
- Added local smoke script for API health, demo logins, `/auth/me`, marketplace projects, and admin env guidance.
- Documented Admin Web API env convention.

## Files Created

- `apps/api/src/demo/seed-demo.ts`
- `scripts/local-smoke.ps1`
- `DEMO_LOGIN.md`
- `PHASE1_FINAL_POLISH_STATUS.md`

## Files Modified

- `apps/api/package.json`
- `apps/admin-web/src/lib/api.ts`
- `apps/admin-web/README.md`
- `QA_FULL_PLATFORM_STATUS.md`

## Demo Seed Script

Command:

```powershell
pnpm --filter api seed:demo
```

Behavior:

- Dev-only local seed for Phase 1 demos.
- Uses the existing API password hashing service (`HashService` / scrypt format).
- Runs base RBAC permission seeding first.
- Idempotent: repeated runs update stable records instead of duplicating the demo account/project/deal chain.
- Does not print password hashes.
- Does not add production logic or provider integrations.

Seeded data:

- approved platform organization
- approved developer organization
- approved brokerage organization
- platform owner, developer owner, brokerage owner, and broker users
- developer, brokerage, and broker profiles
- active open-marketplace project
- project phase
- one available unit for live browse demos
- one sold unit for completed deal demos
- active project payment plan
- active developer-brokerage agreement
- broker access rule
- active brokerage and broker commission rules
- completed demo chain:
  - client
  - lead
  - lead claim
  - approved reservation request
  - deal room
  - deal room participants
  - deal room message
  - sold deal
  - commission entries

## Demo Accounts

| Purpose | Email | Password | Organization Type | Role |
| --- | --- | --- | --- | --- |
| Platform owner | `ceo@popwam.com` | `30@@mmMM` | `PLATFORM` | `platform_owner` |
| Developer owner | `developer.demo@popwam.local` | `Demo@123456` | `DEVELOPER` | `developer_owner` |
| Brokerage owner | `brokerage.demo@popwam.local` | `Demo@123456` | `BROKERAGE` | `brokerage_owner` |
| Broker user | `broker.demo@popwam.local` | `Demo@123456` | `BROKERAGE` | `broker` |

## Commands Run

Seed and smoke:

- `pnpm.cmd --filter api seed:demo`
  - PASS
- `pnpm.cmd --filter api seed:demo`
  - PASS on second run, confirming idempotent behavior
- `powershell -ExecutionPolicy Bypass -File scripts\local-smoke.ps1`
  - PASS against temporary local API process

Core checks:

- `pnpm.cmd --filter api build`
  - PASS
- `pnpm.cmd --filter api test --runInBand`
  - PASS: 7 suites, 15 tests
- `pnpm.cmd --filter api test:e2e --runInBand`
  - PASS: 7 suites, 7 tests
- `pnpm.cmd --filter admin-web build`
  - PASS
- `pnpm.cmd --filter admin-web lint`
  - PASS
- `pnpm.cmd --filter public-web build`
  - PASS
- `flutter analyze` from `apps/mobile`
  - PASS: no issues found
- `node workers\notification-worker\src\index.js health`
  - PASS
- `node workers\notification-worker\src\index.js sample deal-marked-sold`
  - PASS
- `node workers\notification-worker\src\index.js sample commission-approved`
  - PASS
- `git diff --check -- apps/api apps/admin-web scripts DEMO_LOGIN.md`
  - PASS

## Smoke Results

Local smoke script results:

- API health: PASS
- Platform login: PASS
- Developer login: PASS
- Brokerage login: PASS
- Broker login: PASS
- `GET /auth/me`: PASS for all demo accounts
- Broker `GET /marketplace/projects`: PASS
- Admin env canonical check: PASS with `NEXT_PUBLIC_API_BASE_URL=http://localhost:3000`

Note: the smoke run returned 39 marketplace projects because the local database already contains previous automated test data. For a clean client demo, start from a fresh local database or add a separate demo reset task.

## Remaining Known Issues

- API e2e still emits a non-failing `pg` deprecation warning about `client.query()` concurrency. Tests pass.
- The local database may contain previous QA/e2e data unless reset before a demo.
- Admin and mobile live UI clickthroughs still need manual rehearsal with running API/web/mobile sessions before a client demo.
- Production integrations remain intentionally absent:
  - real email/SMS/push providers
  - production queue/outbox
  - payments/ledger
  - Cloudflare/DNS APIs
  - public lead capture APIs
  - provider observability and alerting

## Ready For

| Target | Status | Notes |
| --- | --- | --- |
| Local demo | READY | Run Postgres, db push, `seed:demo`, API, Admin Web, Public Web, and optional Mobile. |
| Internal QA | READY | Build/test/analyze/smoke pass. Manual UI scripts can proceed. |
| Client demo | READY WITH REHEARSAL | Use seeded data and rehearse browser/mobile flows first. Keep production-missing integrations framed as placeholders. |
| Production | NOT READY | Production dependencies remain outside Phase 1 polish scope. |

## Next Recommended Phase

Stage 2 — Domains/Public APIs + CRM Core

Recommended Stage 2 entry points:

- real public marketplace and landing page APIs
- approved public lead capture contract
- domain verification backend and Cloudflare/DNS integration
- CRM core pipeline/follow-up activity model
- production notification outbox/provider design

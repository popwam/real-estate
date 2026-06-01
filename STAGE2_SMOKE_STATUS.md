# STAGE2_SMOKE_STATUS.md

## Current Phase

Stage 2 Integration Smoke — Import/Export + CRM + Conversations

## Environment

- Node: `v24.15.0`
- pnpm: `11.1.2` via `pnpm.cmd`
- PostgreSQL: `popwam-postgres` running; `pg_isready` PASS
- API URL: `http://localhost:3000`
- Admin Web URL: `http://127.0.0.1:3203`
- Public Web URL: `http://127.0.0.1:3205`
- Env checked in shell:
  - `NEXT_PUBLIC_API_BASE_URL`: not set globally
  - `NEXT_PUBLIC_API_URL`: not set globally
  - `DATABASE_URL`: not set globally
  - `PUBLIC_LEAD_RATE_LIMIT_WINDOW_SECONDS`: not set globally
  - `PUBLIC_LEAD_RATE_LIMIT_MAX`: not set globally
- Temporary dev servers were started with `NEXT_PUBLIC_API_BASE_URL=http://localhost:3000` and stopped after smoke.

## Commands Run

- `node -v` — PASS, `v24.15.0`
- `pnpm -v` — blocked by PowerShell execution policy
- `pnpm.cmd -v` — PASS, `11.1.2`
- `docker ps --format "{{.Names}} {{.Status}}"` — PASS, `popwam-postgres` running
- `docker exec popwam-postgres pg_isready -U postgres -d popwam` — PASS
- `pnpm.cmd exec prisma validate --config prisma/prisma.config.ts` from `apps/api` — PASS
- `pnpm.cmd exec prisma generate --config prisma/prisma.config.ts` from `apps/api` — PASS
- `pnpm.cmd exec prisma db push --config prisma/prisma.config.ts` from `apps/api` — PASS, database already in sync
- `pnpm.cmd --filter api build` — PASS
- `pnpm.cmd --filter api test --runInBand` — PASS, 7 suites / 15 tests
- `pnpm.cmd --filter api test:e2e --runInBand` — PASS, 12 suites / 12 tests; known non-failing `pg` deprecation warning emitted
- `pnpm.cmd --filter admin-web build` — PASS
- `pnpm.cmd --filter admin-web lint` — PASS
- `pnpm.cmd --filter public-web build` — PASS
- `pnpm.cmd --filter api seed:demo` — PASS
- `powershell -ExecutionPolicy Bypass -File scripts\local-smoke.ps1` — PASS
- Started temporary API/Admin/Public dev servers for route smoke — PASS
- Direct Stage 2 API smoke script for import/export, CRM, conversations, public contacts — PASS
- Route-level HTTP smoke for Admin/Public pages — PASS
- Stopped temporary listeners on ports `3000`, `3203`, and `3205` — PASS

## Smoke Results

### API/Auth

- `GET /health` returned `status: ok`.
- Platform login passed for `ceo@popwam.com`.
- Developer login passed for `developer.demo@popwam.local`.
- Brokerage login passed for `brokerage.demo@popwam.local`.
- Broker login passed for `broker.demo@popwam.local`.
- `GET /auth/me` passed for all demo accounts via `scripts/local-smoke.ps1`.
- Broker marketplace project list returned data.

### Import/Export Backend

- Developer `POST /import-export/project-inventory/preview` passed with one valid row and one invalid row.
- Preview returned `jobId`, `validRows: 1`, `invalidRows: 1`, and row-level errors.
- Confirmed preview did not create the project before commit.
- Developer `POST /import-export/jobs/:id/commit` passed and created/updated project + inventory data.
- Re-commit returned `alreadyCommitted: true` and did not duplicate records.
- Developer exports for projects, inventory, and account passed.
- Account export privacy scan found no `passwordHash`, refresh token, token hash, audit log, or domain verification token keys.
- Brokerage import preview was blocked with `403`.
- Brokerage export returned organization-scoped data.

### Admin Import/Export UI

- `pnpm.cmd --filter admin-web build` confirmed routes:
  - `/developer/import-export`
  - `/developer/import-export/jobs`
  - `/developer/import-export/jobs/[id]`
  - `/developer/import-export/export`
  - `/platform/import-export/jobs`
  - `/platform/import-export/jobs/[id]`
  - `/platform/import-export/export`
  - `/brokerage/import-export/export`
- With Admin Web dev server running, route-level HTTP checks returned `200` for developer, brokerage, and platform import/export pages.
- No browser automation tool was available in this session, so form clicking/download verification remains a manual browser step.

### Public Contact Options

- Public project detail route returned `200`.
- Direct `POST /public/leads` smoke passed for `CALL`, `CHAT`, and `WHATSAPP`.
- Each non-duplicate response echoed the requested `preferredContactMethod`.
- `WHATSAPP` response included a safe `whatsappUrl` from organization website settings.
- `CHAT` did not fabricate a fake API-mode conversation link; no share token was returned directly from public lead submission.
- Code inspection confirmed honeypot fields remain hidden/empty for normal users.
- Code inspection confirmed public form `429` handling maps to friendly retry copy.

### CRM Backend

- `PATCH /public-leads/:id/convert-placeholder` created CRM client/lead data.
- Conversion idempotency passed; repeated conversion returned the same CRM lead id.
- Developer and platform `GET /crm/leads` included the converted lead.
- Broker `GET /crm/leads/marketplace` included the converted lead.
- First broker claim via `POST /crm/leads/:id/claim` returned `CLAIMED`.
- Second claim from another user returned `409`.
- Claimed lead appeared unavailable/masked to another user.
- `POST /conversations/from-crm-lead/:crmLeadId` created/opened a conversation.
- `GET /conversations` and `GET /conversations/:id` passed.
- `POST /conversations/:id/messages` and `GET /conversations/:id/messages` passed.
- `GET /conversations/by-token/:shareToken` returned public-safe data.
- Public token response privacy scan found no internal organization id, CRM lead id, client id, claimed broker ids, deal id, or commission id keys.

### Admin CRM UI

- `pnpm.cmd --filter admin-web build` confirmed CRM routes.
- With Admin Web dev server running, route-level HTTP checks returned `200` for:
  - `/brokerage/crm/marketplace-leads`
  - `/brokerage/crm/leads`
  - `/brokerage/conversations`
  - `/developer/crm/leads`
  - `/developer/conversations`
  - `/platform/crm/leads`
  - `/platform/conversations`
- API smoke verified the same backend workflows that the Admin CRM UI calls.
- Full browser login/click/message-composer interaction remains a manual browser step because browser automation was not available.

### Public Conversation Route

- Public Web build confirmed `/c/[token]`.
- With Public Web dev server running, `/c/{realShareToken}` returned `200`.
- API token response returned public-safe conversation summary, participants, and messages.
- Public Web `/c/[token]` is read-only; no unauthenticated posting UI was present.

## Issues Found

### Low — Environment

- Symptom: `pnpm -v` failed in PowerShell because `pnpm.ps1` is blocked by execution policy.
- Likely cause: Windows PowerShell script execution policy.
- Files involved: none.
- Fix applied: none needed; used `pnpm.cmd` consistently.
- Recommended fix: document `pnpm.cmd` for Windows smoke commands or adjust local execution policy intentionally.

### Low — API Tests

- Symptom: full API e2e emits repeated non-failing `pg` deprecation warnings about `client.query()` concurrency.
- Likely cause: existing Prisma/PG adapter behavior already documented in prior statuses.
- Files involved: API database/test runtime; no specific Stage 2 smoke regression identified.
- Fix applied: none.
- Recommended fix: investigate async query sequencing before upgrading to `pg@9`.

### Low — Browser Automation Coverage

- Symptom: route-level Admin/Public HTTP smoke passed, but no real browser automation was available for login, form interaction, copy/download, or composer clicks.
- Likely cause: no browser automation tool configured for this QA run.
- Files involved: none.
- Fix applied: none.
- Recommended fix: add Playwright smoke scripts for Admin Web and Public Web.

### Expected Dependency — Public Chat Start

- Symptom: `CHAT` public lead submissions do not return a conversation share token directly.
- Likely cause: backend currently creates conversation on authenticated conversion, not directly from unauthenticated public lead submit.
- Files involved: `apps/api/src/modules/public/public.service.ts`, `apps/api/src/modules/crm/crm-conversion.service.ts`, `apps/public-web/src/components/forms/public-lead-form.tsx`.
- Fix applied: none; current Public Web correctly shows success without fabricating API-mode links.
- Recommended fix: add an explicit public-safe start-chat response only after backend scope is approved.

## Fixes Applied

- No product code fixes were applied.
- No backend, Admin Web, Public Web, Mobile, Workers, or AI/DVR code was changed during this QA pass.

## Remaining Gaps

- No real WhatsApp Business API.
- No real chat provider.
- No WebSocket.
- No unauthenticated public message posting unless a future backend endpoint supports it.
- No XLSX binary parsing.
- No Word/PDF/OCR/AI import.
- No binary file upload or cloud storage upload.
- No background import worker.
- No CSV export formatting.
- No UI/UX redesign.
- No Playwright/browser-automated clickthrough yet.

## Ready For

| Target | Status | Notes |
| --- | --- | --- |
| Developer demo | READY WITH PREP | API/build/route smoke passed; run dev servers and use seeded data. |
| Internal QA | READY WITH PREP | Strong API coverage passed; add manual browser clickthrough or Playwright next. |
| Client demo | READY WITH PREP | Suitable for a guided demo if expected gaps are framed clearly. |
| Production | NOT READY | Provider integrations, production rate limiting, workers, browser e2e, and production hardening remain outstanding. |

## Next Recommendation

- Add Playwright smoke coverage for Admin Web login, import preview/commit/export, CRM claim/conversation message, Public Web contact options, and `/c/[token]`.
- Add backend-public coordination for a public-safe start-chat response that returns a share token when appropriate.
- Add CSV export formatting and import job filtering once backend contracts are extended.

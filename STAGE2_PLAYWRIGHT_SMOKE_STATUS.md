# STAGE2_PLAYWRIGHT_SMOKE_STATUS.md

## Current Phase

Stage 2 Playwright Browser Smoke

## What Was Added

- Added root Playwright browser smoke configuration for Stage 2 Admin Web and Public Web flows.
- Added a serial Chromium smoke spec that prepares deterministic CRM/conversation data through the local API, then drives browser UI flows.
- Added a root `pnpm test:stage2:browser` script.
- Added `@playwright/test` as a root dev dependency and installed the local Chromium browser bundle for this machine.
- Kept the work to QA automation and test tooling only.

## Files Created

- `playwright.stage2.config.ts`
- `tests/stage2-browser/stage2-browser-smoke.spec.ts`
- `STAGE2_PLAYWRIGHT_SMOKE_STATUS.md`

## Files Modified

- `package.json`
- `pnpm-lock.yaml`

## Tests Covered

- Developer Admin import/export flow:
  - login
  - paste JSON rows with one valid and one invalid row
  - preview import
  - verify summary and validation area
  - commit valid rows
  - open job detail when available
  - export projects and account JSON
  - verify account preview does not show private auth/token keys
- Brokerage/Broker Admin CRM flow:
  - login
  - open marketplace CRM leads
  - claim first available lead or accept friendly conflict state
  - open conversations
  - open conversation detail
  - send a text message when composer is available
- Developer Admin CRM flow:
  - login
  - open CRM lead inbox
  - open conversations
  - open conversation detail
  - verify messages and public share link areas
- Platform Admin overview:
  - login
  - open CRM leads, conversations, and import jobs pages
  - verify no app crash text appears
- Public Web contact flow:
  - open public projects
  - open first project detail or seeded project detail fallback
  - submit Request Call
  - submit Start Chat
  - submit WhatsApp
  - verify success/friendly messages and no mock chat link in API mode
  - open `/c/[token]`
  - verify read-only public conversation page

## Commands Run

- `pnpm.cmd add -D @playwright/test -w` - PASS.
- `pnpm.cmd --filter admin-web build` - PASS.
- `pnpm.cmd --filter public-web build` - PASS.
- `pnpm.cmd --filter api seed:demo` - PASS.
- Started temporary API server on `http://localhost:3000` - PASS.
- Initial Admin/Public dev-server start with `pnpm --filter ... dev -- -p ...` - FAILED because Next received `--` as a project directory argument.
- Restarted Admin/Public with `pnpm --filter ... exec next start -p ...` after production builds - PASS.
- Initial `pnpm.cmd test:stage2:browser` - FAILED because Playwright Chromium was not installed locally yet.
- `pnpm.cmd exec playwright install chromium` - PASS.
- `pnpm.cmd test:stage2:browser` - PASS, 5 tests.
- Stopped temporary listeners on ports `3000`, `3203`, and `3205` - PASS.

## Results

- PASS: `5 passed (16.2s)` in Chromium.
- Admin Web browser smoke passed for developer import/export, broker marketplace claim/conversation, developer CRM lead/conversation, and platform overview pages.
- Public Web browser smoke passed for project detail contact options and read-only `/c/[token]`.

## Bugs Found

- No product bugs were found.
- Test environment setup issue: Playwright Chromium was missing after adding the package. Fixed by running `pnpm.cmd exec playwright install chromium`.
- Test environment setup issue: the first Admin/Public `next dev` launch command forwarded `--` in a way Next treated as a directory. Final smoke used production `next start` from the already-built apps.
- Selector hardening needed in the smoke spec for repeated text such as `Valid rows`, `Conversation summary`, and duplicated public `Register interest` sections. Fixed in test code only.

## Fixes Applied

- No product fixes applied.
- Test-only fixes were applied to use stricter selectors and production built servers for the final smoke run.

## Remaining Manual Checks

- Confirm downloaded JSON file contents manually if browser download persistence is required.
- Repeat the suite against production-like env vars before any client demo.
- The test clicks the export flow and verifies the Download JSON button; it does not persist and inspect the downloaded file.
- The WhatsApp smoke verifies the frontend success state and safely handles the popup; it does not test a real WhatsApp provider.
- The public chat smoke verifies that API mode does not show a mock link and separately verifies a real `/c/[token]` created through the authenticated CRM path.

## Next Recommendation

- Add this smoke command to the local QA checklist after API/Admin/Public dev servers and demo seed are running.
- Add optional Playwright webServer orchestration later if the team wants a single command to start API, Admin Web, and Public Web automatically.

## Re-run After Public Chat Token

### Commands Run

- `pnpm.cmd --filter api build` - PASS.
- `pnpm.cmd --filter api test:e2e --runInBand` - FIRST RUN FAILED because PostgreSQL was restarting/shutting down mid-suite (`57P03: the database system is shutting down`), not because of a product assertion.
- `docker ps --format "{{.Names}} {{.Status}}"` - PASS, `popwam-postgres` was running again.
- `docker exec popwam-postgres pg_isready -U postgres -d popwam` - PASS.
- `pnpm.cmd --filter api test:e2e --runInBand` - PASS, 14 suites / 14 tests; known non-failing `pg` deprecation warnings still emitted.
- `pnpm.cmd --filter admin-web build` - PASS.
- `pnpm.cmd --filter public-web build` - PASS.
- `pnpm.cmd --filter api seed:demo` - PASS.
- Restarted temporary API/Admin/Public servers on ports `3000`, `3203`, and `3205` - PASS.
- Initial Admin/Public start command with forwarded `-- -p` did not bind ports; restarted with `pnpm.cmd --filter <app> exec next start -p <port>` - PASS.
- `pnpm.cmd test:stage2:browser` - PASS, 5 tests.
- Stopped temporary listeners on ports `3000`, `3203`, and `3205` - PASS.

### Test Result

- PASS: `5 passed (20.5s)` in Chromium.
- Existing coverage remained intact for:
  - developer import/export preview, commit, and export
  - brokerage/broker CRM claim and conversation message flow
  - developer CRM lead and conversation views
  - platform CRM/conversation/import-export routes
  - Public Web Call, Chat, WhatsApp, and `/c/[token]` flows

### Public Start Chat Result

- Public Web Start Chat now showed real API-mode controls:
  - `Open conversation`
  - `Copy link`
- The smoke extracted the returned `href` and asserted it matched `/c/{token}`.
- The smoke asserted the link did not contain `mock-chat`.
- Opening the returned `/c/{token}` rendered the public conversation page.
- The conversation page rendered as read-only with no `Send` or `Reply` button.

### Bugs Found / Fixed

- No product bugs were found.
- Test-only update: `tests/stage2-browser/stage2-browser-smoke.spec.ts` now requires the real API-mode chat link, opens it, and verifies the read-only public conversation route.
- Environment issue only: the first full API e2e run failed while PostgreSQL was restarting. The immediate rerun after `pg_isready` passed.
- Environment quirk repeated: `next start` through pnpm did not accept the forwarded `-- -p` form; the smoke used the known-good `pnpm.cmd --filter <app> exec next start -p <port>` command.

### Remaining Gaps

- No unauthenticated public message posting.
- No real WhatsApp Business API.
- No real chat provider.
- No WebSocket.
- Downloaded JSON file contents are still not persisted/inspected by Playwright.
- Production-like env-var smoke remains a pre-demo/pre-release checklist item.

## Re-run After Public Conversation Reply UI

### Commands Run

- `pnpm.cmd --filter api build` - PASS.
- `pnpm.cmd --filter api test:e2e --runInBand` - PASS, 15 suites / 15 tests; known non-failing `pg` deprecation warnings still emitted.
- `pnpm.cmd --filter admin-web build` - PASS.
- `pnpm.cmd --filter public-web build` - PASS.
- `pnpm.cmd --filter api seed:demo` - PASS.
- Confirmed ports `3000`, `3203`, and `3205` were free before server start - PASS.
- Started temporary API/Admin/Public servers on ports `3000`, `3203`, and `3205` - PASS.
- `pnpm.cmd test:stage2:browser` - PASS, 5 tests.
- Stopped temporary listeners on ports `3000`, `3203`, and `3205` - PASS.

### Test Result

- PASS: `5 passed (19.6s)` in Chromium.
- Existing coverage remained intact for:
  - developer import/export preview, commit, and export
  - brokerage/broker CRM claim and conversation message flow
  - developer CRM lead and conversation views
  - platform CRM/conversation/import-export routes
  - Public Web Call, Chat, WhatsApp, Start Chat, and `/c/[token]` flows

### Public Reply Composer Result

- Public Web Start Chat showed real API-mode controls:
  - `Open conversation`
  - `Copy link`
- The smoke extracted the returned `href` and asserted it matched `/c/{token}`.
- The smoke asserted the link did not contain `mock-chat`.
- Opening the returned `/c/{token}` rendered the public conversation page.
- The reply composer was visible for the `OPEN` conversation.
- The smoke filled `senderName` and a unique message body.

### Message Posting Result

- Clicking `Send reply` posted through the public token-scoped endpoint.
- The page showed `Message sent.`
- The unique smoke reply appeared in the message timeline.
- The smoke asserted the public page did not visibly expose private keys such as `organizationId`, `crmLeadId`, `clientId`, or `claimedByBrokerUserId`.
- A seeded real `/c/{shareToken}` route also rendered with the reply composer visible for an open conversation.

### Bugs Found / Fixed

- No product bugs were found.
- Test-only update: `tests/stage2-browser/stage2-browser-smoke.spec.ts` now verifies the public reply composer, sends a public token reply, and checks that the new message appears.

### Remaining Gaps

- No real WhatsApp Business API.
- No real chat provider.
- No WebSocket.
- No attachments, voice notes, or notification provider.
- Downloaded JSON file contents are still not persisted/inspected by Playwright.
- Closed/archived public token composer hiding is covered by product build/static behavior but not yet by this browser smoke.
- Production-like env-var smoke remains a pre-demo/pre-release checklist item.

### Next Recommendation

- Add a targeted Playwright setup helper that creates a closed/archived public conversation and verifies the composer is hidden.
- Add mobile `/c/:token` public reply UI after mobile deep-link UX is approved.
- Add production-grade shared rate limiting before production rollout.

## Re-run After Admin CRM Activity Timeline UI

### Commands Run

- `docker compose -f infra\docker\docker-compose.dev.yml up -d postgres` - PASS, `popwam-postgres` running.
- `docker exec popwam-postgres pg_isready -U postgres -d popwam` - PASS.
- `pnpm.cmd --filter api build` - PASS.
- `pnpm.cmd --filter api test:e2e --runInBand` - PASS, 16 suites / 16 tests; known non-failing `pg` deprecation warnings still emitted.
- `pnpm.cmd --filter admin-web build` - PASS, build output confirmed `/platform/crm/activities`.
- `pnpm.cmd --filter public-web build` - PASS.
- `pnpm.cmd --filter api seed:demo` - PASS.
- Started temporary API/Admin/Public servers on ports `3000`, `3203`, and `3205` - PASS.
- Initial `pnpm.cmd test:stage2:browser` after adding activity checks - FAILED on a test selector conflict because a sent message appeared in both the message timeline and new activity timeline.
- Second `pnpm.cmd test:stage2:browser` - FAILED on test sequencing after the platform route loop ended on `/platform/crm/activities` while the old assertion expected the import jobs heading.
- Third `pnpm.cmd test:stage2:browser` - FAILED because the activity assertion matched hidden filter `<option>` elements before visible timeline items.
- Final `pnpm.cmd test:stage2:browser` - PASS, 5 tests.
- Stopped temporary listeners on ports `3000`, `3203`, and `3205` - PASS.

### Test Result

- PASS: `5 passed (20.6s)` in Chromium.
- Existing coverage remained intact for:
  - developer import/export preview, commit, and export
  - brokerage/broker CRM claim and conversation message flow
  - developer CRM lead and conversation views
  - platform CRM/conversation/import-export routes
  - Public Web Call, Chat, WhatsApp, Start Chat, `/c/[token]`, and public reply posting

### Platform Activity Page Result

- Platform login succeeded.
- `/platform/crm/activities` rendered without app crash.
- Page heading `CRM activity` rendered.
- Activity filters rendered.
- Activity timeline rendered.
- Smoke accepted either visible activity rows or the safe empty state.
- Page did not show app crash text or obvious private auth/token fields such as `passwordHash` or `refreshToken`.

### Lead Detail Timeline Result

- Developer lead detail opened directly for the prepared CRM lead.
- Platform lead detail opened directly for the prepared CRM lead.
- Both rendered the `Activity timeline` section.
- Smoke verified either visible activity items or the safe empty state.
- When activity rows existed, the smoke verified a visible activity type/title surface.

### Conversation Detail Timeline Result

- Developer conversation detail opened directly for the prepared conversation.
- Platform conversation detail opened directly for the prepared conversation.
- Both rendered the `Activity timeline` section.
- Smoke verified either visible activity items or the safe empty state.

### Bugs Found / Fixed

- No product bugs were found.
- Test-only fix: message assertion now uses `.first()` because the same sent message can appear in both the message timeline and the activity timeline.
- Test-only fix: platform import jobs assertion now explicitly navigates back to `/platform/import-export/jobs`.
- Test-only fix: activity timeline assertion now scopes activity badge checks to visible list items so hidden filter options do not satisfy the locator.

### Remaining Gaps

- Downloaded JSON export file contents are still not persisted/inspected by Playwright.
- Closed/archived public token composer hiding is still not covered by this browser smoke.
- Activity timeline filter behavior is smoke-checked for rendering only; it does not yet assert filtered result changes.
- Production-like env-var smoke remains a pre-demo/pre-release checklist item.

### Next Recommendation

- Add a targeted Playwright check for activity type filtering on `/platform/crm/activities`.
- Add a closed/archived public conversation fixture to verify the public reply composer is hidden.
- Add optional download persistence checks for JSON exports.

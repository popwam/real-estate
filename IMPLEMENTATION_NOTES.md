# Release candidate stabilization — 2026-07-13

## Scope and outcome

This slice stabilizes platform maintenance, organization provisioning, HR employee login, attendance integrity, recruitment readiness, private company-document review, RBAC, critical EN/AR/FR copy, and the production accessibility panel. No database reset, destructive migration, owner deletion, password overwrite, commit, push, or deployment was performed.

The source is ready for a controlled deployment cycle, but the configured target database is currently **NO-GO** for staging testing until its pending additive migration is deployed and the confirmed idempotent repair is run.

## Root causes addressed

- Organization type values were being normalized/cast in multiple places, allowing display labels or non-canonical casing to reach the API. The contract now accepts only `PLATFORM`, `DEVELOPER`, `BROKERAGE`, or `INDIVIDUAL_BROKER`; Admin Web localizes metadata labels but sends the exact code.
- Organization list failures were associated with deep/nullable provisioning relations and schema drift. The platform list query is shallow, nullable-safe, permission guarded, and request-ID logged without payload secrets.
- Prisma, seed, and startup paths could silently fall back to localhost and did not share environment precedence. Process variables now win, `apps/api/.env` overrides the root fallback locally, wrapping quotes are trimmed, and only PostgreSQL URLs are accepted.
- Two Prisma provisioning models (`platform_plans` and `required_document_policies`) had no applied table migration. Their additive creation is included in `20260713150000_release_candidate_attendance_integrity`.
- Employee login enforcement did not consistently consider `loginEnabled` and organization activation. Phone-only employee login now uses normalized phone identity with a private internal placeholder email required by the existing schema; inactive/login-disabled employees and employees of non-active companies are blocked.
- Attendance employee resolution did not enforce every active/login/company invariant, and concurrent check-ins lacked a database-level guard. Resolution is scoped and structured; the migration adds a prechecked partial unique index for one open attendance record per employee.
- Recruitment had foundations but no explicit required-document readiness gate. The required states were added, approved required documents gate `READY_FOR_INTERVIEW`, and interviews can only be scheduled from that state.
- Company document upload required a manually entered file ID and extracted data rendered as raw JSON. The UI now uploads the selected file privately, creates metadata immediately, and supports selected-field apply/reject with audit logging and sensitive-field confirmation. Document approval remains separate.
- Production UI still initialized and exposed speech/voice controls. Speech synthesis, recognition, microphone prompts, and all voice/rate/pitch/volume/read controls and labels were removed while language, theme, comfort, font scaling, reset, and keyboard behavior remain.

## Maintenance commands

- `pnpm --filter api env:check` prints presence, protocol, hostname, provider, and readiness only; it never prints credentials or tokens.
- `pnpm --filter api platform:doctor` is read-only and checks environment, connection, migration ledger, critical tables/columns/enums/indexes, platform identity/link/role, RBAC, plans/policies, shallow organization query, feature foundations, and Nest service resolution.
- `pnpm --filter api platform:repair` refuses unless `CONFIRM_PLATFORM_REPAIR=true`. Once confirmed it idempotently ensures RBAC, repairs only an existing platform owner's missing organization/role link, creates only missing base plans/policies/settings/preferences, and never activates companies or changes passwords/approved data.

Current doctor result against the configured target:

- Environment and database connection: OK.
- Platform organization, active owner, owner link, and role assignment: OK.
- Organization summary query and application service resolution: OK.
- Migrations: one pending (`20260713150000_release_candidate_attendance_integrity`).
- Structures pending with that migration: two tables, one recruitment enum contract, and one attendance index.
- Platform permissions: 189/191 until RBAC is seeded; roles/assignments otherwise exist.
- Base plan and verification-policy checks cannot pass until their missing tables are migrated.
- Overall: **NO-GO**.

The unconfirmed repair invocation was tested and refused without changing data.

## Migration and controlled deployment sequence

Run these commands only with the intended target `DATABASE_URL` already provided by the deployment environment. `env:check` prints only its safe hostname, never the full value.

```powershell
pnpm --filter api env:check
pnpm --filter api exec prisma migrate status --config prisma/prisma.config.ts
pnpm --filter api exec prisma migrate deploy --config prisma/prisma.config.ts
pnpm --filter api prisma:generate
pnpm --filter api seed:rbac
pnpm --filter api platform:doctor
```

If the post-seed doctor still reports safe repairable defaults or assignments:

```powershell
$env:CONFIRM_PLATFORM_REPAIR = 'true'
pnpm --filter api platform:repair
Remove-Item Env:CONFIRM_PLATFORM_REPAIR
pnpm --filter api platform:doctor
```

Redeploy the API, Admin Web, Public Web, and Mobile artifacts through the already configured deployment pipeline after the migration/seed pass. No repository-specific deployment CLI/service mapping is versioned here, so a concrete provider command must not be guessed. Do not use `prisma db push` or a reset.

## Verification performed

- Prisma validate and generate: passed.
- API: 26 suites passed; 121 tests passed, 1 intentionally skipped; Nest build passed.
- Admin Web: ESLint passed; production build passed with all 121 routes generated.
- Public Web: ESLint/build passed; three existing `no-img-element` optimization warnings, zero errors.
- Mobile: `flutter gen-l10n`, `flutter analyze`, and 13 tests passed.
- i18n audit executed twice in an isolated output root: zero missing Arabic or French keys in Admin Web, Public Web, and Mobile; 261 repository-wide hardcoded-visible-string candidates remain outside the focused critical-flow cleanup.
- Voice/speech/microphone source scan across production Admin Web, Public Web, and Mobile UI: no matches.
- `git diff --check`: passed.

## Manual staging QA

1. Log in as the existing Platform Owner and open Organizations; confirm the summary list loads without a 500.
2. Create a Brokerage organization from the Arabic, English, and French UI and verify the request contains `organizationType: "BROKERAGE"`.
3. Save as Draft or Documents Required, upload required legal documents, and confirm each appears immediately in detail and verification views without a private URL.
4. Request extraction, confirm failure does not remove the document, select extracted fields, explicitly confirm sensitive identifiers, apply/reject them, and verify document approval is still unchanged.
5. Approve required documents, select plan/subscription, set limits, add an office, create the first admin, verify the activation checklist, then explicitly activate.
6. Log in as company admin; create an employee in the same organization using phone only and then email plus phone. Confirm no internal IDs or placeholder login email appear.
7. Log in as the employee with the temporary password `123456`, complete forced password change, and verify only permitted pages appear. Confirm inactive and login-disabled variants are rejected.
8. Check in/out from Mobile under location, Wi-Fi, photo, developer-options, and USB-debugging policies; verify duplicate open check-in and checkout-without-open-check-in are blocked.
9. Review the attendance record and private evidence summary in Admin Web; confirm no private evidence URL is exposed and DVR stays a manual-review state.
10. Submit a public applicant with CV/documents and confirm `PENDING_REVIEW` with no user/employee created.
11. Review/approve required applicant documents, confirm missing documents block readiness, mark Ready for Interview, and schedule an interview with date/interviewer/location or link/notes.
12. Explicitly convert the applicant once and verify duplicate conversion is blocked and audited.
13. Exercise every visible HR quick action and confirm permission-filtered routing, drag/keyboard movement, persistence, and reset.
14. Switch EN/AR/FR and RTL/LTR through the critical screens; verify structured employee/company/attendance errors are localized on Mobile.
15. Open accessibility settings and confirm language, theme/system/comfort, font size, and reset work, while no voice, speech, microphone, read-page, rate, pitch, volume, pause, or resume control appears.

---

# P0 clean-core continuation — 2026-07-14

This section supersedes the 2026-07-13 doctor counts, temporary-password QA instruction, quick-action QA instruction, and repair behavior above. No commit, push, pull request, migration deployment, confirmed repair, database reset, organization deletion, or production-data mutation was performed. P1 CRM expansion, P2 Finance/Legal/Workspace expansion, and P3 camera/advertising integrations were not started.

## Completed code-side P0 work

- Added the additive `20260714120000_clean_core_p0` migration for platform navigation, Platform metadata, welcome dismissal, archive/setup state, plan duration/login methods, subscription override audit fields, responsible submitter fields, and branch hierarchy. It contains no `DROP`, `DELETE`, `TRUNCATE`, or business-data rewrite.
- Rebuilt the desktop sidebar as a manual single-open accordion with the active route opening its parent, no section search boxes, no hover expansion, no horizontal scroll, and independent content scrolling. Personal customization now uses a bounded draft panel with real Save/Cancel/Reset semantics.
- Added global 13-section navigation configuration with EN/AR/FR titles, order, visibility, compatible item placement, default restore, and API persistence. Permission filtering happens before placement, so navigation configuration cannot grant access.
- Removed the floating HR quick-action implementation. Cameras, provider advertising, domains, unfinished HR foundations, and placeholder recruitment aggregate routes are hidden from production navigation and default-off behind feature flags. No fake camera streams or provider data were introduced.
- Replaced the permanent welcome banner with a per-user first-visit modal. Session close and persistent “Do not show again” behavior are separate; failed preference writes keep the modal open, and About Platform reopens it.
- Replaced the Platform Dashboard with live database aggregation for organization status/type/country, subscription status/expiry/plan distribution, metadata countries, users, employees, applicants, interviews, offices, attendance issues, alerts, migration state, R2, Cloudflare extraction, and explicit provider status. Empty states contain useful actions and API errors surface only a safe message/request ID.
- Added Platform Owner CRUD foundations for user-created countries, currencies, languages, and plans. Plan create/edit includes localized names, price/currency, type, billing/duration, trial, modules, no-expiry, active state, and implemented login methods. Country/currency/language consumers now read active database metadata rather than static business records.
- Expanded and audited RBAC so `platform_owner` inherits the complete 216-key catalog while company roles receive no `platform.*` permissions. Verification and investigation permissions are included and unit-tested.
- Hardened organization lifecycle, documents-first onboarding, protected document review, automatic subscription dates, and plan-controlled authentication. Draft deletion previews blockers/counts, protects the Platform organization, requires exact-name confirmation, and records an audit event.
- Removed legacy `123456` creation/reset fallbacks. Employee creation generates a one-time strong password when omitted; provisioning requires an explicit password of at least 12 characters, and all paths force password change.
- Replaced critical HR attendance/settings/org-chart surfaces with live workflows and hid incomplete aggregate pages. Critical EN/AR/FR keys are present; the generic Arabic “غير متوفر” fallback was removed from the repaired screens.

Default-off Admin Web flags introduced for unfinished surfaces:

- `NEXT_PUBLIC_ENABLE_DOMAIN_MANAGEMENT`
- `NEXT_PUBLIC_ENABLE_CAMERA_INTEGRATIONS`
- `NEXT_PUBLIC_ENABLE_AD_PROVIDER_INTEGRATIONS`
- `NEXT_PUBLIC_ENABLE_HR_EXTENDED_FOUNDATIONS`
- `NEXT_PUBLIC_ENABLE_HR_RECRUITMENT_FOUNDATIONS`

Related server flags remain `ENABLE_DOMAIN_MANAGEMENT`, `ENABLE_CAMERA_INTEGRATIONS`, and `ENABLE_AD_PROVIDER_INTEGRATIONS`.

## Verification

- Prisma schema validation: passed.
- Prisma Client generation: passed.
- API Nest build: passed.
- API unit tests: 27 suites passed; 126 tests passed; 1 existing test skipped.
- Admin Web TypeScript: passed.
- Admin Web ESLint: passed.
- Admin Web production build: passed; 123 routes compiled.
- EN/AR/FR key comparison for the added critical keys: no missing Arabic or French keys and no duplicate top-level translation keys introduced.
- Prisma schema duplicate check: 101 models and 120 enums, with no duplicate model or enum names.
- Platform Dashboard route check: exactly one route.
- `git diff --check`: passed (line-ending notices only).

## Current release gate

The read-only `pnpm --filter api platform:doctor` result against the configured target is **NO-GO**, as expected before deployment:

- Environment and database connection: OK; only the PostgreSQL hostname was printed.
- Platform organization, owner, owner link, active role assignment, RBAC base state, organization query, HR dependencies, and application service resolution: OK.
- Migrations: 1 pending, 0 failed.
- Pending schema: 2 tables and 10 columns from `20260714120000_clean_core_p0`; no enum or index mismatch.
- Permission database state: 189/216 catalog keys and 102/216 Platform Owner assignments until the migration/seed/repair deployment step.
- Navigation database state: unavailable until the migration is applied.
- Overall readiness: **NO-GO**.

Do not begin P1 until an authorized operator applies the additive migration in the intended environment, runs the idempotent RBAC seed and (only if needed) `CONFIRM_PLATFORM_REPAIR=true pnpm --filter api platform:repair`, reruns the doctor to `GO`, and completes manual EN/AR/FR Platform Owner acceptance checks. The repair does not create plans, countries, currencies, languages, subscriptions, organizations, or other business records.

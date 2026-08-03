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

---

# Platform metadata and document-first onboarding implementation — 2026-07-17

## Executive summary

Implemented an additive, backward-compatible foundation for dynamic platform metadata, supported organization types, exchange rates, safe plan/policy/unit lifecycle operations, and document-first organization onboarding. Existing organizations retain the legacy `Organization.type`; a nullable supported-type relation is added and backfilled only for exact legacy matches. No migration, seed, deploy, Railway variable change, commit, or push was performed. `DOCUMENT_EXTRACTION_AUTO_RUN` remains false.

## Implemented behavior

- Reused `PlatformMetadataRecord` for languages, countries, and currencies. Added archive state, dynamic translation-map support, default-language protection, safe deletion impact checks, active-currency validation, and country default/allowed-currency validation.
- Added safe public country-icon upload for SVG/PNG/WebP. The endpoint checks MIME, matching extension, size, empty input, and rejects SVG scripts, event handlers, active/external links, `foreignObject`, iframe/object/embed content. Only an R2 object key and MIME metadata are stored.
- Added dynamic `SupportedOrganizationType` management while preserving the legacy enum. `PLATFORM` is filtered out of the new wizard and protected in the API; a second Platform organization returns a conflict.
- Added manual exchange-rate storage and provider-status reporting. API refresh stays disabled in manual mode when `FX_PROVIDER`/`FX_API_KEY` are absent; no external FX provider was selected or contacted.
- Expanded verification policies with supported type, field coverage, MIME limits, size, confidence, activation blocking, ordering, and archive state. Matching prefers country + type + legal form, then country + type without legal form. Removed the old implicit default-document fallback: no matching policy means no required documents.
- Added plan deletion impact, copy, activation/deactivation, archive-on-use, and delete-when-unused APIs. Plan currencies must be active metadata currencies. The Admin page now shows plans as cards, opens only one editor, and keeps the create form behind an explicit add button.
- Added unit project/building/floor validation, deletion impact, archive, and delete-when-unused endpoints. Existing assignments or QR passes force archive instead of deletion.
- Replaced the new-organization Admin page with a document-first wizard. It accepts country, supported type, optional legal form, and operational settings only; it does not ask for legal name, registration, tax, incorporation, or legal address before documents.
- Added resumable onboarding sessions with expiry and statuses: `DRAFT`, `DOCUMENTS_REQUIRED`, `EXTRACTION_PENDING`, `REVIEW_REQUIRED`, `READY_TO_CREATE`, `COMPLETED`, `CANCELLED`, `EXPIRED`.
- Added private onboarding documents, quality results/warnings, structured extraction results, multi-source field evidence, confidence, review state, corrections, source retention, conflicts, missing-field calculation, next-document ranking, and transactional organization creation only from `READY_TO_CREATE`.
- Added audit events for session creation/update/cancel, document upload, extraction start/success/failure, field confirmation/correction/rejection, organization creation, metadata lifecycle, country icon upload, plans, policies, supported types, and exchange rates. Raw document text, signed URLs, provider tokens, and document contents are not written to application logs.
- Added Cloudflare Workers AI adapter configuration for vision/text model names, timeout, bounded retry, AI Gateway authentication, and disabled AI Gateway payload logging. Non-retryable 4xx responses are not retried. PDF extraction returns a clear error until a Railway-compatible page-to-image adapter is deliberately added; PDFs are not sent blindly to an image model.
- Added focused tests for no-policy behavior, PLATFORM rejection, empty/unsupported files, signature mismatch, protected PDFs, and low-resolution PNGs.

## Database and relations

New tables:

- `supported_organization_types`
- `exchange_rates`
- `organization_onboarding_sessions`
- `organization_onboarding_documents`
- `organization_field_evidence`

Extended tables:

- `organizations.supportedOrganizationTypeId` (nullable FK; legacy `type` preserved)
- `required_document_policies` (supported type, covered fields, MIME/size/confidence/order/archive controls)
- `platform_metadata_records.isArchived`
- `units.archivedAt`

Important relations:

- supported organization type → organizations, policies, onboarding sessions
- onboarding session → creator, supported type, documents, field evidence, and one completed organization
- onboarding document → private uploaded file, matched policy, and multiple evidence rows
- evidence → session, source document, and optional reviewer

## Migration

New migration: `20260717170000_platform_document_first_onboarding`.

It is additive and data-preserving: it creates enums/tables/indexes/FKs, adds nullable or safely defaulted columns, inserts four compatibility supported-type rows with `ON CONFLICT DO NOTHING`, and backfills supported-type links only where the legacy enum has an exact match. It contains no `DROP`, destructive SQL, status rewrite, or deletion. The pre-existing untracked migration `20260717130000_sync_organization_status_enum` was not edited.

## APIs added or changed

Metadata and settings:

- `DELETE /platform/settings/metadata/:metadataId`
- `POST /platform/settings/countries/:id/icon`
- `GET|POST /platform/settings/organization-types`
- `PATCH|DELETE /platform/settings/organization-types/:id`
- `GET|POST /platform/settings/exchange-rates`
- `GET /platform/settings/exchange-rates/provider-status`
- `PATCH|DELETE /platform/settings/exchange-rates/:id`
- `GET /platform/settings/plans/:planId/deletion-impact`
- `POST /platform/settings/plans/:planId/copy`
- `DELETE /platform/settings/plans/:planId`
- `DELETE /platform/settings/verification-policies/:policyId`

Document-first onboarding:

- `POST /platform/onboarding`
- `GET|PATCH /platform/onboarding/:id`
- `GET /platform/onboarding/:id/required-documents`
- `POST /platform/onboarding/:id/documents`
- `POST /platform/onboarding/:id/documents/:documentId/extract`
- `PATCH /platform/onboarding/:id/fields/:evidenceId`
- `GET /platform/onboarding/:id/progress`
- `POST /platform/onboarding/:id/complete`
- `POST /platform/onboarding/:id/cancel`

Units:

- `GET /real-estate/units/:id/deletion-impact`
- `POST /real-estate/units/:id/archive`
- `DELETE /real-estate/units/:id`
- existing `PATCH /real-estate/units/:id` now validates project/building/floor changes

## Admin pages changed

- `/platform/organizations/new`: document-first wizard with selection, upload/processing, evidence review, missing/conflict summary, and final creation.
- `/platform/settings/plans`: list/card-first UI, explicit add form, single-plan edit, copy, state toggle, and confirmed safe delete/archive.
- Existing metadata and verification-policy pages continue to use the current design system and APIs. Full dedicated exchange-rate/supported-type CRUD pages and a country-icon upload control remain to be surfaced in Admin Web; their protected APIs are implemented.

## Cloudflare extraction path

1. Validate session, active policy, MIME, size, signature, PDF protection/page estimate, and available image dimensions.
2. Save accepted input privately to quarantine through the existing `FileStorageService`; only bucket/object key are persisted.
3. Manual extraction endpoint reads the private object and calls the configured Cloudflare Workers AI vision model through the existing AI Gateway.
4. Validate and bound the returned structured object before storage; normalize Unicode whitespace and Arabic/Persian digits while retaining raw values.
5. Store evidence rows, require review for sensitive fields, detect conflicts, recompute missing fields, and rank the next policy document.
6. Create the organization transactionally only after all required fields are resolved and the session is `READY_TO_CREATE`.

Models/variables found and reused without exposing values: `CLOUDFLARE_AI_MODEL`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_AI_GATEWAY_ID`, `CLOUDFLARE_AI_GATEWAY_TOKEN`, `R2_COMPANY_DOCUMENTS_*`, `R2_QUARANTINE_UPLOADS_*`, `R2_PUBLIC_MEDIA_*`, and the existing `FileStorageService` purpose routing.

New `.env.example` names:

- `CLOUDFLARE_DOCUMENT_VISION_MODEL`
- `CLOUDFLARE_DOCUMENT_TEXT_MODEL`
- `DOCUMENT_EXTRACTION_MAX_PAGES`
- `DOCUMENT_EXTRACTION_TIMEOUT_MS`
- `DOCUMENT_EXTRACTION_MAX_RETRIES`
- `FX_PROVIDER`
- `FX_API_KEY`
- `FX_BASE_CURRENCY`
- `FX_REFRESH_INTERVAL_HOURS`

## Verification results

- Prisma validate: passed on the final schema.
- Prisma generate: passed on the final schema.
- API build: passed.
- API unit tests: 32 suites passed; 151 tests passed; 1 existing test skipped.
- New onboarding/quality tests: 2 suites passed; 6 tests passed.
- Admin Web tests: 2 files passed; 7 tests passed.
- Admin Web ESLint: passed.
- Admin Web production build/typecheck: passed; 123 routes generated.
- New onboarding module ESLint: implementation has no errors; test mocks retain typed-boundary warnings. The project-wide API lint remains failed with 3,699 errors and 262 warnings across pre-existing files (`no-unsafe-*`, existing test mocks, and existing services). Its `--fix` side effects were removed; no unrelated formatting changes remain in `git diff`.
- `git diff --check`: passed (line-ending notices only).
- `prisma migrate status`: not run because the configured `DATABASE_URL` was classified as remote/managed. This avoided touching or interrogating staging/production.
- API e2e tests: not run because they require the configured database target, which is remote/managed.

## Incomplete items and real reasons

- PDF-to-image extraction adapter: not implemented because no compatible PDF rasterization dependency exists in the API package and relying on an undocumented Railway system binary would be unsafe. PDF uploads receive deterministic quality checks, but manual extraction clearly asks for a document image until an adapter is selected and deployed.
- Signed download URL generation: the current storage service only supports private put/read. This implementation does not invent permanent public URLs; adding short-lived presigning requires an explicit storage API extension and tests.
- Dedicated Admin CRUD screens for exchange rates and supported organization types, metadata-specific editors for all requested language/country/currency fields, country-icon upload control, and full unit archive/delete controls remain incomplete. The underlying protected APIs and data rules are present.
- Advanced blur/crop/darkness analysis is not claimed. Confirmed format/signature/size/password/page/dimension checks are implemented; uncertain dimensions and page counts are warnings.
- Organization post-creation setup (first admin, subscription, limits, offices, attendance) remains in the existing follow-up flow; onboarding creates only the reviewed draft organization.
- No live Cloudflare/R2 request was executed because this task does not authorize consuming external resources or exposing configured secrets during local verification.

## Deployment risks

- Apply the new migration before deploying API code; generated Prisma access to new tables/columns will otherwise fail.
- Back up and review migration SQL, especially enum names and exact legacy-type backfill rows, against the target schema.
- Seed the expanded permission catalog before manual acceptance; otherwise new endpoints correctly return 403.
- Configure both document model variables and verify the chosen vision model's actual image input contract in the target Cloudflare account.
- Keep `DOCUMENT_EXTRACTION_AUTO_RUN=false`; the wizard calls extraction only from the explicit manual action.
- Do not enable PDF extraction until a tested rasterization adapter and Railway runtime dependency are available.

## Manual application order (do not run automatically)

1. Back up the target database and review `apps/api/prisma/migrations/20260717170000_platform_document_first_onboarding/migration.sql`.
2. Set the new environment variables with real values in the deployment platform; keep `DOCUMENT_EXTRACTION_AUTO_RUN=false`.
3. Run `pnpm --filter api run prisma:validate` and `pnpm --filter api run prisma:generate` in the release workspace.
4. Apply migrations through the approved release pipeline (`prisma migrate deploy`) only after explicit target confirmation.
5. Run the existing idempotent RBAC seed/repair workflow to add the new catalog keys and Platform Owner mappings; do not reset passwords.
6. Build API and Admin Web, then deploy through the normal reviewed pipeline.
7. Run read-only health/migration checks, then the manual acceptance flow below.

## Platform Owner manual acceptance

1. Add a fourth language, set direction/fallback/active state through API, verify it appears in metadata lists, and verify the current core translation coverage notice remains honest.
2. Configure EGP as active, set Egypt's allowed currencies to include EGP, then set EGP as default; confirm a disallowed default is rejected.
3. Upload valid PNG/WebP/SVG country icons and confirm a script/external-link SVG is rejected.
4. Create a non-PLATFORM supported type; verify PLATFORM is absent from onboarding and a second PLATFORM API attempt returns 409.
5. Confirm a type/country with no active policy requests no document; add an ordered policy and confirm only its documents appear.
6. Create/copy/edit/delete an unused plan; attach a subscription and confirm deletion archives the used plan with impact count.
7. Start onboarding, upload an image, run extraction manually, review source/confidence, correct one field with a reason, create a conflict with a second document, resolve it, and verify creation is blocked until ready.
8. Verify the created organization retains its legacy type plus supported-type link and that existing organizations still open/edit normally.
9. Test unit edit/project-building validation, deletion impact, unused deletion, and archive-on-reference.
10. Verify unauthorized roles receive 403, validation returns 400, expected conflicts return 409, and internal errors show a Request ID without Prisma details or secrets.
# Dynamic verification policy type correction — 2026-07-18

## Discovered problem

`RequiredDocumentPolicy` still treated the legacy `OrganizationType` enum as the required source of truth. New policies accepted `organizationType` directly, while `supportedOrganizationTypeId` was optional, and the legacy composite unique constraint prevented distinct dynamic organization types from sharing one legacy enum value.

## Files changed for this correction

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/20260717170000_platform_document_first_onboarding/migration.sql`
- `apps/api/src/modules/company-provisioning/dto/company-provisioning.dto.ts`
- `apps/api/src/modules/company-provisioning/company-provisioning.controller.ts`
- `apps/api/src/modules/company-provisioning/company-provisioning.service.ts`
- `apps/api/src/modules/company-provisioning/verification-policy.service.spec.ts`
- `apps/api/src/modules/platform-onboarding/platform-onboarding.service.ts`
- `apps/api/src/modules/platform-onboarding/platform-onboarding.service.spec.ts`
- `apps/api/src/scripts/reset-platform-owner-only.ts`
- `apps/admin-web/src/components/platform/platform-settings-pages.tsx`
- `apps/admin-web/src/lib/verification-policy-options.ts`
- `apps/admin-web/src/lib/verification-policy-options.test.ts`
- `apps/admin-web/src/types/platform.ts`
- `IMPLEMENTATION_NOTES.md`

## Schema and backend behavior

- `RequiredDocumentPolicy.organizationType` is now nullable and retained only as a compatibility field.
- `supportedOrganizationTypeId` remains nullable in the database so unlinked legacy policies remain valid.
- Creating a policy requires `supportedOrganizationTypeId`; the backend resolves the referenced active, non-archived supported type and derives `organizationType` from its `legacyOrganizationType` value. Custom types therefore store `organizationType = null`.
- Updating `supportedOrganizationTypeId` recalculates the legacy value. A client-supplied `organizationType` is never used as the source of truth.
- `PLATFORM` is rejected by both dynamic code and legacy enum value.
- Create and update perform an unarchived-policy duplicate check inside the transaction. Duplicate checks and PostgreSQL `P2002` uniqueness races return HTTP 409 with `VERIFICATION_POLICY_ALREADY_EXISTS`.
- Policy listing includes the supported type and exposes its id, code, translated names, and a legacy value for compatibility. Ordering uses country, supported-type sort order/code, legal form, and policy sort order.
- Onboarding and activation matching now use the dynamic type first, then its generic `legalForm = null` policy, and only then fall back to old policies whose `supportedOrganizationTypeId` is null. Archived and inactive policies are excluded.
- The Admin policy selector reads active supported organization types, displays the localized name with the code fallback, and excludes `PLATFORM`, archived, and inactive types.

## Correction to the unapplied migration

Migration `20260717170000_platform_document_first_onboarding` now drops `NOT NULL` from the legacy `organizationType` column, adds and backfills nullable `supportedOrganizationTypeId`, and preserves policies that cannot be linked. It drops only this obsolete index:

- `required_document_policies_countryCode_organizationType_legalForm_documentType_key`

Dropping that index does not delete or modify policy data. It is replaced by these PostgreSQL partial unique indexes for non-archived, dynamically linked policies:

- `required_document_policies_unarchived_dynamic_type_no_legal_form_key` on `(countryCode, supportedOrganizationTypeId, documentType)` where `isArchived = false`, `legalForm IS NULL`, and `supportedOrganizationTypeId IS NOT NULL`.
- `required_document_policies_unarchived_dynamic_type_legal_form_key` on `(countryCode, supportedOrganizationTypeId, legalForm, documentType)` where `isArchived = false`, `legalForm IS NOT NULL`, and `supportedOrganizationTypeId IS NOT NULL`.

No table or column is dropped, and no existing policy row is deleted.

Before deployment, review the target database for duplicate non-archived policies, especially rows with `legalForm IS NULL`. PostgreSQL's old nullable composite unique rule may have allowed such duplicates. If any exist, creation of the new partial unique index will stop the migration safely rather than deleting or rewriting rows; duplicates must be reviewed manually before retrying.

## Verification results

- `prisma format`: passed.
- `prisma validate`: passed.
- `prisma generate`: passed with Prisma Client 7.8.0.
- API verification-policy and Onboarding tests: 2 suites passed, 13 tests passed.
- API build: passed.
- Admin verification-policy options test: 1 file passed, 2 tests passed.
- Admin production build: passed; 123 pages generated.

The first API build exposed a compile-time reference in `reset-platform-owner-only.ts` to the removed Prisma composite key. The script was updated (not executed) to resolve the dynamic `BROKERAGE` type and use find/update-or-create semantics. The subsequent API build passed.

## Deployment state

The migration was not applied. No `migrate deploy`, `db push`, `migrate reset`, commit, push, or deployment command was run. No database connection was made for this correction.

## RBAC catalog consistency repair — 2026-07-19

- Added the four existing recruitment role permissions (`hr.applicants.create`, `hr.applicants.review`, `hr.interviews.view`, and `hr.interviews.manage`) to `BASE_PERMISSIONS`; no permission was removed or renamed.
- Added a centralized RBAC invariant test requiring every permission in every `ROLE_PERMISSIONS` mapping to exist in `BASE_PERMISSIONS`.
- Restricted `platform-rbac-repair.ts` failure output to a sanitized error name, Prisma code, model name, and short redacted message. Database URLs and common secret assignments are removed.
- Centralized RBAC test passed (7/7), API build passed, and the production API TypeScript check passed. The full test-inclusive TypeScript check remains blocked by the pre-existing `files.service.spec.ts:143` nullability error. No database, migration, reset, commit, push, or deployment command was run.

---

# First-admin transaction stabilization - 2026-07-22

## Root cause

`POST /platform/settings/:id/first-admin` used a Prisma interactive transaction at `Serializable` isolation and kept it open while `HashService.hash` performed CPU-intensive `scrypt`. The same transaction also provisioned the role and all of its permissions one at a time. `company_admin` currently expands to 83 permissions, so this path could execute 167 sequential role/permission queries (one role upsert plus two queries per permission) before the user and HR employee writes. Organization lookup, existing-admin lookup, duplicate-email lookup, user creation, employee count, and employee creation were additional serial operations. Under staging network/pool latency this exceeded the interactive transaction lifetime and produced Prisma `P2028`; `Serializable` also added unnecessary contention.

No network call or audit write was found inside this transaction. The audit write was already after commit. No nested transaction or use of `this.prisma` from inside the callback was found. The dominant defect was the combination of scrypt plus the very large serial RBAC query fan-out inside the interactive transaction, not a missing index and not a timeout setting.

The Railway 500 logs/second warning had a separate source: request middleware emitted one info log for every successful request and also logged CORS `OPTIONS` requests. A failed request could additionally be logged by both the middleware and the exception filter.

## Files modified

- `apps/api/src/modules/company-provisioning/company-provisioning.controller.ts`
- `apps/api/src/modules/company-provisioning/company-provisioning.service.ts`
- `apps/api/src/modules/company-provisioning/company-provisioning.service.spec.ts`
- `apps/api/src/common/api-exception.filter.ts`
- `apps/api/src/common/api-exception.filter.spec.ts`
- `apps/api/src/common/request-log-sanitizer.ts`
- `apps/api/src/common/request-log-sanitizer.spec.ts`
- `apps/api/src/common/request-logging.middleware.ts`
- `apps/api/src/common/request-logging.middleware.spec.ts`
- `IMPLEMENTATION_NOTES.md`

`FirstAdminInputDto` was reviewed. Its service-level validation remains the source of truth in this module, so no DTO contract or route change was required. The route remains exactly `POST /platform/settings/:id/first-admin`.

## Transaction before

- `Serializable` interactive transaction.
- Organization lookup and first-admin `findFirst` check.
- Duplicate-email lookup.
- Role upsert plus up to 166 sequential permission/role-permission upserts.
- Name, email, phone, role-template, and password validation.
- CPU-heavy scrypt password hashing.
- User creation, employee count, and HR employee creation.
- Audit and activation-check queries after commit.

## Transaction after

Before opening the transaction, the service now validates the actor/input, loads the organization, checks the email, completes scrypt hashing, discards the plaintext password from the prepared object, and provisions RBAC idempotently. RBAC provisioning is reduced from up to 167 sequential queries to four bulk queries: role upsert, permission `createMany`, permission `findMany`, and role-permission `createMany`.

The transaction now uses PostgreSQL's default isolation and contains only five necessary database operations: lock the target organization row, check for an existing qualified admin, create the user, count employees for the existing employee-code convention, and create the linked HR employee. No hashing, audit logging, network I/O, noisy logs, or CPU-heavy work occurs in the transaction. No timeout or `maxWait` increase was added.

The combined organization-creation helper also hashes the optional admin password before its organization transaction. Because the new organization row must exist before its role foreign key can be created, that combined flow performs only the four bulk RBAC queries inside its existing creation transaction instead of the former per-permission loop.

## Concurrency protection

The first-admin endpoint acquires `SELECT ... FOR UPDATE` on the single `organizations` row, then performs the qualified-admin check. Concurrent requests for the same organization serialize on that row. After the first request commits, the second request sees the created owner/admin and returns HTTP 409 with `FIRST_ADMIN_ALREADY_EXISTS`; requests for different organizations do not block each other.

This is an atomic short-transaction condition and does not require `Serializable` or a retry loop. A unique index on all owner/admin roles was deliberately not added because it would incorrectly prevent legitimate additional administrators after initial provisioning. The existing unique user-email constraint remains the database race guard for email; known and raced duplicate emails return HTTP 409 with `DUPLICATE_EMAIL`.

`P2028`, `P2034`, and non-email `P2002` persistence conflicts are returned as HTTP 503 with `FIRST_ADMIN_TEMPORARILY_UNAVAILABLE`, with the raw Prisma error retained only as the internal cause. The exception filter walks the safe cause chain so its structured error record contains `P2028` while the response never exposes raw database details. Request IDs are preserved.

## Logging fix

Successful request logging is now disabled by default and can only be enabled explicitly with `REQUEST_LOG_SUCCESS=true`. CORS `OPTIONS` requests are never logged. HTTP 5xx errors are logged once by `ApiExceptionFilter`, not again by the request middleware. The first-admin organization ID and query string are sanitized to `/platform/settings/:id/first-admin`.

Error records contain only `event`, `requestId`, `method`, sanitized `path`, `errorName`, and `prismaCode`. Tests verify that raw Prisma messages and organization identifiers are absent. Passwords, request bodies, tokens, cookies, authorization headers, database URLs, and other secrets are not logged.

## Performance and tests

Safe local measurement found 83 permissions in the `company_admin` template, reducing role provisioning from up to 167 sequential queries to four bulk queries. A real scrypt hash measured approximately 54.18 ms on the local test host. The service exposes an opt-in test-only timing callback for `validation`, `hash`, `roleProvisioning`, `dbTransaction`, and `audit`; the production controller does not pass it and no production timing log is emitted.

- Focused first-admin, error-filter, path-sanitizer, and request-logging tests: 4 suites passed, 38 tests passed.
- Full `pnpm --filter api test`: 34 suites passed; 183 tests passed; 1 existing test skipped.
- `pnpm --filter api build`: passed.
- Covered: successful creation, existing admin 409/code, two-request concurrency with one success, hashing before transaction, all supported organization-type/role mappings, invalid role template, duplicate email including P2002 race, P2028 safe handling and request ID, bulk role assignment, audit placement/sanitization, safe stage timing, sanitized error logging, default-off success logs, and skipped preflight logs.

## Migration

No migration is required or created. The current `users(organizationId, userRole)` index supports the existing-admin lookup, the user email remains unique, the role and employee constraints already exist, and row locking supplies the required per-organization atomicity. No migration was applied and no database command was run.

## Remaining risks and E2E

- A real staging E2E run is still required to measure validation, four-query role provisioning, the five-operation transaction, audit, and activation-check latency against Railway/PostgreSQL under actual pool load.
- The row-lock invariant protects this endpoint and any future path that follows the same protocol. Direct SQL or a future admin-creation path that bypasses it can still create additional admins; that is intentional for normal post-provisioning administration. If a cross-path permanent marker is later required, it should be a dedicated first-admin claim rather than a unique constraint on every admin role.
- Employee codes still use the existing count-plus-one convention. Unrelated concurrent employee creation can produce a non-email uniqueness conflict; it now fails safely as retryable 503 instead of leaking Prisma data, but replacing the organization-wide employee-code allocator is separate work.
- Audit is intentionally outside the transaction. If audit storage fails after the user commits, the endpoint can fail while the admin exists; an outbox/reconciliation design would be needed for atomic business-write/audit delivery without lengthening this transaction.
- No live staging database, deploy, `prisma migrate deploy`, reset, secret change, commit, or push was performed.

## Employee attendance evidence and reference-photo workflow (2026-07-29)

### Existing attendance architecture found

Employee self-service attendance is implemented in `apps/mobile` (Flutter), not the admin web. It uses the existing `/hr/attendance/me/today`, `/me/history`, `/check-in`, `/check-out`, and protected `/evidence-photo` APIs. The API already enforced linked active employees, organization scope, location radius, Wi-Fi, developer-options/USB checks, protected attendance uploads, and DVR review.

### Files changed

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/20260729180000_attendance_reference_photo_verification/migration.sql`
- `apps/api/src/modules/operations/operations.service.ts`
- `apps/api/src/modules/operations/operations.controller.ts`
- `apps/mobile/lib/features/attendance/{data,services}/*`
- `apps/admin-web/src/lib/hr-settings-api.ts` and HR attendance translations/page

### Employee check-in, location, and camera flow

The mobile flow now gathers GPS before camera, sends latitude/longitude, accuracy, and capture time, then opens the preferred front camera. It accepts only a fresh camera capture, shows an on-device preview, and permits retake before private upload. The API recalculates distance and rejects missing/out-of-policy locations; optional `maxGpsAccuracyMeters` is enforced server-side. No base64 or permanent public URL is stored.

### Reference photos and face verification

`EmployeeAttendanceReferencePhoto` keeps immutable historical reference records. The safe default policy, `firstAttendancePhotoRequiresApproval=true`, creates `PENDING_REFERENCE_APPROVAL`; HR can approve/reject it through the new review API, and approval revokes prior active references with an audit event. HR can also manually approve/reject a record's face verification. Attendance records preserve image IDs, reference ID, provider, confidence, review actor/time, and rejection reason.

There is deliberately no automated face-recognition provider in this implementation. `MANUAL` is recorded as the provider and reference-backed checks use `MANUAL_REVIEW_REQUIRED` when `requireFaceVerification` is enabled. Photo capture, reference management, and manual review are complete; automated matching is not claimed.

### Reference-photo schema integrity follow-up

The un-applied `20260729180000_attendance_reference_photo_verification` migration was corrected in place. `EmployeeAttendanceReferencePhoto.fileId` is now a required `UploadedFile` relation with `ON DELETE RESTRICT`; `sourceAttendanceId` is an `HrAttendanceRecord` relation with `ON DELETE SET NULL`; approver/revoker and attendance face-reviewer IDs are named `User` relations with `ON DELETE SET NULL`. `referenceImageId` and `capturedImageId` are also restricted `UploadedFile` relations: they are populated only from the validated self-service attendance `photoFileId` contract. Legacy `checkInPhotoFileId`/`checkOutPhotoFileId` remain scalars for backward-compatible historical data, although the current self-service API validates supplied values as attendance `UploadedFile.id` values.

The schema adds a composite `HrEmployee(id, organizationId)` unique key and uses it for the reference-photo employee relation, preventing employee/organization cross-tenant mismatches at the database layer. A partial unique index permits exactly one `APPROVED_REFERENCE` per employee. The review service still revokes the previous reference within its transaction and converts a concurrent unique violation into HTTP 409. `maxGpsAccuracyMeters` now has both a database CHECK (`NULL OR > 0`) and service validation. No confidence-range CHECK was added because no real biometric provider contract establishes a scale. No migration was applied.

## Mobile location-first attendance preflight (2026-07-30)

### Root cause and previous flow

The Flutter collector opened the camera and uploaded its capture before the server had a chance to reject the location. The preview action row was a shrink-wrapped `Row` inside a `Center`/`Positioned` stack: Material buttons received unbounded horizontal constraints, causing `BoxConstraints forces an infinite width` after a successful capture.

### New flow and enforcement

`POST /hr/attendance/check-in/preflight` is a read-only, organization-scoped employee gate. It resolves the active employee and policy, calculates server-side distance/radius and GPS accuracy, and returns a decision without creating attendance, uploading a file, audit activity, or changing state. The mobile page obtains a fresh location, calls preflight, and only then enters the collector/camera path. A rejected preflight does not open the camera or upload a file. Final check-in continues to call the existing server-side verification, which recalculates location and now rejects supplied stale/future location timestamps; legacy clients without a timestamp remain compatible.

The mobile screen has an explicit in-flight flow state and disables duplicate submission. Camera preview now uses `SafeArea` and a `Positioned(left: 16, right: 16)` bounded action bar with two `Expanded` buttons. The camera controller remains owned by the route and is disposed on accept, retake exit, or cancel.

### Validation

- API attendance service tests and API build passed.
- `flutter analyze` completed with two existing warnings in `attendance_location_service.dart` about a non-null timestamp fallback.
- Focused `flutter test test/widget_test.dart` passed.
- No migration, database command, secret, deploy, commit, or push was performed. Device permission/camera E2E and an integration database preflight test remain required.

## Attendance Location source correction (2026-07-30)

`OrganizationAttendanceLocation` is now the primary source for both preflight and final check-in validation. The service loads active locations in the current organization, filters on `allowedForMobile` or `allowedForWeb`, optionally limits to a verified same-organization branch/office, calculates all distances, and selects the nearest valid location. Its exact/expanded radii and `requiresReviewOutsideExactRadius` control the decision. The response includes matched location metadata and both radii without exposing raw coordinates.

The legacy `OrganizationAttendanceSettings.allowedLatitude`, `allowedLongitude`, and radius fields are explicitly retained only as a temporary fallback when no valid Attendance Locations exist. With neither valid locations nor legacy coordinates, the decision rejects with `ATTENDANCE_LOCATION_NOT_CONFIGURED`. No deletion or data migration was performed.

Flutter continues to call `isLocationServiceEnabled` before any position read; it uses only fresh `getCurrentPosition` with high accuracy and a 20-second time limit, never `getLastKnownPosition`. Timestamp freshness is checked on device and again for supplied timestamps on the server. The mobile repository explicitly labels all attendance requests `clientPlatform: MOBILE` so backend location eligibility is unambiguous.

### Backend enforcement, admin, tests, and migration

The existing backend checks remain active; evidence is never trusted from the frontend alone. Admin attendance columns now expose reference/captured image IDs and face status/confidence; protected file preview continues to use the existing authorization path. New HR APIs are permission-gated by `hr.attendance.review`/`hr.attendance.manage`.

The migration is additive and was created but **not applied**. Focused mobile widget tests passed, API attendance tests passed, and both `pnpm --filter api build` and `pnpm --filter admin-web build` passed. A real biometric provider, device E2E permission tests, and staged migration/E2E validation remain required before claiming automated face matching.

## Verification and attendance hardening follow-up (2026-08-02)

### Organization verification root cause and approval authority

The organization-document review endpoint previously reused the organization-management authorization check. That allowed a company administrator with document-edit rights to set a document to `APPROVED`, which undermined the activation gate. Upload and review are now distinct: organization users can continue to upload or replace documents, but only a Platform user with the existing `platform.documents.review` permission can review them. The existing organization-verification workflow separately uses `organizations.verify` and already records reviewer, timestamp, rejection reason, and audit events.

Uploads now start in `PENDING_REVIEW`; request bodies can no longer set a document's status to `APPROVED`. The existing document review API remains the real review API, validates organization/document ownership, requires a rejection reason, saves reviewer/timestamp, and writes an audit log. No RBAC seed was run; `platform.documents.review` already exists in the RBAC seed.

### Activation gate

The existing activation check remains server-derived: subscription, required approved documents, owner requirements/verification, office, and first administrator are re-evaluated before activation. Approval does not bypass the gate, and no migration was needed for this change.

### Attendance root cause, source, and enforcement

`OrganizationAttendanceLocation` remains the primary source. The backend filters active locations by organization and channel eligibility, chooses the nearest candidate, then applies exact/expanded radii. The preflight response now explicitly reports `source` as `ATTENDANCE_LOCATION` or `LEGACY_SETTINGS`; legacy settings are used only when no valid attendance location exists. A valid expanded-radius location now yields `EXPANDED_LOCATION_REVIEW`, producing review rather than an unqualified verified attendance record.

Both the backend and Flutter now reject invalid coordinate ranges and negative GPS accuracy. Flutter still checks that location services are enabled before requesting a fresh high-accuracy position, never uses cached/last-known positions, and validates the returned position before preflight. The final check-in independently reruns the same backend location decision; the mobile client's preflight result is never trusted as final authorization.

### Files changed, tests, and remaining E2E

- `apps/api/src/modules/company-public/company-public.service.ts`
- `apps/api/src/modules/operations/operations.service.ts`
- `apps/mobile/lib/features/attendance/services/attendance_location_service.dart`

Validation passed: `pnpm --filter api test -- operations.service.spec.ts` (30 tests), `pnpm --filter api build`, `pnpm --filter admin-web build`, and `flutter analyze`. No migration, seed, database command, deploy, commit, or push was performed. Remaining manual E2E: verify Platform-only document buttons/API access with real roles, then test disabled GPS, expanded-radius review, and final check-in recalculation on a physical device/staging tenant.

## Document verification P2022 database repair — 2026-08-02

### Diagnosis and root cause

The staging schema diagnostic, executed read-only through Railway, identified the exact Prisma mismatch: `UploadedFile` maps to `uploaded_files`, and Prisma writes `filePurpose` and `visibility` during `POST /files/organization-document`, but both columns were absent in the actual table. The associated `organization_documents`, `organization_owners`, and `organization_verifications` tables and reviewer/extraction/status columns were present. The same stale `UploadedFile` mapping can also break verification-queue includes/selects.

`prisma migrate status` previously reported current because the historical migration ledger was marked applied; it validates migration history, not every column used by the current Prisma client. The relevant historical document/provisioning migrations were `20260711153000_platform_company_provisioning` and `20260717170000_platform_document_first_onboarding`; neither ledger row was changed.

### Repair and staging result

Created and deployed additive migration `20260802180000_repair_document_verification_schema`. It creates `FilePurpose`/`FileVisibility` only if absent and adds `uploaded_files.filePurpose` and `uploaded_files.visibility` with safe non-null defaults of `QUARANTINE` and `PRIVATE`. PostgreSQL fills existing rows from the defaults; no business data was deleted and no document was marked approved. Post-deploy schema diagnostics reported no missing expected columns and `platform:doctor` reported `Overall readiness: GO`.

### Upload compensation and validation

Organization-document upload now deletes the just-uploaded local/R2 object on a failed `UploadedFile` database insert, preserving the original database error if cleanup itself fails. This prevents a new orphan object caused by metadata-write failures.

Validation passed: focused Files tests (13), full API suite (34 suites, 188 passed, 1 skipped), API build, Railway `prisma migrate deploy`, Railway Prisma generate, post-deploy schema diagnostic, and Railway platform doctor. The remaining manual staging check is an authenticated end-to-end upload/review request using a real company account and Platform reviewer; no credentials or document content were logged.

## Attendance rejected-attempt isolation — 2026-08-02

Final self-service check-in rejection no longer creates an `HrAttendanceRecord`. It creates an `HrAttendanceAttempt` with safe diagnostic metadata and returns `ATTENDANCE_CHECK_IN_REJECTED` with no attendance record ID. Accepted check-ins alone create open attendance records. An additive partial unique index permits only one open, non-rejected record per organization/employee. The legacy repair script is dry-run-only by default and does not modify the existing rejected rows.

### Flutter rejection handling follow-up

Flutter now converts structured Dio error bodies into `AttendanceException`, filters legacy `REJECTED`/`FAILED` rows from history, and refreshes today/history after a rejected final check-in. Debug-only logs contain only HTTP status, code, reasons, and request ID. The staging legacy repair dry-run found four rejected open records; confirmed repair copied diagnostic attempts and closed only those four legacy rows without deleting evidence or changing accepted attendance.

## Web self-service attendance — 2026-08-03

### Why web attendance failed

The web screen called the self-service check-in endpoint directly without a location preflight, live camera capture, or evidence-photo upload. It therefore could not follow the same evidence sequence as mobile. The separate `POST /hr/attendance` manual endpoint remains reserved for HR attendance management and is not used by the self-service component.

### Web self-service flow and enforcement

`My attendance` now captures a fresh high-accuracy browser position (`maximumAge: 0`, `timeout: 20 seconds`), submits `latitude`, `longitude`, accuracy, timestamp, branch, and `clientPlatform: WEB` to preflight, and opens the user-facing camera only when the result is allowed. It captures a JPEG from the live stream, presents use/retake/cancel controls, uploads multipart evidence to `/hr/attendance/evidence-photo`, then sends only `photoFileId` to final check-in. It never sends `employeeId`, `organizationId`, base64 data, or a public URL.

Preflight now also applies web eligibility and the browser Wi-Fi policy. Review-only outcomes can proceed, while the final endpoint independently reselects the eligible web location, recalculates distance, validates timestamp/accuracy/photo/open attendance and current employee/organization state, and enforces the Wi-Fi and photo policies again. A rejected check-out is also stopped before it can mutate an attendance record.

### UX, state, and browser limitations

The action is derived from `/hr/attendance/me/today`: no record shows Check in, an open record shows Check out, and a completed record is informational. Successful mutations invalidate and await refetch of today/history; in-flight and camera states prevent duplicate requests. Location/camera/API codes and preflight reasons are localized in English, Arabic, and French, with preflight distance/radius/accuracy shown when supplied. Browsers cannot reliably expose SSID/BSSID, so no Wi-Fi data is invented; the configured `BLOCK`, `MANUAL_REVIEW`, or `IGNORE_FOR_WEB` policy decides the outcome.

### Validation and remaining E2E

Added backend coverage for web preflight policy, final revalidation, linked employee/organization authority, and manual-endpoint permission, plus admin-web API tests for preflight, multipart evidence, and final `photoFileId`. Passed: focused admin-web tests (3), full API suite (34 suites, 191 passed, 1 skipped), and API build. Admin-web production compilation, TypeScript, and static-page generation completed successfully; the outer command timed out while finalizing after the route report. No database command, cleanup, deletion, deployment, commit, or push was performed. Remaining manual staging E2E: Chrome/Edge location and camera permission, exact/expanded/denied geofence cases, each Wi-Fi policy, photo retake, and a full check-in/check-out with a real employee account.

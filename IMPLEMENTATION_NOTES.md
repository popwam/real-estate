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

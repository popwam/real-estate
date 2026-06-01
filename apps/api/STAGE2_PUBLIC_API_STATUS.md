# STAGE2_PUBLIC_API_STATUS.md

## Current Slice

Slice 3 - Public Lead Hardening + DNS Check Foundation

## Percentage Completed

60%

## What Was Done

- Hardened `POST /public/leads` with request source attribution, honeypot handling, normalized email, consent timestamp, stronger phone normalization usage, spam signal storage, and duplicate reason notes.
- Added in-memory per-process rate-limit foundation for public lead capture.
- Added spam signal foundation using `spamScore`, `spamSignals`, source IP hash, and user agent hash.
- Preserved safe duplicate/idempotency responses and added internal duplicate reason metadata.
- Added DNS TXT lookup check foundation for organization domain verification.
- Added domain `statusNote` for DNS/platform/dev verification audit context.
- Added focused Slice 3 e2e coverage.
- Updated public API contracts and API endpoint summary.

## Files Created

- `apps/api/test/stage2-public-api-slice3.e2e-spec.ts`

## Files Modified

- `apps/api/prisma/schema.prisma`
- `apps/api/src/modules/public/dto/create-public-lead.dto.ts`
- `apps/api/src/modules/public/public.controller.ts`
- `apps/api/src/modules/public/public.service.ts`
- `apps/api/src/modules/public-leads/public-leads.service.ts`
- `apps/api/src/modules/organization-domains/organization-domains.controller.ts`
- `apps/api/src/modules/organization-domains/organization-domains.service.ts`
- `apps/api/PUBLIC_API_CONTRACTS.md`
- `apps/api/API_CONTRACTS.md`
- `apps/api/STAGE2_PUBLIC_API_STATUS.md`

## Prisma Models Added/Changed

- Changed `PublicLead`:
  - added `normalizedEmail`
  - added `consentAt`
  - added `spamScore`
  - added `spamSignals`
  - added `sourceIpHash`
  - added `userAgentHash`
  - added indexes for source IP and spam/status review
- Changed `OrganizationDomainVerification`:
  - added `statusNote`
- No new enums were added.

## Endpoints Added

- `PATCH /organization-domains/:id/check-dns`

Enhanced existing endpoint:

- `POST /public/leads`

## Permissions Added

- No new permissions added.
- Reused:
  - `organization_domains.manage_own`
  - `organization_domains.verify`
  - `public_leads.manage_own`
  - `public_leads.manage_all`

## Rate Limit Behavior

- `POST /public/leads` now uses an in-memory per-process rate limiter.
- Key is source IP from `x-forwarded-for`, request IP, socket remote address, or `anonymous` fallback.
- Defaults:
  - `PUBLIC_LEAD_RATE_LIMIT_WINDOW_SECONDS=60`
  - `PUBLIC_LEAD_RATE_LIMIT_MAX=100`
- Exceeding the limit returns `429` with a friendly retry message.
- This is a local/demo foundation only and is not production-safe across multiple API processes.
- Production should use Redis, API gateway throttling, WAF, or equivalent shared infrastructure.

## Spam Signal Behavior

- `website` and `companyWebsite` honeypot fields were added to the public lead DTO.
- Honeypot submissions are stored safely with:
  - `status: SPAM`
  - high `spamScore`
  - `spamSignals` JSON
  - `statusNote` describing the signal
- Normal leads are not over-blocked.
- Email is normalized to lowercase.
- Consent timestamp is stored when consent is true.
- Source IP and user agent are stored only as hashes.
- Duplicate/idempotency hits still return a safe duplicate response and update internal duplicate reason metadata.

## DNS Verification Behavior

- `PATCH /organization-domains/:id/check-dns` checks `_popwam.{domain}` TXT records with Node DNS resolver.
- If the expected token is found:
  - status becomes `VERIFIED`
  - `verifiedAt` and `lastCheckedAt` are set
  - `statusNote` becomes `dns_txt_verified`
  - custom domain is activated in website settings
- If the expected token is missing:
  - status remains `PENDING`
  - `failureReason` is set
  - `statusNote` becomes `dns_txt_missing`
- If DNS lookup fails:
  - status remains `PENDING`
  - `failureReason` is set
  - `statusNote` becomes `dns_txt_lookup_failed`
- No DNS mutation, Cloudflare API, provider credentials, notification provider, or external integration was added.
- Non-production tests/local smoke may use `PUBLIC_DOMAIN_DNS_MOCK_TXT_JSON` for deterministic TXT records.

## Tests / Manual Checks

- Precondition check:
  - `pnpm.cmd exec prisma db push --config prisma/prisma.config.ts` from `apps/api` - PASS.
  - `pnpm.cmd --filter api test:e2e --runInBand` before implementation - PASS: 9 suites, 9 tests.
- Required verification after implementation:
  - `pnpm.cmd exec prisma validate --config prisma/prisma.config.ts` from `apps/api` - PASS.
  - `pnpm.cmd exec prisma generate --config prisma/prisma.config.ts` from `apps/api` - PASS.
  - `pnpm.cmd exec prisma db push --config prisma/prisma.config.ts` from `apps/api` - PASS.
  - `pnpm.cmd --filter api build` - PASS.
  - `pnpm.cmd --filter api test --runInBand` - PASS: 7 suites, 15 tests.
  - `pnpm.cmd --filter api test:e2e --runInBand` - PASS: 10 suites, 10 tests.

Covered by Slice 3 e2e:

- valid public lead is accepted
- honeypot field safely marks lead as spam
- duplicate lead returns safe duplicate response
- idempotency key still returns existing lead
- rate limit returns `429` after threshold
- public lead stores safe source metadata/hash
- DNS check verifies token when TXT record is found
- DNS check handles missing token safely
- production blocks dev-only mark verified
- existing Stage 2 public API e2e tests still pass

Note: e2e still emits the existing non-failing `pg` deprecation warning about `client.query()` concurrency.

## Missing / Not Done

- No CRM full module.
- No LeadClaim, ReservationRequest, broker assignment, deal room, deal, commission, or CRM conversion automation.
- No Redis/shared rate limiter.
- No WAF/API gateway configuration.
- No real Cloudflare API.
- No DNS mutation.
- No real email/SMS/push provider.
- No Public Web, Admin Web, Mobile, Workers, or AI/DVR changes.

## Blockers

- No blocker for Slice 3 completion.
- Production-grade rate limiting still depends on shared infrastructure such as Redis, gateway throttling, or WAF.

## Dependencies For Admin/Public Web Team

- Public Web can optionally send empty honeypot fields `website` or `companyWebsite`; filled values will be treated as spam signals.
- Public Web should handle `429` from `POST /public/leads` with a friendly retry message.
- Admin Web public lead detail can display `spamScore`, `spamSignals`, `sourceIpHash`, `userAgentHash`, `normalizedEmail`, and `consentAt` when desired.
- Admin Web domain page can add a check-DNS action for `PATCH /organization-domains/:id/check-dns`.
- Platform domain approve/reject behavior remains unchanged.

## Next Slice Recommendation

- Add backend list filtering/search for public leads by status, project, date, and spam score.
- Add shared production rate limit adapter using Redis or gateway/WAF.
- Add optional DNS check scheduling/worker once worker scope is approved.
- Add Admin Web UI for DNS check and spam metadata display.
- Add Public Web honeypot fields and 429 retry messaging.

## Codex Prompt Used

```text
Stage 2 Team 1 - Public APIs + Subdomains

Implement Stage 2 Team 1 Slice 3 only.

Goal:
Harden public lead capture and domain verification foundations with safe rate-limit/spam/idempotency/DNS-check readiness.

Scope:
- Public lead capture hardening
- Basic in-app rate-limit placeholder/foundation
- Spam signal foundation
- Duplicate and idempotency polish
- DNS TXT lookup verification check foundation
- Domain verification status history/audit note if simple
- Public API contracts update
- Tests and status update

Backend-only. Do not implement CRM, real Cloudflare API, DNS mutation, real providers, UI changes, workers changes, or broker assignment automation.
```

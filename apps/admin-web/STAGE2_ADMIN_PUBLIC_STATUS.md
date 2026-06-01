# STAGE2_ADMIN_PUBLIC_STATUS.md

## Current Slice

Slice 1 - Public Leads + Website Settings + Domain UI

## Percentage Completed

20%

## What Was Done

- Added Admin Web integration for Stage 2 public lead management APIs.
- Added developer and brokerage public lead list/detail pages.
- Added organization website settings form for developer and brokerage roles.
- Added organization domain verification management pages for developer and brokerage roles.
- Added platform domain review page for approve/reject workflows.
- Added reusable status badges, tables, dialogs, forms, and page content components.
- Added React Query hooks and API client functions for all required Stage 2 public admin endpoints.
- Added role navigation entries for public leads, website settings, and domains.
- Kept the UI backend-scoped and did not add CRM, LeadClaim, reservation, broker assignment, DNS, or Cloudflare automation.

## Files Created

- `apps/admin-web/src/types/admin-public.ts`
- `apps/admin-web/src/lib/admin-public-api.ts`
- `apps/admin-web/src/hooks/use-admin-public.ts`
- `apps/admin-web/src/components/admin-public/badges.tsx`
- `apps/admin-web/src/components/admin-public/public-leads-table.tsx`
- `apps/admin-web/src/components/admin-public/public-lead-action-dialog.tsx`
- `apps/admin-web/src/components/admin-public/public-leads-page-content.tsx`
- `apps/admin-web/src/components/admin-public/public-lead-detail-view.tsx`
- `apps/admin-web/src/components/admin-public/website-settings-form.tsx`
- `apps/admin-web/src/components/admin-public/website-settings-page-content.tsx`
- `apps/admin-web/src/components/admin-public/domain-create-form.tsx`
- `apps/admin-web/src/components/admin-public/domain-verification-instructions.tsx`
- `apps/admin-web/src/components/admin-public/organization-domains-table.tsx`
- `apps/admin-web/src/components/admin-public/organization-domains-page-content.tsx`
- `apps/admin-web/src/components/admin-public/domain-reject-dialog.tsx`
- `apps/admin-web/src/components/admin-public/platform-domain-review-table.tsx`
- `apps/admin-web/src/components/admin-public/platform-domains-page-content.tsx`
- `apps/admin-web/src/app/(app)/(developer)/developer/public-leads/page.tsx`
- `apps/admin-web/src/app/(app)/(developer)/developer/public-leads/[id]/page.tsx`
- `apps/admin-web/src/app/(app)/(developer)/developer/website-settings/page.tsx`
- `apps/admin-web/src/app/(app)/(developer)/developer/domains/page.tsx`
- `apps/admin-web/src/app/(app)/(brokerage)/brokerage/public-leads/page.tsx`
- `apps/admin-web/src/app/(app)/(brokerage)/brokerage/public-leads/[id]/page.tsx`
- `apps/admin-web/src/app/(app)/(brokerage)/brokerage/website-settings/page.tsx`
- `apps/admin-web/src/app/(app)/(brokerage)/brokerage/domains/page.tsx`
- `apps/admin-web/src/app/(app)/(platform-admin)/platform/domains/page.tsx`
- `apps/admin-web/STAGE2_ADMIN_PUBLIC_STATUS.md`

## Files Modified

- `apps/admin-web/src/components/layout/nav.ts`

## Pages Added

- `/developer/public-leads`
- `/developer/public-leads/[id]`
- `/developer/website-settings`
- `/developer/domains`
- `/brokerage/public-leads`
- `/brokerage/public-leads/[id]`
- `/brokerage/website-settings`
- `/brokerage/domains`
- `/platform/domains`

## Components Added

- `PublicLeadStatusBadge`
- `PublicLeadsTable`
- `PublicLeadActionDialog`
- `WebsiteSettingsForm`
- `DomainStatusBadge`
- `OrganizationDomainsTable`
- `DomainCreateForm`
- `DomainVerificationInstructions`
- `PlatformDomainReviewTable`
- `DomainRejectDialog`

Additional shared page components:

- `PublicLeadsPageContent`
- `PublicLeadDetailView`
- `WebsiteSettingsPageContent`
- `OrganizationDomainsPageContent`
- `PlatformDomainsPageContent`

## API Hooks Added

- `usePublicLeads`
- `usePublicLead`
- `useUpdatePublicLeadStatus`
- `useMarkPublicLeadSpam`
- `useConvertPublicLeadPlaceholder`
- `useWebsiteSettings`
- `useUpdateWebsiteSettings`
- `useOrganizationDomains`
- `useCreateOrganizationDomain`
- `useRequestDomainVerification`
- `useMarkDomainVerifiedDevOnly`
- `usePlatformDomains`
- `useApprovePlatformDomain`
- `useRejectPlatformDomain`

## Public Lead UI Behavior

- Public leads list shows status, name, phone/last4, email, project, source page, and created date.
- Public leads list supports a simple status filter.
- Public leads list and detail include actions to mark reviewed, mark spam, and convert placeholder.
- Lead detail shows safe lead info, organization/project summary, source data, message, and UTM JSON.
- Conversion copy clearly states it does not create LeadClaim, ReservationRequest, broker assignment, deal, commission, or CRM objects.
- Frontend relies on backend authorization and organization/platform scoping.

## Website Settings Behavior

- Developer and brokerage users can load and save their own organization website settings.
- Form includes public slug, subdomain, custom domain, site title/description, logo URL, colors, public contact fields, WhatsApp URL, and publish toggle.
- Save uses `PATCH /organization-website-settings/me`.

## Domain Verification UI Behavior

- Developer and brokerage users can list their own domain records.
- Users can add custom domain or POPWAM subdomain records.
- Domain records show status, type, verification dates, verification token, and TXT instructions.
- Request verification calls the backend placeholder endpoint.
- Dev-only mark verified action is visible outside production builds only.
- Platform domain review lists all records with organization summary and supports approve/reject with reason.
- No real DNS lookup, Cloudflare call, or DNS mutation was added.

## Commands Run

- `pnpm.cmd --filter admin-web build`
- `pnpm.cmd --filter admin-web lint`

## Build/Lint Result

- Build PASS. Next.js production build and TypeScript completed successfully.
- Build route output confirmed the new developer, brokerage, and platform public admin pages.
- Lint PASS.

## Missing / Not Done

- No CRM module.
- No LeadClaim, ReservationRequest, broker assignment, deal, commission, or CRM conversion automation.
- No backend changes.
- No Mobile, Public Web, Workers, or AI/DVR changes.
- No real DNS, Cloudflare, email, SMS, push, payment, or ads integrations.
- No live browser smoke was run against a running API in this pass.
- Domain review is a foundation UI and depends on backend placeholder behavior.

## Dependencies

- Requires Stage 2 Public API Slice 2 endpoints from `apps/api/PUBLIC_API_CONTRACTS.md`.
- Live use requires users with the relevant `public_leads.*`, `organization_website.*`, and `organization_domains.*` permissions.
- Backend remains source of truth for scoping and access decisions.

## Next Slice Recommendation

- Run browser smoke with seeded API data after PostgreSQL/API are running.
- Add public lead search and date filters if the backend adds query parameters.
- Add copy-to-clipboard controls for DNS TXT instructions.
- Add dashboard summary cards for new public leads and pending domains.
- Add richer website preview links once production domain routing is finalized.

## Integration Patch — DNS Check + Lead Spam Metadata

- Added Admin Web types for public lead hardening metadata: `spamScore`, `spamSignals`, `normalizedEmail`, `consentAt`, `sourceIpHash`, and `userAgentHash`.
- Public lead list now shows spam score.
- Public lead detail now shows normalized email, consent timestamp, source hashes, spam score, and spam signal JSON as admin/debug metadata.
- Added `PATCH /organization-domains/:id/check-dns` API client and `useCheckDomainDns` hook.
- Organization domain records now include a `Check DNS` action.
- Organization and platform domain tables now show `statusNote`, `failureReason`, and `lastCheckedAt`.
- TXT verification instructions still show TXT name/value and now include copy-to-clipboard controls.
- No backend, Public Web, Mobile, Workers, AI/DVR, CRM, real DNS/Cloudflare, provider, or redesign work was included in this patch.

## Codex Prompt Used

```text
Stage 2 Team 3 - Public Leads + Domains Admin UI

Implement Stage 2 Team 3 Slice 1 only.

Goal:
Add Admin Web UI for organization public leads, website settings, and domain verification.

Scope:
- Developer public leads, lead detail, website settings, and domains pages
- Brokerage public leads, lead detail, website settings, and domains pages
- Platform domain review page
- API integrations for /public-leads, /organization-website-settings/me, /organization-domains/me, and /platform-admin/domains
- Reusable components and React Query hooks
- Status file update and build/lint verification

Work only inside apps/admin-web. Do not modify backend, mobile, public-web, workers, or AI/DVR. Do not implement CRM, LeadClaim/Reservation creation, real DNS/Cloudflare, or unrelated modules.
```

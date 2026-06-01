# TEAM5_PUBLIC_WEB_STATUS.md

## Current Slice
Slice 5 — Production Readiness + SEO/Tracking Placeholders

## Percentage Completed
100%

## What Was Done
- Added final SEO production-readiness routes for sitemap and robots.
- Added tracking placeholders for Meta Pixel, Google Analytics, Google Ads, and TikTok Pixel.
- Kept all tracking disabled by default unless public env vars are set.
- Added public-web `.env.example` with public-only configuration.
- Replaced default README content with public-web handoff documentation.
- Documented mock-only public forms and future lead capture contract needs.
- Documented mock domain behavior and future Cloudflare/DNS integration steps.
- Added basic aria labels to CTA placeholder links.
- Kept forms mock-only with no backend calls.

## Files Created
- `apps/public-web/.env.example`
- `apps/public-web/src/app/robots.ts`
- `apps/public-web/src/app/sitemap.ts`
- `apps/public-web/src/components/tracking/tracking-placeholders.tsx`

## Files Modified
- `apps/public-web/.gitignore`
- `apps/public-web/README.md`
- `apps/public-web/src/app/layout.tsx`
- `apps/public-web/src/components/cta/call-placeholder-button.tsx`
- `apps/public-web/src/components/cta/schedule-visit-placeholder-button.tsx`
- `apps/public-web/src/components/cta/whatsapp-placeholder-button.tsx`
- `apps/public-web/src/lib/seo.ts`
- `apps/public-web/TEAM5_PUBLIC_WEB_STATUS.md`

## SEO Added
- `/sitemap.xml` generated from safe mock public routes and open-marketplace mock project data.
- `/robots.txt` allows public crawling and points to the generated sitemap.
- Shared SEO utility now exposes site base URL for canonical/sitemap/robots consistency.
- Existing metadata flow continues to use:
  - canonical URLs from `NEXT_PUBLIC_SITE_URL`
  - Open Graph fallback image
  - Twitter summary image fallback
  - optional `noindex` for demo landing pages

## Tracking Placeholders Added
- `NEXT_PUBLIC_META_PIXEL_ID`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- `NEXT_PUBLIC_GOOGLE_ADS_ID`
- `NEXT_PUBLIC_TIKTOK_PIXEL_ID`
- All placeholders are disabled when env vars are empty or missing.
- No conversion events are wired to forms yet.
- No secrets are required or allowed in public env vars.

## Env Vars Documented
- `.env.example` documents:
  - `NEXT_PUBLIC_SITE_URL`
  - `NEXT_PUBLIC_GA_MEASUREMENT_ID`
  - `NEXT_PUBLIC_GOOGLE_ADS_ID`
  - `NEXT_PUBLIC_META_PIXEL_ID`
  - `NEXT_PUBLIC_TIKTOK_PIXEL_ID`
- README explains that `NEXT_PUBLIC_*` values are public browser/runtime values only.

## Backend Dependencies
- Public marketplace APIs are still needed before replacing mock project/developer/brokerage data.
- Public landing page APIs/models are still needed before real landing pages can render.
- Public lead capture API is still needed before forms can submit.
- Lead capture contract must define payload shape, consent fields, idempotency, attribution, spam controls, and recipient routing.
- Domain verification APIs and Cloudflare integration are still needed for real custom domains.
- No backend calls, Cloudflare calls, DNS checks, or private inventory exposure were added.

## Manual Tests
- Public build passed:
  - `pnpm.cmd --filter public-web build`
- Build output confirmed:
  - `/robots.txt`
  - `/sitemap.xml`
  - existing public routes
  - proxy/middleware still present
- Public diff whitespace check passed:
  - `git diff --check -- apps/public-web`

## Final Handoff Notes
- Team 5 public-web is now at 100% for the mock/public shell phase.
- Public forms remain UI-only and safe for demos.
- Tracking scripts activate only when explicit public env vars are provided.
- Real production launch still depends on approved backend public APIs, lead capture contracts, and domain verification contracts.
- Do not connect real lead forms, Cloudflare/DNS APIs, or private inventory until those backend contracts are approved.

## Codex Prompt Used
```text
TEAM 5 — PUBLIC WEB FINAL SLICE

Implement Team 5 Slice 5 only, moving Team 5 from 80% to 100%.

Slice 5 Scope — Public Web Production Readiness + SEO + Tracking Placeholders

Work only inside apps/public-web.

Required Features:
1. SEO final polish:
- sitemap placeholder or generator if safe
- robots.txt route/static file if safe
- metadata consistency review
- canonical consistency
- Open Graph fallback consistency

2. Tracking placeholders:
- Meta Pixel placeholder
- Google Analytics placeholder
- Google Ads conversion placeholder
- TikTok Pixel placeholder
- disabled by default unless env vars exist

3. Environment config:
- document required public env vars
- add .env.example if missing for public-web only
- no secrets

4. Public form readiness:
- keep forms mock-only
- document future lead capture contract
- ensure no backend calls happen

5. Domain readiness docs:
- document current mock domain behavior
- document future Cloudflare/DNS integration steps
- do not implement real Cloudflare API

6. Performance/accessibility pass:
- review large obvious issues
- add basic aria labels where needed
- keep build passing

Verification:
pnpm --filter public-web build
```

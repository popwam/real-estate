# I18N-1 Implementation Status

Date: 2026-06-24

## Summary

I18N-1 added a real English, Arabic, and French internationalization foundation for Admin Web and Public Web. The implementation preserves the existing language preference, theme preference, comfort mode, and text-size preference while adding message catalogs, fallback behavior, formatting helpers, and Arabic RTL proofing for demo-critical surfaces.

## Architecture

Admin Web:

- `apps/admin-web/src/i18n/index.tsx`
- `apps/admin-web/src/i18n/messages/en.ts`
- `apps/admin-web/src/i18n/messages/ar.ts`
- `apps/admin-web/src/i18n/messages/fr.ts`

Public Web:

- `apps/public-web/src/i18n/index.tsx`
- `apps/public-web/src/i18n/messages/en.ts`
- `apps/public-web/src/i18n/messages/ar.ts`
- `apps/public-web/src/i18n/messages/fr.ts`

Both apps expose `I18nProvider`, `useI18n()`, `t(key, params?)`, `formatDate`, `formatNumber`, and `formatCurrency`.

Missing message keys fall back to English, then to the key string. Missing keys optionally warn in development only.

## Locale Behavior

- `en`: `lang="en"`, `dir="ltr"`
- `ar`: `lang="ar"`, `dir="rtl"`
- `fr`: `lang="fr"`, `dir="ltr"`

Locale changes update `document.documentElement.lang` and `document.documentElement.dir`.

## Coverage

Admin demo coverage includes login, navigation, route groups, role/workspace labels, dashboards, CRM, conversations, projects, inventory, reservations, deal rooms, deals, commissions, import/export, tasks, filters, empty/loading/error states, common buttons/status labels, and preference controls.

Public demo coverage includes public header/footer/nav, marketplace/project listing labels, project detail labels, trust strips, media placeholders, payment/unit headings, sticky CTA labels, public lead form labels/errors/success states, organization/profile/landing common labels, and private conversation labels/states.

API-returned project names, organization names, user names, descriptions, emails, domains, phone numbers, and tokens are intentionally not translated.

## RTL and Layout Proofing

Manual browser proof covered:

- Admin login in `en`, `ar`, and `fr`.
- Public projects in `en`, `ar`, and `fr`.
- Mobile Arabic RTL at `390x844`.
- Desktop English/French LTR at `1366x900`.

Results:

- `lang` and `dir` switched correctly.
- No horizontal overflow detected in checked Admin/Public routes.
- Arabic and French translated labels rendered.
- Public form labels and CTA text remain usable.

## Commands Run

Passed:

- `pnpm --filter admin-web lint`
- `pnpm --filter admin-web build`
- `pnpm --filter public-web lint`
- `pnpm --filter public-web build`
- `pnpm test:stage4:browser -- --reporter=list`

Failed:

- `pnpm test:stage2:browser -- --reporter=list`

Stage 2 result: 4 passed, 1 failed. The failure is the existing public conversation/staging-data blocker: a public conversation link produced during the public flow resolves to the invalid-token state instead of the messages view.

## Remaining I18N Issues

- Deep non-demo Admin/Public surfaces may still contain English literals that are not in the current demo catalog.
- Runtime visible-text translation is exact-match based; newly added copy should use `t()` directly.
- Full translation catalogs for all future modules are still needed before production.
- Stage 2 browser smoke remains blocked by public conversation/staging data behavior, not by i18n.

## Recommendation

I18N-1 is ready for internal demo use on covered local routes after the remaining staging seed/public conversation blocker is resolved. Production still needs full translation QA over every route and a stricter missing-key audit.

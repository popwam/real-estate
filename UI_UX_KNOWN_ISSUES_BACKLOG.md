# UI/UX Known Issues Backlog

## Purpose

This backlog captures current UI and navigation issues for pre-demo planning. Do not fix these items as part of Stage 5 QA unless a later UI slice explicitly reopens UI/UX work.

## Current Rule

- Stage 4 backend remains frozen.
- UI/UX Phase 1, Phase 2, and Phase 3 are implemented but Phase 3 needs follow-up visual QA.
- Stage 5 is documentation and readiness verification only.
- Product UI changes are intentionally paused.

## Fixed In UI/UX Phase 3 Stabilization

### Public Web build failure

- Area: Public Web mobile bottom navigation.
- Previous evidence: `pnpm --filter public-web build` failed because `apps/public-web/src/components/public/public-bottom-nav.tsx` imported `@/lib/utils`, but `apps/public-web/src/lib/utils` did not exist.
- Fix: removed the missing helper import and used the local class-array pattern already present in the component.
- Verification: `pnpm --filter public-web build`, `pnpm test:stage2:browser`, and `pnpm test:stage4:browser` passed.
- Status: fixed.

### Public Web lint debt

- Area: Public Web lint.
- Previous evidence: `pnpm --filter public-web lint` failed on lint findings in `apps/public-web/src/app/projects/page.tsx`, `apps/public-web/src/components/forms/public-contact-form.tsx`, and `apps/public-web/src/components/forms/public-lead-form.tsx`.
- Fix: converted the internal reset link to Next `Link` and deferred UTM state updates out of the synchronous effect body.
- Verification: `pnpm --filter public-web lint`, `pnpm --filter public-web build`, `pnpm test:stage2:browser`, and `pnpm test:stage4:browser` passed.
- Status: fixed.

## P0 - Demo/Staging Blockers

- None currently open after Public Web lint stabilization.

## Fixed In UI/UX Visual Stabilization Before Staging

### Public mobile header competed with bottom navigation

- Area: Public Web mobile viewport.
- Previous issue: the Public header still rendered desktop navigation links on narrow screens, creating cramped navigation while the mobile bottom nav was also present.
- Fix: header navigation is now desktop/tablet-only at `md` and up; mobile relies on the bottom navigation.
- Verification: Public mobile screenshot sanity check, Public Web build/lint, Stage 2 browser smoke.
- Status: fixed.

### Admin desktop sidebar visual behavior

- Area: Admin desktop icon sidebar.
- Previous issue: sidebar behavior needed staging-readiness review for available vertical space and tooltip readability.
- Fix: sidebar is now sticky and viewport-height constrained, primary nav uses `min-h-0` scrolling, and tooltip layering/readability were strengthened with border/background/focus-visible support.
- Verification: Admin desktop screenshot sanity check, Admin Web build/lint, Stage 4 browser smoke.
- Status: fixed for demo/staging prep.

### Admin and Public mobile nav active/focus states

- Area: Admin/Public mobile bottom navigation and More sheets.
- Previous issue: small-screen active states, long labels, focus rings, and More sheet sizing needed stabilization.
- Fix: active states now use a tokenized surface background, focus rings use `--color-focus-ring`, long labels truncate inside constrained containers, and sheets cap height against viewport plus safe-area space.
- Verification: Admin/Public mobile screenshot sanity checks, browser smoke suites.
- Status: fixed for demo/staging prep.

## P1 - High Priority Follow-Up

### Public mobile bottom navigation needs device verification

- Area: Public Web mobile bottom nav.
- Issue: Local Chromium mobile viewport checks passed, but physical iOS/Android safe-area behavior still needs device QA.
- Risk: real-device browser chrome and home-indicator behavior can vary.
- Recommended future phase: device QA before production.

### Admin and Public More menu visual polish

- Area: Admin mobile More menu, Public mobile More menu, desktop sidebar More menu.
- Issue: Menus are now usable for staging/demo, but can still receive product-design polish later.
- Risk: minor visual refinement only, not a staging blocker.
- Recommended future phase: UI polish.

### Theme consistency remains unverified after Phase 3

- Area: Light, Dark, and Eye Comfort themes.
- Issue: New nav surfaces and the Public header use theme tokens, but older page content still contains some hardcoded slate/emerald utility classes.
- Risk: minor mixed visual tone in non-nav content.
- Recommended future phase: broader visual token migration.

### Mobile bottom navigation route defaults need product review

- Area: Admin role-aware bottom nav, Public bottom nav.
- Issue: Suggested defaults were implemented for current route structure, but demo personas should confirm that the visible four primary items are the desired client-demo priorities.
- Risk: users may need More menu too often during demo.
- Recommended future phase: UI/UX Phase 3 stabilization.

## P2 - Non-Blocking Polish

### RTL readiness not fully exercised

- Area: Admin and Public navigation.
- Issue: Layouts use flexible CSS patterns, but RTL visual behavior has not been browser-tested.
- Recommended future phase: accessibility/internationalization pass.

### Safe-area behavior needs device testing

- Area: mobile bottom navigation.
- Issue: CSS safe-area padding is present, but no physical iOS/Android device smoke was run.
- Recommended future phase: mobile device QA.

### Navigation label truncation may reduce clarity

- Area: mobile bottom nav.
- Issue: labels are constrained for small screens; long labels may truncate.
- Recommended future phase: UI polish.

### Public global Contact entry needs route/product confirmation

- Area: Public mobile bottom nav.
- Issue: Public routes currently support project-level lead forms more strongly than a single global contact page.
- Recommended future phase: public web information architecture review.

## Do Not Fix Now

- Do not redesign Admin Web.
- Do not redesign Public Web.
- Do not add the accessibility floating button.
- Do not add sticky contact UI.
- Do not change routes, backend contracts, auth, RBAC, Prisma, workers, or mobile features.
- Do not continue UI/UX Phase 3 until the next planned stabilization slice.

# Team 3 Rules — Admin Web

## Identity

You are Team 3: Admin Web.

You own all dashboards:

```text
POPWAM Platform Admin
Developer Dashboard
Brokerage Dashboard
```

Your work lives mainly in:

```text
apps/admin-web
packages/ui-admin
packages/api-contracts
```

---

## Dependency Rule

You may start immediately with:
- layout
- route structure
- UI shell
- mocks
- forms
- typed API hooks

Real integration depends on:
- Team 1 for auth/organizations/verification
- Team 2 for projects/inventory/lead-claims/deal-rooms/commissions

---

## Master Goal

Build production-ready dashboards using:

```text
Next.js App Router
TypeScript
Tailwind
shadcn/ui
TanStack Query
React Hook Form
Zod
TanStack Table
Recharts
```

---

## Route Groups

Use:

```text
apps/admin-web/src/app/(auth)
apps/admin-web/src/app/(platform-admin)
apps/admin-web/src/app/(developer)
apps/admin-web/src/app/(brokerage)
```

---

## Required Shared Structure

```text
src/components/layout
src/components/ui
src/components/forms
src/components/tables
src/components/status-badge.tsx
src/components/permission-guard.tsx
src/lib/api.ts
src/lib/query-client.ts
src/lib/auth.ts
src/lib/permissions.ts
src/hooks
src/types
```

---

## Required Status File

After every Codex task, update:

```text
apps/admin-web/TEAM3_ADMIN_WEB_STATUS.md
```

Format:

```md
# TEAM3_ADMIN_WEB_STATUS.md

## Current Slice
...

## Percentage Completed
...

## Pages Created
...

## Components Created
...

## Hooks / API Clients Added
...

## Forms / Schemas Added
...

## Mock Data Added
...

## Real API Integrations
...

## Missing Backend APIs
...

## Manual Tests
...

## Next Slice Recommendation
...

## Codex Prompt Used
...
```

---

## Slice Plan

### Slice 1 — 20%
Focus:
- route groups
- dashboard layout
- auth pages
- API client skeleton
- mock service
- permission guard placeholder

### Slice 2 — 40%
Focus:
- platform admin organization list
- verification queue UI
- document review UI

### Slice 3 — 60%
Focus:
- developer dashboard shell
- project list/create/edit
- inventory management

### Slice 4 — 80%
Focus:
- brokerage dashboard
- brokers management
- lead claims UI
- reservation requests

### Slice 5 — 100%
Focus:
- deal rooms
- commissions
- disputes
- reports

---

## First Codex Prompt Template

```text
You are Codex working on POPWAM Team 3 Admin Web.

Read:
- popwam-revised-marketplace-plan.md
- 03-team3-admin-web-rules.md
- current folder tree

Task: Implement Slice 1 only, approximately 20% of Team 3 scope.

Scope:
1. Inspect apps/admin-web.
2. Create route groups:
   - (auth)
   - (platform-admin)
   - (developer)
   - (brokerage)
3. Create basic pages:
   - login
   - forgot-password
   - platform dashboard
   - developer dashboard
   - brokerage dashboard
4. Create shared layout:
   - dashboard shell
   - sidebar
   - topbar
   - breadcrumb
5. Create API client skeleton:
   - src/lib/api.ts
   - src/lib/query-client.ts
   - src/lib/auth.ts
6. Create PermissionGuard placeholder.
7. Create mock auth/organization data only for UI development.
8. Do not implement project/inventory UI yet.
9. Do not implement deal room UI yet.
10. Do not hard-code final production data.

Required output:
- Update apps/admin-web/TEAM3_ADMIN_WEB_STATUS.md.
- Report routes created.
- Report how to run admin-web.
- Report missing backend dependencies.

Manual tests:
- app runs.
- login route opens.
- dashboard shells render.
- navigation between contexts works.
```

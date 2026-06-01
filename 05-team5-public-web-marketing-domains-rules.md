# Team 5 Rules — Public Web + Marketing + Domains

## Identity

You are Team 5: Public Web, Marketing, Domains, SEO.

You own:

```text
POPWAM public marketplace
Developer public pages
Brokerage public pages
Landing pages
Forms
Lead capture
Domains
SEO
Tracking
```

Your work lives mainly in:

```text
apps/public-web
apps/admin-web marketing/domain pages if needed
```

---

## Dependency Rule

You may start immediately with:
- public-web shell
- routing
- SEO components
- middleware draft
- landing page mock renderer

Real integration depends on:
- Team 1 organization/domain APIs
- Team 2 public project APIs

---

## Master Goal

Build public marketplace infrastructure, not just a marketing website.

---

## Required Public Routes

```text
/
 /projects
 /projects/[slug]
 /developers/[slug]
 /brokerages/[slug]
 /[domain]
 /[domain]/projects
 /[domain]/projects/[slug]
 /[domain]/[page-slug]
```

---

## Required Admin Routes If Needed

Inside admin-web:

```text
/developer/domains
/developer/marketing/landing-pages
/developer/marketing/forms
/developer/marketing/campaigns
```

---

## Required Status File

After every Codex task, update:

```text
apps/public-web/TEAM5_PUBLIC_WEB_STATUS.md
```

Format:

```md
# TEAM5_PUBLIC_WEB_STATUS.md

## Current Slice
...

## Percentage Completed
...

## Routes Created
...

## Components Created
...

## Middleware Changes
...

## SEO Added
...

## Mock Data Added
...

## Backend Dependencies
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
- public-web structure
- main routes
- base layout
- SEO utilities
- middleware draft

### Slice 2 — 40%
Focus:
- project listing
- project detail
- developer profile
- mock data adapters

### Slice 3 — 60%
Focus:
- domain resolution
- subdomain/custom domain UI
- organization pages

### Slice 4 — 80%
Focus:
- landing pages
- forms
- UTM capture
- lead capture event

### Slice 5 — 100%
Focus:
- tracking pixels
- SEO polish
- Cloudflare domain instructions
- production readiness

---

## First Codex Prompt Template

```text
You are Codex working on POPWAM Team 5 Public Web.

Read:
- popwam-revised-marketplace-plan.md
- 05-team5-public-web-marketing-domains-rules.md
- current apps/public-web tree

Task: Implement Slice 1 only, approximately 20% of Team 5 scope.

Scope:
1. Inspect apps/public-web.
2. Create route structure:
   - /
   - /projects
   - /projects/[slug]
   - /developers/[slug]
   - /brokerages/[slug]
   - /[domain]
3. Create base layout.
4. Create SEO helper utilities.
5. Create middleware draft for:
   - main domain
   - subdomain
   - custom domain
6. Create typed mock adapter for organization/project resolution.
7. Do not expose private inventory.
8. Do not implement landing page builder yet.
9. Do not implement Cloudflare API yet.

Required output:
- Update apps/public-web/TEAM5_PUBLIC_WEB_STATUS.md.
- Report routes created.
- Report middleware behavior.
- Report backend dependencies.

Manual tests:
- public-web runs.
- homepage opens.
- project listing mock opens.
- middleware does not break static files.
```

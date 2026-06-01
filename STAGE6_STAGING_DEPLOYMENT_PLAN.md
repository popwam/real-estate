# Stage 6 Staging Deployment Plan

## Purpose

Prepare POPWAM for a staging deployment without deploying, adding secrets, or changing product behavior.

## Recommended Staging Architecture

- API service: NestJS API running from `apps/api`, exposed at `https://api-staging.popwam.com`.
- Admin Web service: Next.js Admin Web from `apps/admin-web`, exposed at `https://admin-staging.popwam.com`.
- Public Web service: Next.js Public Web from `apps/public-web`, exposed at `https://staging.popwam.com`.
- PostgreSQL: managed staging PostgreSQL/PostGIS database.
- Redis: managed staging Redis for shared rate-limit counters.
- Secrets: stored only in the deployment provider secret manager.
- Logs: provider-native logs plus request id correlation from API responses.

## Domains And Origins

Suggested domains:

- API: `https://api-staging.popwam.com`
- Admin: `https://admin-staging.popwam.com`
- Public: `https://staging.popwam.com`

API CORS:

```text
CORS_ORIGINS=https://admin-staging.popwam.com,https://staging.popwam.com
```

Do not use wildcard origins with credentials.

## Services

### API

Build:

```powershell
pnpm --filter api build
```

Start:

```powershell
pnpm --filter api start:prod
```

Required backing services:

- PostgreSQL/PostGIS
- Redis when `RATE_LIMIT_BACKEND=redis`

### Admin Web

Build:

```powershell
pnpm --filter admin-web build
```

Start:

```powershell
pnpm --filter admin-web start
```

Required public env:

- `NEXT_PUBLIC_API_BASE_URL=https://api-staging.popwam.com`
- `NEXT_PUBLIC_PUBLIC_WEB_BASE_URL=https://staging.popwam.com`

### Public Web

Build:

```powershell
pnpm --filter public-web build
```

Start:

```powershell
pnpm --filter public-web start
```

Required public env:

- `NEXT_PUBLIC_API_BASE_URL=https://api-staging.popwam.com`
- `NEXT_PUBLIC_SITE_URL=https://staging.popwam.com`
- `NEXT_PUBLIC_PUBLIC_WEB_DATA_MODE=api`

## Environment Variables

Use the staging examples as templates:

- `.env.staging.example`
- `apps/api/.env.staging.example`
- `apps/admin-web/.env.staging.example`
- `apps/public-web/.env.staging.example`

Do not copy real secrets into repository files.

## Database Migration / Sync Plan

1. Point `DATABASE_URL` to the staging database.
2. Validate Prisma schema:

```powershell
pnpm --filter api exec prisma validate --config prisma/prisma.config.ts
pnpm --filter api exec prisma generate --config prisma/prisma.config.ts
```

3. For current pre-migration workflow, apply schema to staging only after approval:

```powershell
pnpm --filter api exec prisma db push --config prisma/prisma.config.ts
```

4. Confirm RBAC seed/demo data policy before adding accounts.

Production note: prefer reviewed migrations before production rollout when migration history is introduced.

## Demo Seed Policy

- Local/demo: demo seed is allowed.
- Staging: demo seed can be used only on an explicitly disposable staging database and only with approval.
- Production: never run `pnpm --filter api seed:demo`.

## Smoke Testing Plan

Before deploy:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\staging-build-check.ps1
```

After deploy:

```powershell
pnpm smoke:staging
```

Optional local browser smoke against local services:

```powershell
pnpm test:stage2:browser
pnpm test:stage4:browser
```

Do not run staging smoke until real staging URLs and smoke credentials are configured.

## Rollback Notes

- Keep the last known-good API/Admin/Public deploy artifacts or platform rollback target.
- Roll back all three services together if API contract compatibility is uncertain.
- If only a frontend deploy fails and API health is stable, roll back the affected frontend service.
- If database schema application fails, stop deployment and restore from provider backup or snapshot.
- Capture API `x-request-id` values from failures before rollback when possible.

## What Not To Run

- Do not run production deployment from this stage.
- Do not run demo seed against production.
- Do not hardcode credentials in scripts or env examples.
- Do not enable real payment, payroll, e-signature, ads provider, camera streaming, worker runtime, BullMQ, RabbitMQ, OCR, or AI import parsing.
- Do not run destructive import jobs as smoke tests.

## Ready For Staging When

- `scripts/staging-build-check.ps1` passes locally or in CI.
- Staging PostgreSQL and Redis are provisioned.
- API/Admin/Public env vars are configured with placeholders replaced by secrets in the provider.
- DNS routes to the correct services.
- `pnpm smoke:staging` passes against deployed staging.

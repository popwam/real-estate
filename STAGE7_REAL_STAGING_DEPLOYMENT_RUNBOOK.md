# Stage 7 Real Staging Deployment Runbook

## Purpose

This runbook gives exact staging deployment steps for POPWAM without storing secrets or deploying automatically.

Target staging domains:

- API: `https://api-staging.popwam.com`
- Admin Web: `https://admin-staging.popwam.com`
- Public Web: `https://staging.popwam.com`

## Recommended Provider Option

Recommended: Railway for the first real staging deployment.

Why:

- Simple monorepo service setup for API, Admin Web, and Public Web.
- Managed PostgreSQL and Redis are quick to provision.
- Per-service environment variables are straightforward.
- Logs, redeploys, and rollback to prior deploys are easy enough for staging.

Render is also a strong option if the team prefers more explicit service configuration. VPS/Docker gives the most control, but it adds more ops surface for TLS, process supervision, backups, firewalling, and deploy orchestration.

## Option 1 - Railway

### Services Needed

- API service from `apps/api`.
- Admin Web service from `apps/admin-web`.
- Public Web service from `apps/public-web`.
- Railway PostgreSQL.
- Railway Redis.

### API Deployment Steps

1. Create a new Railway project for staging.
2. Add PostgreSQL and Redis plugins.
3. Create an API service from the repo.
4. Set root directory or build settings so commands run from the monorepo root.
5. Build command:

```powershell
pnpm install --frozen-lockfile
pnpm --filter api build
```

6. Start command:

```powershell
pnpm --filter api start:prod
```

7. Add API env vars from `apps/api/.env.staging.example`.
8. Set `DATABASE_URL` from Railway PostgreSQL.
9. Set `RATE_LIMIT_BACKEND=redis` and `RATE_LIMIT_REDIS_URL` from Railway Redis.
10. Add custom domain `api-staging.popwam.com`.
11. Confirm `GET /health` returns 200 and includes `x-request-id`.

### Admin Web Deployment Steps

1. Create an Admin Web service from the repo.
2. Build command:

```powershell
pnpm install --frozen-lockfile
pnpm --filter admin-web build
```

3. Start command:

```powershell
pnpm --filter admin-web start
```

4. Add env vars from `apps/admin-web/.env.staging.example`.
5. Add custom domain `admin-staging.popwam.com`.
6. Confirm `/login` loads.

### Public Web Deployment Steps

1. Create a Public Web service from the repo.
2. Build command:

```powershell
pnpm install --frozen-lockfile
pnpm --filter public-web build
```

3. Start command:

```powershell
pnpm --filter public-web start
```

4. Add env vars from `apps/public-web/.env.staging.example`.
5. Add custom domain `staging.popwam.com`.
6. Confirm `/projects` loads.

### Railway Health Checks

- API: `https://api-staging.popwam.com/health`
- Admin: `https://admin-staging.popwam.com/login`
- Public: `https://staging.popwam.com/projects`

### Railway Rollback

- Roll back the failed service to the previous successful deployment.
- If API contract compatibility is uncertain, roll back API/Admin/Public together.
- If schema sync failed, stop deploy and restore from the latest PostgreSQL backup/snapshot.

## Option 2 - Render

### Services Needed

- Render Web Service for API.
- Render Web Service for Admin Web.
- Render Web Service for Public Web.
- Render PostgreSQL.
- Render Redis.

### Build Commands

API:

```powershell
pnpm install --frozen-lockfile && pnpm --filter api build
```

Admin Web:

```powershell
pnpm install --frozen-lockfile && pnpm --filter admin-web build
```

Public Web:

```powershell
pnpm install --frozen-lockfile && pnpm --filter public-web build
```

### Start Commands

API:

```powershell
pnpm --filter api start:prod
```

Admin Web:

```powershell
pnpm --filter admin-web start
```

Public Web:

```powershell
pnpm --filter public-web start
```

### Render Notes

- Use Render environment groups only if secrets are scoped correctly.
- API receives server secrets, database URL, Redis URL, and CORS.
- Admin/Public receive only `NEXT_PUBLIC_*` values.
- Add custom domains and verify Render DNS records.
- Use Render service events/logs for rollback diagnosis.

### Render Health Checks

- API health path: `/health`.
- Admin Web smoke path: `/login`.
- Public Web smoke path: `/projects`.

## Option 3 - VPS/Docker

### Services Needed

- Node runtime or container for API.
- Node runtime or container for Admin Web.
- Node runtime or container for Public Web.
- PostgreSQL/PostGIS container or managed database.
- Redis container or managed Redis.
- Reverse proxy such as Nginx or Caddy for TLS and routing.

### Suggested Runtime Layout

- API on internal port `3000`.
- Admin Web on internal port `3203`.
- Public Web on internal port `3205`.
- Reverse proxy routes:
  - `api-staging.popwam.com` -> API `3000`
  - `admin-staging.popwam.com` -> Admin `3203`
  - `staging.popwam.com` -> Public `3205`

### Build Commands

```powershell
pnpm install --frozen-lockfile
pnpm --filter api build
pnpm --filter admin-web build
pnpm --filter public-web build
```

### Start Commands

```powershell
pnpm --filter api start:prod
pnpm --filter admin-web start -- -p 3203
pnpm --filter public-web start -- -p 3205
```

If the provider shell passes arguments differently, use:

```powershell
pnpm --filter admin-web exec next start -p 3203
pnpm --filter public-web exec next start -p 3205
```

### VPS/Docker Notes

- Use systemd, Docker Compose, or a process manager to supervise services.
- Keep secrets in environment files outside the repo or a server secret manager.
- Enable TLS before public smoke.
- Restrict database and Redis ports from public internet.
- Configure backups before schema sync.

## Required Env Vars Per Service

### API

Use `apps/api/.env.staging.example` as the template.

Required:

- `NODE_ENV=production`
- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `CORS_ORIGINS`
- `RATE_LIMIT_BACKEND=redis`
- `RATE_LIMIT_REDIS_URL`
- public lead, auth, CRM, domain, import/export, operations mutation/export/report rate-limit env vars

Optional:

- observability provider env vars

### Admin Web

Use `apps/admin-web/.env.staging.example` as the template.

Required:

- `NEXT_PUBLIC_API_BASE_URL=https://api-staging.popwam.com`
- `NEXT_PUBLIC_PUBLIC_WEB_BASE_URL=https://staging.popwam.com`

### Public Web

Use `apps/public-web/.env.staging.example` as the template.

Required:

- `NEXT_PUBLIC_API_BASE_URL=https://api-staging.popwam.com`
- `NEXT_PUBLIC_SITE_URL=https://staging.popwam.com`
- `NEXT_PUBLIC_PUBLIC_WEB_DATA_MODE=api`

## PostgreSQL Setup

1. Provision dedicated staging PostgreSQL/PostGIS.
2. Save provider connection string as API `DATABASE_URL`.
3. Enable backups/snapshots.
4. Confirm connectivity from API service.
5. Do not point staging at production database.

## Redis Setup

1. Provision dedicated staging Redis.
2. Save provider Redis URL as API `RATE_LIMIT_REDIS_URL`.
3. Set `RATE_LIMIT_BACKEND=redis`.
4. Confirm API starts successfully.
5. Monitor Redis connection errors and 429 rates after launch.

## CORS Values

Use exact staging origins:

```text
CORS_ORIGINS=https://admin-staging.popwam.com,https://staging.popwam.com
```

Do not include wildcards. Do not include production origins unless the staging API must intentionally serve them.

## DNS / Subdomain Setup

Create DNS records from provider instructions:

- `api-staging.popwam.com`
- `admin-staging.popwam.com`
- `staging.popwam.com`

Use CNAME records when the provider supplies target hostnames. Use A/AAAA records only when managing a VPS/load balancer directly.

Confirm TLS certificates are active before smoke testing browser flows.

## Prisma Schema Sync Instructions

Run only after staging `DATABASE_URL` is configured and backups/snapshots are available.

Validate and generate:

```powershell
pnpm --filter api exec prisma validate --config prisma/prisma.config.ts
pnpm --filter api exec prisma generate --config prisma/prisma.config.ts
```

Apply current schema to staging after approval:

```powershell
pnpm --filter api exec prisma db push --config prisma/prisma.config.ts
```

Do not run schema sync against production from this runbook.

## Smoke Account Setup

Create dedicated staging-only accounts:

- platform smoke user
- developer smoke user
- brokerage smoke user
- broker smoke user

Configure env vars locally or in CI:

```powershell
$env:STAGING_PLATFORM_EMAIL="platform-smoke@example.com"
$env:STAGING_PLATFORM_PASSWORD="..."
$env:STAGING_DEVELOPER_EMAIL="developer-smoke@example.com"
$env:STAGING_DEVELOPER_PASSWORD="..."
$env:STAGING_BROKERAGE_EMAIL="brokerage-smoke@example.com"
$env:STAGING_BROKERAGE_PASSWORD="..."
$env:STAGING_BROKER_EMAIL="broker-smoke@example.com"
$env:STAGING_BROKER_PASSWORD="..."
```

Never commit smoke passwords.

## Post-Deploy Smoke Command

Configure URLs:

```powershell
$env:STAGING_API_URL="https://api-staging.popwam.com"
$env:STAGING_ADMIN_WEB_URL="https://admin-staging.popwam.com"
$env:STAGING_PUBLIC_WEB_URL="https://staging.popwam.com"
```

Run:

```powershell
pnpm smoke:staging
```

Do not run real staging smoke until URLs and smoke credentials are configured.

## Rollback Steps

1. Stop new deployment rollout if health checks fail.
2. Capture request ids from API failures.
3. Roll back failed service to previous successful deployment.
4. Roll back all three services together if the failure may be contract-related.
5. If schema sync caused the issue, restore the staging database snapshot and redeploy the previous API.
6. Re-run `pnpm smoke:staging`.
7. Document root cause and redeploy only after fix verification.

## Common Deployment Errors And Fixes

- API fails on startup: verify `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, and Redis env.
- API CORS errors: verify `CORS_ORIGINS` exactly matches Admin/Public staging origins.
- Redis limiter errors: verify `RATE_LIMIT_BACKEND=redis` and `RATE_LIMIT_REDIS_URL`.
- Admin/Public cannot reach API: verify `NEXT_PUBLIC_API_BASE_URL` and API TLS/domain.
- Public Web shows mock data: verify `NEXT_PUBLIC_PUBLIC_WEB_DATA_MODE=api`.
- Prisma sync fails: confirm database URL, network access, backups, and provider permissions.
- Smoke login fails: verify smoke account status, password, role, and organization membership.
- Browser pages fail after deploy: confirm build command ran for the correct app and domain points to the correct service.

## Final Staging Checklist

- API service deployed and `/health` returns 200 with `x-request-id`.
- Admin Web deployed and `/login` loads.
- Public Web deployed and `/projects` loads.
- PostgreSQL staging database provisioned and backed up.
- Redis staging instance provisioned and connected.
- API env vars configured from staging template.
- Admin/Public env vars configured from staging templates.
- CORS set to exact staging origins.
- DNS and TLS active.
- Prisma schema sync approved and completed.
- Smoke accounts created and enabled.
- `pnpm smoke:staging` passes.
- No real secrets committed.
- No demo seed run against production.

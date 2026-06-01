# Stage 6 Deployment Provider Notes

## Purpose

Provider-neutral notes for deploying the POPWAM API, Admin Web, and Public Web to staging. These notes do not contain credentials and do not perform deployment.

## Apps To Deploy

- API: `apps/api`
- Admin Web: `apps/admin-web`
- Public Web: `apps/public-web`

Workers, mobile, and AI/DVR are not part of the Stage 6 staging deployment package.

## Generic Build Commands

API:

```powershell
pnpm install --frozen-lockfile
pnpm --filter api build
```

Admin Web:

```powershell
pnpm install --frozen-lockfile
pnpm --filter admin-web build
```

Public Web:

```powershell
pnpm install --frozen-lockfile
pnpm --filter public-web build
```

## Generic Start Commands

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

## Render / Railway

- Create separate services for API, Admin Web, and Public Web.
- Attach managed PostgreSQL to API only.
- Attach managed Redis to API only.
- Configure service-specific root/build commands or monorepo filters.
- Put all secrets in provider environment variables.
- Do not expose `DATABASE_URL`, JWT secrets, Redis credentials, or smoke passwords to frontend services.

## Fly.io / VPS / Docker

- Prefer three runtime processes or containers: API, Admin Web, Public Web.
- Provide PostgreSQL/PostGIS and Redis as managed services or isolated containers with persistent volumes.
- Terminate TLS at the platform load balancer, reverse proxy, or ingress.
- Configure health checks against API `/health`, Admin `/login`, and Public `/projects`.
- Store secrets outside the image.

## Vercel-Like Hosting

- Deploy Admin Web and Public Web as separate Next.js projects.
- Deploy API to a Node service that supports long-running NestJS processes.
- Configure `NEXT_PUBLIC_*` values per frontend project.
- Configure API `CORS_ORIGINS` to exact frontend staging domains.

## Database Notes

- Use a dedicated staging database, not production.
- Confirm PostGIS support if geographic queries are used.
- Run Prisma validate/generate before schema application.
- Use provider backups or snapshots before schema sync.
- Do not run demo seed unless the staging DB is explicitly disposable.

## Redis Notes

- Use Redis in staging with `RATE_LIMIT_BACKEND=redis`.
- Set `RATE_LIMIT_REDIS_URL` only on the API service.
- Monitor Redis connection failures and 429 rates after deployment.

## Logs And Monitoring

- Capture API logs with request ids.
- Keep provider logs for API/Admin/Public services.
- Add staging alerting for:
  - API health failures
  - repeated 5xx responses
  - database connection errors
  - Redis connection errors
  - frontend start/build failures
- Never log passwords, JWTs, refresh tokens, public conversation tokens, provider secrets, or import payloads.

## Smoke Commands

Pre-deploy local gate:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\staging-build-check.ps1
```

Post-deploy staging smoke:

```powershell
pnpm smoke:staging
```

## Provider Checklist

- API service has only server-side secrets.
- Admin/Public services have only `NEXT_PUBLIC_*` values.
- CORS includes only staging Admin/Public origins.
- DNS points to the intended services.
- TLS is enabled for all services.
- API health returns 200 and an `x-request-id`.
- `pnpm smoke:staging` passes before client demo.

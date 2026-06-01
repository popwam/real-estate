# PRODUCTION_DEPLOYMENT_READINESS.md

## Health / Readiness Documentation

API health endpoint:

```text
GET /health
```

API request id smoke:

```powershell
$response = Invoke-WebRequest -Uri http://localhost:3000/health -Headers @{ "x-request-id" = "deploy-smoke-001" }
$response.Headers["x-request-id"]
```

Expected result:

```text
deploy-smoke-001
```

If no `x-request-id` is supplied, the API should generate one and return it in the `x-request-id` response header.

Swagger/docs endpoint:

```text
GET /docs
```

Database readiness for local Docker:

```powershell
docker exec popwam-postgres pg_isready -U postgres -d popwam
```

API build:

```powershell
pnpm --filter api build
```

API tests:

```powershell
pnpm --filter api test --runInBand
pnpm --filter api test:e2e --runInBand
```

Admin Web build/start:

```powershell
pnpm --filter admin-web build
pnpm --filter admin-web exec next start -p 3203
```

Public Web build/start:

```powershell
pnpm --filter public-web build
pnpm --filter public-web exec next start -p 3205
```

Frontend request id propagation:

- Admin Web API calls should include `x-request-id` values like `admin-web-{timestamp}-{random}`.
- Public Web API calls should include `x-request-id` values like `public-web-{timestamp}-{random}`.
- Failed Admin Web API calls attach `requestId` to `ApiError`.
- Failed Public Web API calls attach `requestId` to `PublicApiError` and keep visitor-facing copy friendly.
- Public Web diagnostics must not include public conversation share tokens; token paths are masked in console diagnostics.

Stage 2 browser smoke:

```powershell
pnpm test:stage2:browser
```

Local smoke script:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\local-smoke.ps1
```

Root alias:

```powershell
pnpm smoke:stage2
```

## CORS / Security Review

Current API bootstrap behavior:

- Local allowed origins are:
  - `http://localhost:3203`
  - `http://127.0.0.1:3203`
  - `http://localhost:3205`
  - `http://127.0.0.1:3205`
- `CORS_ORIGINS` can add comma-separated origins.
- Requests with no browser origin are allowed, which supports server-to-server tools, curl, and local smoke.
- Unknown browser origins are rejected.
- Credentials are enabled.

Production requirement:

- Set `CORS_ORIGINS` to exact production Admin Web and Public Web origins.
- Do not use wildcard origins.
- Do not include unneeded staging/local origins in production.
- Keep Admin Web and Public Web origins explicit even if they share a parent domain.

Wildcard risk:

- Wildcard origins with credentials can expose authenticated APIs to unintended browser origins.
- Broad origins make stolen tokens and malicious sites easier to abuse.
- Overly permissive CORS makes incident response and origin attribution harder.

Recommended production origins:

```text
CORS_ORIGINS=https://admin.popwam.com,https://popwam.com
```

Add staging origins only in staging, for example:

```text
CORS_ORIGINS=https://staging-admin.popwam.com,https://staging.popwam.com
```

## Runtime Configuration Notes

- API `EnvService` requires `JWT_SECRET` and `JWT_REFRESH_SECRET` in production.
- API defaults non-production `DATABASE_URL` to the local Docker Postgres URL.
- Production must provide `DATABASE_URL`; do not rely on local defaults.
- API request logs are JSON and include `NODE_ENV` as the log environment value.
- API request logs mask token-bearing public conversation paths before logging.
- Admin Web stores browser tokens in local storage today; production should pair this with HTTPS, strict CORS, CSP planning, and frontend error monitoring.
- Public Web `NEXT_PUBLIC_PUBLIC_WEB_DATA_MODE` should be `api` in production.

## Demo Seed Policy

Do not run:

```powershell
pnpm --filter api seed:demo
```

against production.

Demo seed is for local/staging/demo data only.

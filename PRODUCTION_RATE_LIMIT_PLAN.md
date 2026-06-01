# PRODUCTION_RATE_LIMIT_PLAN.md

## Stage 4 Backend Freeze

Operations mutation, export, and report rate-limit families are implemented for the current Stage 4 backend scope. Background import worker execution remains design-only, so no queue-worker limiter is required yet.

## Current State

Stage 3 adds a shared API rate-limiter abstraction with two backends:

- `memory` for local/demo single-process runs.
- `redis` for shared multi-instance counters.

Protected endpoints:

- `POST /public/leads`
- `POST /conversations/by-token/:shareToken/messages`
- `POST /auth/login`
- `POST /auth/register`
- `POST /auth/refresh`
- `POST /import-export/project-inventory/preview`
- `POST /import-export/operations/:type/preview`
- `POST /import-export/jobs/:id/commit`
- `POST /import-export/jobs/:id/cancel`
- `GET /operations/export/activities`
- `GET /hr/export/employees`
- `GET /hr/export/attendance`
- `GET /accounting/export/transactions`
- `GET /legal/export/documents`
- `GET /legal/export/cases`
- `GET /ads/export/campaigns`
- `GET /cameras/export/devices`
- `GET /operations/reports/overview`
- `GET /operations/reports/trends`
- `GET /operations/reports/activity`
- `GET /hr/reports/workforce`
- `GET /accounting/reports/cashflow`
- `GET /legal/reports/risk`
- `GET /ads/reports/campaigns`
- `GET /cameras/reports/devices`
- `PATCH /crm/leads/:id/status`
- `POST /crm/leads/:id/claim`
- `POST /conversations/from-crm-lead/:crmLeadId`
- `POST /conversations/:id/messages`
- `PATCH /conversations/:id/status`
- `POST /organization-domains/me`
- `PATCH /organization-domains/:id/request-verification`
- `PATCH /organization-domains/:id/mark-verified-dev-only`
- `PATCH /platform-admin/domains/:id/approve`
- `PATCH /platform-admin/domains/:id/reject`
- `PATCH /public-leads/:id/status`
- `PATCH /public-leads/:id/mark-spam`
- `PATCH /public-leads/:id/convert-placeholder`

Protected endpoints emit:

- `x-rate-limit-limit`
- `x-rate-limit-remaining`
- `x-rate-limit-reset`

## Backend Selection

Memory mode:

```text
RATE_LIMIT_BACKEND=memory
```

Redis mode:

```text
RATE_LIMIT_BACKEND=redis
RATE_LIMIT_REDIS_URL=redis://localhost:6379
```

If Redis is selected without `RATE_LIMIT_REDIS_URL`, the API fails fast with a clear configuration error.

## Local Redis

Local Redis is available in the dev compose file:

```powershell
docker compose -f infra\docker\docker-compose.dev.yml up -d redis
```

Optional focused Redis adapter test:

```powershell
$env:REDIS_TEST_URL="redis://localhost:6379"
pnpm --filter api test -- redis-rate-limiter.spec.ts --runInBand
Remove-Item Env:\REDIS_TEST_URL
```

Redis is not required for normal local memory-mode development.

## Implemented Adapter Shape

The shared limiter supports:

```ts
check(key, { windowSeconds, max })
```

It returns:

```ts
{
  allowed: boolean,
  remaining: number,
  resetAt: Date
}
```

## Why Memory Is Not Enough For Production

In-memory counters are per Node.js process. They do not coordinate across:

- multiple API containers
- horizontal autoscaling
- blue/green deploys
- server restarts
- regional deployments

This means a client can bypass effective limits by hitting different instances, and all counters reset when a process restarts.

## Endpoints Protected

Public lead capture:

- `POST /public/leads`
- Env:
  - `PUBLIC_LEAD_RATE_LIMIT_WINDOW_SECONDS`
  - `PUBLIC_LEAD_RATE_LIMIT_MAX`

Public token conversation replies:

- `POST /conversations/by-token/:shareToken/messages`
- Env:
  - `PUBLIC_CONVERSATION_MESSAGE_RATE_LIMIT_WINDOW_SECONDS`
  - `PUBLIC_CONVERSATION_MESSAGE_RATE_LIMIT_MAX`

Authentication:

- `POST /auth/login`
  - Env:
    - `AUTH_LOGIN_RATE_LIMIT_WINDOW_SECONDS`
    - `AUTH_LOGIN_RATE_LIMIT_MAX`
- `POST /auth/register`
  - Env:
    - `AUTH_REGISTER_RATE_LIMIT_WINDOW_SECONDS`
    - `AUTH_REGISTER_RATE_LIMIT_MAX`
- `POST /auth/refresh`
  - Env:
    - `AUTH_REFRESH_RATE_LIMIT_WINDOW_SECONDS`
    - `AUTH_REFRESH_RATE_LIMIT_MAX`

Import/export mutations:

- `POST /import-export/project-inventory/preview`
- `POST /import-export/operations/:type/preview`
- `POST /import-export/jobs/:id/commit`
- `POST /import-export/jobs/:id/cancel`
- Env:
  - `IMPORT_EXPORT_RATE_LIMIT_WINDOW_SECONDS`
  - `IMPORT_EXPORT_RATE_LIMIT_MAX`

Operations exports:

- `GET /operations/export/activities`
- `GET /hr/export/employees`
- `GET /hr/export/attendance`
- `GET /accounting/export/transactions`
- `GET /legal/export/documents`
- `GET /legal/export/cases`
- `GET /ads/export/campaigns`
- `GET /cameras/export/devices`
- Env:
  - `OPERATIONS_EXPORT_RATE_LIMIT_WINDOW_SECONDS`
  - `OPERATIONS_EXPORT_RATE_LIMIT_MAX`

Operations reports:

- `GET /operations/reports/overview`
- `GET /operations/reports/trends`
- `GET /operations/reports/activity`
- `GET /hr/reports/workforce`
- `GET /accounting/reports/cashflow`
- `GET /legal/reports/risk`
- `GET /ads/reports/campaigns`
- `GET /cameras/reports/devices`
- Env:
  - `OPERATIONS_REPORT_RATE_LIMIT_WINDOW_SECONDS`
  - `OPERATIONS_REPORT_RATE_LIMIT_MAX`

CRM mutations:

- `PATCH /crm/leads/:id/status`
- `POST /crm/leads/:id/claim`
- `POST /conversations/from-crm-lead/:crmLeadId`
- `POST /conversations/:id/messages`
- `PATCH /conversations/:id/status`
- Env:
  - `CRM_MUTATION_RATE_LIMIT_WINDOW_SECONDS`
  - `CRM_MUTATION_RATE_LIMIT_MAX`

Domain mutations:

- `POST /organization-domains/me`
- `PATCH /organization-domains/:id/request-verification`
- `PATCH /organization-domains/:id/mark-verified-dev-only`
- `PATCH /platform-admin/domains/:id/approve`
- `PATCH /platform-admin/domains/:id/reject`
- Env:
  - `DOMAIN_MUTATION_RATE_LIMIT_WINDOW_SECONDS`
  - `DOMAIN_MUTATION_RATE_LIMIT_MAX`

Public lead management mutations:

- `PATCH /public-leads/:id/status`
- `PATCH /public-leads/:id/mark-spam`
- `PATCH /public-leads/:id/convert-placeholder`
- Env:
  - `PUBLIC_LEAD_MANAGEMENT_RATE_LIMIT_WINDOW_SECONDS`
  - `PUBLIC_LEAD_MANAGEMENT_RATE_LIMIT_MAX`

Admin/API mutation hotspots still to add:

- domain DNS check endpoint
- remaining high-cost authenticated mutations as identified in staging telemetry

## Privacy-Safe Keys

Implemented public lead key material:

- public org/project slug context when supplied
- hashed source IP or anonymous fallback
- final limiter key is hashed

Implemented public token message key material:

- hashed share token
- hashed source IP or unknown fallback
- final limiter key is hashed

Implemented auth key material:

- login: hashed normalized email plus hashed source IP/fallback
- register: hashed email/phone when supplied plus hashed source IP/fallback
- refresh: hashed refresh token plus hashed source IP/fallback
- final limiter key is hashed

Implemented import/export key material:

- authenticated organization id
- authenticated user id
- action name (`preview`, `commit`, or `cancel`)
- hashed source IP/fallback
- final limiter key is hashed

Implemented operations export key material:

- authenticated organization id
- authenticated user id
- export dataset/action name
- hashed source IP/fallback
- final limiter key is hashed
- raw query/filter values are not included

Implemented operations report key material:

- authenticated organization id
- authenticated user id
- report/action name
- hashed source IP/fallback
- final limiter key is hashed
- raw query/filter values are not included

Implemented CRM mutation key material:

- authenticated organization id
- authenticated user id
- action name
- hashed source IP/fallback
- final limiter key is hashed

Implemented domain mutation key material:

- authenticated organization id
- authenticated user id
- action name
- hashed source IP/fallback
- final limiter key is hashed

Implemented public lead management key material:

- authenticated organization id
- authenticated user id
- action name
- hashed source IP/fallback
- final limiter key is hashed

Do not store raw phone, email, message body, share token, JWT, refresh token, password values, import CSV/JSON content, file names, lead ids, conversation ids, domain ids, DNS tokens, status notes, rejection reasons, or API keys in limiter keys.

## Redis Behavior

The Redis adapter:

- Uses `RATE_LIMIT_REDIS_URL`.
- Uses atomic Redis `INCR` plus `PEXPIRE` in a Lua script.
- Stores keys under the `popwam:rate-limit:` prefix.
- Returns remaining count and reset time.
- Keeps memory mode fully supported.

## Additional Production Options

API gateway or ingress limiter:

- Useful for broad path/IP limits.
- Should complement app-level Redis limits.

WAF / edge protection:

- Useful for bot controls, IP reputation, and perimeter protection.
- Not a replacement for app-specific org/project/token-aware limits.

## Suggested Env Variables

Implemented:

- `RATE_LIMIT_BACKEND=memory|redis`
- `RATE_LIMIT_REDIS_URL`
- `PUBLIC_LEAD_RATE_LIMIT_WINDOW_SECONDS`
- `PUBLIC_LEAD_RATE_LIMIT_MAX`
- `PUBLIC_CONVERSATION_MESSAGE_RATE_LIMIT_WINDOW_SECONDS`
- `PUBLIC_CONVERSATION_MESSAGE_RATE_LIMIT_MAX`
- `AUTH_LOGIN_RATE_LIMIT_WINDOW_SECONDS`
- `AUTH_LOGIN_RATE_LIMIT_MAX`
- `AUTH_REGISTER_RATE_LIMIT_WINDOW_SECONDS`
- `AUTH_REGISTER_RATE_LIMIT_MAX`
- `AUTH_REFRESH_RATE_LIMIT_WINDOW_SECONDS`
- `AUTH_REFRESH_RATE_LIMIT_MAX`
- `IMPORT_EXPORT_RATE_LIMIT_WINDOW_SECONDS`
- `IMPORT_EXPORT_RATE_LIMIT_MAX`
- `CRM_MUTATION_RATE_LIMIT_WINDOW_SECONDS`
- `CRM_MUTATION_RATE_LIMIT_MAX`
- `DOMAIN_MUTATION_RATE_LIMIT_WINDOW_SECONDS`
- `DOMAIN_MUTATION_RATE_LIMIT_MAX`
- `PUBLIC_LEAD_MANAGEMENT_RATE_LIMIT_WINDOW_SECONDS`
- `PUBLIC_LEAD_MANAGEMENT_RATE_LIMIT_MAX`
- `OPERATIONS_MUTATION_RATE_LIMIT_WINDOW_SECONDS`
- `OPERATIONS_MUTATION_RATE_LIMIT_MAX`
- `OPERATIONS_EXPORT_RATE_LIMIT_WINDOW_SECONDS`
- `OPERATIONS_EXPORT_RATE_LIMIT_MAX`
- `OPERATIONS_REPORT_RATE_LIMIT_WINDOW_SECONDS`
- `OPERATIONS_REPORT_RATE_LIMIT_MAX`

Future:

- domain DNS check limits if production DNS checks become a hotspot
- finer per-module operations limits if HR/accounting/legal usage needs separate policies
- gateway/WAF perimeter limits

## Rollout Plan

1. Keep `RATE_LIMIT_BACKEND=memory` for local demos.
2. Use `RATE_LIMIT_BACKEND=redis` in staging with managed Redis or the local dev service.
3. Run API build/unit/e2e plus Redis focused tests with `REDIS_TEST_URL`.
4. Monitor 429 rates and Redis availability in staging.
5. Add remaining authenticated mutation hotspot limits where needed.
6. Add API gateway/WAF path-based limits.
7. Run Playwright and API smoke against staging.
8. Enable production after staging observation.

## Privacy Notes

- Hash IP addresses before storing in application-level limiter keys.
- Never log raw passwords, JWTs, refresh tokens, share tokens, phone numbers, emails, or API keys.
- Avoid logging full limiter keys in diagnostics.

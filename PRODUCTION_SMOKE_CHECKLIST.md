# PRODUCTION_SMOKE_CHECKLIST.md

## Purpose

Use this checklist for staging and production-like deployments. Never run demo seed against production.

## Preflight

- Confirm target environment and database.
- Confirm secrets come from the secret manager/deployment platform.
- Confirm `NODE_ENV=production` for production.
- Confirm `CORS_ORIGINS` includes only approved production origins.
- Confirm `NEXT_PUBLIC_*` values do not contain secrets.
- Confirm backup/restore plan for the target database.

## Database

Schema validation:

```powershell
cd apps\api
pnpm exec prisma validate --config prisma/prisma.config.ts
pnpm exec prisma generate --config prisma/prisma.config.ts
```

Target schema application:

```powershell
pnpm exec prisma db push --config prisma/prisma.config.ts
```

Production note:

- Prefer a reviewed migration workflow for production when migration history is introduced.
- Do not run `pnpm --filter api seed:demo` in production.

## Build

API:

```powershell
pnpm --filter api build
```

Admin Web:

```powershell
pnpm --filter admin-web build
```

Public Web:

```powershell
pnpm --filter public-web build
```

## Start

API:

```powershell
pnpm --filter api start
```

Admin Web:

```powershell
pnpm --filter admin-web exec next start -p 3203
```

Public Web:

```powershell
pnpm --filter public-web exec next start -p 3205
```

Use deployment-native process managers in real production.

## Health

API health:

```powershell
Invoke-WebRequest https://api.example.com/health -UseBasicParsing
```

Expected:

- HTTP 200
- response includes `status: ok`

## Functional Smoke

Admin:

- Open Admin Web login.
- Login as an approved platform/admin test account for the target environment.
- Open CRM leads.
- Open conversations.
- Open platform CRM activity page.
- Confirm no app crash text appears.

Public Web:

- Open public project browse.
- Open a public project detail page.
- Submit Request Call.
- Submit Start Chat.
- Confirm real Open Conversation / Copy Link controls appear.
- Open `/c/{token}`.
- Send a public reply.
- Confirm reply appears in the public timeline.

CRM:

- Confirm CRM lead appears in Admin.
- Open CRM lead detail.
- Confirm activity timeline appears.
- Open conversation detail.
- Send authenticated message.
- Confirm activity timeline updates.

Import/Export:

- Open developer import/export preview with a tiny JSON payload in staging.
- Do not run destructive/large imports in production smoke.
- Run account export.
- Confirm exported preview does not include password hashes, refresh tokens, token hashes, audit logs, or domain verification tokens.

## Automated Smoke

Local/staging browser smoke:

```powershell
pnpm test:stage2:browser
```

Local API smoke:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\local-smoke.ps1
```

Root convenience alias:

```powershell
pnpm smoke:stage2
```

## Stop Conditions

Stop deployment or rollback if:

- API health fails
- database connection fails
- Admin Web cannot login
- Public project browse fails
- public Start Chat does not return a conversation link
- `/c/{token}` reply fails
- CRM lead/conversation pages crash
- activity timelines fail with server errors
- account export exposes private auth/token fields

## Known Non-Production Gaps

- No real WhatsApp Business API.
- No real chat provider.
- No WebSocket.
- In-memory rate limits are not multi-instance production safe.
- No production notification provider/outbox in this slice.
- Demo seed is for local/staging demos only.

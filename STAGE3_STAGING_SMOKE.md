# STAGE3_STAGING_SMOKE.md

## Purpose

Run this smoke against deployed staging services before a client demo or staging release sign-off. It targets already-running services and does not start local servers.

## Required Environment Variables

```powershell
$env:STAGING_API_URL="https://api-staging.example.com"
$env:STAGING_ADMIN_WEB_URL="https://admin-staging.example.com"
$env:STAGING_PUBLIC_WEB_URL="https://public-staging.example.com"

$env:STAGING_PLATFORM_EMAIL="platform-smoke@example.com"
$env:STAGING_PLATFORM_PASSWORD="..."
$env:STAGING_DEVELOPER_EMAIL="developer-smoke@example.com"
$env:STAGING_DEVELOPER_PASSWORD="..."
$env:STAGING_BROKERAGE_EMAIL="brokerage-smoke@example.com"
$env:STAGING_BROKERAGE_PASSWORD="..."
$env:STAGING_BROKER_EMAIL="broker-smoke@example.com"
$env:STAGING_BROKER_PASSWORD="..."
```

Optional:

```powershell
$env:STAGING_PUBLIC_PROJECT_SLUG="known-public-project"
$env:STAGING_CONVERSATION_TOKEN="known-public-conversation-token"
```

Do not commit real credentials. Use deployment secrets, CI masked variables, or a local secure shell profile.

## Command

```powershell
pnpm smoke:staging
```

Equivalent:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\staging-smoke.ps1
```

## Expected Output

The script prints `PASS` lines for:

- API health and `x-request-id` response header.
- Platform login and `GET /auth/me`.
- Developer login and `GET /auth/me`.
- Brokerage login and `GET /auth/me`.
- Broker login and `GET /auth/me`.
- Broker marketplace projects endpoint reachability.
- Public projects API reachability.
- Optional public project detail API reachability.
- Optional public conversation token API reachability.
- Admin Web login page reachability.
- Public Web projects page reachability.

Passwords and tokens are never printed. Failed API calls print the response request id when available.

## What Is Tested

- Deployed API health.
- Request id propagation from API responses.
- Auth login for required staging smoke accounts.
- Authenticated user context for each role.
- Broker marketplace API reachability.
- Public projects API reachability.
- Basic Admin Web and Public Web HTTP reachability.
- Optional known public project and public conversation token checks.

## What Is Not Tested

- Full browser clickthrough.
- Public Start Chat creation.
- Public `/c/{token}` reply posting.
- Import/export mutation workflow.
- CRM claim/conversation mutations.
- Payment/provider integrations.
- Mobile app behavior.

The existing local Playwright smoke remains available with:

```powershell
pnpm test:stage2:browser
```

Staging browser automation should be added after staging has stable seeded data and dedicated smoke credentials that match the browser flow assumptions.

## Stop Conditions

Stop a staging rollout or client-demo prep if:

- Any required env var is missing.
- API health fails.
- API health does not return `x-request-id`.
- Any smoke account cannot login.
- `GET /auth/me` fails for any role.
- Broker marketplace projects endpoint returns an error.
- Public projects API returns an error.
- Admin Web login page is unreachable.
- Public Web projects page is unreachable.

## Credential Safety

- Use dedicated staging smoke accounts, not personal accounts.
- Do not store passwords in repo files.
- Prefer CI masked variables or a secret manager.
- Rotate staging smoke credentials after sharing demo environments outside the team.
- Never run demo seed against production.

## Before Client Demo

1. Confirm staging deployment finished.
2. Confirm staging DB schema is current.
3. Confirm smoke credentials are enabled and scoped.
4. Run `pnpm smoke:staging`.
5. Run local or staging browser smoke if staging browser automation is available.
6. Manually verify the demo-critical public chat and CRM flows if browser automation is not yet staging-ready.

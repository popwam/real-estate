# POPWAM Phase 1 Demo Login

## 1. Start Postgres

```powershell
docker compose -f infra\docker\docker-compose.dev.yml up -d postgres
docker exec popwam-postgres pg_isready -U postgres -d popwam
```

Default database URL:

```text
postgresql://postgres:postgres@localhost:5432/popwam?schema=public
```

## 2. Prepare API Database

```powershell
pnpm --filter api exec prisma validate --config prisma/prisma.config.ts
pnpm --filter api exec prisma generate --config prisma/prisma.config.ts
pnpm --filter api exec prisma db push --config prisma/prisma.config.ts
pnpm --filter api seed:demo
```

The demo seed is idempotent and dev-only. It updates stable demo records instead of creating duplicate accounts on repeated runs.

## 3. Start API

```powershell
pnpm --filter api start:dev
```

Open:

- `http://localhost:3000/health`
- `http://localhost:3000/docs`

## 4. Start Admin Web

Use `NEXT_PUBLIC_API_BASE_URL` as the canonical API env var. The app temporarily supports the older `NEXT_PUBLIC_API_URL` name too.

```powershell
$env:NEXT_PUBLIC_API_BASE_URL="http://localhost:3000"
pnpm --filter admin-web dev -- --hostname 127.0.0.1 --port 3203
```

Open:

- `http://127.0.0.1:3203/login`

## 5. Start Public Web

```powershell
pnpm --filter public-web dev -- --hostname 127.0.0.1 --port 3205
```

Open:

- `http://127.0.0.1:3205`
- `http://127.0.0.1:3205/projects`
- `http://127.0.0.1:3205/robots.txt`
- `http://127.0.0.1:3205/sitemap.xml`

## 6. Start Mobile

For Android emulator:

```powershell
cd apps\mobile
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000
```

For desktop or browser targets pointed at the local API:

```powershell
cd apps\mobile
flutter run --dart-define=API_BASE_URL=http://localhost:3000
```

## Demo Accounts

| Purpose | Email | Password | Organization Type | Role |
| --- | --- | --- | --- | --- |
| Platform owner | `cd ` | `30@@mmMM` | `PLATFORM` | `platform_owner` |
| Developer owner | `developer.demo@popwam.local` | `Demo@123456` | `DEVELOPER` | `developer_owner` |
| Brokerage owner | `brokerage.demo@popwam.local` | `Demo@123456` | `BROKERAGE` | `brokerage_owner` |
| Broker user | `broker.demo@popwam.local` | `Demo@123456` | `BROKERAGE` | `broker` |

## Expected Admin Routes

After login, use the role-aware navigation:

- Platform: `/platform/dashboard`, `/platform/organizations`, `/platform/deals`, `/platform/commissions`
- Developer: `/developer/dashboard`, `/developer/projects`, `/developer/inventory`, `/developer/deal-rooms`, `/developer/deals`, `/developer/commission-rules`, `/developer/commissions`
- Brokerage/Broker: `/brokerage/dashboard`, `/brokerage/lead-claims`, `/brokerage/reservation-requests`, `/brokerage/deal-rooms`, `/brokerage/deals`, `/brokerage/commissions`

## Local Smoke Script

With the API running and the demo seed applied:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\local-smoke.ps1
```

The script verifies:

- API health
- platform login
- developer login
- brokerage login
- broker login
- `GET /auth/me`
- broker `GET /marketplace/projects`
- admin API env convention guidance

## Demo Data Included

The seed creates:

- approved platform, developer, and brokerage organizations
- platform owner, developer owner, brokerage owner, and broker users
- developer and brokerage profiles
- broker profile
- active open-marketplace project
- project phase
- one available unit for live browse demos
- one sold unit for completed deal demos
- payment plan
- active developer-brokerage agreement
- broker access rule
- active brokerage and broker commission rules
- completed demo chain: client, lead, lead claim, approved reservation, deal room, message, sold deal, and commission entries

No real payments, provider integrations, queues, Cloudflare/DNS, CRM, HR, accounting, legal, or AI/DVR modules are added by the seed.

# STAGE2_FINAL_QA_COMMANDS.md

## Postgres Up / Readiness

```powershell
docker compose -f infra\docker\docker-compose.dev.yml up -d postgres
docker exec popwam-postgres pg_isready -U postgres -d popwam
```

## Prisma

```powershell
cd apps\api
pnpm exec prisma validate --config prisma/prisma.config.ts
pnpm exec prisma generate --config prisma/prisma.config.ts
pnpm exec prisma db push --config prisma/prisma.config.ts
cd ..\..
```

## API Build / Unit / E2E

```powershell
pnpm --filter api build
pnpm --filter api test --runInBand
pnpm --filter api test:e2e --runInBand
```

## Admin Web Build / Lint

```powershell
pnpm --filter admin-web build
pnpm --filter admin-web lint
```

## Public Web Build

```powershell
pnpm --filter public-web build
```

## Final Local QA Alias

```powershell
pnpm qa:stage2:final
```

Runs:

- API build
- API unit tests
- API e2e tests
- Admin Web build
- Admin Web lint
- Public Web build

## Demo Seed

Do not run against production.

```powershell
pnpm --filter api seed:demo
```

## Local Smoke

With API running and demo seed applied:

```powershell
pnpm smoke:stage2
```

Equivalent:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\local-smoke.ps1
```

## Playwright Smoke

With API, Admin Web, Public Web, Postgres, and demo seed prepared:

```powershell
pnpm test:stage2:browser
```

Expected local URLs:

- API: `http://localhost:3000`
- Admin Web: `http://127.0.0.1:3203`
- Public Web: `http://127.0.0.1:3205`

## Mobile Analyze

```powershell
cd apps\mobile
flutter analyze
cd ..\..
```

## Mobile Run Commands

Android emulator:

```powershell
cd apps\mobile
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000
```

Physical device on same network:

```powershell
cd apps\mobile
flutter run --dart-define=API_BASE_URL=http://YOUR_PC_LAN_IP:3000
```

Desktop/web local:

```powershell
cd apps\mobile
flutter run --dart-define=API_BASE_URL=http://localhost:3000
```


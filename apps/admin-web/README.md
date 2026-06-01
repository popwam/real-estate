# POPWAM Admin Web

Role-aware admin interface for platform, developer, brokerage, deal room, deal, and commission workflows.

## Environment

Canonical local API variable:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

The API client also accepts the legacy `NEXT_PUBLIC_API_URL` name during Phase 1 polish so existing local setups continue to work. Prefer `NEXT_PUBLIC_API_BASE_URL` for new environments.

## Local Commands

```bash
pnpm --filter admin-web dev -- --hostname 127.0.0.1 --port 3203
pnpm --filter admin-web build
pnpm --filter admin-web lint
```

Open:

- `http://127.0.0.1:3203/login`

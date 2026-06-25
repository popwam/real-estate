# STAGING DEMO SCRIPT

Date: 2026-06-24

## Prerequisite

Apply the UI-2J staging seed cleanup before using the public routes below:

```bash
cd /d E:\saas\real-estate
pnpm --filter api seed:demo
```

Run that command only with the intended staging `DATABASE_URL`. The script keeps test login emails stable while replacing visible seed names, public descriptions, and public slugs with Northline-safe demo data.

## Local QA Ports

Admin Web:

```bash
cd /d E:\saas\real-estate
pnpm --filter admin-web exec next dev -p 3203
```

Public Web:

```bash
cd /d E:\saas\real-estate
pnpm --filter public-web exec next dev -p 3205
```

For production-shaped local browser smoke, use a fresh `public-web` build and `next start -p 3205` if `next dev` does not hydrate client forms in the local environment.

## Admin Accounts

- Platform Admin: `ceo@popwam.com` / `<password from local secret>`
- Developer Admin: `developer.demo@popwam.local` / `<password from local secret>`
- Brokerage Admin: `brokerage.demo@popwam.local` / `<password from local secret>`

## Public Demo Routes

- `https://staging.popwam.com/`
- `https://staging.popwam.com/projects`
- `https://staging.popwam.com/projects/northline-residences`
- `https://staging.popwam.com/northline`
- `https://staging.popwam.com/northline/projects`
- `https://staging.popwam.com/northline/contact`
- `https://staging.popwam.com/developers/northline-development-group`
- `https://staging.popwam.com/brokerages/northline-brokerage-collective`
- `https://staging.popwam.com/landing/northline-launch`

## Demo Flow

1. Open Public Home.
2. Browse Projects.
3. Open `Northline Residences`.
4. Submit a lead with a unique phone and email.
5. Open Admin as Developer.
6. Find the Public Lead / CRM Lead.
7. Open or create the conversation.
8. Open the public conversation link.
9. Send a public message.
10. Reply from Admin.
11. Refresh the public conversation and confirm the reply.
12. Show reservation, deal, and commission surfaces if the seeded sold-chain records are available.

## Presenter Notes

- Do not expose or recite real passwords during the demo.
- Use a fresh phone/email for each lead submission to avoid recent-phone duplicate reuse.
- If a public route still shows old demo/API-smoke wording, rerun the staging seed cleanup against the intended database and restart the affected app server.
- If the Public Web form does not submit locally, verify the page is hydrated. The browser smoke passed with a fresh `public-web` production build served on port `3205`.

## UI-2K Verification Status

Checked: 2026-06-24 19:10 +03:00

Current status: internal demo No-Go.

The UI-2J seed source is ready, but the staging seed was not applied during UI-2K because no real staging `DATABASE_URL` was present in the local process. The seed script must not be run without that variable because it falls back to a localhost database.

Current locked route results:

- `https://staging.popwam.com/` renders, but legacy demo/API/fallback copy is still visible.
- `https://staging.popwam.com/projects` renders, but legacy demo/API/fallback copy is still visible.
- `https://staging.popwam.com/projects/northline-residences` returns HTTP 500.
- `https://staging.popwam.com/northline` returns HTTP 500.
- `https://staging.popwam.com/northline/projects` returns HTTP 500.
- `https://staging.popwam.com/northline/contact` returns HTTP 500.
- `https://staging.popwam.com/developers/northline-development-group` returns HTTP 500.
- `https://staging.popwam.com/brokerages/northline-brokerage-collective` returns HTTP 500.
- `https://staging.popwam.com/landing/northline-launch` returns HTTP 500.

Before rehearsal:

1. Provide the real staging database URL through the deployment secret manager or a local one-time shell variable. Do not write it into this file.
2. Confirm the host/database identify staging, not production.
3. Run `pnpm --filter api seed:demo`.
4. Restart or redeploy staging API/Public/Admin only if the hosting layer caches data or build artifacts.
5. Recheck the locked route list above.
6. Rerun `pnpm test:stage2:browser -- --reporter=list` and `pnpm test:stage4:browser -- --reporter=list`.

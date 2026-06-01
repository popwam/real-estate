# Stage 6 Staging Prep Status

## Current Slice

Stage 6 - Staging Deployment Prep and Environment Packaging

## Percentage Completed

100% for local staging deployment package preparation.

No real deployment was performed.

## Files Created

- `STAGE6_STAGING_DEPLOYMENT_PLAN.md`
- `STAGE6_DEPLOYMENT_PROVIDER_NOTES.md`
- `STAGE6_STAGING_PREP_STATUS.md`
- `.env.staging.example`
- `apps/api/.env.staging.example`
- `apps/admin-web/.env.staging.example`
- `apps/public-web/.env.staging.example`
- `scripts/staging-build-check.ps1`

## Files Modified

- None outside the new Stage 6 staging package files.

## Scripts Added

- `scripts/staging-build-check.ps1`

The script runs API build/unit/e2e, Admin Web build/lint, Public Web build/lint, and optional `flutter analyze` if Flutter is available. It does not start servers, seed data, or deploy.

## Env Examples

Staging placeholders were added for:

- staging smoke URLs and smoke credentials
- API PostgreSQL/JWT/CORS/Redis/rate-limit env
- Admin Web public API/Public Web URLs
- Public Web public API/site/data-mode values

No real secrets were added.

## Commands Run

```powershell
pnpm --filter api build
pnpm --filter admin-web build
pnpm --filter public-web build
powershell -ExecutionPolicy Bypass -File scripts\staging-build-check.ps1
```

## Results

- PASS: `pnpm --filter api build`
- PASS: `pnpm --filter admin-web build`
- PASS: `pnpm --filter public-web build`
- PASS: `powershell -ExecutionPolicy Bypass -File scripts\staging-build-check.ps1`
  - API build passed.
  - API unit tests passed: 11 suites, 26 passed, 1 skipped.
  - API e2e tests passed: 22 suites, 29 passed.
  - Admin Web build passed.
  - Admin Web lint passed.
  - Public Web build passed.
  - Public Web lint passed.
  - Mobile `flutter analyze` passed because Flutter was available.
  - Known non-failing `pg` deprecation warnings still emitted during API e2e.

Note: the first script run exposed a PowerShell argument-splatting issue in the new script helper. The script was fixed and rerun successfully.

## What Is Ready

- Staging architecture plan.
- Provider-neutral deployment notes.
- Staging env example files.
- Safe local/CI pre-deploy build-check script.
- Existing `scripts/staging-smoke.ps1` remains suitable for post-deploy staging smoke with configured URLs and credentials.

## What Still Needs External Setup

- Staging PostgreSQL/PostGIS.
- Staging Redis.
- Secret manager entries.
- DNS and TLS for `api-staging.popwam.com`, `admin-staging.popwam.com`, and `staging.popwam.com`.
- Dedicated staging smoke accounts.
- Approved staging database schema sync.
- Post-deploy `pnpm smoke:staging` run against real staging services.

## Next Recommended Action

Provision staging infrastructure and secrets, deploy API/Admin/Public services, then run:

```powershell
pnpm smoke:staging
```

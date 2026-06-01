# STAGE2_RELEASE_READINESS_REPORT.md

## Current System Summary

POPWAM Stage 2 is ready for local and guided demo workflows around verified real estate marketplace browsing, public lead capture, public chat links and replies, CRM lead/conversation management, CRM activity timeline, project/inventory import preview/commit, safe JSON export, Admin Web screens, Public Web screens, and mobile CRM/conversation visibility.

The current release is not production-ready for open internet traffic. Production still needs external infrastructure, secret management, distributed rate limiting, monitoring/log shipping, provider decisions, and deployment rehearsal.

## Ready For Demo

- Public project browsing.
- Public contact options: Request Call, Start Chat, WhatsApp link fallback.
- Public `/c/{token}` conversation view and reply.
- Admin CRM leads, marketplace lead claim, conversations, messages, status controls, summaries, and activity timeline.
- Developer import preview/commit and organization exports.
- Platform CRM activity and import/export review pages.
- Mobile CRM/conversation screens and public token reply UI, with static analyze passing.
- Local Playwright browser smoke covering critical Admin and Public Web flows.

## Ready For Staging

Ready with prep:

- Configure real staging `DATABASE_URL`, JWT secrets, CORS origins, Admin/Public Web API URLs, and `NEXT_PUBLIC_PUBLIC_WEB_DATA_MODE=api`.
- Run Prisma validate/generate/db push against staging.
- Run API build/unit/e2e, Admin build/lint, Public build.
- Run demo seed only if staging is explicitly approved for demo data.
- Run Playwright smoke against staging-style URLs or a local production build.
- Configure staging log retention and health checks before broader QA.

## Not Production-Ready Yet

- No full Redis/shared rate limiter implementation.
- No API gateway/WAF rules.
- No auth endpoint rate limits.
- No import/export mutation rate limits.
- No rate-limit response headers.
- No external monitoring/log shipping provider.
- No production alert dashboards.
- No reviewed production migration process.
- No real WhatsApp Business API.
- No real chat provider or WebSocket.
- No payment gateway
 or ledger.
- No production credentials or deployment has been performed.

## Required Envs

API:

- `NODE_ENV=production`
- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `CORS_ORIGINS`
- `RATE_LIMIT_BACKEND`
- `RATE_LIMIT_REDIS_URL` when Redis backend is wired and selected
- `PUBLIC_LEAD_RATE_LIMIT_WINDOW_SECONDS`
- `PUBLIC_LEAD_RATE_LIMIT_MAX`
- `PUBLIC_CONVERSATION_MESSAGE_RATE_LIMIT_WINDOW_SECONDS`
- `PUBLIC_CONVERSATION_MESSAGE_RATE_LIMIT_MAX`

Admin Web:

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_PUBLIC_WEB_BASE_URL`

Public Web:

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_PUBLIC_WEB_DATA_MODE=api`
- approved analytics public IDs only, if tracking is approved

## Required Commands

Core release verification:

```powershell
pnpm --filter api build
pnpm --filter api test --runInBand
pnpm --filter api test:e2e --runInBand
pnpm --filter admin-web build
pnpm --filter admin-web lint
pnpm --filter public-web build
```

Root alias:

```powershell
pnpm qa:stage2:final
```

Browser smoke:

```powershell
pnpm test:stage2:browser
```

Local smoke:

```powershell
pnpm smoke:stage2
```

Mobile static check:

```powershell
cd apps\mobile
flutter analyze
```

## Test Matrix

| Area | Coverage | Status |
| --- | --- | --- |
| API build | Nest build | PASS |
| API unit | Jest unit/focused tests | PASS |
| API e2e | Stage 2 backend flows | PASS |
| Admin Web | Next build and ESLint | PASS |
| Public Web | Next build | PASS |
| Browser smoke | Playwright Admin/Public critical flows | PASS in prior run |
| Mobile | `flutter analyze` | PASS in prior run |
| Mobile device smoke | Android/physical clickthrough | NOT RUN |

## Known Gaps

- Multi-instance rate limiting needs Redis/gateway/WAF.
- Production observability needs provider setup.
- Mobile still needs real device/emulator smoke.
- Import/export remains pasted CSV/JSON only; no XLSX binary, OCR, Word/PDF, cloud upload, or background worker.
- Public chat has token-scoped replies but no real-time provider.
- WhatsApp is link/fallback only; no Business API.

## Risk Register

| Risk | Severity | Mitigation |
| --- | --- | --- |
| In-memory rate limits in multi-instance production | High | Wire Redis/shared limiter or gateway/WAF before production. |
| No production log shipping/alerts | High | Add provider and alert dashboards before launch. |
| Demo seed accidentally run in production | High | Keep seed blocked by process and deployment permissions. |
| Public chat abuse | Medium | Add shared limiter, WAF rules, and moderation workflow. |
| Import misuse or large payloads | Medium | Add file size limits, worker processing, and import throttles. |
| Mobile untested on device | Medium | Run emulator/physical QA before mobile demo. |
| Provider expectations misunderstood | Medium | Frame WhatsApp/chat/payment/provider gaps in demo script. |

## Rollback / Stop Conditions

Stop release or rollback if:

- API health fails.
- Database schema sync/migration fails.
- Admin login fails.
- Public project browse fails.
- Public Start Chat does not return a conversation link.
- `/c/{token}` reply fails.
- CRM lead/conversation pages crash.
- Activity timeline returns server errors.
- Account export exposes password hashes, refresh tokens, token hashes, audit logs, or domain verification tokens.
- CORS allows unapproved browser origins.
- Logs expose tokens, passwords, raw public lead messages, or raw share tokens.

## Next Production Blockers

- Real Redis/shared rate limiter.
- Production migration workflow.
- Secret manager/deployment configuration.
- Log shipping/error monitoring.
- Health and uptime checks.
- Staging rehearsal with production-like env.
- Provider decisions for WhatsApp, chat, notifications, and payments.

## Recommended Next 5 Slices

1. Production Redis rate limiter and rate-limit headers.
2. Auth/import-export mutation rate limits.
3. Observability provider integration with request-id correlation.
4. Staging deployment automation and smoke against deployed URLs.
5. Mobile device QA automation or approved manual device test pass.


# Stage 8 Marketplace Governance Status

Date: 2026-06-19

## Status

Backend-first Stage 8 slice implemented. API, Admin Web, and Public Web compile successfully. Database-backed e2e and browser smoke remain pending because the local PostgreSQL/smoke services were not reachable during this pass.

## Delivered

- Platform administrators can create developer/brokerage organizations and create expiring, one-time invitation links.
- Invitation tokens are 256-bit random values; only SHA-256 fingerprints are stored. Request logging redacts invite tokens.
- Project owners can set `OWNER_ONLY`, `AUTHORIZED_BROKERS`, or `OPEN_BROKERAGE` and manage active/revoked broker or brokerage authorizations.
- Marketplace broker reads now require both existing visibility access and Stage 8 selling eligibility.
- Public project sessions capture a project-aware first touch. A company/direct first touch cannot be replaced by a later broker URL.
- Broker attribution is accepted only when the broker/brokerage is active, approved, and allowed by the project's selling mode.
- Public leads store assignment type, reason, assigned organization/broker, visitor/session references, and sanitized first/last-touch context.
- CRM conversion preserves assignment and pre-assigns broker-attributed leads. Company-owned CRM leads cannot be claimed by brokers.
- Pseudonymous visitors, sessions, and bounded behavior events are persisted without invasive fingerprinting.
- CRM lead detail returns a scope-checked behavior summary; raw public visitor event endpoints do not exist.
- Admin Web has company creation, invitation copy/status, public invitation acceptance, project selling permissions, and CRM visitor behavior panels.
- Public Web creates UUID-like first-party identities, batches/throttles events, attaches visitor context to lead forms, and fails silently on analytics errors.

## Prisma Changes

Enums:

- `ProjectSellingMode`
- `ProjectBrokerAuthorizationStatus`
- `InvitationStatus`
- `LeadAssignmentType`
- `VisitorAttributionType`
- `PublicVisitorEventType`

Models:

- `OrganizationInvitation`
- `ProjectBrokerAuthorization`
- `PublicVisitor`
- `PublicVisitorSession`
- `PublicVisitorEvent`

Extended models:

- `Project.sellingMode`
- `PublicLead` visitor, attribution, and assignment fields
- `CrmLead.assignmentType` and `CrmLead.assignmentReason`

Additive migration: `apps/api/prisma/migrations/20260619120000_stage8_marketplace_governance/migration.sql`.

## API Endpoints

- `POST /platform-admin/organizations`
- `GET /platform-admin/organizations/:id/invitations`
- `POST /platform-admin/organizations/:id/invitations`
- `GET /invitations/:token`
- `POST /invitations/:token/accept`
- `PATCH /projects/:id/selling-mode`
- `GET /projects/:id/broker-authorizations`
- `POST /projects/:id/broker-authorizations`
- `DELETE /projects/:id/broker-authorizations/:authorizationId`
- `POST /public/visitors/session`
- `POST /public/visitors/events`

Existing contracts extended additively:

- `POST /public/leads` accepts `visitorId` and `visitorSessionId`.
- `GET /crm/leads/:id` can return `visitorBehavior`.

## Security and Privacy

- No raw invitation token is persisted or logged.
- No password, JWT, cookie, raw IP, or raw user-agent is stored in visitor analytics.
- Anonymous and browser-session keys are hashed before persistence.
- Visitor payloads are allowlisted and bounded: 25 events per batch, bounded strings, 0-100 scroll depth, and at most 30 minutes per time event.
- Visitor ingestion has a dedicated rate-limit family (`PUBLIC_VISITOR_RATE_LIMIT_*`).
- Behavior summaries are produced only after the CRM lead has passed existing platform/company/broker scope checks.
- Public project serializers do not expose selling modes, authorization lists, assignment details, or visitor analytics.

## Verification

- `pnpm --filter api build`: passed.
- `pnpm --filter api test --runInBand`: passed, 12 suites; 32 passed, 1 skipped.
- `pnpm --filter admin-web build`: passed.
- `pnpm --filter admin-web lint`: passed.
- `pnpm --filter public-web build`: passed.
- `pnpm --filter public-web lint`: passed.
- Prisma schema validation and client generation: passed.
- `pnpm --filter api test:e2e --runInBand`: attempted; 1 suite passed and 22 database-backed suites failed at their first Prisma query with `ECONNREFUSED` because local PostgreSQL at `localhost:5432` was unavailable. This run did compile the new Stage 8 suite.
- Stage 2/Stage 4 browser smoke: pending local smoke services.

## Known Gaps

- No real email/SMS delivery; the invite URL is copy-only.
- No invitation resend/revoke UI, although creating a replacement revokes older pending invitations for the same organization/email.
- No broker directory picker yet; the minimal project panel accepts an organization or user ID.
- No retention/anonymization job or analytics consent-management UI yet.
- No background aggregation; behavior summaries read a bounded latest-event window.
- `brokerSlug` currently resolves as a broker organization slug; individual user-friendly broker slugs are not modeled.
- No WebSocket, payment/provider integration, or Mobile changes.

## Next Recommendation

Apply the additive migration in staging, run the Stage 8 e2e suite against a disposable PostgreSQL database, then add retention/erasure policy automation and a scoped broker search picker before enabling the feature for production traffic.

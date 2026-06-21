# POPWAM Public API Contracts

## Stage 8 Visitor and Attribution Additions

`POST /public/visitors/session`

Creates or updates a pseudonymous first-party session. Required fields are client-generated `anonymousKey` and `sessionKey`; both are hashed in storage. Optional `projectSlug`, broker/brokerage URL parameters, `ref`, path, and primitive `utm` values are sanitized and bounded. The response contains opaque `visitorId` and `sessionId` values for later lead/event attachment.

`POST /public/visitors/events`

Accepts 1-25 events with `visitorId`, `sessionId`, an allowlisted event type, safe path, and event-specific bounded fields. Supported types: `PAGE_VIEW`, `PROJECT_VIEW`, `SEARCH`, `FILTER_CHANGE`, `SECTION_REACHED`, `SCROLL_DEPTH`, `TIME_ON_PAGE`, `LEAD_SUBMITTED`, `START_CHAT_CLICKED`, and `REQUEST_CALL_CLICKED`.

The endpoint has dedicated rate limiting. It never exposes events for reading.

`POST /public/leads` additive fields:

```json
{
  "visitorId": "opaque_visitor_id",
  "visitorSessionId": "opaque_session_id"
}
```

Invalid or mismatched visitor context is ignored for ownership and falls back safely. Public responses do not expose project selling mode, broker authorizations, internal assignment rationale, visitor events, or token hashes.

First-touch rules:

- `OWNER_ONLY` always assigns to the project developer.
- A valid authorized broker/brokerage first touch can own the lead for broker-enabled projects.
- A direct/company first touch is immutable for that visitor session and project.
- Unauthorized or unknown broker parameters are ignored and assignment falls back to the project owner.

---

Stage 2 Slice 1 added a backend-only public API foundation for organization websites, domain resolution, public marketplace reads, and safe lead capture.

Stage 2 Slice 2 adds authenticated public lead management, duplicate/idempotency handling for public lead capture, and domain verification workflow foundations. It does not add CRM automation, broker assignment, reservations, Cloudflare/DNS mutation, or real notification providers.

Stage 2 Slice 3 adds hardening foundations for public lead capture and DNS TXT verification checks. It keeps all provider integrations local to the API process: no Cloudflare API, DNS mutation, Redis, WAF, CRM, broker assignment, reservation, email, SMS, or push provider is added.

Stage 2 CRM/Public Start Chat adds a public-safe `CHAT` response path for `POST /public/leads`. Chat lead submissions create or reuse the CRM lead foundation and return only a conversation share token/link suitable for Public Web `/c/{token}` rendering.

Stage 2 Public Token Message Posting adds an unauthenticated but token-scoped `POST /conversations/by-token/:shareToken/messages` endpoint for plain-text public replies from shared conversation links. It does not add WebSocket, attachments, notifications, or a real chat provider.

## Privacy Rules

Public endpoints are allowlisted serializers. They never return raw Prisma records.

Public APIs expose only:

- approved organizations
- published organization website settings
- active projects with `OPEN_MARKETPLACE` visibility
- available units with inherited/open public visibility
- public-safe contact fields configured for the website

Public APIs do not expose:

- private, hidden, draft, suspended, archived, or sold-out projects
- private, hidden, held, reserved, sold, or unavailable units
- unit numbers
- users, brokers, internal broker identities, clients, lead claims, reservations, deal rooms, deals, commissions, audit logs, documents, or verification documents
- full organization profile legal/tax/commercial registration fields

## Public Organization

`GET /public/organizations/:slug`

Returns `404` unless the organization is `APPROVED` and website settings are published.

```json
{
  "id": "org_id",
  "name": "Demo Development Group",
  "slug": "demo-development-group",
  "type": "DEVELOPER",
  "status": "APPROVED",
  "profile": {
    "summary": "Public description",
    "logoUrl": "https://cdn.example/logo.png",
    "website": "https://example.com",
    "city": "Cairo",
    "country": "EG"
  },
  "websiteSettings": {
    "publicSlug": "demo-development-group",
    "subdomain": "developer-demo",
    "customDomain": null,
    "siteTitle": "Demo Development Group",
    "siteDescription": "Public website description",
    "logoUrl": null,
    "primaryColor": null,
    "secondaryColor": null,
    "contactPhone": "+201000000000",
    "contactEmail": "sales@example.com",
    "whatsappUrl": "https://wa.me/201000000000",
    "isPublished": true
  },
  "verification": {
    "badge": true,
    "status": "APPROVED"
  },
  "contact": {
    "phone": "+201000000000",
    "email": "sales@example.com",
    "whatsappUrl": "https://wa.me/201000000000"
  }
}
```

## Domain Resolution

`GET /public/domain/:host`

Supports:

- `developer-demo.popwam.com`
- configured custom domains
- local compatibility for `slug.localhost`, `slug.local`, and `slug.test`

```json
{
  "kind": "SUBDOMAIN",
  "host": "developer-demo.popwam.com",
  "organization": {},
  "websiteSettings": {},
  "routes": {
    "home": "/",
    "projects": "/projects",
    "contact": "/contact"
  }
}
```

## Public Project List

`GET /public/projects`

Optional query filters:

- `organizationSlug`
- `city`
- `district`
- `unitType`
- `minPrice`
- `maxPrice`

Returns only active open-marketplace projects from approved developer organizations.

```json
[
  {
    "id": "project_id",
    "name": "Northline Demo Residences",
    "slug": "northline-demo-residences",
    "type": "COMPOUND",
    "city": "New Cairo",
    "district": "Golden Square",
    "address": "Demo District, New Cairo",
    "deliveryDate": null,
    "description": "Public description",
    "coverImageUrl": null,
    "images": [],
    "amenities": ["Clubhouse"],
    "isFeatured": true,
    "availableUnitsCount": 3,
    "startingPrice": 1250000,
    "currency": "EGP",
    "developer": {
      "id": "org_id",
      "name": "Demo Development Group",
      "slug": "demo-development-group",
      "type": "DEVELOPER",
      "logoUrl": null,
      "summary": "Public description",
      "contact": {
        "phone": "+201000000000",
        "email": "sales@example.com",
        "whatsappUrl": "https://wa.me/201000000000"
      }
    },
    "paymentPlans": []
  }
]
```

## Public Project Detail

`GET /public/projects/:slug`

Adds public-safe coordinates, media, phases, available unit summaries, and payment plans. Unit `id` is included for frontend rendering and future form context, but `unitNumber` is intentionally omitted.

```json
{
  "id": "project_id",
  "name": "Northline Demo Residences",
  "slug": "northline-demo-residences",
  "latitude": 30.0123456,
  "longitude": 31.0123456,
  "videos": [],
  "brochureUrl": null,
  "phases": [
    {
      "id": "phase_id",
      "name": "Phase 1",
      "deliveryDate": null,
      "totalUnits": 100,
      "availableUnits": 20,
      "status": "ACTIVE"
    }
  ],
  "units": [
    {
      "id": "unit_id",
      "unitType": "APARTMENT",
      "areaSqm": 115,
      "bedrooms": 2,
      "bathrooms": 2,
      "finishing": "FULLY_FINISHED",
      "view": "Garden",
      "basePrice": 1250000,
      "currency": "EGP",
      "pricePerSqm": 10869.56,
      "images": [],
      "floorPlanUrl": null,
      "paymentPlans": []
    }
  ]
}
```

## Public Organization Projects

`GET /public/organizations/:slug/projects`

Returns the same project summary shape as `GET /public/projects`, scoped to one approved published organization.

## Public Lead Capture

`POST /public/leads`

Request:

```json
{
  "organizationSlug": "demo-development-group",
  "projectSlug": "northline-demo-residences",
  "name": "Public Buyer",
  "phone": "+201111111111",
  "email": "buyer@example.com",
  "message": "Interested in the launch.",
  "sourcePage": "/projects/northline-demo-residences",
  "utm": {
    "source": "google",
    "campaign": "stage2"
  },
  "idempotencyKey": "optional-client-generated-key",
  "website": "",
  "companyWebsite": "",
  "preferredContactMethod": "CALL",
  "consent": true
}
```

Rules:

- `name`, `phone`, and `consent: true` are required.
- At least one of `organizationSlug` or `projectSlug` is required.
- Supplied organization/project must be public-safe.
- UTM values are stored as a small JSON object with primitive values only.
- `idempotencyKey` is optional.
- `website` and `companyWebsite` are optional honeypot fields. Real users should leave them empty.
- `preferredContactMethod` is optional and supports `CALL`, `CHAT`, and `WHATSAPP`. Default is `CALL`.
- Phone is normalized and stored with a server-side hash/last-four foundation.
- Email is normalized to lowercase when supplied.
- Consent timestamp is stored when consent is true.
- Source IP and user agent are captured only as hashes when request context provides them.
- Duplicate detection checks matching organization, project, phone hash, and a recent 24-hour window. If an idempotency key is supplied, it is checked first in the same organization/project scope.
- Duplicate responses return the existing safe public lead id and status with `duplicate: true`.
- `CHAT` submissions create or reuse the CRM client/lead and public-lead conversation when the lead is not spam, then return a safe conversation share token and relative `/c/{token}` link.
- Repeated `CHAT` submissions with the same `idempotencyKey` return the same public lead id and same conversation token when possible.
- Duplicate `CHAT` submissions reuse the existing CRM/conversation when safe and do not create duplicate conversations for the same CRM lead.
- Duplicate hits update internal status note/spam signal metadata with the duplicate reason.
- Honeypot submissions are accepted safely as `SPAM` with high `spamScore`; they do not create CRM, claims, reservations, broker assignments, notifications, or deals.
- A minimal in-memory per-process rate limit protects `POST /public/leads`.
- No lead claim, reservation request, broker assignment, notification, ad integration, email, SMS, or push provider is triggered.
- `WHATSAPP` returns a safe placeholder link from organization website settings if one exists. No WhatsApp provider is called.
- Public lead responses never expose `organizationId`, `crmLeadId`, `clientId`, user IDs, broker IDs, deal/reservation/commission data, private inventory, audit logs, password hashes, or token hashes.

Rate limit environment variables:

- `PUBLIC_LEAD_RATE_LIMIT_WINDOW_SECONDS`, default `60`
- `PUBLIC_LEAD_RATE_LIMIT_MAX`, default `100`

Rate limit response:

```json
{
  "statusCode": 429,
  "message": "Too many public lead submissions. Please try again shortly."
}
```

The rate limiter is intentionally an in-memory foundation. It is useful for local/demo protection but is not production-safe across multiple API processes. Production should use Redis, an API gateway, WAF, or equivalent shared rate-limiting infrastructure.

Response:

```json
{
  "success": true,
  "ok": true,
  "id": "public_lead_id",
  "leadId": "public_lead_id",
  "status": "NEW",
  "preferredContactMethod": "CALL",
  "message": "Lead received."
}
```

Chat response:

```json
{
  "success": true,
  "ok": true,
  "id": "public_lead_id",
  "leadId": "public_lead_id",
  "status": "CONVERTED",
  "preferredContactMethod": "CHAT",
  "conversation": {
    "shareToken": "random-token",
    "shareUrl": "/c/random-token"
  },
  "shareToken": "random-token",
  "conversationUrl": "/c/random-token",
  "message": "Your chat request was created."
}
```

Honeypot/spam response:

```json
{
  "success": true,
  "ok": true,
  "id": "public_lead_id",
  "leadId": "public_lead_id",
  "status": "SPAM",
  "message": "Lead received for review."
}
```

Duplicate response:

```json
{
  "success": true,
  "ok": true,
  "id": "existing_public_lead_id",
  "leadId": "existing_public_lead_id",
  "status": "NEW",
  "duplicate": true,
  "message": "Lead already received."
}
```

Duplicate chat responses may also include the same safe `conversation`, `shareToken`, and `conversationUrl` fields shown in the chat response above.

## Public Conversation Token

`GET /conversations/by-token/:shareToken`

Returns public-safe conversation data for a valid share token. Responses are allowlisted for public rendering and do not expose organization IDs, CRM lead IDs, client IDs, user IDs, broker IDs, lead claims, reservations, deal rooms, deals, commissions, audit logs, password hashes, token hashes, or private inventory.

`POST /conversations/by-token/:shareToken/messages`

Request:

```json
{
  "body": "Hello, I am still interested.",
  "senderName": "Buyer Name"
}
```

Response:

```json
{
  "ok": true,
  "message": {
    "id": "message_id",
    "type": "TEXT",
    "body": "Hello, I am still interested.",
    "createdAt": "date",
    "sender": {
      "publicRole": "CLIENT",
      "displayName": "Buyer Name"
    }
  }
}
```

Rules:

- Endpoint is unauthenticated but scoped to a valid `shareToken`.
- Only `OPEN` conversations accept public replies.
- Empty messages and messages longer than 2000 characters are rejected.
- `senderName` is optional, sanitized, and limited to 120 characters.
- Public replies reuse the existing `CLIENT` participant or create a safe public client participant when missing.
- No attachments, HTML rendering, WebSocket, real chat provider, notification provider, or WhatsApp provider is used.
- Public replies do not create CRM leads, lead claims, reservations, deal rooms, deals, commissions, payments, or broker assignments.
- Public reply responses do not expose conversation IDs, participant IDs, organization IDs, CRM lead IDs, client IDs, user IDs, broker IDs, deal/reservation/commission IDs, audit logs, password hashes, token hashes, or private metadata.

Rate limit environment variables:

- `PUBLIC_CONVERSATION_MESSAGE_RATE_LIMIT_WINDOW_SECONDS`, default `60`
- `PUBLIC_CONVERSATION_MESSAGE_RATE_LIMIT_MAX`, default `30`

Rate limit response:

```json
{
  "statusCode": 429,
  "message": "Too many public conversation messages. Please try again shortly."
}
```

The public token message limiter is intentionally an in-memory foundation. It is useful for local/demo protection but is not production-safe across multiple API processes.

## Authenticated Public Lead Management

All endpoints require bearer auth. Public users cannot access these endpoints.

Organization users with `public_leads.view_own` or `public_leads.manage_own` are scoped to their own organization public leads. Platform users with `public_leads.view_all` or `public_leads.manage_all` can view all public leads. Platform mutation requires `public_leads.manage_all`.

Brokerage users only see public leads owned by their own organization; they do not see developer leads unless those leads are explicitly stored against the brokerage organization.

`GET /public-leads`

Returns public leads in the caller's allowed scope:

```json
[
  {
    "id": "public_lead_id",
    "organizationId": "org_id",
    "projectId": "project_id",
    "name": "Public Buyer",
    "phone": "+201111111111",
    "phoneLast4": "1111",
    "email": "buyer@example.com",
    "message": "Interested in the launch.",
    "sourcePage": "/projects/northline-demo-residences",
    "utm": {
      "source": "google"
    },
    "consent": true,
    "idempotencyKey": "optional-client-generated-key",
    "status": "NEW",
    "statusNote": null,
    "spamScore": 0,
    "spamSignals": null,
    "sourceIpHash": "sha256_hash",
    "userAgentHash": "sha256_hash",
    "normalizedEmail": "buyer@example.com",
    "consentAt": "2026-05-24T00:00:00.000Z",
    "createdAt": "2026-05-24T00:00:00.000Z",
    "updatedAt": "2026-05-24T00:00:00.000Z",
    "organization": {
      "id": "org_id",
      "name": "Demo Development Group",
      "slug": "demo-development-group",
      "type": "DEVELOPER",
      "status": "APPROVED"
    },
    "project": {
      "id": "project_id",
      "name": "Northline Demo Residences",
      "slug": "northline-demo-residences",
      "status": "ACTIVE",
      "visibility": "OPEN_MARKETPLACE"
    }
  }
]
```

`GET /public-leads/:id`

Returns one lead only when it is inside the caller's allowed organization/platform scope.

`PATCH /public-leads/:id/status`

Request:

```json
{
  "status": "REVIEWED",
  "note": "Reviewed by sales ops."
}
```

Allowed transitions:

- `NEW -> REVIEWED`
- `NEW -> CONVERTED`
- `REVIEWED -> CONVERTED`
- `NEW -> SPAM`
- `REVIEWED -> SPAM`
- `SPAM -> CONVERTED` only for platform users with `public_leads.manage_all`

`PATCH /public-leads/:id/mark-spam`

Marks an eligible public lead as `SPAM`.

`PATCH /public-leads/:id/convert-placeholder`

Converts an eligible public lead into a `CrmClient` and `CrmLead`, marks the public lead as `CONVERTED`, and is idempotent by public lead id. It does not create a LeadClaim, ReservationRequest, broker assignment, DealRoom, deal, commission, provider notification, or ad integration event. CRM response details are documented in `apps/api/CRM_CONTRACTS.md`.

## Authenticated Website Settings

`GET /organization-website-settings/me`

Requires `organization_website.view_own`.

`PATCH /organization-website-settings/me`

Requires `organization_website.update_own`.

Payload fields:

```json
{
  "publicSlug": "demo-development-group",
  "subdomain": "developer-demo",
  "customDomain": "example.com",
  "siteTitle": "Demo Development Group",
  "siteDescription": "Public website description",
  "logoUrl": "https://cdn.example/logo.png",
  "primaryColor": "#0f766e",
  "secondaryColor": "#111827",
  "contactPhone": "+201000000000",
  "contactEmail": "sales@example.com",
  "whatsappUrl": "https://wa.me/201000000000",
  "isPublished": true
}
```

## Domain Verification Management

Domain verification APIs are authenticated and backend-only foundations. They generate tokens and store review state but do not call Cloudflare, mutate DNS, send emails, or perform real DNS checks.

Organization domain endpoints require `organization_domains.view_own` and/or `organization_domains.manage_own` and are scoped to the caller's organization.

`GET /organization-domains/me`

Returns current organization domain verification records.

`POST /organization-domains/me`

Request:

```json
{
  "domain": "example.com",
  "type": "CUSTOM_DOMAIN"
}
```

Response:

```json
{
  "id": "domain_verification_id",
  "organizationId": "org_id",
  "domain": "example.com",
  "type": "CUSTOM_DOMAIN",
  "status": "PENDING",
  "verificationToken": "popwam-domain-token",
  "lastCheckedAt": null,
  "verifiedAt": null,
  "failureReason": null,
  "verificationInstructions": {
    "txtName": "_popwam.example.com",
    "txtValue": "popwam-domain-token"
  }
}
```

`PATCH /organization-domains/:id/request-verification`

Regenerates a token, clears failure state, sets `status: PENDING`, and records `lastCheckedAt`. No DNS check is performed.

`PATCH /organization-domains/:id/check-dns`

Checks the expected TXT record using Node DNS resolver:

- TXT name: `_popwam.{domain}`
- TXT value: `verificationToken`

If the token is found:

- domain status becomes `VERIFIED`
- `verifiedAt` and `lastCheckedAt` are set
- `failureReason` is cleared
- `statusNote` is set to `dns_txt_verified`
- custom domain is activated in website settings

If the token is missing or DNS lookup fails:

- domain status remains `PENDING`
- `lastCheckedAt` is set
- `failureReason` explains the missing/failed TXT lookup
- `statusNote` is set to `dns_txt_missing` or `dns_txt_lookup_failed`

This endpoint does not mutate DNS, call Cloudflare, use provider credentials, or send notifications. Non-production test/local runs may use `PUBLIC_DOMAIN_DNS_MOCK_TXT_JSON` to provide deterministic TXT records for smoke/e2e tests.

`PATCH /organization-domains/:id/mark-verified-dev-only`

Available outside production only. Marks a domain `VERIFIED` for local/demo workflows. In production this returns `403`.

Platform review endpoints require a platform user with `organization_domains.verify`.

`GET /platform-admin/domains`

Lists all domain verification records with safe organization summaries.

`PATCH /platform-admin/domains/:id/approve`

Marks a domain `VERIFIED`. For custom domains, the organization website settings `customDomain` is activated only after this approval or dev-only verification.

`PATCH /platform-admin/domains/:id/reject`

Request:

```json
{
  "reason": "DNS TXT record missing."
}
```

Marks a domain `FAILED` and stores the failure reason.

Domain status flow:

1. Organization creates custom domain record: `PENDING`.
2. Organization publishes TXT token externally.
3. Organization requests verification: remains `PENDING`, token may rotate.
4. Organization can check DNS:
   - TXT found: `VERIFIED`, custom domain can become active
   - TXT missing/failing: remains `PENDING`, reason stored
5. Platform can still approve: `VERIFIED`, custom domain can become active.
6. Platform rejects: `FAILED`, reason stored.
7. Organization can request verification again: returns to `PENDING`.

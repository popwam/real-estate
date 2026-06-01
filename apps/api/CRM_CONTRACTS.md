# POPWAM CRM Contracts - Stage 2 CRM

## Base Rules

- CRM APIs are authenticated unless explicitly noted.
- Backend authorization remains the source of truth.
- CRM conversion does not create `LeadClaim`, `ReservationRequest`, `DealRoom`, deals, commissions, broker assignment, or payment records.
- Public token conversation views are safe and do not expose internal user IDs, organization-private metadata, lead claims, reservations, deals, commissions, or audit logs.

## Paginated Response Shape

List endpoints return arrays when called without query parameters for Slice 1 compatibility.

When filters or pagination parameters are supplied, list endpoints return:

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

Defaults:

- `page`: `1`
- `pageSize`: `20`
- max `pageSize`: `100`

## CRM Client Shape

```json
{
  "id": "crm_client_cuid",
  "organizationId": "developer_org_cuid",
  "name": "Buyer Name",
  "phone": "+201000000000",
  "phoneLast4": "0000",
  "email": "buyer@example.com",
  "normalizedEmail": "buyer@example.com",
  "source": "PUBLIC_LEAD",
  "createdAt": "date",
  "updatedAt": "date"
}
```

Internal storage also keeps `normalizedPhone` and `phoneHash`.

## CRM Lead Shape

```json
{
  "id": "crm_lead_cuid",
  "organizationId": "developer_org_cuid",
  "projectId": "project_cuid",
  "unitId": null,
  "publicLeadId": "public_lead_cuid",
  "clientId": "crm_client_cuid",
  "status": "NEW",
  "statusNote": null,
  "preferredContactMethod": "CALL",
  "claimedByBrokerUserId": null,
  "claimedByOrganizationId": null,
  "claimedAt": null,
  "sourcePage": "/projects/example",
  "utm": { "source": "google" },
  "client": {},
  "project": {},
  "organization": {}
}
```

Statuses: `NEW`, `CLAIMED`, `IN_CONVERSATION`, `QUALIFIED`, `LOST`, `CONVERTED`, `SPAM`.

Preferred contact methods: `CALL`, `CHAT`, `WHATSAPP`.

## Public Lead Conversion

`PATCH /public-leads/:id/convert-placeholder`

Converts a scoped `PublicLead` into:

- `CrmClient`
- `CrmLead`

Behavior:

- Marks the `PublicLead` as `CONVERTED`.
- Is idempotent by `publicLeadId`.
- Preserves organization, project, source page, UTM, and preferred contact method.
- Does not create LeadClaim, ReservationRequest, DealRoom, deal, commission, or broker assignment.
- `CHAT` leads create or reuse a foundation conversation immediately.
- `WHATSAPP` leads return a safe placeholder link from organization website settings when available; no WhatsApp provider is called.

## Public Start Chat From Lead Capture

`POST /public/leads`

When `preferredContactMethod` is `CHAT`, the public lead capture endpoint creates or reuses:

- `PublicLead`
- `CrmClient`
- `CrmLead`
- one `PUBLIC_LEAD` conversation for that CRM lead

The public response exposes only safe chat-link fields:

```json
{
  "success": true,
  "ok": true,
  "id": "public_lead_cuid",
  "leadId": "public_lead_cuid",
  "preferredContactMethod": "CHAT",
  "conversation": {
    "shareToken": "random-token",
    "shareUrl": "/c/random-token"
  },
  "shareToken": "random-token",
  "conversationUrl": "/c/random-token"
}
```

Idempotency and duplicate rules:

- Repeating the same request with the same `idempotencyKey` returns the same public lead id and conversation token when possible.
- Duplicate chat leads reuse the existing CRM lead/conversation when safe.
- Only one `PUBLIC_LEAD` conversation is created for a CRM lead.
- Honeypot/spam leads do not create CRM records or conversations.

Public safety rules:

- Public lead capture responses do not expose `organizationId`, `crmLeadId`, `clientId`, user IDs, broker IDs, LeadClaim, ReservationRequest, DealRoom, deal, commission, payment, audit log, or private inventory data.
- The share token can be used to read safe conversation data and post plain-text public replies through token-scoped endpoints.
- No WebSocket, real chat provider, notification provider, or WhatsApp provider is added.

## CRM Lead Endpoints

### `GET /crm/leads/marketplace`

Broker/brokerage marketplace view for claimable CRM leads.

- Unclaimed leads show client details.
- Leads claimed by another broker are returned as unavailable with masked client details.
- Supports filters and pagination.

### `POST /crm/leads/:id/claim`

Claims an available CRM lead for the authenticated broker/brokerage user.

- First claim wins.
- Later claims return conflict.
- Uses a transaction-safe update.

### `GET /crm/leads`

Lists CRM leads in authenticated scope.

- Platform: all.
- Developer: own project/organization leads.
- Brokerage: leads claimed by its organization or brokers.
- Broker: leads claimed by that broker.
- Supports filters and pagination.

Query parameters for `GET /crm/leads` and `GET /crm/leads/marketplace`:

- `status`: one of `NEW`, `CLAIMED`, `IN_CONVERSATION`, `QUALIFIED`, `LOST`, `CONVERTED`, `SPAM`
- `preferredContactMethod`: `CALL`, `CHAT`, or `WHATSAPP`
- `projectId`
- `sourcePage`
- `claimedOnly`: `true` or `1`
- `unclaimedOnly`: `true` or `1`
- `search`: simple search over safe client name, phone last4, and normalized email when the caller can see those fields
- `dateFrom`
- `dateTo`
- `page`
- `pageSize`

Marketplace search does not expose private details for leads claimed by another broker; claimed-by-other rows remain masked.

### `GET /crm/leads/:id`

Returns one CRM lead in authenticated scope.

### `PATCH /crm/leads/:id/status`

Updates a CRM lead status in authenticated scope.

Request:

```json
{
  "status": "QUALIFIED",
  "statusNote": "Called and qualified"
}
```

Rules:

- Platform can update all CRM leads.
- Developer owners/admins can update leads in their project/organization scope with `crm.leads.manage_own`.
- Claimed broker users can update their own claimed leads.
- Brokerage owner/admin users can update claimed brokerage leads with `crm.leads.manage_own`.
- Unauthorized organizations receive `403`.
- This endpoint does not create reservations, deal rooms, deals, commissions, payments, or broker assignments.

## Conversation Shape

```json
{
  "id": "conversation_cuid",
  "organizationId": "developer_org_cuid",
  "projectId": "project_cuid",
  "unitId": null,
  "crmLeadId": "crm_lead_cuid",
  "type": "PUBLIC_LEAD",
  "status": "OPEN",
  "statusNote": null,
  "shareToken": "random-token",
  "participants": [],
  "recentMessages": []
}
```

Conversation types: `PUBLIC_LEAD`, `DEAL_ROOM`, `SUPPORT`.

Statuses: `OPEN`, `CLOSED`, `ARCHIVED`.

Participant roles: `CLIENT`, `BROKER`, `DEVELOPER`, `PLATFORM`, `SYSTEM`.

Message types: `TEXT`, `SYSTEM`, `CONTACT_REQUEST`, `STATUS_UPDATE`.

## Conversation Endpoints

- `GET /conversations`
- `GET /conversations/:id`
- `POST /conversations/from-crm-lead/:crmLeadId`
- `GET /conversations/:id/messages`
- `POST /conversations/:id/messages`
- `GET /conversations/by-token/:shareToken`
- `POST /conversations/by-token/:shareToken/messages`
- `PATCH /conversations/:id/status`

Access:

- Participants can view their own conversation.
- Developers can view conversations related to their own projects.
- Claimed brokers and brokerages can view claimed lead conversations.
- Platform can view all.
- Public share token responses omit internal IDs and private data.

Query parameters for `GET /conversations`:

- `status`: `OPEN`, `CLOSED`, or `ARCHIVED`
- `type`: `PUBLIC_LEAD`, `DEAL_ROOM`, or `SUPPORT`
- `projectId`
- `crmLeadId`
- `search`: simple search over safe client name, phone last4, normalized email, project name, and participant display names in authenticated scope
- `dateFrom`
- `dateTo`
- `page`
- `pageSize`

### `PATCH /conversations/:id/status`

Updates a conversation status in authenticated scope.

Request:

```json
{
  "status": "CLOSED",
  "statusNote": "Resolved"
}
```

Rules:

- Authenticated, scoped users with conversation management/project conversation permission can update status.
- Platform can update all.
- Public token users cannot update conversation status.
- No WebSocket or chat provider is called.

### `GET /conversations/by-token/:shareToken`

Unauthenticated, token-scoped public-safe conversation view.

Rules:

- Returns only safe conversation summary, participant display roles/names, project summary, and message bodies.
- Does not expose organization IDs, CRM lead IDs, client IDs, user IDs, broker IDs, deal IDs, reservation IDs, commission IDs, or audit data.
- The view is safe for Public Web `/c/{token}` and mobile `/c/:token` rendering.

### `POST /conversations/by-token/:shareToken/messages`

Unauthenticated, token-scoped public message posting.

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

- Works only for valid share tokens and `OPEN` conversations.
- Creates a `TEXT` conversation message from the existing `CLIENT` participant, or creates a safe public `CLIENT` participant when missing.
- Message body is trimmed, required, plain text, and limited to 2000 characters.
- `senderName` is optional, sanitized, and limited to 120 characters.
- The response does not expose conversation IDs, sender participant IDs, organization IDs, CRM lead IDs, client IDs, user IDs, broker IDs, deal/reservation/commission IDs, or private metadata.
- Public token users cannot update status, attach files, post HTML, or call authenticated conversation endpoints.
- No WebSocket, real chat provider, notification provider, WhatsApp provider, reservations, deal rooms, deals, commissions, or payments are created.

Rate limit:

- `PUBLIC_CONVERSATION_MESSAGE_RATE_LIMIT_WINDOW_SECONDS`, default `60`
- `PUBLIC_CONVERSATION_MESSAGE_RATE_LIMIT_MAX`, default `30`

The public message rate limiter is in-memory and process-local. Production should use Redis, an API gateway, WAF, or equivalent shared rate limiting.

## CRM Summary

### `GET /crm/summary`

Returns scoped counts for dashboards:

```json
{
  "leads": {
    "total": 0,
    "new": 0,
    "claimed": 0,
    "qualified": 0,
    "lost": 0,
    "converted": 0,
    "spam": 0
  },
  "conversations": {
    "open": 0,
    "closed": 0,
    "archived": 0
  },
  "today": {
    "newLeads": 0,
    "newMessages": 0
  }
}
```

Scoping:

- Developer users see own project/organization lead and conversation counts.
- Broker/brokerage users see own claimed/brokerage-scoped counts.
- Platform users see all counts.
- No private row data is returned.

## CRM Activity Timeline

Slice 5 adds an authenticated activity timeline foundation.

### Activity Shape

```json
{
  "id": "crm_activity_cuid",
  "organizationId": "developer_org_cuid",
  "crmLeadId": "crm_lead_cuid",
  "conversationId": "conversation_cuid",
  "actorUserId": "user_cuid",
  "actorOrganizationId": "org_cuid",
  "actorRole": "developer_owner",
  "publicActorName": null,
  "type": "LEAD_STATUS_CHANGED",
  "title": "CRM lead status changed",
  "body": "Called and qualified",
  "metadata": {
    "previousStatus": "CLAIMED",
    "status": "QUALIFIED"
  },
  "createdAt": "date"
}
```

Allowed `type` values:

- `LEAD_CREATED`
- `LEAD_CONVERTED`
- `LEAD_CLAIMED`
- `LEAD_STATUS_CHANGED`
- `CONVERSATION_CREATED`
- `CONVERSATION_STATUS_CHANGED`
- `MESSAGE_SENT`
- `PUBLIC_MESSAGE_SENT`
- `NOTE_ADDED`

### Activity Endpoints

- `GET /crm/activities`
- `GET /crm/leads/:id/activities`
- `GET /conversations/:id/activities`

Query parameters:

- `crmLeadId`
- `conversationId`
- `type`
- `dateFrom`
- `dateTo`
- `page`
- `pageSize`

Response shape:

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

Default `pageSize` is `20`; maximum `pageSize` is `100`.

Activity write behavior:

- Public lead conversion writes `LEAD_CREATED` and `LEAD_CONVERTED`.
- Broker claim writes `LEAD_CLAIMED`.
- CRM lead status update writes `LEAD_STATUS_CHANGED`.
- Conversation creation writes `CONVERSATION_CREATED`.
- Authenticated message posting writes `MESSAGE_SENT`.
- Public token message posting writes `PUBLIC_MESSAGE_SENT` internally.
- Conversation status update writes `CONVERSATION_STATUS_CHANGED`.
- Activity writes do not create reservations, deal rooms, deals, commissions, payments, notifications, WebSocket events, or provider events.

Activity access:

- Activity endpoints are authenticated only.
- Developer users see activities for their own organization/projects.
- Broker/brokerage users see activities for their own claimed leads and accessible conversations.
- Platform users see all activities.
- Public token users cannot list activities.
- Public token conversation endpoints never expose activity rows.

## Permissions

- `crm.leads.view_own`
- `crm.leads.manage_own`
- `crm.leads.claim`
- `crm.conversations.view_own`
- `crm.conversations.manage_own`
- `crm.conversations.view_project`
- `crm.clients.view_own`
- `crm.clients.manage_own`

## Privacy Rules

CRM APIs must not expose:

- Private inventory.
- Internal broker/client/deal/commission internals outside the authenticated scope.
- LeadClaim or ReservationRequest data.
- Deal rooms, deals, commissions, payments, ledger data, or audit logs.
- Public token views must stay limited to conversation-safe fields.

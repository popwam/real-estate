# Team 1 Rules — Backend Core / Platform Foundation

## Identity

You are Team 1: Backend Core.

You own the foundation of POPWAM Verified Real Estate Marketplace.

Your work lives mainly in:

```text
apps/api
packages/shared-types
packages/api-contracts
infra
```

---

## Master Goal

Build the foundation that every other team depends on:

- API base
- PostgreSQL + PostGIS connection
- Prisma
- Auth
- Organizations
- Users
- Roles
- Permissions
- Verification
- Audit Logs
- File upload abstraction
- Notification events base
- Swagger docs

---

## Core Rule

Use `organizations`, not old isolated `tenants`.

Organizations may be:

```text
PLATFORM
DEVELOPER
BROKERAGE
INDIVIDUAL_BROKER
```

The system must support:
- organization isolation
- controlled cross-organization marketplace flows later

---

## Allowed Folders

You may work in:

```text
apps/api/src
apps/api/prisma
apps/api/test
apps/api/package.json
packages/shared-types
packages/api-contracts
infra/docker
.env.example
```

---

## Do Not Own

Do not implement:

```text
projects
inventory
lead_claims
deal_rooms
commissions
public web
mobile UI
AI/DVR
marketing builder
```

You may create contracts/events/placeholders only if needed.

---

## Required Modules

```text
apps/api/src/modules/auth
apps/api/src/modules/organizations
apps/api/src/modules/organization-verifications
apps/api/src/modules/users
apps/api/src/modules/roles
apps/api/src/modules/permissions
apps/api/src/modules/audit-logs
apps/api/src/modules/files
apps/api/src/modules/notifications
apps/api/src/modules/platform-admin
```

---

## Required Prisma Models

```text
Organization
OrganizationProfile
OrganizationVerification
User
Role
Permission
RolePermission
RefreshToken
AuditLog
UploadedFile
NotificationEvent
```

---

## Required Status File

After every Codex task, update:

```text
apps/api/TEAM_STATUS.md
```

Format:

```md
# TEAM_STATUS.md — Team 1 Backend Core

## Current Slice
...

## Percentage Completed
...

## What Was Done
...

## Files Created
...

## Files Modified
...

## Prisma Models Added/Changed
...

## Endpoints Added
...

## Permissions Added
...

## Tests / Manual Checks
...

## Missing / Not Done
...

## Blockers
...

## Dependencies For Other Teams
...

## Next Slice Recommendation
...

## Codex Prompt Used
...
```

---

## Slice Plan

### Slice 1 — 20%
Focus:
- API health
- env validation
- Prisma setup
- base module structure
- Docker compatibility
- Organization/User/Role initial schema draft

### Slice 2 — 40%
Focus:
- Auth register/login
- JWT payload
- refresh tokens
- current user endpoint
- password hashing

### Slice 3 — 60%
Focus:
- Organizations CRUD
- Users CRUD
- roles/permissions base
- seed roles
- guards

### Slice 4 — 80%
Focus:
- verification documents
- approval/rejection
- file upload abstraction
- audit logs

### Slice 5 — 100%
Focus:
- Swagger docs
- tests
- integration readiness
- API contracts for Teams 2/3/4/6

---

## First Codex Prompt Template

```text
You are Codex working on POPWAM Team 1 Backend Core.

Read:
- popwam-revised-marketplace-plan.md
- 01-team1-backend-core-rules.md
- current folder tree

Task: Implement Slice 1 only, approximately 20% of Team 1 scope.

Scope:
1. Inspect apps/api structure.
2. Ensure NestJS API has a health endpoint.
3. Configure environment validation.
4. Configure Prisma if not configured.
5. Add initial Prisma schema models:
   - Organization
   - OrganizationProfile
   - User
   - Role
   - Permission
   - RolePermission
   - RefreshToken
   - AuditLog
6. Create module folders:
   - auth
   - organizations
   - users
   - roles
   - permissions
   - audit-logs
7. Do not implement marketplace modules.
8. Do not implement projects/inventory/lead-claims/deal-rooms.

Required output:
- Modify only relevant files.
- Add migration instructions.
- Add or update apps/api/TEAM_STATUS.md.
- Report files created/modified.
- Report how to test locally.

Manual tests:
- API starts.
- GET /health returns 200.
- Prisma validates.
- Migration can run or schema can be generated.
```

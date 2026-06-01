# POPWAM — Execution Order & Team Handoffs

> Use this file in every ChatGPT project before asking it to create Codex prompts.
> Master plan source: `popwam-revised-marketplace-plan.md`.

---

## 1. The Correct Execution Philosophy

Do **not** ask all teams to implement their full scope at once.

Each team should:
1. Understand its full responsibility.
2. Split its work into small Codex prompts.
3. Execute only the current slice.
4. Update a status file after every slice.
5. Wait for required dependencies before integrating with other teams.

The correct delivery unit is not "the whole team module".
The correct delivery unit is approximately **15–25% of that team's scope**.

Recommended slice size:
- 1 to 3 days of work.
- Clear input.
- Clear output.
- Testable locally.
- No hidden dependency.
- Ends with a status update.

---

## 2. Required Files In Every Team ChatGPT Project

When creating each ChatGPT project, upload:

1. `popwam-revised-marketplace-plan.md`
2. The corresponding team rules file:
   - `01-team1-backend-core-rules.md`
   - `02-team2-marketplace-backend-rules.md`
   - `03-team3-admin-web-rules.md`
   - `04-team4-mobile-app-rules.md`
   - `05-team5-public-web-marketing-domains-rules.md`
   - `06-team6-workers-ai-integrations-rules.md`
3. A file containing current project folder names / tree.
4. The latest status file from that team if it already started.

---

## 3. Required Status File After Every Codex Slice

Every team must maintain a status file:

```text
TEAM_STATUS.md
```

Each update must include:

```md
# TEAM_STATUS.md

## Team Name
Team X — ...

## Current Slice
Name of current slice.

## Percentage Completed
Example: 20%

## What Was Done
- ...

## Files Created
- ...

## Files Modified
- ...

## APIs / Screens / Modules Added
- ...

## What Was Tested
- ...

## What Is Missing
- ...

## Blockers
- ...

## Dependencies Needed From Other Teams
- ...

## Next Recommended Slice
- ...

## Codex Prompt Used
Paste the exact Codex prompt used for this slice.
```

---

## 4. Global Dependency Rules

### Team 1 — Backend Core
Starts first.

Team 1 owns:
- API base
- DB
- Organizations
- Auth
- RBAC
- Verification
- Audit logs

No other team can fully integrate until Team 1 delivers enough foundation.

### Team 2 — Marketplace Backend
Starts serious implementation when Team 1 reaches around **70% of Sprint 1/Sprint 2 foundation**.

Team 2 can start planning earlier, but should not implement real APIs depending on missing Organization/RBAC contracts.

### Team 3 — Admin Web
Starts early in parallel after Team 1 exposes auth contracts or at least DTO/API mock contracts.

Team 3 can build:
- layout
- auth shell
- mocked dashboards

Real integration begins when Team 1 reaches around **50–60%**.

### Team 4 — Mobile App
Starts early for:
- Flutter architecture
- auth shell
- router
- Dio
- secure storage

Marketplace mobile integration begins when Team 2 reaches around **50%** of Projects/Inventory APIs.

### Team 5 — Public Web + Marketing + Domains
Starts early for:
- public-web structure
- middleware draft
- homepage skeleton
- SEO components

Real project/domain integration begins when:
- Team 1 has organization/domain basics
- Team 2 has public marketplace project APIs

### Team 6 — Workers + AI/DVR
Starts early for:
- worker structure
- RabbitMQ connection
- health checks
- notification skeleton
- AI service health

Real jobs begin when Team 1 and Team 2 publish stable event names.

---

## 5. Recommended Start Order

### Phase A — Start Immediately

Start these first:

```text
1. Team 1 — Backend Core
2. Team 3 — Admin Web shell
3. Team 4 — Mobile app shell
6. Team 6 — Workers/AI skeleton
5. Team 5 — Public Web skeleton
```

Team 2 should read, design, and prepare DTOs, but wait for Team 1's core contracts before implementation.

---

## 6. Practical Percentage Gates

### Gate 1
When Team 1 reaches **30%**:
- API health works.
- Prisma connected.
- basic project structure exists.
- auth DTOs drafted.

Then Team 3 and Team 4 can start auth screens using mocks/contracts.

### Gate 2
When Team 1 reaches **50%**:
- Organizations model exists.
- Users model exists.
- login/register endpoints exist.
- JWT payload shape exists.

Then Team 3 can integrate login and Organization list.
Team 4 can integrate mobile login.

### Gate 3
When Team 1 reaches **70%**:
- RBAC base works.
- Verification workflow base works.
- audit logs work.
- Swagger/API docs exist.

Then Team 2 starts real Marketplace backend implementation.

### Gate 4
When Team 2 reaches **30%**:
- Developer/Brokerage profiles exist.
- Projects schema exists.
- Inventory schema exists.

Then Team 3 starts Developer project UI with real API contracts.

### Gate 5
When Team 2 reaches **50%**:
- Projects CRUD works.
- Inventory CRUD works.
- Visibility rules work.
- Marketplace list endpoint works.

Then Team 4 starts real Marketplace mobile screens.
Team 5 starts public marketplace pages.

### Gate 6
When Team 2 reaches **70%**:
- Lead Claim works.
- Duplicate detection works.
- Reservation request works.

Then Team 3 and Team 4 start Lead Claim / Reservation UI.

### Gate 7
When Team 2 reaches **85%**:
- Deal Room APIs work.
- Deal status transitions work.
- Mark Sold flow works.

Then Team 3 and Team 4 start Deal Room integration.

### Gate 8
When Team 2 reaches **95%**:
- Commission entries work.
- ledger hooks work.
- dispute basics work.

Then Team 3 builds commission dashboards.
Team 6 builds commission notifications/jobs.

---

## 7. Team Start Dependencies Table

| Team | Can Start Immediately? | Full Integration Starts When |
|---|---:|---|
| Team 1 Backend Core | Yes | Immediately |
| Team 2 Marketplace Backend | Planning only | Team 1 70% |
| Team 3 Admin Web | Yes, shell/mocks | Team 1 50%, Team 2 30% |
| Team 4 Mobile | Yes, shell/auth | Team 1 50%, Team 2 50% |
| Team 5 Public Web | Yes, shell/SEO | Team 1 70%, Team 2 50% |
| Team 6 Workers/AI | Yes, skeleton | Team 1 50%, Team 2 60% |

---

## 8. Rule For Every ChatGPT Team Project

Ask the ChatGPT project to produce Codex prompts, not final code directly.

Each team ChatGPT should output:
1. Codex Prompt 1 for first 20%.
2. Expected files to modify.
3. Manual tests.
4. Status update template.
5. Next prompt only after status is returned.

---

## 9. Universal First Message To Each Team ChatGPT

Use this:

```text
You are responsible for one team in POPWAM Verified Real Estate Marketplace.

Read the uploaded master plan and your team rules file.

Your job is NOT to implement everything at once.
Your job is to split your team scope into 15–25% implementation slices and generate a precise Codex prompt for the first slice only.

Every Codex prompt must:
- specify exact folders/files to inspect
- specify exact files to create/modify
- avoid unrelated modules
- include manual tests
- require updating TEAM_STATUS.md
- include what to report back

Start by giving me:
1. Team scope summary
2. Dependency check
3. First 20% Codex prompt
4. Expected output
5. TEAM_STATUS.md template
```

---

## 10. Never Skip Status Files

No team moves to the next slice unless `TEAM_STATUS.md` is updated.

The status file is your source of truth for:
- what was done
- what is missing
- what broke
- what the next prompt should do

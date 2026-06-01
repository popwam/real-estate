# Team 6 Rules — Workers + AI/DVR + Integrations

## Identity

You are Team 6: Workers, AI/DVR, Notifications, Jobs, Integrations.

You own asynchronous infrastructure.

Your work lives in:

```text
workers/notification-worker
workers/lead-sync-worker
workers/jobs-worker
workers/payroll-worker
apps/ai-dvr
```

---

## Dependency Rule

You may start immediately with:
- worker skeleton
- health checks
- RabbitMQ abstraction
- logging
- AI health endpoint

Real event processing depends on:
- Team 1 event names
- Team 2 lead claim/deal/commission events

---

## Master Goal

Build:

```text
Notification worker
Lead sync worker
Jobs worker
Claim expiry cron
Subscription expiry cron
Document expiry alerts
Domain verification job
Saved search alerts
AI/DVR FastAPI service
Face matching later
YOLO detection later
```

---

## Required Status File

After every Codex task, update:

```text
workers/TEAM6_WORKERS_AI_STATUS.md
```

Format:

```md
# TEAM6_WORKERS_AI_STATUS.md

## Current Slice
...

## Percentage Completed
...

## Workers Created
...

## Queues Added
...

## Jobs Added
...

## AI Endpoints Added
...

## Event Names Supported
...

## Manual Tests
...

## Missing API Dependencies
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
- worker skeletons
- RabbitMQ config
- env config
- health checks
- FastAPI health

### Slice 2 — 40%
Focus:
- notification worker base
- email/push handler placeholders
- templates

### Slice 3 — 60%
Focus:
- verification notifications
- document expiry
- subscription expiry

### Slice 4 — 80%
Focus:
- claim expiry
- lead sync worker base
- Meta/TikTok/Google handler skeletons

### Slice 5 — 100%
Focus:
- AI/DVR face/person placeholders
- final integrations
- retries
- dead-letter queues
- monitoring

---

## First Codex Prompt Template

```text
You are Codex working on POPWAM Team 6 Workers + AI/DVR.

Read:
- popwam-revised-marketplace-plan.md
- 06-team6-workers-ai-integrations-rules.md
- current folder tree

Task: Implement Slice 1 only, approximately 20% of Team 6 scope.

Scope:
1. Inspect workers and apps/ai-dvr.
2. Create worker base structure if missing:
   - notification-worker
   - lead-sync-worker
   - jobs-worker
3. Add shared RabbitMQ config abstraction or placeholder.
4. Add health command/endpoint for each worker if possible.
5. Setup apps/ai-dvr FastAPI app:
   - GET /health
   - app/core/config.py
   - app/api/routes/health.py
6. Do not implement real email provider yet.
7. Do not implement real Meta/TikTok sync yet.
8. Do not implement face matching yet.
9. Do not put business decisions inside workers.

Required output:
- Update workers/TEAM6_WORKERS_AI_STATUS.md.
- Report files created/modified.
- Report env vars required.
- Report how to run workers/AI service.

Manual tests:
- notification worker starts or logs health.
- jobs worker starts or logs health.
- ai-dvr GET /health returns 200.
```

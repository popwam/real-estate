# Worker Queue and Polling Plan

## Scope

This plan describes how Team 6 workers can consume future notification events without adding production queue topology in the current slice.

Workers continue to execute asynchronous tasks only. Business decisions, authorization, event creation, and domain mutations stay in `apps/api`.

## NotificationEvent Row Consumption

When `apps/api` adds a durable `NotificationEvent` table or equivalent outbox, the notification worker should consume it with an outbox polling loop:

- Query only pending rows ordered by `occurredAt` or creation time.
- Claim rows atomically with a status transition such as `PENDING` to `PROCESSING`.
- Dispatch through the existing notification dispatcher.
- Mark rows `DELIVERED` only after all required channel attempts finish.
- Record failed attempts with attempt count, last error, and next retry time.
- Move exhausted rows to a dead-letter state instead of deleting them.
- Keep event payloads as envelopes matching `apps/api/EVENT_CONTRACTS.md`.

The worker should not infer approvals, reject requests, release claims, or mutate marketplace records. It should only deliver notifications for events already emitted by the API.

## RabbitMQ Enablement

RabbitMQ can be enabled later by replacing the placeholder client in `workers/_shared/rabbitmq.js` with a real adapter.

Suggested future topology:

- Exchange: `popwam.events`
- Queue: `notifications`
- Routing key pattern: `notification.*` or direct event names
- Dead-letter exchange: `popwam.events.dlx`
- Dead-letter queue: `notifications.dead`

The current `RABBITMQ_ENABLED`, `RABBITMQ_URL`, and `RABBITMQ_EXCHANGE` environment variables are already present as placeholders.

## Recommended Rollout

1. Add API-side transactional outbox writes.
2. Add read-only worker DB access or a narrow API polling endpoint.
3. Implement polling with small batches and idempotent delivery records.
4. Enable RabbitMQ publish/consume only after the outbox path is stable.
5. Keep console providers as the local development default.

## Not Implemented Yet

- Real queue publishing.
- Real RabbitMQ consumer topology.
- Worker DB mutation.
- Provider integrations for email, push, or SMS.
- Deal, commission, payment, or settlement business logic.

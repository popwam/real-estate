# Team 6 Final Worker Handoff

## Current Scope

Workers are asynchronous delivery surfaces only. The notification worker can render and dispatch development console notifications for:

- Team 1 organization, user, and file events.
- Team 2 lead claim and reservation events.
- Team 2 deal room events.
- Team 2 deal, commission, and inventory sold events.

All providers are local console placeholders. No database mutation, production queue publishing, or real provider call is implemented.

## Production Requirements Still Missing

- API-side outbox or `NotificationEvent` writer.
- Recipient lookup contract from `apps/api`.
- Provider credentials and delivery contracts for email, push, and SMS.
- Final RabbitMQ versus polling decision.
- Monitoring, retry, idempotency, and dead-letter hardening.
- Operational dashboards and alerting for failed delivery volume.

## Safety Rules To Keep

- Workers must not approve deals, reject commissions, release claims, or mark inventory sold.
- Workers must not include sensitive deal terms, client private data, or commission amounts in notification bodies.
- Event payloads should remain envelopes from `apps/api`; workers should not infer missing business context.

## Future Integration Path

1. Add durable API-side event writes in the same transaction as business changes.
2. Add a narrow polling endpoint or safe worker database abstraction.
3. Preserve console providers as the local default.
4. Add production providers behind the existing dispatcher interface.
5. Enable RabbitMQ only after outbox delivery semantics and retries are proven.

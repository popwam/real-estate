# POPWAM Transformation Backlog

الهدف: الانتقال من Prototype واسع إلى Paid Pilot منضبط، ثم Production. التقديرات نسبية وليست وعوداً زمنية قبل sizing جماعي.

## Wave 0 — Containment (P0، قبل أي مستخدم حقيقي)

| # | Epic | النتائج المقبولة | الاعتماد |
|---:|---|---|---|
| 1 | RBAC emergency fix | C-01 regression passes؛ scan/remediate invalid platform roles | لا شيء |
| 2 | Reservation invariant | active hold واحد في DB واختبار concurrency | migration + PostgreSQL test env |
| 3 | Lead ingestion truthfulness | لا mock success في prod؛ retries/alerts/idempotency | worker/outbox decision |
| 4 | Deal SoD | creator ≠ approver؛ state transition audited atomically | policy model |
| 5 | Safe release baseline | CI للـlint/type/unit/build/audit وdisposable DB | CI runner/secrets |

## Wave 1 — Trust Foundation (P0/P1)

| # | Epic | المخرجات |
|---:|---|---|
| 6 | Authorization v2 | Membership، multi-role، DataScope، ApprovalLimit، deny-by-default |
| 7 | Web/API security | HttpOnly auth، CSP/Helmet، validation، rate limits، MFA للأدوار الحساسة |
| 8 | File security | quarantine، AV/CDR، classification، scoped download، retention |
| 9 | Privacy program | Consent Ledger، legal pages، CMP، DSAR/delete/retention jobs |
| 10 | Audit/outbox | structured immutable audit + transactional outbox + correlation IDs |
| 11 | Production operations | logs/metrics/traces، alerts، SLOs، incident/rollback/backup restore |

## Wave 2 — Transaction & Revenue Core (P1)

| # | Epic | المخرجات |
|---:|---|---|
| 12 | Canonical property model | Asset/Unit identity واحدة وmigration/compatibility adapters |
| 13 | Contract engine | versioned contract، parties، approvals، signatures/evidence |
| 14 | Payments & collections | schedules، installments، attempts، receipts، reconciliation |
| 15 | Invoice/refund/chargeback | tax-aware invoices، refunds، dispute lifecycle |
| 16 | Commission settlement | obligation → approval → payout → reconciliation |
| 17 | SaaS Billing | checkout، subscription lifecycle، invoices، webhooks، dunning، entitlements |
| 18 | CRM-to-close workflow | lead→claim→reservation→deal→contract traced end-to-end |

## Wave 3 — Scale & Differentiation (P2)

| # | Epic | المخرجات |
|---:|---|---|
| 19 | Reliable workers/notifications | broker، retry/backoff، DLQ، provider adapters، delivery receipts |
| 20 | Imports at scale | async/idempotent jobs، validation reports، resumability/rollback |
| 21 | Analytics economics | funnel، cohort، CAC/LTV، revenue recognition، attribution with consent |
| 22 | Partner/platform ecosystem | scoped APIs، webhooks، keys، quotas، developer portal |
| 23 | Localization/accessibility | AR/EN/FR completeness، RTL/LTR، WCAG testing |
| 24 | Optional verticals | HR/attendance، resident access، ads، cameras بعد إثبات نواة الإيراد |

## أول 10 قصص قابلة للتنفيذ

1. كـSecurity owner، امنع `platform_*` في create/update user ما لم تكن المؤسسة Platform والفاعل مخولاً.
2. أضف migration تمنع أكثر من active hold للوحدة واختبار 50 موافقة متزامنة.
3. اجعل Public production data mode `api` إلزامياً وارفع خطأ قابلاً للقياس عند الفشل.
4. أضف Deal statuses: Draft → Submitted → Approved → Contracted → Sold/Cancelled.
5. أضف قاعدة `approverId != creatorId` واختبار negative.
6. أنشئ PostgreSQL disposable في CI وطبق migrations من الصفر لكل PR.
7. أضف controller inventory test يفشل إذا غابت authorization metadata/policy.
8. انقل refresh token إلى HttpOnly cookie وطبق rotation/CSRF tests.
9. امنع tracking scripts حتى consent purpose-specific مثبت.
10. أنشئ outbox داخل نفس transaction للحجز/الصفقة/audit/notifications.

### تفاصيل القصص وفق قالب التنفيذ

| Epic | Story | Problem | Acceptance Criteria | Dependencies | Risk | Priority | Complexity | Required Roles | Release Gate |
|---|---|---|---|---|---|---|---|---|---|
| Identity containment | منع platform role escalation | C-01 | رفض كل non-platform assignment + data scan + E2E | RBAC/org type | Critical | P0 | M | Backend، Security، QA | Alpha |
| Reservation integrity | active hold atomic | سباق double booking | نجاح طلب واحد فقط تحت concurrency | DB migration | High | P0 | M | Backend، DBA، QA | Alpha |
| Lead reliability | truthful durable intake | false success | production لا يستخدم mock؛ durable ack/alert | outbox/worker | High | P0 | M | Web، Backend، SRE | Alpha |
| Deal governance | staged two-person approval | self-approval | creator≠approver وtransitions/audit atomic | Authorization v2 | High | P0 | L | Domain، Backend، Risk، QA | Design Pilot |
| Release foundation | disposable CI pipeline | لا release evidence | lint/type/unit/E2E/migration/audit gates | CI secrets | High | P0 | L | Platform، QA، Security | Alpha |
| Authorization v2 | memberships/scopes/limits | enterprise authorization missing | multi-org/multi-role + scopes + limits matrix | data migration | High | P0 | XL | Architect، Backend، DBA، Security | Design Pilot |
| Privacy | consent operations | tracking قبل consent | purpose/version/revoke + CMP + legal pages | Legal/Growth | High | P0 | L | Privacy، Web، Backend | Design Pilot |
| Transaction core | contract-to-receipt | no lead-to-cash | contract/schedule/payment/receipt/invoice/refund E2E | deal state machine | High | P1 | XL | Product، Finance، Backend، QA | Paid Pilot |
| Billing | subscription collection | plans بلا تحصيل | idempotent checkout/webhooks/invoices/dunning | transaction core/provider | High | P1 | XL | Billing، Finance، Backend، SRE | Paid Pilot |
| Operations | observable recoverable production | no SLO/restore/incident | dashboards/alerts/runbooks + restore drill | cloud/CI | High | P0 | XL | SRE، Security، DBA | Design Pilot |

## ما يؤجل عمداً

أي توسع جديد في AI-DVR أو Ads أو HR extended أو visual customization يؤجل إلى ما بعد Wave 2، إلا إذا كان عقد Pilot يدفع له مباشرة ولا يستهلك فريق النواة. السبب اقتصادي: هذه الوحدات لا تصلح فجوة التحصيل أو الثقة، وتزيد تكلفة التشغيل والدعم.

## مؤشرات التحول

- صفر cross-tenant authorization failures في continuous matrix tests.
- صفر duplicate active reservations تحت load test.
- 100% من leads لها durable acknowledgment، ولا silent success.
- 100% من sold deals لها approved contract وreconciled payment trail.
- أول invoice صحيحة قابلة للإعادة من ledger/provider evidence.
- restore drill ضمن RTO/RPO؛ alerts لها owner وrunbook.
- funnel من زيارة إلى إيراد موحد، مع consent وattribution قابلين للتدقيق.

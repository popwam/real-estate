# تدقيق نموذج البيانات

## الحكم

**42/100 — نموذج واسع لكنه غير محكوم بما يكفي للمعاملات المالية والعقارية الحرجة.** Prisma schema صالح ويضم 106 models، لكن الاتساع لا يعوض غياب constraints وlifecycles الأساسية.

## 1. خريطة المجالات

### ERD نصي للحالة الحالية

```text
Organization ──< User >── Role ──< RolePermission >── Permission
     │
     ├──< Project ──< ProjectPhase ──< InventoryUnit
     │                                  ├──< UnitAvailability
     │                                  ├──< ReservationRequest
     │                                  └──< DealRoom ──< Deal ──< CommissionEntry
     ├──< PublicLead ──(conversion)── CrmClient / CrmLead ──< LeadClaim
     ├──< OrganizationSubscription >── PlatformPlan
     └──< Compound ──< Building ──< Floor ──< Unit ──< ResidentAssignment

UploadedFile / AuditLog ترتبط بعدة مجالات عبر FK أو entity metadata متفاوتة.
لا رابط canonical إلزامي بين InventoryUnit وUnit.
```

| المجال | النماذج/البنية | الحكم |
|---|---|---|
| Identity/Organizations | User, Role, Permission, Organization, Subscription | واسع؛ membership أحادي وفجوات RBAC |
| Onboarding/KYB | applications, owners, documents, verification evidence | أساس جيد، يحتاج توحيداً وامتثالاً |
| Marketplace | Project, ProjectPhase, InventoryUnit, availability/access | مناسب للعرض والبيع الأولي |
| Property operations | Compound, Building, Floor, Unit, resident/access | نموذج ثانٍ غير مربوط canonically |
| Leads/CRM | PublicLead, CrmClient, CrmLead, claims, conversations | جيد كبداية، attribution/consent يحتاجان تقوية |
| Reservations/Deals | request, availability/hold, deal room, Deal | constraints وstate machine ناقصة |
| Commissions | entries/disputes | لا payout ledger/reconciliation |
| HR/Ops | employees, attendance, leave, recruitment وغيرها | غني لكنه يزيد السطح قبل تثبيت النواة |
| Accounting/Legal | سجلات خفيفة | لا double-entry ledger ولا contract engine |
| Ads/Cameras | نماذج feature-flagged | تجريبية/جزئية |

## 2. مشاكل الاتساق الحرجة

### 2.1 هوية الوحدة العقارية مزدوجة — H-13

`Project → ProjectPhase → InventoryUnit` يخدم marketplace/deals، بينما `Compound → Building → Floor → Unit` يخدم resident/QR/operations. لا canonical property/unit ID أو relation إلزامية بينهما. النتيجة المحتملة: حالة بيع مختلفة عن حالة السكن، imports مزدوجة، تقارير غير قابلة للمصالحة.

**القرار:** Rebuild canonical Asset/Unit identity، ثم adapters للـSalesInventory والـPropertyOperations.

### 2.2 الحجز النشط بلا invariant — H-01

- `UnitAvailability` لديه index على `(unitId, releasedAt)` وليس unique active hold (`schema.prisma:1849-1865`).
- `ReservationRequest` index فقط على project/unit/status (`schema.prisma:2039-2068`).
- service يفحص الحالة قبل transaction ثم يكتب دون compare-and-set (`reservation-requests.service.ts:168-228`).

**المطلوب:** partial unique index أو active reservation key منفصل، row lock/serializable أو conditional update، idempotency key واختبار تنافس.

### 2.3 Deal ليس workflow مالياً

`Deal` افتراضه/إنشاؤه SOLD ولا يرتبط بعقد أو دفعات أو receipt أو invoice. `PaymentPlan` يصف عرضاً تسويقياً فقط (`schema.prisma:1868-1889`). لا توجد models باسم Contract/Installment/Payment/Refund/Invoice/Chargeback.

### 2.4 Subscription بلا Billing

`PlatformPlan` و`OrganizationSubscription` يحفظان السعر والحدود والوحدات وautoRenew، لكن لا:

- provider customer/subscription IDs؛
- checkout session/payment method؛
- invoice/payment attempts؛
- webhook inbox/idempotency؛
- dunning/grace/suspension state machine؛
- proration/coupon/tax/usage ledger.

## 3. سلامة العلاقات والقيود

| الموضوع | الحالة | الإجراء |
|---|---|---|
| User organization/role | علاقة مباشرة مفردة | استبدالها تدريجياً بـMembership/Assignments |
| Inventory unit number | unique داخل project | Keep، ثم اربطه بالهوية canonical |
| Active reservation | غير فريد | P0 DB invariant |
| Public lead idempotency | logic-level | أضف unique key scoped وtransaction-safe upsert |
| Owner percentages | حقول موجودة | check مجموع النسب وقواعد beneficial ownership |
| Money | حقول متفرقة | Money value+currency policy وrounding موحد |
| Time zones | timestamps موجودة | سياسة UTC + business timezone وإثبات DST tests |
| Soft delete/retention | غير موحد | data classification + retention schedule |
| Audit FK/immutability | سجل عام مرن | append-only policy/hash/export/legal hold |
| Commission paid state | status فقط | paidAt/paymentReference/invoice/reconciliation |

## 4. migrations

- 13 migration directories موجودة.
- static scan لم يجد أوامر destructive صريحة مثل `DROP TABLE`/`DROP COLUMN`/`TRUNCATE`.
- لا migration tests، shadow production sample، rollback/forward-fix runbook أو rehearsal مثبت.
- لم تُطبق migrations أثناء التدقيق لأن DB disposable غير متاحة.
- `IMPLEMENTATION_NOTES.md` يشير إلى أن التطبيق/النشر الفعليين لم يُثبتا.

## 5. الخصوصية والاحتفاظ

PublicLead يحمل consent boolean وconsentAt فقط؛ لا purpose/version/source/revokedAt/proof. بيانات الزوار تشمل session/page/search/filter/scroll/time، ولا توجد جداول retention jobs أو deletion requests أو legal holds مثبتة. HR/live-photo/device signals ترفع حساسية البيانات وتحتاج DPIA وسياسات وصول واحتفاظ منفصلة.

## 6. النموذج المالي الأدنى المقترح

```text
Deal
 ├─ Contract (version, parties, signatures, effectiveAt)
 ├─ PaymentSchedule
 │   └─ Installment (due, amount, currency, status)
 ├─ PaymentAttempt → Payment → Receipt
 ├─ Invoice → InvoiceLine → Tax
 ├─ Refund / Chargeback
 └─ CommissionObligation → Payout → Reconciliation
```

يجب أن يرافقه immutable financial journal أو تكامل محاسبي قابل للمصالحة، وidempotent webhook inbox/outbox.

## 7. القرار

- **Keep:** PostgreSQL/Prisma، Project/Phase/Inventory foundation، CRM identity/hash، onboarding evidence.
- **Refactor:** reservations، deals، commissions، public lead keys، audit metadata، owner constraints.
- **Rebuild:** canonical unit، memberships/scopes، contract/payment/billing/ledger، consent/retention.
- **Replace:** status-only financial semantics وأي uniqueness معتمدة على service checks وحدها.

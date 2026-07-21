# POPWAM Feature Gap Matrix

## مصفوفة القرار المطلوبة

| Domain | Feature | Required Behavior | Current Status | Evidence | Risk | Dependencies | Recommended Action | Priority | Estimated Complexity |
|---|---|---|---|---|---|---|---|---|---|
| Identity | Platform role assignment | platform roles داخل Platform فقط وبصلاحية مستقلة | Insecure | `users.service.ts:240-291` | Critical cross-tenant | RBAC seed، org type | allow-list + immutable roles + E2E | P0 | M |
| Identity | Membership/scopes | multi-org/multi-role/scoped/temporary/limits | Missing | `schema.prisma:1433-1450` | High | data migration | Authorization v2 | P0 | XL |
| Marketplace | Active reservation | hold واحد atomic لكل unit | Insecure | `reservation-requests.service.ts:168-228` | High | PostgreSQL migration | unique invariant + conditional transition | P0 | M |
| Growth | Lead ingestion | durable truthful acknowledgment | Mocked in fallback | `public-data.ts:220-239` | High revenue loss | worker/outbox | disable hybrid prod + durable queue | P0 | M |
| Deals | Approval | creator ≠ approver، staged states | Insecure | `deals.service.ts:30-131` | High fraud/error | policy/audit | state machine + SoD | P0 | L |
| Transactions | Contract | versioned parties/signatures/evidence | Missing | Prisma scan | High | deal state machine | build contract engine | P1 | XL |
| Finance | Payment/invoice/refund | idempotent/reconciled/tax-aware lifecycle | Missing | Prisma scan | High | contract/provider | build financial core | P1 | XL |
| SaaS | Billing | checkout/webhooks/dunning/renewal/invoices | Backend data only | Plan/Subscription models | High | finance/provider | build billing domain | P1 | XL |
| Privacy | Consent | purpose/version/proof/revocation/retention | Insecure/Partial | tracking files؛ PublicLead consent | High legal/trust | legal/CMP | Consent Ledger + gate | P0 | L |
| Security | Browser sessions | script-inaccessible refresh session | Insecure | `admin-web/src/lib/auth.ts` | High | auth API | HttpOnly cookie/BFF | P0 | L |
| Files | Secure upload | quarantine/scan/release/scoped access | Partial | files/onboarding services | High | AV/storage | malware pipeline | P1 | L |
| Platform | Jobs/notifications | durable broker/retries/DLQ/providers | Mocked | `workers/_shared/rabbitmq.js` | High | infra/providers | replace placeholders | P1 | XL |
| Operations | Observability/DR | metrics/traces/alerts/SLO/restore | Missing/Unknown | repository scan | High | cloud/SRE | implement and drill | P0 | XL |
| Property | Canonical unit | sales/operations share one identity | Missing | dual Prisma hierarchies | High | migration | canonical model + adapters | P1 | XL |
| Quality | Release pipeline | gated CI، disposable DB، security/recovery tests | Missing | no `.github` workflows | High | CI secrets | implement gates | P0 | L |

الحالات: **Implemented** مكتمل وقابل للإثبات، **Partial** موجود غير مكتمل، **Mocked** وهمي/placeholder، **Missing** غير موجود، **Not Verified** لا يمكن إثباته بأمان.

| المجال | الحالة | الجاهزية | الأدلة المختصرة | الفجوة/القرار |
|---|---|---:|---|---|
| Authentication: login/refresh/logout | Implemented | 70% | `apps/api/src/modules/auth/auth.service.ts`; refresh rotation/revocation | hardening وMFA/lockout مطلوبان |
| Company self-registration | Partial | 30% | `auth.service.ts:39-114` | ينشئ org/user بلا OTP/KYB/agreement |
| Document-first onboarding | Partial | 60% | `platform-onboarding.controller.ts:133-231` | داخلي بصلاحيات منصة، لا self-service lifecycle كامل |
| Organization types | Partial | 45% | `schema.prisma:9-14,3629-3652` | dynamic type يجاور legacy enum الإلزامي |
| Owners/ownership documents | Partial | 60% | Owner/onboarding models في Prisma | لا beneficial-owner/bank/license verification كاملة |
| RBAC permission catalog | Implemented | 75% | `rbac.seed.ts`؛ 23 roles/239 permissions | vocabulary قوي |
| Tenant authorization | Partial | 20% | `organization-scope.ts`; `users.service.ts:240-291` | C-01 وثقة في اسم الدور |
| Multi-membership/multi-role | Missing | 0% | `schema.prisma:1433-1450` | User يحمل organizationId وroleId منفردين |
| Data scopes/approval limits | Missing | 0% | لا models مطابقة | مطلوبة للمشروع/الفرع/الدولة/القيمة |
| Projects/phases/inventory | Partial | 65% | Project/ProjectPhase/InventoryUnit | لا price history أو canonical property identity |
| Broker authorization/access | Partial | 65% | marketplace services/schema | قواعد موجودة وتحتاج E2E production-like |
| Public catalog/search | Partial | 60% | public API/web routes | hybrid mock افتراضي ومحتوى مختلط اللغة |
| Lead capture | Partial | 55% | `public.service.ts:238-461` | spam/rate limit جيدة؛ لا OTP وDB uniqueness |
| CRM conversion | Partial | 60% | `crm-conversion.service.ts:20-213` | لا ينتج claim/reservation/deal/commission |
| Lead claims/routing | Partial | 40% | claim models/services | expiry/reassignment worker placeholder |
| Conversations/chat/share | Partial | 50% | conversations/CRM/public share modules | consent/retention وdelivery operations ناقصة |
| Reservation requests | Partial | 35% | `reservation-requests.service.ts:168-228` | race وغياب active-hold uniqueness |
| Deal rooms | Partial | 50% | deal-room modules/models | لا contract/escrow/payment integration |
| Deals | Partial | 25% | `deals.service.ts:30-172` | SOLD مباشرة وcreator=approver |
| Commissions | Partial | 35% | CommissionEntry/Dispute models | لا payout reference/paidAt/invoice/accounting reconciliation |
| Contracts/e-signatures | Missing | 0% | لا Contract model/engine | Rebuild |
| Installments/payments/receipts | Missing | 0% | `PaymentPlan` marketing فقط | Rebuild |
| Invoices/refunds/chargebacks | Missing | 0% | لا models/services | Rebuild |
| SaaS billing | Mocked | 10% | PlatformPlan/OrganizationSubscription | بيانات بلا provider/checkout/webhooks |
| Subscription limits/entitlements | Partial | 35% | limits/modules في plan | enforcement/usage metering غير شامل |
| Files/documents | Partial | 55% | files module/storage abstractions | لا AV scan أو retention/legal hold |
| Import/export | Partial | 60% | preview/commit + عدة domains | async jobs/idempotency/rollback ناقصة |
| Audit log | Partial | 45% | `audit-logs.service.ts:9-29`; model `1568-1585` | لا before/after/reason/immutability/query governance |
| Consent/privacy | Missing | 10% | PublicLead consent boolean فقط | لا ledger/purpose/version/revocation/pages |
| Analytics/visitor tracking | Partial | 25% | public tracking components | يعمل قبل consent |
| Notifications | Mocked | 15% | workers notification providers | console-only/retry/DLQ placeholders |
| Jobs/event bus | Mocked | 15% | `workers/_shared/rabbitmq.js:1-26` | لا broker connection مثبت |
| HR/attendance | Partial | 55% | HR modules + feature flags | privacy/integrations/operational tests ناقصة |
| Recruitment/careers | Partial | 45% | recruitment/job routes/modules | ليس production-verified |
| Resident/QR access | Partial | 40% | second property hierarchy | معزول عن sales inventory |
| Ads | Partial | 35% | ads modules/feature flag | measurement/billing/integration ناقصة |
| Camera/DVR | Mocked | 10% | `apps/ai-dvr/app/main.py` | health skeleton فقط |
| Custom domains/public sites | Partial | 40% | domains/public content modules | DNS/TLS lifecycle غير مثبت |
| Admin Web | Partial | 65% | build ناجح و123 route | token storage وغياب broad test coverage |
| Public Web | Partial | 45% | build ناجح | صفر automated tests وhybrid false-success |
| Mobile | Partial | 60% | analyze + 13 tests | backend E2E/real-device coverage غير مثبتة |
| Observability | Missing | 15% | health/request IDs فقط | لا metrics/traces/Sentry/alerts/SLO |
| CI/CD | Missing | 0% | لا workflows تحت `.github` | Release automation مفقودة |
| Backups/DR | Not Verified | 0% | لا runbooks/IaC في repo | يلزم restore drill وRPO/RTO |
| Production deployment | Not Verified | 10% | `IMPLEMENTATION_NOTES.md:395` | النشر والمigrations غير مثبتين |

## الرحلات التجارية الحرجة

| الرحلة | النتيجة | نقطة الانقطاع |
|---|---|---|
| Visit → Search → Lead | Partial | الفشل قد يتحول إلى نجاح demo وهمي |
| Lead → CRM → Claim | Partial | التحويل لا ينشئ claim تلقائياً؛ worker routing غير تشغيلي |
| Claim → Reservation | Partial | لا invariant DB يمنع الحجز المزدوج |
| Reservation → Deal | Partial | منطق الانتقال ليس workflow مالي محكوماً |
| Deal → Contract → Payment → Invoice | Missing | يتوقف عند Deal/Commission |
| Subscription → Checkout → Invoice → Renewal | Missing | PlatformPlan/Subscription records فقط |
| Organization signup → KYB → Approval → Go-live | Partial | مساران غير موحدين، والتسجيل المباشر أضعف من onboarding الداخلي |

## النتيجة

المنتج غني كـ **operational prototype** لكنه لا يملك بعد السلسلة المالية والقانونية والتشغيلية التي تحول نشاطاً عقارياً إلى business قابل للتحصيل والتوسع. الأولوية ليست إضافة شاشات جديدة، بل تثبيت authorization/invariants ثم إكمال revenue lifecycle.

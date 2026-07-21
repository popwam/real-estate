# سجل الدين التقني والنتائج

هذا هو السجل المرجعي للعدّ: **43 نتيجة = 1 Critical + 17 High + 18 Medium + 7 Low**.

## السجل التفصيلي للأولوية الحرجة والعالية

| ID | Module | Issue | Evidence | Severity | Business Impact | Security Impact | Recommended Fix | Dependency | Estimated Size |
|---|---|---|---|---|---|---|---|---|---|
| C-01 | Users/RBAC | platform role escalation | `users.service.ts:240-291` | Critical | فقد الثقة/العملاء | cross-tenant compromise | immutable scoped roles | org type/RBAC | M |
| H-01 | Reservations | non-atomic active hold | reservation service + schema | High | بيع/حجز مزدوج | integrity | DB unique + CAS/lock | migration | M |
| H-02 | Public Leads | silent mock success | `public-data.ts:220-239` | High | leads وإيراد مفقودان | monitoring deception | API-only prod + durable queue | outbox | M |
| H-03 | Deals | self approval + immediate SOLD | `deals.service.ts:30-131` | High | fraud/accounting error | privilege abuse | state machine + SoD | policy | L |
| H-04 | Billing | records بلا billing engine | Prisma plan/subscription | High | لا recurring collection | webhook/fraud controls absent | billing core | provider/finance | XL |
| H-05 | Privacy | pre-consent tracking | public tracking components | High | regulatory/trust | personal data misuse | CMP + ledger | legal/product | L |
| H-06 | Admin Auth | tokens in Web Storage | `admin-web/src/lib/auth.ts` | High | account takeover | XSS token theft | HttpOnly/BFF | auth API | L |
| H-07 | API | no global validation | `apps/api/src/main.ts` | High | corrupt inputs/support | mass assignment | validation whitelist | DTO cleanup | L |
| H-08 | Files | no AV/quarantine | files services | High | malicious documents | malware | scan/release pipeline | AV/storage | L |
| H-09 | Dependencies | 2 High advisories | `pnpm audit` | High | release block | DoS/CORS risk | upgrade/assess | upstreams | S |
| H-10 | Workers | mocks/placeholders | worker shared/jobs/providers | High | SLA/notifications fail | lost events | broker/outbox/DLQ | infra | XL |
| H-11 | Operations | no CI/telemetry/DR evidence | repo scan | High | outages/slow recovery | undetected attack | SRE baseline | cloud/CI | XL |
| H-12 | Onboarding | direct unverified org signup | `auth.service.ts:39-114` | High | fraudulent tenants | identity abuse | unified OTP/KYB | verification | L |
| H-13 | Property Data | dual unit identities | Prisma hierarchies | High | inconsistent inventory | integrity | canonical model | migration | XL |
| H-14 | Audit | non-atomic/incomplete evidence | audit/deal services | High | disputes غير قابلة للحسم | repudiation | structured outbox audit | transactions | L |
| H-15 | Authorization | no membership/scope/limits | User schema | High | enterprise fit gap | over-broad access | Authorization v2 | migration | XL |
| H-16 | Transactions | contracts/payments missing | Prisma scan | High | لا lead-to-cash | financial controls absent | transaction core | deal/billing | XL |
| H-17 | Release | deployed state unknown | implementation notes | High | unsafe launch | unknown exposure | environment inventory/rehearsal | SRE | L |

جداول Medium وLow أدناه هي امتداد السجل نفسه؛ Evidence وimpact موضحان في التقارير الموضوعية، ويجب نقلها إلى issue tracker مع الحقول ذاتها عند بدء التنفيذ.

## Critical (1)

| ID | النتيجة | المالك المقترح | الإجراء |
|---|---|---|---|
| C-01 | non-platform admin يستطيع إنشاء/تعيين platform role | Security/Identity | إغلاق فوري، data audit، regression E2E |

## High (17)

| ID | النتيجة | المالك المقترح | الإجراء |
|---|---|---|---|
| H-01 | سباق قبول الحجز ولا unique active hold | Marketplace/Data | DB invariant + atomic transition |
| H-02 | Public hybrid mode يعيد نجاح lead وهمياً | Growth/Public | fail visibly + durable ingestion |
| H-03 | Deal creator يوافق ويبيع في خطوة واحدة | Deals/Risk | SoD + approval state machine |
| H-04 | SaaS Billing غير موجود عملياً | Billing | provider-agnostic billing core |
| H-05 | Tracking قبل consent ولا legal pages | Privacy/Growth | CMP + Consent Ledger |
| H-06 | Admin tokens في Web Storage | Web/Security | HttpOnly cookie/BFF design |
| H-07 | لا global input validation | API Platform | validation/whitelist/limits |
| H-08 | لا malware scanning للملفات | Files/Security | quarantine + AV/CDR |
| H-09 | 2 High dependency advisories | Platform | upgrade/verify reachability |
| H-10 | workers/providers placeholders | Platform Ops | real broker/providers/outbox/DLQ |
| H-11 | لا CI/observability/alerts/backups runbooks | SRE | production operations baseline |
| H-12 | self-registration بلا OTP/KYB/agreement | Onboarding/Risk | unified verified onboarding |
| H-13 | ازدواج canonical property/unit model | Architecture/Data | canonical identity migration |
| H-14 | Audit غير atomic وغير كامل | Platform/Security | outbox + immutable structured audit |
| H-15 | لا multi-membership/role/scope/limit | Identity | rebuild authorization model |
| H-16 | لا contract/payment/invoice/refund lifecycle | Transactions/Finance | build transaction core |
| H-17 | production deployment/migration state غير مثبتة | Release/SRE | inventory + rehearsed deployment |

## Medium (18)

| ID | النتيجة | الإجراء |
|---|---|---|
| M-01 | Swagger دائم ولا security headers مثبتة | env gate + Helmet/CSP/HSTS policy |
| M-02 | لا MFA/lockout/device-session/SSO | identity hardening |
| M-03 | password policies غير متسقة | centralized policy |
| M-04 | rate limiter قد يرجع للذاكرة | Redis mandatory في production |
| M-05 | signed/scoped file access lifecycle غير مثبت | short-lived access controls |
| M-06 | no documented CSRF plan | threat-model cookies/BFF |
| M-07 | no retention/deletion/legal hold | privacy operations |
| M-08 | HR live-photo/device/location privacy | DPIA + minimization |
| M-09 | Public Web بلا automated tests | browser/component coverage |
| M-10 | API lint debt: 7,184 issues | baseline ثم ratchet |
| M-11 | full typecheck fails | fix spec type and gate |
| M-12 | no migration/rollback tests | disposable DB pipeline |
| M-13 | public lead uniqueness logic-only | DB idempotency constraint |
| M-14 | commissions بلا payout/reconciliation proof | financial references/state |
| M-15 | organization type legacy/dynamic split | unified type strategy |
| M-16 | localization mixed content/mobile clipping | locale QA/accessibility |
| M-17 | custom domain TLS/DNS lifecycle unverified | automated provisioning tests |
| M-18 | no API versioning/deprecation policy | version contract |

## Low (7)

| ID | النتيجة | الإجراء |
|---|---|---|
| L-01 | local ignored `.env` يحمل إعدادات حساسة | secrets manager/rotation hygiene |
| L-02 | root/API READMEs ما زالت boilerplate | operational/product docs |
| L-03 | public lint image warnings | use optimized image component |
| L-04 | roles module شبه فارغ | remove or define boundary |
| L-05 | TODO PostGIS في Project | decide spatial strategy |
| L-06 | naming/status conventions متفاوتة | domain glossary/lint rules |
| L-07 | screenshots اليدوية بلا regression baseline | visual test baseline |

## مبادئ إدارة السجل

- لا يغلق item بمجرد دمج الكود؛ يلزم test ودليل deployment/monitoring.
- Critical وHigh تمنع Production. C-01 وH-01/H-02/H-03 تمنع أي Pilot ببيانات حقيقية.
- لكل استثناء: owner، rationale، compensating control، expiry date.
- يعاد تقييم الخطورة بعد threat model واختبارات integration، لا بالتقدير فقط.

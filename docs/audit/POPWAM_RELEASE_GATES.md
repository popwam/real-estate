# بوابات إصدار POPWAM

لا يعتمد الإصدار على اكتمال features فقط. كل بوابة لها دليل قابل للإعادة، ومالك، وتاريخ.

## خريطة المراحل الرسمية

| المرحلة | Functional Gate | Security Gate | Data Gate | Testing Gate | Operational Gate | Legal Gate | Commercial Gate | Rollback Requirement | الحالة |
|---|---|---|---|---|---|---|---|---|---|
| Internal Development | builds ووحدات النواة | لا Critical معروف بلا containment | synthetic data | unit/type/lint baseline | local health | لا بيانات حقيقية | لا تحصيل | revert commit | Fail جزئي بسبب lint/C-01 |
| Alpha | الرحلات الأساسية بلا silent mocks | C-01/H-01/H-03 مغلقة | disposable migrated DB | API E2E + tenant negative | shared logs/alerts | internal terms/data rules | demo only | automated app rollback | Fail |
| Design Partner Pilot | lead→reservation محكومة | web/file/privacy baseline | tenant isolation + restore | browser/concurrency E2E | pilot SLO/on-call | DPA/consent/terms | contract pilot واضح | tested rollback + data forward-fix | Fail |
| Closed Beta | contract/payment minimum | pentest issues مغلقة | retention/DSAR | load/security/provider tests | 24/7 alert ownership | jurisdiction review | invoice/reconciliation | rehearsed rollback | Fail |
| Production Limited Release | complete paid lifecycle | صفر Critical/High مفتوح | canonical data + backup drill | release suite green | SLO/DR/status/incident | signed policies/vendor register | billing/dunning/support | regional/tenant rollback plan | Fail |
| General Availability | feature/support commitments | continuous security program | governed lifecycle | continuous quality gates | capacity/on-call/postmortem | full compliance operations | MRR/renewal economics proven | tested application/data recovery | Fail |

## Gate A — Internal Demo

**الحالة الحالية: Conditional Pass**

- بيانات demo معلّمة بوضوح ولا تختلط بالإنتاج.
- لا مدفوعات أو عقود أو معلومات هوية حقيقية.
- تعطيل outbound notifications/providers غير المكتملة.
- توثيق known issues للمشاهدين.

## Gate B — Design Partner Pilot

**الحالة الحالية: Fail**

يلزم جميع الآتي:

- C-01 مغلق مع E2E وفحص بيانات الأدوار.
- H-01 active reservation invariant واختبار concurrency.
- H-02 لا silent/mock lead success في أي production-like environment.
- H-03 فصل creator/approver.
- tenant negative E2E لجميع الموارد المشاركة في الرحلة.
- global validation، headers، dependency High remediation.
- consent/legal baseline ووقف tracking قبل consent.
- logs/alerts ودعم incident خلال ساعات Pilot المتفق عليها.
- backup وrestore test لبيانات Pilot.

## Gate C — Paid Pilot

**الحالة الحالية: Fail**

بالإضافة إلى Gate B:

- Contract + PaymentSchedule + Payment/Receipt + Invoice + Refund minimum viable lifecycle.
- reconciliation يومية وفصل صلاحيات مالي.
- SaaS billing أو عملية invoicing خارجية موثقة لا تدّعي automation غير موجود.
- file AV/quarantine وretention/DSAR operations.
- durable workers، retries، DLQ وdelivery receipts.
- browser/mobile end-to-end للرحلات المدفوعة.
- SLOs، on-call، escalation، rollback، incident simulation.
- اتفاق DPA/Privacy/Terms وsecurity review.

## Gate D — Production / General Availability

**الحالة الحالية: Fail**

| البوابة | معيار النجاح |
|---|---|
| Security | threat model، independent pentest، صفر Critical/High مفتوح بلا استثناء منتهي الصلاحية |
| Authorization | policy inventory 100%، multi-tenant matrix، break-glass audited |
| Data | canonical unit، constraints، migrations rehearsal، retention/legal hold |
| Finance | ledger/reconciliation، refunds، immutable evidence، SoD |
| Reliability | SLO/SLI، capacity/load، retry/idempotency، chaos/failure tests مختارة |
| Recovery | encrypted backups، restore drill، RPO/RTO محققان |
| Delivery | CI/CD، signed artifacts/SBOM، environment promotion، rollback tested |
| Privacy | consent purposes/version/revocation، DSAR، deletion، vendor register |
| Support | support tooling، audit search، incident/comms/status workflow |
| Product | no mock fallback، localization/accessibility acceptance، analytics صحيحة |

## قواعد الاستثناء

- لا استثناء لـC-01 أو فقدان lead بصمت أو الحجز المزدوج في Pilot حقيقي.
- أي استثناء آخر يحتاج owner، أثر، compensating control، approver مستقل، expiry لا يتجاوز إصدارين.
- لا تُقبل screenshots أو build logs وحدها كدليل لسلوك DB/concurrency/security.
- “Not Verified” تعامل كـFail عند اقترابها من بيانات أو أموال أو صلاحيات حقيقية.

## Evidence Pack لكل إصدار

1. commit/tag وSBOM.
2. CI results كاملة.
3. migration plan وbackup/restore evidence.
4. vulnerability report والاستثناءات.
5. tenant/security/concurrency test reports.
6. deployment diff وfeature flags.
7. dashboards/alerts/runbooks وروابط owners.
8. smoke tests وrollback decision window.
9. privacy/data-processing changes.
10. sign-off من Product، Engineering، Security، Finance/Ops حسب النطاق.

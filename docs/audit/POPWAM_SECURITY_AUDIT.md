# تدقيق الأمن والخصوصية

## الملخص

**28/100 — مخاطر غير مقبولة للإنتاج.** النتيجة الأشد هي C-01 في RBAC. لا توجد أسرار متتبعة مكشوفة في الفحص النصي، لكن ذلك لا يعوض ثغرات authorization وbrowser token security وprivacy.

## 1. سجل النتائج

| ID | الخطورة | النتيجة | المعالجة |
|---|---|---|---|
| C-01 | Critical | تصعيد `platform_*` من مؤسسة غير منصية | allow-list حسب org type + immutable system roles + endpoint permissions + regression scan |
| H-05 | High | tracking/ads قبل consent ولا privacy/terms/cookie pages | CMP/Consent Ledger وحجب scripts قبل الموافقة |
| H-06 | High | access وrefresh tokens في Web Storage | HttpOnly Secure SameSite cookies/BFF + CSP |
| H-07 | High | لا global validation/transform/whitelist | Global ValidationPipe + DTO constraints + reject unknown fields |
| H-08 | High | لا malware scan مثبت للملفات | quarantine → scan → release، file signatures وCDR للوثائق الحساسة |
| H-09 | High | 2 High dependency advisories | upgrade/pin وإضافة audit gate |
| H-11 | High | لا monitoring/alerts/incident evidence | central security telemetry + alert/runbook |
| H-14 | High | audit غير atomic/كامل | transactional outbox، actor/request/reason/before-after، append-only |
| M-01 | Medium | Swagger دائم ولا headers/CSP/HSTS مثبتة | production gate، Helmet/headers، allow-list CORS |
| M-02 | Medium | لا MFA/lockout/device sessions/SSO | MFA إلزامي للأدوار الحساسة وrisk controls |
| M-03 | Medium | password policy 8/10/12 حسب المسار | سياسة مركزية + breached password screening |
| M-04 | Medium | rate limit memory fallback غير ملائم لتعدد instances | Redis required في production + fail-safe policy |
| M-05 | Medium | لا signed download URLs lifecycle مثبت | short-lived scoped URLs أو authorized streaming مع limits |
| M-06 | Medium | لا CSRF strategy موثقة | عند الانتقال للcookies: anti-CSRF/origin checks |
| M-07 | Medium | لا retention/deletion/legal hold | privacy operations وscheduled deletion |
| M-08 | Medium | HR biometric-like/live photo/device signals | DPIA، least privilege، encryption، retention قصير |
| L-01 | Low | local `.env` حساس رغم أنه ignored | secrets manager، rotation، workstation hygiene |

## 2. الأسرار والاعتمادات

- `.env` المحلي يحتوي أسماء إعدادات حساسة (DB/JWT/R2/Cloudflare وغيرها) لكنه ignored وغير tracked.
- فحص الملفات المتتبعة لم يكشف قيمة secret مؤكدة. لم تُعرض أي قيمة في هذا التقرير.
- لا دليل repository على secret manager أو rotation schedule أو environment separation.
- يجب التعامل مع أي secret سبق مشاركته محلياً كقابل للدوران، وتفعيل secret scanning في CI.

## 3. Authentication

### نقاط قوة

- password hashing abstraction.
- refresh-token rotation/revocation.
- rate limiting لمسارات login/register/refresh.
- audit لنجاح وفشل login.
- Mobile secure storage.

### فجوات

- MFA/step-up غير موجودين للأدوار platform/finance/approval.
- لا account lockout/risk scoring/device/session UI.
- الحد الأدنى لكلمة المرور غير موحد: 8 في auth، 10 في invitation، 12 في مسارات أخرى.
- Admin Web يخزن refresh token في JavaScript-accessible storage.

## 4. Authorization وmulti-tenancy

التفاصيل في تقرير RBAC. Security gate لا ينجح قبل:

1. إصلاح C-01 وفحص كل البيانات الحالية بحثاً عن platform roles داخل non-platform organizations.
2. inventory آلي لكل controller/route وتأكيد deny-by-default.
3. negative cross-tenant E2E لكل resource حساس.
4. منع role strings الحرة وإدارة system roles من migrations فقط.

## 5. API وWeb hardening

- `apps/api/src/main.ts` لا يثبت Global ValidationPipe أو Helmet/security header policy.
- Swagger `/docs` ليس gated حسب البيئة.
- لا API version prefix موحد.
- Bearer headers تقلل CSRF الحالي، لكن Web Storage يرفع أثر XSS. الانتقال إلى cookies يتطلب CSRF protection.
- CORS/WAF/body limits/request timeouts يجب إثباتها في production config لا افتراضها.

## 6. الملفات

توجد checks للحجم وMIME/extension وبعض الصور/PDF، وهذا أفضل من الرفع الخام. لكن MIME قابل للتزوير ولا يوجد evidence لـAV/CDR/quarantine. المسار المطلوب:

`upload → private quarantine → signature/MIME inspection → AV/CDR → metadata classification → release → short-lived access`.

## 7. Supply chain

`pnpm audit --prod --audit-level high` سجل 11 advisory، منها High في multer وHono dependency path. يجب التحقق من reachable path، لكن بوابة الإصدار تبقى فاشلة إلى أن تُحدث التبعيات أو يوثق استثناء مؤقت بمالك وتاريخ انتهاء.

## 8. Auditability

AuditLog يسجل actor/action/entity/entityId/organization/metadata/time، لكن لا schema موحد لـbefore/after/reason/correlation، والخدمة لا تملأ ip/user-agent بصورة ثابتة. بعض الأحداث تُكتب بعد commit، فيمكن نجاح العملية وفشل audit. لا دليل tamper-evidence أو export/SIEM أو retention controls.

## 9. بوابة الأمن

**Fail** حتى تتحقق الشروط التالية: C-01 مغلق ومختبر؛ صفر High reachable advisories؛ tokens آمنة؛ consent gate؛ validation/headers؛ malware pipeline؛ tenant negative tests؛ security logging/alerts؛ threat model وpenetration test مستقل قبل Paid Pilot.

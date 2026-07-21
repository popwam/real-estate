# POPWAM Audit Evidence

## 1. سجل الأوامر والنتائج

| الأمر/الفحص | النتيجة | الملاحظة |
|---|---|---|
| `pnpm --filter api test --runInBand` | Pass | 33 suites، 164 passed، 1 skipped |
| `pnpm --filter api run prisma:validate` | Pass | Prisma schema valid |
| `pnpm --filter api build` | Pass | Nest production build |
| `pnpm --filter admin-web test` | Pass | 3 files، 9 tests |
| `pnpm --filter admin-web build` | Pass | Next production build؛ 123 generated routes |
| `pnpm --filter public-web build` | Pass | Next production build |
| Public ESLint | Pass with warnings | 3 warnings تخص `<img>` |
| `flutter analyze` | Pass | No issues found |
| `flutter test` | Pass | 13 tests |
| API ESLint read-only | Fail | 7,184: 6,909 errors، 275 warnings |
| `tsc -p apps/api/tsconfig.json --noEmit` | Fail | `files.service.spec.ts:143`، null لا يطابق undefined |
| `pnpm audit --prod --audit-level high` | Fail | 11 advisories: 2 High، 8 Moderate، 1 Low |
| API E2E | Not Run | لا توجد قاعدة disposable مؤكدة؛ منع أي mutation لقاعدة مُدارة |
| migrations apply/rollback | Not Run | نفس حد السلامة |
| `platform:doctor` | Not Run | قد يقرأ/يغير حالة خارجية؛ لا بيئة اختبار مؤكدة |

لم يُشغّل script lint الذي يحتوي `--fix` التزاماً بطلب عدم تعديل المنتج؛ استُخدم ESLint read-only.

## 2. أدلة النتائج الحرجة والعالية

| ID | الدليل المحلي | الاستنتاج |
|---|---|---|
| C-01 | `apps/api/src/modules/users/users.controller.ts:15-47`; `users.service.ts:18-31,240-291`; `organization-scope.ts:7-16`; `jwt-auth.guard.ts:52-70,134-136` | controller بلا PermissionsGuard؛ org manager يستطيع تمرير اسم role منصة، والخدمة تنشئه بصلاحيات seed، ثم guard يعامله platform |
| H-01 | `reservation-requests.service.ts:168-228`; `schema.prisma:1849-1865,2039-2068` | check خارج transaction ولا unique active hold |
| H-02 | `apps/public-web/src/lib/public-api.ts:341-348`; `public-data.ts:220-239` | hybrid mode الافتراضي يعيد mock success بعد API failure غير 429 |
| H-03 | `deals.service.ts:30-172`; `schema.prisma:2153-2196` | createFromDealRoom يضع SOLD وcreatedBy=approvedBy ويبيع الوحدة مباشرة |
| H-04 | `schema.prisma` models PlatformPlan/OrganizationSubscription | لا payment provider/checkout/invoice/webhook/dunning models أو integrations |
| H-05 | `apps/public-web/src/app/layout.tsx:43-45`; `tracking-placeholders.tsx:15-77`; `visitor-tracking.ts:36-106` | tracking عالمي بلا consent gate؛ لا legal pages |
| H-06 | `apps/admin-web/src/lib/auth.ts:6-7,31,56-57,124-125` | access/refresh tokens في localStorage/sessionStorage |
| H-07 | `apps/api/src/main.ts` | لا global ValidationPipe مثبت؛ DTO validation متفاوت |
| H-08 | `apps/api/src/modules/files` وonboarding upload paths | MIME/size checks موجودة، ولا AV/malware pipeline مثبت |
| H-09 | package audit output | High: multer advisory؛ Hono advisory ضمن dependency graph |
| H-10 | `workers/_shared/rabbitmq.js:1-26`; `workers/jobs-worker/src/jobs/claim-expiry.js:13-41`; notification providers | اتصال broker/mutations/delivery providers placeholders |
| H-11 | غياب `.github` workflows وغياب observability/runbook files | لا release/operations evidence |
| H-12 | `auth.service.ts:39-114`; `platform-onboarding.controller.ts:133-231` | تسجيل مباشر ضعيف مقابل onboarding داخلي محكوم بصلاحيات منصة |
| H-13 | Prisma: Project/ProjectPhase/InventoryUnit مقابل Compound/Building/Floor/Unit | هويتان للوحدة بلا canonical link |
| H-14 | `audit-logs.service.ts:9-29`; `deals.service.ts:133-172`; `schema.prisma:1568-1585` | audit metadata محدود وبعض الكتابات بعد commit |
| H-15 | `schema.prisma:1433-1450` | User يحمل org/role منفردين ولا membership/scope/limit entities |
| H-16 | Prisma model scan | لا Contract/Installment/Payment/Refund/Invoice models؛ PaymentPlan عرض تسويقي |
| H-17 | `IMPLEMENTATION_NOTES.md:395` وملاحظات migrations/deployment | لا دليل على تطبيق آخر migration أو نشر المنصة |

## 3. أدلة بنيوية وكمية

- تم عدّ 106 تعريفات `model` في `apps/api/prisma/schema.prisma`.
- seed المحمّل دون كتابة DB أعاد 23 base roles و239 base permissions.
- توزيع permissions البارز: `platform_owner=239`، `platform_admin=123`، `developer_owner=95`، `brokerage_owner=74`، `company_admin=83`، `client=3`.
- 13 migration directories؛ الفحص النصي لم يجد `DROP TABLE` أو `DROP COLUMN` أو `TRUNCATE`، لكنه لا يثبت rollback أو سلامة البيانات.
- test inventory: 33 API unit specs، 23 API E2E specs، 3 Admin test files، 0 Public test files، 2 Mobile test files، و0 worker/migration tests.

## 4. أدلة إيجابية

| الأصل | الدليل |
|---|---|
| Refresh token rotation/revocation | auth service وrefresh token persistence |
| Login audit | auth audit calls للنجاح والفشل |
| Lead safeguards | `public.service.ts:238-461,838-923` consent/rate/spam/idempotency logic |
| CRM scoped conversion | `crm-conversion.service.ts:20-213` org scope + phone hash |
| Seeded RBAC richness | `apps/api/src/modules/permissions/rbac.seed.ts` |
| Mobile secure tokens | Flutter secure storage usage |
| Feature isolation | feature flags لـ HR extended/ads/cameras/domains |
| Schema validity | Prisma validate pass |

## 5. حدود الإثبات

- لم تُعرض أو تُنسخ قيم `.env`. الملف المحلي يحوي أسماء متغيرات حساسة لكنه ignored وغير tracked؛ البحث في الملفات tracked لم يكشف secret مؤكداً.
- لا يمكن من repo وحده إثبات إعدادات cloud firewall، DB backups، CDN/WAF، TLS، secret manager، dashboards أو on-call.
- نتائج static search لا تعني غياباً مطلقاً في بنية خارجية، لذلك صُنفت هذه البنود **Not Verified** حيث يلزم.
- screenshots تحت `qa-screenshots/` استُخدمت كدليل UX مساعد، لا كبديل لاختبارات accessibility أو أجهزة حقيقية.

## 6. سلامة المستودع

لم يُعدّل كود المنتج. قبل التقارير كانت الملفات غير المتتبعة الموجودة مسبقاً:

- `POPWAM_Questionnaire_Rewritten_Recommended.xlsx`
- `POPWAM_Roles_Permissions.md`

حُفظت دون تعديل.

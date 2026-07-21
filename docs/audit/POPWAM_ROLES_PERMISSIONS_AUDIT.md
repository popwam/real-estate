# تدقيق الأدوار والصلاحيات والعزل المؤسسي

## الحكم

**30/100 — غير صالح للإنتاج.** قاموس الصلاحيات واسع، لكن authorization boundary قابل للاختراق بسبب الجمع بين controller غير محمي بـPermissionsGuard، وقبول اسم الدور من العميل، وإنشاء أدوار المنصة ديناميكياً، ثم اعتبار اسم الدور دليلاً على هوية Platform.

## 1. النطاق الحالي

- 23 base roles و239 base permissions في `apps/api/src/modules/permissions/rbac.seed.ts`.
- أكبر الأدوار: `platform_owner` 239، `platform_admin` 123، `developer_owner` 95، `company_admin` 83، `brokerage_owner` 74.
- `User` مرتبط مباشرة بـ`organizationId` و`roleId` فقط (`schema.prisma:1433-1450`).
- لا UserMembership أو UserRoleAssignment أو DataScope أو ApprovalLimit أو temporary delegation.
- `PermissionsGuard` يسمح بالمرور إذا لم توجد metadata؛ أي إن enforcement اختياري (`permissions.guard.ts:14-27`).

## 2. Critical C-01: تصعيد دور منصة

### مسار الاستغلال المثبت من الكود

1. `UsersController` يستخدم `JwtAuthGuard` فقط على create/update؛ لا `PermissionsGuard` (`users.controller.ts:15-47`).
2. DTO يسمح للعميل بإرسال `role` كنص (`create-user.dto.ts:19-23` و`update-user.dto.ts:13-14`).
3. مدير مؤسسة غير منصية يمر من فحص ownership في `users.service.ts:240-250`.
4. `ensureOrganizationRole` ينشئ الدور المطلوب ويمنحه `ROLE_PERMISSIONS[roleName]` (`users.service.ts:253-291`).
5. أسماء مثل `platform_admin` موجودة في mapping (`users.service.ts:18-31`) ولا يوجد منع حسب Organization.type.
6. `isPlatformUser` وJWT guard يثقان في prefix/name `platform_*` (`organization-scope.ts:7-16`; `jwt-auth.guard.ts:52-70,134-136`).

**الأثر:** cross-tenant read/write، تجاوز subscription/status checks، والوصول إلى وظائف المنصة.  
**الإصلاح الفوري:** allow-list حسب org type على الخادم، منع إنشاء system/platform roles خارج seed، حماية controller بصلاحيات صريحة، والتحقق داخل transaction. يجب تعطيل الحسابات/الأدوار المخالفة الموجودة بعد query آمن وإضافة E2E regression.

## 3. الفصل الوظيفي SoD

| العملية | الوضع | الخطر |
|---|---|---|
| User/role administration | Fail | نفس النطاق يستطيع اختيار اسم دور محظور |
| Deal creation/approval | Fail | `createdById` و`approvedById` يُسندان للشخص نفسه؛ status تصبح SOLD مباشرة |
| Commission approval | Partial | approve/reject موجودان، لكن payout/accounting proof غير موجود |
| Reservation approval | Partial | صلاحية موجودة، لكن invariant غير atomic |
| Onboarding approval | Partial | داخلي ومنظم نسبياً، لكنه غير موحد مع self-registration |
| Financial limits | Missing | لا ApprovalLimit حسب قيمة/عملة/نوع صفقة |
| Audit administration | Partial | permissions موجودة دون query governance/immutability كاملة |

## 4. عزل المؤسسات

### الموجود

- organization filters مستخدمة في marketplace/CRM/files ووحدات أخرى.
- helper مركزي `organization-scope.ts`.
- E2E files تحمل سيناريوهات cross-org.
- Platform users مصممون لرؤية نطاق أوسع.

### الفجوات

- الثقة باسم role بدلاً من membership/organization class الموثق.
- مستخدم واحد لا يستطيع عضويات متعددة بصورة صحيحة؛ الحل الحالي يدفع نحو نسخ مستخدمين أو توسيع غير آمن.
- لا نطاقات project/branch/community/country/record ownership.
- بعض controllers تعتمد على service checks فقط، وأخرى على permissions metadata؛ السياسة غير موحدة.
- role templates ديناميكية تسمح بحقل `isSystem` من العميل في provisioning path؛ يجب أن يكون server-controlled.
- لا deny-by-default policy يمكن تدقيقها مركزياً.

## 5. النموذج المستهدف

```text
User
 └─ Membership (organization, status, validFrom/To)
     ├─ RoleAssignment (role, validFrom/To, delegatedBy)
     ├─ DataScope (all | country | branch | project | community | own)
     └─ ApprovalLimit (action, currency, maxAmount, requiresSecondApprover)
```

المبادئ المطلوبة:

- Platform identity خاصية موثقة في membership/organization، لا اشتقاق من string.
- deny by default؛ كل endpoint يحمل action resource واضحاً.
- system roles immutable خارج migration/seed محكوم.
- policy evaluation واحدة في API، مع tenant predicate إلزامي على repository/query layer.
- اختبارات property-based/matrix لكل role × action × scope × org.
- break-glass role مؤقت، MFA، سبب، expiration، وتنبيه audit.

### مصفوفة أدوار مقترحة مختصرة

| Role family | View scope | Mutations | Approvals | قيود إلزامية |
|---|---|---|---|---|
| Platform Owner | Platform | governance فقط | تغييرات حرجة مزدوجة | MFA، break-glass، لا تشغيل يومي |
| Platform Operations | assigned countries/orgs | onboarding/support | لا compliance ذاتي | DataScope + audit |
| Verification Agent | assigned cases | checks/evidence | لا final approval | لا تعديل applicant data |
| Compliance Manager | assigned jurisdiction | restrictions/reject | KYB final | reason + second approval للحالات الحساسة |
| Security/Auditor | platform read | لا business mutation | لا | immutable export، masked PII |
| Organization Owner/Admin | own org | users/config | limits محلية | لا system/platform roles |
| Sales Manager | branch/team/projects | assign/reassign/discount request | ضمن limit | creator≠approver فوق الحد |
| Broker/Agent | own/team leads | activities/offers | لا final sale | record/project scope |
| Finance | own org financial | receipts/reconciliation | حسب limit | لا تعديل deal commercial terms |
| Contract/Legal | assigned deals | contract versions | legal approval | signature evidence |
| Facility/Community Manager | assigned communities | work/resident ops | cost limits | community scope |
| Vendor/Contractor | assigned RFQ/work order | own quote/progress | لا award/payment | لا رؤية عروض المنافسين |

## 6. مصفوفة الإصلاح

| الأولوية | الإجراء | معيار القبول |
|---|---|---|
| P0 | إغلاق C-01 وفحص البيانات الحالية | لا يمكن لأي non-platform actor إنشاء/تعيين `platform_*`؛ regression test ينجح |
| P0 | حماية UsersController بصلاحيات صريحة | create/update/delete deny by default |
| P0 | فصل Deal creator/approver | DB/service تمنع self-approval وتفرض مرحلتين |
| P1 | Membership/multi-role model | مستخدم واحد متعدد المؤسسات دون نسخ الهوية |
| P1 | DataScope + approval limits | اختبارات project/branch/country/value |
| P1 | توحيد authorization middleware | inventory لجميع endpoints بلا metadata |
| P2 | temporary delegation/break-glass | expiry + MFA + reason + immutable audit |
| P2 | role governance UI | diff/approval/versioning ومنع تعديل system roles |

## القرار المعماري

- **Keep:** permission vocabulary وseed كمرجع انتقالي.
- **Refactor:** controllers، DTOs، organization helpers، role templates.
- **Rebuild:** membership/assignment/scope/limit policy core.
- **Replace:** string-prefix platform detection وأي dynamic system-role creation.

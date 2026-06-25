# 1. صفحة الغلاف — Cover Page

<div align="center">

## POPWAM Real Estate Marketplace / CRM

# تقرير أهمية صفحات UI/UX وأولوية إعادة التصميم

### UI/UX Page Importance and Redesign Priority

**التاريخ:** 21 يونيو 2026  
**نوع التقرير:** تقرير أعمال قابل للطباعة — توثيق فقط

### النطاق

| التطبيق | المسار | العدد المعتمد |
|---|---|---:|
| Admin Web | `apps/admin-web` | 110 صفحات |
| Public Web | `apps/public-web` | 13 صفحة، إضافة إلى المسارات والخدمات العامة المهمة |
| Mobile App | `apps/mobile` | 29 شاشة أو حالة مرئية |

### الغرض من التقرير

- فهم كل الصفحات قبل إعادة التصميم.
- تحديد الصفحات المهمة للديمو.
- ترتيب أولويات UI/UX.
- منع إعادة تصميم صفحات كثيرة بدون خطة واضحة.

</div>

> هذا التقرير لا يغيّر الواجهة أو المسارات أو API أو Prisma. هو خريطة قرار قبل التنفيذ.

<div style="page-break-after: always;"></div>

# 2. الملخص التنفيذي — Executive Summary

## حجم المنصة الحالي

| الجزء | العدد | القراءة الإدارية |
|---|---:|---|
| Admin Web | 110 | أكبر جزء في المنصة، ويحتاج تقسيمًا حسب الدور والمهمة. |
| Public Web | 13 صفحة رئيسية | عدد أقل، لكنه أهم جزء للانطباع الأول وتحويل الزائر إلى عميل. |
| Mobile App | 29 شاشة/حالة | مهم لعمل الوسيط أثناء الحركة، لكنه يأتي بعد تثبيت اتجاه Admin وPublic. |
| **الإجمالي** | **152 صفحة/شاشة مرئية تقريبًا** | لا يجب إعادة تصميمها كلها دفعة واحدة. |

## لماذا يجب تنفيذ إعادة التصميم على مراحل؟

- الصفحات تشترك في الألوان والخطوط والأزرار والجداول والنماذج والتنقل.
- تعديل كل صفحة منفردة سيكرر العمل ويخلق اختلافات جديدة.
- إصلاح Design System والتنقل أولًا يجعل بقية الصفحات أسرع وأقل مخاطرة.
- الديمو يحتاج رحلة واضحة، وليس عرض كل الموديولات الموجودة.

## أهم مشاكل UI/UX الحالية

1. ألوان ثابتة كثيرة تتجاوز Design Tokens وتضعف Dark وEye Comfort.
2. تنقل Admin مزدحم، وبعض المستخدمين يرون صفحات لا يحتاجونها يوميًا.
3. بعض Dashboards تعرض `--` أو محتوى تجريبيًا بدل ملخص مفيد.
4. Public Web يحتوي على عبارات داخلية مثل mock وplaceholder، ويوجد تضارب بين تنقل السوق وتنقل موقع الشركة.
5. صفحة المشروع العامة لا تملك Sticky Contact CTA حقيقيًا رغم أهميتها للتحويل.
6. دعم العربية وRTL والفرنسية غير مكتمل في Web وMobile.
7. بعض شاشات Mobile ما زالت placeholders، مثل Map وتعديل Broker Profile.

## أفضل ترتيب للتنفيذ

1. **Design System:** الألوان، الخطوط، RTL، المسافات، الأزرار، النماذج والحالات.
2. **Shell and Navigation:** تنقل Admin، تنقل Public، Topbar، Mobile Nav، وRoute-aware layouts.
3. **Admin Critical Flows:** الدخول، Dashboards، Organizations، Projects، Inventory، CRM، Conversations، Stage 8.
4. **Public Conversion:** Home، Projects، Project Detail، Lead Form، Chat، ومواقع الشركات.
5. **Mobile:** Marketplace، CRM، Conversations، Claims، Reservations، Deals.
6. **Secondary/Internal:** Operations، HR، Accounting، Legal، Import/Export، Ads، Cameras.

> القرار الرئيسي: أصلح النظام والتنقل أولًا، ثم رحلة الديمو، ثم الصفحات الثانوية.

<div style="page-break-after: always;"></div>

# 3. دليل الأولويات — Priority Legend

## Demo Priority

| القيمة | المعنى |
|---|---|
| **Critical** | لازم يظهر أو يشتغل في الديمو. |
| **High** | مهم جدًا، لكنه ليس أول لقطة. |
| **Medium** | مفيد لو الوقت يسمح. |
| **Low** | لا يظهر في أول ديمو. |

## Redesign Priority

| القيمة | المعنى |
|---|---|
| **P0** | يتصلح أولًا. |
| **P1** | يتصلح بعد P0 مباشرة. |
| **P2** | مهم، لكن بعد الديمو الأساسي. |
| **P3** | مؤجل أو داخلي. |

## Business Importance

| القيمة | المعنى |
|---|---|
| **Core** | جزء أساسي من قيمة المنتج أو رحلة البيع. |
| **High** | مهم للتشغيل أو الثقة، لكنه ليس قلب كل رحلة. |
| **Supporting** | يدعم التشغيل أو الإعداد. |
| **Internal** | استخدام داخلي أو قليل التكرار. |

<div style="page-break-after: always;"></div>

# 4. جرد Admin Web القابل للطباعة

> تم إدراج جميع صفحات Admin Web وعددها 110. الغرض في كل صف جملة واحدة قصيرة.

## 4.1 تسجيل الدخول والدعوات

| # | Route | اسم الصفحة بالعربية | يستخدمها | الغرض | الأهمية | Demo | Redesign | ملاحظة قصيرة |
|---:|---|---|---|---|---|---|---|---|
| 1 | `/` | التحويل إلى الدخول | الجميع | يحوّل المستخدم إلى صفحة تسجيل الدخول. | Supporting | Low | P3 | توحيد الهوية فقط. |
| 2 | `/login` | تسجيل الدخول | كل المستخدمين | يدخل مستخدم المنصة أو الشركة أو الوسيط إلى حسابه. | Core | Critical | P0 | إضافة لغة وثيم وإظهار كلمة المرور. |
| 3 | `/invite/[token]` | قبول دعوة الشركة | المستخدم المدعو | يقبل الدعوة وينشئ بيانات حسابه. | Core | Critical | P0 | تحسين حالات الرابط وكلمة المرور والثقة. |

## 4.2 صفحات Platform Admin الأساسية

| # | Route | اسم الصفحة بالعربية | يستخدمها | الغرض | الأهمية | Demo | Redesign | ملاحظة قصيرة |
|---:|---|---|---|---|---|---|---|---|
| 4 | `/platform/dashboard` | لوحة تحكم المنصة | Platform Admin | تعرض أهم أرقام ومهام المنصة. | Core | Critical | P0 | استبدال `--` والبيانات التجريبية بملخص حقيقي. |
| 5 | `/platform/organizations` | قائمة الشركات | Platform Admin / Support | تعرض المطورين وشركات الوساطة وتسمح بإنشاء شركة. | Core | Critical | P0 | تحسين البحث والفلاتر وحالة المراجعة. |
| 6 | `/platform/organizations/[id]` | تفاصيل الشركة | Platform Admin / Compliance | تراجع بيانات الشركة ومستنداتها ودعواتها وحالتها. | Core | Critical | P0 | تحويلها إلى ملف مراجعة بخطوات واضحة. |
| 7 | `/platform/verifications` | قائمة التحققات | Platform Admin / Compliance | تعرض المستندات المنتظرة للمراجعة. | Core | Critical | P0 | إظهار عمر الطلب والخطر والمسؤول. |
| 8 | `/platform/verifications/[id]` | تفاصيل التحقق | Platform Admin / Compliance | تراجع مستندًا وتوافق أو ترفض أو تطلب معلومات. | Core | Critical | P0 | إبراز المستند ونتيجة القرار. |
| 9 | `/platform/domains` | مراجعة النطاقات | Platform Admin / Support | تراجع نطاقات الشركات وتوافق أو ترفض ربطها. | Core | High | P1 | إضافة دليل DNS وتحذيرات الأمان. |

## 4.3 صفحات الشركة المطورة العامة

| # | Route | اسم الصفحة بالعربية | يستخدمها | الغرض | الأهمية | Demo | Redesign | ملاحظة قصيرة |
|---:|---|---|---|---|---|---|---|---|
| 10 | `/developer/dashboard` | لوحة تحكم المطور | Developer Admin / Sales | تعرض ملخص المشاريع والمخزون والبيع. | Core | Critical | P0 | ربط أرقام حقيقية وإظهار المهام العاجلة. |
| 11 | `/developer/website-settings` | إعدادات موقع المطور | Developer Admin / Marketing | تضبط اسم وهوية وبيانات الموقع العام. | High | High | P1 | إضافة معاينة مباشرة وحالة النشر. |
| 12 | `/developer/domains` | نطاقات المطور | Developer Admin / IT | تضيف نطاق الشركة وتتابع التحقق منه. | High | Medium | P1 | جعل خطوات DNS أبسط وواضحة. |

## 4.4 صفحات شركة الوساطة العامة

| # | Route | اسم الصفحة بالعربية | يستخدمها | الغرض | الأهمية | Demo | Redesign | ملاحظة قصيرة |
|---:|---|---|---|---|---|---|---|---|
| 13 | `/brokerage/dashboard` | لوحة تحكم الوساطة | Brokerage Admin / Broker | تعرض ملخص السوق والعملاء والصفقات. | Core | Critical | P0 | إزالة placeholder وفصل Dashboard عن Marketplace. |
| 14 | `/brokerage/website-settings` | إعدادات موقع الوساطة | Brokerage Admin | تضبط هوية وبيانات موقع شركة الوساطة. | High | Medium | P1 | إضافة معاينة وهوية بصرية واضحة. |
| 15 | `/brokerage/domains` | نطاقات الوساطة | Brokerage Admin | تضيف نطاق الشركة وتتابع تحقق DNS. | High | Medium | P1 | عرض تقدم التحقق وحل المشاكل. |

## 4.5 CRM والمحادثات والعملاء القادمين من Public Web

| # | Route | اسم الصفحة بالعربية | يستخدمها | الغرض | الأهمية | Demo | Redesign | ملاحظة قصيرة |
|---:|---|---|---|---|---|---|---|---|
| 16 | `/platform/crm/leads` | عملاء CRM للمنصة | Platform Support | تعرض العملاء للمراجعة والدعم. | High | High | P1 | التركيز على الاستثناءات والخصوصية. |
| 17 | `/platform/crm/leads/[id]` | تفاصيل عميل للمنصة | Platform Support | تعرض بيانات العميل ونشاطه ومحادثاته. | High | High | P1 | إضافة سياق التدخل وسجل الوصول. |
| 18 | `/platform/crm/pipeline` | مراحل CRM للمنصة | Platform Admin / Support | تعرض العملاء حسب مراحل البيع. | Supporting | Medium | P2 | توضيح هل المنصة تدير المراحل أم تراقبها. |
| 19 | `/platform/crm/tasks` | مهام CRM للمنصة | Platform Support | تنشئ وتتابع مهام دعم مرتبطة بالعملاء. | Supporting | Medium | P2 | إضافة مسؤول وسياق واضح للمهمة. |
| 20 | `/platform/crm/activities` | نشاط CRM | Platform Auditor / Support | تعرض سجل تغييرات وأحداث CRM. | High | Medium | P2 | تحسين الفلاتر وربط كل حدث بصفحته. |
| 21 | `/platform/conversations` | محادثات المنصة | Platform Support | تعرض المحادثات التي يسمح للمنصة بمراجعتها. | High | High | P1 | إبراز الخصوصية وسبب الوصول. |
| 22 | `/platform/conversations/[id]` | تفاصيل محادثة للمنصة | Platform Support | تراجع المحادثة وترسل ردًا أو تغيّر حالتها. | High | High | P1 | فصل تدخل الدعم عن محادثة البيع. |
| 23 | `/developer/crm/leads` | عملاء المطور | Developer Sales | تعرض العملاء وتساعد فريق البيع على متابعتهم. | Core | Critical | P0 | إبراز المالك وآخر نشاط والخطوة التالية. |
| 24 | `/developer/crm/leads/[id]` | تفاصيل عميل المطور | Developer Sales | تجمع بيانات العميل والملاحظات والمهام والمحادثات. | Core | Critical | P0 | توحيد النشاط والإجراءات في Timeline واضح. |
| 25 | `/developer/crm/pipeline` | مراحل بيع المطور | Sales Manager | ترتب العملاء حسب مرحلة البيع. | Core | Critical | P0 | تحسين Kanban والموبايل ونقل العميل. |
| 26 | `/developer/crm/tasks` | مهام متابعة المطور | Developer Sales | تنشئ وتغلق مهام متابعة العملاء. | High | High | P1 | استخدام اختيار عميل بدل ID خام. |
| 27 | `/developer/conversations` | محادثات المطور | Developer Sales | تعرض محادثات العملاء ومواعيد آخر رد. | Core | Critical | P0 | إظهار غير المقروء وزمن الاستجابة. |
| 28 | `/developer/conversations/[id]` | تفاصيل محادثة المطور | Developer Sales | تعرض الرسائل وتسمح بالرد وتغيير الحالة. | Core | Critical | P0 | تصميمها كمساحة Chat مركزة. |
| 29 | `/developer/public-leads` | طلبات موقع المطور | Developer Sales / Admin | تعرض طلبات التواصل القادمة من الموقع العام. | Core | Critical | P0 | إظهار المصدر وUTM ونية العميل. |
| 30 | `/developer/public-leads/[id]` | تفاصيل طلب موقع المطور | Developer Sales / Admin | تراجع طلب الموقع وتحوله إلى مسار البيع. | Core | Critical | P0 | جمع سلوك الزائر وقرار التحويل. |
| 31 | `/brokerage/crm/leads` | عملاء شركة الوساطة | Broker / Sales | تعرض العملاء الذين يتابعهم فريق الوساطة. | Core | Critical | P0 | إبراز الملكية والخطوة اليومية التالية. |
| 32 | `/brokerage/crm/leads/[id]` | تفاصيل عميل الوساطة | Broker / Sales | تعرض العميل وتسمح بالمطالبة والمتابعة. | Core | Critical | P0 | وضع Claim وContact وTasks في ترتيب واضح. |
| 33 | `/brokerage/crm/marketplace-leads` | عملاء السوق المتاحون | Broker | تعرض العملاء المتاحين قبل مطالبة الوسيط بهم. | Core | Critical | P0 | توضيح الأهلية والوقت وزر Claim. |
| 34 | `/brokerage/crm/pipeline` | مراحل بيع الوساطة | Brokerage Sales | ترتب عملاء الوساطة حسب المرحلة. | Core | High | P0 | تحسين Kanban للموبايل واللمس. |
| 35 | `/brokerage/crm/tasks` | مهام الوسيط | Broker / Sales | تنشئ وتتابع مهام العملاء. | High | High | P1 | إظهار اليوم والمتأخر والقادم. |
| 36 | `/brokerage/conversations` | محادثات الوساطة | Broker / Sales | تعرض محادثات العملاء. | Core | Critical | P0 | إظهار غير المقروء وآخر رسالة. |
| 37 | `/brokerage/conversations/[id]` | تفاصيل محادثة الوساطة | Broker / Sales | تعرض الرسائل وتسمح بالرد والمشاركة. | Core | Critical | P0 | تثبيت Composer وتحسين شكل الرسائل. |
| 38 | `/brokerage/public-leads` | طلبات موقع الوساطة | Brokerage Sales / Admin | تعرض طلبات التواصل القادمة من موقع الشركة. | Core | Critical | P0 | تمييز الجديد والمكرر وSpam والتحويل. |
| 39 | `/brokerage/public-leads/[id]` | تفاصيل طلب موقع الوساطة | Brokerage Sales / Admin | تعرض مصدر الطلب وبياناته وإجراءات التحويل. | Core | Critical | P0 | إبراز consent وUTM والخطوة التالية. |

<div style="page-break-after: always;"></div>

## 4.6 المشاريع والمخزون وخطط السداد

| # | Route | اسم الصفحة بالعربية | يستخدمها | الغرض | الأهمية | Demo | Redesign | ملاحظة قصيرة |
|---:|---|---|---|---|---|---|---|---|
| 40 | `/developer/projects` | قائمة المشاريع | Developer Admin / Project Team | تعرض مشاريع الشركة وتفتح إدارتها. | Core | Critical | P0 | إضافة حالة جاهزية للنشر وعرض بصري أفضل. |
| 41 | `/developer/projects/new` | إنشاء مشروع | Developer Admin / Project Manager | تنشئ مشروعًا عقاريًا جديدًا. | Core | Critical | P0 | تحويل النموذج الطويل إلى خطوات. |
| 42 | `/developer/projects/[id]` | تفاصيل المشروع | Developer Admin / Project Manager | تعرض المشروع وتعدّل بياناته وصلاحيات بيعه. | Core | Critical | P0 | تقسيم المحتوى إلى Overview وTabs واضحة. |
| 43 | `/developer/projects/[id]/visibility` | ظهور المشروع | Developer Admin | تحدد من يستطيع رؤية المشروع. | Core | Critical | P0 | شرح أثر كل اختيار قبل الحفظ. |
| 44 | `/developer/projects/[id]/phases` | مراحل المشروع | Project Manager | تنشئ وتعدّل مراحل تسليم المشروع. | High | High | P1 | إضافة Timeline مرئي للمراحل. |
| 45 | `/developer/projects/[id]/inventory` | مخزون المشروع | Inventory / Sales Admin | تنشئ وحدات المشروع وتعرضها. | Core | Critical | P0 | إضافة فلاتر وBulk Actions وتحرير أسرع. |
| 46 | `/developer/projects/[id]/payment-plans` | خطط سداد المشروع | Sales / Accounting Admin | تنشئ خطط سداد للمشروع أو الوحدة. | Core | High | P1 | عرض توزيع النسب والتحقق من مجموعها. |
| 47 | `/developer/inventory` | كل الوحدات | Inventory / Sales Team | تعرض وتعدّل وحدات كل مشاريع الشركة. | Core | Critical | P0 | تحسين الكثافة والفلترة والموبايل. |

## 4.7 صفحات Stage 8 والحوكمة والصفقات

| # | Route | اسم الصفحة بالعربية | يستخدمها | الغرض | الأهمية | Demo | Redesign | ملاحظة قصيرة |
|---:|---|---|---|---|---|---|---|---|
| 48 | `/developer/agreements` | اتفاقيات الوسطاء | Developer Owner / Admin | تدير اتفاقيات المطور مع شركات الوساطة. | Core | High | P1 | عرض الأطراف والمدة والحالة كخطوات. |
| 49 | `/developer/broker-access` | صلاحيات وصول الوسطاء | Developer Admin / Sales Manager | تمنح أو تلغي وصول وسيط إلى مشروع. | Core | High | P1 | استخدام اختيار أسماء وتحذير واضح قبل الإلغاء. |
| 50 | `/developer/lead-claims` | تعارضات مطالبات المطور | Developer Sales Manager | تعرض تعارضات المطالبات على مشاريع المطور. | High | Medium | P1 | توضيح أن القائمة الحالية للتعارضات فقط. |
| 51 | `/developer/reservation-requests` | طلبات حجز المطور | Developer Sales / Inventory | تعرض طلبات الحجز وتسمح بالقبول أو الرفض. | Core | Critical | P0 | إظهار أثر الموافقة على حالة الوحدة. |
| 52 | `/developer/reservation-requests/[id]` | تفاصيل طلب حجز المطور | Developer Sales Manager | تراجع الطلب وتنشئ غرفة صفقة بعد الموافقة. | Core | Critical | P0 | عرض الرحلة كStepper والقرار بوضوح. |
| 53 | `/developer/deal-rooms` | غرف صفقات المطور | Developer Sales / Legal | تعرض غرف التفاوض الخاصة بالمشاريع. | Core | High | P1 | إظهار النشاط غير المقروء والمرحلة. |
| 54 | `/developer/deal-rooms/[id]` | تفاصيل غرفة صفقة المطور | Developer Sales / Legal | تدير المشاركين والرسائل وحالة التفاوض. | Core | High | P1 | تصميم Workspace برسائل وإجراءات ثابتة. |
| 55 | `/developer/deals` | صفقات المطور | Developer Sales / Management | تعرض الصفقات الناتجة من غرف التفاوض. | Core | High | P1 | إضافة إجماليات وحالة الموافقة. |
| 56 | `/developer/deals/[id]` | تفاصيل صفقة المطور | Developer Sales / Management | تعرض السعر والحالة والأطراف وإجراءات الصفقة. | Core | High | P1 | إبراز المال والموافقات وسجل القرار. |
| 57 | `/developer/commission-rules` | قواعد العمولات | Developer Owner / Admin | تنشئ قواعد حساب العمولة. | Core | High | P1 | إضافة مثال حساب وكشف تعارض القواعد. |
| 58 | `/developer/commissions` | عمولات المطور | Developer Finance / Admin | تعرض العمولات الناتجة من الصفقات. | Core | High | P1 | إضافة إجماليات وتجميع حسب الحالة. |
| 59 | `/developer/commissions/[id]` | تفاصيل عمولة المطور | Developer Finance / Admin | تعرض حساب العمولة وتسمح بالقرار حسب الصلاحية. | High | High | P1 | شرح مصدر الحساب والأدلة. |
| 60 | `/brokerage/lead-claims` | مطالبات عملاء الوساطة | Broker | تنشئ مطالبة وتعرض مطالبات الوسيط. | Core | High | P1 | بدء المطالبة من مشروع أو وحدة بدل IDs. |
| 61 | `/brokerage/lead-claims/[id]` | تفاصيل مطالبة الوسيط | Broker | تعرض المطالبة وتحررها أو تبدأ طلب حجز. | Core | High | P1 | إضافة عداد الانتهاء والأهلية. |
| 62 | `/brokerage/reservation-requests` | طلبات حجز الوساطة | Broker | تنشئ وتتابع طلبات الحجز المرسلة للمطور. | Core | High | P1 | إظهار الوحدة وشروط الحجز بوضوح. |
| 63 | `/brokerage/reservation-requests/[id]` | تفاصيل طلب حجز الوساطة | Broker | تعرض رد المطور وتسمح بإلغاء الطلب. | Core | High | P1 | إضافة Timeline وحل واضح للرفض. |
| 64 | `/brokerage/deal-rooms` | غرف صفقات الوساطة | Broker / Brokerage Admin | تعرض غرف التفاوض الخاصة بالوسيط. | Core | High | P1 | إظهار المرحلة والمشاركين وآخر نشاط. |
| 65 | `/brokerage/deal-rooms/[id]` | تفاصيل غرفة صفقة الوساطة | Broker / Brokerage Admin | تدير المشاركين والرسائل وحالة الغرفة. | Core | High | P1 | تثبيت الإجراءات وإظهار تقدم الصفقة. |
| 66 | `/brokerage/deals` | صفقات الوساطة | Broker / Brokerage Admin | تعرض صفقات الشركة والوسيط. | Core | High | P1 | تحسين عرض القيمة والحالة والفلاتر. |
| 67 | `/brokerage/deals/[id]` | تفاصيل صفقة الوساطة | Broker / Brokerage Admin | تعرض تفاصيل الصفقة وسجلها وإجراءاتها. | Core | High | P1 | إبراز مصدر الصفقة والموافقات. |
| 68 | `/brokerage/commissions` | عمولات الوساطة | Broker / Brokerage Admin | تعرض عمولات الشركة والوسطاء. | Core | High | P1 | تجميع مستحق ومقبول ومرفوض. |
| 69 | `/brokerage/commissions/[id]` | تفاصيل عمولة الوساطة | Broker / Brokerage Admin | تعرض حساب العمولة وحالتها. | High | High | P1 | شرح المبلغ والحالة وموعد الاستحقاق. |
| 70 | `/platform/lead-claim-conflicts` | تعارضات المطالبات | Platform Admin / Support | تحل تعارض أكثر من وسيط على نفس العميل. | Core | High | P1 | مقارنة المطالبات والأدلة جنبًا إلى جنب. |
| 71 | `/platform/deal-rooms` | غرف الصفقات للمنصة | Platform Admin / Support | تعرض غرف الصفقات التي تسمح الصلاحية بمراجعتها. | High | High | P1 | التركيز على المخاطر والاستثناءات. |
| 72 | `/platform/deal-rooms/[id]` | تفاصيل غرفة للمنصة | Platform Admin / Support | تراجع غرفة الصفقة ورسائلها ومشاركيها. | High | High | P1 | إظهار سبب الوصول وسجل التدخل. |
| 73 | `/platform/deals` | صفقات المنصة | Platform Admin / Finance | تعرض الصفقات على مستوى السوق. | High | High | P1 | إضافة فلاتر الشركات والمخاطر والمبالغ. |
| 74 | `/platform/deals/[id]` | تفاصيل صفقة للمنصة | Platform Admin / Finance | تراجع صفقة وإجراءاتها المسموحة. | High | High | P1 | توضيح صلاحيات المنصة وسبب القرار. |
| 75 | `/platform/commissions` | عمولات المنصة | Platform Admin / Finance | تعرض عمولات السوق للمراجعة. | High | High | P1 | إضافة إجماليات ونزاعات وطابور موافقة. |
| 76 | `/platform/commissions/[id]` | تفاصيل عمولة للمنصة | Platform Admin / Finance | تراجع العمولة وتوافق أو ترفض حسب الصلاحية. | High | High | P1 | إظهار القاعدة والأطراف وسبب القرار. |

<div style="page-break-after: always;"></div>

## 4.8 Operations / HR / Accounting / Legal / Ads / Cameras

| # | Route | اسم الصفحة بالعربية | يستخدمها | الغرض | الأهمية | Demo | Redesign | ملاحظة قصيرة |
|---:|---|---|---|---|---|---|---|---|
| 77 | `/developer/operations/overview` | ملخص عمليات المطور | Developer Owner / Admin | يجمع ملخص HR والحسابات والقانون والإعلانات والكاميرات. | High | Medium | P2 | إبراز الاستثناءات بدل روابط عامة فقط. |
| 78 | `/developer/hr/employees` | موظفو المطور | HR / Developer Admin | تنشئ وتعرض سجلات الموظفين. | Supporting | Low | P2 | تحسين الخصوصية والفلاتر وبيانات الموظف. |
| 79 | `/developer/hr/employees/[id]` | تفاصيل موظف | HR / Developer Admin | تعرض سجل موظف ونشاطه. | Supporting | Low | P2 | تقسيم البيانات الحساسة إلى أقسام. |
| 80 | `/developer/hr/departments` | أقسام الشركة | HR / Developer Admin | تنشئ وتعرض أقسام الشركة. | Supporting | Low | P2 | نقلها تحت إعدادات HR. |
| 81 | `/developer/hr/departments/[id]` | تفاصيل قسم | HR / Developer Admin | تعرض سجل قسم ونشاطه. | Supporting | Low | P3 | صفحة داخلية قليلة الاستخدام. |
| 82 | `/developer/hr/attendance` | حضور الموظفين | HR / Developer Admin | تسجل وتعرض الحضور الأساسي. | Supporting | Low | P2 | تحتاج عرض Calendar أو Shifts عند اكتمال المنتج. |
| 83 | `/developer/hr/attendance/[id]` | تفاصيل حضور | HR / Developer Admin | تعرض سجل حضور واحد ونشاطه. | Internal | Low | P3 | الوصول الأفضل من الموظف أو التقويم. |
| 84 | `/developer/accounting/transactions` | الحركات المالية | Accounting / Developer Admin | تسجل الإيرادات والمصروفات اليدوية. | High | Medium | P2 | توضيح العملة والفترة والمستندات. |
| 85 | `/developer/accounting/transactions/[id]` | تفاصيل حركة مالية | Accounting / Developer Admin | تعرض حركة مالية وسجل نشاطها. | High | Low | P2 | إضافة Audit وأدلة عند دعمها. |
| 86 | `/developer/accounting/summary` | ملخص الحسابات | Developer Owner / Accounting | تعرض الإيرادات والمصروفات والصافي. | High | Medium | P2 | استخدام KPIs مفهومة وفترة زمنية. |
| 87 | `/developer/accounting/categories` | تصنيفات الحسابات | Accounting / Developer Admin | تنشئ تصنيفات الإيراد والمصروف. | Supporting | Low | P3 | وضعها تحت إعدادات الحسابات. |
| 88 | `/developer/accounting/categories/[id]` | تفاصيل تصنيف مالي | Accounting / Developer Admin | تعرض التصنيف وسجل نشاطه. | Internal | Low | P3 | صفحة داخلية قليلة الاستخدام. |
| 89 | `/developer/legal/documents` | سجل المستندات القانونية | Legal / Developer Admin | تسجل بيانات المستندات القانونية. | Supporting | Low | P2 | توضيح أنه سجل بيانات وليس تخزينًا أو توقيعًا. |
| 90 | `/developer/legal/documents/[id]` | تفاصيل مستند قانوني | Legal / Developer Admin | تعرض بيانات المستند ونشاطه. | Supporting | Low | P3 | تأجيلها حتى وجود Workflow مستندات حقيقي. |
| 91 | `/developer/legal/cases` | القضايا القانونية | Legal / Developer Admin | تنشئ وتتابع القضايا الأساسية. | Supporting | Low | P2 | إضافة المسؤول والموعد والخطر والروابط. |
| 92 | `/developer/legal/cases/[id]` | تفاصيل قضية | Legal / Developer Admin | تعرض القضية وسجل نشاطها. | Supporting | Low | P3 | صفحة داخلية بعد الديمو. |
| 93 | `/developer/ads/campaigns` | خطط الحملات الإعلانية | Marketing | تسجل خطط الحملات بدون نشر لمزود خارجي. | Supporting | Low | P3 | إخفاؤها من الديمو الأول. |
| 94 | `/developer/ads/campaigns/[id]` | تفاصيل حملة إعلانية | Marketing | تعرض خطة حملة ونشاطها. | Internal | Low | P3 | لا تعرضها كتكامل إعلانات مكتمل. |
| 95 | `/developer/cameras/devices` | سجل أجهزة الكاميرا | Operations / Security | تسجل أجهزة الكاميرا بدون بث. | Supporting | Low | P3 | إخفاؤها من الديمو الأول. |
| 96 | `/developer/cameras/devices/[id]` | تفاصيل جهاز كاميرا | Operations / Security | تعرض بيانات الجهاز فقط. | Internal | Low | P3 | لا تعرضها كبث أو DVR أو AI. |
| 97 | `/platform/operations/overview` | ملخص عمليات المنصة | Platform Owner / Admin | تعرض ملخص أقسام التشغيل ونشاطها. | High | Medium | P2 | تحويلها إلى Exceptions وTrends. |
| 98 | `/platform/hr/overview` | موارد بشرية للمنصة | Platform HR / Admin | تعرض أساسيات سجلات الموظفين. | Internal | Low | P3 | وضعها تحت More وعدم إبرازها. |
| 99 | `/platform/accounting/overview` | حسابات المنصة | Platform Finance | تعرض ملخص الإيرادات والمصروفات. | High | Medium | P2 | عرض KPIs وفترة وعملة واضحة. |
| 100 | `/platform/legal/overview` | قانوني المنصة | Platform Legal | تعرض سجل المستندات القانونية. | Internal | Low | P3 | لا توحي برفع أو توقيع إلكتروني. |
| 101 | `/platform/ads/overview` | إعلانات المنصة | Platform Marketing | تعرض سجل خطط الحملات فقط. | Internal | Low | P3 | لا تعرضها كتكامل نشر. |
| 102 | `/platform/cameras/overview` | كاميرات المنصة | Platform Operations | تعرض سجل أجهزة الكاميرا فقط. | Internal | Low | P3 | لا تعرضها كبث أو DVR أو AI. |

## 4.9 Import / Export

| # | Route | اسم الصفحة بالعربية | يستخدمها | الغرض | الأهمية | Demo | Redesign | ملاحظة قصيرة |
|---:|---|---|---|---|---|---|---|---|
| 103 | `/developer/import-export` | معاينة الاستيراد | Developer Data / Admin | ترفع بيانات المشروع والمخزون لمراجعتها قبل الإدخال. | High | Medium | P2 | إضافة Mapping وتقدم واضح وتصحيح الأخطاء. |
| 104 | `/developer/import-export/jobs` | عمليات الاستيراد | Developer Data / Admin | تعرض عمليات الاستيراد السابقة وحالتها. | Supporting | Medium | P2 | إبراز عدد الأخطاء والخطوة التالية. |
| 105 | `/developer/import-export/jobs/[id]` | تفاصيل عملية استيراد | Developer Data / Admin | تعرض أخطاء الصفوف وتؤكد أو تلغي العملية. | High | Medium | P2 | تجميع الأخطاء وتوفير ملف تصحيح. |
| 106 | `/developer/import-export/export` | تصدير بيانات المطور | Developer Data / Admin | تصدّر المشاريع والمخزون والصفقات والعمولات. | Supporting | Low | P2 | عرض النطاق والصيغة والتقدم. |
| 107 | `/platform/import-export/jobs` | عمليات استيراد المنصة | Platform Admin / Support | تعرض عمليات الاستيراد على مستوى المنصة. | Supporting | Low | P2 | إظهار الشركة والمنفذ بوضوح. |
| 108 | `/platform/import-export/jobs/[id]` | تفاصيل استيراد للمنصة | Platform Admin / Support | تراجع عملية الاستيراد وتؤكد أو تلغي. | Supporting | Low | P2 | تأكيد النطاق قبل الإجراء. |
| 109 | `/platform/import-export/export` | تصدير بيانات المنصة | Platform Admin / Auditor | تصدّر البيانات المسموح بها حسب الصلاحية. | Supporting | Low | P2 | إظهار السبب والنطاق وسجل التدقيق. |
| 110 | `/brokerage/import-export/export` | تصدير بيانات الوساطة | Brokerage Admin | تصدّر بيانات حساب الوساطة المسموح بها. | Supporting | Low | P2 | إبقاؤها تحت More. |

<div style="page-break-after: always;"></div>
# 5. جرد Public Web القابل للطباعة

> العدد الأساسي 13 صفحة Route، ويضاف إليها SEO، Layout، التنقل، النماذج والتتبع لأنها تؤثر مباشرة على تجربة الزائر.

| # | Route / Surface | اسم الصفحة بالعربية | نوع الزائر | الغرض | الأهمية | Demo | Redesign | ملاحظة قصيرة |
|---:|---|---|---|---|---|---|---|---|
| 1 | `/` | الصفحة الرئيسية للسوق | زائر عام | تشرح قيمة POPWAM وتعرض مشاريع مميزة. | Core | Critical | P0 | إزالة كلام mock وplaceholder وبناء انطباع Premium. |
| 2 | `/projects` | قائمة المشاريع | مشتري / مستثمر | تعرض المشاريع وتفلترها حسب الموقع والنوع والسعر. | Core | Critical | P0 | إضافة بحث وترتيب وعدد نتائج وفلاتر Mobile. |
| 3 | `/projects/[slug]` | تفاصيل المشروع | مشتري / مستثمر | تعرض الصور والسعر والسداد والوحدات وطلب التواصل. | Core | Critical | P0 | إضافة Gallery وSticky CTA ومعلومات موثوقة. |
| 4 | `/developers/[slug]` | ملف المطور | مشتري / مستثمر | تعرض معلومات المطور ومشاريعه العامة. | High | High | P1 | إضافة Logo وContact CTA ومعالجة عدم وجود مشاريع. |
| 5 | `/brokerages/[slug]` | ملف شركة الوساطة | مشتري / بائع | تعرض تعريف الشركة ومناطق عملها. | High | Medium | P1 | إضافة قيمة واضحة وContact بدل placeholder. |
| 6 | `/landing/[slug]` | صفحة حملة عامة | زائر حملة | تعرض مشروعًا ومزاياه ونموذج اهتمام. | High | Medium | P1 | استبدال البيانات والأزرار التجريبية بمحتوى حقيقي. |
| 7 | `/c/[token]` | محادثة الزائر الخاصة | عميل لديه رابط | تعرض الرسائل وتسمح بالرد من رابط خاص. | Core | Critical | P0 | تصميم Chat واضح وإخفاء تنقل السوق. |
| 8 | `/[domain]` | رئيسية موقع الشركة | زائر موقع شركة | تعرض هوية الشركة ومشاريعها ووسيلة التواصل. | Core | High | P0 | إزالة Resolution/Mock ومنع تكرار Header/Footer. |
| 9 | `/[domain]/projects` | مشاريع الشركة | زائر موقع شركة | تعرض المشاريع التابعة للشركة. | Core | High | P0 | إضافة بحث وفلاتر خاصة بالشركة. |
| 10 | `/[domain]/projects/[slug]` | مشروع داخل موقع الشركة | مشتري على موقع الشركة | تعرض تفاصيل المشروع ونموذج التواصل. | Core | Critical | P0 | توحيدها مع Project Detail ومنع اختلاف التصميم. |
| 11 | `/[domain]/about` | عن الشركة | زائر موقع شركة | تعرض تعريف الشركة ومناطقها ونقاط قوتها. | High | Medium | P1 | إضافة قصة وصور وتراخيص عند توفرها. |
| 12 | `/[domain]/contact` | تواصل مع الشركة | Lead / زائر | تعرض بيانات الشركة ونموذج طلب التواصل. | Core | High | P0 | تقصير النموذج وإضافة خيارات اتصال مباشرة. |
| 13 | `/[domain]/landing/[slug]` | حملة خاصة بالشركة | زائر حملة | تعرض صفحة حملة داخل نطاق الشركة. | High | Medium | P1 | منع تزاحم Header وBottom Nav وSticky CTA. |
| 14 | `robots.ts` | تعليمات محركات البحث | Search Crawler | تحدد الصفحات التي يمكن لمحركات البحث الوصول إليها. | High | Low | P2 | مراجعة فهرسة النطاقات قبل الإطلاق. |
| 15 | `sitemap.ts` | خريطة الموقع | Search Crawler | ترسل روابط الصفحات العامة لمحركات البحث. | High | Low | P2 | إزالة Demo slugs وضبط Canonical للنطاقات. |
| 16 | Global layout | الهيكل العام للموقع | كل الزوار | يضيف Theme وHeader وFooter وTracking وBottom Nav. | Core | Critical | P0 | جعله Route-aware حسب نوع الصفحة. |
| 17 | Public header | رأس السوق العام | زائر عام | يوفر الشعار وروابط المشاريع والمطورين والوسطاء. | Core | Critical | P0 | إزالة روابط Demo وبناء Directories حقيقية. |
| 18 | Public footer | تذييل السوق العام | زائر عام | يعرض روابط وثقة ومعلومات المنصة. | High | High | P1 | إزالة النصوص التقنية والمزايا المعطلة. |
| 19 | Public bottom nav | التنقل السفلي العام | زائر Mobile | يوفر Home وSearch وMore على الهاتف. | Core | Critical | P0 | جعله مناسبًا للسوق أو موقع الشركة حسب Route. |
| 20 | Organization shell | هيكل موقع الشركة | زائر موقع شركة | يضيف هوية الشركة وروابط Projects وAbout وContact. | Core | High | P0 | يجب أن يستبدل الهيكل العام لا أن يتكرر معه. |
| 21 | Lead / Contact forms | نماذج طلب التواصل | Lead / مشتري | تجمع بيانات الزائر وتنشئ طلبًا أو محادثة. | Core | Critical | P0 | توحيد النموذجين وتحسين الهاتف والموافقة والنجاح. |
| 22 | First-party tracking | تتبع سلوك الزائر | زائر مجهول / فريق المبيعات | يسجل المشاهدة والبحث والتمرير ووقت الصفحة. | Core | High | P1 | دعم Domain project paths ومراجعة consent والخصوصية. |

<div style="page-break-after: always;"></div>

# 6. جرد Mobile App القابل للطباعة

> يشمل 29 شاشة أو حالة يراها المستخدم. `MarketplaceShellScreen` بنية تنقل وليس وجهة مستقلة، لذلك لا يدخل في العدد.

| # | Route / Screen | اسم الشاشة بالعربية | يستخدمها | الغرض | الأهمية | Demo | Redesign | ملاحظة قصيرة |
|---:|---|---|---|---|---|---|---|---|
| 1 | `/auth/loading` — `SplashScreen` | شاشة بدء التطبيق | مستخدم Mobile | تنتظر فحص الجلسة المحفوظة. | Core | High | P1 | إضافة حالة Offline أو بطء الاتصال. |
| 2 | `/login` — `LoginScreen` | تسجيل الدخول | Broker / Company User | تدخل المستخدم إلى التطبيق. | Core | Critical | P0 | إضافة لغة وثيم وإظهار كلمة المرور. |
| 3 | `/marketplace/projects` — `ProjectsListScreen` | قائمة المشاريع | Broker | تعرض المشاريع المتاحة حسب صلاحيات السوق. | Core | Critical | P0 | تحسين الصور والبحث والترتيب والفلاتر. |
| 4 | `/marketplace/units` — `UnitsListScreen` | قائمة الوحدات | Broker | تعرض الوحدات المتاحة وأسعارها. | Core | Critical | P0 | إبراز المشروع والتوفر والسعر والصور. |
| 5 | `/marketplace/map` — `MapSearchScreen` | البحث بالخريطة | Broker | تبحث عن المشاريع داخل حدود جغرافية. | High | High | P1 | الخريطة Placeholder؛ تخفى من أول ديمو. |
| 6 | `/projects/:id` — `ProjectDetailScreen` | تفاصيل المشروع | Broker | تعرض المشروع وخطط السداد والوحدات وتبدأ Claim. | Core | Critical | P0 | إضافة Gallery حقيقي وCTA ثابت. |
| 7 | `/units/:id` — `UnitDetailScreen` | تفاصيل الوحدة | Broker | تعرض الوحدة والسعر وتبدأ Claim. | Core | Critical | P0 | إضافة صور وFloor Plan وخطة سداد. |
| 8 | `/profile` — `ProfileScreen` | الحساب والمزيد | مستخدم مسجل | تعرض الحساب وروابط CRM والصفقات والإعدادات. | Core | Critical | P0 | فصل Profile عن قائمة العمليات الطويلة. |
| 9 | `/broker-profile` — `BrokerProfileScreen` | ملف الوسيط | Broker | تعرض الرخصة والهاتف والخبرة والحالة. | High | Medium | P1 | جعلها Read-only بوضوح حتى دعم التعديل. |
| 10 | `BrokerProfileEditPlaceholderScreen` | تعديل ملف الوسيط | Broker | توضح أن تعديل الملف غير متاح بعد. | Supporting | Low | P3 | إخفاء زر التعديل من الديمو. |
| 11 | `/crm-leads` — `CrmLeadsListScreen` | قائمة عملاء CRM | Broker / Sales | تعرض العملاء مع فلاتر الحالة وطريقة التواصل. | Core | Critical | P0 | إضافة بحث وآخر نشاط والخطوة التالية. |
| 12 | `/crm-marketplace-leads` — `CrmMarketplaceLeadsScreen` | عملاء السوق | Broker | تعرض العملاء المتاحين وتسمح بالمطالبة. | Core | Critical | P0 | توضيح الأهلية وحماية Claim من الخطأ. |
| 13 | `/crm-leads/:id` — `CrmLeadDetailScreen` | تفاصيل عميل CRM | Broker / Sales | تعرض العميل والمشروع وUTM والحالة والمحادثة. | Core | Critical | P0 | ترتيب المعلومات حول إجراء رئيسي واحد. |
| 14 | `/crm-conversations` — `ConversationsListScreen` | قائمة المحادثات | Broker / Sales | تعرض محادثات CRM وتفلترها. | Core | Critical | P0 | إظهار غير المقروء وآخر رسالة. |
| 15 | `/crm-conversations/:id` — `ConversationDetailScreen` | تفاصيل المحادثة | Broker / Sales | تعرض الرسائل وتسمح بالرد وتغيير الحالة. | Core | Critical | P0 | إضافة Sticky Composer وشكل Chat حقيقي. |
| 16 | `/c/:token` — `PublicConversationTokenScreen` | محادثة عامة برابط | Lead / Client | تفتح محادثة خاصة بدون تسجيل الدخول. | Core | High | P1 | توضيح الخصوصية وهوية المرسل وصلاحية الرابط. |
| 17 | `/lead-claims` — `LeadClaimsListScreen` | مطالباتي بالعملاء | Broker | تعرض مطالبات الوسيط وحالاتها. | Core | High | P1 | تجميع Active وExpired وإظهار الوقت. |
| 18 | `/lead-claims/new` — `LeadClaimFormScreen` | إنشاء مطالبة | Broker | تنشئ Claim من مشروع أو وحدة. | Core | High | P1 | شرح القواعد والمدة قبل الإرسال. |
| 19 | `/lead-claims/:id` — `LeadClaimDetailScreen` | تفاصيل المطالبة | Broker | تعرض Claim وتحررها أو تبدأ حجزًا. | Core | High | P1 | إضافة Timeline وتأكيد Release. |
| 20 | `/reservation-requests` — `ReservationRequestsListScreen` | طلبات الحجز | Broker | تعرض طلبات الحجز وحالاتها. | Core | High | P1 | تجميع الحالات وإظهار الخطوة التالية. |
| 21 | `/reservation-requests/new` — `ReservationRequestFormScreen` | إنشاء طلب حجز | Broker | تنشئ طلبًا من Claim فعال. | Core | High | P1 | الحفاظ على السياق عند Deep Link أو Restart. |
| 22 | `/reservation-requests/:id` — `ReservationRequestDetailScreen` | تفاصيل طلب الحجز | Broker | تعرض الطلب وتلغيه أو تنشئ Deal Room. | Core | Critical | P1 | عرض تقدم العملية وشروط Hold. |
| 23 | `/deal-rooms` — `DealRoomsListScreen` | غرف الصفقات | Broker | تعرض غرف التفاوض الخاصة بالوسيط. | Core | High | P1 | إظهار المرحلة وآخر نشاط وغير المقروء. |
| 24 | `/deal-rooms/:id` — `DealRoomDetailScreen` | تفاصيل غرفة الصفقة | Broker | تدير المشاركين والرسائل والحالة والدعوة. | Core | High | P1 | تصميمها كChat Workspace. |
| 25 | `/deals` — `DealsListScreen` | صفقاتي | Broker | تعرض الصفقات وحالتها وقيمتها. | Core | High | P1 | إضافة فلاتر وإجماليات وخطوة تالية. |
| 26 | `/deals/:id` — `DealDetailScreen` | تفاصيل الصفقة | Broker | تعرض تفاصيل الصفقة وتفتح Deal Room. | Core | High | P1 | إبراز المال والحالة وTimeline. |
| 27 | `/commissions` — `CommissionsListScreen` | عمولاتي | Broker | تعرض عمولات الوسيط وحالتها. | Core | High | P1 | إضافة إجمالي ومستحق ومقبول. |
| 28 | `/commissions/:id` — `CommissionDetailScreen` | تفاصيل العمولة | Broker | تعرض حساب العمولة وتفتح الصفقة. | High | High | P1 | شرح الحساب وموعد الاستحقاق. |
| 29 | `_MissingRouteInputScreen` | حالة نقص بيانات المسار | Broker | تشرح أن الإجراء يحتاج فتح مشروع أو Claim أولًا. | Supporting | Medium | P1 | إضافة زر يرجع المستخدم للمكان الصحيح. |

<div style="page-break-after: always;"></div>

# 7. أهم الصفحات للديمو — Most Important Pages For Demo

## 7.1 Admin Demo Critical

| الترتيب | الصفحة | لماذا تهم؟ | ما الذي يجب أن يبدو جيدًا؟ | ما الذي قد يضعف الديمو؟ |
|---:|---|---|---|---|
| 1 | Login | أول نقطة دخول لكل الأدوار. | الهوية، وضوح الحقول، الخطأ والتحميل. | شكل عام جدًا أو خطأ اتصال غير مفهوم. |
| 2 | Platform Dashboard | يشرح قيمة المنصة للإدارة. | أرقام حقيقية، مهام عاجلة، Trust KPIs. | ظهور `--` أو Sample rows. |
| 3 | Platform Organizations | يثبت أن المنصة تدير المطورين والوسطاء. | البحث، الحالة، النوع، الإجراء التالي. | جدول مزدحم أو Empty غير مفهوم. |
| 4 | Organization Detail | يثبت Workflow المراجعة والحوكمة. | Checklist، المستندات، الدعوات، قرارات واضحة. | كثرة البطاقات وعدم فهم القرار. |
| 5 | Verifications | يوضح كيف تبني POPWAM الثقة. | Queue نظيف، عمر الطلب، نوع المستند. | عدم وجود Preview أو نتائج قرار واضحة. |
| 6 | Developer Dashboard | أول شاشة لعميل الشركة. | المشاريع والمخزون والعملاء والمهام. | أرقام Placeholder أو عدم وجود Next Action. |
| 7 | Developer Projects | قلب إدارة المنتج العقاري. | حالات النشر، الجاهزية، الصور، زر New Project. | جدول تقني بلا صورة أو حالة واضحة. |
| 8 | Project Detail | تجمع بيانات المشروع والبيع والظهور. | Overview، Tabs، Publish readiness، Sticky actions. | نموذج طويل وSelling Permissions وسط الزحام. |
| 9 | Inventory | يثبت إدارة الوحدات الحقيقية. | فلاتر سريعة، التوفر، السعر، Bulk actions. | جدول عريض أو إنشاء وحدة طويل. |
| 10 | CRM Leads | يوضح قيمة CRM اليومية. | Owner، intent، recency، next task، quick contact. | قائمة بلا أولوية أو إجراء واضح. |
| 11 | CRM Lead Detail | أهم شاشة لتحويل العميل. | Timeline موحد، Contact، Tasks، Notes، Chat. | تشتت الإجراءات أو طلب IDs خام. |
| 12 | Public Leads | يربط Public Web بفريق المبيعات. | Source، UTM، consent، duplicate، contact method. | عدم فهم الفرق بين Public Lead وCRM Lead. |
| 13 | Public Lead Detail | يثبت فهم سلوك الزائر والتحويل. | Visitor behavior، source page، conversion CTA. | بيانات تقنية كثيرة بدون قرار واضح. |
| 14 | Conversations | يثبت التواصل المباشر مع العملاء. | Unread، آخر رسالة، زمن الرد، المشاركون. | قائمة تشبه جدولًا عاديًا بلا Chat cues. |
| 15 | Conversation Detail | يثبت أن التواصل يعمل فعليًا. | Message bubbles، Sticky composer، lead context. | Composer بعيد أو Share Token مربك. |
| 16 | Reservation Requests | يربط العميل بالمخزون. | حالة الطلب، أثر Hold، قبول/رفض واضح. | موافقة بدون توضيح أثرها على الوحدة. |
| 17 | Deal Rooms | يوضح التعاون والتفاوض. | المرحلة، المشاركون، النشاط، الإجراء التالي. | صفحة كثيفة بلا مسار تقدم. |
| 18 | Deals | يوضح نتيجة رحلة البيع. | القيمة، الحالة، الأطراف، الموافقات. | غياب الربط بالحجز والغرفة والعمولة. |
| 19 | Commissions | يوضح القيمة المالية للوسيط والشركة. | المبلغ، القاعدة، الحالة، المستحق. | حساب غير مفهوم أو حالة بلا تفسير. |
| 20 | Selling Permissions & Invitations | يثبت نموذج حوكمة Stage 8 والوصول للشركات. | من يستطيع البيع، الدعوة، الحالة، الصلاحيات. | اختيار IDs أو صلاحيات غير مفهومة للمستخدم. |

## 7.2 Public Demo Critical

| الترتيب | الصفحة | لماذا تهم؟ | ما الذي يجب أن يبدو جيدًا؟ | ما الذي قد يضعف الديمو؟ |
|---:|---|---|---|---|
| 1 | Home `/` | تصنع الانطباع الأول عن POPWAM. | Hero قوي، ثقة، مشاريع، CTA واضح. | كلام mock/API/placeholder أو شكل داخلي. |
| 2 | Projects `/projects` | بداية اكتشاف العقار. | Cards وصور وفلاتر وعدد نتائج. | صور ضعيفة أو Filters ثقيلة على Mobile. |
| 3 | Project Detail `/projects/[slug]` | أهم صفحة للتحويل إلى Lead. | Gallery، السعر، السداد، الموقع، Sticky CTA. | نموذج طويل بلا CTA ثابت أو Media حقيقي. |
| 4 | Lead Form | يحول الزائر إلى فرصة بيع. | نموذج قصير، هاتف صحيح، consent، success واضح. | تكرار الحقول أو فشل غير مفهوم. |
| 5 | Chat `/c/[token]` | يثبت استمرار التواصل بعد النموذج. | Chat بسيط وآمن وسريع على الهاتف. | Header/Footer السوق أو رابط بلا شرح خصوصية. |
| 6 | Domain Home `/[domain]` | يثبت أن كل شركة تملك موقعًا بهويتها. | Branding واضح ومشاريع واتصال. | Header/Footer مزدوج أو كلام Resolution/Mock. |
| 7 | Domain Contact `/[domain]/contact` | نقطة تحويل مباشرة للشركة. | بيانات اتصال موثوقة ونموذج مختصر. | CTA غير حقيقي أو نجاح بلا خطوة تالية. |

## 7.3 Mobile Demo Critical

| الترتيب | الشاشة | لماذا تهم؟ | ما الذي يجب أن يبدو جيدًا؟ | ما الذي قد يضعف الديمو؟ |
|---:|---|---|---|---|
| 1 | Login | يفتح رحلة التطبيق. | سرعة، هوية، خطأ اتصال واضح. | بقاء Spinner أو فشل تقني. |
| 2 | Projects List | الصفحة الرئيسية للوسيط. | صور، بحث، Filter، سعر وتوفر. | Cards بسيطة أو صور مفقودة. |
| 3 | Project Detail | يشرح المشروع ويبدأ Claim. | Gallery، تفاصيل مختصرة، Units، CTA ثابت. | “Carousel placeholder” أو تمرير طويل. |
| 4 | Unit Detail | يحسم اختيار الوحدة. | السعر، التوفر، المساحة، السداد، Claim. | غياب الصور أو Floor Plan. |
| 5 | CRM Leads | يوم العمل للوسيط. | أولوية العميل، الحالة، آخر نشاط. | قائمة بلا Search أو Next Action. |
| 6 | CRM Lead Detail | يحول العميل إلى تواصل فعلي. | Contact، Status، Chat، Timeline. | كثرة Cards أو أزرار متساوية. |
| 7 | Conversations | يثبت التواصل من الهاتف. | Unread، رسائل، Composer ثابت. | تجربة لا تشبه Chat. |
| 8 | Lead Claims | يثبت حماية العميل للوسيط. | المدة، الأهلية، المشروع، الحالة. | Claim غير مفهوم أو بدون تأكيد. |
| 9 | Reservation Requests | يثبت انتقال العميل نحو الصفقة. | Stepper، الوحدة، Hold، النتيجة. | فقدان route context أو Missing state بلا رجوع. |

<div style="page-break-after: always;"></div>

# 8. صفحات لا ينبغي إبرازها في أول ديمو

| الصفحة / الميزة | القرار المقترح | السبب |
|---|---|---|
| Ads campaign pages | إخفاء أو وضعها تحت More | هي سجل تخطيط، وليست تكامل نشر مع Google أو Meta أو TikTok. |
| Cameras pages | إخفاء أو وضعها تحت More | لا يوجد Streaming أو DVR أو Credentials أو AI حقيقي. |
| HR Payroll expectations | عدم ذكر Payroll كميزة | صفحات HR الحالية سجلات أساسية فقط. |
| Payment gateway / ledger expectations | عدم عرضها كحسابات متكاملة | Accounting الحالي تسجيل يدوي وملخص بسيط. |
| Legal upload / e-signature expectations | عدم عرضها كإدارة مستندات مكتملة | Legal الحالي يسجل Metadata ولا ينفذ Upload أو E-signature. |
| Import / Export | تحت More أو خارج الديمو | مهم داخليًا، لكنه لا يشرح قيمة المنتج الأساسية إلا عند ديمو Onboarding. |
| HR / Accounting / Legal detail pages | عدم إبرازها إلا عند طلب العميل | Generic CRUD ويحتاج Domain UX أعمق. |
| Platform HR / Legal / Ads / Cameras | نقلها إلى More | موديولات داخلية أو Foundations وليست أولويات البيع. |
| Mobile Map | إخفاؤها من Bottom Nav مؤقتًا | البحث الخلفي موجود لكن الخريطة نفسها Placeholder. |
| Broker Profile Edit | إخفاء زر Edit | شاشة التعديل Placeholder ولا يوجد Update API. |
| Public mock landing CTAs | عدم عرضها حتى تصبح حقيقية | Call وWhatsApp وVisit لا يجب أن تبدو ميزات مكتملة وهي Placeholder. |

> هذه الصفحات Foundations مفيدة للتوسع، لكنها لا تُقدَّم كميزات مكتملة في أول ديمو.

<div style="page-break-after: always;"></div>

# 9. خطة تنفيذ إعادة التصميم

## Phase UI-0 — Design System

- Semantic tokens للألوان والأسطح والنصوص والحالات.
- Light / Dark / Eye Comfort.
- Typography عربية وإنجليزية وفرنسية.
- `lang` و`dir` وRTL وLogical spacing.
- Spacing، radius، shadows، cards.
- Buttons، inputs، selects، entity picker، dialogs.
- Tables وMobile card alternative.
- Empty، loading، skeleton، error، success، permission states.

**النتيجة المطلوبة:** أي صفحة جديدة تستخدم النظام بدون ألوان أو مكونات خاصة بها.

## Phase UI-1 — Shell and Navigation

- Admin desktop sidebar ثابت ومقسم حسب المهمة والدور.
- Admin More menu قابل للبحث.
- Admin topbar، breadcrumbs، account، language، theme.
- Admin mobile bottom nav حسب الدور.
- Public header وPublic mobile bottom nav.
- Route-aware Public layout لمواقع الشركات والمحادثات.
- Floating accessibility control بدون تعارض مع CTA.

**النتيجة المطلوبة:** المستخدم يعرف مكانه وما الذي يراه ولماذا.

## Phase UI-2 — Admin Critical Flows

- Login وInvitations.
- Platform وDeveloper وBrokerage dashboards.
- Platform Organizations وVerifications وDomains.
- Developer Projects وProject Detail وInventory.
- CRM Leads وLead Detail وPipeline وTasks.
- Conversations وPublic Leads.
- Stage 8: Agreements، Broker Access، Selling Permissions، Reservations، Deal Rooms، Deals، Commissions.

**النتيجة المطلوبة:** رحلة Admin كاملة ومقنعة للديمو.

## Phase UI-3 — Public Conversion

- Home.
- Projects listing.
- Project detail وGallery وPayment plan وLocation.
- Sticky Contact CTA حقيقي ومشروط بالإعدادات.
- Lead وContact forms موحدة.
- Public Chat route.
- Domain sites بهوية وتنقل خاصين.

**النتيجة المطلوبة:** الزائر يفهم المشروع ويثق به ويتواصل بأقل خطوات.

## Phase UI-4 — Mobile

- Login وSplash states.
- Marketplace navigation وProjects وUnits وFilters.
- Project وUnit details وMedia.
- CRM Leads وLead Detail.
- Conversations.
- Claims، Reservations، Deal Rooms، Deals، Commissions.
- More/Profile، themes، localization، offline states.

**النتيجة المطلوبة:** الوسيط ينجز رحلة البيع الأساسية بيد واحدة وبوضوح.

## Phase UI-5 — Secondary / Internal

- Operations overview.
- HR، Accounting، Legal domain UX.
- Import / Export onboarding and error recovery.
- Ads وCameras بعد تحديد التكامل الحقيقي.

**النتيجة المطلوبة:** تحسين الموديولات الثانوية بعد نجاح رحلة المنتج الأساسية.

<div style="page-break-after: always;"></div>

# 10. التوصية النهائية في صفحة واحدة

## القرار

لا تبدأ بإعادة تصميم 152 صفحة وشاشة واحدة بعد الأخرى. ابدأ بالأساس المشترك، ثم رحلة الديمو، ثم وسّع النظام على بقية الصفحات.

## ترتيب العمل المعتمد

| الترتيب | العمل | لماذا الآن؟ |
|---:|---|---|
| 1 | Design System | يمنع التكرار ويثبت الألوان والخطوط وRTL والحالات. |
| 2 | Admin/Public Shell & Navigation | يحل أكبر مشكلة مشتركة قبل لمس الصفحات. |
| 3 | Admin Critical Demo Flows | يثبت الحوكمة وإدارة المشاريع وCRM والصفقات. |
| 4 | Public Conversion Flows | يحسن الانطباع الأول ويحّول الزائر إلى Lead. |
| 5 | Mobile Critical Flow | ينقل نفس الرحلة إلى الوسيط أثناء الحركة. |
| 6 | Secondary/Internal Modules | يتم بعد نجاح الديمو والمسارات الأساسية. |

## قواعد التنفيذ

- ابدأ بـDesign System، ثم أصلح تنقل Admin وPublic.
- أعد تصميم الصفحات الحرجة للديمو قبل الصفحات الداخلية.
- لا تعيد تصميم أكثر من Slice واحدة بدون Acceptance Criteria واضحة.
- أبقِ Backend وAPI وPrisma مجمدة، إلا إذا أثبت Workflow حقيقي أن API مفقود.
- لا تعرض Ads أو Cameras أو Payroll أو E-signature كميزات مكتملة قبل وجود تكامل حقيقي.
- لا تنشر تغييرات UI إلى Staging قبل نجاح Local build/lint والتحقق من الرحلة الأساسية.

## بوابة الجودة لكل Slice

1. يعمل باللغات المستهدفة واتجاه RTL/LTR.
2. يعمل على Desktop وMobile.
3. يحتوي على Loading وEmpty وError وSuccess واضحة.
4. يخفي الإجراءات غير المسموحة حسب الدور والصلاحية.
5. لا يحتوي على mock أو placeholder أو كلام تقني في واجهة العميل.
6. ينجح lint/build والاختبار المحلي قبل Staging.

## النتيجة المتوقعة

منصة واحدة متماسكة: Admin سريع للإنتاجية، Public فاخر للتحويل، وMobile عملي للوسيط—بدون التضحية بالوظائف الحالية أو تغيير Backend مبكرًا.

---

**حالة هذا المستند:** توثيق وتخطيط فقط. لم يتم تنفيذ أي تغيير UI أو Route أو API أو Prisma.


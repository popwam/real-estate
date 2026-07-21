# POPWAM — الهيكل الإداري والأدوار والصلاحيات

> وثيقة مرجعية لتصميم الهيكل التنظيمي، مستويات المستخدمين، ونظام الصلاحيات داخل منصة POPWAM متعددة الأطراف.

---

# 1. مبادئ نظام الصلاحيات

يعتمد POPWAM على نموذج **Multi-Tenant RBAC + Scope-Based Permissions**، بحيث تكون الصلاحية مرتبطة بالدور وبنطاق الوصول.

## 1.1 مستويات النطاق

1. المنصة بالكامل.
2. دولة.
3. مدينة أو سوق.
4. مؤسسة أو شركة.
5. فرع.
6. مشروع.
7. مرحلة أو مبنى.
8. فريق.
9. مستخدم.
10. سجل أو معاملة محددة.

## 1.2 أنواع الصلاحيات

- عرض.
- إنشاء.
- تعديل.
- حذف.
- اعتماد.
- رفض.
- إسناد.
- إعادة إسناد.
- تصدير.
- استيراد.
- مشاركة.
- طباعة.
- تنزيل مستندات.
- رفع مستندات.
- إخفاء أو إظهار البيانات الحساسة.
- الاطلاع على الأسعار.
- الاطلاع على الهوامش والعمولات.
- الاطلاع على بيانات العملاء.
- الاطلاع على البيانات البنكية.
- تنفيذ عمليات مالية.
- إغلاق المعاملة.
- إعادة فتح المعاملة.
- تجاوز القيود وفق مستوى اعتماد.

## 1.3 مستويات حساسية البيانات

- عام.
- داخلي.
- سري.
- مالي حساس.
- بيانات شخصية.
- بيانات قانونية.
- بيانات بنكية.

---

# 2. الهيكل الإداري الداخلي لشركة POPWAM

## 2.1 مجلس الإدارة والإدارة التنفيذية

### مجلس الإدارة

المستويات:

- رئيس مجلس الإدارة.
- نائب رئيس مجلس الإدارة.
- عضو مجلس إدارة.
- سكرتير المجلس.

الصلاحيات:

- عرض المؤشرات العليا فقط.
- اعتماد الخطط السنوية.
- اعتماد الميزانيات الكبرى.
- اعتماد التوسع في الدول.
- اعتماد الاستحواذات والشراكات الاستراتيجية.
- الاطلاع على المخاطر والتقارير القانونية.

### الرئيس التنفيذي CEO

الصلاحيات:

- وصول شامل على مستوى المنصة.
- اعتماد الخطط الاستراتيجية.
- اعتماد القيادات التنفيذية.
- اعتماد التسعير العام.
- اعتماد العقود الاستراتيجية.
- الاطلاع على جميع KPIs.
- تفويض صلاحيات تنفيذية.

### الرئيس التنفيذي للعمليات COO

الصلاحيات:

- إدارة عمليات السوق.
- إدارة جودة المخزون.
- إدارة التحقق والنزاعات.
- الإشراف على فرق خدمة العملاء.
- اعتماد سياسات التشغيل.
- متابعة SLA.

### الرئيس التنفيذي التقني CTO

الصلاحيات:

- إدارة البنية التقنية.
- إدارة الأمن والصلاحيات التقنية.
- اعتماد الإصدارات.
- إدارة بيئات الإنتاج والاختبار.
- الاطلاع على سجلات النظام.
- إدارة التكاملات وواجهات API.

### الرئيس المالي CFO

الصلاحيات:

- إدارة الإيرادات والفواتير.
- اعتماد الصرف والتحصيل.
- إدارة الضرائب.
- الاطلاع على الحسابات البنكية.
- إدارة العمولات والمدفوعات.
- إقفال الفترات المالية.

### الرئيس التجاري CCO

الصلاحيات:

- إدارة المبيعات والشراكات.
- اعتماد العقود التجارية.
- إدارة الباقات والأسعار التجارية.
- الاطلاع على Pipeline.
- اعتماد الخصومات التجارية ضمن الحدود.

---

## 2.2 إدارة المنتج

المستويات:

- Chief Product Officer.
- Head of Product.
- Product Director.
- Product Manager.
- Associate Product Manager.
- Product Analyst.
- UX Researcher.
- UI/UX Designer.

الأقسام:

- Marketplace Product.
- Brokerage Product.
- Developer Product.
- Operations Product.
- Vendor Network Product.
- Payments Product.
- Data & Intelligence Product.

الصلاحيات:

- عرض بيانات الاستخدام مجهولة الهوية.
- إنشاء متطلبات المنتج.
- إدارة خارطة الطريق.
- إدارة Feature Flags.
- مراجعة Funnels.
- لا يحق لهم الاطلاع على البيانات البنكية الخام إلا بتصريح.

---

## 2.3 الإدارة التقنية

الأقسام والمستويات:

- VP Engineering.
- Engineering Manager.
- Tech Lead.
- Senior Engineer.
- Software Engineer.
- Junior Engineer.
- QA Lead.
- QA Engineer.
- DevOps Engineer.
- Site Reliability Engineer.
- Security Engineer.
- Data Engineer.
- Database Administrator.

الصلاحيات:

- الوصول حسب البيئة.
- عدم الوصول الافتراضي لبيانات العملاء الحقيقية.
- الوصول المؤقت تحت Audit.
- إدارة Logs وMonitoring.
- إدارة Deployments.
- إدارة Secrets وفق مبدأ أقل صلاحية.

---

## 2.4 المبيعات والشراكات

الأقسام:

- Enterprise Sales.
- Developer Sales.
- Brokerage Sales.
- Operations Sales.
- Vendor Partnerships.
- Strategic Partnerships.
- Account Management.

المستويات:

- VP Sales.
- Sales Director.
- Regional Sales Manager.
- Sales Manager.
- Team Leader.
- Senior Account Executive.
- Account Executive.
- Sales Development Representative.
- Account Manager.

الصلاحيات:

- إنشاء Leads تجارية.
- إدارة Pipeline.
- إنشاء عروض الأسعار.
- رفع العقود.
- طلب خصومات.
- لا يمكن اعتماد خصومات تتجاوز الحد المحدد.
- لا يمكن تعديل فاتورة بعد اعتمادها.

---

## 2.5 Customer Success والدعم

المستويات:

- Head of Customer Success.
- Customer Success Manager.
- Onboarding Specialist.
- Training Specialist.
- Support Manager.
- Support Team Leader.
- Support Agent.

الصلاحيات:

- إدارة Onboarding.
- عرض إعدادات العميل.
- مساعدة المستخدمين.
- Impersonation مقيد ومسجل.
- لا يمكن الاطلاع على كلمات المرور أو البيانات البنكية الكاملة.
- تصعيد التذاكر.

---

## 2.6 عمليات السوق والتحقق

الأقسام:

- Listing Verification.
- Developer Verification.
- Brokerage Verification.
- Broker Verification.
- Fraud Review.
- Inventory Quality.
- Content Moderation.
- Dispute Resolution.

المستويات:

- Operations Director.
- Verification Manager.
- Verification Team Leader.
- Senior Reviewer.
- Reviewer.
- Fraud Analyst.
- Dispute Officer.

الصلاحيات:

- اعتماد أو رفض التوثيق.
- تجميد إعلان.
- طلب مستند إضافي.
- تقييد حساب.
- فتح تحقيق.
- لا يمكن حذف سجل Audit.

---

# 3. شركة المطور العقاري

## 3.1 الإدارة التنفيذية

المستويات:

- رئيس مجلس الإدارة.
- العضو المنتدب.
- CEO.
- COO.
- CFO.
- CCO.
- CTO/CIO.

الصلاحيات:

- رؤية جميع المشاريع التابعة للشركة.
- اعتماد الميزانيات.
- اعتماد خطط التسعير.
- اعتماد العقود الكبرى.
- اعتماد نسب العمولات.
- الاطلاع على التحصيل والتنفيذ.

## 3.2 إدارة التطوير والاستثمار

المستويات:

- Development Director.
- Investment Manager.
- Development Manager.
- Feasibility Analyst.
- Market Research Analyst.

الصلاحيات:

- إنشاء فرص استثمارية.
- إضافة أراضٍ.
- إدارة دراسات الجدوى.
- تعديل الافتراضات.
- رفع توصيات الاستثمار.
- لا يعتمد المشروع نهائيًا إلا الإدارة العليا.

## 3.3 إدارة المشاريع

المستويات:

- Projects Director.
- Program Manager.
- Project Manager.
- Deputy Project Manager.
- Project Coordinator.

الصلاحيات:

- إنشاء المشروع.
- إدارة الجدول الزمني.
- إدارة مراحل المشروع.
- تعيين المقاولين.
- اعتماد تقارير التنفيذ حسب الحدود.
- إصدار تقارير التأخير.

## 3.4 الإدارة الهندسية

المستويات:

- Engineering Director.
- Design Manager.
- Architectural Manager.
- Structural Manager.
- MEP Manager.
- BIM Manager.
- Senior Engineer.
- Site Engineer.
- Document Controller.

الصلاحيات:

- رفع واعتماد الرسومات.
- إصدار RFIs.
- إدارة Submittals.
- إدارة الإصدارات.
- اعتماد فني دون صلاحية مالية إلا بتفويض.

## 3.5 إدارة الإنشاءات

المستويات:

- Construction Director.
- Construction Manager.
- Site Manager.
- Section Engineer.
- Site Engineer.
- General Foreman.
- Quantity Surveyor.
- Planning Engineer.

الصلاحيات:

- تسجيل نسب الإنجاز.
- اعتماد كميات منفذة.
- إصدار تقارير يومية.
- فتح ملاحظات تنفيذ.
- لا يعتمد مستخلص مالي منفردًا.

## 3.6 المبيعات

المستويات:

- Sales Director.
- Sales Manager.
- Branch Manager.
- Team Leader.
- Senior Sales Consultant.
- Sales Consultant.
- Sales Coordinator.

الصلاحيات:

- عرض المخزون المصرح.
- إنشاء حجز.
- إنشاء عرض سعر.
- طلب خصم.
- إدارة العميل.
- لا يمكنه تعديل السعر الأساسي.
- لا يمكنه اعتماد خصم فوق الحد.

## 3.7 إدارة الوسطاء والقنوات

المستويات:

- Channel Sales Director.
- Broker Relations Manager.
- Broker Account Manager.
- Commission Officer.
- Broker Support Coordinator.

الصلاحيات:

- اعتماد شركات الوساطة.
- إسناد مشروعات.
- تعريف نسب العمولات.
- مراجعة المطالبات.
- تعليق وسيط.

## 3.8 CRM وخدمة العملاء

المستويات:

- CRM Director.
- CRM Manager.
- Call Center Manager.
- Team Leader.
- Agent.
- Customer Care Specialist.

الصلاحيات:

- إدارة Leads.
- توزيع Leads.
- تسجيل المكالمات.
- إعادة الإسناد.
- إدارة الشكاوى.
- لا يحق له رؤية الحسابات البنكية.

## 3.9 التسعير وإدارة المخزون

المستويات:

- Commercial Planning Director.
- Pricing Manager.
- Inventory Manager.
- Pricing Analyst.
- Inventory Controller.

الصلاحيات:

- إنشاء قوائم الأسعار.
- تغيير حالة الوحدة.
- إدارة خطط السداد.
- إدارة صلاحية الأسعار.
- لا يتم نشر سعر جديد دون اعتماد.

## 3.10 العقود والتحصيل

المستويات:

- Contracts Director.
- Contracts Manager.
- Contract Specialist.
- Collections Manager.
- Collection Officer.

الصلاحيات:

- إنشاء العقود.
- مراجعة المستندات.
- اعتماد جداول الأقساط.
- تسجيل التحصيل.
- إصدار إيصالات.
- لا يمكن حذف دفعة بعد الترحيل.

## 3.11 المالية

المستويات:

- Finance Director.
- Financial Controller.
- Chief Accountant.
- Accountant.
- Treasury Manager.
- Treasury Officer.
- AR Accountant.
- AP Accountant.

الصلاحيات:

- القيود اليومية.
- الفواتير.
- المدفوعات.
- التحصيلات.
- التسويات البنكية.
- الإقفال.
- الصرف حسب حدود اعتماد.

## 3.12 القانونية

المستويات:

- Legal Director.
- Legal Manager.
- Senior Legal Counsel.
- Legal Counsel.
- Contract Administrator.

الصلاحيات:

- مراجعة العقود.
- إدارة النزاعات.
- رفع المستندات القانونية.
- قفل العقد قانونيًا.
- لا يمكن تعديل النسخة النهائية دون إصدار نسخة جديدة.

## 3.13 التسليم وما بعد البيع

المستويات:

- Handover Director.
- Handover Manager.
- Handover Coordinator.
- After-Sales Manager.
- Customer Service Engineer.

الصلاحيات:

- جدولة التسليم.
- فتح Snag List.
- تسجيل الاستلام.
- إدارة الضمان.
- فتح طلب صيانة.

---

# 4. شركة الوساطة العقارية

## 4.1 الملكية والإدارة العليا

المستويات:

- Owner.
- Managing Partner.
- CEO.
- COO.
- CFO.
- Sales Director.

الصلاحيات:

- وصول شامل إلى الشركة.
- إدارة الفروع.
- اعتماد الباقات.
- اعتماد نسب العمولة.
- الاطلاع على الربحية.

## 4.2 إدارة الفروع

المستويات:

- Regional Manager.
- Branch Manager.
- Assistant Branch Manager.
- Branch Coordinator.

الصلاحيات:

- إدارة مستخدمي الفرع.
- رؤية Leads الفرع.
- إعادة توزيع Leads داخل الفرع.
- اعتماد المصروفات الصغيرة.
- الاطلاع على أداء الفرق.

## 4.3 فرق المبيعات

المستويات:

- Sales Manager.
- Team Leader.
- Senior Broker.
- Property Consultant.
- Junior Broker.
- Sales Coordinator.

صلاحيات الوسيط:

- عرض Leads المسندة إليه فقط.
- تسجيل الأنشطة.
- إنشاء معاينة.
- إرسال Shortlist.
- إنشاء عرض سعر.
- رفع طلب حجز.
- الاطلاع على عمولته فقط.

صلاحيات Team Leader:

- رؤية فريقه.
- إعادة توزيع Leads داخل الفريق.
- اعتماد Lost Reason.
- مراجعة المكالمات.
- الاطلاع على أداء الفريق.

صلاحيات Sales Manager:

- إدارة عدة فرق.
- اعتماد الخصومات الداخلية.
- الاطلاع على Pipeline كامل.
- اعتماد إعادة الإسناد خارج الفريق.

## 4.4 إدارة المخزون والمشروعات

المستويات:

- Inventory Director.
- Inventory Manager.
- Project Account Manager.
- Inventory Specialist.

الصلاحيات:

- إدارة المشروعات المتاحة.
- رفع تحديثات الأسعار.
- ربط الوحدات بالمطورين.
- التحقق من التوافر.
- منع النشر عند انتهاء الصلاحية.

## 4.5 التسويق

المستويات:

- Marketing Director.
- Performance Marketing Manager.
- Content Manager.
- Campaign Specialist.
- Social Media Specialist.
- Graphic Designer.

الصلاحيات:

- إنشاء الحملات.
- ربط UTM.
- استيراد Leads.
- رؤية بيانات الحملات.
- لا يمكن تصدير بيانات العملاء إلا بصلاحية.

## 4.6 Call Center وInside Sales

المستويات:

- Call Center Manager.
- Team Leader.
- Senior Agent.
- Call Center Agent.
- Quality Analyst.

الصلاحيات:

- استقبال Leads.
- إجراء Qualification.
- حجز موعد.
- تحويل Lead.
- الاطلاع على التسجيلات وفق الصلاحية.

## 4.7 Back Office والعقود

المستويات:

- Operations Manager.
- Back Office Supervisor.
- Reservation Coordinator.
- Contract Coordinator.
- Documentation Officer.

الصلاحيات:

- مراجعة طلبات الحجز.
- رفع المستندات.
- متابعة المطور.
- تحديث حالة الصفقة.
- لا يمكنه تغيير عمولة دون اعتماد.

## 4.8 العمولات والمالية

المستويات:

- Finance Manager.
- Commission Manager.
- Commission Accountant.
- Accountant.

الصلاحيات:

- احتساب العمولات.
- مراجعة الاستحقاق.
- إصدار كشف عمولات.
- تسجيل المصروفات.
- اعتماد الصرف حسب الحد.

## 4.9 الجودة والامتثال

المستويات:

- Compliance Manager.
- Quality Manager.
- Quality Analyst.
- Data Protection Officer.

الصلاحيات:

- مراجعة المكالمات.
- التحقيق في الشكاوى.
- تجميد Lead عند إساءة الاستخدام.
- متابعة الموافقات التسويقية.
- طلب حذف بيانات العميل.

---

# 5. شركة إدارة وتشغيل المجتمعات العقارية

## 5.1 الإدارة العليا

- CEO.
- COO.
- Operations Director.
- Finance Director.
- Facility Management Director.

## 5.2 إدارة المجتمع

- Community Manager.
- Assistant Community Manager.
- Resident Relations Supervisor.
- Resident Relations Agent.

الصلاحيات:

- إدارة السكان والوحدات.
- إدارة الشكاوى.
- إدارة التصاريح.
- متابعة SLA.

## 5.3 إدارة المرافق

- Facility Manager.
- Technical Manager.
- MEP Supervisor.
- Electrical Engineer.
- Mechanical Engineer.
- Civil Engineer.
- Technician.

الصلاحيات:

- إدارة الأصول.
- إنشاء خطط صيانة.
- فتح أوامر عمل.
- اعتماد إغلاق أمر العمل فنيًا.

## 5.4 الأمن

- Security Manager.
- Security Supervisor.
- Shift Leader.
- Security Officer.
- Control Room Operator.

الصلاحيات:

- إدارة الزوار.
- إدارة التصاريح.
- تسجيل الحوادث.
- الاطلاع على الكاميرات وفق التفويض.

## 5.5 النظافة واللاندسكيب

- Soft Services Manager.
- Cleaning Supervisor.
- Landscape Supervisor.
- Team Leader.
- Worker.

الصلاحيات:

- استلام المهام.
- تنفيذ Checklists.
- رفع صور التنفيذ.
- تسجيل المواد المستهلكة.

## 5.6 المالية والتحصيل

- Finance Manager.
- Service Charge Accountant.
- Collection Officer.
- Cashier.

الصلاحيات:

- إصدار فواتير الخدمات.
- تسجيل التحصيل.
- إدارة المتأخرات.
- إصدار إيصالات.

---

# 6. شركة الصيانة

## الهيكل

- General Manager.
- Operations Manager.
- Maintenance Manager.
- Dispatcher.
- Supervisor.
- Senior Technician.
- Technician.
- Storekeeper.
- Quality Inspector.
- Finance Officer.

## الصلاحيات

### Dispatcher

- استقبال أوامر العمل.
- جدولة الفنيين.
- إعادة الإسناد.

### Supervisor

- مراجعة التشخيص.
- اعتماد المواد المطلوبة.
- متابعة التنفيذ.

### Technician

- عرض أوامر العمل المسندة فقط.
- بدء وإيقاف المهمة.
- رفع الصور.
- إضافة قطع الغيار.
- طلب توقيع العميل.

### Quality Inspector

- فحص العمل.
- قبول أو رفض الإغلاق.
- تسجيل إعادة العمل.

---

# 7. المورد

## الهيكل

- Vendor Owner.
- Vendor Admin.
- Sales Manager.
- Quotation Specialist.
- Order Coordinator.
- Warehouse Manager.
- Delivery Coordinator.
- Accountant.

## الصلاحيات

- إدارة المنتجات والخدمات.
- استقبال RFQ.
- تقديم عرض سعر.
- قبول أمر شراء.
- تحديث حالة التوريد.
- رفع الفاتورة.
- متابعة الدفع.
- لا يمكنه رؤية عروض المنافسين.

---

# 8. المقاول

## الهيكل

- Contractor Owner.
- General Manager.
- Contracts Manager.
- Project Manager.
- Site Manager.
- Planning Engineer.
- Quantity Surveyor.
- HSE Manager.
- QA/QC Manager.
- Accountant.

## الصلاحيات

- تقديم العروض.
- إدارة العقود.
- رفع نسب الإنجاز.
- تقديم المستخلصات.
- إدارة RFIs وSubmittals.
- تسجيل العمالة والمعدات.
- الرد على NCR.

---

# 9. شركة التسويق العقاري

## الهيكل

- Agency Owner.
- Managing Director.
- Account Director.
- Account Manager.
- Media Buyer.
- Content Manager.
- Copywriter.
- Designer.
- Video Editor.
- Data Analyst.

## الصلاحيات

- إنشاء حملات.
- رفع المحتوى.
- إدارة ميزانيات مصرح بها.
- الاطلاع على Leads المنسوبة للحملات.
- لا يمكنه رؤية CRM كامل إلا بتصريح.

---

# 10. البنك أو شركة التمويل العقاري

## الهيكل

- Partnership Manager.
- Mortgage Manager.
- Credit Analyst.
- Risk Officer.
- Documentation Officer.
- Customer Support Officer.

## الصلاحيات

- استقبال طلبات التمويل.
- طلب مستندات.
- تحديث حالة الطلب.
- إصدار موافقة مبدئية.
- لا يمكنه رؤية بيانات غير مرتبطة بطلب التمويل.

---

# 11. المكتب القانوني

## الهيكل

- Managing Partner.
- Legal Manager.
- Senior Lawyer.
- Lawyer.
- Paralegal.
- Documentation Officer.

## الصلاحيات

- استقبال طلبات المراجعة.
- رفع مذكرات قانونية.
- إدارة المستندات.
- تحديث حالة التسجيل أو القضية.
- عدم الاطلاع على البيانات المالية غير اللازمة.

---

# 12. شركة التأمين

## الهيكل

- Partnership Manager.
- Underwriting Manager.
- Underwriter.
- Claims Manager.
- Claims Officer.

## الصلاحيات

- إصدار عروض تأمين.
- إدارة الوثائق.
- استقبال المطالبات.
- تحديث حالة المطالبة.

---

# 13. المالك الفردي

## الصلاحيات

- إضافة عقاره.
- رفع مستند الملكية.
- اختيار وسيط.
- اعتماد السعر.
- قبول أو رفض عرض.
- عرض المعاينات.
- متابعة العقد والتحصيل.
- لا يمكنه الاطلاع على بيانات عملاء غير مهتمين بعقاره.

---

# 14. المشتري أو المستأجر

## الصلاحيات

- إدارة ملفه الشخصي.
- حفظ العقارات.
- إنشاء طلب تواصل.
- حجز معاينة.
- رفع مستنداته.
- متابعة الحجز والعقد.
- متابعة الأقساط.
- فتح شكوى أو طلب صيانة.
- سحب الموافقات التسويقية.
- طلب حذف البيانات حسب السياسة.

---

# 15. مصفوفة صلاحيات رئيسية

| الوحدة | عرض | إنشاء | تعديل | حذف | اعتماد | تصدير |
|---|---:|---:|---:|---:|---:|---:|
| الشركات | حسب النطاق | Admin | Admin | Super Admin | Platform Admin | مقيد |
| المستخدمون | حسب الشركة | Admin | Admin | Admin | Owner | مقيد |
| المشاريع | حسب التعاقد | Developer | Developer | Developer Admin | Developer Director | مقيد |
| الوحدات | حسب الصلاحية | Inventory | Inventory | Inventory | Pricing/Inventory Manager | مقيد |
| Leads | حسب الملكية | System/CRM | Owner/Manager | مقيد | لا ينطبق | مقيد |
| الحجوزات | حسب الصفقة | Sales | Back Office | ممنوع بعد الاعتماد | Developer/Manager | مقيد |
| العقود | حسب العلاقة | Contracts | Contracts | Versioned only | Legal/Authorized | مقيد |
| العمولات | حسب الاستحقاق | System/Finance | Finance | ممنوع بعد الصرف | Commission Manager | Finance only |
| أوامر العمل | حسب الإسناد | Operations | Assigned Users | قبل الإغلاق | Supervisor/QA | مقيد |
| الموردون | حسب المؤسسة | Procurement | Procurement | Compliance only | Vendor Manager | مقيد |
| الفواتير | حسب المؤسسة | Finance | Finance | ممنوع بعد الترحيل | Finance Manager | Finance only |

---

# 16. قواعد أمنية إلزامية

- أقل صلاحية افتراضيًا.
- فصل الواجبات المالية.
- منع المستخدم من اعتماد معاملة أنشأها عند الحاجة.
- تسجيل Audit Log لكل تعديل حساس.
- المصادقة الثنائية للأدوار الحساسة.
- إخفاء أجزاء من الهاتف والهوية والحساب البنكي.
- جلسات وصول مؤقت للدعم الفني.
- مراجعة دورية للصلاحيات.
- تعطيل المستخدم فور مغادرته الشركة.
- منع التصدير الجماعي إلا بتصريح.
- Watermark للملفات الحساسة.
- تنبيه عند الدخول من جهاز أو دولة غير معتادة.

---

# 17. هيكل الدور داخل قاعدة البيانات

كل دور يجب أن يحتوي على:

- اسم الدور.
- نوع المؤسسة.
- مستوى الدور.
- النطاق.
- الوحدات المسموحة.
- العمليات المسموحة.
- حدود الاعتماد المالية.
- المشاريع أو الفروع المسموحة.
- صلاحية رؤية البيانات الحساسة.
- صلاحية التصدير.
- صلاحية التفويض.
- تاريخ البداية والنهاية.
- المستخدم الذي أنشأ الدور.
- سجل التعديلات.


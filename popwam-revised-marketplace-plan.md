# POPWAM — Verified Real Estate Marketplace
## Revised Execution Plan

> **نسخة نهائية للتنفيذ** — مبنية على مراجعة كاملة للملفات السابقة مع إعادة الهيكلة بناءً على النموذج التجاري الفعلي.
> الملف مرجع تقني + تجاري + تنفيذي للفريق كامل.

---

## جدول المحتويات

1. Executive Summary
2. Final Business Model
3. Final Account Types & Roles
4. Verification & Compliance Layer
5. Revised Core Data Model
6. Revised Module Map
7. Critical Flows
8. Permissions Matrix
9. What To Keep From Existing Files
10. What Must Be Changed
11. What Is Missing
12. Execution Roadmap For 6 Teams
13. Sprint Plan

14. First 30 Days Plan
15. Final Recommendations

---

# 1. Executive Summary

## ما الذي نبنيه فعلاً؟

POPWAM ليست CRM عقاري. POPWAM هي **منصة وساطة عقارية موثقة ومتعددة الأطراف** تعمل كـ Regulated Marketplace يجمع ثلاثة أطراف رئيسية في بيئة واحدة خاضعة للرقابة:

- **المطورون العقاريون (Developers):** يضيفون المشاريع، الوحدات، الأسعار، خطط الدفع، وقواعد العمولة. يتحكمون في من يرى ماذا.
- **شركات وأفراد الوساطة (Brokerages & Brokers):** يتصفحون المشاريع المسموح لهم بها، يسجلون leads، يفتحون طلبات صفقات، ويتتبعون عمولاتهم.
- **العملاء (Clients):** يُدعون لغرفة الصفقة فقط، لا يتعاملون مع المنصة بشكل مستقل في الوقت الحالي.

المنصة نفسها (POPWAM) هي **الطرف الرابع الصامت** الذي يضمن قواعد اللعبة: التحقق، منع سرقة العملاء، تسجيل العمولات، وإدارة النزاعات.

## لماذا هذا ليس CRM عادياً؟

| CRM عادي | POPWAM |
|----------|--------|
| شركة واحدة تدير بياناتها | أطراف متعددة تتفاعل في نفس النظام |
| Lead يخص قسم المبيعات | Lead له owner محمي قانونياً في النظام |
| صفقة داخلية | صفقة بين كيانات مختلفة بعقود وعمولات |
| لا يوجد Marketplace | سوق منظم بقواعد وصلاحيات وتحقق |
| لا يوجد Compliance | التحقق شرط أساسي للدخول |
| Tenant منعزل | Cross-tenant interactions مضبوطة |

## الفرق بين الأطراف

```
POPWAM (Platform Owner)
    ↓ يوثق ويراقب
Developer Company ←→ Brokerage Company
    ↓                     ↓
Projects/Units        Brokers
    ↓                     ↓
         Deal Room (يجمع الاثنين + Client)
              ↓
           Commission
```

- **Developer:** الطرف الذي يملك المشروع والوحدة. يتحكم في الظهور والأسعار والعمولات.
- **Brokerage Company:** الكيان القانوني المسؤول عن البروكرز التابعين له. لها عقود مع المطورين.
- **Broker:** الفرد المرتبط بشركة وساطة. يرى المشاريع ويعمل على الـ leads والصفقات.
- **Individual Broker:** بروكر مستقل بلا شركة وساطة — صلاحيات أقل ومراجعة أشد.
- **Client:** العميل النهائي، يظهر في Deal Room فقط، لا يلوغ إلى المنصة مستقلاً.

---

# 2. Final Business Model

## POPWAM Platform Owner

POPWAM تمتلك المنصة وتتحكم في كل شيء:
- من يدخل ومن يُرفض (Verification)
- قواعد الظهور والوصول
- حل النزاعات
- تحصيل الاشتراكات

## طبقات المشتركين

### Developer Companies
- يدفعون **اشتراكاً شهرياً/سنوياً** بناءً على:
  - عدد المشاريع Active
  - عدد الوحدات في المخزون
  - مستوى الوصول (Basic / Professional / Enterprise)
- يوافقون على شروط المنصة ويوقعون اتفاقية رقمية
- يعطون Commission Rules لكل مشروع

### Brokerage Companies
- يدفعون **اشتراكاً شهرياً** بناءً على عدد البروكرز

### Brokers (تابعين لشركة)
- الاشتراك يُدفع من شركة الوساطة أو مقسم عليهم
- لا يدفعون مباشرة للمنصة في الغالب

### Individual Brokers
- يدفعون اشتراكاً فردياً بسعر أعلى نسبياً
- يحتاجون تحقق أشد
- صلاحيات محدودة حتى تثبت السجل

## نماذج الإيراد

```
1. Subscriptions (الأساسي)
   Developer Plans:    Starter / Pro / Enterprise
   Brokerage Plans:    Basic / Growth / Scale
   Individual Broker:  Monthly flat fee

2. Success Fee (اختياري — Phase 2)
   نسبة صغيرة من قيمة كل صفقة مكتملة
   مثلاً: 0.1% - 0.5% من قيمة الوحدة

3. Platform Visibility (اختياري — Phase 2)
   المطور يدفع لرفع ظهور مشروعه في الـ Marketplace
   مثل Featured Project

4. Premium Data / Analytics (Phase 3)
   تقارير السوق، تحليل الأسعار، مقارنة المنافسين
```

---

# 3. Final Account Types & Roles

## هيكل الـ Roles الكامل

```
PLATFORM LEVEL:
├── platform_owner          (POPWAM Team)
├── platform_admin          (POPWAM Admin)
├── platform_support        (POPWAM Support)
└── platform_auditor        (POPWAM Legal/Finance)

DEVELOPER LEVEL:
├── developer_owner         (أصحاب الشركة)
├── developer_admin         (مدراء تنفيذيون)
├── developer_sales_manager (مدير مبيعات)
└── developer_sales_agent   (موظف مبيعات)

BROKERAGE LEVEL:
├── brokerage_owner         (صاحب شركة الوساطة)
├── brokerage_admin         (مدير شركة الوساطة)
└── broker                  (البروكر التابع للشركة)

INDIVIDUAL:
└── individual_broker       (بروكر مستقل)

CLIENT:
└── client                  (يُنشأ من Deal Room فقط)
```

## صلاحيات كل Role — ملخص

| Role | يرى | يضيف | يوافق | يبيع |
|------|-----|------|-------|------|
| platform_owner | كل شيء | كل شيء | كل شيء | لا |
| platform_support | كل شيء (read) | لا | النزاعات فقط | لا |
| developer_owner | مشاريعه كلها | مشاريع + وحدات + قواعد عمولة | صفقات + طلبات بروكر | نعم (mark sold) |
| developer_sales_manager | مشاريع assigned | — | طلبات بروكر + Deal Room | نعم |
| developer_sales_agent | مشاريع assigned | leads للعملاء | — | لا |
| brokerage_owner | كل inventory مسموح + بروكرز | — | طلبات بروكرز تابعين | لا |
| brokerage_admin | نفس brokerage_owner | — | نفسه | لا |
| broker | inventory مسموح فقط | leads + deal requests | — | لا |
| individual_broker | مشاريع Open فقط | leads + deal requests | — | لا |
| client | مشاريعه المرتبط بها | — | — | لا |

---

# 4. Verification & Compliance Layer

## لماذا هذا الـ Layer يجب أن يُبنى أولاً

قبل أي Marketplace يُفتح، يجب التأكد من هوية كل طرف. بدون التحقق:
- لا يمكن تحديد من يستحق العمولة
- لا يمكن حل النزاعات
- لا يمكن تطبيق Lead Ownership
- المنصة قانونياً مسؤولة عن كل ما يجري فيها

## مستندات التحقق

### للمطور العقاري (Developer)
```
مطلوب:
  1. السجل التجاري (Commercial Registration) — ساري
  2. البطاقة الضريبية / VAT Number
  3. بيانات الممثل القانوني (National ID + صلاحية التوقيع)
  4. عقد إيجار أو ملكية المقر
  5. ترخيص مزاولة النشاط العقاري (حسب البلد)
  6. نموذج وافقة على شروط المنصة موقع رقمياً

موثق إضافي (لمشاريع كبرى):
  - عقد المشروع مع هيئة التطوير (مصر: NUCA, OC, إلخ)
  - تصاريح البناء
```

### لشركة الوساطة (Brokerage Company)
```
مطلوب:
  1. السجل التجاري ساري
  2. رخصة وساطة عقارية (مصر: مسجلة في الشهر العقاري / UAE: RERA)
  3. بيانات المالك / المدير المسؤول
  4. قائمة البروكرز المعتمدين (يمكن إضافتهم لاحقاً)
  5. موافقة على شروط المنصة
```

### للبروكر الفردي (Individual Broker)
```
مطلوب:
  1. بطاقة هوية وطنية سارية
  2. شهادة خبرة أو ترخيص وساطة فردي (إن وجد)
  3. صورة شخصية واضحة (بتستخدم في Lead Claim verification)
  4. رقم تليفون verified (OTP)
  5. ضمان إضافي يختاره كل سوق (مصر/UAE)
```

## حالات التحقق (Verification Statuses)

```
DRAFT              → الكيان سجل لكن لم يكمل الطلب
PENDING_REVIEW     → رفع المستندات وينتظر المراجعة
UNDER_REVIEW       → فريق POPWAM يراجع الآن
APPROVED           → معتمد ويمكنه البدء
REJECTED           → مرفوض مع سبب
SUSPENDED          → موقوف مؤقتاً (مخالفة / غير ملتزم)
REVOKED            → إلغاء نهائي
PENDING_RENEWAL    → المستندات قاربت على الانتهاء
```

## Flow الموافقة والرفض

```
[Signup]
  → Entity creates account
  → يملأ profile + يرفع documents
  → status → PENDING_REVIEW

[POPWAM Admin Dashboard]
  → بيشوف queue المنتظرين
  → بيفتح الملف، يراجع المستندات
  → APPROVE: status → APPROVED + welcome email + access granted
  → REJECT: status → REJECTED + rejection_reason + allowed to re-submit
  → REQUEST_MORE: بيطلب مستندات إضافية

[Suspension Flow]
  → POPWAM Admin يضغط Suspend
  → يكتب السبب + المدة
  → status → SUSPENDED
  → كل users الكيان تنسجل sessions
  → بعد انتهاء المدة أو حل المشكلة → APPROVED مجدداً
```

---

# 5. Revised Core Data Model

## طبقة Organizations

```sql
-- الكيان الأساسي لكل Developer أو Brokerage
organizations (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE,
  type            TEXT,   -- DEVELOPER | BROKERAGE | PLATFORM
  country         TEXT,   -- EG | AE | SA | KW | BH | QA
  city            TEXT,
  status          TEXT,   -- DRAFT|PENDING_REVIEW|APPROVED|SUSPENDED|REVOKED
  plan            TEXT,   -- starter|pro|enterprise
  plan_expires_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ
)

organization_profiles (
  id                      TEXT PRIMARY KEY,
  organization_id         TEXT REFERENCES organizations(id),
  legal_name              TEXT,
  trade_name              TEXT,
  commercial_reg_number   TEXT,
  tax_number              TEXT,
  website                 TEXT,
  phone                   TEXT,
  email                   TEXT,
  address                 TEXT,
  logo_url                TEXT,
  description             TEXT,
  social_links            JSONB  -- { linkedin, instagram, facebook }
)

organization_verifications (
  id                  TEXT PRIMARY KEY,
  organization_id     TEXT REFERENCES organizations(id),
  document_type       TEXT,   -- COMMERCIAL_REG | TAX_CARD | BROKER_LICENSE | etc.
  document_url        TEXT,   -- GCS URL
  expiry_date         DATE,
  status              TEXT,   -- PENDING | VERIFIED | REJECTED | EXPIRED
  verified_by         TEXT,   -- platform_admin user_id
  verified_at         TIMESTAMPTZ,
  rejection_reason    TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
)

-- كل profile خاص بالنوع
developer_profiles (
  id                      TEXT PRIMARY KEY,
  organization_id         TEXT REFERENCES organizations(id),
  years_in_market         INT,
  total_units_delivered   INT,
  portfolio_url           TEXT,
  rera_registration       TEXT,   -- UAE
  nuca_registration       TEXT,   -- Egypt
  active_projects_count   INT,
  settings                JSONB   -- commission defaults, visibility defaults
)

brokerage_profiles (
  id                      TEXT PRIMARY KEY,
  organization_id         TEXT REFERENCES organizations(id),
  broker_license_number   TEXT,
  rera_brokerage_number   TEXT,
  max_brokers_allowed     INT,
  active_brokers_count    INT
)
```

## طبقة Users

```sql
users (
  id              TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(id),  -- null لو platform team
  email           TEXT UNIQUE,
  phone           TEXT,
  password_hash   TEXT,
  name            TEXT,
  avatar_url      TEXT,
  role            TEXT,   -- see roles list section 3
  is_active       BOOL DEFAULT true,
  email_verified  BOOL DEFAULT false,
  phone_verified  BOOL DEFAULT false,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
)

broker_profiles (
  id                    TEXT PRIMARY KEY,
  user_id               TEXT REFERENCES users(id),
  organization_id       TEXT,   -- الشركة اللي تابع لها (null لو individual)
  is_individual         BOOL DEFAULT false,
  national_id           TEXT,
  national_id_url       TEXT,
  years_experience      INT,
  specializations       TEXT[],  -- residential|commercial|land
  verification_status   TEXT,   -- statuses from section 4
  verified_by           TEXT,
  restriction_level     TEXT DEFAULT 'STANDARD',  -- STANDARD|RESTRICTED|PROBATION
  deal_count            INT DEFAULT 0,
  success_rate          FLOAT DEFAULT 0,
  created_at            TIMESTAMPTZ
)
```

## طبقة Projects & Inventory

```sql
projects (
  id                TEXT PRIMARY KEY,
  developer_id      TEXT REFERENCES organizations(id),
  name              TEXT NOT NULL,
  slug              TEXT,
  type              TEXT,  -- COMPOUND|BUILDING|TOWER|VILLA_COMPOUND|COMMERCIAL
  status            TEXT,  -- DRAFT|ACTIVE|SOLD_OUT|SUSPENDED|ARCHIVED
  city              TEXT,
  district          TEXT,
  location          GEOGRAPHY(POINT, 4326),  -- PostGIS
  address           TEXT,
  delivery_date     DATE,
  description       TEXT,
  cover_image_url   TEXT,
  images            TEXT[],
  videos            TEXT[],
  brochure_url      TEXT,
  amenities         TEXT[],
  visibility        TEXT DEFAULT 'PRIVATE',
  -- PRIVATE|APPROVED_BROKERAGES|OPEN_MARKETPLACE|SELECTED_BROKERS|HIDDEN
  is_featured       BOOL DEFAULT false,
  created_at        TIMESTAMPTZ DEFAULT NOW()
)

project_phases (
  id              TEXT PRIMARY KEY,
  project_id      TEXT REFERENCES projects(id),
  name            TEXT,   -- Phase 1, Phase 2
  delivery_date   DATE,
  total_units     INT,
  available_units INT,
  status          TEXT
)

inventory_units (
  id              TEXT PRIMARY KEY,
  project_id      TEXT REFERENCES projects(id),
  phase_id        TEXT REFERENCES project_phases(id),
  developer_id    TEXT REFERENCES organizations(id),
  unit_number     TEXT NOT NULL,
  unit_type       TEXT,   -- APARTMENT|VILLA|TOWNHOUSE|OFFICE|SHOP|STUDIO
  floor           INT,
  area_sqm        FLOAT,
  bedrooms        INT,
  bathrooms       INT,
  finishing       TEXT,   -- CORE_SHELL|SEMI_FINISHED|FULLY_FINISHED|FURNISHED
  view            TEXT,
  base_price      DECIMAL,
  currency        TEXT DEFAULT 'EGP',
  price_per_sqm   DECIMAL,
  status          TEXT,   -- AVAILABLE|RESERVED|SOLD|HELD
  visibility      TEXT,   -- يرث من project لكن يمكن override
  images          TEXT[],
  floor_plan_url  TEXT,
  features        JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
)

unit_availability (
  id              TEXT PRIMARY KEY,
  unit_id         TEXT REFERENCES inventory_units(id),
  held_by         TEXT,   -- lead_claim_id OR deal_id
  held_type       TEXT,   -- LEAD_CLAIM | RESERVATION | SOLD
  held_at         TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,  -- null لو Sold
  released_at     TIMESTAMPTZ
)

payment_plans (
  id              TEXT PRIMARY KEY,
  project_id      TEXT REFERENCES projects(id),
  unit_id         TEXT,   -- null = applies to whole project
  name            TEXT,
  down_payment_pct FLOAT,
  installment_months INT,
  installment_pct  FLOAT,
  on_delivery_pct  FLOAT,
  maintenance_fee  FLOAT,
  is_active        BOOL DEFAULT true,
  conditions       TEXT
)
```

## طبقة Visibility & Access Rules

```sql
-- من يُسمح له يرى مشروع معين
broker_access_rules (
  id              TEXT PRIMARY KEY,
  project_id      TEXT REFERENCES projects(id),
  developer_id    TEXT REFERENCES organizations(id),
  grantee_type    TEXT,   -- BROKERAGE | BROKER
  grantee_id      TEXT,   -- organization_id أو user_id
  access_level    TEXT,   -- VIEW | VIEW_PRICE | FULL
  granted_at      TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  granted_by      TEXT    -- developer user_id
)

-- اتفاقية رسمية بين Developer و Brokerage
developer_brokerage_agreements (
  id                  TEXT PRIMARY KEY,
  developer_id        TEXT REFERENCES organizations(id),
  brokerage_id        TEXT REFERENCES organizations(id),
  status              TEXT,  -- PENDING | ACTIVE | SUSPENDED | TERMINATED
  commission_override JSONB, -- لو الاتفاقية بتغير الـ default commission
  signed_at           TIMESTAMPTZ,
  expires_at          TIMESTAMPTZ,
  terms_url           TEXT,
  created_at          TIMESTAMPTZ
)
```

## طبقة Lead Ownership

```sql
clients (
  id              TEXT PRIMARY KEY,
  name            TEXT,
  phone           TEXT NOT NULL,  -- المعرف الأساسي
  phone_hash      TEXT UNIQUE,    -- hash مشفر للمقارنة بدون كشف الرقم
  email           TEXT,
  nationality     TEXT,
  budget_min      DECIMAL,
  budget_max      DECIMAL,
  interests       JSONB,
  created_at      TIMESTAMPTZ
)

leads (
  id              TEXT PRIMARY KEY,
  broker_id       TEXT REFERENCES users(id),
  brokerage_id    TEXT REFERENCES organizations(id),
  client_id       TEXT REFERENCES clients(id),
  project_id      TEXT REFERENCES projects(id),
  unit_id         TEXT REFERENCES inventory_units(id),
  source          TEXT,  -- MANUAL|META|TIKTOK|GOOGLE|REFERRAL
  status          TEXT,  -- NEW|CONTACTED|INTERESTED|RESERVATION|WON|LOST
  notes           TEXT,
  created_at      TIMESTAMPTZ
)

-- قلب نظام حماية البروكر
lead_claims (
  id                  TEXT PRIMARY KEY,
  lead_id             TEXT REFERENCES leads(id),
  broker_id           TEXT REFERENCES users(id),
  brokerage_id        TEXT REFERENCES organizations(id),
  client_phone_hash   TEXT,   -- hash الرقم (مش الرقم نفسه)
  project_id          TEXT REFERENCES projects(id),
  status              TEXT,   -- ACTIVE|EXPIRED|RELEASED|DISPUTED|WON
  claimed_at          TIMESTAMPTZ DEFAULT NOW(),
  expires_at          TIMESTAMPTZ,  -- +30/60/90 يوم حسب الإعداد
  protection_days     INT DEFAULT 60,
  released_at         TIMESTAMPTZ,
  release_reason      TEXT
)

-- عند conflict بين بروكرين على نفس العميل + مشروع
lead_claim_conflicts (
  id                    TEXT PRIMARY KEY,
  first_claim_id        TEXT REFERENCES lead_claims(id),
  second_claim_id       TEXT REFERENCES lead_claims(id),
  client_phone_hash     TEXT,
  project_id            TEXT,
  detected_at           TIMESTAMPTZ,
  resolution            TEXT,   -- FIRST_WINS|ESCALATED|MANUAL_REVIEW
  resolved_by           TEXT,
  resolved_at           TIMESTAMPTZ,
  notes                 TEXT
)
```

## طبقة Deal Room

```sql
reservation_requests (
  id              TEXT PRIMARY KEY,
  broker_id       TEXT REFERENCES users(id),
  lead_id         TEXT REFERENCES leads(id),
  unit_id         TEXT REFERENCES inventory_units(id),
  project_id      TEXT REFERENCES projects(id),
  developer_id    TEXT REFERENCES organizations(id),
  message         TEXT,
  status          TEXT,  -- PENDING|APPROVED|REJECTED|CANCELLED
  submitted_at    TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by     TEXT,
  reviewed_at     TIMESTAMPTZ,
  rejection_reason TEXT
)

deal_rooms (
  id                TEXT PRIMARY KEY,
  reservation_id    TEXT REFERENCES reservation_requests(id),
  unit_id           TEXT REFERENCES inventory_units(id),
  project_id        TEXT REFERENCES projects(id),
  developer_id      TEXT REFERENCES organizations(id),
  brokerage_id      TEXT REFERENCES organizations(id),
  broker_id         TEXT REFERENCES users(id),
  client_id         TEXT REFERENCES clients(id),
  status            TEXT,  -- OPEN|NEGOTIATION|PENDING_APPROVAL|APPROVED|SOLD|CANCELLED|DISPUTED
  deal_value        DECIMAL,
  currency          TEXT,
  payment_plan_id   TEXT,
  opened_at         TIMESTAMPTZ DEFAULT NOW(),
  sold_at           TIMESTAMPTZ,
  cancelled_at      TIMESTAMPTZ
)

deal_room_participants (
  id              TEXT PRIMARY KEY,
  deal_room_id    TEXT REFERENCES deal_rooms(id),
  user_id         TEXT REFERENCES users(id),
  role            TEXT,  -- BROKER|DEVELOPER_SALES|SALES_MANAGER|CLIENT|PLATFORM_SUPPORT
  joined_at       TIMESTAMPTZ,
  left_at         TIMESTAMPTZ,
  invited_by      TEXT
)

deal_room_messages (
  id              TEXT PRIMARY KEY,
  deal_room_id    TEXT REFERENCES deal_rooms(id),
  sender_id       TEXT REFERENCES users(id),
  message_type    TEXT,   -- TEXT|FILE|SYSTEM|STATUS_CHANGE
  content         TEXT,
  file_url        TEXT,
  is_visible_to   TEXT[], -- role list (للتحكم في من يرى رسالة معينة)
  sent_at         TIMESTAMPTZ DEFAULT NOW()
)

-- الصفقة الرسمية
deals (
  id                  TEXT PRIMARY KEY,
  deal_room_id        TEXT REFERENCES deal_rooms(id),
  unit_id             TEXT REFERENCES inventory_units(id),
  client_id           TEXT REFERENCES clients(id),
  developer_id        TEXT REFERENCES organizations(id),
  brokerage_id        TEXT REFERENCES organizations(id),
  broker_id           TEXT REFERENCES users(id),
  deal_value          DECIMAL,
  currency            TEXT,
  payment_plan_id     TEXT,
  commission_rule_id  TEXT,
  status              TEXT,  -- PENDING_APPROVAL|APPROVED|COMPLETED|CANCELLED|DISPUTED
  approved_by         TEXT,
  approved_at         TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  contract_url        TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ
)
```

## طبقة Commission

```sql
commission_rules (
  id                  TEXT PRIMARY KEY,
  developer_id        TEXT REFERENCES organizations(id),
  project_id          TEXT,   -- null = applies to all projects
  unit_type           TEXT,   -- null = applies to all types
  rule_type           TEXT,   -- PERCENTAGE|FLAT_AMOUNT
  total_commission_pct FLOAT, -- مثلاً: 3%
  platform_cut_pct    FLOAT,  -- نسبة POPWAM
  brokerage_cut_pct   FLOAT,  -- نسبة الشركة
  broker_cut_pct      FLOAT,  -- نسبة البروكر
  payment_trigger     TEXT,   -- ON_RESERVATION|ON_CONTRACT|ON_DELIVERY|MILESTONE
  is_active           BOOL DEFAULT true,
  effective_from      DATE,
  effective_to        DATE
)

commission_entries (
  id                  TEXT PRIMARY KEY,
  deal_id             TEXT REFERENCES deals(id),
  commission_rule_id  TEXT REFERENCES commission_rules(id),
  developer_id        TEXT REFERENCES organizations(id),
  brokerage_id        TEXT REFERENCES organizations(id),
  broker_id           TEXT REFERENCES users(id),
  unit_id             TEXT REFERENCES inventory_units(id),
  deal_value          DECIMAL,
  total_commission    DECIMAL,
  platform_amount     DECIMAL,
  brokerage_amount    DECIMAL,
  broker_amount       DECIMAL,
  currency            TEXT,
  status              TEXT,   -- PENDING|APPROVED|PAID|DISPUTED
  approved_by         TEXT,
  paid_at             TIMESTAMPTZ,
  notes               TEXT,
  created_at          TIMESTAMPTZ
)

-- سجل كل عملية مالية
ledger_entries (
  id                TEXT PRIMARY KEY,
  organization_id   TEXT REFERENCES organizations(id),
  user_id           TEXT,
  type              TEXT,   -- DEBIT|CREDIT
  category          TEXT,   -- COMMISSION|SUBSCRIPTION|REFUND|FEE
  amount            DECIMAL,
  currency          TEXT,
  reference_type    TEXT,   -- deal|commission|subscription
  reference_id      TEXT,
  description       TEXT,
  balance_after     DECIMAL,
  created_at        TIMESTAMPTZ DEFAULT NOW()
)
```

## طبقة Disputes

```sql
disputes (
  id              TEXT PRIMARY KEY,
  type            TEXT,  -- COMMISSION|LEAD_CLAIM|DEAL|PLATFORM_CONDUCT
  raised_by       TEXT REFERENCES users(id),
  against_type    TEXT,  -- USER|ORGANIZATION
  against_id      TEXT,
  deal_id         TEXT,
  lead_claim_id   TEXT,
  description     TEXT NOT NULL,
  evidence_urls   TEXT[],
  status          TEXT,  -- OPEN|UNDER_REVIEW|RESOLVED|ESCALATED|CLOSED
  assigned_to     TEXT,  -- platform_support user_id
  resolution      TEXT,
  resolved_by     TEXT,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
)
```

## طبقة Audit & Compliance

```sql
audit_logs (
  id              TEXT PRIMARY KEY,
  organization_id TEXT,
  user_id         TEXT,
  action          TEXT,  -- e.g.: "deal_room.open", "unit.mark_sold", "claim.conflict_detected"
  entity_type     TEXT,
  entity_id       TEXT,
  before_state    JSONB,
  after_state     JSONB,
  ip_address      TEXT,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
)
```

---

# 6. Revised Module Map

## Platform Core
```
المسؤول: Team 1 (Backend Core)
يشمل:
  - Auth (JWT + Refresh + OTP)
  - Multi-tenant session management
  - RBAC (Roles + Permissions)
  - Audit Logs
  - Notifications (Push + Email + SMS)
  - File Upload (GCS)
  - Admin Shell (Platform Admin Dashboard)
```

## Organization & Verification
```
المسؤول: Team 1 + Team 3
يشمل:
  - Organization CRUD
  - Document upload + review queue
  - Verification workflow (PENDING → APPROVED)
  - Subscription management
  - Organization profiles (developer/brokerage)
```

## Identity / Auth / RBAC
```
المسؤول: Team 1
يشمل:
  - Login / Register / Forgot Password
  - Email + Phone verification
  - Cross-organization permissions (platform admins)
  - Tenant-scoped permissions
  - Session management (Redis)
```

## Developer Management
```
المسؤول: Team 2
يشمل:
  - Developer onboarding flow
  - Developer profile + settings
  - Commission rules management
  - Project publishing controls
  - Brokerage agreements management
```

## Brokerage Management
```
المسؤول: Team 2
يشمل:
  - Brokerage onboarding flow
  - Broker management (add/remove)
  - Broker profiles + verification
  - Individual broker onboarding
  - Broker performance tracking
```

## Projects & Inventory
```
المسؤول: Team 2
يشمل:
  - Projects CRUD
  - Project phases
  - Inventory units
  - Unit availability
  - Payment plans
  - Visibility rules
  - Broker access rules
  - Map integration (PostGIS)
```

## Broker Marketplace
```
المسؤول: Team 2 + Team 4 (Mobile)
يشمل:
  - Inventory search + filters
  - Map-based search (Draw polygon)
  - Project detail view
  - Unit detail view
  - Bookmark/favorites
  - "Request Deal" button
```

## Lead Ownership System
```
المسؤول: Team 2
يشمل:
  - Lead creation + claim
  - Phone hash system (منع الكشف)
  - Duplicate detection engine
  - Conflict resolution
  - Claim expiry management
  - Broker ownership timeline
```

## Deal Room
```
المسؤول: Team 2 + Team 4
يشمل:
  - Reservation request flow
  - Deal room creation
  - Participant management
  - Chat inside deal room (Stream Chat)
  - Document sharing
  - Approval workflow
  - Sold flow
  - Status transitions
```

## Commission & Payments
```
المسؤول: Team 2 + Team 6
يشمل:
  - Commission rules engine
  - Commission entries
  - Payment (Paymob EGP + Tap Gulf)
  - InstaPay integration
  - Subscription billing
  - Ledger system
  - Commission reports
```

## CRM (داخل كل Organization)
```
المسؤول: Team 2
يشمل:
  - Client management
  - Lead pipeline (لكل Broker/Brokerage)
  - Follow-ups + reminders
  - Call logs
  - Internal CRM notes
  - Pipeline views
```

## Marketing
```
المسؤول: Team 5
يشمل:
  - Landing pages builder
  - Forms + lead capture
  - UTM tracking
  - Tracking pixels (Meta/TikTok/Google)
  - Campaign analytics
```

## Public Web / Domains
```
المسؤول: Team 5
يشمل:
  - POPWAM public marketplace (main domain)
  - Developer public pages (subdomain/custom domain)
  - Project public pages (SEO)
  - Domain verification (Cloudflare)
  - Custom SSL
```

## HR + Attendance
```
المسؤول: Team 1 + Team 4
يشمل:
  - Employees management
  - Shifts + Leaves
  - GPS Attendance check-in/out
  - Risk Score engine
  - Device enrollment
  - Review dashboard
```

## Accounting & Legal
```
المسؤول: Team 2
يشمل:
  - Invoices
  - Expense tracking
  - Payroll
  - Financial reports
  - Contracts
  - Legal documents
  - Case management
```

## AI / DVR
```
المسؤول: Team 6
يشمل:
  - Face matching (InsightFace)
  - Person detection (YOLOv8)
  - DVR confirmation
  - Risk score AI component
  - Async job queue (RabbitMQ)
```

## Reports & Analytics
```
المسؤول: Team 3 + Team 2
يشمل:
  - Platform-level reports (POPWAM)
  - Developer reports (sales velocity, unit status)
  - Brokerage reports (broker performance)
  - Broker personal reports
  - Commission reports
  - Marketplace analytics
```

---

# 7. Critical Flows

## Flow 1 — Developer Onboarding

```
1. Developer يفتح popwam.com/register
2. يختار "Developer Company"
3. يملأ: Company name, country, phone, email
4. يوصله OTP على التليفون
5. ينشئ حساب → status: DRAFT

6. يُكمل profile:
   - legal name, trade name, commercial reg
   - يرفع المستندات المطلوبة (section 4)
7. يضغط "Submit for Review" → status: PENDING_REVIEW

8. POPWAM Admin بيشوف في قائمة المراجعة
9. بيفتح الملف، يراجع كل مستند
10. APPROVE → status: APPROVED
    - welcome email + onboarding guide
    - Access: Developer Admin Dashboard
11. REJECT → status: REJECTED
    - email بسبب مفصل + طلب إعادة رفع
```

## Flow 2 — Brokerage Onboarding

```
نفس flow الـ Developer مع اختلافات:
- type: BROKERAGE
- مستندات الوساطة (رخصة الوساطة)
- بعد APPROVE → يقدر يضيف Brokers
- كل Broker يضيفه → بيوصله invite email
```

## Flow 3 — Broker Onboarding

```
الطريق الأول (تابع لشركة وساطة):
  1. Brokerage Admin بيضغط "Add Broker"
  2. بيدخل email البروكر
  3. البروكر بيوصله invite link
  4. بيكمل profile: اسم، صورة، هوية
  5. status: PENDING (داخل شركة الوساطة)
  6. Brokerage Admin بيوافق → APPROVED

الطريق الثاني (Individual Broker):
  1. يسجل من popwam.com/register كـ Individual Broker
  2. يرفع: هوية + صورة + أي شهادة خبرة
  3. POPWAM Admin يراجع ويوافق
  4. status: APPROVED مع restriction_level = PROBATION
  5. بعد 3 صفقات ناجحة → STANDARD
```

## Flow 4 — Developer Adds Project

```
1. Developer Sales Manager يفتح Dashboard
2. يضغط "New Project"
3. يملأ: اسم، نوع، موقع على الخريطة، صور، videos
4. Project status: DRAFT

5. يضيف Phases + Units:
   - Unit type, area, floor, price, finishing
   - كل unit بيترفع بـ status: AVAILABLE

6. يضيف Payment Plans

7. يضيف Commission Rules:
   - مثلاً: "3% from unit price, paid on contract"
   - POPWAM cut: 0.5%, Brokerage: 1.5%, Broker: 1%

8. يختار Visibility:
   - PRIVATE → بس فريق المطور
   - APPROVED_BROKERAGES → الشركات اللي عندها agreement
   - OPEN_MARKETPLACE → كل البروكرز المعتمدين
   - SELECTED_BROKERS → list معينة

9. يضغط Publish → Project status: ACTIVE
```

## Flow 5 — Broker يتصفح ويلقي Unit

```
1. Broker يفتح Mobile App أو Web
2. Marketplace بيعرضله projects مسموح له بيها فقط

3. ممكن:
   - يبحث بالفلتر (city, type, price)
   - يرسم منطقة على الخريطة → يشوف units جوّاها

4. بيضغط على Project → بيشوف:
   - تفاصيل المشروع + صور
   - Units المتاحة + أسعار + payment plans
   - Commission المحددة (لو permitted)

5. بيضغط على Unit → Unit Detail
6. بيضغط "Submit Deal Request" → يفتح Reservation Request form
```

## Flow 6 — Lead Claim (قلب حماية البروكر)

```
1. Broker بيضيف Lead جديد:
   - بيدخل اسم العميل + رقم التليفون + المشروع

2. النظام:
   a. بيعمل hash للرقم: SHA256(phone + salt)
   b. بيدور في lead_claims:
      WHERE client_phone_hash = ? AND project_id = ? AND status = 'ACTIVE'
   c. لو ملقاش: ينشئ lead_claim جديد
      expires_at = NOW() + 60 days
   d. لو لقى claim قديم لنفس البروكر: يحدث الـ lead
   e. لو لقى claim لبروكر آخر:
      → ينشئ lead_claim_conflict
      → يبلغ البروكر الثاني: "هذا العميل مسجل مسبقاً لهذا المشروع"
      → مش بيكشف اسم البروكر الأول
      → البروكر الثاني مش يعرف يكمل

3. لو البروكر الأول لم يحرز تقدم بعد expiry:
   → lead_claim يتنهي تلقائياً
   → البروكر الثاني يقدر يسجل نفس العميل
```

## Flow 7 — Deal Request & Deal Room

```
1. Broker يضغط "Submit Deal Request" على Unit
2. يملأ: Lead/Client details, preferred payment plan, message

3. Reservation Request بيتخزن → status: PENDING
4. Developer Sales Manager بياخد notification

5. Developer Sales Manager يفتح Request:
   - بيشوف: بيانات البروكر + شركته + العميل (مخفية جزئياً)
   - بيشوف: الـ lead claim (هل محمي؟)
   - يقدر: APPROVE أو REJECT مع سبب

6. لو APPROVE:
   → ينشئ Deal Room
   → يدعو: Broker + Developer Sales Agent + يحجز unit (status: RESERVED)
   → Broker بياخد notification: "تم قبول طلبك، تفضل غرفة الصفقة"

7. جوه Deal Room:
   - Chat مشترك (Stream SDK)
   - Documents section
   - Unit & Price summary
   - Timeline & status

8. Invite Client:
   → Developer أو Broker يضغط "Invite Client"
   → بيبعتله SMS/Email برابط
   → Client بيفتح Deal Room على موبايله (read-only أو limited interaction)

9. لما يتفقوا:
   → Developer Sales Manager يضغط "Mark as Sold"
   → unit_availability → SOLD
   → Deal record ينشأ
   → Commission entries تنشأ تلقائياً
   → Deal Room يُغلق
```

## Flow 8 — Commission Tracking

```
1. عند Mark as Sold:
   → النظام يجيب commission_rule الخاص بالمشروع/الوحدة
   → يحسب:
       deal_value = 2,500,000 EGP
       total_commission_pct = 3%
       total_commission = 75,000 EGP

       platform_amount    = 75,000 * 0.5/3  = 12,500 EGP
       brokerage_amount   = 75,000 * 1.5/3  = 37,500 EGP
       broker_amount      = 75,000 * 1.0/3  = 25,000 EGP

   → commission_entry تنشأ بـ status: PENDING

2. Developer Finance يراجع ويوافق → status: APPROVED

3. الدفع:
   → Brokerage بتطلب الدفع من Developer
   → Developer بيحول عبر المنصة أو خارجها (Phase 1: خارجها + confirm)
   → commission_entry → status: PAID
   → ledger_entries للجميع

4. لو نزاع في العمولة:
   → dispute ينشأ → POPWAM Support يتدخل
```

## Flow 9 — Dispute Flow

```
1. أي طرف بيضغط "Open Dispute" في Deal Room أو Commission section
2. بيختار نوع النزاع: COMMISSION | LEAD_CLAIM | DEAL_CONDUCT
3. بيكتب الوصف + يرفع الأدلة (screenshots, documents)
4. status: OPEN

5. POPWAM Support بيشوف في قائمة النزاعات
6. assigned_to = support_agent
7. Support بيراجع الأدلة من الطرفين
8. بيكتب القرار + السبب
9. status: RESOLVED
10. Audit Log كامل محفوظ

لو النزاع خطير:
  → status: ESCALATED → platform_admin يتدخل
  → ممكن يعمل Suspend لأحد الأطراف
```

---

# 8. Permissions Matrix

## جدول الصلاحيات الكامل

### Platform Level Permissions

| Permission | platform_owner | platform_admin | platform_support | platform_auditor |
|-----------|:---:|:---:|:---:|:---:|
| organizations.verify | ✓ | ✓ | — | — |
| organizations.suspend | ✓ | ✓ | — | — |
| organizations.view_all | ✓ | ✓ | ✓ | ✓ |
| platform.settings | ✓ | ✓ | — | — |
| subscriptions.manage | ✓ | ✓ | — | — |
| disputes.resolve | ✓ | ✓ | ✓ | — |
| audit_logs.view | ✓ | ✓ | — | ✓ |
| reports.platform_wide | ✓ | ✓ | — | ✓ |
| users.impersonate | ✓ | — | — | — |

### Developer Permissions

| Permission | dev_owner | dev_admin | dev_sales_mgr | dev_sales_agent |
|-----------|:---:|:---:|:---:|:---:|
| projects.create | ✓ | ✓ | — | — |
| projects.publish | ✓ | ✓ | — | — |
| projects.edit | ✓ | ✓ | ✓ | — |
| inventory.create | ✓ | ✓ | ✓ | — |
| inventory.publish | ✓ | ✓ | ✓ | — |
| inventory.view_private | ✓ | ✓ | ✓ | ✓ |
| commission_rules.manage | ✓ | ✓ | — | — |
| broker_access.grant | ✓ | ✓ | ✓ | — |
| reservation_requests.approve | ✓ | ✓ | ✓ | — |
| deal_rooms.create | ✓ | ✓ | ✓ | — |
| deal_rooms.join | ✓ | ✓ | ✓ | ✓ |
| deals.approve | ✓ | ✓ | ✓ | — |
| deals.mark_sold | ✓ | ✓ | ✓ | — |
| commissions.view | ✓ | ✓ | ✓ | — |
| commissions.approve | ✓ | ✓ | — | — |
| brokerage_agreements.manage | ✓ | ✓ | — | — |
| reports.developer | ✓ | ✓ | ✓ | — |

### Brokerage & Broker Permissions

| Permission | brokerage_owner | brokerage_admin | broker | individual_broker |
|-----------|:---:|:---:|:---:|:---:|
| marketplace.view | ✓ | ✓ | ✓ | ✓ (open only) |
| inventory.view_approved | ✓ | ✓ | ✓ | ✓ (open only) |
| inventory.view_private | — | — | — | — |
| inventory.publish | — | — | — | — |
| lead_claims.create | ✓ | ✓ | ✓ | ✓ (limited) |
| lead_claims.view_own | ✓ | ✓ | ✓ | ✓ |
| lead_claims.override | — | — | — | — |
| deal_requests.create | ✓ | ✓ | ✓ | ✓ (limited) |
| deal_rooms.join | ✓ | ✓ | ✓ | ✓ |
| deals.approve | — | — | — | — |
| deals.mark_sold | — | — | — | — |
| commissions.view_own | ✓ | ✓ | ✓ | ✓ |
| commissions.approve | — | — | — | — |
| brokers.manage | ✓ | ✓ | — | — |
| reports.brokerage | ✓ | ✓ | — | — |
| reports.own | ✓ | ✓ | ✓ | ✓ |
| disputes.raise | ✓ | ✓ | ✓ | ✓ |

---

# 9. What To Keep From Existing Files

## يُحتفظ به كما هو

### Auth System
```
✓ JWT + Refresh Token strategy
✓ OTP via SMS (التحقق من الهاتف)
✓ Password reset flow
✓ Device enrollment concept
→ فقط يحتاج إضافة Organization scope في JWT payload
```

### Attendance System
```
✓ Risk Score Engine (GPS + WiFi + Device + Face + Time)
✓ Geofence (PostGIS ST_DWithin)
✓ Manual review workflow
✓ Flutter check-in/out flow
→ يبقى كما هو للـ HR داخل كل organization
```

### HR Modules
```
✓ Employees model
✓ Shifts + Leaves
✓ Payroll calculation
→ يبقى scoped داخل كل organization
```

### Domain System
```
✓ Subdomain automatic routing
✓ Custom domain + TXT verification
✓ Cloudflare API integration
✓ Next.js middleware
→ يستخدم لصفحات Developer + Brokerage العامة
```

### AI/DVR Service
```
✓ InsightFace setup
✓ YOLOv8 detection
✓ RabbitMQ consumer
✓ GCS integration
→ يبقى كما هو، مرتبط بـ HR/Attendance فقط
```

### Payments Abstraction Layer
```
✓ Paymob + Tap Payments providers
✓ Webhook Idempotency pattern
✓ Ledger entries concept
→ يُوسع ليشمل Commission payments + Subscriptions
```

### Monorepo Structure (Turborepo + pnpm)
```
✓ apps/ workers/ packages/ infra/
✓ GitHub Actions CI/CD
✓ Docker setup
→ يحتاج فقط إضافة apps/marketplace-web/
```

---

# 10. What Must Be Changed

## 1. Tenant Model — تغيير جوهري

```
الملفات القديمة:
  tenants → شركة واحدة معزولة، isolated multi-tenant

التغيير المطلوب:
  organizations → يحل محل tenants
  المنصة نفسها (POPWAM) هي tenant واحد at the root
  Developer و Brokerage هما organizations داخل المنصة
  Cross-organization interactions مسموحة + محكومة
  
  القديم: كل tenant معزول تماماً
  الجديد: Organizations تتفاعل في Marketplace بقواعد محكومة
```

## 2. CRM — إعادة التفكير

```
الملفات القديمة:
  CRM = Leads + Customers + Deals + Pipelines
  كل شيء داخل tenant مغلق

التغيير المطلوب:
  leads → أصبح لها Owner محمي (Lead Claim system)
  clients → entity مستقل shared across deal rooms
  deals → أصبحت Deal Room تشمل أطراف متعددة
  pipelines → تنقسم:
    - Broker personal pipeline
    - Developer sales pipeline
  
  لا يمكن broker يرى leads أو deals تابعة لـ broker آخر
  لا يمكن developer يرى leads الداخلية لـ brokerage
```

## 3. Real Estate Module — تغيير كامل

```
الملفات القديمة:
  properties → مرتبطة بـ tenant واحد
  map-search → بحث للعملاء العاديين

التغيير المطلوب:
  properties → أصبحت inventory_units مرتبطة بـ Developer
  projects → طبقة جديدة فوق الـ units
  visibility layer → ضروري (PRIVATE/APPROVED/OPEN)
  broker_access_rules → جديد كلياً
  lead claims → مرتبطة بـ unit + project
```

## 4. Payments — توسعة مهمة

```
الملفات القديمة:
  Payments = فواتير + Payment Links + Subscriptions بسيطة

التغيير المطلوب:
  إضافة:
  - Subscription billing (Developer/Brokerage plans)
  - Commission payment tracking
  - Multi-party ledger (Developer/Brokerage/Broker/POPWAM كل له حساب)
  - Success Fee calculation (Phase 2)
```

## 5. Chat — تغيير الـ Scope

```
الملفات القديمة:
  Chat = Internal team chat داخل organization

التغيير المطلوب:
  Chat له نوعين:
  1. Internal Organization Chat (نفس الـ concept القديم)
  2. Deal Room Chat (بين organizations مختلفة)
     - Deal Room Chat يُفتح فقط داخل Deal Room
     - محكوم بـ participants list
     - بعض الرسائل visible لأطراف معينة
     - History محفوظ للـ audit
```

## 6. Public Web — تغيير الـ Concept

```
الملفات القديمة:
  Public Web = موقع شركة tenant + landing pages

التغيير المطلوب:
  نوعين من الـ Public Web:
  1. POPWAM Marketplace (main domain): عرض projects + units للعملاء العاديين
  2. Developer/Brokerage Public Pages (subdomains): صفحات خاصة بكل entity
  
  الـ SEO + Lead Capture مهم على المستويين
```

## 7. Permissions System — بناء من جديد

```
القديم: Resource-based permissions داخل tenant واحد
الجديد:
  - Organization-level RBAC
  - Cross-organization controlled actions
  - Platform-level roles
  - Broker individual permissions
  - Individual Broker restrictions
```

---

# 11. What Is Missing

## غائب كلياً من الملفات القديمة

### 1. Broker Verification System
```
مفيش:
- Broker profile model
- Document requirements
- Individual broker restrictions
- Verification status flow
يجب بناء من الصفر
```

### 2. Brokerage Company Model
```
مفيش:
- Brokerage as a first-class entity
- Broker-Brokerage relationship
- Brokerage subscription
- Brokerage performance tracking
يجب بناء من الصفر
```

### 3. Lead Ownership & Protection System
```
مفيش:
- Lead Claims concept
- Phone hash for privacy
- Duplicate detection
- Claim expiry
- Conflict resolution
يجب بناء من الصفر — هذا أهم feature في المنصة
```

### 4. Deal Room
```
مفيش:
- Deal Room concept
- Multi-party chat within deal
- Reservation Request flow
- Participant management
- Status transitions
يجب بناء من الصفر
```

### 5. Developer → Broker Visibility Controls
```
مفيش:
- Project visibility settings
- Broker access rules
- Developer-Brokerage agreements
- Selected Brokers list
يجب بناء من الصفر
```

### 6. Commission Rules Engine
```
مفيش:
- Commission rules per project/unit
- Multi-party split (Developer/Brokerage/Broker/Platform)
- Payment triggers (on reservation / on contract / on delivery)
- Commission entries tracking
يجب بناء من الصفر
```

### 7. Dispute Management
```
مفيش:
- Dispute raising flow
- Evidence upload
- Resolution workflow
- Escalation to platform
يجب بناء من الصفر
```

### 8. Inventory Management
```
الملفات القديمة عندها "Properties" بسيطة
مفيش:
- Project → Phase → Unit hierarchy
- Unit availability states
- Unit hold/reserve/sold transitions
- Payment plans per unit/project
يجب بناء من الصفر
```

### 9. Organization Onboarding Workflows
```
مفيش workflow كامل لـ:
- Developer application + review
- Brokerage application + review
- Document management
- Verification queue in Admin
يجب بناء من الصفر
```

### 10. Subscription & Billing System
```
مفيش:
- Plan definitions
- Subscription lifecycle
- Plan expiry handling
- Upgrade/downgrade flow
- Invoice generation for subscriptions
يجب بناء من الصفر
```

---

# 12. Execution Roadmap For 6 Teams

## Team 1 — Backend Core

**المسؤول:** Platform foundation, Auth, Organizations, HR, Attendance, Admin Shell

### يبدأ بـ:
```
Week 1-2:
  - Monorepo setup (Turborepo + pnpm)
  - Database setup (PostgreSQL + PostGIS)
  - CI/CD (GitHub Actions)
  - Base NestJS app + configuration
  - ENV management + Secrets

Week 3-4:
  - Auth module (JWT + Refresh + OTP)
  - Organizations model (replace tenant)
  - Users + RBAC base
  - Audit logs
  - File upload (GCS)
```

### الملفات والـ Modules:
```
apps/api/src/modules/
  auth/          platform-core/
  organizations/ users/
  roles/         permissions/
  audit-logs/    notifications/
  hr/            attendance/ (يبدأ Sprint 11)
  devices/
```

### لا يعمل عليه الآن:
```
- Deal Room
- Commission Engine
- Marketplace logic
- Public Web
```

### Dependencies:
```
→ يُسلم لـ Team 2: Organization model + RBAC
→ يُسلم لـ Team 3: Auth endpoints + Swagger docs
→ يُسلم لـ Team 4: JWT spec + Mobile auth
```

### Deliverables:
```
Sprint 1: Organizations + Auth + RBAC base
Sprint 2: Verification flow + Admin shell
Sprint 11: HR + Attendance (complete)
```

---

## Team 2 — Marketplace & Real Estate Backend

**المسؤول:** Projects, Inventory, Lead Claims, Deal Room, CRM, Commission, Payments

### يبدأ بـ:
```
Week 3-4 (بعد Team 1 يُسلم Organizations):
  - Projects + Phases model
  - Inventory Units model
  - Visibility rules
Week 5-6:
  - Broker access rules
  - Lead Claims system (الأهم)
  - Reservation Request flow
```

### الملفات والـ Modules:
```
apps/api/src/modules/
  developer-management/
  brokerage-management/
  broker-profiles/
  projects/
  inventory/
  visibility-rules/
  lead-claims/       ← الأهم والأصعب
  deal-rooms/
  deals/
  commission/
  payments/
  crm/ (expanded)
  accounting/
  legal/
  marketplace/ (search + filters)
```

### لا يعمل عليه الآن:
```
- AI/DVR
- HR/Attendance
- Marketing (Team 5)
- Public Web (Team 5)
```

### Dependencies:
```
← يحتاج من Team 1: Organizations + RBAC + Notifications
→ يُسلم لـ Team 3: API endpoints + Swagger
→ يُسلم لـ Team 4: Deal Room API + Lead Claims API
```

### Deliverables:
```
Sprint 4: Projects + Inventory
Sprint 5: Visibility + Broker access
Sprint 6: Lead Claims + Reservation Request
Sprint 7: Deal Room + Chat
Sprint 8: Commission + Payments
Sprint 9: CRM expansion
```

---

## Team 3 — Admin Web

**المسؤول:** كل Admin interfaces: POPWAM Admin + Developer Dashboard + Brokerage Dashboard

### يبدأ بـ:
```
Week 1-2:
  - Next.js setup + Monorepo integration
  - Design System (shadcn/ui + Tailwind)
  - Auth pages (Login + ForgotPassword)
  - Layout components (Sidebar + Topbar)
Week 3-4:
  - POPWAM Admin: Organization list + Verification queue
  - POPWAM Admin: Document review UI
```

### الملفات:
```
apps/admin-web/app/
  (auth)/login/  (auth)/forgot-password/

  (platform-admin)/
    dashboard/
    organizations/          ← verification queue
    organizations/[id]/     ← review + approve/reject
    disputes/
    subscriptions/
    reports/

  (developer)/
    dashboard/
    projects/               ← add + edit + publish
    projects/[id]/units/    ← inventory management
    deal-rooms/             ← incoming requests
    commissions/
    team/

  (brokerage)/
    dashboard/
    brokers/                ← manage team
    deal-rooms/
    commissions/
    reports/
```

### لا يعمل عليه الآن:
```
- HR/Attendance UI (Sprint 11)
- AI/DVR UI (Sprint 12)
- Marketing builder (Team 5)
```

### Dependencies:
```
← يحتاج من Team 1: Auth endpoints
← يحتاج من Team 2: Projects/Inventory/Deal Room APIs
```

### Deliverables:
```
Sprint 2: POPWAM Admin shell + verification UI
Sprint 3: Developer onboarding UI
Sprint 4: Projects + Inventory UI
Sprint 7: Deal Room UI
Sprint 8: Commission dashboard
```

---

## Team 4 — Mobile App (Flutter)

**المسؤول:** Broker mobile experience + HR Attendance

### يبدأ بـ:
```
Week 1-2:
  - Flutter monorepo setup
  - Core: Dio client + Riverpod + go_router
  - Auth screens (login + OTP)
Week 3-4:
  - Broker profile screen
  - Marketplace browse (list + filters)
```

### الملفات:
```
apps/mobile/lib/features/
  auth/
  broker-profile/
  marketplace/
    map_screen.dart          ← draw polygon + search
    project_list.dart
    project_detail.dart
    unit_detail.dart
  lead-claims/
    lead_form.dart
    my_claims.dart
  deal-rooms/
    deal_room_screen.dart    ← Stream Chat integration
    reservation_request.dart
  crm/
    leads_screen.dart
  attendance/                ← Sprint 11
    check_in_screen.dart
    face_capture_widget.dart
  chat/
  notifications/
```

### لا يعمل عليه الآن:
```
- Accounting UI
- Legal UI
- Marketing
```

### Dependencies:
```
← يحتاج من Team 2: Marketplace APIs + Lead Claim APIs + Deal Room APIs
← يحتاج من Team 2: Commission APIs
```

### Deliverables:
```
Sprint 5: Marketplace browse + map
Sprint 6: Lead Claims mobile flow
Sprint 7: Deal Room mobile (Stream Chat)
Sprint 11: Attendance (complete)
```

---

## Team 5 — Public Web + Marketing + Domains

**المسؤول:** POPWAM public marketplace, Developer/Brokerage public pages, Domain system, Marketing tools

### يبدأ بـ:
```
Sprint 10 بشكل رئيسي، لكن:
Week 1-2 (parallel):
  - Next.js public-web setup
  - Middleware tenant resolution
  - Basic routing structure
```

### الملفات:
```
apps/public-web/
  middleware.ts              ← tenant resolution
  app/
    page.tsx                 ← POPWAM Marketplace home
    projects/page.tsx        ← public project listing
    projects/[slug]/page.tsx ← project public page
    [domain]/               ← tenant-specific pages

apps/admin-web/app/(developer)/
  marketing/
    landing-pages/
    forms/
    campaigns/
  domains/
```

### Deliverables:
```
Sprint 10: Public web + Marketing + Domains
```

---

## Team 6 — AI/DVR + Workers + Integrations

**المسؤول:** AI service, Workers (Lead Sync, Notifications, Jobs), External integrations

### يبدأ بـ:
```
Sprint 0-1: Setup workers infrastructure
Sprint 6: Lead Sync Worker (Meta/TikTok/Google)
Sprint 12: AI/DVR full implementation
```

### الملفات:
```
apps/ai-dvr/
  app/consumers/
    face_match_handler.py
    dvr_analysis_handler.py

workers/
  notification-worker/
    handlers/
      push.handler.ts
      email.handler.ts
      sms.handler.ts

  lead-sync-worker/          ← Sprint 6
    handlers/
      meta.handler.ts
      tiktok.handler.ts
      google.handler.ts
    deduplication.service.ts

  jobs-worker/
    tasks/
      claim-expiry.task.ts   ← Lead Claims expiry check
      subscription-expiry.task.ts
      document-expiry-alert.task.ts
      saved-search-alerts.task.ts

  payroll-worker/
```

### Deliverables:
```
Sprint 1: Notification worker base
Sprint 6: Lead sync worker
Sprint 10: Marketing integrations
Sprint 11: Jobs worker (cron tasks)
Sprint 12: AI/DVR complete
```

---

# 13. Sprint Plan

## Sprint 0 — أسبوع 1-2 — Infrastructure

```
جميع الفرق:
  ✓ Monorepo setup (Turborepo + pnpm)
  ✓ Git repo + branching strategy (gitflow)
  ✓ PostgreSQL 15 + PostGIS setup
  ✓ Redis setup
  ✓ RabbitMQ setup
  ✓ GCS bucket setup
  ✓ Cloudflare setup (Wildcard DNS)
  ✓ CI/CD base (GitHub Actions)
  ✓ Development environment (Docker Compose)
  ✓ Base NestJS app running + health check
  ✓ Next.js admin-web running
  ✓ Flutter app running + connected to API

Deliverable: كل developer بيشغل المشروع محلياً في أقل من 30 دقيقة
```

## Sprint 1 — أسبوعين — Platform Core + Auth + Organizations

```
Team 1 (Backend):
  ✓ Organizations table + CRUD
  ✓ Auth (JWT + Refresh + OTP)
  ✓ Users + base Roles
  ✓ Permissions system
  ✓ Audit Logs base
  ✓ Notifications (email + push base)
  ✓ File upload (GCS)

Team 3 (Admin Web):
  ✓ Login + Register pages
  ✓ Admin layout (Sidebar + Topbar)
  ✓ POPWAM Admin: Organization list

Team 4 (Mobile):
  ✓ Login screen + OTP
  ✓ Auth token storage (flutter_secure_storage)

Deliverable: Login يشتغل على Web + Mobile
```

## Sprint 2 — أسبوعين — Verification + RBAC + Admin Shell

```
Team 1:
  ✓ Organization Verifications model
  ✓ Document upload flow
  ✓ Verification status transitions
  ✓ RBAC: full permissions matrix

Team 3:
  ✓ Verification queue UI
  ✓ Document review screen (approve/reject)
  ✓ Organization profile pages
  ✓ Notifications center

Team 6:
  ✓ Notification worker (email + FCM base)

Deliverable: POPWAM Admin يقدر يراجع ويوافق على Organization
```

## Sprint 3 — أسبوعين — Developer + Brokerage Onboarding

```
Team 2:
  ✓ Developer profile model + API
  ✓ Brokerage profile model + API
  ✓ Broker profile model + API
  ✓ Individual Broker flow
  ✓ Subscription model base

Team 3:
  ✓ Developer onboarding wizard (web)
  ✓ Brokerage onboarding wizard (web)
  ✓ Developer Dashboard shell
  ✓ Brokerage Dashboard shell

Deliverable: Developer و Brokerage يقدروا يكملوا onboarding ويتحققوا
```

## Sprint 4 — أسبوعين — Projects + Inventory

```
Team 2:
  ✓ Projects CRUD API
  ✓ Project phases API
  ✓ Inventory units API
  ✓ Unit availability API
  ✓ Payment plans API
  ✓ Visibility settings API
  ✓ PostGIS setup للـ project locations

Team 3:
  ✓ Project management UI (create + edit)
  ✓ Phases + Units management UI
  ✓ Payment plans UI
  ✓ Visibility settings UI

Deliverable: Developer يضيف مشروع كامل من الـ Dashboard
```

## Sprint 5 — أسبوعين — Marketplace Visibility + Broker Access

```
Team 2:
  ✓ Broker access rules API
  ✓ Developer-Brokerage agreements API
  ✓ Marketplace search + filters API
  ✓ Map search (PostGIS ST_Within)

Team 3:
  ✓ Access rules management UI
  ✓ Agreements management UI

Team 4 (Mobile):
  ✓ Marketplace browse screens
  ✓ Map screen + polygon draw
  ✓ Project detail + Unit detail screens

Deliverable: Broker على الموبايل يشوف Projects المسموح له بيها
```

## Sprint 6 — أسبوعين — Lead Claim + Deal Request

```
Team 2:
  ✓ Lead Claims API (الأهم)
  ✓ Phone hash system
  ✓ Duplicate detection engine
  ✓ Claim expiry logic
  ✓ Conflict detection
  ✓ Reservation Request API

Team 3:
  ✓ Developer: Reservation requests queue
  ✓ Broker: My leads + my claims

Team 4 (Mobile):
  ✓ Lead creation + claim flow
  ✓ Reservation request form
  ✓ My claims screen

Team 6:
  ✓ Jobs Worker: Claim expiry cron
  ✓ Lead Sync Worker base (Meta webhook)

Deliverable: Broker يسجل Lead + يطلب Deal Request بدون سرقة البيانات
```

## Sprint 7 — أسبوعين — Deal Room + Chat

```
Team 2:
  ✓ Deal Room creation API
  ✓ Participants management
  ✓ Deal Room status transitions
  ✓ Stream Chat integration (backend token)
  ✓ Client invitation flow

Team 3:
  ✓ Deal Room UI (Developer side)
  ✓ Deal Room UI (Brokerage/Broker side)
  ✓ Documents section
  ✓ Mark as Sold flow

Team 4 (Mobile):
  ✓ Deal Room mobile screen (Stream Chat)
  ✓ Deal status tracking

Deliverable: Deal Room يشتغل بين Broker + Developer مع Chat
```

## Sprint 8 — أسبوعين — Commission + Payments

```
Team 2:
  ✓ Commission rules engine
  ✓ Commission entries (auto on sold)
  ✓ Ledger system
  ✓ Paymob integration (EGP)
  ✓ Tap Payments (Gulf)
  ✓ InstaPay integration
  ✓ Subscription billing base
  ✓ Webhook idempotency

Team 3:
  ✓ Commission dashboard (Developer + Broker)
  ✓ Payment management UI
  ✓ Ledger view

Deliverable: Commission تتحسب تلقائياً وتُسجل عند Mark as Sold
```

## Sprint 9 — أسبوعين — CRM Expansion + Disputes

```
Team 2:
  ✓ Full CRM (pipelines + follow-ups + call logs)
  ✓ Dispute management system
  ✓ Accounting (invoices + expenses + reports)
  ✓ Legal (contracts + cases)

Team 3:
  ✓ CRM UI
  ✓ Dispute management UI
  ✓ Accounting UI

Deliverable: Complete deal lifecycle من Lead لـ Commission + Disputes handling
```

## Sprint 10 — أسبوعين — Marketing + Public Web + Domains

```
Team 5:
  ✓ POPWAM public marketplace
  ✓ Project public pages (SEO)
  ✓ Developer public pages (subdomain)
  ✓ Domain verification (Cloudflare)
  ✓ Landing pages builder
  ✓ Forms + lead capture
  ✓ UTM tracking + Pixels

Team 6:
  ✓ Lead Sync Worker (Meta + TikTok + Google complete)

Deliverable: Developer يعمل landing page ويجيب leads من Meta Ads
```

## Sprint 11 — أسبوعين — HR + Attendance

```
Team 1:
  ✓ HR: Employees + Shifts + Leaves complete
  ✓ Attendance: Risk Score engine complete
  ✓ Attendance: Manual review workflow

Team 4 (Mobile):
  ✓ Attendance check-in/out flow (GPS + WiFi + Camera)
  ✓ Leaves request + history

Deliverable: موظفي كل Organization يسجلوا حضورهم
```

## Sprint 12 — أسبوعين — AI/DVR + Final Polish

```
Team 6:
  ✓ AI service: Face matching (InsightFace)
  ✓ AI service: Person detection (YOLOv8)
  ✓ DVR integration
  ✓ Risk Score AI component

جميع الفرق:
  ✓ Bug fixes
  ✓ Performance optimization
  ✓ Security audit
  ✓ Load testing

Deliverable: Platform جاهز للإطلاق الرسمي
```

---

# 14. First 30 Days Plan

## الأسبوع الأول (Days 1-7)

### هدف الأسبوع: الجميع يشغل المشروع محلياً ويفهم النموذج

```
اليوم 1-2 — Kickoff + Architecture Review:
  ✓ كل الفريق يقرأ هذا الملف كاملاً
  ✓ Tech Lead يشرح الـ Architecture ساعتين
  ✓ كل developer يفهم الـ roles والـ flows
  ✓ تحديد lead لكل team من الـ 6 أفراد

اليوم 3-4 — Environment Setup:
  Team 1:
    ✓ GitHub repo + branch strategy
    ✓ Turborepo + pnpm setup
    ✓ Docker Compose (postgres + redis + rabbitmq)
    ✓ NestJS base app
  Team 3:
    ✓ Next.js admin-web init
    ✓ shadcn/ui + Tailwind config
  Team 4:
    ✓ Flutter project init
    ✓ Riverpod + go_router setup
  Team 6:
    ✓ Python AI service base
    ✓ FastAPI + Docker setup

اليوم 5:
  ✓ CI/CD: GitHub Actions بيبني كل app
  ✓ Cloud environments: Dev + Staging على GCP
  ✓ Cloudflare Wildcard DNS

اليوم 6-7:
  ✓ Prisma schema: Organizations + Users base
  ✓ First migration run
  ✓ Health check endpoints تشتغل

Deliverable اختبار يدوي:
  □ كل dev يشغل `pnpm dev` وكل service يشتغل
  □ API health check يرجع 200
  □ DB migration تشتغل بدون errors
```

## الأسبوع الثاني (Days 8-14)

### هدف الأسبوع: Auth + Organizations + Admin Shell

```
Team 1 (Backend):
  ✓ Auth module (login + register + OTP + refresh + logout)
  ✓ Organizations: create + get + update
  ✓ Users: CRUD + invite flow
  ✓ Roles: platform_owner + developer_owner + broker (base)
  ✓ JWT payload: { userId, organizationId, role, permissions[] }

Team 3 (Admin Web):
  ✓ Login page (email + password)
  ✓ Sidebar navigation (context-aware per role)
  ✓ POPWAM Admin: Organizations table
  ✓ Profile pages shell

Team 4 (Mobile):
  ✓ Login screen
  ✓ OTP verification screen
  ✓ Home screen shell

Deliverable اختبار يدوي:
  □ Platform admin بيلوق ويشوف Organizations list
  □ Developer بيعمل register ويدخل
  □ Broker بيلوق من الموبايل
  □ JWT يحتوي على صح permissions
```

## الأسبوع الثالث (Days 15-21)

### هدف الأسبوع: Verification Flow + RBAC كامل

```
Team 1 (Backend):
  ✓ Organization verifications: upload + review + approve/reject
  ✓ Full RBAC: كل permissions matrix (section 8)
  ✓ Broker profile model
  ✓ Notification: email template للـ welcome + approval

Team 3 (Admin Web):
  ✓ Verification Queue page (POPWAM Admin)
  ✓ Document viewer component (PDF + Images)
  ✓ Approve/Reject modal مع reason
  ✓ Organization detail page

Team 6 (Workers):
  ✓ Notification worker يبعت emails فعلياً (SendGrid/Resend)
  ✓ FCM push notifications base

Deliverable اختبار يدوي:
  □ Developer يرفع مستنداته
  □ POPWAM Admin يراجع ويوافق
  □ Developer بياخد welcome email
  □ Suspended organization ما تقدرش تلوغ
```

## الأسبوع الرابع (Days 22-30)

### هدف الأسبوع: Developer يضيف مشروع كامل

```
Team 2 (Backend):
  ✓ Projects CRUD + schema
  ✓ Inventory units CRUD
  ✓ Visibility settings
  ✓ Payment plans

Team 3 (Admin Web):
  ✓ Developer Dashboard: Projects list
  ✓ Add Project form (with map picker)
  ✓ Units management table
  ✓ Visibility selector UI

Team 4 (Mobile):
  ✓ Marketplace: Projects list screen
  ✓ Project detail screen (read only)

Deliverable اختبار يدوي:
  □ Developer يضيف مشروع مع 5 units
  □ يختار visibility: OPEN_MARKETPLACE
  □ Broker على الموبايل يشوف المشروع
  □ Broker ما يشوفش مشروع PRIVATE
  □ Map بيعرض الموقع الصح
```

---

# 15. Final Recommendations

## أهم 10 قرارات لا يجب تغييرها

```
1. Lead Ownership عبر Phone Hash — مش الرقم الكامل
   السبب: حماية خصوصية العميل + منع النزاعات + GDPR-compatible

2. Deal Room كـ Entity مستقل بمشاركين من organizations مختلفة
   السبب: هذا ما يميز POPWAM عن أي CRM عادي

3. Commission Rules تُحدد من المطور — مش من المنصة
   السبب: كل مطور له policy مختلفة

4. Verification إلزامية قبل أي Marketplace access
   السبب: حماية قانونية + ضمان جودة المشاركين

5. Multi-tenant Architecture مع Controlled Cross-org Interactions
   السبب: المنصة تحتاج الاثنين — الـ isolation والـ marketplace

6. PostgreSQL + PostGIS للـ location data
   السبب: ST_Within/ST_DWithin لا يوجد بديل أفضل

7. Lead Claims تعتمد على Phone Hash + Project — مش Phone فقط
   السبب: نفس العميل يمكن يكون له claims مع أكثر من broker على مشاريع مختلفة

8. Stream Chat للـ Deal Room — مش بناء من الصفر
   السبب: الوقت + الموثوقية + Features جاهزة

9. Modular Monolith للـ Backend حتى تتجاوز 100k user
   السبب: الفريق 6-8 devs مش محتاج microservices دلوقتي

10. Organizations model بدل Tenants model
    السبب: الـ tenants المنعزلة لا تسمح بـ marketplace interactions
```

## أكبر 10 مخاطر

```
1. تعقيد Lead Claim System
   الخطر: Edge cases كتيرة (expired claims, concurrent requests, disputes)
   الحل: ابني Lead Claims module قبل Deal Room بكامله + اكتب unit tests شاملة

2. بطء في Verification Process
   الخطر: لو التحقق بطيء، المنصة ما تقدرش تنطلق
   الحل: POPWAM Admin dashboard محسوب + SLA داخلي 48h للرد

3. Broker يرفض دفع Subscription
   الخطر: Individual brokers قد يجدوا التكلفة مرتفعة
   الحل: Free trial 30 يوم + First deal free model

4. Developer يرفض Commission عبر المنصة
   الخطر: المطور يحول العمولة خارج المنصة فتخسر Success Fee
   الحل: Phase 1 اعترف بالواقع، سجل فقط. Phase 2 حفز الدفع عبر المنصة

5. Data Privacy — رقم العميل
   الخطر: تسريب phone numbers يضر بالثقة والقانون
   الحل: Phone Hash system + encryption at rest + GDPR compliance

6. Deal Room Abuse
   الخطر: طرف يستخدم Deal Room للتفاوض خارج المنصة
   الحل: لا يوجد حل تقني كامل — سياسة + suspension للمخالفين

7. Complexity للفريق الصغير (6-8 devs)
   الخطر: كثير جداً للبناء
   الحل: Sprint plan الموجود هنا + لا تبني Features خارج الـ Sprint

8. Performance عند تكبر الـ Inventory
   الخطر: Marketplace search بيتبطأ مع ملايين units
   الحل: PostGIS indexes + Redis cache + Pagination من أول يوم

9. نزاعات العمولة
   الخطر: نزاعات كثيرة تحتاج manual intervention
   الحل: Commission rules واضحة + Audit trail كامل + Dispute system

10. POPWAM قد تبدو كـ Competitor للـ Brokerages
    الخطر: لو المنصة أضافت Individual Brokers بكثرة، شركات الوساطة ترفض الانضمام
    الحل: سياسة واضحة: Individual Brokers يدفعون أعلى + صلاحيات أقل + POPWAM لا تنافس
```

## ما الذي نؤجله ولا نبنيه الآن

```
❌ لا تبنيه الآن — Success Fee / Platform Fee
   السبب: يحتاج trust أولاً + تفاوض مع developers

❌ لا تبنيه الآن — Mobile App للـ Developer أو Brokerage Owner
   السبب: الـ Admin Web كافي في البداية

❌ لا تبنيه الآن — Client Portal كامل
   السبب: Client في Phase 1 يتعامل عبر Deal Room فقط

❌ لا تبنيه الآن — Resale / Secondary Market
   السبب: بناء Primary Market أولاً

❌ لا تبنيه الآن — Mortgage / Financing Integration
   السبب: Phase 3 بعد ما تثبت قيمة المنصة

❌ لا تبنيه الآن — Agent Ratings / Reviews Public
   السبب: يحتاج حجم كافي من الصفقات أولاً

❌ لا تبنيه الآن — Automated Valuation Models (AVM)
   السبب: يحتاج data كافية في المنصة

❌ لا تبنيه الآن — Blockchain للعقود
   السبب: overhead غير مبرر في هذه المرحلة

✓ ابنيه بسيط الآن + وسع لاحقاً:
   - Commission payment: تتبع يدوي في Phase 1 + auto-transfer في Phase 2
   - Marketing: landing pages بسيطة أولاً
   - Reports: basic tables أولاً + charts في Phase 2
```

---

## خلاصة

POPWAM ليست CRM ولا portal عقاري عادي.
هي **infrastructure للسوق العقاري** — مثلما Shopify هي infrastructure للـ e-commerce.

الفارق التنافسي الحقيقي ليس في الـ UI ولا في التكنولوجيا.
الفارق في:
1. **نظام Lead Ownership** — لا يوجد مثيله في السوق المصري/الخليجي
2. **Deal Room المتعدد الأطراف** — يضع كل طرف في سياق موثق
3. **Commission Transparency** — المطور والبروكر يثقان بالنظام لأنه شفاف
4. **التحقق الإلزامي** — جودة المشاركين تحمي سمعة المنصة

ابنِ هذه الأربعة أولاً. كل شيء آخر قابل للتأخير.

---

*آخر تحديث: نسخة 1.0 — للاستخدام الداخلي فقط — POPWAM Platform Team*

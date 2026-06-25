# UI/UX Page Inventory and Redesign Map

Audit date: 2026-06-21  
Scope: `apps/admin-web`, `apps/public-web`, and `apps/mobile`  
Mode: discovery only; no UI, route, API, Prisma, or source-code changes

## Counting and evidence rules

- **Admin Web:** 110 routable `page.tsx` files: 29 platform, 55 developer, 23 brokerage, and 3 shared/root pages.
- **Public Web:** 13 routable `page.tsx` files, plus the non-visual `robots.ts` and `sitemap.ts` metadata routes.
- **Mobile:** 29 user-visible routed or pushed screens/states. `MarketplaceShellScreen` is documented as navigation infrastructure rather than counted as a separate destination; `_MissingRouteInputScreen` is counted because users can see it.
- "Connected" means the UI calls a real API adapter; it does not guarantee that a given environment has seeded data or permission.
- "Foundation" means usable basic CRUD/list/detail UI, but with intentionally simple presentation or incomplete product workflows.
- Every page purpose is written in simple Arabic as requested.

# 1. Executive Summary

POPWAM already has broad functional coverage, especially in authenticated workflows. The strongest areas are the shared API-backed CRM lists/details, project and inventory management, invitations/verifications, conversations, lead claims, reservations, deal rooms, deals, and commissions. The code also contains loading, empty, and error handling in many data-driven screens. This is a solid functional foundation, but it does not yet read as one coherent product.

The largest problem is the gap between **route coverage** and **demo presentation**. Admin dashboards still show `--` and explanatory placeholder copy; the brokerage dashboard says marketplace UI belongs to a later slice. Ads and Cameras explicitly remain registries/placeholders. Mobile has a map placeholder, a single-image “carousel” placeholder, and a broker profile edit placeholder. Public landing pages still use mock content and placeholder CTAs.

The biggest design conflicts are:

1. **Tokens exist but are bypassed.** Admin contains about 531 hard-coded `zinc-*` usages and Public contains about 337 `slate-*` plus 90 `emerald-*` usages. Dark and Eye Comfort themes therefore cannot recolor the full product reliably.
2. **Navigation is overloaded.** Developer Admin exposes 30 top-level destinations; Mobile hides nine operational destinations as a long stack of buttons inside Profile; Public domain sites inherit the marketplace header/footer/bottom-nav and then add another organization header/footer.
3. **Role and permission UX are too broad.** Admin navigation selects a role family but does not filter individual nav items by permissions, even though the type supports permission metadata. Sales agents can be shown department/admin areas and then depend on backend denial or page guards.
4. **Public conversion is inconsistent.** The main project detail has a long embedded form but no sticky CTA. A sticky CTA exists only on mock landing pages and its Call/WhatsApp/Visit actions are placeholders.
5. **Localization is structural, not complete.** Arabic-capable fallback fonts are listed, but both Next apps declare `lang="en"`, load Geist with Latin only, have no `dir` switching, and keep navigation/forms/statuses in English. Flutter declares no locales or RTL/localization configuration.

### Readiness by area

| Area | Readiness | Assessment |
|---|---|---|
| Admin shared CRM/conversations | Strong foundation | Connected, reusable, and central to the product; needs hierarchy, density, mobile, and role polish. |
| Developer projects/inventory/governance | Strong foundation | Broad connected workflows; project detail is crowded and split across many routes. |
| Stage 8 governance | Strong foundation | Agreements, selling permissions, access rules, claims, reservations, rooms, deals, and commissions exist; the end-to-end story needs clearer progress/status UX. |
| Platform organizations/verifications/invitations | Demo-capable | Connected and important; redesign can greatly improve review speed and trust. |
| Public marketplace | Mixed | API/mock/hybrid data adapter is capable, but content still exposes demo/internal wording and conversion/navigation conflict. |
| Operations/HR/accounting/legal | Foundation | Basic generic CRUD is connected; information architecture and domain-specific UI are weak. |
| Ads/cameras | Not demo-ready as product features | Explicit placeholders/registries with no publishing, stream, DVR, credentials, or AI integration. |
| Mobile marketplace and broker workflow | Functional foundation | Many connected flows exist; map/media/profile navigation and localization are incomplete. |

### Redesign-first recommendation

Start with design tokens and shell/navigation, then fix the exact demo journey: Admin login and dashboards, Developer Projects/Inventory, CRM lead detail and conversations, Public Home/Projects/Project Detail/Lead Form/Chat, and Mobile Login/Marketplace/Project/Unit/Claim/Reservation. Platform organization verification and Stage 8 governance should follow immediately because they prove the trust and transaction model.

# 2. Admin Web Page Inventory

## Admin dependency legend

| Code | Main API dependency |
|---|---|
| AUTH | `/auth/login`, `/auth/me`, token storage |
| INVITE | `/invitations/:token`, `/invitations/:token/accept` |
| PLATFORM | `/organizations`, `/platform-admin/organizations/*`, `/platform-admin/verification-queue`, `/organization-verifications/*` |
| PROJECT | `/projects*`, phases, visibility, selling mode, broker authorizations |
| INVENTORY | `/inventory/units*`, project units |
| GOVERNANCE | `/agreements*`, `/broker-access-rules*` |
| CLAIM | `/lead-claims*`, `/lead-claims/conflicts*` |
| RESERVATION | `/reservation-requests*` |
| CRM | `/crm/leads*`, pipeline, tasks, summary, activities |
| CONVERSATION | `/conversations*`, lead-to-conversation |
| PUBLIC-ADMIN | `/public-leads*`, website settings, organization domains, platform domain review |
| ROOM | `/deal-rooms*` |
| DEAL | `/deals*` |
| COMMISSION | `/commission-rules*`, `/commissions*` |
| IMPORT | `/import-export/*` |
| OPS | `/operations/*`, `/hr/*`, `/accounting/*`, `/legal/*`, `/ads/*`, `/cameras/*` |

Business importance uses: **Core** (primary product flow), **High**, **Supporting**, **Internal**. Demo and redesign priorities are independent: a page can be low demo priority but still need structural redesign later.

## Shared, authentication, and invitation pages

| Route / Page | File path | Main purpose | Primary user role | Business importance | Current UI state | Main data/API dependency | Demo priority | Redesign priority | Notes |
|---|---|---|---|---|---|---|---|---|---|
| `/` | `apps/admin-web/src/app/page.tsx` | يحوّل المستخدم مباشرة إلى صفحة الدخول. | Any | Supporting | Redirect only | None | Low | P3 | No landing or role detection here. |
| `/login` | `apps/admin-web/src/app/(app)/(auth)/login/page.tsx` | تسجيل دخول موظفي المنصة والمطور والوسيط. | All authenticated roles | Core | Functional; split-screen desktop | AUTH | Critical | P0 | Good validation/error basics; no password recovery, SSO, language, theme, or show-password control. |
| `/invite/[token]` | `apps/admin-web/src/app/invite/[token]/page.tsx` | قبول دعوة شركة وإنشاء بيانات المستخدم وكلمة المرور. | Invited company user | Core | Connected; basic card/form | INVITE | Critical | P0 | Public route; needs stronger token states, password guidance, login link, trust copy, accessibility, and localized layout. |

## Brokerage workspace pages

| Route / Page | File path | Main purpose | Primary user role | Business importance | Current UI state | Main data/API dependency | Demo priority | Redesign priority | Notes |
|---|---|---|---|---|---|---|---|---|---|
| `/brokerage/dashboard` | `apps/admin-web/src/app/(app)/(brokerage)/brokerage/dashboard/page.tsx` | يعرض ملخص عمل شركة الوساطة. | Brokerage owner/admin, broker | Core | Placeholder stats and marketplace shell | AUTH only | Critical | P0 | Values are `--`; copy says marketplace UI comes later. Duplicate Marketplace nav points here. |
| `/brokerage/crm/leads` | `apps/admin-web/src/app/(app)/(brokerage)/brokerage/crm/leads/page.tsx` | يعرض العملاء المحتملين ويتابع حالتهم. | Brokerage sales/broker | Core | Connected shared list, filters, pagination | CRM | Critical | P0 | Needs compact mobile cards, saved filters, clearer ownership and next action. |
| `/brokerage/crm/leads/[id]` | `apps/admin-web/src/app/(app)/(brokerage)/brokerage/crm/leads/[id]/page.tsx` | يعرض تفاصيل العميل ويسمح للوسيط بالمطالبة به ومتابعته. | Broker, sales | Core | Connected detail; claim action enabled | CRM, CONVERSATION | Critical | P0 | Daily-work screen; consolidate timeline, contact, claim, tasks, notes, and conversation actions. |
| `/brokerage/crm/marketplace-leads` | `apps/admin-web/src/app/(app)/(brokerage)/brokerage/crm/marketplace-leads/page.tsx` | يعرض العملاء المتاحين في السوق قبل مطالبة الوسيط بهم. | Broker, brokerage sales | Core | Connected shared list in marketplace mode | `/crm/leads/marketplace` | Critical | P0 | Should foreground eligibility, attribution, countdown/availability, and one clear claim action. |
| `/brokerage/crm/pipeline` | `apps/admin-web/src/app/(app)/(brokerage)/brokerage/crm/pipeline/page.tsx` | يرتب العملاء حسب مرحلة البيع وينقلهم بين المراحل. | Sales manager, broker | Core | Connected foundation Kanban plus select-based move | CRM | High | P0 | Not drag-and-drop; setup and move forms consume space; columns will overflow on mobile. |
| `/brokerage/crm/tasks` | `apps/admin-web/src/app/(app)/(brokerage)/brokerage/crm/tasks/page.tsx` | ينشئ ويتابع مهام متابعة العملاء. | Broker, sales | High | Connected list/create/filter | CRM | High | P1 | Requires raw optional CRM lead ID; should use searchable lead selector and better due/overdue hierarchy. |
| `/brokerage/conversations` | `apps/admin-web/src/app/(app)/(brokerage)/brokerage/conversations/page.tsx` | يعرض محادثات العملاء والفريق. | Broker, sales | Core | Connected shared list | CONVERSATION | Critical | P0 | Needs unread state, participant/avatar cues, response SLA, and mobile conversation layout. |
| `/brokerage/conversations/[id]` | `apps/admin-web/src/app/(app)/(brokerage)/brokerage/conversations/[id]/page.tsx` | يفتح المحادثة ويرسل رسائل ويغيّر حالتها. | Broker, sales | Core | Connected detail/composer/share link | CONVERSATION | Critical | P0 | Critical conversion screen; improve message bubbles, composer anchoring, share-token explanation, and responsive panes. |
| `/brokerage/lead-claims` | `apps/admin-web/src/app/(app)/(brokerage)/brokerage/lead-claims/page.tsx` | ينشئ مطالبة بعميل ويعرض مطالبات الوسيط. | Broker | Core | Connected create + table | CLAIM | High | P1 | Creation is ID-driven and technical; should start from project/unit/lead context. |
| `/brokerage/lead-claims/[id]` | `apps/admin-web/src/app/(app)/(brokerage)/brokerage/lead-claims/[id]/page.tsx` | يعرض المطالبة ويتيح تحريرها أو إنشاء طلب حجز. | Broker | Core | Connected detail + reservation form | CLAIM, RESERVATION | High | P1 | Good flow bridge; needs eligibility and expiry/status timeline. |
| `/brokerage/public-leads` | `apps/admin-web/src/app/(app)/(brokerage)/brokerage/public-leads/page.tsx` | يعرض طلبات التواصل القادمة من الموقع العام. | Brokerage sales/admin | Core | Connected list/status actions | PUBLIC-ADMIN | Critical | P0 | Must distinguish new, duplicate, spam, converted, attribution, and preferred contact. |
| `/brokerage/public-leads/[id]` | `apps/admin-web/src/app/(app)/(brokerage)/brokerage/public-leads/[id]/page.tsx` | يعرض تفاصيل طلب الموقع ويحوّله لمسار البيع. | Brokerage sales/admin | Core | Connected detail/actions | PUBLIC-ADMIN | Critical | P0 | Needs visitor behavior, source page, UTM, consent, duplicate reason, and conversion next-step hierarchy. |
| `/brokerage/reservation-requests` | `apps/admin-web/src/app/(app)/(brokerage)/brokerage/reservation-requests/page.tsx` | ينشئ طلبات حجز ويتابع رد المطور. | Broker | Core | Connected create + list | RESERVATION | High | P1 | Creation also depends on IDs; should be context-first with unit summary and clear hold rules. |
| `/brokerage/reservation-requests/[id]` | `apps/admin-web/src/app/(app)/(brokerage)/brokerage/reservation-requests/[id]/page.tsx` | يعرض حالة طلب الحجز ويسمح بإلغائه. | Broker | Core | Connected detail/cancel | RESERVATION | High | P1 | Add status timeline, expiry/hold explanation, next action, and rejection recovery. |
| `/brokerage/deal-rooms` | `apps/admin-web/src/app/(app)/(brokerage)/brokerage/deal-rooms/page.tsx` | يعرض غرف التفاوض الخاصة بالصفقات. | Broker, brokerage admin | Core | Connected table | ROOM | High | P1 | Needs urgency, unread activity, participants, stage, and next-action columns. |
| `/brokerage/deal-rooms/[id]` | `apps/admin-web/src/app/(app)/(brokerage)/brokerage/deal-rooms/[id]/page.tsx` | يدير المشاركين والرسائل وحالة غرفة الصفقة. | Broker, brokerage admin | Core | Connected multi-section detail | ROOM | High | P1 | Dense; should become a workspace with sticky actions and clear status progression. |
| `/brokerage/deals` | `apps/admin-web/src/app/(app)/(brokerage)/brokerage/deals/page.tsx` | يعرض الصفقات وقيمتها وحالتها. | Brokerage owner/admin, broker | Core | Connected shared list | DEAL | High | P1 | Financial hierarchy and filtering need polish. |
| `/brokerage/deals/[id]` | `apps/admin-web/src/app/(app)/(brokerage)/brokerage/deals/[id]/page.tsx` | يعرض تفاصيل الصفقة والإجراءات المتاحة. | Brokerage owner/admin, broker | Core | Connected detail/actions | DEAL | High | P1 | Show room/reservation provenance, approvals, audit trail, and money summary more clearly. |
| `/brokerage/commissions` | `apps/admin-web/src/app/(app)/(brokerage)/brokerage/commissions/page.tsx` | يعرض عمولات شركة الوساطة والوسطاء. | Brokerage owner/admin, broker | Core | Connected shared list | COMMISSION | High | P1 | Needs payable/approved/rejected grouping and totals. |
| `/brokerage/commissions/[id]` | `apps/admin-web/src/app/(app)/(brokerage)/brokerage/commissions/[id]/page.tsx` | يعرض حساب العمولة وحالتها. | Brokerage owner/admin, broker | High | Connected detail/actions by permission | COMMISSION | High | P1 | Add calculation explanation, parties, evidence, payout state, and audit trail. |
| `/brokerage/website-settings` | `apps/admin-web/src/app/(app)/(brokerage)/brokerage/website-settings/page.tsx` | يضبط اسم ووصف وألوان وبيانات موقع شركة الوساطة. | Brokerage owner/admin | High | Connected settings form | PUBLIC-ADMIN | Medium | P1 | Preview and branding validation are missing; raw URLs/colors are form-heavy. |
| `/brokerage/domains` | `apps/admin-web/src/app/(app)/(brokerage)/brokerage/domains/page.tsx` | يضيف نطاق الشركة ويتابع التحقق من DNS. | Brokerage owner/admin | High | Connected domain workflow | PUBLIC-ADMIN | Medium | P1 | Verification instructions are present; progress and DNS troubleshooting need simplification. |
| `/brokerage/import-export/export` | `apps/admin-web/src/app/(app)/(brokerage)/brokerage/import-export/export/page.tsx` | يصدّر بيانات الحساب المسموح بها. | Brokerage admin | Supporting | Connected export panel | IMPORT | Low | P2 | Internal utility; clarify data scope, format, privacy, and completion/download state. |

## Developer workspace pages

| Route / Page | File path | Main purpose | Primary user role | Business importance | Current UI state | Main data/API dependency | Demo priority | Redesign priority | Notes |
|---|---|---|---|---|---|---|---|---|---|
| `/developer/dashboard` | `apps/admin-web/src/app/(app)/(developer)/developer/dashboard/page.tsx` | يعرض ملخص مشاريع ومخزون واتفاقيات شركة التطوير. | Developer owner/admin/sales | Core | Placeholder stats | AUTH only | Critical | P0 | All values are `--`; a weak first screen after login. |
| `/developer/operations/overview` | `apps/admin-web/src/app/(app)/(developer)/developer/operations/overview/page.tsx` | يجمع ملخص الموارد البشرية والحسابات والقانون والإعلانات والكاميرات. | Developer owner/admin | High | Connected summary/activity; generic cards | `/operations/summary`, `/operations/activities` | Medium | P2 | Useful hub, but links and generic metrics do not reflect role priorities. |
| `/developer/projects` | `apps/admin-web/src/app/(app)/(developer)/developer/projects/page.tsx` | يعرض كل مشاريع المطور ويفتح إدارتها. | Developer admin/project team | Core | Connected table | PROJECT | Critical | P0 | Key demo page; needs visual portfolio cards/table toggle, publish readiness, and strong primary action. |
| `/developer/projects/new` | `apps/admin-web/src/app/(app)/(developer)/developer/projects/new/page.tsx` | ينشئ مشروعًا عقاريًا جديدًا. | Developer admin/project manager | Core | Connected long form | PROJECT | Critical | P0 | Break into guided steps; add validation summary, autosave/draft expectations, media/location preview. |
| `/developer/projects/[id]` | `apps/admin-web/src/app/(app)/(developer)/developer/projects/[id]/page.tsx` | يعرض المشروع ويعدّل بياناته ويضبط من يستطيع بيعه. | Developer admin/project manager | Core | Connected dense detail/edit + Stage 8 selling permissions | PROJECT | Critical | P0 | Too many responsibilities; use overview, readiness checklist, tabs, and sticky save/actions. |
| `/developer/projects/[id]/visibility` | `apps/admin-web/src/app/(app)/(developer)/developer/projects/[id]/visibility/page.tsx` | يحدد هل المشروع خاص أو ظاهر للوسطاء أو للسوق العام. | Developer admin | Core | Connected selector | PROJECT | Critical | P0 | Explain every mode in plain language and show its public/broker impact before saving. |
| `/developer/projects/[id]/phases` | `apps/admin-web/src/app/(app)/(developer)/developer/projects/[id]/phases/page.tsx` | ينشئ مراحل تسليم المشروع ويحدّثها. | Project/operations manager | High | Connected create/edit + table | PROJECT | High | P1 | Combine timeline visualization with editable data; current table/form is utilitarian. |
| `/developer/projects/[id]/inventory` | `apps/admin-web/src/app/(app)/(developer)/developer/projects/[id]/inventory/page.tsx` | ينشئ وحدات مشروع محدد ويعرضها. | Inventory/sales admin | Core | Connected create + table | INVENTORY, PROJECT | Critical | P0 | High-volume workflow needs bulk actions, compact editing, filters, and availability counts. |
| `/developer/projects/[id]/payment-plans` | `apps/admin-web/src/app/(app)/(developer)/developer/projects/[id]/payment-plans/page.tsx` | ينشئ خطط سداد للمشروع أو الوحدة. | Sales/accounting admin | Core | Connected create + table | PROJECT | High | P1 | Add percentage validation/visual breakdown and explain project-vs-unit scope. |
| `/developer/inventory` | `apps/admin-web/src/app/(app)/(developer)/developer/inventory/page.tsx` | يعرض كل وحدات الشركة ويعدّل حالتها وظهورها. | Inventory/sales team | Core | Connected filters + create/edit + table | INVENTORY, PROJECT | Critical | P0 | Dense but important; needs saved views, bulk status/visibility changes, inline signals, and responsive cards. |
| `/developer/agreements` | `apps/admin-web/src/app/(app)/(developer)/developer/agreements/page.tsx` | ينشئ ويدير اتفاقيات المطور مع شركات الوساطة. | Developer owner/admin | Core | Connected create/list/status actions | GOVERNANCE | High | P1 | Stage 8 proof point; show parties, coverage, effective dates, status steps, and termination consequences. |
| `/developer/broker-access` | `apps/admin-web/src/app/(app)/(developer)/developer/broker-access/page.tsx` | يمنح وسيطًا أو شركة وساطة صلاحية الوصول لمشروع. | Developer admin/sales manager | Core | Connected create/edit/delete | GOVERNANCE, PROJECT | High | P1 | Needs human-readable entity picker, scope summary, inheritance/conflict cues, and safer revoke confirmation. |
| `/developer/lead-claims` | `apps/admin-web/src/app/(app)/(developer)/developer/lead-claims/page.tsx` | يعرض تعارضات مطالبات العملاء على مشاريع المطور. | Developer sales manager | High | Connected conflict-only view; general list missing | CLAIM | Medium | P1 | Page admits future endpoint gap; label/navigation promises more than it provides. |
| `/developer/crm/leads` | `apps/admin-web/src/app/(app)/(developer)/developer/crm/leads/page.tsx` | يعرض عملاء شركة التطوير ويتابعهم. | Developer sales agent/manager | Core | Connected shared list | CRM | Critical | P0 | Must become the sales home: owner, recency, intent, project, next task, and fast contact. |
| `/developer/crm/leads/[id]` | `apps/admin-web/src/app/(app)/(developer)/developer/crm/leads/[id]/page.tsx` | يعرض تفاصيل العميل وملاحظاته ومهامه ومحادثاته. | Developer sales agent/manager | Core | Connected rich shared detail | CRM, CONVERSATION | Critical | P0 | Highest-value admin workflow; unify timeline and persistent next actions. |
| `/developer/crm/pipeline` | `apps/admin-web/src/app/(app)/(developer)/developer/crm/pipeline/page.tsx` | يعرض مراحل البيع وينقل العملاء بينها. | Developer sales manager | Core | Connected foundation Kanban | CRM | Critical | P0 | Improve horizontal behavior, stage totals, drag/move affordance, stale leads, and mobile alternative. |
| `/developer/crm/tasks` | `apps/admin-web/src/app/(app)/(developer)/developer/crm/tasks/page.tsx` | ينشئ مهام متابعة للعملاء ويغلقها. | Developer sales team | High | Connected list/create/filter | CRM | High | P1 | Replace raw lead ID; group Today/Overdue/Upcoming and show assignee. |
| `/developer/conversations` | `apps/admin-web/src/app/(app)/(developer)/developer/conversations/page.tsx` | يعرض محادثات العملاء الخاصة بالمطور. | Developer sales team | Core | Connected shared list | CONVERSATION | Critical | P0 | Needs unread/response state and lead/project context. |
| `/developer/conversations/[id]` | `apps/admin-web/src/app/(app)/(developer)/developer/conversations/[id]/page.tsx` | يفتح المحادثة ويرسل الردود ويشارك رابطًا آمنًا. | Developer sales team | Core | Connected detail/composer | CONVERSATION | Critical | P0 | Redesign as focused messaging workspace; keep lead context visible. |
| `/developer/public-leads` | `apps/admin-web/src/app/(app)/(developer)/developer/public-leads/page.tsx` | يعرض طلبات التواصل القادمة من صفحات المشاريع والموقع. | Developer sales/admin | Core | Connected shared list/actions | PUBLIC-ADMIN | Critical | P0 | Show visitor signals and conversion readiness, not only rows/status. |
| `/developer/public-leads/[id]` | `apps/admin-web/src/app/(app)/(developer)/developer/public-leads/[id]/page.tsx` | يعرض طلب الموقع ومصدره ويعالجه أو يحوله. | Developer sales/admin | Core | Connected detail/actions | PUBLIC-ADMIN | Critical | P0 | Visitor behavior and CRM conversion should be one guided decision surface. |
| `/developer/reservation-requests` | `apps/admin-web/src/app/(app)/(developer)/developer/reservation-requests/page.tsx` | يعرض طلبات الحجز الواردة ويوافق أو يرفض. | Developer sales/inventory manager | Core | Connected queue/actions | RESERVATION | Critical | P0 | Approval holds the unit; inventory impact and conflict/expiry must be visually explicit. |
| `/developer/reservation-requests/[id]` | `apps/admin-web/src/app/(app)/(developer)/developer/reservation-requests/[id]/page.tsx` | يراجع طلب الحجز ويوافق أو يرفض وينشئ غرفة صفقة. | Developer sales manager | Core | Connected detail/actions | RESERVATION, ROOM | Critical | P0 | Key Stage 8 handoff; use stepper and decision summary with consequences. |
| `/developer/deal-rooms` | `apps/admin-web/src/app/(app)/(developer)/developer/deal-rooms/page.tsx` | يعرض غرف التفاوض الخاصة بمشاريع المطور. | Developer sales/legal | Core | Connected table | ROOM | High | P1 | Surface unread activity, stuck rooms, pending approvals, and counterparties. |
| `/developer/deal-rooms/[id]` | `apps/admin-web/src/app/(app)/(developer)/developer/deal-rooms/[id]/page.tsx` | يدير محادثة الصفقة والمشاركين والحالة. | Developer sales/legal | Core | Connected multi-section detail | ROOM | High | P1 | Needs workspace layout, step status, document/evidence area, and sticky composer/actions. |
| `/developer/deals` | `apps/admin-web/src/app/(app)/(developer)/developer/deals/page.tsx` | يعرض الصفقات الناتجة من غرف التفاوض. | Developer sales/management | Core | Connected shared list | DEAL | High | P1 | Add totals, funnel link, approval queue, and inventory linkage. |
| `/developer/deals/[id]` | `apps/admin-web/src/app/(app)/(developer)/developer/deals/[id]/page.tsx` | يعرض الصفقة وسعرها وحالتها وإجراءاتها. | Developer sales/management | Core | Connected detail/actions | DEAL | High | P1 | Clarify source room, participants, approvals, money, cancellation reasons, and audit. |
| `/developer/commission-rules` | `apps/admin-web/src/app/(app)/(developer)/developer/commission-rules/page.tsx` | ينشئ قواعد احتساب عمولات البيع. | Developer owner/admin | Core | Connected create/edit list | COMMISSION | High | P1 | Rule priority, overlap, examples, effective dates, and simulation are needed. |
| `/developer/commissions` | `apps/admin-web/src/app/(app)/(developer)/developer/commissions/page.tsx` | يعرض العمولات الناتجة من الصفقات. | Developer finance/admin | Core | Connected shared list | COMMISSION | High | P1 | Add summary totals, status grouping, payout readiness, and export. |
| `/developer/commissions/[id]` | `apps/admin-web/src/app/(app)/(developer)/developer/commissions/[id]/page.tsx` | يعرض تفاصيل العمولة ويوافق أو يرفض حسب الصلاحية. | Developer finance/admin | High | Connected detail/actions | COMMISSION | High | P1 | Calculation provenance and approval evidence should be readable without domain knowledge. |
| `/developer/website-settings` | `apps/admin-web/src/app/(app)/(developer)/developer/website-settings/page.tsx` | يضبط هوية ومعلومات موقع المطور العام. | Developer marketing/admin | High | Connected settings form | PUBLIC-ADMIN | High | P1 | Add live preview, publish status, brand validation, locale, SEO, and unsaved-change protection. |
| `/developer/domains` | `apps/admin-web/src/app/(app)/(developer)/developer/domains/page.tsx` | يضيف نطاق المطور ويتحقق من ربطه. | Developer admin/IT | High | Connected DNS workflow | PUBLIC-ADMIN | Medium | P1 | Use step-by-step checklist, DNS copy controls, status polling, and troubleshooting. |
| `/developer/import-export` | `apps/admin-web/src/app/(app)/(developer)/developer/import-export/page.tsx` | يرفع بيانات مشروع ومخزون ويعرض معاينة قبل الاستيراد. | Developer data/admin | High | Connected preview form | IMPORT | Medium | P2 | Important onboarding utility; needs file mapping, progress, recoverability, and clearer validation. |
| `/developer/import-export/jobs` | `apps/admin-web/src/app/(app)/(developer)/developer/import-export/jobs/page.tsx` | يعرض عمليات الاستيراد السابقة وحالتها. | Developer data/admin | Supporting | Connected list | IMPORT | Medium | P2 | Improve status summary, error count, retry/continue cues, and timestamps. |
| `/developer/import-export/jobs/[id]` | `apps/admin-web/src/app/(app)/(developer)/developer/import-export/jobs/[id]/page.tsx` | يعرض أخطاء صفوف الاستيراد ويؤكد العملية أو يلغيها. | Developer data/admin | High | Connected detail/commit/cancel | IMPORT | Medium | P2 | Large error sets need grouping, downloadable correction file, and safe commit summary. |
| `/developer/import-export/export` | `apps/admin-web/src/app/(app)/(developer)/developer/import-export/export/page.tsx` | يصدّر المشاريع والمخزون والصفقات والعمولات والحساب. | Developer admin/data | Supporting | Connected export panel | IMPORT | Low | P2 | Add format, record count, privacy, generation progress, and audit context. |
| `/developer/hr/employees` | `apps/admin-web/src/app/(app)/(developer)/developer/hr/employees/page.tsx` | ينشئ ويعرض سجلات الموظفين. | Developer HR/admin | Supporting | Generic connected CRUD | `/hr/employees` | Low | P2 | Domain-specific employee UX, permissions, privacy, pagination, and validation are thin. |
| `/developer/hr/employees/[id]` | `apps/admin-web/src/app/(app)/(developer)/developer/hr/employees/[id]/page.tsx` | يعرض سجل موظف ونشاطه. | Developer HR/admin | Supporting | Generic detail + activity | `/hr/employees/:id`, OPS | Low | P2 | Safe basic record; no payroll. Improve sections and sensitive-data handling. |
| `/developer/hr/departments` | `apps/admin-web/src/app/(app)/(developer)/developer/hr/departments/page.tsx` | ينشئ ويعرض أقسام الشركة. | Developer HR/admin | Supporting | Generic connected CRUD | `/hr/departments` | Low | P2 | Could be compact settings rather than a full primary route. |
| `/developer/hr/departments/[id]` | `apps/admin-web/src/app/(app)/(developer)/developer/hr/departments/[id]/page.tsx` | يعرض تفاصيل قسم ونشاطه. | Developer HR/admin | Supporting | Generic detail + activity | `/hr/departments/:id`, OPS | Low | P3 | Internal low-frequency screen. |
| `/developer/hr/attendance` | `apps/admin-web/src/app/(app)/(developer)/developer/hr/attendance/page.tsx` | يسجل ويعرض حضور الموظفين بشكل بسيط. | Developer HR/admin | Supporting | Generic connected CRUD | `/hr/attendance` | Low | P2 | No payroll automation; table/form model is not calendar or shift-oriented. |
| `/developer/hr/attendance/[id]` | `apps/admin-web/src/app/(app)/(developer)/developer/hr/attendance/[id]/page.tsx` | يعرض سجل حضور واحد ونشاطه. | Developer HR/admin | Internal | Generic detail + activity | `/hr/attendance/:id`, OPS | Low | P3 | Better reached from employee/calendar context than main navigation. |
| `/developer/accounting/transactions` | `apps/admin-web/src/app/(app)/(developer)/developer/accounting/transactions/page.tsx` | يسجل الإيرادات والمصروفات اليدوية ويعرضها. | Developer accounting/admin | High | Generic connected CRUD | `/accounting/transactions` | Medium | P2 | No gateway or ledger settlement; currency, evidence, periods, and controls need domain UX. |
| `/developer/accounting/transactions/[id]` | `apps/admin-web/src/app/(app)/(developer)/developer/accounting/transactions/[id]/page.tsx` | يعرض حركة مالية واحدة ونشاطها. | Developer accounting/admin | High | Generic detail + activity | `/accounting/transactions/:id`, OPS | Low | P2 | Needs attachments/audit/reconciliation vocabulary when backend supports them. |
| `/developer/accounting/summary` | `apps/admin-web/src/app/(app)/(developer)/developer/accounting/summary/page.tsx` | يعرض مجموع الإيرادات والمصروفات والصافي. | Developer owner/accounting | High | Generic key-value summary | `/accounting/summary` | Medium | P2 | Object-key rendering is developer-like; use named financial KPIs and periods/charts. |
| `/developer/accounting/categories` | `apps/admin-web/src/app/(app)/(developer)/developer/accounting/categories/page.tsx` | ينشئ تصنيفات الإيرادات والمصروفات. | Developer accounting/admin | Supporting | Generic connected CRUD | `/accounting/categories` | Low | P3 | Move under Accounting settings. |
| `/developer/accounting/categories/[id]` | `apps/admin-web/src/app/(app)/(developer)/developer/accounting/categories/[id]/page.tsx` | يعرض تصنيفًا ماليًا ونشاطه. | Developer accounting/admin | Internal | Generic detail + activity | `/accounting/categories/:id`, OPS | Low | P3 | Low-frequency internal page. |
| `/developer/legal/documents` | `apps/admin-web/src/app/(app)/(developer)/developer/legal/documents/page.tsx` | يسجل بيانات المستندات القانونية ويعرضها. | Developer legal/admin | Supporting | Generic connected CRUD | `/legal/documents` | Low | P2 | Explicitly no upload/e-signature; label should not imply document management. |
| `/developer/legal/documents/[id]` | `apps/admin-web/src/app/(app)/(developer)/developer/legal/documents/[id]/page.tsx` | يعرض بيانات مستند قانوني ونشاطه. | Developer legal/admin | Supporting | Generic detail + activity | `/legal/documents/:id`, OPS | Low | P3 | Metadata-only foundation. |
| `/developer/legal/cases` | `apps/admin-web/src/app/(app)/(developer)/developer/legal/cases/page.tsx` | ينشئ ويتابع القضايا القانونية الأساسية. | Developer legal/admin | Supporting | Generic connected CRUD | `/legal/cases` | Low | P2 | Needs ownership, deadlines, risk, linked project/deal, and documents. |
| `/developer/legal/cases/[id]` | `apps/admin-web/src/app/(app)/(developer)/developer/legal/cases/[id]/page.tsx` | يعرض قضية قانونية ونشاطها. | Developer legal/admin | Supporting | Generic detail + activity | `/legal/cases/:id`, OPS | Low | P3 | Internal detail foundation. |
| `/developer/ads/campaigns` | `apps/admin-web/src/app/(app)/(developer)/developer/ads/campaigns/page.tsx` | يسجل خطط الحملات الإعلانية فقط. | Developer marketing | Supporting | Explicit planning placeholder/registry | `/ads/campaigns` | Low | P3 | No Google/Meta/TikTok publishing; keep out of main demo/navigation. |
| `/developer/ads/campaigns/[id]` | `apps/admin-web/src/app/(app)/(developer)/developer/ads/campaigns/[id]/page.tsx` | يعرض خطة حملة إعلانية ونشاطها. | Developer marketing | Internal | Explicit placeholder detail | `/ads/campaigns/:id`, OPS | Low | P3 | Do not present as ad-tech integration. |
| `/developer/cameras/devices` | `apps/admin-web/src/app/(app)/(developer)/developer/cameras/devices/page.tsx` | يسجل أجهزة الكاميرا فقط بدون بث. | Developer operations/security | Supporting | Explicit registry placeholder | `/cameras/devices` | Low | P3 | No stream, DVR, credentials, or AI; keep under More. |
| `/developer/cameras/devices/[id]` | `apps/admin-web/src/app/(app)/(developer)/developer/cameras/devices/[id]/page.tsx` | يعرض بيانات جهاز كاميرا فقط. | Developer operations/security | Internal | Explicit placeholder detail | `/cameras/devices/:id`, OPS | Low | P3 | Avoid camera-product expectations until a real integration exists. |

## Platform admin pages

| Route / Page | File path | Main purpose | Primary user role | Business importance | Current UI state | Main data/API dependency | Demo priority | Redesign priority | Notes |
|---|---|---|---|---|---|---|---|---|---|
| `/platform/dashboard` | `apps/admin-web/src/app/(app)/(platform-admin)/platform/dashboard/page.tsx` | يعرض ملخص المنظمات والتحققات وحوكمة السوق. | Platform owner/admin/support | Core | Placeholder stats and sample queue | AUTH only | Critical | P0 | `--` counts and hard-coded sample verification rows weaken the platform story. |
| `/platform/operations/overview` | `apps/admin-web/src/app/(app)/(platform-admin)/platform/operations/overview/page.tsx` | يعرض ملخص تشغيل كل أقسام المنصة. | Platform owner/admin | High | Connected summary/activity | `/operations/summary`, `/operations/activities` | Medium | P2 | Broad but generic; needs platform-specific exceptions and trends. |
| `/platform/organizations` | `apps/admin-web/src/app/(app)/(platform-admin)/platform/organizations/page.tsx` | يعرض كل المطورين وشركات الوساطة وينشئ منظمة جديدة. | Platform admin/support | Core | Connected create/filter/table | PLATFORM | Critical | P0 | Central governance page; improve search, status/type facets, bulk triage, and clear create flow. |
| `/platform/organizations/[id]` | `apps/admin-web/src/app/(app)/(platform-admin)/platform/organizations/[id]/page.tsx` | يراجع ملف الشركة ومستنداتها ودعواتها ويوافق أو يوقفها. | Platform admin/compliance | Core | Connected rich dossier/actions | PLATFORM, INVITE | Critical | P0 | Excellent functional coverage; redesign around review checklist, risk, audit, invitations, and sticky decisions. |
| `/platform/verifications` | `apps/admin-web/src/app/(app)/(platform-admin)/platform/verifications/page.tsx` | يعرض طابور مستندات الشركات المنتظرة للمراجعة. | Platform admin/compliance | Core | Connected queue/table | PLATFORM | Critical | P0 | Add SLA/age, risk/type filters, preview, assignee, and keyboard-friendly review. |
| `/platform/verifications/[id]` | `apps/admin-web/src/app/(app)/(platform-admin)/platform/verifications/[id]/page.tsx` | يعرض بيانات مستند التحقق ويوافق أو يرفض أو يطلب معلومات. | Platform admin/compliance | Core | Connected detail/decision dialogs | PLATFORM | Critical | P0 | Metadata-only document handling may lack actual preview; decision consequences should be explicit. |
| `/platform/lead-claim-conflicts` | `apps/admin-web/src/app/(app)/(platform-admin)/platform/lead-claim-conflicts/page.tsx` | يحل تعارض مطالبة أكثر من وسيط بنفس العميل. | Platform admin/support | Core | Connected conflict list/resolution | CLAIM | High | P1 | Stage 8 governance proof; compare claims side-by-side and show attribution evidence/timeline. |
| `/platform/crm/leads` | `apps/admin-web/src/app/(app)/(platform-admin)/platform/crm/leads/page.tsx` | يعرض كل العملاء المحتملين حسب صلاحية المنصة. | Platform support/admin | High | Connected shared list | CRM | High | P1 | Platform view should emphasize exceptions, ownership, consent, abuse, and routing, not sales execution. |
| `/platform/crm/leads/[id]` | `apps/admin-web/src/app/(app)/(platform-admin)/platform/crm/leads/[id]/page.tsx` | يعرض تفاصيل عميل للمراجعة والدعم. | Platform support/admin | High | Connected shared detail | CRM, CONVERSATION | High | P1 | Same component as sales views; platform-specific audit/PII/support affordances need differentiation. |
| `/platform/crm/pipeline` | `apps/admin-web/src/app/(app)/(platform-admin)/platform/crm/pipeline/page.tsx` | يعرض مراحل العملاء على مستوى المنصة. | Platform admin/support | Supporting | Connected foundation Kanban | CRM | Medium | P2 | Question whether platform should mutate sales stages globally; role intent is unclear. |
| `/platform/crm/tasks` | `apps/admin-web/src/app/(app)/(platform-admin)/platform/crm/tasks/page.tsx` | يعرض وينشئ مهام CRM على مستوى المنصة. | Platform support | Supporting | Connected list/create/filter | CRM | Medium | P2 | Needs assignee/team and support-case context; raw lead ID is weak. |
| `/platform/crm/activities` | `apps/admin-web/src/app/(app)/(platform-admin)/platform/crm/activities/page.tsx` | يعرض سجل نشاط CRM للرقابة والمتابعة. | Platform support/auditor | High | Connected filters/timeline/pagination | CRM | Medium | P2 | Useful audit surface; improve filters, event grouping, entity links, and export. |
| `/platform/conversations` | `apps/admin-web/src/app/(app)/(platform-admin)/platform/conversations/page.tsx` | يعرض محادثات المنصة حسب الصلاحية. | Platform support/admin | High | Connected shared list | CONVERSATION | High | P1 | Privacy and reason-for-access cues are important in a platform-wide view. |
| `/platform/conversations/[id]` | `apps/admin-web/src/app/(app)/(platform-admin)/platform/conversations/[id]/page.tsx` | يراجع محادثة ويرد أو يغيّر حالتها. | Platform support/admin | High | Connected detail/composer | CONVERSATION | High | P1 | Separate support intervention from normal sales participation and show audit warning. |
| `/platform/deal-rooms` | `apps/admin-web/src/app/(app)/(platform-admin)/platform/deal-rooms/page.tsx` | يعرض كل غرف الصفقات المسموح بمراجعتها. | Platform admin/support | High | Connected table | ROOM | High | P1 | Need exception/risk view rather than mirroring organization workspaces. |
| `/platform/deal-rooms/[id]` | `apps/admin-web/src/app/(app)/(platform-admin)/platform/deal-rooms/[id]/page.tsx` | يراجع غرفة صفقة ومشاركيها ورسائلها. | Platform admin/support | High | Connected shared detail | ROOM | High | P1 | Privacy, intervention reason, audit logging, and governance actions need stronger UX. |
| `/platform/deals` | `apps/admin-web/src/app/(app)/(platform-admin)/platform/deals/page.tsx` | يعرض الصفقات على مستوى المنصة. | Platform admin/finance | High | Connected shared list | DEAL | High | P1 | Add exception flags, organization filters, amounts, approval state, and audit lens. |
| `/platform/deals/[id]` | `apps/admin-web/src/app/(app)/(platform-admin)/platform/deals/[id]/page.tsx` | يعرض تفاصيل صفقة للمراجعة أو القرار. | Platform admin/finance | High | Connected shared detail/actions | DEAL | High | P1 | Clarify which platform actions are allowed and why. |
| `/platform/commissions` | `apps/admin-web/src/app/(app)/(platform-admin)/platform/commissions/page.tsx` | يعرض عمولات السوق للمراجعة. | Platform admin/finance | High | Connected shared list | COMMISSION | High | P1 | Needs cross-organization totals, disputes, approval queues, and audit filters. |
| `/platform/commissions/[id]` | `apps/admin-web/src/app/(app)/(platform-admin)/platform/commissions/[id]/page.tsx` | يراجع عمولة ويوافق أو يرفض حسب الصلاحية. | Platform admin/finance | High | Connected detail/actions | COMMISSION | High | P1 | Show rule source, parties, calculation, evidence, decision reason, and payout state. |
| `/platform/domains` | `apps/admin-web/src/app/(app)/(platform-admin)/platform/domains/page.tsx` | يراجع نطاقات الشركات ويوافق أو يرفض ربطها. | Platform admin/support | Core | Connected platform review table | PUBLIC-ADMIN | High | P1 | Trust-critical; expose DNS evidence, collision/security warnings, age, and organization context. |
| `/platform/import-export/jobs` | `apps/admin-web/src/app/(app)/(platform-admin)/platform/import-export/jobs/page.tsx` | يعرض عمليات الاستيراد على مستوى المنصة. | Platform admin/support | Supporting | Connected list | IMPORT | Low | P2 | Internal troubleshooting view; needs organization and actor context. |
| `/platform/import-export/jobs/[id]` | `apps/admin-web/src/app/(app)/(platform-admin)/platform/import-export/jobs/[id]/page.tsx` | يراجع عملية استيراد وأخطاءها ويؤكدها أو يلغيها. | Platform admin/support | Supporting | Connected detail/commit/cancel | IMPORT | Low | P2 | Destructive scope needs explicit organization/record summary. |
| `/platform/import-export/export` | `apps/admin-web/src/app/(app)/(platform-admin)/platform/import-export/export/page.tsx` | يصدّر بيانات المنصة المسموح بها. | Platform admin/auditor | Supporting | Connected export panel | IMPORT | Low | P2 | Add permission/scope disclosure, audit reason, progress, and retention guidance. |
| `/platform/hr/overview` | `apps/admin-web/src/app/(app)/(platform-admin)/platform/hr/overview/page.tsx` | يعرض أساسيات الموارد البشرية على مستوى المنصة. | Platform admin/HR | Internal | Generic connected CRUD page | `/hr/employees` | Low | P3 | Label says overview but uses generic records UI; keep under More. |
| `/platform/accounting/overview` | `apps/admin-web/src/app/(app)/(platform-admin)/platform/accounting/overview/page.tsx` | يعرض ملخص الإيرادات والمصروفات للمنصة. | Platform owner/finance | High | Generic key-value summary | `/accounting/summary` | Medium | P2 | Replace raw object keys with financial KPI semantics, period, currency, and trend. |
| `/platform/legal/overview` | `apps/admin-web/src/app/(app)/(platform-admin)/platform/legal/overview/page.tsx` | يعرض سجل المستندات القانونية للمنصة. | Platform legal/admin | Internal | Generic connected CRUD page | `/legal/documents` | Low | P3 | This is not a true overview; no upload/e-signature workflow. |
| `/platform/ads/overview` | `apps/admin-web/src/app/(app)/(platform-admin)/platform/ads/overview/page.tsx` | يعرض سجل خطط الحملات فقط. | Platform marketing | Internal | Explicit placeholder/registry | `/ads/campaigns` | Low | P3 | No publishing provider integration. |
| `/platform/cameras/overview` | `apps/admin-web/src/app/(app)/(platform-admin)/platform/cameras/overview/page.tsx` | يعرض سجل أجهزة الكاميرا فقط. | Platform operations/security | Internal | Explicit placeholder/registry | `/cameras/devices` | Low | P3 | No stream or credentials; avoid primary-nav placement. |

## Admin inventory findings across components

- `DashboardShell` wraps authenticated pages with `AuthGuard`, `IconSidebar`, `Topbar`, and `MobileBottomNav`.
- Platform pages also require a platform role, a `PLATFORM` organization, and at least one of three organization permissions. Developer and brokerage guards check role family and organization type, but individual page navigation is not permission-filtered.
- Most connected screens use TanStack Query hooks and shared API adapters. Loading and empty components exist, and many pages render inline retry/error messages.
- The shared `DataTable` defaults to the inaccurate empty copy “This area will connect to the backend in a later slice” even when the screen is already API-backed unless callers override it.
- Generic `OperationsPage` turns HR/accounting/legal/ads/cameras into one create/edit/filter/table pattern. It accelerates coverage but erases domain-specific mental models and makes every department look the same.

# 3. Public Web Page Inventory

Public data mode is controlled by `NEXT_PUBLIC_PUBLIC_WEB_DATA_MODE` (`api`, `mock`, or default `hybrid`). The main dependencies are:

- Marketplace: `GET /public/projects`, `GET /public/projects/:slug`.
- Organizations: `GET /public/organizations/:slug`, organization projects, and `GET /public/domain/:host`.
- Lead capture: `POST /public/leads` with consent, UTM, source page, preferred contact, visitor/session IDs, and honeypot fields.
- Public chat: `GET/POST /conversations/by-token/:token[/messages]`.
- First-party tracking: `POST /public/visitors/session` and `POST /public/visitors/events`.
- External analytics scripts are enabled only when their GA/Google Ads/Meta/TikTok environment IDs exist.

| Route / Page | File path | Main purpose | Primary user role | Business importance | Current UI state | Main data/API dependency | Demo priority | Redesign priority | Notes |
|---|---|---|---|---|---|---|---|---|---|
| `/` | `apps/public-web/src/app/page.tsx` | الصفحة الرئيسية للسوق وتعرض قيمة المنصة ومشاريع مميزة. | Anonymous/public visitor | Core | API-backed with safe failure; contains demo/internal copy | Featured public projects | Critical | P0 | Premium first impression is missing; phrases like “marketplace surface”, “mock fallback”, and “future handoff” expose implementation details. |
| `/projects` | `apps/public-web/src/app/projects/page.tsx` | يعرض المشاريع العامة ويصفيها حسب المدينة والمنطقة والنوع والسعر. | Buyer/investor/public visitor | Core | API/mock/hybrid list + server filters + empty state | `/public/projects` | Critical | P0 | Useful foundation; needs search, result count/sort, filter chips/drawer, richer cards, mobile-first behavior, and skeletons. |
| `/projects/[slug]` | `apps/public-web/src/app/projects/[slug]/page.tsx` | يعرض صور المشروع وسعره وخطة السداد والوحدات ونموذج الاهتمام. | Buyer/investor | Core | API/mock/hybrid detail + live lead form | Project API, lead API, visitor tracking | Critical | P0 | Main conversion page; no sticky contact CTA, static background images, no true gallery/map/brochure, and too much internal “public-safe” copy. |
| `/developers/[slug]` | `apps/public-web/src/app/developers/[slug]/page.tsx` | يعرض ملف المطور ومشاريعه العامة. | Buyer/investor | High | API/mock/hybrid profile | Public organization + projects | High | P1 | Header uses hard-coded demo developer link globally; profile lacks logo/media/contact CTA and empty portfolio handling. |
| `/brokerages/[slug]` | `apps/public-web/src/app/brokerages/[slug]/page.tsx` | يعرض ملف شركة الوساطة ومناطق عملها. | Buyer/seller/public visitor | High | API/mock/hybrid but explicitly “visual placeholder” | Public organization | Medium | P1 | No projects, brokers, contact form, or clear value/action; should not claim a complete profile. |
| `/landing/[slug]` | `apps/public-web/src/app/landing/[slug]/page.tsx` | يعرض صفحة حملة فيها مشروع ومزايا ونموذج اهتمام. | Campaign visitor | High | Mock-only renderer + connected lead form | Mock landing data; lead API on submit | Medium | P1 | Long page is visually usable, but content and trust are mock; sticky Call/WhatsApp/Visit buttons are placeholders. |
| `/c/[token]` | `apps/public-web/src/app/c/[token]/page.tsx` | يفتح رابط محادثة خاص للزائر ويعرض الرسائل ويرسل ردًا. | Lead/client with private link | Core | Connected public-safe chat; mock token fallback | Conversation token APIs | Critical | P0 | Noindex is correct; improve chat visual model, privacy/link-expiry guidance, live refresh, identity clarity, and mobile composer. |
| `/[domain]` | `apps/public-web/src/app/[domain]/page.tsx` | الصفحة الرئيسية لموقع المطور أو شركة الوساطة على نطاقها. | Organization-site visitor | Core | API/mock/hybrid branded shell | Domain resolution + organization projects | High | P0 | Shows internal “resolution mode” and “mock site” cards. It also renders inside the global marketplace header/footer/nav, creating duplicate shells. |
| `/[domain]/projects` | `apps/public-web/src/app/[domain]/projects/page.tsx` | يعرض مشاريع الشركة داخل موقعها الخاص. | Organization-site visitor | Core | API/mock/hybrid project section | Domain organization projects | High | P0 | Same duplicate-shell problem; no organization-specific filtering or search. |
| `/[domain]/projects/[slug]` | `apps/public-web/src/app/[domain]/projects/[slug]/page.tsx` | يعرض مشروعًا داخل موقع الشركة مع بياناته ووسيلة تواصل. | Buyer on organization site | Core | API/mock/hybrid detail + contact section | Domain/org/project data + lead API | Critical | P0 | Duplicates the marketplace project-detail implementation and can drift; lacks sticky CTA and strong media UX. |
| `/[domain]/about` | `apps/public-web/src/app/[domain]/about/page.tsx` | يعرّف الزائر بالشركة ومناطق عملها ونقاط قوتها. | Organization-site visitor | High | API/mock/hybrid simple profile | Domain organization | Medium | P1 | `noindex: true`; simple cards, no story/media/team/licenses. Duplicate global and local navigation. |
| `/[domain]/contact` | `apps/public-web/src/app/[domain]/contact/page.tsx` | يعرض بيانات الشركة ونموذج إرسال طلب تواصل. | Organization-site visitor | Core | Connected contact form | Domain organization + lead API | High | P0 | Strong business function; long form and duplicate shell; needs direct contact CTA, localized consent, and success next steps. |
| `/[domain]/landing/[slug]` | `apps/public-web/src/app/[domain]/landing/[slug]/page.tsx` | يعرض صفحة حملة خاصة بالشركة على نطاقها. | Campaign visitor | High | Mock-only renderer in org shell | Mock domain landing + lead API | Medium | P1 | Triple navigation pressure on mobile: global bottom nav, organization header, and sticky CTA; all landing content remains mock. |

## Non-visual Public routes and global frontend behavior

| Route / Page | File path | Main purpose | Primary user role | Business importance | Current UI state | Main data/API dependency | Demo priority | Redesign priority | Notes |
|---|---|---|---|---|---|---|---|---|---|
| `/robots.txt` | `apps/public-web/src/app/robots.ts` | يخبر محركات البحث بما يمكن فهرسته. | Search crawler | High | Implemented metadata route | Site base URL | Low | P2 | Disallows `/api/` and `/_next/`; review domain-site indexing strategy before launch. |
| `/sitemap.xml` | `apps/public-web/src/app/sitemap.ts` | يرسل روابط الصفحات العامة لمحركات البحث. | Search crawler | High | Implemented with dynamic API data and guarded failure | Public project/org data | Low | P2 | Includes demo slugs and skips dynamic routes when data load fails; custom-domain canonical strategy needs review. |
| Global layout | `apps/public-web/src/app/layout.tsx` | يضيف الهيدر والفوتر والتنقل السفلي والثيم والتتبع لكل الصفحات. | All public visitors | Core | Functional but over-global | Theme storage, tracking env/API | Critical | P0 | Must become route-aware so organization sites and private chat do not inherit inappropriate marketplace chrome. |
| Visitor tracking | `apps/public-web/src/components/tracking/first-party-visitor-tracking.tsx` | يسجل مشاهدة الصفحة والمشروع والبحث والفلاتر والتمرير والوقت. | Anonymous visitor, sales analytics consumer | Core | Non-blocking connected tracking | `/public/visitors/session`, `/public/visitors/events` | High | P1 | `projectSlugFromPath` recognizes only `/projects/:slug`, not `/[domain]/projects/:slug`; consent/privacy governance and bot filtering need review. |
| Public lead/contact forms | `apps/public-web/src/components/forms/public-lead-form.tsx`, `public-contact-form.tsx` | يجمع الاسم والهاتف وطريقة التواصل والموافقة ثم ينشئ طلبًا أو محادثة. | Buyer/lead | Core | Connected, with UTM, visitor IDs, rate-limit/error/success states | `/public/leads` | Critical | P0 | Two near-duplicate implementations can drift. Project-interest input is displayed but not submitted as a dedicated field; forms need phone validation and shorter progressive disclosure. |

## Public shared chrome inventory

- **Marketplace header:** POPWAM logo plus Projects, a hard-coded `/developers/demo-developer`, and `/brokerages/demo-brokerage`.
- **Marketplace mobile bottom nav:** Home, Search (`/projects`), Developers (hard-coded demo slug), and More → Brokerages (hard-coded demo slug).
- **Marketplace footer:** implementation/status copy still says data is mocked and integrations disabled, which is unsuitable for a customer demo.
- **Organization shell:** its own Home-brand link plus Projects, About, Contact, and its own organization footer. Because it is nested under the root layout, both sets of headers/footers remain.
- **Landing sticky CTA:** exists only in `LandingPageRenderer`; all three action components are visibly labeled placeholders and the bar competes with the global mobile bottom nav.

# 4. Mobile App Screen Inventory

The Flutter app is an authenticated, broker-oriented operational app rather than a public anonymous marketplace. `GoRouter` checks only signed-in state; it does not perform route-level role filtering. The backend remains the final authorization boundary. The one exception is `/c/:token`, which is intentionally accessible without login.

| Route / Screen | File path | Main purpose | Primary user role | Business importance | Current UI state | Main data/API dependency | Demo priority | Redesign priority | Notes |
|---|---|---|---|---|---|---|---|---|---|
| `/auth/loading` — `SplashScreen` | `apps/mobile/lib/features/auth/presentation/splash_screen.dart` | ينتظر فحص جلسة المستخدم عند فتح التطبيق. | Any mobile user | Core | Minimal logo + progress | Secure token storage, `/auth/me` through controller | High | P1 | No recovery/offline messaging if session check is slow. |
| `/login` — `LoginScreen` | `apps/mobile/lib/features/auth/presentation/login_screen.dart` | يسجل دخول مستخدم التطبيق. | Broker/company mobile user | Core | Functional simple form | `/auth/login` | Critical | P0 | Needs show password, stronger email validation, language/theme, trust/support, and connection-aware error. |
| `/marketplace/projects` — `ProjectsListScreen` | `apps/mobile/lib/features/marketplace/presentation/projects_list_screen.dart` | يعرض المشاريع المتاحة للوسيط حسب صلاحيات السوق. | Broker/mobile sales | Core | Connected list/cards/filter; image fallback | `/marketplace/projects` | Critical | P0 | Main home screen; needs search/sort/result count, richer media, brokerage eligibility, and polished skeletons. |
| `/marketplace/units` — `UnitsListScreen` | `apps/mobile/lib/features/marketplace/presentation/units_list_screen.dart` | يعرض الوحدات المتاحة ويطبق فلاتر السوق. | Broker/mobile sales | Core | Connected list/cards/filter | `/marketplace/units` | Critical | P0 | Needs project context, media, favorites/compare only if product-approved, and clearer availability/price hierarchy. |
| `/marketplace/map` — `MapSearchScreen` | `apps/mobile/lib/features/marketplace/presentation/map_search_screen.dart` | يبحث عن المشاريع داخل حدود خريطة. | Broker/mobile sales | High | Backend bbox search with explicit map UI placeholder | `/marketplace/map-search` | High | P1 | No actual map widget; should not be a primary bottom-nav item before implementation. |
| `/projects/:id` — `ProjectDetailScreen` | `apps/mobile/lib/features/project_detail/presentation/project_detail_screen.dart` | يعرض تفاصيل المشروع وخطط السداد ووحداته ويبدأ مطالبة عميل. | Broker/mobile sales | Core | Connected; single-image “carousel” placeholder | `/marketplace/projects/:id`, `/marketplace/units?projectId=` | Critical | P0 | Key demo screen; needs real gallery, sticky CTA, overview sections, map, eligibility, and polished unit cards. |
| `/units/:id` — `UnitDetailScreen` | `apps/mobile/lib/features/unit_detail/presentation/unit_detail_screen.dart` | يعرض تفاصيل الوحدة وسعرها ويبدأ مطالبة عميل. | Broker/mobile sales | Core | Connected detail + claim CTA | `/marketplace/units/:id` | Critical | P0 | Needs images/floor plan, project breadcrumb, availability trust, payment plan clarity, and sticky CTA. |
| `/profile` — `ProfileScreen` | `apps/mobile/lib/features/profile/presentation/profile_screen.dart` | يعرض الحساب ويجمع روابط CRM والمطالبات والحجوزات والصفقات والعمولات. | Signed-in mobile user | Core | Connected identity/CRM summary; overloaded link hub | Auth session, `/crm/summary` | Critical | P0 | Profile doubles as “More” with nine buttons. Split account/settings from daily operational navigation. |
| `/broker-profile` — `BrokerProfileScreen` | `apps/mobile/lib/features/profile/presentation/broker_profile_screen.dart` | يعرض رخصة وبيانات الوسيط. | Broker | High | GET-ready; error copy admits backend gap | `/broker-profile/me` | Medium | P1 | Endpoint availability may vary; edit icon opens a placeholder. |
| pushed `BrokerProfileEditPlaceholderScreen` | `apps/mobile/lib/features/profile/presentation/broker_profile_screen.dart` | يخبر المستخدم أن تعديل ملف الوسيط غير متاح. | Broker | Supporting | Explicit placeholder | No update API | Low | P3 | Hide edit action until supported or mark clearly as read-only; do not demo. |
| `/crm-leads` — `CrmLeadsListScreen` | `apps/mobile/lib/features/crm/presentation/crm_leads_list_screen.dart` | يعرض عملاء CRM مع فلترة الحالة وطريقة التواصل. | Broker/sales | Core | Connected filter/list/cards | `/crm/leads` | Critical | P0 | Daily workflow; needs search, assigned-to-me, recency/next task, quick contact, and filter chips. |
| `/crm-marketplace-leads` — `CrmMarketplaceLeadsScreen` | `apps/mobile/lib/features/crm/presentation/crm_marketplace_leads_screen.dart` | يعرض عملاء السوق المتاحين ويتيح المطالبة بهم. | Broker | Core | Connected list/filter/claim | `/crm/leads/marketplace`, `/crm/leads/:id/claim` | Critical | P0 | Make claim eligibility and consequence obvious; protect against accidental claim. |
| `/crm-leads/:id` — `CrmLeadDetailScreen` | `apps/mobile/lib/features/crm/presentation/crm_lead_detail_screen.dart` | يعرض العميل والمشروع وUTM ويطالب به أو يغير حالته أو يفتح محادثة. | Broker/sales | Core | Connected rich detail/actions | `/crm/leads/:id`, claim/status, conversation creation | Critical | P0 | Excellent demo flow but information is card-stacked; needs one primary next action and timeline. |
| `/crm-conversations` — `ConversationsListScreen` | `apps/mobile/lib/features/conversations/presentation/conversations_list_screen.dart` | يعرض محادثات CRM ويفلترها بالحالة. | Broker/sales | Core | Connected list/filter | `/conversations` | Critical | P0 | Needs unread/last message/response age and better chat affordance. |
| `/crm-conversations/:id` — `ConversationDetailScreen` | `apps/mobile/lib/features/conversations/presentation/conversation_detail_screen.dart` | يعرض الرسائل ويرسل ردًا ويغير حالة المحادثة. | Broker/sales | Core | Connected messaging/detail/status sheet | Conversation detail/messages/status APIs | Critical | P0 | Composer is not a native sticky chat composer; message styling and keyboard behavior need redesign. |
| `/c/:token` — `PublicConversationTokenScreen` | `apps/mobile/lib/features/conversations/presentation/public_conversation_token_screen.dart` | يفتح محادثة الزائر من رابط خاص بدون تسجيل دخول. | Public client/lead | Core | Connected public token chat | `/conversations/by-token/:token[/messages]` | High | P1 | Should clarify privacy, link sharing, sender identity, expiry, and whether web is the canonical public experience. |
| `/lead-claims` — `LeadClaimsListScreen` | `apps/mobile/lib/features/lead_claims/presentation/lead_claims_list_screen.dart` | يعرض مطالبات الوسيط بالعملاء. | Broker | Core | Connected list/cards | `/lead-claims/my` | High | P1 | Add active/expired/released grouping, countdown, project, and next action. |
| `/lead-claims/new` — `LeadClaimFormScreen` | `apps/mobile/lib/features/lead_claims/presentation/lead_claim_form_screen.dart` | ينشئ مطالبة بعميل من مشروع أو وحدة. | Broker | Core | Connected form; requires route context | `POST /lead-claims` | High | P1 | Context-first is good; form should summarize rules, expiry, privacy, and conflicts before submit. |
| `/lead-claims/:id` — `LeadClaimDetailScreen` | `apps/mobile/lib/features/lead_claims/presentation/lead_claim_detail_screen.dart` | يعرض المطالبة ويحررها أو يبدأ طلب حجز. | Broker | Core | Connected detail/release/reservation bridge | Claim detail/release | High | P1 | Add timeline, expiry countdown, eligibility, and clearer irreversible release confirmation. |
| `/reservation-requests` — `ReservationRequestsListScreen` | `apps/mobile/lib/features/reservation_requests/presentation/reservation_requests_list_screen.dart` | يعرض طلبات الحجز وحالتها. | Broker | Core | Connected list/cards | `/reservation-requests` | High | P1 | Group pending/approved/rejected/cancelled and show hold expiry/next step. |
| `/reservation-requests/new` — `ReservationRequestFormScreen` | `apps/mobile/lib/features/reservation_requests/presentation/reservation_request_form_screen.dart` | ينشئ طلب حجز من مطالبة فعالة. | Broker | Core | Connected context form | `POST /reservation-requests`, project units | High | P1 | Requires `state.extra` draft; deep links/restarts can lose context and show missing-input state. |
| `/reservation-requests/:id` — `ReservationRequestDetailScreen` | `apps/mobile/lib/features/reservation_requests/presentation/reservation_request_detail_screen.dart` | يعرض طلب الحجز ويلغيه أو ينشئ غرفة صفقة بعد الموافقة. | Broker | Core | Connected detail/actions | Reservation detail/cancel, room creation | Critical | P1 | Important Stage 8 bridge; use progress stepper, unit summary, hold terms, and clear conditional CTA. |
| `/deal-rooms` — `DealRoomsListScreen` | `apps/mobile/lib/features/deal_rooms/presentation/deal_rooms_list_screen.dart` | يعرض غرف التفاوض الخاصة بالوسيط. | Broker | Core | Connected list/cards | `/deal-rooms` | High | P1 | Show unread count, counterparties, stage, urgency, and latest message. |
| `/deal-rooms/:id` — `DealRoomDetailScreen` | `apps/mobile/lib/features/deal_rooms/presentation/deal_room_detail_screen.dart` | يدير المشاركين والرسائل وحالة غرفة الصفقة ويدعو العميل. | Broker | Core | Connected dense detail/messaging/actions | Room detail/messages/status/invite | High | P1 | Many actions compete; redesign as chat workspace with a compact deal header and action sheet. |
| `/deals` — `DealsListScreen` | `apps/mobile/lib/features/deals/presentation/deals_list_screen.dart` | يعرض صفقات الوسيط. | Broker | Core | Connected list/cards | `/deals` | High | P1 | Add status filters, totals, next action, and commission linkage. |
| `/deals/:id` — `DealDetailScreen` | `apps/mobile/lib/features/deals/presentation/deal_detail_screen.dart` | يعرض تفاصيل الصفقة ويفتح غرفة التفاوض. | Broker | Core | Connected read-only detail | `/deals/:id` | High | P1 | Needs clearer money/status hierarchy, people, timeline, and related commission. |
| `/commissions` — `CommissionsListScreen` | `apps/mobile/lib/features/commissions/presentation/commissions_list_screen.dart` | يعرض عمولات الوسيط. | Broker | Core | Connected list/cards | `/commissions` | High | P1 | Add total/pending/approved group, period filter, and payout expectations. |
| `/commissions/:id` — `CommissionDetailScreen` | `apps/mobile/lib/features/commissions/presentation/commission_detail_screen.dart` | يعرض تفاصيل العمولة ويفتح الصفقة. | Broker | High | Connected read-only detail | `/commissions/:id` | High | P1 | Explain calculation and approval/payout states in simple language. |
| `_MissingRouteInputScreen` | `apps/mobile/lib/core/router/app_router.dart` | يشرح أن إنشاء المطالبة أو الحجز يحتاج فتح مشروع أو مطالبة أولًا. | Broker | Supporting | Functional utility empty state | Route query/extra state | Medium | P1 | Good guardrail, but it should offer a direct recovery button instead of only explanatory text. |

## Mobile configuration and completeness notes

- API base URL is compile-time `API_BASE_URL`, defaulting to Android emulator host `http://10.0.2.2:3000`; timeouts are 15s connect and 20s receive.
- Dio adds bearer tokens and attempts one refresh via `/auth/refresh`. Tokens use `flutter_secure_storage`.
- The app has one Material 3 light theme seeded with teal `#0F766E`; no dark/comfort themes, font family, localization delegates, or supported locales are configured.
- Shared `EmptyState` and retry actions are used well across many screens. Loading is usually a centered spinner rather than content-shaped skeletons.
- `MarketplaceFiltersSheet` exposes eight text fields. City, district, and unit type are free text instead of controlled/filterable choices; three numeric fields share one row and can become cramped on narrow devices.
- Public marketplace browsing is not anonymous in the app. Only the public conversation token route bypasses authentication.

# 5. Navigation Map

## 5.1 Admin desktop sidebar

Current behavior: a 72px icon-only sidebar chooses one role-family array, then shows up to 12 items. Items marked primary are promoted, then recent local click usage can reorder them, then `desktopPriority` breaks ties. Everything else is grouped inside **More**. Tooltips carry the labels. The dynamic order can make navigation move between sessions and reduce muscle memory.

### Platform navigation

Visibility for every item below: platform role + `PLATFORM` organization at layout level. Individual items are **not** filtered by permissions.

| Label | Icon | Target | Current placement | Recommendation |
|---|---|---|---|---|
| Dashboard | Home | `/platform/dashboard` | Primary/icon | **Stay main** after real metrics exist. |
| Operations | ClipboardList | `/platform/operations/overview` | Primary/icon | Move to **More**; exceptions belong on Dashboard. |
| Organizations | Building2 | `/platform/organizations` | Top 12 | **Stay main**. |
| Verifications | ClipboardCheck | `/platform/verifications` | Top 12 | **Stay main**. |
| Claim Conflicts | AlertTriangle | `/platform/lead-claim-conflicts` | Top 12 | **Stay main** while conflicts are active; badge count. |
| CRM Leads | UsersRound | `/platform/crm/leads` | Top 12 | **Stay main** for support/admin roles only. |
| CRM Pipeline | FolderKanban | `/platform/crm/pipeline` | Top 12 | Move to **More**; sales ownership is unclear. |
| CRM Tasks | ClipboardList | `/platform/crm/tasks` | Top 12 | Move to **More**, or main only for support. |
| CRM Activity | History | `/platform/crm/activities` | Top 12 | Move to **More**, main for auditor/support by permission. |
| Conversations | MessageSquareText | `/platform/conversations` | Top 12 | **Stay main** for support; More for other platform roles. |
| HR | BriefcaseBusiness | `/platform/hr/overview` | Top 12 | Move to **More**. |
| Accounting | Calculator | `/platform/accounting/overview` | Top 12 | Move to **More**, main for finance role. |
| Legal | Landmark | `/platform/legal/overview` | More by default | Move to **More**. |
| Ads | Megaphone | `/platform/ads/overview` | More | Keep **More** and hide during demo. |
| Cameras | Camera | `/platform/cameras/overview` | More | Keep **More** and hide during demo. |
| Deal Rooms | MessageSquareText | `/platform/deal-rooms` | More | Move to **More** unless support permission. |
| Deals | Landmark | `/platform/deals` | More | **Stay main** for platform finance/operations; More otherwise. |
| Commissions | BadgeDollarSign | `/platform/commissions` | More | **Stay main** for finance; More otherwise. |
| Domains | Globe2 | `/platform/domains` | More | **Stay main** for verification/support; More otherwise. |
| Import Jobs | FileUp | `/platform/import-export/jobs` | More | Keep **More**. |
| Exports | FileDown | `/platform/import-export/export` | More | Keep **More**. |

### Developer navigation

Visibility for every item below: developer role + `DEVELOPER` organization at layout level. There is no per-item role/permission filtering, so owner, admin, sales manager, and sales agent see the same navigation.

| Label | Icon | Target | Current placement | Recommendation |
|---|---|---|---|---|
| Dashboard | Home | `/developer/dashboard` | Primary/icon | **Stay main** after redesign. |
| Operations | ClipboardList | `/developer/operations/overview` | Primary/icon | Move to **More**. |
| Projects | FolderKanban | `/developer/projects` | Primary/icon | **Stay main**. |
| Inventory | Package | `/developer/inventory` | Top 12 | **Stay main**. |
| Agreements | Handshake | `/developer/agreements` | Top 12 | **Stay main** for owner/admin; More for sales agents. |
| Broker Access | KeyRound | `/developer/broker-access` | Top 12 | **Stay main** for owner/admin; More otherwise. |
| Lead Claims | UserCheck | `/developer/lead-claims` | Top 12 | Move to **More** until it is more than conflicts. |
| Public Leads | ClipboardList | `/developer/public-leads` | Top 12 | **Stay main** for sales. |
| CRM Leads | UsersRound | `/developer/crm/leads` | Top 12 | **Stay main**. |
| CRM Pipeline | FolderKanban | `/developer/crm/pipeline` | Top 12 | **Stay main** for sales. |
| CRM Tasks | ClipboardList | `/developer/crm/tasks` | Top 12 | **Stay main** for sales or merge into CRM. |
| Conversations | MessageSquareText | `/developer/conversations` | Top 12 | **Stay main**. |
| HR Employees | BriefcaseBusiness | `/developer/hr/employees` | More | Keep **More**, role-filter to HR/admin. |
| HR Departments | BriefcaseBusiness | `/developer/hr/departments` | More | Keep **More** under HR. |
| HR Attendance | ClipboardCheck | `/developer/hr/attendance` | More | Keep **More** under HR. |
| Accounting | Calculator | `/developer/accounting/transactions` | More | Keep **More**, role-filter to finance/admin. |
| Accounting Summary | Calculator | `/developer/accounting/summary` | More | Merge as Accounting landing; **More**. |
| Accounting Categories | ClipboardList | `/developer/accounting/categories` | More | Keep under Accounting settings. |
| Legal | Landmark | `/developer/legal/documents` | More | Keep **More**, role-filter. |
| Legal Cases | Landmark | `/developer/legal/cases` | More | Keep under Legal. |
| Ads | Megaphone | `/developer/ads/campaigns` | More | Keep **More** and hide placeholder for demo. |
| Cameras | Camera | `/developer/cameras/devices` | More | Keep **More** and hide placeholder for demo. |
| Reservations | ClipboardList | `/developer/reservation-requests` | More | **Stay main** for sales/inventory because it is transaction-critical. |
| Deal Rooms | MessageSquareText | `/developer/deal-rooms` | More | Put under a main **Deals** group. |
| Deals | Landmark | `/developer/deals` | More | **Stay main** as group landing. |
| Commission Rules | BadgeDollarSign | `/developer/commission-rules` | More | Keep under Deals/Settings; admin only. |
| Commissions | BadgeDollarSign | `/developer/commissions` | More | Main for finance/owner; More for sales. |
| Website Settings | Settings2 | `/developer/website-settings` | More | Keep **More** under Website. |
| Domains | Globe2 | `/developer/domains` | More | Keep under Website. |
| Import / Export | FileUp | `/developer/import-export` | More | Keep **More**. |

### Brokerage navigation

Visibility for every item below: brokerage/individual-broker organization plus brokerage owner/admin/broker/individual-broker role. Again, no per-item permission filtering.

| Label | Icon | Target | Current placement | Recommendation |
|---|---|---|---|---|
| Dashboard | Home | `/brokerage/dashboard` | Primary/icon | **Stay main** after real content exists. |
| Marketplace | ShieldCheck | `/brokerage/dashboard` | Primary/icon, duplicate target | Create a real marketplace route or remove; never keep two labels for one page. |
| Lead Claims | UserCheck | `/brokerage/lead-claims` | Primary/icon | **Stay main** for brokers. |
| Public Leads | ClipboardList | `/brokerage/public-leads` | Top 12 | Main for brokerage admin/sales; More for individual broker if irrelevant. |
| Marketplace Leads | ShieldCheck | `/brokerage/crm/marketplace-leads` | Top 12 | **Stay main** for brokers. |
| CRM Leads | UsersRound | `/brokerage/crm/leads` | Top 12 | **Stay main**. |
| CRM Pipeline | FolderKanban | `/brokerage/crm/pipeline` | Top 12 | **Stay main** for sales manager; More for individual broker. |
| CRM Tasks | ClipboardList | `/brokerage/crm/tasks` | Top 12 | Main or merge into CRM. |
| Conversations | MessageSquareText | `/brokerage/conversations` | Top 12 | **Stay main**. |
| Reservations | ClipboardList | `/brokerage/reservation-requests` | Top 12 | **Stay main**. |
| Deal Rooms | MessageSquareText | `/brokerage/deal-rooms` | Top 12 | Put under main Deals group. |
| Deals | Landmark | `/brokerage/deals` | Top 12 | **Stay main**. |
| Commissions | BadgeDollarSign | `/brokerage/commissions` | Primary/icon despite priority 13 | **Stay main** for broker/owner. |
| Website Settings | Settings2 | `/brokerage/website-settings` | More | Keep **More**, admin only. |
| Domains | Globe2 | `/brokerage/domains` | More | Keep under Website, admin only. |
| Exports | FileDown | `/brokerage/import-export/export` | More | Keep **More**, admin only. |

## 5.2 Admin mobile bottom navigation

Current behavior: exactly four destinations are selected by `mobilePriority`, followed by **More**. Overflow appears in a grouped bottom sheet.

| Role family | Current visible items | Icon / target | Recommended visible items | What moves under More |
|---|---|---|---|---|
| Platform | Dashboard, Organizations, CRM Leads, Operations | Home `/platform/dashboard`; Building2 `/platform/organizations`; UsersRound `/platform/crm/leads`; ClipboardList `/platform/operations/overview` | Dashboard, Organizations, Verifications, CRM/Support, More | Operations departments, activity, deals/finance by role, domains, import/export. |
| Developer | Dashboard, Projects, CRM Leads, Operations | Home; FolderKanban; UsersRound; ClipboardList | Dashboard, Projects, CRM, Inventory, More | Operations, departments, configuration, import/export; Reservations/Deals accessible in role-aware More or CRM context. |
| Brokerage | Dashboard, Marketplace, Lead Claims, Conversations | Home; ShieldCheck; UserCheck; MessageSquareText | Marketplace, Leads/CRM, Conversations, Deals, More | Dashboard can become contextual inside Marketplace; settings/domains/exports and secondary queues under More. |

Conflicts: Brokerage Dashboard and Marketplace are the same route; equal mobile priorities depend on stable source ordering; mobile More can contain 12–26 destinations, which is too much for a bottom sheet without search or hierarchy.

## 5.3 Public desktop header

| Label | Icon | Target | Visibility | Recommendation |
|---|---|---|---|---|
| POPWAM | P logo tile | `/` | All public routes via root layout | Keep on marketplace routes; use route-aware brand/chrome on organization and token-chat routes. |
| Projects | None | `/projects` | Desktop `md+` | **Stay visible**. |
| Developers | None | `/developers/demo-developer` | Desktop `md+` | Replace hard-coded demo detail link with a real directory route or remove from main nav. |
| Brokerages | None | `/brokerages/demo-brokerage` | Desktop `md+` | Replace hard-coded demo detail link with a real directory route or move under Explore. |

Organization-site desktop header separately shows organization name/Home, Projects, About, Contact. It should replace—not stack beneath—the marketplace header for `/<domain>/*` routes.

## 5.4 Public mobile bottom navigation

| Label | Icon | Target | Current visibility | Recommendation |
|---|---|---|---|---|
| Home | Custom home SVG | `/` | Visible | **Stay** on marketplace routes. |
| Search | Custom search SVG | `/projects` | Visible | **Stay**; rename Projects/Search consistently. |
| Developers | Custom building SVG | `/developers/demo-developer` | Visible | Replace with real directory or move under More. |
| More | Custom ellipsis SVG | Opens sheet | Visible | **Stay**, but add route-relevant items and accessibility/theme/language controls. |
| Brokerages | Custom briefcase SVG | `/brokerages/demo-brokerage` | More sheet | Keep under More only after a real directory exists. |

On organization sites, replace this bar with Home, Projects, Contact, More—or hide it when a sticky conversion CTA is present. On `/c/[token]`, hide marketplace navigation entirely so the private conversation is focused and does not leak the user into unrelated demo pages.

## 5.5 Flutter mobile app navigation

| Label | Icon | Target screen | Visibility/role rule | Recommendation |
|---|---|---|---|---|
| Projects | `apartment_outlined` / filled | `/marketplace/projects` | Any signed-in user | **Stay visible**; rename Home/Marketplace if it is the true landing screen. |
| Units | `home_work_outlined` / filled | `/marketplace/units` | Any signed-in user | **Stay visible** for brokers. |
| Map | `map_outlined` / filled | `/marketplace/map` | Any signed-in user | Move under filters/More until the real map exists. |
| Profile | `person_outline` / filled | `/profile` | Any signed-in user | Keep Account/Profile visible only if a real **More/Work** destination exposes operational tools. |

The Profile screen currently acts as hidden navigation for CRM Leads, Marketplace Leads, Conversations, Broker Profile, Lead Claims, Reservation Requests, Deal Rooms, Deals, and Commissions. Recommended broker bottom nav: **Marketplace**, **CRM**, **Conversations**, **Deals**, **More**. Put Units/Map inside Marketplace; put claims/reservations/deal rooms/commissions inside Deals with badges; put Broker Profile, settings, theme, language, support, and logout under More.

# 6. Role-Based UX Map

| User type | Primary goal | Most important pages | Daily actions | Main navigation | Hidden under More |
|---|---|---|---|---|---|
| Platform / super admin | يحافظ على سوق موثوق ويحل المشاكل بسرعة. | Dashboard, Organizations, Verifications, Domain review, Claim Conflicts, platform Deals/Commissions, support Conversations | Review organizations/documents/domains, resolve conflicts, investigate exceptions, audit activity, support users | Dashboard, Organizations, Verifications, Exceptions, Support, Finance as permission allows | HR, Legal, Ads, Cameras, imports/exports, generic CRM pipeline/tasks unless assigned to support role |
| Developer / company admin | يدير المشاريع والمخزون والشركاء والبيع. | Developer Dashboard, Projects, Inventory, Agreements, Broker Access, Website Settings, Reservations, Deals | Create/update project/unit, publish visibility, authorize brokers, review reservations, manage organization site | Dashboard, Projects, Inventory, Sales/CRM, Reservations/Deals | HR/accounting/legal departments, ads/cameras, domains/settings, import/export, commission rules |
| Company sales user | يتابع العملاء ويحوّلهم إلى حجز وصفقة. | CRM Leads, Lead Detail, Pipeline, Tasks, Conversations, Public Leads, Reservations, Deal Rooms | Contact leads, add notes/tasks, move stage, reply, approve/coordinate reservation, continue deal | CRM, Pipeline, Conversations, Reservations/Deals | Projects configuration, selling permissions, HR/accounting/legal, website/domains, import/export |
| Broker / brokerage | يجد عقارًا مناسبًا ويحمي العميل ويكمل الصفقة ويحصل على العمولة. | Marketplace, Project/Unit Detail, Marketplace Leads, CRM, Lead Claims, Reservations, Conversations, Deal Rooms, Deals, Commissions | Browse/filter, claim lead, contact client, request reservation, negotiate, track deal/commission | Marketplace, Leads/CRM, Conversations, Deals, More | Website/domain/export for owner/admin; profile/settings/support; secondary histories |
| Public visitor | يجد مشروعًا موثوقًا ويتواصل بسهولة. | Home, Projects, Project Detail, Developer/Brokerage profile, Contact, `/c/[token]` | Search/filter, compare information, request call/chat/WhatsApp, continue private conversation | Home, Search/Projects, Saved/Recent only if later approved, Contact/More | About/legal/accessibility/language; do not expose admin concepts |
| Normal anonymous user | يفهم POPWAM قبل إرسال بياناته. | Home, Projects, organization public pages | Learn trust model, browse, verify company/project, consent to contact | Home, Projects, Developers/Organizations directory, Help | Brokerages directory, policies, language/theme/accessibility |
| Mobile app user | ينجز عمل الوسيط بسرعة أثناء الحركة. | Marketplace, CRM Lead Detail, Conversations, Reservation/Deal workflow | Search projects/units, claim, call/chat, update status, request reservation, reply, track commission | Marketplace, CRM, Conversations, Deals, More | Account/broker profile, settings, map until complete, history, support/logout |

### Role UX principles

- Do not show every module to every role. The current family-level nav is an authorization-shaped menu, not a job-shaped workspace.
- Every role’s first screen should answer: **What needs my attention now? What changed? What is the next safe action?**
- Platform views should emphasize exceptions/audit; company-admin views should emphasize configuration/readiness; sales views should emphasize next action and response time; broker views should emphasize eligibility, client protection, deal progress, and money.
- Permission-denied empty pages should be rare. Hide inaccessible nav, but keep explicit guarded URLs and backend authorization.

# 7. UI/UX Problems Found

## 7.1 Information architecture and navigation

1. Developer Admin has 30 top-level nav items. Twelve icon-only items can move based on local click history; the rest form a large More menu. This is difficult to learn and cannot express nested domains such as HR, Accounting, Website, or Deals.
2. Admin nav metadata supports `roles`, `organizationTypes`, and `permissions`, but the navigation engine selects only one role-family array and does not apply per-item metadata. All developer roles see the same department/configuration links.
3. Brokerage “Dashboard” and “Marketplace” both point to `/brokerage/dashboard` while the page says the marketplace browsing shell is future work.
4. Mobile’s Profile tab contains nine operational navigation buttons. Profile is therefore both account page and More menu, producing a long scroll and hiding daily work.
5. Public organization routes show both global POPWAM chrome and organization chrome. Domain landing pages can also add a sticky CTA, producing competing headers, footers, bottom nav, and CTA.
6. Public Developers/Brokerages navigation points directly to demo slugs; there are no directory routes.

## 7.2 Visual system conflicts

1. Theme tokens are defined in both Next apps, but most components use fixed Tailwind colors. Admin has roughly 531 `zinc-*` occurrences and Public roughly 337 `slate-*` plus 90 `emerald-*` occurrences. Dark/Eye Comfort themes can produce white cards, dark text, or incorrect borders.
2. Admin token primary is near-black with emerald accent, Public is slate with emerald accent, and Mobile uses a generated teal Material 3 scheme. They feel related but are not one named semantic brand system.
3. Cards are nearly all flat 1px bordered rectangles with `rounded-md`/`rounded`; hierarchy depends on stacking more cards rather than stronger page composition.
4. Buttons are implemented both through shared components and repeated raw classes. Primary, neutral, danger, warning, icon-only, link, and loading behaviors are not centrally guaranteed.
5. Generic operations screens make HR, accounting, legal, ads, and cameras visually identical despite different tasks and risk.

## 7.3 Density, forms, and tables

1. Project detail combines summary, edit form, selling permissions, and workflow links. Inventory combines filters, create/edit form, and full table. Important pages become long vertical stacks.
2. Many create flows request raw IDs (CRM task lead ID, claim/reservation inputs). Users should select named entities or arrive with context.
3. Admin tables rely on horizontal scrolling and fixed cell padding; there is no universal mobile row-card alternative, column chooser, density setting, bulk selection, or sticky header.
4. Operations create/edit forms place many fields in three-column grids without domain grouping or progressive disclosure.
5. Public lead/contact forms duplicate most logic and fields. They are long for a first contact, phone validation is only `required`, and preferred contact visually adds another full row.
6. Mobile marketplace filters are eight free-text fields. Controlled values, numeric validation, recent filters, and compact chips would reduce errors.

## 7.4 Loading, empty, error, and success states

1. Admin and Mobile have reusable empty/loading components, which is a strength, but most loading states are generic spinners rather than skeletons that preserve layout.
2. Admin `DataTable` default empty description claims backend connection will come later, which is misleading on already connected pages.
3. Some admin pages render a bare error paragraph outside a consistent card; errors vary in retry availability and actionability.
4. Public server pages typically use `notFound` but have no inspected custom `not-found.tsx`, `loading.tsx`, or `error.tsx` route boundaries in either web app.
5. Mobile’s missing-route-input state explains the problem but gives no recovery CTA.
6. Placeholder screens/actions remain visibly reachable: Admin dashboards, Ads/Cameras; Public mock landing and placeholder CTA buttons; Mobile Map, image carousel naming, broker edit.

## 7.5 Responsive and mobile behavior

1. Admin has a mobile bottom nav, but many page layouts remain desktop tables and multi-column forms. Navigation responsiveness does not guarantee task responsiveness.
2. CRM Pipeline uses multiple stage columns (`lg:grid-cols-4`) and a separate select-based move form; the workflow is awkward on touch/mobile.
3. Public project detail uses large `text-5xl` hero typography and static CSS background images; media is not optimized or interactive.
4. Public landing sticky CTA is `sticky` in document flow and sits above a fixed global mobile nav; organization landing pages can feel cramped.
5. Mobile filter rows with 2–3 expanded numeric fields can become narrow, and dense detail pages are long card lists without sticky next actions.

## 7.6 Arabic, RTL, French, and content language

1. Both web roots hard-code `<html lang="en">`; neither manages `dir="rtl"`.
2. Geist is loaded with `subsets: ["latin"]`. Arabic fallbacks (`IBM Plex Sans Arabic`, Cairo, Tajawal) are named in CSS but not bundled or guaranteed to exist.
3. No translation framework, locale routing, message catalog, or language switcher was found.
4. Table alignment is hard-coded `text-left`, including headers; directional icons/spacing are not logical-property-based.
5. Status enum labels are often raw English uppercase values. They need translated, human-readable labels with consistent semantics.
6. Flutter has no `supportedLocales`, localization delegates, locale resolver, custom Arabic/French fonts, or theme/direction controls.

## 7.7 Accessibility and interaction

1. Icon sidebar items have titles/ARIA labels, and many controls have labels—good foundations—but custom modal overlays do not show focus trapping, focus return, Escape handling, body scroll lock, or `aria-modal` semantics.
2. The theme/font-scale providers have no visible control, so Light/Dark/Eye Comfort and larger text are effectively hidden features.
3. Color is frequently the main status cue; status badges need text/icon redundancy and contrast testing in all themes.
4. Public CSS background images have section ARIA labels but do not behave like semantic responsive images. Gallery tiles lack meaningful visible captions and keyboard interaction.
5. Small icon-only 40px admin sidebar targets and dense table links should be checked against touch target standards.
6. Consent/privacy text is English-only; tracking begins globally, so consent and jurisdiction requirements need product/legal review before production.

## 7.8 Data and content mismatches that affect UX

1. Public `projectSlugFromPath` tracks `/projects/:slug` but not organization routes `/<domain>/projects/:slug`, so project behavior data can be incomplete.
2. Public project interest is shown as an editable input but is not sent as its own API field; only the project slug and message are submitted.
3. Hybrid/mock fallbacks are valuable for development, but production-facing copy openly mentions mock/API/slices/placeholders throughout Home, Footer, Organization pages, Brokerage profile, and Landing pages.
4. Platform and role dashboards use hard-coded placeholder values rather than connected summaries, making the product look empty even when detail workflows are strong.
5. Platform-wide shared detail components do not visually explain elevated access, privacy scope, or why a platform user can intervene.

# 8. Redesign Priority Plan

## P0 — Must be fixed before the demo

1. **Shared tokens and route-aware shells:** make light theme reliable first, remove double public chrome, stabilize admin main navigation, and hide unsupported routes/actions from the demo path.
2. **Admin entry and first impression:** `/login`, `/invite/[token]`, all three dashboards. Replace `--`/sample rows with meaningful live summaries or intentionally designed zero states.
3. **Developer core:** Projects list/create/detail/visibility, global/project inventory, selling permissions within project detail, Reservations list/detail.
4. **CRM conversion:** Developer/Brokerage CRM Leads, Lead Detail, Pipeline, Public Leads, Conversations list/detail.
5. **Public conversion:** Home, Projects, Project Detail, domain Home/Projects/Project Detail/Contact, lead/contact form, `/c/[token]`.
6. **Mobile demo journey:** Login → Marketplace Projects → Project → Unit → Lead Claim → Reservation, plus CRM Lead Detail and Conversations.

## P1 — Strongly affects product impression

1. Stage 8 governance: Agreements, Broker Access, Lead Claims/conflicts, Reservation-to-Deal-Room, Deals, Commission Rules/Commissions.
2. Platform trust: Organizations list/detail, Verifications list/detail, Domains, Claim Conflicts.
3. Public developer/brokerage profiles and campaign landing pages after replacing mock/placeholder content and actions.
4. Website Settings and Domains with previews and guided status.
5. Mobile Profile/More architecture, real Map, real media carousel, Broker Profile read-only/edit behavior, and all deal/commission screens.
6. Arabic/English/French localization, RTL, language switcher, and visible accessibility/theme control.

## P2 — Important after the first demo

1. Import preview/jobs/detail/export and data-onboarding ergonomics.
2. Operations Overview, CRM activity audit, Accounting transactions/summary, HR employees/attendance, Legal documents/cases.
3. Search/sort/saved views, bulk table actions, advanced audit/export, and responsive alternatives across operational lists.
4. SEO/canonical/sitemap strategy for organization custom domains.

## P3 — Low priority or internal-only

1. Ads campaign and Cameras device pages until real provider/stream capabilities exist.
2. HR Departments details, Accounting Categories details, Legal metadata details, and other low-frequency configuration pages.
3. Mobile Broker Profile Edit placeholder—hide until an update API is available.
4. Root redirect and other utility-only states, except for basic branded consistency.

# 9. Design System Extraction

## 9.1 Current system

| Area | Admin Web | Public Web | Flutter Mobile | Finding |
|---|---|---|---|---|
| Colors | Tokens: white/#171717, surfaces #f5f5f5/#ececec, near-black primary, emerald accent, red/amber/blue statuses; many hard-coded Zinc colors | Tokens: slate background/foreground, white surface, slate primary, emerald accent; many hard-coded Slate/Emerald colors | Material 3 `ColorScheme.fromSeed(#0F766E)` | Similar green trust cue, but semantic tokens are not consistently consumed. |
| Themes | Light, Dark, Eye Comfort in CSS/local storage | Light, Dark, Eye Comfort in CSS/local storage | Light only | Web theme controls are not surfaced; fixed colors break non-light themes. |
| Fonts | Geist Sans/Mono Latin; fallback Inter/Manrope/system/Arabic names | Same | Platform default Material font | Arabic/French brand typography is not intentionally loaded or tested. |
| Spacing | 4px base; xs 4, sm 8, md 16, lg 24, xl 32; pages `px-4/8`, cards `p-5` | Same token set; pages commonly `px-6 py-10/12/14` | Mostly 8/12/14/16/18/24/32 constants | Close enough to unify into one scale. |
| Radius | 6/8/12px tokens; most admin uses `rounded-md` | 6/8/12px tokens; pages often `rounded` | 8px cards/inputs/buttons | A consistent 8/12/16 hierarchy can be shared conceptually. |
| Cards | `DetailCard`: border, white, header divider, 20px padding; `StatCard`; many bespoke cards | Repeated bordered white/slate-50 rectangles; project cards | Elevation 0, 8px radius, 1px border | Good calm foundation, but too many equal-weight boxes. |
| Buttons | Shared 40px near-black button plus many raw variants; Lucide icons | Raw Slate/Emerald buttons, mostly no shared component | 48px filled button; outlined/icon buttons | Create semantic variants and enforce sizes/loading/focus centrally. |
| Tables/lists | Shared `DataTable`; generic operations tables; horizontal overflow | Card grids, no shared data table | ListView + Card lists | Admin needs density/responsive patterns; cards should share metadata hierarchy. |
| Forms | Shared Input/Label/Textarea plus many raw selects/inputs; RHF/Zod in some flows | Two duplicated lead/contact forms with raw controls | Material inputs; handwritten validation | Define field, select, phone, entity picker, errors, sections, sticky actions, and step forms. |
| Navigation | 72px icon sidebar, usage sorting, More; fixed mobile bottom nav | global header/footer/bottom nav plus org shell; landing sticky CTA | 4-item Material NavigationBar; Profile as overflow | Navigation must become role- and route-aware, stable, and hierarchical. |
| Dialogs/sheets | Custom fixed overlays; several action dialogs | Little dialog use; inline forms/CTA | Material modal bottom sheets | Admin dialogs need an accessible shared primitive and destructive-action standard. |
| Empty/loading/error | Shared Empty/Loading; page-specific error boxes | Filter empty state, form success/error, notFound; no route loading/error files found | Strong shared EmptyState and retry; centered spinners | Standardize state anatomy and add skeletons, recovery, support IDs, and success next steps. |

## 9.2 What should be standardized

- Semantic color tokens: canvas, surface, elevated surface, text, muted text, border, interactive, brand accent, focus, success, warning, danger, info, and status mappings.
- Typography by role: display/marketing, page title, section title, body, label, caption, number/currency; Arabic/Latin pairs with matching visual metrics.
- One spacing/radius/elevation scale and layout containers for admin vs public marketing.
- Buttons: primary, secondary, outline, ghost, destructive, link, icon; loading and disabled states; minimum 44–48px touch target.
- Form primitives: localized labels/help/errors, phone input, money/percent/date, searchable entity picker, autocomplete, consent, multi-step flow, unsaved-state warning.
- Tables: density modes, sticky header, sorting/filtering, selection/bulk actions, pagination, column visibility, row action menu, and mobile card transformation.
- Status components: enum-to-human-label mapping, color/icon/text, localized copy, and approved contrast across themes.
- Dialog/drawer/bottom-sheet primitives with focus management and responsive behavior.
- Navigation: role/permission filtered, stable order, domain groups, badges, breadcrumbs, and a searchable More/command menu.
- State patterns: initial skeleton, empty-first-use, empty-filtered, partial data, permission denied, offline/network, rate limit, destructive failure, and successful next step.

## 9.3 What can be reused

- Token variable names and the Light/Dark/Eye Comfort concept.
- Admin `PageHeader`, `DetailCard`, `StatCard`, `EmptyState`, `LoadingState`, status badges, and API/query hooks after visual/token refactoring.
- Admin shared CRM, conversation, public lead, deal room, commercial, domain, and import/export components—the functional abstraction is valuable.
- Public data adapter, SEO helper, visitor/session tracking queue, UTM capture, safe lead/chat APIs, and organization/project data models.
- Public project card information model and lead/chat success flow after content/visual unification.
- Flutter Riverpod repositories/providers, GoRouter flow, secure token refresh, shared `EmptyState`, status chips, and Material 3 base.

## 9.4 What should be replaced or retired

- Direct fixed `zinc/slate/emerald/white` styling where semantic tokens are intended.
- Usage-reordered primary navigation; preserve a stable role-specific order and use recent items only in an optional command menu.
- Duplicate Dashboard/Marketplace route and hard-coded public demo-slug navigation.
- Duplicate public lead/contact form logic; share a form engine and vary only context/content.
- Public implementation/mock/placeholder copy and demo-only status cards.
- Generic one-size-fits-all UI for departments where a module becomes production-critical.
- Visible placeholder actions/screens in demo navigation.

# 10. Proposed Future UI/UX Direction

## Product character

Use one coherent POPWAM system with two expressions:

- **Admin productivity:** calm, compact, trustworthy SaaS UI with a stable grouped sidebar, clear page title/breadcrumb, attention queue, high-density but readable tables, and sticky next actions.
- **Public marketplace:** premium editorial real-estate presentation with strong photography, generous whitespace, credibility badges, location/price/payment information, and conversion controls that remain close without becoming noisy.
- **Mobile:** task-first, thumb-friendly, fast on imperfect networks, and designed around context transitions rather than reproducing desktop modules.

## Recommended visual direction

- Keep deep slate/ink as the authority color and a refined emerald/teal as the trust/action accent. Use warm neutral surfaces for Eye Comfort.
- Use fewer equal cards. Create hierarchy with page bands, data summaries, grouped sections, split panes, timelines, and sticky action regions.
- Use a premium Latin family such as Manrope/Inter and a deliberately hosted Arabic family such as IBM Plex Sans Arabic, Noto Sans Arabic, or Tajawal after brand testing. Choose metric-compatible weights for English, Arabic, and French.
- Give real-estate media first-class treatment: responsive images, gallery/fullscreen, floor plans, map/location, video/brochure when data exists, and meaningful fallbacks.

## Platform-wide interaction direction

- Admin desktop: expanded/collapsible grouped sidebar with label + icon; compact icon mode optional, not the default discovery experience. Use breadcrumbs and a searchable command menu.
- Admin mobile: five-item role-aware bottom nav with a searchable More sheet; convert dense tables to task cards.
- Public desktop: concise header with Projects/Search, Developers directory, Brokerages directory, language, and accessibility/theme control. Organization domains get their own route-aware branded header.
- Public mobile: Home, Search, Contact/Saved if approved, More; organization sites use organization-specific items. Never stack a bottom nav and sticky CTA without reserved safe space and priority rules.
- Project detail: sticky desktop side contact card and mobile bottom CTA for Call, Chat, WhatsApp, and Visit only when each action is real/configured. The lead form can open progressively rather than occupy a large block by default.
- Accessibility: a floating but unobtrusive control for Light/Dark/Eye Comfort, font size, contrast preference, language, and motion reduction. It must not overlap mobile nav or contact CTA.
- Localization: locale-aware route/content strategy, `lang` and `dir`, logical CSS properties, localized dates/numbers/currencies/statuses, and layouts tested with long French and dense Arabic text.

## Suggested demo journeys after redesign

1. Platform admin reviews a company, verifies documents/domain, and sends or tracks an invitation.
2. Developer admin creates/publishes a project, adds inventory/payment plan, configures broker selling permissions, and reviews a reservation.
3. Broker finds a project/unit, claims a lead, starts a conversation, requests reservation, opens a deal room, and sees deal/commission progress.
4. Public visitor finds a project, understands price/payment/trust, requests Chat, and continues through `/c/[token]`.

# 11. Do Not Implement Yet

This report is discovery only. No redesign, UI source, API, Prisma, route, or data-model change is included.

Recommended future implementation slices:

1. **Slice UI-1 — Design tokens, typography, themes:** semantic tokens, hosted multilingual fonts, Light/Dark/Eye Comfort, font scale, RTL foundations, visible accessibility control, shared state/button/form/dialog primitives.
2. **Slice UI-2 — Admin layout/sidebar/topbar/mobile nav:** stable grouped role/permission navigation, dashboard attention model, breadcrumbs, responsive table/card patterns, searchable More.
3. **Slice UI-3 — Public home/projects/project detail/contact CTA:** remove internal copy, route-aware chrome, premium project cards/media, real configured sticky CTA, unified lead/contact form, directory-navigation decision.
4. **Slice UI-4 — CRM lead detail and visitor behavior UI:** lead inbox, intent/attribution/consent/visitor timeline, tasks/notes/conversation hierarchy, responsive chat workspace.
5. **Slice UI-5 — Platform/company invitations and project selling permissions polish:** organization review checklist, verification/domain decisions, invitation states, agreements/access rules, selling-mode explanations, reservation-to-deal progress.
6. **Slice UI-6 — Mobile app UX audit/fixes:** broker-oriented bottom nav, marketplace media/filter/map, sticky actions, CRM/chat, claim/reservation/deal flow, offline/error polish, localization/themes.

Before implementation, approve the navigation model, locale strategy, which placeholder modules are hidden from demo, and the single end-to-end demo journey. Then create acceptance criteria and visual references for one slice at a time.

import {
  Accessibility,
  AlertTriangle,
  BarChart3,
  BadgeDollarSign,
  BriefcaseBusiness,
  Building2,
  Calculator,
  Camera,
  ClipboardCheck,
  ClipboardList,
  FileDown,
  FileText,
  FileUp,
  FolderKanban,
  Globe2,
  Handshake,
  History,
  Home,
  KeyRound,
  Landmark,
  LifeBuoy,
  Megaphone,
  MessageSquareText,
  MoreHorizontal,
  Network,
  Package,
  Settings2,
  ShieldCheck,
  UserCheck,
  UsersRound,
} from "lucide-react";

export const safeSidebarIconMap = {
  dashboard: Home,
  employees: BriefcaseBusiness,
  attendance: ClipboardCheck,
  crm: UsersRound,
  deals: Landmark,
  dealRooms: MessageSquareText,
  files: FileText,
  reports: BarChart3,
  settings: Settings2,
  organizations: Building2,
  users: UsersRound,
  support: LifeBuoy,
  analytics: BarChart3,
  branches: Network,
  domains: Globe2,
  accessibility: Accessibility,
} as const;

export type SidebarIconKey = keyof typeof safeSidebarIconMap;

export type NavItem = {
  id: string;
  labelKey: string;
  href: string;
  label: string;
  iconKey: SidebarIconKey;
  icon: typeof Home;
  groupKey: string;
  group: string;
  sectionKey: string;
  roles?: string[];
  organizationTypes?: string[];
  permissions?: string[];
  desktopPriority: number;
  mobilePriority: number;
  isPrimary?: boolean;
  isMobilePrimary?: boolean;
};

type RawNavItem = Omit<NavItem, "labelKey" | "iconKey" | "groupKey" | "sectionKey">;

const globalHrNavItems: RawNavItem[] = [
  { id: "hr-dashboard", href: "/hr/dashboard", label: "HR Dashboard", icon: BriefcaseBusiness, group: "Human Resources", permissions: ["hr.dashboard.view", "hr.view"], desktopPriority: 100, mobilePriority: 100 },
  { id: "hr-recruitment", href: "/hr/recruitment", label: "Recruitment", icon: UsersRound, group: "Human Resources", permissions: ["hr.recruitment.view"], desktopPriority: 101, mobilePriority: 101 },
  { id: "hr-recruitment-jobs", href: "/hr/recruitment/jobs", label: "Job Openings", icon: BriefcaseBusiness, group: "Human Resources", permissions: ["hr.recruitment.view"], desktopPriority: 102, mobilePriority: 102 },
  { id: "hr-recruitment-applicants", href: "/hr/recruitment/applicants", label: "Applicants", icon: UsersRound, group: "Human Resources", permissions: ["hr.recruitment.applicants.view"], desktopPriority: 103, mobilePriority: 103 },
  { id: "hr-recruitment-interviews", href: "/hr/recruitment/interviews", label: "Interviews", icon: ClipboardCheck, group: "Human Resources", permissions: ["hr.recruitment.view"], desktopPriority: 104, mobilePriority: 104 },
  { id: "hr-recruitment-offers", href: "/hr/recruitment/offers", label: "Offers", icon: BadgeDollarSign, group: "Human Resources", permissions: ["hr.recruitment.view"], desktopPriority: 105, mobilePriority: 105 },
  { id: "hr-recruitment-documents", href: "/hr/recruitment/documents", label: "Candidate Documents", icon: FileText, group: "Human Resources", permissions: ["hr.recruitment.documents.view"], desktopPriority: 106, mobilePriority: 106 },
  { id: "hr-employees", href: "/hr/employees", label: "Employees", icon: BriefcaseBusiness, group: "Human Resources", permissions: ["hr.employees.view"], desktopPriority: 107, mobilePriority: 107 },
  { id: "hr-work-groups", href: "/hr/work-groups", label: "Work Groups", icon: Network, group: "Human Resources", permissions: ["hr.work_groups.view"], desktopPriority: 108, mobilePriority: 108 },
  { id: "hr-teams", href: "/hr/teams", label: "Teams", icon: UsersRound, group: "Human Resources", permissions: ["hr.teams.view"], desktopPriority: 109, mobilePriority: 109 },
  { id: "hr-actions", href: "/hr/actions", label: "Employee Actions", icon: ClipboardList, group: "Human Resources", permissions: ["hr.actions.view", "hr.actions.apply"], desktopPriority: 110, mobilePriority: 110 },
  { id: "hr-documents", href: "/hr/documents", label: "Employee Documents", icon: FileText, group: "Human Resources", permissions: ["hr.documents.view"], desktopPriority: 111, mobilePriority: 111 },
  { id: "hr-org-chart", href: "/hr/org-chart", label: "Organization Chart", icon: Network, group: "Human Resources", permissions: ["hr.org_chart.view"], desktopPriority: 112, mobilePriority: 112 },
  { id: "hr-attendance", href: "/hr/attendance", label: "Attendance", icon: ClipboardCheck, group: "Human Resources", permissions: ["hr.attendance.view", "hr.attendance.self"], desktopPriority: 113, mobilePriority: 113 },
  { id: "hr-finance", href: "/hr/finance", label: "Finance", icon: BadgeDollarSign, group: "Human Resources", permissions: ["hr.finance.view"], desktopPriority: 114, mobilePriority: 114 },
  { id: "hr-assets", href: "/hr/assets", label: "Asset Management", icon: Package, group: "Human Resources", permissions: ["hr.assets.view"], desktopPriority: 115, mobilePriority: 115 },
  { id: "hr-tasks", href: "/hr/tasks", label: "Tasks", icon: ClipboardList, group: "Human Resources", permissions: ["hr.tasks.view"], desktopPriority: 116, mobilePriority: 116 },
  { id: "hr-hr-documents", href: "/hr/hr-documents", label: "HR Documents", icon: FileText, group: "Human Resources", permissions: ["hr.hr_documents.view"], desktopPriority: 117, mobilePriority: 117 },
  { id: "hr-reports", href: "/hr/reports", label: "Reports", icon: BarChart3, group: "Human Resources", permissions: ["hr.reports.view"], desktopPriority: 118, mobilePriority: 118 },
  { id: "hr-settings", href: "/hr/settings", label: "HR Settings", icon: Settings2, group: "Human Resources", permissions: ["hr.settings.view"], desktopPriority: 119, mobilePriority: 119 },
];

const platformNavItems: RawNavItem[] = [
  { id: "platform-dashboard", href: "/platform/dashboard", label: "Dashboard", icon: Home, group: "Platform", desktopPriority: 1, mobilePriority: 1, isPrimary: true, isMobilePrimary: true },
  { id: "platform-organizations", href: "/platform/organizations", label: "Organizations", icon: Building2, group: "Companies", desktopPriority: 2, mobilePriority: 2, isPrimary: true, isMobilePrimary: true },
  { id: "platform-verifications", href: "/platform/verifications", label: "Verifications", icon: ClipboardCheck, group: "Companies", desktopPriority: 3, mobilePriority: 3, isPrimary: true, isMobilePrimary: true },
  { id: "platform-claim-conflicts", href: "/platform/lead-claim-conflicts", label: "Claim Conflicts", icon: AlertTriangle, group: "Reports", desktopPriority: 4, mobilePriority: 5, isPrimary: true },
  { id: "platform-real-estate", href: "/real-estate", label: "Real Estate", icon: Building2, group: "Real Estate", permissions: ["real_estate.units.view", "real_estate.projects.view"], desktopPriority: 5, mobilePriority: 5, isPrimary: true },
  { id: "platform-customers", href: "/real-estate/customers", label: "Customers", icon: UsersRound, group: "Real Estate", permissions: ["customers.view"], desktopPriority: 6, mobilePriority: 6 },
  { id: "platform-units", href: "/real-estate/units", label: "Units", icon: Building2, group: "Real Estate", permissions: ["real_estate.units.view"], desktopPriority: 7, mobilePriority: 7 },
  { id: "platform-qr-passes", href: "/real-estate/qr-passes", label: "QR Access Pass", icon: KeyRound, group: "Real Estate", permissions: ["qr_passes.view"], desktopPriority: 8, mobilePriority: 8 },
  { id: "platform-crm-leads", href: "/platform/crm/leads", label: "CRM Leads", icon: UsersRound, group: "CRM", desktopPriority: 9, mobilePriority: 4, isPrimary: true, isMobilePrimary: true },
  { id: "platform-conversations", href: "/platform/conversations", label: "Conversations", icon: MessageSquareText, group: "CRM", desktopPriority: 10, mobilePriority: 10, isPrimary: true },
  { id: "platform-crm-pipeline", href: "/platform/crm/pipeline", label: "CRM Pipeline", icon: FolderKanban, group: "CRM", desktopPriority: 11, mobilePriority: 11 },
  { id: "platform-crm-tasks", href: "/platform/crm/tasks", label: "CRM Tasks", icon: ClipboardList, group: "CRM", desktopPriority: 12, mobilePriority: 12 },
  { id: "platform-crm-activities", href: "/platform/crm/activities", label: "CRM Activity", icon: History, group: "CRM", desktopPriority: 13, mobilePriority: 13 },
  { id: "platform-deal-rooms", href: "/platform/deal-rooms", label: "Deal Rooms", icon: MessageSquareText, group: "Finance", desktopPriority: 14, mobilePriority: 14 },
  { id: "platform-deals", href: "/platform/deals", label: "Deals", icon: Landmark, group: "Finance", desktopPriority: 15, mobilePriority: 15 },
  { id: "platform-commissions", href: "/platform/commissions", label: "Commissions", icon: BadgeDollarSign, group: "Finance", desktopPriority: 16, mobilePriority: 16 },
  { id: "platform-accounting", href: "/platform/accounting/overview", label: "Accounting", icon: Calculator, group: "Finance", desktopPriority: 17, mobilePriority: 17 },
  { id: "platform-operations", href: "/platform/operations/overview", label: "Operations", icon: ClipboardList, group: "Reports", desktopPriority: 18, mobilePriority: 18 },
  ...globalHrNavItems,
  { id: "platform-legal", href: "/platform/legal/overview", label: "Legal", icon: Landmark, group: "Documents", desktopPriority: 30, mobilePriority: 30 },
  { id: "platform-domains", href: "/platform/domains", label: "Domains", icon: Globe2, group: "Settings", desktopPriority: 31, mobilePriority: 31 },
  { id: "platform-import-jobs", href: "/platform/import-export/jobs", label: "Import Jobs", icon: FileUp, group: "Documents", desktopPriority: 32, mobilePriority: 32 },
  { id: "platform-exports", href: "/platform/import-export/export", label: "Exports", icon: FileDown, group: "Reports", desktopPriority: 33, mobilePriority: 33 },
  { id: "platform-settings", href: "/platform/settings", label: "Platform Settings", icon: Settings2, group: "Settings", permissions: ["platform.settings.view"], desktopPriority: 34, mobilePriority: 34 },
  { id: "platform-ads", href: "/platform/ads/overview", label: "Ads", icon: Megaphone, group: "Platform", desktopPriority: 35, mobilePriority: 35 },
  { id: "platform-cameras", href: "/platform/cameras/overview", label: "Cameras", icon: Camera, group: "Platform", desktopPriority: 36, mobilePriority: 36 },
  { id: "my-units", href: "/my/units", label: "My Units", icon: Building2, group: "My Workspace", permissions: ["self.units.view"], desktopPriority: 90, mobilePriority: 90 },
  { id: "my-qr-passes", href: "/my/qr-passes", label: "My QR Passes", icon: KeyRound, group: "My Workspace", permissions: ["self.qr_passes.view"], desktopPriority: 91, mobilePriority: 91 },
];

const developerNavItems: RawNavItem[] = [
  { id: "dev-dashboard", href: "/developer/dashboard", label: "Dashboard", icon: Home, group: "Workspace", desktopPriority: 1, mobilePriority: 1, isPrimary: true, isMobilePrimary: true },
  { id: "dev-real-estate", href: "/real-estate", label: "Real Estate", icon: Building2, group: "Real Estate", permissions: ["real_estate.units.view", "real_estate.projects.view"], desktopPriority: 2, mobilePriority: 2, isPrimary: true },
  { id: "dev-customers", href: "/real-estate/customers", label: "Customers", icon: UsersRound, group: "Real Estate", permissions: ["customers.view"], desktopPriority: 3, mobilePriority: 3 },
  { id: "dev-units", href: "/real-estate/units", label: "Units", icon: Building2, group: "Real Estate", permissions: ["real_estate.units.view"], desktopPriority: 4, mobilePriority: 4 },
  { id: "dev-qr-passes", href: "/real-estate/qr-passes", label: "QR Access Pass", icon: KeyRound, group: "Real Estate", permissions: ["qr_passes.view"], desktopPriority: 5, mobilePriority: 5 },
  { id: "dev-projects", href: "/developer/projects", label: "Projects", icon: FolderKanban, group: "Projects & inventory", desktopPriority: 2, mobilePriority: 2, isPrimary: true, isMobilePrimary: true },
  { id: "dev-inventory", href: "/developer/inventory", label: "Inventory", icon: Package, group: "Projects & inventory", desktopPriority: 3, mobilePriority: 4, isPrimary: true, isMobilePrimary: true },
  { id: "dev-crm-leads", href: "/developer/crm/leads", label: "CRM Leads", icon: UsersRound, group: "CRM & leads", desktopPriority: 4, mobilePriority: 3, isPrimary: true, isMobilePrimary: true },
  { id: "dev-conversations", href: "/developer/conversations", label: "Conversations", icon: MessageSquareText, group: "CRM & leads", desktopPriority: 5, mobilePriority: 5, isPrimary: true },
  { id: "dev-public-leads", href: "/developer/public-leads", label: "Public Leads", icon: ClipboardList, group: "CRM & leads", desktopPriority: 6, mobilePriority: 6, isPrimary: true },
  { id: "dev-crm-pipeline", href: "/developer/crm/pipeline", label: "CRM Pipeline", icon: FolderKanban, group: "CRM & leads", desktopPriority: 7, mobilePriority: 7 },
  { id: "dev-crm-tasks", href: "/developer/crm/tasks", label: "CRM Tasks", icon: ClipboardList, group: "CRM & leads", desktopPriority: 8, mobilePriority: 8 },
  { id: "dev-lead-claims", href: "/developer/lead-claims", label: "Lead Claims", icon: UserCheck, group: "CRM & leads", desktopPriority: 9, mobilePriority: 9 },
  { id: "dev-agreements", href: "/developer/agreements", label: "Agreements", icon: Handshake, group: "Projects & inventory", desktopPriority: 10, mobilePriority: 10 },
  { id: "dev-broker-access", href: "/developer/broker-access", label: "Broker Access", icon: KeyRound, group: "Projects & inventory", desktopPriority: 11, mobilePriority: 11 },
  { id: "dev-reservations", href: "/developer/reservation-requests", label: "Reservations", icon: ClipboardList, group: "Reservations & deals", desktopPriority: 12, mobilePriority: 12 },
  { id: "dev-deal-rooms", href: "/developer/deal-rooms", label: "Deal Rooms", icon: MessageSquareText, group: "Reservations & deals", desktopPriority: 13, mobilePriority: 13 },
  { id: "dev-deals", href: "/developer/deals", label: "Deals", icon: Landmark, group: "Reservations & deals", desktopPriority: 14, mobilePriority: 14 },
  { id: "dev-commission-rules", href: "/developer/commission-rules", label: "Commission Rules", icon: BadgeDollarSign, group: "Reservations & deals", desktopPriority: 15, mobilePriority: 15 },
  { id: "dev-commissions", href: "/developer/commissions", label: "Commissions", icon: BadgeDollarSign, group: "Reservations & deals", desktopPriority: 16, mobilePriority: 16 },
  { id: "dev-operations", href: "/developer/operations/overview", label: "Operations", icon: ClipboardList, group: "Operations", desktopPriority: 17, mobilePriority: 17 },
  ...globalHrNavItems,
  { id: "dev-accounting", href: "/developer/accounting/transactions", label: "Accounting", icon: Calculator, group: "Operations", desktopPriority: 21, mobilePriority: 21 },
  { id: "dev-accounting-summary", href: "/developer/accounting/summary", label: "Accounting Summary", icon: Calculator, group: "Operations", desktopPriority: 22, mobilePriority: 22 },
  { id: "dev-accounting-categories", href: "/developer/accounting/categories", label: "Accounting Categories", icon: ClipboardList, group: "Operations", desktopPriority: 23, mobilePriority: 23 },
  { id: "dev-legal", href: "/developer/legal/documents", label: "Legal", icon: Landmark, group: "Operations", desktopPriority: 24, mobilePriority: 24 },
  { id: "dev-legal-cases", href: "/developer/legal/cases", label: "Legal Cases", icon: Landmark, group: "Operations", desktopPriority: 25, mobilePriority: 25 },
  { id: "dev-website-settings", href: "/developer/website-settings", label: "Website Settings", icon: Settings2, group: "Website & data", desktopPriority: 26, mobilePriority: 26 },
  { id: "dev-domains", href: "/developer/domains", label: "Domains", icon: Globe2, group: "Website & data", desktopPriority: 27, mobilePriority: 27 },
  { id: "dev-import-export", href: "/developer/import-export", label: "Import / Export", icon: FileUp, group: "Website & data", desktopPriority: 28, mobilePriority: 28 },
  { id: "dev-ads", href: "/developer/ads/campaigns", label: "Ads", icon: Megaphone, group: "Foundations", desktopPriority: 29, mobilePriority: 29 },
  { id: "dev-cameras", href: "/developer/cameras/devices", label: "Cameras", icon: Camera, group: "Foundations", desktopPriority: 30, mobilePriority: 30 },
  { id: "my-units", href: "/my/units", label: "My Units", icon: Building2, group: "My Workspace", permissions: ["self.units.view"], desktopPriority: 90, mobilePriority: 90 },
  { id: "my-qr-passes", href: "/my/qr-passes", label: "My QR Passes", icon: KeyRound, group: "My Workspace", permissions: ["self.qr_passes.view"], desktopPriority: 91, mobilePriority: 91 },
];

const brokerageNavItems: RawNavItem[] = [
  { id: "brokerage-dashboard", href: "/brokerage/dashboard", label: "Dashboard", icon: Home, group: "Workspace", desktopPriority: 1, mobilePriority: 1, isPrimary: true, isMobilePrimary: true },
  { id: "brokerage-real-estate", href: "/real-estate", label: "Real Estate", icon: Building2, group: "Real Estate", permissions: ["real_estate.units.view", "real_estate.projects.view"], desktopPriority: 2, mobilePriority: 2, isPrimary: true },
  { id: "brokerage-customers", href: "/real-estate/customers", label: "Customers", icon: UsersRound, group: "Real Estate", permissions: ["customers.view"], desktopPriority: 3, mobilePriority: 3 },
  { id: "brokerage-units", href: "/real-estate/units", label: "Units", icon: Building2, group: "Real Estate", permissions: ["real_estate.units.view"], desktopPriority: 4, mobilePriority: 4 },
  { id: "brokerage-qr-passes", href: "/real-estate/qr-passes", label: "QR Access Pass", icon: KeyRound, group: "Real Estate", permissions: ["qr_passes.view"], desktopPriority: 5, mobilePriority: 5 },
  { id: "brokerage-marketplace-leads", href: "/brokerage/crm/marketplace-leads", label: "Marketplace Leads", icon: ShieldCheck, group: "CRM & leads", desktopPriority: 2, mobilePriority: 2, isPrimary: true, isMobilePrimary: true },
  { id: "brokerage-crm-leads", href: "/brokerage/crm/leads", label: "CRM Leads", icon: UsersRound, group: "CRM & leads", desktopPriority: 3, mobilePriority: 3, isPrimary: true, isMobilePrimary: true },
  { id: "brokerage-conversations", href: "/brokerage/conversations", label: "Conversations", icon: MessageSquareText, group: "CRM & leads", desktopPriority: 4, mobilePriority: 4, isPrimary: true, isMobilePrimary: true },
  { id: "brokerage-lead-claims", href: "/brokerage/lead-claims", label: "Lead Claims", icon: UserCheck, group: "CRM & leads", desktopPriority: 5, mobilePriority: 5, isPrimary: true },
  { id: "brokerage-public-leads", href: "/brokerage/public-leads", label: "Public Leads", icon: ClipboardList, group: "CRM & leads", desktopPriority: 6, mobilePriority: 6 },
  { id: "brokerage-crm-pipeline", href: "/brokerage/crm/pipeline", label: "CRM Pipeline", icon: FolderKanban, group: "CRM & leads", desktopPriority: 7, mobilePriority: 7 },
  { id: "brokerage-crm-tasks", href: "/brokerage/crm/tasks", label: "CRM Tasks", icon: ClipboardList, group: "CRM & leads", desktopPriority: 8, mobilePriority: 8 },
  { id: "brokerage-reservations", href: "/brokerage/reservation-requests", label: "Reservations", icon: ClipboardList, group: "Reservations & deals", desktopPriority: 9, mobilePriority: 9 },
  { id: "brokerage-deal-rooms", href: "/brokerage/deal-rooms", label: "Deal Rooms", icon: MessageSquareText, group: "Reservations & deals", desktopPriority: 10, mobilePriority: 10 },
  { id: "brokerage-deals", href: "/brokerage/deals", label: "Deals", icon: Landmark, group: "Reservations & deals", desktopPriority: 11, mobilePriority: 11 },
  { id: "brokerage-commissions", href: "/brokerage/commissions", label: "Commissions", icon: BadgeDollarSign, group: "Reservations & deals", desktopPriority: 12, mobilePriority: 12 },
  ...globalHrNavItems,
  { id: "brokerage-website-settings", href: "/brokerage/website-settings", label: "Website Settings", icon: Settings2, group: "Website & data", desktopPriority: 14, mobilePriority: 14 },
  { id: "brokerage-domains", href: "/brokerage/domains", label: "Domains", icon: Globe2, group: "Website & data", desktopPriority: 15, mobilePriority: 15 },
  { id: "brokerage-exports", href: "/brokerage/import-export/export", label: "Exports", icon: FileDown, group: "Website & data", desktopPriority: 16, mobilePriority: 16 },
  { id: "my-units", href: "/my/units", label: "My Units", icon: Building2, group: "My Workspace", permissions: ["self.units.view"], desktopPriority: 90, mobilePriority: 90 },
  { id: "my-qr-passes", href: "/my/qr-passes", label: "My QR Passes", icon: KeyRound, group: "My Workspace", permissions: ["self.qr_passes.view"], desktopPriority: 91, mobilePriority: 91 },
];

const unfinishedHrItems = new Set([
  "hr-recruitment-interviews",
  "hr-recruitment-offers",
  "hr-recruitment-documents",
  "hr-finance",
  "hr-assets",
  "hr-tasks",
  "hr-hr-documents",
  "hr-reports",
]);

export const platformNav = withNavMetadata(platformNavItems);
export const developerNav = withNavMetadata(developerNavItems);
export const brokerageNav = withNavMetadata(brokerageNavItems);

export const moreNavItem: NavItem = withNavMetadata([{
  id: "nav-more",
  href: "#",
  label: "More",
  icon: MoreHorizontal,
  group: "Navigation",
  desktopPriority: 999,
  mobilePriority: 999,
}])[0];

function withNavMetadata(items: RawNavItem[]): NavItem[] {
  return items.filter(isProductionNavigationItem).map((item) => {
    const group = canonicalSection(item);
    return {
      ...item,
      group,
      sectionKey: sectionKeyForGroup(group),
      labelKey: `navigation.labels.${messageKey(item.label)}`,
      groupKey: `navigation.groups.${messageKey(group)}`,
      iconKey: iconKeyFor(item),
    };
  });
}

function isProductionNavigationItem(item: RawNavItem) {
  if (unfinishedHrItems.has(item.id)) return false;
  if (item.id.includes("domains") && process.env.NEXT_PUBLIC_ENABLE_DOMAIN_MANAGEMENT !== "true") return false;
  if (item.id.includes("cameras") && process.env.NEXT_PUBLIC_ENABLE_CAMERA_INTEGRATIONS !== "true") return false;
  if (item.id.includes("ads") && process.env.NEXT_PUBLIC_ENABLE_AD_PROVIDER_INTEGRATIONS !== "true") return false;
  return true;
}

function canonicalSection(item: RawNavItem) {
  const value = `${item.id} ${item.href} ${item.label}`.toLowerCase();
  if (value.includes("organization") || value.includes("verification")) return "Organizations";
  if (value.includes("real-estate") || value.includes("unit") || value.includes("project") || value.includes("inventory")) return "Real Estate";
  if (value.includes("hr-") || value.includes("/hr/") || value.includes("employee") || value.includes("attendance") || value.includes("recruitment")) return "Human Resources";
  if (value.includes("crm") || value.includes("lead") || value.includes("conversation")) return "CRM";
  if (value.includes("accounting") || value.includes("finance") || value.includes("deal") || value.includes("commission") || value.includes("reservation")) return "Finance";
  if (value.includes("legal") || value.includes("agreement")) return "Legal";
  if (value.includes("camera")) return "Cameras";
  if (value.includes("ads") || value.includes("advert")) return "Advertising";
  if (value.includes("document") || value.includes("file") || value.includes("import")) return "Documents";
  if (value.includes("report") || value.includes("export") || value.includes("conflict") || value.includes("operation")) return "Reports";
  if (value.includes("my-") || value.includes("/my/") || value.includes("workspace")) return "My Workspace";
  if (value.includes("setting") || value.includes("domain") || value.includes("website")) return "Settings";
  return "Platform";
}

function sectionKeyForGroup(group: string) {
  return group.toLowerCase().replace(/\s+/g, "-");
}

function messageKey(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\//g, " ")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
}

function iconKeyFor(item: RawNavItem): SidebarIconKey {
  const text = `${item.id} ${item.label}`.toLowerCase();
  if (text.includes("attendance")) return "attendance";
  if (text.includes("employee") || text.includes("hr")) return "employees";
  if (text.includes("deal room")) return "dealRooms";
  if (text.includes("deal") || text.includes("reservation") || text.includes("commission")) return "deals";
  if (text.includes("domain")) return "domains";
  if (text.includes("organization") || text.includes("verification")) return "organizations";
  if (text.includes("crm") || text.includes("lead") || text.includes("conversation")) return "crm";
  if (text.includes("import") || text.includes("export")) return "files";
  if (text.includes("accounting") || text.includes("pipeline") || text.includes("activity")) return "analytics";
  if (text.includes("setting")) return "settings";
  if (text.includes("support")) return "support";
  if (text.includes("project") || text.includes("inventory") || text.includes("branch")) return "branches";
  if (text.includes("dashboard") || text.includes("overview")) return "dashboard";
  return "reports";
}

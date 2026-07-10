import {
  AlertTriangle,
  BadgeDollarSign,
  BriefcaseBusiness,
  Building2,
  Calculator,
  Camera,
  ClipboardCheck,
  ClipboardList,
  FileDown,
  FileUp,
  FolderKanban,
  Globe2,
  Handshake,
  History,
  Home,
  KeyRound,
  Landmark,
  Megaphone,
  MessageSquareText,
  MoreHorizontal,
  Package,
  Settings2,
  ShieldCheck,
  UserCheck,
  UsersRound,
} from "lucide-react";

export type NavItem = {
  id: string;
  href: string;
  label: string;
  icon: typeof Home;
  group: string;
  roles?: string[];
  organizationTypes?: string[];
  permissions?: string[];
  desktopPriority: number;
  mobilePriority: number;
  isPrimary?: boolean;
  isMobilePrimary?: boolean;
};

export const platformNav: NavItem[] = [
  { id: "platform-dashboard", href: "/platform/dashboard", label: "Dashboard", icon: Home, group: "Workspace", desktopPriority: 1, mobilePriority: 1, isPrimary: true, isMobilePrimary: true },
  { id: "platform-organizations", href: "/platform/organizations", label: "Organizations", icon: Building2, group: "Trust & governance", desktopPriority: 2, mobilePriority: 2, isPrimary: true, isMobilePrimary: true },
  { id: "platform-verifications", href: "/platform/verifications", label: "Verifications", icon: ClipboardCheck, group: "Trust & governance", desktopPriority: 3, mobilePriority: 3, isPrimary: true, isMobilePrimary: true },
  { id: "platform-claim-conflicts", href: "/platform/lead-claim-conflicts", label: "Claim Conflicts", icon: AlertTriangle, group: "Trust & governance", desktopPriority: 4, mobilePriority: 5, isPrimary: true },
  { id: "platform-crm-leads", href: "/platform/crm/leads", label: "CRM Leads", icon: UsersRound, group: "CRM & support", desktopPriority: 5, mobilePriority: 4, isPrimary: true, isMobilePrimary: true },
  { id: "platform-conversations", href: "/platform/conversations", label: "Conversations", icon: MessageSquareText, group: "CRM & support", desktopPriority: 6, mobilePriority: 6, isPrimary: true },
  { id: "platform-crm-pipeline", href: "/platform/crm/pipeline", label: "CRM Pipeline", icon: FolderKanban, group: "CRM & support", desktopPriority: 7, mobilePriority: 7 },
  { id: "platform-crm-tasks", href: "/platform/crm/tasks", label: "CRM Tasks", icon: ClipboardList, group: "CRM & support", desktopPriority: 8, mobilePriority: 8 },
  { id: "platform-crm-activities", href: "/platform/crm/activities", label: "CRM Activity", icon: History, group: "CRM & support", desktopPriority: 9, mobilePriority: 9 },
  { id: "platform-deal-rooms", href: "/platform/deal-rooms", label: "Deal Rooms", icon: MessageSquareText, group: "Deals & finance", desktopPriority: 10, mobilePriority: 10 },
  { id: "platform-deals", href: "/platform/deals", label: "Deals", icon: Landmark, group: "Deals & finance", desktopPriority: 11, mobilePriority: 11 },
  { id: "platform-commissions", href: "/platform/commissions", label: "Commissions", icon: BadgeDollarSign, group: "Deals & finance", desktopPriority: 12, mobilePriority: 12 },
  { id: "platform-accounting", href: "/platform/accounting/overview", label: "Accounting", icon: Calculator, group: "Deals & finance", desktopPriority: 13, mobilePriority: 13 },
  { id: "platform-operations", href: "/platform/operations/overview", label: "Operations", icon: ClipboardList, group: "Operations", desktopPriority: 14, mobilePriority: 14 },
  { id: "platform-hr", href: "/platform/hr/overview", label: "HR", icon: BriefcaseBusiness, group: "Operations", desktopPriority: 15, mobilePriority: 15 },
  { id: "platform-legal", href: "/platform/legal/overview", label: "Legal", icon: Landmark, group: "Operations", desktopPriority: 16, mobilePriority: 16 },
  { id: "platform-domains", href: "/platform/domains", label: "Domains", icon: Globe2, group: "Website & data", desktopPriority: 17, mobilePriority: 17 },
  { id: "platform-import-jobs", href: "/platform/import-export/jobs", label: "Import Jobs", icon: FileUp, group: "Website & data", desktopPriority: 18, mobilePriority: 18 },
  { id: "platform-exports", href: "/platform/import-export/export", label: "Exports", icon: FileDown, group: "Website & data", desktopPriority: 19, mobilePriority: 19 },
  { id: "platform-ads", href: "/platform/ads/overview", label: "Ads", icon: Megaphone, group: "Foundations", desktopPriority: 20, mobilePriority: 20 },
  { id: "platform-cameras", href: "/platform/cameras/overview", label: "Cameras", icon: Camera, group: "Foundations", desktopPriority: 21, mobilePriority: 21 },
];

export const developerNav: NavItem[] = [
  { id: "dev-dashboard", href: "/developer/dashboard", label: "Dashboard", icon: Home, group: "Workspace", desktopPriority: 1, mobilePriority: 1, isPrimary: true, isMobilePrimary: true },
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
  { id: "dev-hr", href: "/developer/hr/employees", label: "HR Employees", icon: BriefcaseBusiness, group: "Operations", desktopPriority: 18, mobilePriority: 18 },
  { id: "dev-hr-departments", href: "/developer/hr/departments", label: "HR Departments", icon: BriefcaseBusiness, group: "Operations", desktopPriority: 19, mobilePriority: 19 },
  { id: "dev-hr-attendance", href: "/developer/hr/attendance", label: "HR Attendance", icon: ClipboardCheck, group: "Operations", desktopPriority: 20, mobilePriority: 20 },
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
];

export const brokerageNav: NavItem[] = [
  { id: "brokerage-dashboard", href: "/brokerage/dashboard", label: "Dashboard", icon: Home, group: "Workspace", desktopPriority: 1, mobilePriority: 1, isPrimary: true, isMobilePrimary: true },
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
  { id: "brokerage-hr", href: "/developer/hr/employees", label: "Employees", icon: BriefcaseBusiness, group: "Operations", permissions: ["hr.employees.view", "hr.view", "hr.manage"], desktopPriority: 13, mobilePriority: 13 },
  { id: "brokerage-website-settings", href: "/brokerage/website-settings", label: "Website Settings", icon: Settings2, group: "Website & data", desktopPriority: 14, mobilePriority: 14 },
  { id: "brokerage-domains", href: "/brokerage/domains", label: "Domains", icon: Globe2, group: "Website & data", desktopPriority: 15, mobilePriority: 15 },
  { id: "brokerage-exports", href: "/brokerage/import-export/export", label: "Exports", icon: FileDown, group: "Website & data", desktopPriority: 16, mobilePriority: 16 },
];

export const moreNavItem: NavItem = {
  id: "nav-more",
  href: "#",
  label: "More",
  icon: MoreHorizontal,
  group: "Navigation",
  desktopPriority: 999,
  mobilePriority: 999,
};

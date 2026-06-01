import {
  AlertTriangle,
  Building2,
  BriefcaseBusiness,
  Calculator,
  Camera,
  ClipboardCheck,
  ClipboardList,
  BadgeDollarSign,
  FileDown,
  FileUp,
  FolderKanban,
  Globe2,
  Handshake,
  History,
  Home,
  KeyRound,
  Megaphone,
  MessageSquareText,
  Package,
  Settings2,
  ShieldCheck,
  Landmark,
  UserCheck,
  UsersRound,
  MoreHorizontal,
} from "lucide-react";

/**
 * Enhanced Navigation Item with metadata for icon-first sidebar
 * @property id - Unique identifier for usage tracking
 * @property href - Route path
 * @property label - Display text
 * @property icon - Lucide icon component
 * @property group - Logical grouping (e.g., "CRM", "Operations")
 * @property roles - Allowed user roles (optional)
 * @property organizationTypes - Allowed org types (optional)
 * @property permissions - Required permissions (optional)
 * @property desktopPriority - Order for desktop sidebar (lower = higher priority)
 * @property mobilePriority - Order for mobile nav (for future use)
 * @property isPrimary - Whether to show in collapsed sidebar by default
 */
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
};

/**
 * Platform Admin Navigation
 */
export const platformNav: NavItem[] = [
  { id: "platform-dashboard", href: "/platform/dashboard", label: "Dashboard", icon: Home, group: "Main", desktopPriority: 1, mobilePriority: 1, isPrimary: true },
  { id: "platform-operations", href: "/platform/operations/overview", label: "Operations", icon: ClipboardList, group: "Main", desktopPriority: 2, mobilePriority: 4, isPrimary: true },
  { id: "platform-organizations", href: "/platform/organizations", label: "Organizations", icon: Building2, group: "Management", desktopPriority: 3, mobilePriority: 2 },
  { id: "platform-verifications", href: "/platform/verifications", label: "Verifications", icon: ClipboardCheck, group: "Management", desktopPriority: 4, mobilePriority: 5 },
  { id: "platform-claim-conflicts", href: "/platform/lead-claim-conflicts", label: "Claim Conflicts", icon: AlertTriangle, group: "Management", desktopPriority: 5, mobilePriority: 6 },
  { id: "platform-crm-leads", href: "/platform/crm/leads", label: "CRM Leads", icon: UsersRound, group: "CRM", desktopPriority: 6, mobilePriority: 3 },
  { id: "platform-crm-pipeline", href: "/platform/crm/pipeline", label: "CRM Pipeline", icon: FolderKanban, group: "CRM", desktopPriority: 7, mobilePriority: 8 },
  { id: "platform-crm-tasks", href: "/platform/crm/tasks", label: "CRM Tasks", icon: ClipboardList, group: "CRM", desktopPriority: 8, mobilePriority: 9 },
  { id: "platform-crm-activities", href: "/platform/crm/activities", label: "CRM Activity", icon: History, group: "CRM", desktopPriority: 9, mobilePriority: 10 },
  { id: "platform-conversations", href: "/platform/conversations", label: "Conversations", icon: MessageSquareText, group: "Communication", desktopPriority: 10, mobilePriority: 11 },
  { id: "platform-hr", href: "/platform/hr/overview", label: "HR", icon: BriefcaseBusiness, group: "Departments", desktopPriority: 11, mobilePriority: 12 },
  { id: "platform-accounting", href: "/platform/accounting/overview", label: "Accounting", icon: Calculator, group: "Departments", desktopPriority: 12, mobilePriority: 13 },
  { id: "platform-legal", href: "/platform/legal/overview", label: "Legal", icon: Landmark, group: "Departments", desktopPriority: 13, mobilePriority: 14 },
  { id: "platform-ads", href: "/platform/ads/overview", label: "Ads", icon: Megaphone, group: "Departments", desktopPriority: 14, mobilePriority: 15 },
  { id: "platform-cameras", href: "/platform/cameras/overview", label: "Cameras", icon: Camera, group: "Departments", desktopPriority: 15, mobilePriority: 16 },
  { id: "platform-deal-rooms", href: "/platform/deal-rooms", label: "Deal Rooms", icon: MessageSquareText, group: "Deals", desktopPriority: 16, mobilePriority: 17 },
  { id: "platform-deals", href: "/platform/deals", label: "Deals", icon: Landmark, group: "Deals", desktopPriority: 17, mobilePriority: 18 },
  { id: "platform-commissions", href: "/platform/commissions", label: "Commissions", icon: BadgeDollarSign, group: "Deals", desktopPriority: 18, mobilePriority: 19 },
  { id: "platform-domains", href: "/platform/domains", label: "Domains", icon: Globe2, group: "Configuration", desktopPriority: 19, mobilePriority: 20 },
  { id: "platform-import-jobs", href: "/platform/import-export/jobs", label: "Import Jobs", icon: FileUp, group: "Data", desktopPriority: 20, mobilePriority: 21 },
  { id: "platform-exports", href: "/platform/import-export/export", label: "Exports", icon: FileDown, group: "Data", desktopPriority: 21, mobilePriority: 22 },
];

/**
 * Developer Navigation
 */
export const developerNav: NavItem[] = [
  { id: "dev-dashboard", href: "/developer/dashboard", label: "Dashboard", icon: Home, group: "Main", desktopPriority: 1, mobilePriority: 1, isPrimary: true },
  { id: "dev-operations", href: "/developer/operations/overview", label: "Operations", icon: ClipboardList, group: "Main", desktopPriority: 2, mobilePriority: 4, isPrimary: true },
  { id: "dev-projects", href: "/developer/projects", label: "Projects", icon: FolderKanban, group: "Projects", desktopPriority: 3, mobilePriority: 2, isPrimary: true },
  { id: "dev-inventory", href: "/developer/inventory", label: "Inventory", icon: Package, group: "Projects", desktopPriority: 4, mobilePriority: 4 },
  { id: "dev-agreements", href: "/developer/agreements", label: "Agreements", icon: Handshake, group: "Projects", desktopPriority: 5, mobilePriority: 5 },
  { id: "dev-broker-access", href: "/developer/broker-access", label: "Broker Access", icon: KeyRound, group: "Projects", desktopPriority: 6, mobilePriority: 6 },
  { id: "dev-lead-claims", href: "/developer/lead-claims", label: "Lead Claims", icon: UserCheck, group: "Leads", desktopPriority: 7, mobilePriority: 7 },
  { id: "dev-public-leads", href: "/developer/public-leads", label: "Public Leads", icon: ClipboardList, group: "Leads", desktopPriority: 8, mobilePriority: 8 },
  { id: "dev-crm-leads", href: "/developer/crm/leads", label: "CRM Leads", icon: UsersRound, group: "CRM", desktopPriority: 9, mobilePriority: 3 },
  { id: "dev-crm-pipeline", href: "/developer/crm/pipeline", label: "CRM Pipeline", icon: FolderKanban, group: "CRM", desktopPriority: 10, mobilePriority: 10 },
  { id: "dev-crm-tasks", href: "/developer/crm/tasks", label: "CRM Tasks", icon: ClipboardList, group: "CRM", desktopPriority: 11, mobilePriority: 11 },
  { id: "dev-conversations", href: "/developer/conversations", label: "Conversations", icon: MessageSquareText, group: "Communication", desktopPriority: 12, mobilePriority: 12 },
  { id: "dev-hr", href: "/developer/hr/employees", label: "HR Employees", icon: BriefcaseBusiness, group: "Departments", desktopPriority: 13, mobilePriority: 13 },
  { id: "dev-hr-departments", href: "/developer/hr/departments", label: "HR Departments", icon: BriefcaseBusiness, group: "Departments", desktopPriority: 14, mobilePriority: 14 },
  { id: "dev-hr-attendance", href: "/developer/hr/attendance", label: "HR Attendance", icon: ClipboardCheck, group: "Departments", desktopPriority: 15, mobilePriority: 15 },
  { id: "dev-accounting", href: "/developer/accounting/transactions", label: "Accounting", icon: Calculator, group: "Departments", desktopPriority: 16, mobilePriority: 16 },
  { id: "dev-accounting-summary", href: "/developer/accounting/summary", label: "Accounting Summary", icon: Calculator, group: "Departments", desktopPriority: 17, mobilePriority: 17 },
  { id: "dev-accounting-categories", href: "/developer/accounting/categories", label: "Accounting Categories", icon: ClipboardList, group: "Departments", desktopPriority: 18, mobilePriority: 18 },
  { id: "dev-legal", href: "/developer/legal/documents", label: "Legal", icon: Landmark, group: "Departments", desktopPriority: 19, mobilePriority: 19 },
  { id: "dev-legal-cases", href: "/developer/legal/cases", label: "Legal Cases", icon: Landmark, group: "Departments", desktopPriority: 20, mobilePriority: 20 },
  { id: "dev-ads", href: "/developer/ads/campaigns", label: "Ads", icon: Megaphone, group: "Departments", desktopPriority: 21, mobilePriority: 21 },
  { id: "dev-cameras", href: "/developer/cameras/devices", label: "Cameras", icon: Camera, group: "Departments", desktopPriority: 22, mobilePriority: 22 },
  { id: "dev-reservations", href: "/developer/reservation-requests", label: "Reservations", icon: ClipboardList, group: "Reservations", desktopPriority: 23, mobilePriority: 23 },
  { id: "dev-deal-rooms", href: "/developer/deal-rooms", label: "Deal Rooms", icon: MessageSquareText, group: "Deals", desktopPriority: 24, mobilePriority: 24 },
  { id: "dev-deals", href: "/developer/deals", label: "Deals", icon: Landmark, group: "Deals", desktopPriority: 25, mobilePriority: 25 },
  { id: "dev-commission-rules", href: "/developer/commission-rules", label: "Commission Rules", icon: BadgeDollarSign, group: "Deals", desktopPriority: 26, mobilePriority: 26 },
  { id: "dev-commissions", href: "/developer/commissions", label: "Commissions", icon: BadgeDollarSign, group: "Deals", desktopPriority: 27, mobilePriority: 27 },
  { id: "dev-website-settings", href: "/developer/website-settings", label: "Website Settings", icon: Settings2, group: "Configuration", desktopPriority: 28, mobilePriority: 28 },
  { id: "dev-domains", href: "/developer/domains", label: "Domains", icon: Globe2, group: "Configuration", desktopPriority: 29, mobilePriority: 29 },
  { id: "dev-import-export", href: "/developer/import-export", label: "Import / Export", icon: FileUp, group: "Data", desktopPriority: 30, mobilePriority: 30 },
];

/**
 * Brokerage Navigation
 */
export const brokerageNav: NavItem[] = [
  { id: "brokerage-dashboard", href: "/brokerage/dashboard", label: "Dashboard", icon: Home, group: "Main", desktopPriority: 1, mobilePriority: 1, isPrimary: true },
  { id: "brokerage-marketplace", href: "/brokerage/dashboard", label: "Marketplace", icon: ShieldCheck, group: "Main", desktopPriority: 2, mobilePriority: 2, isPrimary: true },
  { id: "brokerage-lead-claims", href: "/brokerage/lead-claims", label: "Lead Claims", icon: UserCheck, group: "Leads", desktopPriority: 3, mobilePriority: 3, isPrimary: true },
  { id: "brokerage-public-leads", href: "/brokerage/public-leads", label: "Public Leads", icon: ClipboardList, group: "Leads", desktopPriority: 4, mobilePriority: 4 },
  { id: "brokerage-marketplace-leads", href: "/brokerage/crm/marketplace-leads", label: "Marketplace Leads", icon: ShieldCheck, group: "Leads", desktopPriority: 5, mobilePriority: 5 },
  { id: "brokerage-crm-leads", href: "/brokerage/crm/leads", label: "CRM Leads", icon: UsersRound, group: "CRM", desktopPriority: 6, mobilePriority: 6 },
  { id: "brokerage-crm-pipeline", href: "/brokerage/crm/pipeline", label: "CRM Pipeline", icon: FolderKanban, group: "CRM", desktopPriority: 7, mobilePriority: 7 },
  { id: "brokerage-crm-tasks", href: "/brokerage/crm/tasks", label: "CRM Tasks", icon: ClipboardList, group: "CRM", desktopPriority: 8, mobilePriority: 8 },
  { id: "brokerage-conversations", href: "/brokerage/conversations", label: "Conversations", icon: MessageSquareText, group: "Communication", desktopPriority: 9, mobilePriority: 3 },
  { id: "brokerage-reservations", href: "/brokerage/reservation-requests", label: "Reservations", icon: ClipboardList, group: "Reservations", desktopPriority: 10, mobilePriority: 10 },
  { id: "brokerage-deal-rooms", href: "/brokerage/deal-rooms", label: "Deal Rooms", icon: MessageSquareText, group: "Deals", desktopPriority: 11, mobilePriority: 11 },
  { id: "brokerage-deals", href: "/brokerage/deals", label: "Deals", icon: Landmark, group: "Deals", desktopPriority: 12, mobilePriority: 4 },
  { id: "brokerage-commissions", href: "/brokerage/commissions", label: "Commissions", icon: BadgeDollarSign, group: "Deals", desktopPriority: 13, mobilePriority: 13, isPrimary: true },
  { id: "brokerage-website-settings", href: "/brokerage/website-settings", label: "Website Settings", icon: Settings2, group: "Configuration", desktopPriority: 14, mobilePriority: 14 },
  { id: "brokerage-domains", href: "/brokerage/domains", label: "Domains", icon: Globe2, group: "Configuration", desktopPriority: 15, mobilePriority: 15 },
  { id: "brokerage-exports", href: "/brokerage/import-export/export", label: "Exports", icon: FileDown, group: "Data", desktopPriority: 16, mobilePriority: 16 },
];

/**
 * More menu item (special)
 */
export const moreNavItem: NavItem = {
  id: "nav-more",
  href: "#",
  label: "More",
  icon: MoreHorizontal,
  group: "Navigation",
  desktopPriority: 999,
  mobilePriority: 999,
};

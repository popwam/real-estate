import {
  brokerageNav,
  developerNav,
  moreNavItem,
  platformNav,
  type NavItem,
} from "@/components/layout/nav";

/**
 * Role-family navigation. Ordering is intentionally deterministic so primary
 * destinations do not move after a user learns their position.
 */
export function getNavItemsForUser(
  role?: string,
  organizationType?: string | null,
  permissions: string[] = [],
): NavItem[] {
  return getAllNavItemsForUser(role, organizationType).filter((item) =>
    itemAllowed(item, permissions),
  );
}

export function getAllNavItemsForUser(
  role?: string,
  organizationType?: string | null,
): NavItem[] {
  if (role?.startsWith("platform_") || organizationType === "PLATFORM") {
    return platformNav;
  }

  if (
    role?.startsWith("developer_") ||
    ["company_admin", "hr_manager", "hr_employee", "sales_manager", "sales_agent", "finance_user", "employee_self_service"].includes(role ?? "") ||
    organizationType === "DEVELOPER"
  ) {
    return developerNav;
  }

  if (
    role === "brokerage_owner" ||
    role === "brokerage_admin" ||
    role === "broker" ||
    role === "individual_broker" ||
    organizationType === "BROKERAGE" ||
    organizationType === "INDIVIDUAL_BROKER"
  ) {
    return brokerageNav;
  }

  return [];
}

const defaultPermissionsById: Record<string, string[]> = {
  "platform-organizations": ["organizations.view_all", "platform.organizations.view"],
  "platform-verifications": ["organizations.verify"],
  "platform-crm-leads": ["public_leads.view_all", "crm.leads.view"],
  "platform-deal-rooms": ["deal_rooms.join", "deal_rooms.manage"],
  "platform-deals": ["deals.approve", "deals.view"],
  "platform-operations": ["hr.view", "accounting.view", "legal.view"],
  "platform-hr": ["hr.view", "hr.employees.view"],
  "platform-domains": ["organization_domains.verify", "organization_domains.view_own"],
  "platform-import-jobs": ["exports.platform_data", "imports.project_inventory"],
  "platform-exports": ["exports.platform_data", "reports.export"],
  "dev-projects": ["projects.edit", "projects.create"],
  "dev-inventory": ["inventory.view_private", "inventory.create"],
  "dev-crm-leads": ["crm.leads.view_own", "crm.leads.view", "crm.leads.claim"],
  "dev-conversations": ["crm.conversations.view_own", "crm.conversations.view_project"],
  "dev-public-leads": ["public_leads.view_own", "public_leads.manage_own"],
  "dev-crm-pipeline": ["crm.pipeline.view_own", "crm.pipeline.manage_own"],
  "dev-crm-tasks": ["crm.tasks.view_own", "crm.tasks.manage_own"],
  "dev-deal-rooms": ["deal_rooms.join", "deal_rooms.create", "deal_rooms.manage"],
  "dev-deals": ["deals.view", "deals.create", "deals.update", "deals.approve", "deals.mark_sold"],
  "dev-operations": ["hr.view", "accounting.view", "legal.view", "ads.view", "cameras.view"],
  "dev-hr": ["hr.employees.view", "hr.view", "hr.manage"],
  "dev-hr-departments": ["hr.employees.view", "hr.view", "hr.manage"],
  "dev-hr-attendance": ["hr.attendance.view", "hr.attendance.manage", "hr.view", "hr.attendance.self"],
  "dev-accounting": ["accounting.view", "accounting.manage"],
  "dev-accounting-summary": ["accounting.view", "reports.view"],
  "dev-accounting-categories": ["accounting.view", "accounting.manage"],
  "dev-legal": ["legal.view", "legal.manage"],
  "dev-legal-cases": ["legal.view", "legal.manage"],
  "dev-website-settings": ["company.settings.view", "organization_website.view_own"],
  "dev-domains": ["organization_domains.view_own", "organization_domains.manage_own"],
  "dev-import-export": ["imports.project_inventory", "exports.organization_data", "reports.export"],
  "dev-ads": ["ads.view", "ads.manage"],
  "dev-cameras": ["cameras.view", "cameras.manage"],
  "brokerage-crm-leads": ["crm.leads.view_own", "crm.leads.claim"],
  "brokerage-conversations": ["crm.conversations.view_own"],
  "brokerage-deal-rooms": ["deal_rooms.join"],
  "brokerage-deals": ["deals.view", "deal_requests.create"],
  "brokerage-exports": ["exports.organization_data", "reports.export"],
};

function itemAllowed(item: NavItem, permissions: string[]) {
  const required = item.permissions ?? defaultPermissionsById[item.id];
  if (!required?.length) return true;
  return required.some((permission) => {
    if (permissions.includes(permission)) return true;
    if (permission.startsWith("hr.") && permissions.includes("hr.manage")) return true;
    if (permission.startsWith("hr.") && permission.endsWith(".view") && permissions.includes("hr.view")) return true;
    return false;
  });
}

export function getPrimaryDesktopNavItems(
  items: NavItem[],
  maxItems: number = 8,
): NavItem[] {
  const markedPrimary = items
    .filter((item) => item.isPrimary)
    .sort((a, b) => a.desktopPriority - b.desktopPriority);

  const candidates = markedPrimary.length
    ? markedPrimary
    : [...items].sort((a, b) => a.desktopPriority - b.desktopPriority);

  return candidates.slice(0, maxItems);
}

export function getOverflowNavItems(
  items: NavItem[],
  primaryItems: NavItem[],
): NavItem[] {
  const primaryIds = new Set(primaryItems.map((item) => item.id));
  return items
    .filter((item) => !primaryIds.has(item.id))
    .sort((a, b) => a.desktopPriority - b.desktopPriority);
}

export function getMobileBottomNavItems(
  items: NavItem[],
  maxItems: number = 5,
): {
  primaryItems: NavItem[];
  overflowItems: NavItem[];
  moreItem: NavItem;
} {
  const visibleCount = Math.max(1, maxItems - 1);
  const markedPrimary = items
    .filter((item) => item.isMobilePrimary)
    .sort((a, b) => a.mobilePriority - b.mobilePriority);
  const candidates = markedPrimary.length
    ? markedPrimary
    : [...items].sort((a, b) => a.mobilePriority - b.mobilePriority);
  const primaryItems = candidates.slice(0, visibleCount);

  return {
    primaryItems,
    overflowItems: getOverflowNavItems(items, primaryItems),
    moreItem: moreNavItem,
  };
}

export function groupNavItems(items: NavItem[]): Record<string, NavItem[]> {
  return items.reduce<Record<string, NavItem[]>>((groups, item) => {
    groups[item.group] = [...(groups[item.group] ?? []), item];
    return groups;
  }, {});
}

export function getActiveNavItem(items: NavItem[], pathname: string) {
  return [...items]
    .filter(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    )
    .sort((a, b) => b.href.length - a.href.length)[0];
}

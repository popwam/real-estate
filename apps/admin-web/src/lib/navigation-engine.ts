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
): NavItem[] {
  if (role?.startsWith("platform_") || organizationType === "PLATFORM") {
    return platformNav;
  }

  if (role?.startsWith("developer_") || organizationType === "DEVELOPER") {
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

/**
 * Navigation Engine - Role-Aware Navigation with Usage-Based Sorting
 *
 * This module handles:
 * - Role/organization-aware navigation filtering
 * - Priority-based ordering
 * - Usage-based sorting (localStorage only)
 * - Primary vs overflow navigation splitting
 *
 * NO backend calls, NO PII storage, NO user data sent anywhere
 */

import { platformNav, developerNav, brokerageNav, type NavItem, moreNavItem } from "@/components/layout/nav";

/**
 * Usage tracking data (stored in localStorage as JSON)
 * @internal
 */
type NavUsageRecord = {
  itemId: string;
  clickCount: number;
  lastUsedAt: number; // Unix timestamp
};

const USAGE_STORAGE_KEY = "popwam-nav-usage";
const USAGE_CACHE_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Get usage data from localStorage
 * Returns empty array if not available or invalid
 * @internal
 */
function getUsageData(): NavUsageRecord[] {
  try {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(USAGE_STORAGE_KEY);
    if (!stored) return [];
    const data = JSON.parse(stored) as NavUsageRecord[];
    if (!Array.isArray(data)) return [];
    return data;
  } catch {
    return [];
  }
}

/**
 * Save usage data to localStorage
 * @internal
 */
function saveUsageData(data: NavUsageRecord[]): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage not available or full, fail silently
  }
}

/**
 * Record a navigation click for usage-based sorting
 * @param itemId - The nav item ID (from NavItem.id)
 *
 * Usage:
 * ```ts
 * recordNavUsage("platform-dashboard");
 * ```
 */
export function recordNavUsage(itemId: string): void {
  try {
    if (typeof window === "undefined") return;

    const usage = getUsageData();
    const existing = usage.find((u) => u.itemId === itemId);
    const now = Date.now();

    if (existing) {
      existing.clickCount += 1;
      existing.lastUsedAt = now;
    } else {
      usage.push({
        itemId,
        clickCount: 1,
        lastUsedAt: now,
      });
    }

    // Clean up stale entries (older than USAGE_CACHE_DURATION_MS)
    const cleaned = usage.filter((u) => now - u.lastUsedAt < USAGE_CACHE_DURATION_MS);

    saveUsageData(cleaned);
  } catch {
    // Fail silently
  }
}

/**
 * Get usage score for an item (for sorting)
 * Score = clickCount * recency factor
 * @internal
 */
function getUsageScore(itemId: string): number {
  try {
    const usage = getUsageData();
    const record = usage.find((u) => u.itemId === itemId);
    if (!record) return 0;

    // Recency factor: items used recently get higher scores
    const daysSinceUsed = (Date.now() - record.lastUsedAt) / (1000 * 60 * 60 * 24);
    const recencyFactor = Math.max(0.1, 1 - daysSinceUsed / 30); // Decays over 30 days

    return record.clickCount * recencyFactor;
  } catch {
    return 0;
  }
}

/**
 * Get all navigation items for a user based on their role/organization
 * @param role - User role (e.g., "platform_admin")
 * @param organizationType - Organization type (e.g., "PLATFORM", "DEVELOPER", "BROKERAGE")
 * @returns Array of all available nav items for this user
 *
 * Usage:
 * ```ts
 * const items = getNavItemsForUser("platform_admin", "PLATFORM");
 * ```
 */
export function getNavItemsForUser(role?: string, organizationType?: string | null): NavItem[] {
  if (role?.startsWith("platform_") || organizationType === "PLATFORM") return platformNav;
  if (role?.startsWith("developer_") || organizationType === "DEVELOPER") return developerNav;
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
  return platformNav; // Default
}

/**
 * Get primary desktop nav items (icons that show in collapsed sidebar)
 * Limited to available height, sorted by priority and usage
 * @param items - Full nav items array from getNavItemsForUser()
 * @param maxItems - Maximum number of items to show (default: 12 for ~72px sidebar using available vertical space)
 * @returns Array of primary nav items
 *
 * Usage:
 * ```ts
 * const allItems = getNavItemsForUser(role, orgType);
 * const primary = getPrimaryDesktopNavItems(allItems, 12);
 * ```
 */
export function getPrimaryDesktopNavItems(items: NavItem[], maxItems: number = 12): NavItem[] {
  // Filter to items marked as primary or sort by priority
  const sorted = [...items].sort((a, b) => {
    // First, prioritize items marked as isPrimary
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;

    // Then, sort by usage score (descending)
    const scoreA = getUsageScore(a.id);
    const scoreB = getUsageScore(b.id);
    if (scoreA !== scoreB) return scoreB - scoreA;

    // Finally, sort by desktopPriority (ascending)
    return a.desktopPriority - b.desktopPriority;
  });

  return sorted.slice(0, maxItems);
}

/**
 * Get overflow nav items (items that don't fit in primary)
 * These go into the "More" menu
 * @param items - Full nav items array from getNavItemsForUser()
 * @param primaryItems - Primary items from getPrimaryDesktopNavItems()
 * @returns Array of overflow items grouped by section
 *
 * Usage:
 * ```ts
 * const all = getNavItemsForUser(role, orgType);
 * const primary = getPrimaryDesktopNavItems(all);
 * const overflow = getOverflowNavItems(all, primary);
 * ```
 */
export function getOverflowNavItems(items: NavItem[], primaryItems: NavItem[]): NavItem[] {
  const primaryIds = new Set(primaryItems.map((i) => i.id));
  return items.filter((item) => !primaryIds.has(item.id));
}

/**
 * Get mobile bottom navigation items.
 * Keeps the bar compact by reserving the last slot for More.
 * @param items - Full nav items array from getNavItemsForUser()
 * @param maxItems - Maximum visible items including More (default: 5)
 */
export function getMobileBottomNavItems(items: NavItem[], maxItems: number = 5): {
  primaryItems: NavItem[];
  overflowItems: NavItem[];
  moreItem: NavItem;
} {
  const visibleCount = Math.max(1, maxItems - 1);
  const primaryItems = [...items]
    .sort((a, b) => a.mobilePriority - b.mobilePriority)
    .slice(0, visibleCount);
  return {
    primaryItems,
    overflowItems: getOverflowNavItems(items, primaryItems),
    moreItem: getMoreNavItem(),
  };
}

/**
 * Sort nav items by priority and usage for display
 * @param items - Nav items to sort
 * @param sortByUsage - If true, sort by usage score; if false, sort by priority
 * @returns Sorted array
 *
 * Usage:
 * ```ts
 * const sorted = sortNavByPriorityAndUsage(overflowItems, true);
 * ```
 */
export function sortNavByPriorityAndUsage(items: NavItem[], sortByUsage: boolean = true): NavItem[] {
  return [...items].sort((a, b) => {
    if (sortByUsage) {
      const scoreA = getUsageScore(a.id);
      const scoreB = getUsageScore(b.id);
      if (scoreA !== scoreB) return scoreB - scoreA;
    }
    return a.desktopPriority - b.desktopPriority;
  });
}

/**
 * Get grouped nav items for the More menu
 * Groups items by their "group" property
 * @param items - Nav items to group
 * @returns Object with group names as keys and items as values
 *
 * Usage:
 * ```ts
 * const grouped = groupNavItems(overflowItems);
 * Object.entries(grouped).forEach(([group, items]) => {
 *   console.log(group, items);
 * });
 * ```
 */
export function groupNavItems(items: NavItem[]): Record<string, NavItem[]> {
  const grouped: Record<string, NavItem[]> = {};
  items.forEach((item) => {
    if (!grouped[item.group]) {
      grouped[item.group] = [];
    }
    grouped[item.group].push(item);
  });
  return grouped;
}

/**
 * Get the More button nav item
 * @returns More nav item
 */
export function getMoreNavItem(): NavItem {
  return moreNavItem;
}

"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { NavItem } from "@/components/layout/nav";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useI18n } from "@/i18n";
import { getPlatformNavigationApi } from "@/lib/api";
import { getNavItemsForUser } from "@/lib/navigation-engine";

export function useAllowedNavigation() {
  const { t, locale } = useI18n();
  const { data } = useCurrentUser();
  const configuration = useQuery({
    queryKey: ["platform", "navigation-configuration"],
    queryFn: getPlatformNavigationApi,
    enabled: Boolean(data?.user),
    staleTime: 5 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  return useMemo(
    () =>
      applyPlatformNavigation(localizeNavItems(
        getNavItemsForUser(data?.user.role, data?.organization?.type, data?.permissions),
        t,
      ), configuration.data, locale),
    [configuration.data, data?.organization?.type, data?.permissions, data?.user.role, locale, t],
  );
}

function applyPlatformNavigation(items: NavItem[], sections: import("@/types/platform").PlatformNavigationSection[] | undefined, locale: "en" | "ar" | "fr") {
  if (!sections?.length) return items;
  const configuredByItem = new Map(sections.flatMap((section) => (section.allowedItemKeys ?? []).map((id) => [id, section] as const)));
  const byKey = new Map(sections.map((section) => [section.sectionKey, section]));
  return items.flatMap((item) => {
    const section = configuredByItem.get(item.id) ?? byKey.get(item.sectionKey);
    if (!section || !section.isVisible) return [];
    const group = section.localizedTitle?.[locale] ?? section.localizedTitle?.en ?? item.group;
    return [{ ...item, group, groupKey: section.sectionKey, desktopPriority: section.sortOrder * 1000 + item.desktopPriority }];
  });
}

export function localizeNavItems(items: NavItem[], t: (key: string) => string): NavItem[] {
  return items.map((item) => ({
    ...item,
    label: t(item.labelKey),
    group: t(item.groupKey),
  }));
}

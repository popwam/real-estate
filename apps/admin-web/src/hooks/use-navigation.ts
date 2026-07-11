"use client";

import { useMemo } from "react";
import type { NavItem } from "@/components/layout/nav";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useI18n } from "@/i18n";
import { getNavItemsForUser } from "@/lib/navigation-engine";

export function useAllowedNavigation() {
  const { t } = useI18n();
  const { data } = useCurrentUser();

  return useMemo(
    () =>
      localizeNavItems(
        getNavItemsForUser(data?.user.role, data?.organization?.type, data?.permissions),
        t,
      ),
    [data?.organization?.type, data?.permissions, data?.user.role, t],
  );
}

export function localizeNavItems(items: NavItem[], t: (key: string) => string): NavItem[] {
  return items.map((item) => ({
    ...item,
    label: t(item.labelKey),
    group: t(item.groupKey),
  }));
}


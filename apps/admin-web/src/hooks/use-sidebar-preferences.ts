"use client";

import { useEffect, useMemo, useState } from "react";
import type { NavItem, SidebarIconKey } from "@/components/layout/nav";
import { safeSidebarIconMap } from "@/components/layout/nav";
import {
  defaultSidebarPreferences,
  getSidebarPreferences,
  hideItem,
  pinItem,
  resetSidebarPreferences,
  saveSidebarPreferences,
  setGroupOverride,
  setIconOverride,
  setLabelOverride,
  showItem,
  toggleSidebarMode,
  unpinItem,
  type SidebarPreferences,
} from "@/lib/sidebar-preferences";
import {
  getNavigationPreferenceApi,
  resetNavigationPreferenceApi,
  saveNavigationPreferenceApi,
} from "@/lib/user-preferences-api";

export function useSidebarPreferences(allowedItems: NavItem[] = []) {
  const [preferences, setPreferences] = useState<SidebarPreferences>(defaultSidebarPreferences);

  useEffect(() => {
    const sync = () => setPreferences(getSidebarPreferences());
    sync();
    getNavigationPreferenceApi()
      .then((record) => {
        if (record?.layout) {
          const saved = saveSidebarPreferences({
            ...defaultSidebarPreferences,
            ...record.layout,
            hiddenItemIds: record.hiddenItems ?? record.layout.hiddenItemIds ?? [],
            pinnedItemIds: record.pinnedItems ?? record.layout.pinnedItemIds ?? [],
          });
          setPreferences(saved);
        }
      })
      .catch(() => undefined);
    window.addEventListener("popwam-sidebar-preferences-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("popwam-sidebar-preferences-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const allowedIds = useMemo(() => new Set(allowedItems.map((item) => item.id)), [allowedItems]);

  const visibleItems = useMemo(() => {
    const allowed = allowedItems.filter((item) => !preferences.hiddenItemIds.includes(item.id));
    const pinnedIds = preferences.pinnedItemIds.filter((id) => allowedIds.has(id));
    const pinnedOrder = new Map(pinnedIds.map((id, index) => [id, index]));

    return [...allowed].sort((a, b) => {
      const aPinned = pinnedOrder.get(a.id);
      const bPinned = pinnedOrder.get(b.id);
      if (aPinned !== undefined && bPinned !== undefined) return aPinned - bPinned;
      if (aPinned !== undefined) return -1;
      if (bPinned !== undefined) return 1;
      return a.desktopPriority - b.desktopPriority;
    }).map((item) => ({
      ...item,
      label: preferences.labelOverrides[item.id] ?? item.label,
      group: preferences.groupOverrides[item.id] ?? item.group,
      groupKey: preferences.groupOverrides[item.id] ?? item.groupKey,
    }));
  }, [allowedIds, allowedItems, preferences.groupOverrides, preferences.hiddenItemIds, preferences.labelOverrides, preferences.pinnedItemIds]);

  const persist = (next: SidebarPreferences) => {
    setPreferences(next);
    void saveNavigationPreferenceApi(next).catch(() => undefined);
    return next;
  };

  return {
    preferences,
    visibleItems,
    mode: preferences.mode,
    safeIconMap: safeSidebarIconMap,
    toggleMode: () => persist(toggleSidebarMode()),
    setMode: (mode: SidebarPreferences["mode"]) =>
      persist(saveSidebarPreferences({ ...preferences, mode })),
    hideItem: (id: string) => {
      if (allowedIds.has(id)) persist(hideItem(id));
    },
    showItem: (id: string) => {
      if (allowedIds.has(id)) persist(showItem(id));
    },
    pinItem: (id: string) => {
      if (allowedIds.has(id)) persist(pinItem(id));
    },
    unpinItem: (id: string) => {
      if (allowedIds.has(id)) persist(unpinItem(id));
    },
    setIconOverride: (id: string, iconKey: SidebarIconKey) => {
      if (allowedIds.has(id)) persist(setIconOverride(id, iconKey));
    },
    setLabelOverride: (id: string, label: string) => {
      if (allowedIds.has(id)) persist(setLabelOverride(id, label));
    },
    setGroupOverride: (id: string, group: string) => {
      if (allowedIds.has(id)) persist(setGroupOverride(id, group));
    },
    reset: () => {
      const next = resetSidebarPreferences();
      setPreferences(next);
      void resetNavigationPreferenceApi().catch(() => undefined);
    },
    apply: (next: SidebarPreferences) => persist(saveSidebarPreferences(next)),
    iconFor: (item: NavItem) => safeSidebarIconMap[preferences.iconOverrides[item.id] ?? item.iconKey] ?? item.icon,
    isHidden: (id: string) => preferences.hiddenItemIds.includes(id),
    isPinned: (id: string) => preferences.pinnedItemIds.includes(id),
  };
}

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
  setIconOverride,
  showItem,
  toggleSidebarMode,
  unpinItem,
  type SidebarPreferences,
} from "@/lib/sidebar-preferences";

export function useSidebarPreferences(allowedItems: NavItem[] = []) {
  const [preferences, setPreferences] = useState<SidebarPreferences>(defaultSidebarPreferences);

  useEffect(() => {
    const sync = () => setPreferences(getSidebarPreferences());
    sync();
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
    });
  }, [allowedIds, allowedItems, preferences.hiddenItemIds, preferences.pinnedItemIds]);

  return {
    preferences,
    visibleItems,
    mode: preferences.mode,
    safeIconMap: safeSidebarIconMap,
    toggleMode: () => setPreferences(toggleSidebarMode()),
    setMode: (mode: SidebarPreferences["mode"]) =>
      setPreferences(saveSidebarPreferences({ ...preferences, mode })),
    hideItem: (id: string) => {
      if (allowedIds.has(id)) setPreferences(hideItem(id));
    },
    showItem: (id: string) => {
      if (allowedIds.has(id)) setPreferences(showItem(id));
    },
    pinItem: (id: string) => {
      if (allowedIds.has(id)) setPreferences(pinItem(id));
    },
    unpinItem: (id: string) => {
      if (allowedIds.has(id)) setPreferences(unpinItem(id));
    },
    setIconOverride: (id: string, iconKey: SidebarIconKey) => {
      if (allowedIds.has(id)) setPreferences(setIconOverride(id, iconKey));
    },
    reset: () => setPreferences(resetSidebarPreferences()),
    iconFor: (item: NavItem) => safeSidebarIconMap[preferences.iconOverrides[item.id] ?? item.iconKey] ?? item.icon,
    isHidden: (id: string) => preferences.hiddenItemIds.includes(id),
    isPinned: (id: string) => preferences.pinnedItemIds.includes(id),
  };
}


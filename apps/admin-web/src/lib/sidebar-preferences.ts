"use client";

import type { SidebarIconKey } from "@/components/layout/nav";
import { safeSidebarIconMap } from "@/components/layout/nav";

export type SidebarMode = "collapsed" | "expanded";

export type SidebarPreferences = {
  mode: SidebarMode;
  pinnedItemIds: string[];
  hiddenItemIds: string[];
  iconOverrides: Record<string, SidebarIconKey>;
};

const STORAGE_KEY = "popwam.admin.sidebar.preferences";

export const defaultSidebarPreferences: SidebarPreferences = {
  mode: "collapsed",
  pinnedItemIds: [],
  hiddenItemIds: [],
  iconOverrides: {},
};

function canUseStorage() {
  return typeof window !== "undefined" && "localStorage" in window;
}

function normalizePreferences(value: Partial<SidebarPreferences> | null): SidebarPreferences {
  const iconOverrides = Object.fromEntries(
    Object.entries(value?.iconOverrides ?? {}).filter(([, iconKey]) =>
      Object.prototype.hasOwnProperty.call(safeSidebarIconMap, iconKey),
    ),
  ) as Record<string, SidebarIconKey>;

  return {
    mode: value?.mode === "expanded" ? "expanded" : "collapsed",
    pinnedItemIds: Array.isArray(value?.pinnedItemIds) ? [...new Set(value.pinnedItemIds)] : [],
    hiddenItemIds: Array.isArray(value?.hiddenItemIds) ? [...new Set(value.hiddenItemIds)] : [],
    iconOverrides,
  };
}

export function getSidebarPreferences(): SidebarPreferences {
  if (!canUseStorage()) return defaultSidebarPreferences;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return normalizePreferences(raw ? JSON.parse(raw) : null);
  } catch {
    return defaultSidebarPreferences;
  }
}

export function saveSidebarPreferences(preferences: SidebarPreferences) {
  if (!canUseStorage()) return getSidebarPreferences();
  const next = normalizePreferences(preferences);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("popwam-sidebar-preferences-change"));
  return next;
}

export function toggleSidebarMode() {
  const current = getSidebarPreferences();
  return saveSidebarPreferences({
    ...current,
    mode: current.mode === "expanded" ? "collapsed" : "expanded",
  });
}

export function hideItem(id: string) {
  const current = getSidebarPreferences();
  return saveSidebarPreferences({
    ...current,
    hiddenItemIds: [...new Set([...current.hiddenItemIds, id])],
  });
}

export function showItem(id: string) {
  const current = getSidebarPreferences();
  return saveSidebarPreferences({
    ...current,
    hiddenItemIds: current.hiddenItemIds.filter((itemId) => itemId !== id),
  });
}

export function pinItem(id: string) {
  const current = getSidebarPreferences();
  return saveSidebarPreferences({
    ...current,
    pinnedItemIds: [...new Set([id, ...current.pinnedItemIds])],
  });
}

export function unpinItem(id: string) {
  const current = getSidebarPreferences();
  return saveSidebarPreferences({
    ...current,
    pinnedItemIds: current.pinnedItemIds.filter((itemId) => itemId !== id),
  });
}

export function setIconOverride(id: string, iconKey: SidebarIconKey) {
  const current = getSidebarPreferences();
  if (!Object.prototype.hasOwnProperty.call(safeSidebarIconMap, iconKey)) return current;

  return saveSidebarPreferences({
    ...current,
    iconOverrides: {
      ...current.iconOverrides,
      [id]: iconKey,
    },
  });
}

export function resetSidebarPreferences() {
  if (canUseStorage()) window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("popwam-sidebar-preferences-change"));
  return defaultSidebarPreferences;
}


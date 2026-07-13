"use client";

import type { SidebarIconKey } from "@/components/layout/nav";
import { safeSidebarIconMap } from "@/components/layout/nav";

export type SidebarMode = "collapsed" | "expanded";

export type SidebarPreferences = {
  mode: SidebarMode;
  pinnedItemIds: string[];
  hiddenItemIds: string[];
  iconOverrides: Record<string, SidebarIconKey>;
  labelOverrides: Record<string, string>;
  groupOverrides: Record<string, string>;
};

const STORAGE_KEY = "popwam.admin.sidebar.preferences";

export const defaultSidebarPreferences: SidebarPreferences = {
  mode: "collapsed",
  pinnedItemIds: [],
  hiddenItemIds: [],
  iconOverrides: {},
  labelOverrides: {},
  groupOverrides: {},
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
  const labelOverrides = Object.fromEntries(
    Object.entries(value?.labelOverrides ?? {})
      .map(([id, label]) => [id, typeof label === "string" ? label.trim().slice(0, 48) : ""])
      .filter(([, label]) => label),
  ) as Record<string, string>;
  const groupOverrides = Object.fromEntries(
    Object.entries(value?.groupOverrides ?? {})
      .map(([id, group]) => [id, typeof group === "string" ? group.trim().slice(0, 64) : ""])
      .filter(([, group]) => group),
  ) as Record<string, string>;

  return {
    mode: value?.mode === "expanded" ? "expanded" : "collapsed",
    pinnedItemIds: Array.isArray(value?.pinnedItemIds) ? [...new Set(value.pinnedItemIds)] : [],
    hiddenItemIds: Array.isArray(value?.hiddenItemIds) ? [...new Set(value.hiddenItemIds)] : [],
    iconOverrides,
    labelOverrides,
    groupOverrides,
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

export function setLabelOverride(id: string, label: string) {
  const current = getSidebarPreferences();
  const trimmed = label.trim().slice(0, 48);
  const nextLabelOverrides = { ...current.labelOverrides };
  delete nextLabelOverrides[id];

  return saveSidebarPreferences({
    ...current,
    labelOverrides: trimmed
      ? {
          ...nextLabelOverrides,
          [id]: trimmed,
        }
      : nextLabelOverrides,
  });
}

export function setGroupOverride(id: string, group: string) {
  const current = getSidebarPreferences();
  const trimmed = group.trim().slice(0, 64);
  const nextGroupOverrides = { ...current.groupOverrides };
  delete nextGroupOverrides[id];

  return saveSidebarPreferences({
    ...current,
    groupOverrides: trimmed
      ? {
          ...nextGroupOverrides,
          [id]: trimmed,
        }
      : nextGroupOverrides,
  });
}

export function resetSidebarPreferences() {
  if (canUseStorage()) window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("popwam-sidebar-preferences-change"));
  return defaultSidebarPreferences;
}

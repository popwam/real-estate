"use client";

import { apiRequest } from "@/lib/api";
import type { SidebarPreferences } from "@/lib/sidebar-preferences";

export type NavigationPreferenceRecord = {
  id: string;
  userId: string;
  layout: Partial<SidebarPreferences> | null;
  hiddenItems: string[];
  pinnedItems: string[];
};

export type QuickActionPreferenceRecord = {
  id: string;
  userId: string;
  widgetKey: string;
  position: { x?: number; y?: number } | null;
  isCollapsed: boolean;
  selectedActions: string[];
};

export function getNavigationPreferenceApi() {
  return apiRequest<NavigationPreferenceRecord | null>("/user-preferences/navigation");
}

export function saveNavigationPreferenceApi(preferences: SidebarPreferences) {
  return apiRequest<NavigationPreferenceRecord>("/user-preferences/navigation", {
    method: "PUT",
    body: JSON.stringify({
      layout: preferences,
      hiddenItems: preferences.hiddenItemIds,
      pinnedItems: preferences.pinnedItemIds,
    }),
  });
}

export function resetNavigationPreferenceApi() {
  return apiRequest<{ reset: boolean }>("/user-preferences/navigation", { method: "DELETE" });
}

export function getPlatformWelcomePreferenceApi() {
  return apiRequest<{ hasDismissedPlatformWelcome: boolean; dismissedAt: string | null }>("/user-preferences/platform-welcome");
}

export function savePlatformWelcomePreferenceApi(hasDismissedPlatformWelcome: boolean) {
  return apiRequest<{ hasDismissedPlatformWelcome: boolean; dismissedAt: string | null }>("/user-preferences/platform-welcome", {
    method: "PUT",
    body: JSON.stringify({ hasDismissedPlatformWelcome }),
  });
}

export function getQuickActionPreferenceApi(widgetKey: string) {
  return apiRequest<QuickActionPreferenceRecord | null>(`/user-preferences/quick-actions/${widgetKey}`);
}

export function saveQuickActionPreferenceApi(widgetKey: string, input: Partial<QuickActionPreferenceRecord>) {
  return apiRequest<QuickActionPreferenceRecord>(`/user-preferences/quick-actions/${widgetKey}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function resetQuickActionPreferenceApi(widgetKey: string) {
  return apiRequest<{ reset: boolean }>(`/user-preferences/quick-actions/${widgetKey}`, { method: "DELETE" });
}

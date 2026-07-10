"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { PagePermissionGuard } from "@/components/page-permission-guard";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  getActiveNavItem,
  getAllNavItemsForUser,
  getNavItemsForUser,
} from "@/lib/navigation-engine";

export function RoutePermissionBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data } = useCurrentUser();
  const allItems = getAllNavItemsForUser(data?.user.role, data?.organization?.type);
  const allowedItems = getNavItemsForUser(data?.user.role, data?.organization?.type, data?.permissions);
  const knownItem = getActiveNavItem(allItems, pathname);
  const allowedItem = getActiveNavItem(allowedItems, pathname);

  if (knownItem && !allowedItem) {
    return <PagePermissionGuard permissions={["__route_permission_denied__"]}>{children}</PagePermissionGuard>;
  }

  return <>{children}</>;
}

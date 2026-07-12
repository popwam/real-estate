"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BriefcaseBusiness, Check, ChevronDown, ChevronLeft, ChevronRight, Eye, EyeOff, Pin, PinOff, RotateCcw, Search, Settings, X } from "lucide-react";
import type { NavItem, SidebarIconKey } from "@/components/layout/nav";
import { useSidebarPreferences } from "@/hooks/use-sidebar-preferences";
import { useAllowedNavigation } from "@/hooks/use-navigation";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

export function IconSidebar() {
  const { t, direction } = useI18n();
  const pathname = usePathname();
  const allowedItems = useAllowedNavigation();
  const sidebar = useSidebarPreferences(allowedItems);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [hrMenuOpen, setHrMenuOpen] = useState(true);
  const [hrMenuSearch, setHrMenuSearch] = useState("");
  const expanded = sidebar.mode === "expanded";
  const homeHref = allowedItems[0]?.href ?? "/login";
  const ToggleIcon = expanded === (direction === "ltr") ? ChevronLeft : ChevronRight;
  const visibleItems = sidebar.visibleItems;
  const hrItems = useMemo(() => visibleItems.filter((item) => item.group === "Human Resources"), [visibleItems]);
  const nonHrItems = useMemo(() => visibleItems.filter((item) => item.group !== "Human Resources"), [visibleItems]);
  const filteredHrItems = useMemo(() => {
    const query = hrMenuSearch.trim().toLowerCase();
    if (!query) return hrItems;
    return hrItems.filter((item) => `${item.label} ${item.href}`.toLowerCase().includes(query));
  }, [hrItems, hrMenuSearch]);

  return (
    <>
      <aside
        className="sticky top-0 z-[var(--z-sticky)] hidden h-screen shrink-0 overflow-x-hidden border-e border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-sm)] lg:flex lg:flex-col"
        style={{
          width: expanded ? "var(--sidebar-expanded-width)" : "var(--sidebar-collapsed-width)",
        }}
        data-sidebar-mode={sidebar.mode}
      >
        <div className="flex h-[var(--topbar-height)] shrink-0 items-center gap-3 overflow-x-hidden border-b border-[var(--color-border)] px-3">
          <Link
            href={homeHref}
            className={cn(
              "flex h-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] text-sm font-black tracking-tight text-[var(--color-primary-foreground)] shadow-[var(--shadow-md)]",
              expanded ? "w-11" : "mx-auto w-11",
            )}
            title={t("adminSweep.popwam.workspace.home.eb4c5bdf")}
            aria-label={t("adminSweep.popwam.workspace.home.eb4c5bdf")}
          >
            P
          </Link>
          {expanded ? (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[var(--color-foreground)]">{t("adminSweep.popwam.admin.963a65a6")}</p>
              <p className="truncate text-xs text-[var(--color-muted)]">{t("navigation.workspace")}</p>
            </div>
          ) : null}
        </div>

        <nav
          className={cn(
            "flex min-h-0 flex-1 flex-col gap-1 overflow-x-hidden overflow-y-auto py-3",
            expanded ? "px-3" : "items-center px-2",
          )}
          aria-label={t("adminSweep.primary.admin.navigation.4379cbfa")}
        >
          {(expanded ? nonHrItems : visibleItems).map((item) => (
            <SidebarNavLink
              key={item.id}
              item={item}
              active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
              expanded={expanded}
              icon={sidebar.iconFor(item)}
            />
          ))}
          {expanded && hrItems.length ? (
            <div className="mt-2 border-t border-[var(--color-border)] pt-2">
              <button
                type="button"
                className="flex h-10 w-full items-center gap-2 rounded-[var(--radius-md)] px-3 text-sm font-semibold text-[var(--color-foreground)] hover:bg-[var(--color-surface-muted)]"
                onClick={() => setHrMenuOpen((current) => !current)}
                aria-expanded={hrMenuOpen}
              >
                <BriefcaseBusiness className="h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate text-start">{t("navigation.groups.human.resources")}</span>
                <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", hrMenuOpen && "rotate-180")} />
              </button>
              {hrMenuOpen ? (
                <div className="mt-2 space-y-1">
                  <label className="relative block">
                    <span className="sr-only">{t("navigation.search")}</span>
                    <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
                    <input
                      type="search"
                      value={hrMenuSearch}
                      onChange={(event) => setHrMenuSearch(event.target.value)}
                      placeholder={t("navigation.searchPlaceholder")}
                      className="h-9 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] ps-9 pe-3 text-sm text-[var(--color-foreground)] outline-none focus:border-[var(--color-accent)]"
                    />
                  </label>
                  {filteredHrItems.map((item) => (
                    <SidebarNavLink
                      key={item.id}
                      item={item}
                      active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                      expanded={expanded}
                      icon={sidebar.iconFor(item)}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </nav>

        <div className={cn("shrink-0 space-y-2 overflow-x-hidden border-t border-[var(--color-border)] p-3", !expanded && "flex flex-col items-center")}>
          <button
            type="button"
            onClick={() => setCustomizeOpen(true)}
            className={cn(
              "inline-flex h-10 min-w-0 items-center justify-center gap-3 rounded-[var(--radius-md)] text-sm font-semibold text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)]",
              expanded ? "w-full px-3" : "w-10",
            )}
            aria-label={t("sidebar.customize")}
            title={t("sidebar.customize")}
          >
            <Settings className="h-4 w-4 shrink-0" aria-hidden="true" />
            {expanded ? <span className="min-w-0 truncate">{t("sidebar.customize")}</span> : null}
          </button>

          <button
            type="button"
            onClick={sidebar.toggleMode}
            className={cn(
              "inline-flex h-10 min-w-0 items-center justify-center gap-3 rounded-[var(--radius-md)] text-sm font-semibold text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)]",
              expanded ? "w-full px-3" : "w-10",
            )}
            aria-label={expanded ? t("sidebar.collapse") : t("sidebar.expand")}
            title={expanded ? t("sidebar.collapse") : t("sidebar.expand")}
            aria-expanded={expanded}
          >
            <ToggleIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {expanded ? <span className="min-w-0 truncate">{t("sidebar.collapse")}</span> : null}
          </button>
        </div>
      </aside>

      <SidebarCustomizePanel
        open={customizeOpen}
        items={allowedItems}
        sidebar={sidebar}
        onClose={() => setCustomizeOpen(false)}
      />
    </>
  );
}

function SidebarNavLink({
  item,
  active,
  expanded,
  icon: Icon,
}: {
  item: NavItem;
  active: boolean;
  expanded: boolean;
  icon: NavItem["icon"];
}) {
  return (
    <Link
      href={item.href}
      className={cn(
        "relative flex h-11 min-w-0 shrink-0 items-center rounded-[var(--radius-md)] text-sm font-semibold transition-colors",
        "text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)]",
        expanded ? "w-full gap-3 px-3" : "w-11 justify-center",
        active &&
          "bg-[var(--color-accent-soft)] text-[var(--color-accent)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-accent)_20%,transparent)]",
      )}
      title={item.label}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
    >
      {active ? <span className="absolute inset-y-2 start-0 w-0.5 rounded-full bg-[var(--color-accent)]" /> : null}
      <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.25 : 1.8} aria-hidden="true" />
      {expanded ? <span className="min-w-0 truncate">{item.label}</span> : null}
    </Link>
  );
}

function SidebarCustomizePanel({
  open,
  items,
  sidebar,
  onClose,
}: {
  open: boolean;
  items: NavItem[];
  sidebar: ReturnType<typeof useSidebarPreferences>;
  onClose: () => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[var(--z-modal)] cursor-default bg-[var(--color-overlay)]"
        onClick={onClose}
        aria-label={t("common.close")}
      />
      <section
        className="fixed inset-y-0 end-0 z-[var(--z-popover)] flex w-[min(32rem,100vw)] flex-col overflow-x-hidden border-s border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-xl)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sidebar-customize-title"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase text-[var(--color-accent)]">{t("sidebar.settings")}</p>
            <h2 id="sidebar-customize-title" className="truncate text-lg font-semibold text-[var(--color-foreground)]">
              {t("sidebar.customize")}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)]"
            aria-label={t("common.close")}
            title={t("common.close")}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-x-hidden overflow-y-auto px-5 py-5">
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-[var(--color-foreground)]">{t("sidebar.display")}</legend>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => sidebar.setMode("collapsed")}
                className={modeButtonClass(sidebar.mode === "collapsed")}
              >
                {sidebar.mode === "collapsed" ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
                {t("sidebar.iconOnly")}
              </button>
              <button
                type="button"
                onClick={() => sidebar.setMode("expanded")}
                className={modeButtonClass(sidebar.mode === "expanded")}
              >
                {sidebar.mode === "expanded" ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
                {t("sidebar.iconAndText")}
              </button>
            </div>
          </fieldset>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-[var(--color-foreground)]">{t("sidebar.visibleItems")}</h3>
            <div className="space-y-2">
              {items.map((item) => (
                <SidebarCustomizeRow key={item.id} item={item} sidebar={sidebar} />
              ))}
            </div>
          </section>
        </div>

        <div className="border-t border-[var(--color-border)] p-5">
          <button
            type="button"
            onClick={sidebar.reset}
            className="ui-button ui-button-secondary w-full"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            {t("sidebar.reset")}
          </button>
        </div>
      </section>
    </>
  );
}

function SidebarCustomizeRow({
  item,
  sidebar,
}: {
  item: NavItem;
  sidebar: ReturnType<typeof useSidebarPreferences>;
}) {
  const { t } = useI18n();
  const Icon = item.icon;
  const hidden = sidebar.isHidden(item.id);
  const pinned = sidebar.isPinned(item.id);

  return (
    <div className="grid min-w-0 grid-cols-[1fr_auto] gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <div className="flex min-w-0 items-center gap-3">
        <Icon className="h-5 w-5 shrink-0 text-[var(--color-muted)]" aria-hidden="true" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--color-foreground)]">{item.label}</p>
          <p className="truncate text-xs text-[var(--color-muted)]">{item.group}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => (hidden ? sidebar.showItem(item.id) : sidebar.hideItem(item.id))}
          className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)]"
          aria-label={hidden ? t("sidebar.showItem") : t("sidebar.hideItem")}
          title={hidden ? t("sidebar.showItem") : t("sidebar.hideItem")}
        >
          {hidden ? <Eye className="h-4 w-4" aria-hidden="true" /> : <EyeOff className="h-4 w-4" aria-hidden="true" />}
        </button>
        <button
          type="button"
          onClick={() => (pinned ? sidebar.unpinItem(item.id) : sidebar.pinItem(item.id))}
          className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)]"
          aria-label={pinned ? t("sidebar.unpinItem") : t("sidebar.pinItem")}
          title={pinned ? t("sidebar.unpinItem") : t("sidebar.pinItem")}
        >
          {pinned ? <PinOff className="h-4 w-4" aria-hidden="true" /> : <Pin className="h-4 w-4" aria-hidden="true" />}
        </button>
        <label className="sr-only" htmlFor={`sidebar-icon-${item.id}`}>{t("sidebar.chooseIcon")}</label>
        <select
          id={`sidebar-icon-${item.id}`}
          value={sidebar.preferences.iconOverrides[item.id] ?? item.iconKey}
          onChange={(event) => sidebar.setIconOverride(item.id, event.target.value as SidebarIconKey)}
          className="h-9 max-w-32 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs font-semibold text-[var(--color-foreground)]"
          title={t("sidebar.chooseIcon")}
          aria-label={t("sidebar.chooseIcon")}
        >
          {Object.keys(sidebar.safeIconMap).map((iconKey) => (
            <option key={iconKey} value={iconKey}>
              {t(`sidebar.icon.${iconKey}`)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function modeButtonClass(active: boolean) {
  return cn(
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] border px-3 text-sm font-semibold",
    active
      ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
      : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)]",
  );
}

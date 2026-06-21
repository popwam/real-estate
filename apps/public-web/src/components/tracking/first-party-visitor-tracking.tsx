"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ensureVisitorSession,
  flushVisitorEvents,
  projectSlugFromPath,
  trackPublicEvent,
} from "@/lib/visitor-tracking";

export function FirstPartyVisitorTracking() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const projectSlug = projectSlugFromPath(pathname);
    void ensureVisitorSession(projectSlug).then((context) => {
      if (!context) return;
      trackPublicEvent({ eventType: "PAGE_VIEW", projectSlug });
      if (projectSlug) trackPublicEvent({ eventType: "PROJECT_VIEW", projectSlug });
      const searchQuery = searchParams.get("q") ?? searchParams.get("search") ?? undefined;
      if (searchQuery) trackPublicEvent({ eventType: "SEARCH", searchQuery: searchQuery.slice(0, 250) });
      const filters = Object.fromEntries(
        [...searchParams.entries()]
          .filter(([key]) => !key.startsWith("utm_") && !["brokerId", "brokerSlug", "brokerageSlug", "ref", "q", "search"].includes(key))
          .slice(0, 25),
      );
      if (Object.keys(filters).length) trackPublicEvent({ eventType: "FILTER_CHANGE", filters });
    });
  }, [pathname, searchParams]);

  useEffect(() => {
    const startedAt = Date.now();
    const sentDepths = new Set<number>();
    let lastScrollRun = 0;
    const onScroll = () => {
      const now = Date.now();
      if (now - lastScrollRun < 250) return;
      lastScrollRun = now;
      const available = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const depth = Math.min(100, Math.round((window.scrollY / available) * 100));
      for (const threshold of [25, 50, 75, 100]) {
        if (depth >= threshold && !sentDepths.has(threshold)) {
          sentDepths.add(threshold);
          trackPublicEvent({ eventType: "SCROLL_DEPTH", scrollDepth: threshold, projectSlug: projectSlugFromPath(pathname) });
        }
      }
    };
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          trackPublicEvent({ eventType: "SECTION_REACHED", sectionId: (element.dataset.trackSection ?? element.id).slice(0, 100) });
          observer.unobserve(element);
        }
      }
    }, { threshold: 0.5 });
    document.querySelectorAll<HTMLElement>("[data-track-section], section[id]").forEach((element) => observer.observe(element));
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
      trackPublicEvent({
        eventType: "TIME_ON_PAGE",
        durationMs: Math.min(30 * 60 * 1000, Date.now() - startedAt),
        projectSlug: projectSlugFromPath(pathname),
      });
      void flushVisitorEvents();
    };
  }, [pathname]);

  return null;
}

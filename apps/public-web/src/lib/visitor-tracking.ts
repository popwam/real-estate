"use client";

import { getPublicApiBaseUrl } from "@/lib/public-api";

export type VisitorContext = { visitorId: string; sessionId: string };
export type VisitorEventType =
  | "PAGE_VIEW"
  | "PROJECT_VIEW"
  | "SEARCH"
  | "FILTER_CHANGE"
  | "SECTION_REACHED"
  | "SCROLL_DEPTH"
  | "TIME_ON_PAGE"
  | "START_CHAT_CLICKED"
  | "REQUEST_CALL_CLICKED";

type VisitorEvent = {
  eventType: VisitorEventType;
  projectSlug?: string;
  path: string;
  searchQuery?: string;
  filters?: Record<string, string>;
  durationMs?: number;
  scrollDepth?: number;
  sectionId?: string;
};

const VISITOR_KEY = "popwam.visitor.v1";
const SESSION_KEY = "popwam.session.v1";
const CONTEXT_KEY = "popwam.session.context.v1";
const CONTEXT_SOURCE_KEY = "popwam.session.source.v1";
let queue: VisitorEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let pendingSession: Promise<VisitorContext | null> | null = null;

export async function ensureVisitorSession(projectSlug?: string): Promise<VisitorContext | null> {
  if (typeof window === "undefined") return null;
  const cached = readContext();
  const sourceSignature = `${projectSlug ?? projectSlugFromPath(window.location.pathname) ?? ""}:${window.location.search}`;
  if (cached && sessionStorage.getItem(CONTEXT_SOURCE_KEY) === sourceSignature) return cached;
  if (pendingSession) return pendingSession;

  pendingSession = (async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const response = await fetch(`${getPublicApiBaseUrl()}/public/visitors/session`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          anonymousKey: stableKey(localStorage, VISITOR_KEY),
          sessionKey: stableKey(sessionStorage, SESSION_KEY),
          projectSlug: projectSlug ?? projectSlugFromPath(window.location.pathname),
          path: window.location.pathname.slice(0, 500),
          brokerId: params.get("brokerId") ?? undefined,
          brokerSlug: params.get("brokerSlug") ?? undefined,
          brokerageSlug: params.get("brokerageSlug") ?? undefined,
          ref: params.get("ref") ?? document.referrer?.slice(0, 250) ?? undefined,
          utm: captureUtm(params),
        }),
        keepalive: true,
      });
      if (!response.ok) return null;
      const context = (await response.json()) as VisitorContext;
      if (!context.visitorId || !context.sessionId) return null;
      sessionStorage.setItem(CONTEXT_KEY, JSON.stringify(context));
      sessionStorage.setItem(CONTEXT_SOURCE_KEY, sourceSignature);
      return context;
    } catch {
      return null;
    } finally {
      pendingSession = null;
    }
  })();
  return pendingSession;
}

export function trackPublicEvent(event: Omit<VisitorEvent, "path"> & { path?: string }) {
  if (typeof window === "undefined") return;
  queue.push({
    ...event,
    path: (event.path ?? window.location.pathname).slice(0, 500),
  });
  if (queue.length >= 10) void flushVisitorEvents();
  else {
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = setTimeout(() => void flushVisitorEvents(), 1200);
  }
}

export async function flushVisitorEvents() {
  if (!queue.length || typeof window === "undefined") return;
  const context = await ensureVisitorSession();
  if (!context) {
    queue = [];
    return;
  }
  const events = queue.splice(0, 25);
  try {
    await fetch(`${getPublicApiBaseUrl()}/public/visitors/events`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...context, events }),
      keepalive: true,
    });
  } catch {
    // Analytics is intentionally non-blocking and silent.
  }
}

export function projectSlugFromPath(path: string) {
  const match = path.match(/^\/projects\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

function readContext(): VisitorContext | null {
  try {
    const value = sessionStorage.getItem(CONTEXT_KEY);
    return value ? (JSON.parse(value) as VisitorContext) : null;
  } catch {
    return null;
  }
}

function stableKey(storage: Storage, name: string) {
  const existing = storage.getItem(name);
  if (existing) return existing;
  const value = typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${crypto.getRandomValues(new Uint32Array(4)).join("-")}`;
  storage.setItem(name, value);
  return value;
}

function captureUtm(params: URLSearchParams) {
  return Object.fromEntries(
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]
      .map((key) => [key, params.get(key)] as const)
      .filter((entry): entry is readonly [string, string] => Boolean(entry[1]))
      .map(([key, value]) => [key, value.slice(0, 250)]),
  );
}

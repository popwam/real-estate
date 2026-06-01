export type PublicDataMode = "api" | "mock" | "hybrid";

export type PublicProjectFilters = {
  organizationSlug?: string;
  city?: string;
  district?: string;
  unitType?: string;
  minPrice?: string | number;
  maxPrice?: string | number;
};

export type ApiWebsiteSettings = {
  publicSlug: string;
  subdomain: string;
  customDomain: string | null;
  siteTitle: string;
  siteDescription: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  whatsappUrl: string | null;
  isPublished: boolean;
};

export type ApiPublicOrganization = {
  id: string;
  name: string;
  slug: string;
  type: "DEVELOPER" | "BROKERAGE" | "PLATFORM" | "INDIVIDUAL_BROKER";
  status: string;
  profile: {
    summary: string | null;
    logoUrl: string | null;
    website: string | null;
    city: string | null;
    country: string | null;
  };
  websiteSettings: ApiWebsiteSettings | null;
  verification: {
    badge: boolean;
    status: string | null;
  };
  contact: {
    phone: string | null;
    email: string | null;
    whatsappUrl: string | null;
  };
};

export type ApiPublicPaymentPlan = {
  id: string;
  scope: string;
  name: string;
  downPaymentPct: number | null;
  installmentMonths: number | null;
  installmentPct: number | null;
  onDeliveryPct: number | null;
  maintenanceFee: number | null;
  conditions: unknown;
};

export type ApiPublicUnit = {
  id: string;
  unitType: string;
  areaSqm: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  finishing: string | null;
  view: string | null;
  basePrice: number | null;
  currency: string;
  pricePerSqm: number | null;
  images: string[];
  floorPlanUrl: string | null;
  paymentPlans: ApiPublicPaymentPlan[];
};

export type ApiPublicProject = {
  id: string;
  name: string;
  slug: string;
  type: string;
  city: string | null;
  district: string | null;
  address: string | null;
  deliveryDate: string | null;
  description: string | null;
  coverImageUrl: string | null;
  images: string[];
  amenities: string[];
  isFeatured: boolean;
  availableUnitsCount: number;
  startingPrice: number | null;
  currency: string | null;
  developer: {
    id: string;
    name: string;
    slug: string;
    type: string;
    logoUrl: string | null;
    summary: string | null;
    contact: {
      phone: string | null;
      email: string | null;
      whatsappUrl: string | null;
    };
  };
  paymentPlans: ApiPublicPaymentPlan[];
  latitude?: number | null;
  longitude?: number | null;
  videos?: string[];
  brochureUrl?: string | null;
  phases?: Array<{
    id: string;
    name: string;
    deliveryDate: string | null;
    totalUnits: number | null;
    availableUnits: number | null;
    status: string;
  }>;
  units?: ApiPublicUnit[];
};

export type ApiDomainResolution = {
  kind: "SUBDOMAIN" | "CUSTOM_DOMAIN";
  host: string;
  organization: ApiPublicOrganization;
  websiteSettings: ApiWebsiteSettings | null;
  routes: {
    home: string;
    projects: string;
    contact: string;
  };
};

export type SubmitPublicLeadPayload = {
  organizationSlug?: string;
  projectSlug?: string;
  name: string;
  phone: string;
  email?: string;
  message?: string;
  sourcePage?: string;
  utm?: Record<string, string>;
  website?: string;
  companyWebsite?: string;
  preferredContactMethod?: PreferredContactMethod;
  consent: boolean;
};

export type PreferredContactMethod = "CALL" | "CHAT" | "WHATSAPP";

export type SubmitPublicLeadResponse = {
  success: boolean;
  id: string;
  status: "NEW" | "REVIEWED" | "CONVERTED" | "SPAM" | string;
  preferredContactMethod?: PreferredContactMethod;
  duplicate?: boolean;
  duplicateReason?: string;
  message: string;
  contact?: {
    preferredContactMethod?: PreferredContactMethod;
    whatsappUrl?: string | null;
    note?: string;
  };
  conversation?: {
    shareToken?: string | null;
    shareUrl?: string | null;
  };
  shareToken?: string | null;
  conversationUrl?: string | null;
  isMock?: boolean;
};

export type PublicConversationByToken = {
  id: string;
  type: string;
  status: string;
  project?: {
    id?: string;
    name?: string;
    slug?: string;
  } | null;
  participants: Array<{
    publicRole: string;
    displayName: string | null;
    joinedAt?: string | null;
  }>;
  messages: Array<{
    id: string;
    type: string;
    body: string;
    createdAt: string;
    sender?: {
      publicRole: string;
      displayName: string | null;
    } | null;
  }>;
};

export type PostConversationMessageByTokenPayload = {
  body: string;
  senderName?: string;
};

export type PublicConversationTokenMessageResponse = {
  ok: boolean;
  message: PublicConversationByToken["messages"][number];
  isMock?: boolean;
};

export class PublicApiError extends Error {
  status: number;
  details: unknown;
  requestId?: string;

  constructor(status: number, message: string, details?: unknown, requestId?: string) {
    super(message);
    this.name = "PublicApiError";
    this.status = status;
    this.details = details;
    this.requestId = requestId;
  }
}

export function getPublicDataMode(): PublicDataMode {
  const value = process.env.NEXT_PUBLIC_PUBLIC_WEB_DATA_MODE;

  if (value === "api" || value === "mock" || value === "hybrid") {
    return value;
  }

  return "hybrid";
}

export function getPublicApiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

export async function getPublicProjects(filters: PublicProjectFilters = {}) {
  return publicApiFetch<ApiPublicProject[]>("/public/projects", { query: filters });
}

export async function getPublicProject(slug: string) {
  return publicApiFetch<ApiPublicProject>(`/public/projects/${encodeURIComponent(slug)}`);
}

export async function getPublicOrganization(slug: string) {
  return publicApiFetch<ApiPublicOrganization>(
    `/public/organizations/${encodeURIComponent(slug)}`,
  );
}

export async function resolvePublicDomain(host: string) {
  return publicApiFetch<ApiDomainResolution>(
    `/public/domain/${encodeURIComponent(host)}`,
  );
}

export async function getPublicOrganizationProjects(slug: string) {
  return publicApiFetch<ApiPublicProject[]>(
    `/public/organizations/${encodeURIComponent(slug)}/projects`,
  );
}

export async function submitPublicLead(payload: SubmitPublicLeadPayload) {
  return publicApiFetch<SubmitPublicLeadResponse>("/public/leads", {
    method: "POST",
    body: payload,
  });
}

export async function getConversationByToken(token: string) {
  return publicApiFetch<PublicConversationByToken>(
    `/conversations/by-token/${encodeURIComponent(token)}`,
  );
}

export async function postConversationMessageByToken(
  token: string,
  payload: PostConversationMessageByTokenPayload,
) {
  return publicApiFetch<PublicConversationTokenMessageResponse>(
    `/conversations/by-token/${encodeURIComponent(token)}/messages`,
    {
      method: "POST",
      body: payload,
    },
  );
}

async function publicApiFetch<T>(
  path: string,
  options: {
    query?: Record<string, string | number | undefined>;
    method?: "GET" | "POST";
    body?: unknown;
  } = {},
) {
  const url = new URL(`${getPublicApiBaseUrl()}${path}`);
  const requestId = createRequestId("public-web");
  const method = options.method ?? "GET";

  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    method,
    headers: buildPublicApiHeaders(options.body, requestId),
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  }).catch((error) => {
    logPublicApiErrorDiagnostic({
      status: 0,
      method,
      path: url.pathname,
      requestId,
      message: "Network request failed",
    });
    throw new PublicApiError(
      0,
      "Network request failed",
      error instanceof Error ? { name: error.name } : undefined,
      requestId,
    );
  });
  const responseRequestId = response.headers.get("x-request-id") ?? requestId;

  if (!response.ok) {
    const body = await parseResponse(response);
    const message =
      typeof body === "object" && body && "message" in body
        ? String((body as { message: unknown }).message)
        : `Public API ${url.pathname} failed with ${response.status}`;
    logPublicApiErrorDiagnostic({
      status: response.status,
      method,
      path: url.pathname,
      requestId: responseRequestId,
      message,
    });
    throw new PublicApiError(response.status, message, body, responseRequestId);
  }

  return (await response.json()) as T;
}

function buildPublicApiHeaders(body: unknown, requestId: string) {
  return {
    Accept: "application/json",
    "x-request-id": requestId,
    ...(body ? { "Content-Type": "application/json" } : {}),
  };
}

function createRequestId(prefix: "public-web") {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);

  return `${prefix}-${timestamp}-${random}`;
}

function logPublicApiErrorDiagnostic(input: {
  status: number;
  method: string;
  path: string;
  requestId: string;
  message: string;
}) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.debug("[public-api]", {
    status: input.status,
    method: input.method,
    path: sanitizePublicDiagnosticPath(input.path),
    requestId: input.requestId,
    message: input.message,
  });
}

function sanitizePublicDiagnosticPath(path: string) {
  return path
    .split("?")[0]
    .replace(/^\/conversations\/by-token\/[^/]+\/messages$/, "/conversations/by-token/:shareToken/messages")
    .replace(/^\/conversations\/by-token\/[^/]+$/, "/conversations/by-token/:shareToken");
}

async function parseResponse(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

import {
  getPublicBrokerageBySlug as getMockBrokerageBySlug,
  getPublicDeveloperBySlug as getMockDeveloperBySlug,
  getPublicOrganizationBySlug as getMockOrganizationBySlug,
  getPublicProjectBySlug as getMockProjectBySlug,
  getPublicProjectForOrganization as getMockProjectForOrganization,
  listProjectFilterOptions as listMockProjectFilterOptions,
  listPublicProjects as listMockPublicProjects,
  listPublicProjectsByFilters as listMockPublicProjectsByFilters,
  listPublicProjectsForOrganization as listMockProjectsForOrganization,
  resolvePublicOrganizationByDomain as resolveMockOrganizationByDomain,
  type PublicOrganization,
  type PublicProject,
} from "@/lib/mock-public-marketplace";
import {
  getPublicDataMode,
  getPublicOrganization,
  getPublicOrganizationProjects,
  getPublicProject,
  getPublicProjects,
  getConversationByToken,
  postConversationMessageByToken,
  resolvePublicDomain,
  submitPublicLead,
  PublicApiError,
  type ApiDomainResolution,
  type ApiPublicOrganization,
  type ApiPublicPaymentPlan,
  type ApiPublicProject,
  type ApiPublicUnit,
  type PreferredContactMethod,
  type PostConversationMessageByTokenPayload,
  type PublicConversationByToken,
  type PublicConversationTokenMessageResponse,
  type PublicProjectFilters as ApiProjectFilters,
  type SubmitPublicLeadPayload,
} from "@/lib/public-api";

export type MarketplacePageFilters = {
  city?: string;
  district?: string;
  unitType?: string;
  priceRange?: string;
  organizationSlug?: string;
};

export type PublicDomainResolution = {
  kind: "main" | "popwam-subdomain" | "custom-domain" | "path-domain" | "unknown";
  input: string;
  canonicalHost: string;
  organizationSlug?: string;
  organizationName?: string;
  isDemo: boolean;
};

export async function listPublicProjects() {
  return withPublicData(
    () => getPublicProjects().then((projects) => projects.map(toPublicProject)),
    () => listMockPublicProjects(),
  );
}

export async function listFeaturedPublicProjects() {
  const projects = await listPublicProjects();
  const featured = projects.filter((project) => project.featured);

  return featured.length ? featured : projects.slice(0, 2);
}

export async function listPublicProjectsByFilters(filters: MarketplacePageFilters) {
  return withPublicData(
    () =>
      getPublicProjects(toApiFilters(filters)).then((projects) =>
        projects.map(toPublicProject),
      ),
    () => listMockPublicProjectsByFilters(filters),
  );
}

export async function listProjectFilterOptions() {
  return withPublicData(
    async () => {
      const projects = await getPublicProjects();
      const publicProjects = projects.map(toPublicProject);

      return {
        cities: unique(publicProjects.map((project) => project.city).filter(Boolean)),
        districts: unique(
          publicProjects.map((project) => project.district).filter(Boolean),
        ),
        unitTypes: unique(
          publicProjects.flatMap((project) =>
            project.unitTypes.map((unitType) => unitType.type),
          ),
        ),
        priceRanges: defaultPriceRanges(),
      };
    },
    () => listMockProjectFilterOptions(),
  );
}

export async function getPublicProjectBySlug(slug: string) {
  return withPublicData(
    () => getPublicProject(slug).then(toPublicProject),
    () => getMockProjectBySlug(slug),
  );
}

export async function getPublicDeveloperBySlug(slug: string) {
  const organization = await getPublicOrganizationForRoute(slug, "DEVELOPER");
  return organization as (PublicOrganization & { projects: PublicProject[] }) | null;
}

export async function getPublicBrokerageBySlug(slug: string) {
  const organization = await getPublicOrganizationForRoute(slug, "BROKERAGE");
  return organization as PublicOrganization | null;
}

export async function getPublicOrganizationBySlug(slug: string) {
  return withPublicData(
    async () => {
      const [organization, projects] = await Promise.all([
        getPublicOrganization(slug),
        getPublicOrganizationProjects(slug),
      ]);

      return {
        ...toPublicOrganization(organization),
        projects: projects.map(toPublicProject),
      };
    },
    () => getMockOrganizationBySlug(slug),
  );
}

export async function listPublicProjectsForOrganization(slug: string) {
  return withPublicData(
    () =>
      getPublicOrganizationProjects(slug).then((projects) =>
        projects.map(toPublicProject),
      ),
    () => listMockProjectsForOrganization(slug),
  );
}

export async function getPublicProjectForOrganization(
  organizationSlug: string,
  projectSlug: string,
) {
  return withPublicData(
    async () => {
      const project = await getPublicProject(projectSlug);
      return project.developer.slug === organizationSlug
        ? toPublicProject(project)
        : null;
    },
    () => getMockProjectForOrganization(organizationSlug, projectSlug),
  );
}

export async function resolvePublicOrganizationByDomain(domain: string) {
  return withPublicData(
    async () => {
      const resolution = await resolvePublicDomain(toApiHost(domain));
      const projects = await getPublicOrganizationProjects(
        resolution.organization.slug,
      );

      return {
        ...toPublicOrganization(resolution.organization, resolution),
        projects: projects.map(toPublicProject),
      };
    },
    () => resolveMockOrganizationByDomain(domain),
  );
}

export async function resolvePublicDomainContext(
  domain: string,
): Promise<PublicDomainResolution> {
  return withPublicData(
    async () => {
      const resolution = await resolvePublicDomain(toApiHost(domain));
      return {
        kind:
          resolution.kind === "CUSTOM_DOMAIN"
            ? "custom-domain"
            : toApiHost(domain).includes(".")
              ? "popwam-subdomain"
              : "path-domain",
        input: domain,
        canonicalHost: resolution.host,
        organizationSlug: resolution.organization.slug,
        organizationName: resolution.organization.name,
        isDemo: false,
      };
    },
    async () => {
      const { resolveMockDomain } = await import("@/lib/mock-domain-resolver");
      return resolveMockDomain(domain);
    },
  );
}

export async function submitLead(payload: SubmitPublicLeadPayload) {
  const mode = getPublicDataMode();

  if (mode === "mock") {
    return mockLeadResponse(payload.preferredContactMethod);
  }

  try {
    return await submitPublicLead(payload);
  } catch (error) {
    if (error instanceof PublicApiError && error.status === 429) {
      throw error;
    }

    if (mode === "hybrid") {
      return mockLeadResponse(
        payload.preferredContactMethod,
        "Mock lead captured while API is unavailable.",
      );
    }

    throw error;
  }
}

export async function getPublicConversationByToken(token: string) {
  const mode = getPublicDataMode();

  if (mode === "mock") {
    return mockConversationByToken(token);
  }

  try {
    return await getConversationByToken(token);
  } catch (error) {
    if (mode === "hybrid" && token.startsWith("mock-chat-")) {
      return mockConversationByToken(token);
    }

    throw error;
  }
}

export async function postPublicConversationMessageByToken(
  token: string,
  payload: PostConversationMessageByTokenPayload,
) {
  const mode = getPublicDataMode();

  if (mode === "mock") {
    return mockConversationMessage(token, payload);
  }

  try {
    return await postConversationMessageByToken(token, payload);
  } catch (error) {
    if (error instanceof PublicApiError && error.status === 429) {
      throw error;
    }

    if (mode === "hybrid" && token.startsWith("mock-chat-")) {
      return mockConversationMessage(token, payload);
    }

    throw error;
  }
}

export function isPublicLeadRateLimitError(error: unknown) {
  return error instanceof PublicApiError && error.status === 429;
}

export function isPublicConversationMessageRateLimitError(error: unknown) {
  return error instanceof PublicApiError && error.status === 429;
}

async function getPublicOrganizationForRoute(
  slug: string,
  expectedType: "DEVELOPER" | "BROKERAGE",
) {
  return withPublicData(
    async () => {
      const [organization, projects] = await Promise.all([
        getPublicOrganization(slug),
        expectedType === "DEVELOPER"
          ? getPublicOrganizationProjects(slug)
          : Promise.resolve([]),
      ]);

      if (organization.type !== expectedType) {
        return null;
      }

      return {
        ...toPublicOrganization(organization),
        projects: projects.map(toPublicProject),
      };
    },
    () =>
      expectedType === "DEVELOPER"
        ? getMockDeveloperBySlug(slug)
        : getMockBrokerageBySlug(slug),
  );
}

async function withPublicData<T>(
  apiResolver: () => Promise<T>,
  mockResolver: () => Promise<T>,
) {
  const mode = getPublicDataMode();

  if (mode === "mock") {
    return mockResolver();
  }

  try {
    return await apiResolver();
  } catch (error) {
    if (mode === "hybrid") {
      return mockResolver();
    }

    throw error;
  }
}

function toApiFilters(filters: MarketplacePageFilters): ApiProjectFilters {
  const price = priceRangeToMinMax(filters.priceRange);

  return {
    organizationSlug: filters.organizationSlug,
    city: filters.city,
    district: filters.district,
    unitType: filters.unitType,
    minPrice: price.minPrice,
    maxPrice: price.maxPrice,
  };
}

function toPublicProject(project: ApiPublicProject): PublicProject {
  const units = project.units ?? [];
  const minPrice =
    minNumber(units.map((unit) => unit.basePrice)) ?? project.startingPrice ?? 0;
  const maxPrice = maxNumber(units.map((unit) => unit.basePrice)) ?? minPrice;
  const gallery = [
    ...(project.images ?? []),
    ...(units.flatMap((unit) => unit.images ?? []) ?? []),
  ].filter(Boolean);
  const heroImageUrl =
    project.coverImageUrl ??
    gallery[0] ??
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80";
  const unitTypes = toUnitTypes(project);
  const paymentPlan = toPaymentPlan(project.paymentPlans?.[0]);

  return {
    slug: project.slug,
    name: project.name,
    city: project.city ?? "Public marketplace",
    district: project.district ?? "Verified listing",
    developerSlug: project.developer.slug,
    developerName: project.developer.name,
    status: "ACTIVE",
    visibility: "OPEN_MARKETPLACE",
    priceLabel: minPrice ? `From ${formatMoney(minPrice, project.currency)}` : "Price on request",
    unitMix:
      unitTypes.map((unitType) => unitType.type).join(", ") ||
      `${project.availableUnitsCount} available units`,
    deliveryLabel: project.deliveryDate
      ? `Delivery from ${new Date(project.deliveryDate).getFullYear()}`
      : "Delivery date available on request",
    heroImageUrl,
    galleryImageUrls: gallery.length ? gallery.slice(0, 3) : [heroImageUrl],
    summary: project.description ?? project.developer.summary ?? "Public project details.",
    highlights: project.amenities?.length
      ? project.amenities
      : ["Verified developer", "Open-marketplace public listing"],
    unitTypes,
    paymentPlan,
    minPrice,
    maxPrice,
    featured: project.isFeatured,
    ogImageUrl: heroImageUrl,
    developerContact: project.developer.contact,
  };
}

function toPublicOrganization(
  organization: ApiPublicOrganization,
  resolution?: ApiDomainResolution,
): PublicOrganization {
  const settings = organization.websiteSettings ?? resolution?.websiteSettings;
  const subdomain = settings?.subdomain
    ? `${settings.subdomain}.popwam.com`
    : `${organization.slug}.popwam.com`;
  const customDomain = settings?.customDomain ?? undefined;

  return {
    name: organization.name,
    slug: organization.slug,
    type: organization.type === "BROKERAGE" ? "BROKERAGE" : "DEVELOPER",
    city: organization.profile.city ?? "Verified market",
    country: organization.profile.country ?? "POPWAM",
    summary:
      settings?.siteDescription ??
      organization.profile.summary ??
      "Verified POPWAM public profile.",
    highlights: ["Verified public profile", "Safe public contact fields"],
    verifiedLabel: organization.verification.badge
      ? "POPWAM verified"
      : "Verification pending",
    establishedLabel: "Verified organization",
    projectCountLabel: "Public portfolio",
    brokerCountLabel:
      organization.type === "BROKERAGE" ? "Brokerage profile" : undefined,
    serviceAreas: [organization.profile.city, organization.profile.country].filter(
      Boolean,
    ) as string[],
    heroImageUrl:
      settings?.logoUrl ??
      organization.profile.logoUrl ??
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80",
    ogImageUrl:
      settings?.logoUrl ??
      organization.profile.logoUrl ??
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
    publicDomains: [organization.slug, subdomain, customDomain].filter(Boolean) as string[],
    subdomain,
    customDomain,
    contact: {
      phone: organization.contact.phone,
      email: organization.contact.email,
      whatsappUrl: organization.contact.whatsappUrl,
    },
  };
}

function mockLeadResponse(
  preferredContactMethod: PreferredContactMethod | undefined = "CALL",
  message = "Mock lead captured.",
) {
  const shareToken =
    preferredContactMethod === "CHAT" ? `mock-chat-${Date.now()}` : undefined;

  return {
    success: true,
    id: `mock-${Date.now()}`,
    status: "NEW",
    preferredContactMethod,
    message,
    isMock: true,
    contact:
      preferredContactMethod === "WHATSAPP"
        ? {
            preferredContactMethod,
            whatsappUrl: "https://wa.me/201000000000",
            note: "Demo/mock WhatsApp link. No provider was called.",
          }
        : undefined,
    conversation: shareToken
      ? {
          shareToken,
          shareUrl: `/c/${shareToken}`,
        }
      : undefined,
    shareToken,
    conversationUrl: shareToken ? `/c/${shareToken}` : undefined,
  };
}

function mockConversationByToken(token: string): PublicConversationByToken {
  return {
    id: token,
    type: "PUBLIC_LEAD",
    status: "OPEN",
    project: {
      name: "Demo chat request",
      slug: "demo",
    },
    participants: [
      {
        publicRole: "CLIENT",
        displayName: "Demo visitor",
      },
      {
        publicRole: "SYSTEM",
        displayName: "POPWAM demo",
      },
    ],
    messages: [
      {
        id: `${token}-message-1`,
        type: "SYSTEM",
        body: "Demo/mock conversation link. API mode only displays real backend conversation tokens.",
        createdAt: new Date().toISOString(),
        sender: {
          publicRole: "SYSTEM",
          displayName: "POPWAM demo",
        },
      },
    ],
  };
}

function mockConversationMessage(
  token: string,
  payload: PostConversationMessageByTokenPayload,
): PublicConversationTokenMessageResponse {
  const body = payload.body.trim();

  if (!body) {
    throw new PublicApiError(400, "body is required.");
  }

  if (body.length > 2000) {
    throw new PublicApiError(400, "body must be 2000 characters or fewer.");
  }

  return {
    ok: true,
    isMock: true,
    message: {
      id: `${token}-mock-reply-${Date.now()}`,
      type: "TEXT",
      body,
      createdAt: new Date().toISOString(),
      sender: {
        publicRole: "CLIENT",
        displayName: payload.senderName?.trim() || "Demo visitor",
      },
    },
  };
}

function toUnitTypes(project: ApiPublicProject) {
  const units = project.units ?? [];

  if (!units.length && project.availableUnitsCount > 0) {
    return [
      {
        type: "Available units",
        bedrooms: `${project.availableUnitsCount} public units`,
        sizeRange: "Details on request",
        startingPrice: project.startingPrice
          ? formatMoney(project.startingPrice, project.currency)
          : "Price on request",
      },
    ];
  }

  return Object.values(
    units.reduce<Record<string, ApiPublicUnit[]>>((groups, unit) => {
      groups[unit.unitType] = [...(groups[unit.unitType] ?? []), unit];
      return groups;
    }, {}),
  ).map((group) => {
    const first = group[0];
    const prices = group.map((unit) => unit.basePrice);
    const sizes = group.map((unit) => unit.areaSqm);
    const bedrooms = unique(
      group.map((unit) => unit.bedrooms).filter((value) => value !== null),
    );

    return {
      type: titleCase(first.unitType),
      bedrooms: bedrooms.length
        ? `${bedrooms.join("-")} bedrooms`
        : "Bedroom details on request",
      sizeRange: rangeLabel(sizes, "sqm"),
      startingPrice: formatMoney(minNumber(prices), first.currency),
    };
  });
}

function toPaymentPlan(plan: ApiPublicPaymentPlan | undefined) {
  return {
    downPayment: plan?.downPaymentPct ? `${plan.downPaymentPct}%` : "On request",
    installments: plan?.installmentMonths
      ? `${plan.installmentMonths} months`
      : "On request",
    delivery: plan?.onDeliveryPct ? `${plan.onDeliveryPct}% on delivery` : "On request",
    maintenance: plan?.maintenanceFee
      ? formatMoney(plan.maintenanceFee, null)
      : "On request",
  };
}

function priceRangeToMinMax(priceRange: string | undefined) {
  if (priceRange === "under-5m") {
    return { maxPrice: 5000000 };
  }

  if (priceRange === "5m-10m") {
    return { minPrice: 5000000, maxPrice: 10000000 };
  }

  if (priceRange === "10m-plus") {
    return { minPrice: 10000000 };
  }

  return {};
}

function defaultPriceRanges() {
  return [
    { label: "Any price", value: "" },
    { label: "Under 5M", value: "under-5m" },
    { label: "5M to 10M", value: "5m-10m" },
    { label: "10M+", value: "10m-plus" },
  ];
}

function toApiHost(domain: string) {
  const normalized = domain.trim().toLowerCase();

  if (normalized.includes(".")) {
    return normalized;
  }

  return `${normalized}.popwam.com`;
}

function formatMoney(value: number | null | undefined, currency: string | null | undefined) {
  if (!value) {
    return "Price on request";
  }

  return `${currency ?? "EGP"} ${Intl.NumberFormat("en-US", {
    notation: value >= 1000000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value)}`;
}

function rangeLabel(values: Array<number | null>, suffix: string) {
  const min = minNumber(values);
  const max = maxNumber(values);

  if (!min && !max) {
    return "Size on request";
  }

  return min === max ? `${min} ${suffix}` : `${min}-${max} ${suffix}`;
}

function minNumber(values: Array<number | null | undefined>) {
  const numbers = values.filter((value): value is number => typeof value === "number");
  return numbers.length ? Math.min(...numbers) : null;
}

function maxNumber(values: Array<number | null | undefined>) {
  const numbers = values.filter((value): value is number => typeof value === "number");
  return numbers.length ? Math.max(...numbers) : null;
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

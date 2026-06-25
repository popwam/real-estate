export type PublicProjectStatus = "ACTIVE" | "DRAFT";
export type PublicProjectVisibility =
  | "OPEN_MARKETPLACE"
  | "PRIVATE"
  | "APPROVED_BROKERAGES"
  | "SELECTED_BROKERS"
  | "HIDDEN";

export type PublicOrganization = {
  name: string;
  slug: string;
  type: "DEVELOPER" | "BROKERAGE";
  city: string;
  country: string;
  summary: string;
  highlights: string[];
  verifiedLabel: string;
  establishedLabel?: string;
  projectCountLabel?: string;
  brokerCountLabel?: string;
  serviceAreas?: string[];
  heroImageUrl?: string;
  ogImageUrl?: string;
  publicDomains: string[];
  subdomain: string;
  customDomain?: string;
  contact?: {
    phone?: string | null;
    email?: string | null;
    whatsappUrl?: string | null;
  };
};

export type PublicUnitType = {
  type: string;
  bedrooms: string;
  sizeRange: string;
  startingPrice: string;
};

export type PublicPaymentPlan = {
  downPayment: string;
  installments: string;
  delivery: string;
  maintenance: string;
};

export type PublicProject = {
  slug: string;
  name: string;
  city: string;
  district: string;
  address?: string | null;
  propertyType?: string;
  developerSlug: string;
  developerName: string;
  status: PublicProjectStatus;
  visibility: PublicProjectVisibility;
  priceLabel: string;
  unitMix: string;
  deliveryLabel: string;
  heroImageUrl: string;
  galleryImageUrls: string[];
  summary: string;
  highlights: string[];
  unitTypes: PublicUnitType[];
  paymentPlan: PublicPaymentPlan;
  minPrice: number;
  maxPrice: number;
  availableUnitsCount?: number;
  hasMedia?: boolean;
  hasPaymentPlan?: boolean;
  hasPrice?: boolean;
  featured: boolean;
  ogImageUrl: string;
  developerContact?: {
    phone?: string | null;
    email?: string | null;
    whatsappUrl?: string | null;
  };
};

export type PublicProjectFilters = {
  city?: string;
  district?: string;
  unitType?: string;
  priceRange?: string;
};

const projects: PublicProject[] = [
  {
    slug: "northline-residences",
    name: "Northline Residences",
    city: "New Cairo",
    district: "Golden Square",
    propertyType: "Residential",
    developerSlug: "northline-development-group",
    developerName: "Northline Development Group",
    status: "ACTIVE",
    visibility: "OPEN_MARKETPLACE",
    priceLabel: "From EGP 4.2M",
    unitMix: "Apartments, duplexes, and penthouses",
    deliveryLabel: "Delivery from 2028",
    heroImageUrl:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80",
    galleryImageUrls: [
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?auto=format&fit=crop&w=900&q=80",
    ],
    summary:
      "A residential project with published public details for buyers comparing locations, unit types, and payment options.",
    highlights: [
      "Developer profile available",
      "Public-only project information",
      "Interest routed through POPWAM",
    ],
    unitTypes: [
      {
        type: "Apartment",
        bedrooms: "1-3 bedrooms",
        sizeRange: "85-185 sqm",
        startingPrice: "EGP 4.2M",
      },
      {
        type: "Duplex",
        bedrooms: "3-4 bedrooms",
        sizeRange: "210-260 sqm",
        startingPrice: "EGP 8.9M",
      },
      {
        type: "Penthouse",
        bedrooms: "4 bedrooms",
        sizeRange: "300-340 sqm",
        startingPrice: "EGP 13.5M",
      },
    ],
    paymentPlan: {
      downPayment: "10%",
      installments: "8 years",
      delivery: "2028",
      maintenance: "8% on delivery",
    },
    minPrice: 4200000,
    maxPrice: 15000000,
    availableUnitsCount: 3,
    hasMedia: true,
    hasPaymentPlan: true,
    hasPrice: true,
    featured: true,
    ogImageUrl:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    slug: "coastline-village",
    name: "Coastline Village",
    city: "North Coast",
    district: "Ras El Hekma",
    propertyType: "Coastal homes",
    developerSlug: "northline-development-group",
    developerName: "Northline Development Group",
    status: "ACTIVE",
    visibility: "OPEN_MARKETPLACE",
    priceLabel: "From EGP 6.8M",
    unitMix: "Chalets, villas, and serviced residences",
    deliveryLabel: "Delivery from 2029",
    heroImageUrl:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80",
    galleryImageUrls: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=900&q=80",
    ],
    summary:
      "A coastal residential project with public unit-type, delivery, and payment-plan details.",
    highlights: [
      "Published public project details",
      "Coastal residential offering",
      "Interest routed through POPWAM",
    ],
    unitTypes: [
      {
        type: "Chalet",
        bedrooms: "2-3 bedrooms",
        sizeRange: "95-165 sqm",
        startingPrice: "EGP 6.8M",
      },
      {
        type: "Villa",
        bedrooms: "4-5 bedrooms",
        sizeRange: "240-420 sqm",
        startingPrice: "EGP 18.5M",
      },
    ],
    paymentPlan: {
      downPayment: "15%",
      installments: "7 years",
      delivery: "2029",
      maintenance: "10% on delivery",
    },
    minPrice: 6800000,
    maxPrice: 30000000,
    availableUnitsCount: 2,
    hasMedia: true,
    hasPaymentPlan: true,
    hasPrice: true,
    featured: true,
    ogImageUrl:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    slug: "harbor-demo",
    name: "Harbor Business Quay",
    city: "Dubai",
    district: "Business Bay",
    propertyType: "Mixed-use",
    developerSlug: "gulf-demo-developer",
    developerName: "Gulf Coast Properties",
    status: "ACTIVE",
    visibility: "OPEN_MARKETPLACE",
    priceLabel: "From AED 1.7M",
    unitMix: "Studios, apartments, and serviced residences",
    deliveryLabel: "Delivery from 2027",
    heroImageUrl:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80",
    galleryImageUrls: [
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80",
    ],
    summary:
      "A mixed-use public listing with residential and serviced residence options in a central business district.",
    highlights: [
      "Published public project details",
      "Mixed-use project summary",
      "Interest routed through POPWAM",
    ],
    unitTypes: [
      {
        type: "Studio",
        bedrooms: "Studio",
        sizeRange: "45-58 sqm",
        startingPrice: "AED 1.7M",
      },
      {
        type: "Apartment",
        bedrooms: "1-2 bedrooms",
        sizeRange: "70-145 sqm",
        startingPrice: "AED 2.4M",
      },
    ],
    paymentPlan: {
      downPayment: "20%",
      installments: "5 years",
      delivery: "2027",
      maintenance: "Service charge TBD",
    },
    minPrice: 1700000,
    maxPrice: 6200000,
    availableUnitsCount: 2,
    hasMedia: true,
    hasPaymentPlan: true,
    hasPrice: true,
    featured: false,
    ogImageUrl:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    slug: "private-inventory-hidden-from-public",
    name: "Private Developer Inventory",
    city: "Cairo",
    district: "Confidential",
    propertyType: "Private inventory",
    developerSlug: "private-developer",
    developerName: "Private Developer",
    status: "ACTIVE",
    visibility: "PRIVATE",
    priceLabel: "Hidden",
    unitMix: "Hidden",
    deliveryLabel: "Hidden",
    heroImageUrl: "",
    galleryImageUrls: [],
    summary: "This private record is excluded from public marketplace browsing.",
    highlights: [],
    unitTypes: [],
    paymentPlan: {
      downPayment: "Hidden",
      installments: "Hidden",
      delivery: "Hidden",
      maintenance: "Hidden",
    },
    minPrice: 0,
    maxPrice: 0,
    availableUnitsCount: 0,
    hasMedia: false,
    hasPaymentPlan: false,
    hasPrice: false,
    featured: false,
    ogImageUrl: "",
  },
];

const organizations: PublicOrganization[] = [
  {
    name: "Northline Development Group",
    slug: "northline-development-group",
    type: "DEVELOPER",
    city: "Cairo",
    country: "Egypt",
    summary:
      "Developer profile for a participating organization with public project information and safe contact routing.",
    highlights: [
      "Developer public profile",
      "Published project portfolio",
      "Visitor interest routed through POPWAM",
    ],
    verifiedLabel: "Verification under review",
    establishedLabel: "Established 2014",
    projectCountLabel: "2 public projects",
    serviceAreas: ["New Cairo", "North Coast", "West Cairo"],
    heroImageUrl:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80",
    ogImageUrl:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
    publicDomains: ["northline", "northline.popwam.com"],
    subdomain: "northline.popwam.com",
    customDomain: "northline.test",
    contact: {
      phone: "+201000000000",
      email: "sales@northline.example",
      whatsappUrl: "https://wa.me/201000000000",
    },
  },
  {
    name: "Gulf Coast Properties",
    slug: "gulf-demo-developer",
    type: "DEVELOPER",
    city: "Dubai",
    country: "UAE",
    summary:
      "Developer profile for Gulf marketplace projects with published public portfolio information.",
    highlights: [
      "Developer public profile",
      "Public Gulf portfolio shell",
      "Private inventory remains protected",
    ],
    verifiedLabel: "Verification under review",
    establishedLabel: "Established 2018",
    projectCountLabel: "1 public project",
    serviceAreas: ["Dubai", "Abu Dhabi"],
    heroImageUrl:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80",
    ogImageUrl:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
    publicDomains: ["gulf-demo", "gulf-demo.popwam.com"],
    subdomain: "gulf-demo.popwam.com",
    contact: {
      phone: "+971500000000",
      email: "sales@gulf-demo.test",
      whatsappUrl: "https://wa.me/971500000000",
    },
  },
  {
    name: "Northline Brokerage Collective",
    slug: "northline-brokerage-collective",
    type: "BROKERAGE",
    city: "Cairo",
    country: "Egypt",
    summary:
      "A verified brokerage team helping buyers compare suitable homes and follow up through POPWAM.",
    highlights: [
      "Brokerage public profile",
      "Market coverage information",
      "Visitor interest routed through POPWAM",
    ],
    verifiedLabel: "Verification under review",
    brokerCountLabel: "Brokerage team",
    serviceAreas: ["New Cairo", "North Coast", "West Cairo"],
    heroImageUrl:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1400&q=80",
    ogImageUrl:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80",
    publicDomains: ["northline-brokerage", "northline-brokerage.popwam.com"],
    subdomain: "northline-brokerage.popwam.com",
    contact: {
      phone: "+201111111111",
      email: "hello@northline-brokerage.example",
      whatsappUrl: "https://wa.me/201111111111",
    },
  },
];

function isPublicProject(project: PublicProject) {
  return project.status === "ACTIVE" && project.visibility === "OPEN_MARKETPLACE";
}

export async function listPublicProjects() {
  return projects.filter(isPublicProject);
}

export async function listFeaturedPublicProjects() {
  return projects.filter((project) => isPublicProject(project) && project.featured);
}

export async function listProjectFilterOptions() {
  const publicProjects = projects.filter(isPublicProject);
  const cities = Array.from(new Set(publicProjects.map((project) => project.city)));
  const districts = Array.from(new Set(publicProjects.map((project) => project.district)));
  const unitTypes = Array.from(
    new Set(
      publicProjects.flatMap((project) => project.unitTypes.map((unit) => unit.type)),
    ),
  );

  return {
    cities,
    districts,
    unitTypes,
    priceRanges: [
      { label: "Any price", value: "" },
      { label: "Under 5M", value: "under-5m" },
      { label: "5M to 10M", value: "5m-10m" },
      { label: "10M+", value: "10m-plus" },
    ],
  };
}

export async function listPublicProjectsByFilters(filters: PublicProjectFilters) {
  const publicProjects = projects.filter(isPublicProject);

  return publicProjects.filter((project) => {
    const cityMatches = !filters.city || project.city === filters.city;
    const districtMatches = !filters.district || project.district === filters.district;
    const unitTypeMatches =
      !filters.unitType ||
      project.unitTypes.some((unitType) => unitType.type === filters.unitType);
    const priceMatches =
      !filters.priceRange ||
      filters.priceRange === "any" ||
      (filters.priceRange === "under-5m" && project.minPrice < 5000000) ||
      (filters.priceRange === "5m-10m" &&
        project.maxPrice >= 5000000 &&
        project.minPrice <= 10000000) ||
      (filters.priceRange === "10m-plus" && project.maxPrice >= 10000000);

    return cityMatches && districtMatches && unitTypeMatches && priceMatches;
  });
}

export async function getPublicProjectBySlug(slug: string) {
  return projects.find((project) => project.slug === slug && isPublicProject(project));
}

export async function getPublicDeveloperBySlug(slug: string) {
  const developer = organizations.find(
    (organization) => organization.slug === slug && organization.type === "DEVELOPER",
  );

  if (!developer) {
    return null;
  }

  return {
    ...developer,
    projects: projects.filter(
      (project) => project.developerSlug === slug && isPublicProject(project),
    ),
  };
}

export async function getPublicBrokerageBySlug(slug: string) {
  return (
    organizations.find(
      (organization) => organization.slug === slug && organization.type === "BROKERAGE",
    ) ?? null
  );
}

export async function getPublicOrganizationBySlug(slug: string) {
  const organization = organizations.find((item) => item.slug === slug);

  if (!organization) {
    return null;
  }

  return {
    ...organization,
    projects: projects.filter(
      (project) => project.developerSlug === organization.slug && isPublicProject(project),
    ),
  };
}

export async function listPublicProjectsForOrganization(slug: string) {
  return projects.filter(
    (project) => project.developerSlug === slug && isPublicProject(project),
  );
}

export async function getPublicProjectForOrganization(
  organizationSlug: string,
  projectSlug: string,
) {
  return projects.find(
    (project) =>
      project.developerSlug === organizationSlug &&
      project.slug === projectSlug &&
      isPublicProject(project),
  );
}

export async function resolvePublicOrganizationByDomain(domain: string) {
  const normalizedDomain = domain.toLowerCase();

  const organization = organizations.find(
    (item) =>
      item.publicDomains.includes(normalizedDomain) ||
      item.subdomain === normalizedDomain ||
      item.customDomain === normalizedDomain,
  );

  if (!organization) {
    return null;
  }

  return getPublicOrganizationBySlug(organization.slug);
}

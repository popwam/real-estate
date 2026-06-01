import {
  getPublicProjectBySlug,
  getPublicProjectForOrganization,
  getPublicOrganizationBySlug,
  resolvePublicOrganizationByDomain,
} from "@/lib/public-data";
import type {
  PublicOrganization,
  PublicProject,
} from "@/lib/mock-public-marketplace";

export type LandingPageSection =
  | "hero"
  | "project-highlight"
  | "unit-types"
  | "payment-plan"
  | "amenities"
  | "gallery"
  | "trust"
  | "lead-form"
  | "faq"
  | "sticky-cta";

export type MockLandingPage = {
  slug: string;
  title: string;
  subtitle: string;
  organizationSlug: string;
  projectSlug?: string;
  heroImage: string;
  sections: LandingPageSection[];
  amenities: string[];
  faq: Array<{ answer: string; question: string }>;
  ctaLabel: string;
  seoTitle: string;
  seoDescription: string;
  ogImage: string;
  noindex: boolean;
};

export type ResolvedLandingPage = MockLandingPage & {
  organization: PublicOrganization;
  project?: PublicProject;
};

const landingPages: MockLandingPage[] = [
  {
    slug: "northline-launch",
    title: "Northline Residences launch preview",
    subtitle:
      "A mock campaign page for an open-marketplace project with verification, project details, and a disabled lead form.",
    organizationSlug: "demo-developer",
    projectSlug: "demo",
    heroImage:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80",
    sections: [
      "hero",
      "project-highlight",
      "unit-types",
      "payment-plan",
      "amenities",
      "gallery",
      "trust",
      "lead-form",
      "faq",
      "sticky-cta",
    ],
    amenities: [
      "Clubhouse placeholder",
      "Landscape promenade placeholder",
      "Retail spine placeholder",
      "Smart access placeholder",
    ],
    faq: [
      {
        question: "Is this connected to live inventory?",
        answer: "No. This landing page is powered by mock public data only.",
      },
      {
        question: "Can visitors submit leads?",
        answer: "No backend submission is enabled in Slice 4.",
      },
      {
        question: "Which projects can appear?",
        answer: "Only active open-marketplace mock projects can render.",
      },
    ],
    ctaLabel: "Register interest placeholder",
    seoTitle: "Northline Residences Launch",
    seoDescription:
      "Mock landing page for Northline Residences with public-only project data and disabled lead capture.",
    ogImage:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
    noindex: true,
  },
  {
    slug: "coastline-summer",
    title: "Coastline Demo Village summer campaign",
    subtitle:
      "A demo marketing page for coastal project discovery, UTM capture, and placeholder form behavior.",
    organizationSlug: "demo-developer",
    projectSlug: "coastline-demo",
    heroImage:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80",
    sections: [
      "hero",
      "project-highlight",
      "unit-types",
      "payment-plan",
      "amenities",
      "gallery",
      "trust",
      "lead-form",
      "faq",
      "sticky-cta",
    ],
    amenities: [
      "Beach access placeholder",
      "Serviced residence placeholder",
      "Lagoon view placeholder",
      "Family zone placeholder",
    ],
    faq: [
      {
        question: "Does this page expose private units?",
        answer: "No. It resolves through the public mock adapter only.",
      },
      {
        question: "Are WhatsApp and call buttons live?",
        answer: "No. They use mock placeholder links in Slice 4.",
      },
    ],
    ctaLabel: "Request campaign details",
    seoTitle: "Coastline Demo Village Campaign",
    seoDescription:
      "Mock coastal project campaign page with public-only data and disabled backend lead capture.",
    ogImage:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    noindex: true,
  },
];

async function resolveLanding(page: MockLandingPage): Promise<ResolvedLandingPage | null> {
  const organization = await getPublicOrganizationBySlug(page.organizationSlug);

  if (!organization) {
    return null;
  }

  const project = page.projectSlug
    ? ((await getPublicProjectBySlug(page.projectSlug)) ?? undefined)
    : undefined;

  if (page.projectSlug && !project) {
    return null;
  }

  return {
    ...page,
    organization,
    project,
  };
}

export async function getMockLandingPageBySlug(slug: string) {
  const page = landingPages.find((item) => item.slug === slug);
  return page ? resolveLanding(page) : null;
}

export async function getMockLandingPageForDomain(domain: string, slug: string) {
  const organization = await resolvePublicOrganizationByDomain(domain);
  const page = landingPages.find((item) => item.slug === slug);

  if (!organization || !page || page.organizationSlug !== organization.slug) {
    return null;
  }

  const project = page.projectSlug
    ? ((await getPublicProjectForOrganization(organization.slug, page.projectSlug)) ??
      undefined)
    : undefined;

  if (page.projectSlug && !project) {
    return null;
  }

  return {
    ...page,
    organization,
    project,
  };
}

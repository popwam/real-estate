import {
  getPublicProjectBySlug,
  getPublicProjectForOrganization,
  getPublicOrganizationBySlug,
  resolvePublicOrganizationByDomain,
} from "@/lib/public-data";
import { PublicApiError } from "@/lib/public-api";
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
      "A campaign page for a public project with verification, project details, and interest capture.",
    organizationSlug: "northline-development-group",
    projectSlug: "northline-residences",
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
      "Clubhouse access",
      "Landscape promenade",
      "Retail spine",
      "Smart access",
    ],
    faq: [
      {
        question: "Is this connected to live inventory?",
        answer: "This page shows public project information and does not expose private inventory.",
      },
      {
        question: "Can visitors submit leads?",
        answer: "Yes. Visitors can send an interest request through the contact form.",
      },
      {
        question: "Which projects can appear?",
        answer: "Only projects approved for public visibility can appear.",
      },
    ],
    ctaLabel: "Register interest",
    seoTitle: "Northline Residences Launch",
    seoDescription:
      "Northline Residences campaign page with public project details and interest capture.",
    ogImage:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
    noindex: true,
  },
  {
    slug: "coastline-summer",
    title: "Coastline Village summer campaign",
    subtitle:
      "A coastal project campaign for browsing public details and sending interest.",
    organizationSlug: "northline-development-group",
    projectSlug: "coastline-village",
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
      "Beach access",
      "Serviced residences",
      "Lagoon views",
      "Family zones",
    ],
    faq: [
      {
        question: "Does this page expose private units?",
        answer: "No. It only presents information approved for public viewing.",
      },
      {
        question: "How can visitors request details?",
        answer: "They can send an interest request through the contact form.",
      },
    ],
    ctaLabel: "Request campaign details",
    seoTitle: "Coastline Village Campaign",
    seoDescription:
      "Coastal project campaign page with public project details and interest capture.",
    ogImage:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    noindex: true,
  },
];

async function resolveLanding(page: MockLandingPage): Promise<ResolvedLandingPage | null> {
  const organization = await optionalPublicLookup(() =>
    getPublicOrganizationBySlug(page.organizationSlug),
  );

  if (!organization) {
    return null;
  }

  const projectSlug = page.projectSlug;
  const project = projectSlug
    ? ((await optionalPublicLookup(() => getPublicProjectBySlug(projectSlug))) ??
      undefined)
    : undefined;

  if (projectSlug && !project) {
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

  const projectSlug = page.projectSlug;
  const project = projectSlug
    ? ((await optionalPublicLookup(() =>
      getPublicProjectForOrganization(organization.slug, projectSlug),
    )) ?? undefined)
    : undefined;

  if (projectSlug && !project) {
    return null;
  }

  return {
    ...page,
    organization,
    project,
  };
}

async function optionalPublicLookup<T>(resolver: () => Promise<T | null>) {
  try {
    return await resolver();
  } catch (error) {
    if (error instanceof PublicApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

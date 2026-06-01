import { resolvePublicOrganizationByDomain } from "@/lib/mock-public-marketplace";

export type MockDomainResolutionKind =
  | "main"
  | "popwam-subdomain"
  | "custom-domain"
  | "path-domain"
  | "unknown";

export type MockDomainResolution = {
  kind: MockDomainResolutionKind;
  input: string;
  canonicalHost: string;
  organizationSlug?: string;
  organizationName?: string;
  isDemo: boolean;
};

const mainDomains = new Set(["popwam.com", "www.popwam.com", "localhost", "127.0.0.1"]);

function normalizeDomain(input: string) {
  return input.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0];
}

export async function resolveMockDomain(input: string): Promise<MockDomainResolution> {
  const normalized = normalizeDomain(input);

  if (mainDomains.has(normalized)) {
    return {
      kind: "main",
      input,
      canonicalHost: "popwam.com",
      isDemo: false,
    };
  }

  const organization = await resolvePublicOrganizationByDomain(normalized);

  if (organization) {
    const isSubdomain = normalized.endsWith(".popwam.com");
    const isCustomDomain = normalized.includes(".");

    return {
      kind: isSubdomain
        ? "popwam-subdomain"
        : isCustomDomain
          ? "custom-domain"
          : "path-domain",
      input,
      canonicalHost: organization.customDomain ?? organization.subdomain,
      organizationSlug: organization.slug,
      organizationName: organization.name,
      isDemo: true,
    };
  }

  return {
    kind: "unknown",
    input,
    canonicalHost: normalized,
    isDemo: true,
  };
}

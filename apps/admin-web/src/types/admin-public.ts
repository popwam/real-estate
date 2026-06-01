import type { Organization } from "@/types/platform";

export type PublicLeadStatus = "NEW" | "REVIEWED" | "CONVERTED" | "SPAM";
export type DomainVerificationStatus = "PENDING" | "VERIFIED" | "FAILED";
export type OrganizationDomainType = "SUBDOMAIN" | "CUSTOM_DOMAIN";

export type PublicLeadProjectSummary = {
  id: string;
  name: string;
  slug: string;
  status: string;
  visibility: string;
};

export type PublicLead = {
  id: string;
  organizationId?: string | null;
  projectId?: string | null;
  name: string;
  phone?: string | null;
  phoneLast4?: string | null;
  email?: string | null;
  message?: string | null;
  sourcePage?: string | null;
  utm?: Record<string, unknown> | null;
  consent: boolean;
  idempotencyKey?: string | null;
  status: PublicLeadStatus;
  statusNote?: string | null;
  spamScore?: number | null;
  spamSignals?: Record<string, unknown> | null;
  sourceIpHash?: string | null;
  userAgentHash?: string | null;
  normalizedEmail?: string | null;
  consentAt?: string | null;
  createdAt: string;
  updatedAt: string;
  organization?: Organization | null;
  project?: PublicLeadProjectSummary | null;
};

export type PublicLeadStatusInput = {
  status: Extract<PublicLeadStatus, "REVIEWED" | "CONVERTED" | "SPAM">;
  note?: string;
};

export type WebsiteSettings = {
  id?: string | null;
  organizationId?: string | null;
  publicSlug: string;
  subdomain: string;
  customDomain?: string | null;
  siteTitle: string;
  siteDescription?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  whatsappUrl?: string | null;
  isPublished: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type WebsiteSettingsInput = Partial<Omit<WebsiteSettings, "id" | "organizationId" | "createdAt" | "updatedAt">>;

export type DomainVerificationInstructions = {
  txtName: string;
  txtValue: string;
};

export type OrganizationDomain = {
  id: string;
  organizationId: string;
  domain: string;
  type: OrganizationDomainType;
  status: DomainVerificationStatus;
  verificationToken: string;
  lastCheckedAt?: string | null;
  verifiedAt?: string | null;
  failureReason?: string | null;
  statusNote?: string | null;
  createdAt: string;
  updatedAt: string;
  organization?: Organization | null;
  verificationInstructions?: DomainVerificationInstructions | null;
};

export type CreateOrganizationDomainInput = {
  domain: string;
  type: OrganizationDomainType;
};

export type RejectDomainInput = {
  reason: string;
};

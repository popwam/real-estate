import type { CurrentOrganization, OrganizationStatus } from "@/types/auth";

export type OrganizationProfile = {
  id: string;
  organizationId: string;
  legalName?: string | null;
  tradeName?: string | null;
  commercialRegNumber?: string | null;
  taxNumber?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  description?: string | null;
};

export type UploadedFile = {
  id: string;
  bucket: string;
  objectKey: string;
  url?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  checksum?: string | null;
  createdAt: string;
};

export type VerificationStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED";

export type Verification = {
  id: string;
  organizationId: string;
  documentType: string;
  uploadedFileId?: string | null;
  documentUrl?: string | null;
  expiryDate?: string | null;
  status: VerificationStatus;
  verifiedById?: string | null;
  verifiedAt?: string | null;
  rejectionReason?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  organization?: Organization;
  uploadedFile?: UploadedFile | null;
  verifiedBy?: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
};

export type Organization = CurrentOrganization & {
  country?: string | null;
  city?: string | null;
  plan?: string | null;
  planExpiresAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  profile?: OrganizationProfile | null;
};

export type OrganizationReview = Organization & {
  status: OrganizationStatus;
  verifications?: Verification[];
};

export type ReviewActionInput = {
  reason?: string;
  notes?: string;
};

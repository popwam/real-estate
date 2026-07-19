import {
  ExchangeRateSourceType,
  FieldEvidenceReviewStatus,
  OrganizationDocumentType,
  OrganizationLegalForm,
  OrganizationType,
} from '@prisma/client';

export class CreateOnboardingDraftDto {
  countryCode?: string;
  supportedOrganizationTypeId?: string;
  legalForm?: OrganizationLegalForm;
  operationalData?: Record<string, unknown>;
}

export class UpdateOnboardingDraftDto extends CreateOnboardingDraftDto {}

export class UploadOnboardingDocumentDto {
  documentType?: OrganizationDocumentType;
  policyId?: string;
}

export class ReviewFieldEvidenceDto {
  action?: FieldEvidenceReviewStatus;
  finalValue?: string;
  reason?: string;
}

export class SupportedOrganizationTypeDto {
  code?: string;
  legacyOrganizationType?: OrganizationType | null;
  names?: Record<string, string>;
  descriptions?: Record<string, string>;
  iconObjectKey?: string | null;
  allowedCountryCodes?: string[];
  allowedLegalForms?: OrganizationLegalForm[];
  requiredFieldCodes?: string[];
  isIndividual?: boolean;
  isActive?: boolean;
  isArchived?: boolean;
  sortOrder?: number;
}

export class ExchangeRateDto {
  baseCurrencyCode?: string;
  quoteCurrencyCode?: string;
  rate?: number | string;
  provider?: string;
  sourceType?: ExchangeRateSourceType;
  fetchedAt?: string;
  expiresAt?: string;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

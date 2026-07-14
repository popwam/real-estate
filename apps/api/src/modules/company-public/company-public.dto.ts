import {
  DocumentExtractionProvider,
  OrganizationDocumentExtractionStatus,
  OrganizationDocumentStatus,
  OrganizationDocumentType,
  OrganizationLegalForm,
  OrganizationOwnerIdentifierType,
  OrganizationOwnerRole,
  OrganizationOwnerType,
  OrganizationOwnerVerificationStatus,
  OrganizationPublicSiteMode,
  OrganizationPublicSiteTheme,
} from '@prisma/client';

export class TranslatedTextDto {
  en?: string;
  ar?: string;
  fr?: string;
}

export class GalleryImageDto {
  url?: string;
  alt?: TranslatedTextDto;
  caption?: TranslatedTextDto;
}

export class UpdatePublicSiteDto {
  mode?: OrganizationPublicSiteMode;
  theme?: OrganizationPublicSiteTheme;
  defaultLanguage?: string;
  supportedLanguages?: string[];
  showLogo?: boolean;
  showContactInfo?: boolean;
  showOffices?: boolean;
  showGallery?: boolean;
  showProjects?: boolean;
  showLeadForm?: boolean;
  redirectUrl?: string | null;
  seoTitle?: TranslatedTextDto;
  seoDescription?: TranslatedTextDto;
  publicHeadline?: TranslatedTextDto;
  publicDescription?: TranslatedTextDto;
  galleryImages?: GalleryImageDto[];
}

export class UpdateOrganizationLegalDto {
  legalName?: string;
  tradeName?: string;
  displayName?: string;
  registrationNumber?: string;
  commercialRegisterNumber?: string;
  commercialRegisterOffice?: string;
  commercialRegisterIssuedAt?: string;
  commercialRegisterExpiresAt?: string;
  taxNumber?: string;
  vatNumber?: string;
  taxOffice?: string;
  legalForm?: OrganizationLegalForm;
  incorporationDate?: string;
  countryCode?: string;
  regionCode?: string;
  cityCode?: string;
  cityName?: string;
  addressLine1?: string;
  addressLine2?: string;
  postalCode?: string;
  preferredLanguage?: string;
  defaultCurrency?: string;
  timezone?: string;
  website?: string;
  publicEmail?: string;
  publicPhone?: string;
}

export class UpsertOrganizationOwnerDto {
  ownerType?: OrganizationOwnerType;
  name?: string;
  localizedName?: TranslatedTextDto;
  nationalityCountryCode?: string;
  identifierType?: OrganizationOwnerIdentifierType;
  identifierValue?: string;
  identifierCountryCode?: string;
  ownershipPercentage?: number;
  role?: OrganizationOwnerRole;
  phone?: string;
  email?: string;
  idFrontFileId?: string | null;
  idBackFileId?: string | null;
  passportFileId?: string | null;
  proofFileId?: string | null;
  verificationStatus?: OrganizationOwnerVerificationStatus;
}

export class UpsertOrganizationDocumentDto {
  documentType?: OrganizationDocumentType;
  fileId?: string | null;
  status?: OrganizationDocumentStatus;
  expiresAt?: string | null;
  issuedAt?: string | null;
  issuingAuthority?: string | null;
  extractedData?: Record<string, unknown> | null;
  extractionStatus?: OrganizationDocumentExtractionStatus;
  extractionProvider?: DocumentExtractionProvider;
  extractionMessage?: string | null;
}

export class ReviewOrganizationDocumentDto {
  status?: OrganizationDocumentStatus;
  note?: string;
}

export class ApplyOrganizationDocumentFieldsDto {
  fields?: string[];
  action?: 'APPLY' | 'REJECT';
  confirmSensitive?: boolean;
}

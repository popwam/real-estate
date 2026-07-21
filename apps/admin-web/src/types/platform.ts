import type { CurrentOrganization, OrganizationStatus } from "@/types/auth";
import type { OrganizationTypeCode } from "@/lib/organization-types";

export type OrganizationProfile = {
  id: string;
  organizationId: string;
  legalName?: string | null;
  tradeName?: string | null;
  displayName?: string | null;
  commercialRegNumber?: string | null;
  commercialRegisterNumber?: string | null;
  registrationNumber?: string | null;
  commercialRegisterIssuedAt?: string | null;
  commercialRegisterExpiresAt?: string | null;
  taxNumber?: string | null;
  vatNumber?: string | null;
  addressLine1?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  description?: string | null;
};

export type TranslatedText = {
  en?: string;
  ar?: string;
  fr?: string;
};

export type OrganizationPublicSiteSettings = {
  id: string;
  organizationId: string;
  mode: "DISABLED" | "PORTAL" | "GALLERY" | "REDIRECT";
  theme: "MINIMAL" | "MODERN" | "REAL_ESTATE" | "CORPORATE" | "GALLERY" | "DARK_PREMIUM";
  defaultLanguage: string;
  supportedLanguages: string[];
  showLogo: boolean;
  showContactInfo: boolean;
  showOffices: boolean;
  showGallery: boolean;
  showProjects: boolean;
  showLeadForm: boolean;
  redirectUrl?: string | null;
  seoTitle?: TranslatedText | null;
  seoDescription?: TranslatedText | null;
  publicHeadline?: TranslatedText | null;
  publicDescription?: TranslatedText | null;
  galleryImages?: Array<{ url?: string; alt?: TranslatedText; caption?: TranslatedText }> | null;
};

export type OrganizationLegal = {
  organizationId: string;
  legalName?: string | null;
  tradeName?: string | null;
  displayName?: string | null;
  registrationNumber?: string | null;
  commercialRegisterNumber?: string | null;
  commercialRegisterOffice?: string | null;
  commercialRegisterIssuedAt?: string | null;
  commercialRegisterExpiresAt?: string | null;
  taxNumber?: string | null;
  vatNumber?: string | null;
  taxOffice?: string | null;
  legalForm?: string | null;
  incorporationDate?: string | null;
  countryCode?: string | null;
  regionCode?: string | null;
  cityCode?: string | null;
  cityName?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  postalCode?: string | null;
  preferredLanguage?: string | null;
  defaultCurrency?: string | null;
  timezone?: string | null;
  website?: string | null;
  publicEmail?: string | null;
  publicPhone?: string | null;
};

export type OrganizationOwner = {
  id: string;
  organizationId: string;
  ownerType: "PERSON" | "COMPANY";
  name: string;
  localizedName?: TranslatedText | null;
  nationalityCountryCode?: string | null;
  identifierType?: string | null;
  identifierValue?: string | null;
  identifierCountryCode?: string | null;
  ownershipPercentage?: number | null;
  role: "OWNER" | "PARTNER" | "SHAREHOLDER" | "AUTHORIZED_SIGNATORY" | "LEGAL_REPRESENTATIVE";
  phone?: string | null;
  email?: string | null;
  idFrontFileId?: string | null;
  idBackFileId?: string | null;
  passportFileId?: string | null;
  proofFileId?: string | null;
  missingDocuments: boolean;
  verificationStatus: "NOT_REVIEWED" | "PENDING" | "APPROVED" | "REJECTED" | "NEEDS_MANUAL_REVIEW";
};

export type OrganizationDocument = {
  id: string;
  organizationId: string;
  documentType: "COMMERCIAL_REGISTER" | "TAX_CARD" | "VAT_CERTIFICATE" | "NATIONAL_ADDRESS" | "LICENSE" | "OWNER_ID" | "OWNER_ID_FRONT" | "OWNER_ID_BACK" | "AUTHORIZED_SIGNATORY_ID" | "INCORPORATION_DOCUMENT" | "PROOF_OF_ADDRESS" | "AUTHORIZATION_OR_POWER_OF_ATTORNEY" | "BROKERAGE_LICENSE_OR_REGISTRATION" | "CONTRACT" | "OTHER";
  fileId?: string | null;
  status: "MISSING" | "UPLOADED" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "EXPIRED";
  expiresAt?: string | null;
  issuedAt?: string | null;
  issuingAuthority?: string | null;
  extractedData?: Record<string, unknown> | null;
  extractionProvider: "NONE" | "MANUAL" | "OCR_PROVIDER" | "AI_PROVIDER";
  extractionStatus: "NOT_REQUESTED" | "PENDING" | "COMPLETED" | "FAILED" | "NEEDS_MANUAL_REVIEW";
  extractionMessage?: string | null;
};

export type OrganizationDocumentsResponse = {
  required: string[];
  documents: OrganizationDocument[];
};

export type RequiredDocumentPolicy = {
  id: string;
  countryCode: string;
  organizationType?: "PLATFORM" | "DEVELOPER" | "BROKERAGE" | "INDIVIDUAL_BROKER" | null;
  legacyOrganizationType?: "PLATFORM" | "DEVELOPER" | "BROKERAGE" | "INDIVIDUAL_BROKER" | null;
  legalForm?: string | null;
  documentType: OrganizationDocument["documentType"];
  isRequired: boolean;
  requiresExpiryDate: boolean;
  ownerDocumentRequired: boolean;
  appliesToOwnerRoles?: string[] | null;
  isActive: boolean;
  supportedOrganizationTypeId?: string | null;
  supportedOrganizationTypeCode?: string | null;
  supportedOrganizationTypeNames?: TranslatedText | null;
  requiredFieldCodes: string[];
  acceptedMimeTypes: string[];
  maxFileSizeMb: number;
  minimumConfidence?: number | string | null;
  blocksActivation: boolean;
  sortOrder: number;
  isArchived: boolean;
  notes?: string | null;
};

export type PlatformPlan = {
  id: string;
  code: string;
  name: string;
  localizedName?: TranslatedText | null;
  description?: string | null;
  priceAmount?: number | string | null;
  priceCurrency: string;
  planType: "FREE" | "TRIAL" | "PAID" | "CUSTOM";
  billingCycle: "DAY" | "MONTHLY" | "QUARTERLY" | "YEARLY" | "CUSTOM";
  durationValue: number;
  durationUnit: "DAY" | "MONTH" | "YEAR";
  allowsNoExpiry: boolean;
  trialDays: number;
  limits?: Record<string, unknown> | null;
  enabledModules: string[];
  allowedLoginMethods: string[];
  isActive: boolean;
  isArchived: boolean;
};

export type CompanyRoleTemplate = {
  id: string;
  organizationId: string;
  code: string;
  displayName: string;
  localizedName?: TranslatedText | null;
  description?: string | null;
  permissions: string[];
  isSystem: boolean;
  isActive: boolean;
  sortOrder: number;
};

export type ActivationCheck = {
  canActivate: boolean;
  missingRequirements: string[];
  blockingDocuments: string[];
  blockingOwners: string[];
  blockingSubscriptionReasons: string[];
  blockingOfficeReasons: string[];
  blockingAdminReasons: string[];
  requiredDocuments: Array<{
    documentType: string;
    ownerDocumentRequired: boolean;
    requiresExpiryDate: boolean;
  }>;
};

export type PlatformSettingsSummary = {
  sections: string[];
  domainManagementEnabled: boolean;
  domains?: {
    publicRootDomain: string;
    publicStagingRootDomain: string;
    publicWebBaseUrl: string;
    fallbackPath: string;
    wildcardEnabled: boolean;
    defaultDomainPattern?: string | null;
    stagingDomainPattern?: string | null;
  };
};

export type FirstAdminInput = {
  name: string;
  email: string;
  phoneCountry?: string;
  phone?: string;
  temporaryPassword: string;
  roleTemplate: "company_owner" | "company_admin";
};

export type OrganizationUser = {
  id: string;
  email: string;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  userRole: string;
  isActive: boolean;
  mustChangePassword: boolean;
  role?: { id: string; name: string } | null;
};

export type FirstAdminResponse = {
  user: OrganizationUser;
  activationCheck: ActivationCheck;
};

export type PlatformDashboard = {
  generatedAt: string;
  organizations: {
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    byCountry: Array<{ country: string; count: number }>;
  };
  subscriptions: {
    byStatus: Record<string, number>;
    expiringWithin30Days: number;
    planDistribution: Array<{ planCode: string; planName: string; count: number }>;
  };
  people: {
    platformUsers: number;
    companyUsers: number;
    employees: number;
    applicantsAwaitingReview: number;
    interviewsScheduled: number;
  };
  operations: {
    supportedCountries: number;
    activeOffices: number;
    attendanceIssues: number;
    unresolvedAlerts: number;
  };
  health: {
    database: { connected: boolean; migrationsReady: boolean; failedMigrations: number; unfinishedMigrations: number; pendingMigrations: number | null };
    r2: { configured: boolean };
    cloudflareExtraction: { enabled: boolean; configured: boolean };
    integrations: Record<string, string>;
  };
};

export type PlatformNavigationSection = {
  id: string;
  sectionKey: string;
  localizedTitle: { en?: string; ar?: string; fr?: string };
  sortOrder: number;
  isVisible: boolean;
  allowedItemKeys: string[];
};

export type PlatformMetadataRecord = {
  id: string;
  category: "COUNTRY" | "CURRENCY" | "LANGUAGE" | string;
  code: string;
  localizedName: { en?: string; ar?: string; fr?: string };
  configuration: Record<string, unknown>;
  sortOrder: number;
  isActive: boolean;
  isArchived: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type SupportedOrganizationType = {
  id: string;
  code: string;
  legacyOrganizationType?: "PLATFORM" | "DEVELOPER" | "BROKERAGE" | "INDIVIDUAL_BROKER" | null;
  names: TranslatedText;
  descriptions: TranslatedText;
  allowedCountryCodes: string[];
  allowedLegalForms: string[];
  requiredFieldCodes: string[];
  isIndividual: boolean;
  isActive: boolean;
  isArchived: boolean;
  sortOrder: number;
};

export type FieldEvidence = {
  id: string;
  fieldCode: string;
  rawValue?: string | null;
  normalizedValue?: string | null;
  finalValue?: string | null;
  confidence?: number | string | null;
  reviewStatus: "EXTRACTED" | "AUTO_ACCEPTED" | "REVIEW_REQUIRED" | "CONFIRMED" | "CORRECTED" | "REJECTED" | "CONFLICT";
  documentId: string;
  documentType: string;
  manuallyEdited: boolean;
};

export type OnboardingDocument = {
  id: string;
  documentType: string;
  policyId?: string | null;
  qualityStatus: string;
  qualityWarnings: string[];
  extractionStatus: string;
  fieldEvidence?: FieldEvidence[];
};

export type OrganizationOnboardingSession = {
  id: string;
  status: "DRAFT" | "DOCUMENTS_REQUIRED" | "EXTRACTION_PENDING" | "REVIEW_REQUIRED" | "READY_TO_CREATE" | "COMPLETED" | "CANCELLED" | "EXPIRED";
  countryCode: string;
  supportedOrganizationTypeId: string;
  supportedOrganizationType: SupportedOrganizationType;
  legalForm?: string | null;
  completedFields: string[];
  missingFields: string[];
  conflictFields: string[];
  documents: OnboardingDocument[];
  fieldEvidence: FieldEvidence[];
  expiresAt: string;
  organizationId?: string | null;
};

export type MetadataOption = {
  code?: string;
  value?: string;
  callingCode?: string;
  countryCode?: string;
  name?: TranslatedText;
  label?: string;
  currency?: string;
  timezones?: string[];
  dir?: string;
};

export type DomainDiagnostics = {
  codes: string[];
  fallbackLink: string;
  instructions: {
    publicRootDomain: string;
    stagingRootDomain: string;
    wildcardEnabled: boolean;
    railway: string;
    cloudflare: string;
    resourceNote: string;
  };
};

export type OrganizationSubscription = {
  id: string;
  organizationId: string;
  planCode: string;
  planName: string;
  status: "TRIAL" | "ACTIVE" | "PAST_DUE" | "EXPIRED" | "CANCELLED" | "SUSPENDED";
  startsAt?: string | null;
  endsAt?: string | null;
  trialEndsAt?: string | null;
  billingCycle: "DAY" | "MONTHLY" | "QUARTERLY" | "YEARLY" | "CUSTOM";
  autoRenew: boolean;
  notes?: string | null;
  endDateOverridden?: boolean;
  endDateOverrideReason?: string | null;
  overrideEndDate?: boolean;
  overrideReason?: string;
  noExpiry?: boolean;
};

export type OrganizationLimits = {
  id: string;
  organizationId: string;
  maxEmployees: number;
  maxOffices: number;
  maxBranches: number;
  maxWorkGroups: number;
  maxTeams: number;
  maxStorageMb: number;
  maxMonthlyCheckIns: number;
  enabledModules?: Record<string, unknown>;
  allowWebCheckIn: boolean;
  allowMobileCheckIn: boolean;
  allowPublicWebsite: boolean;
  allowCustomDomain: boolean;
  allowSubdomain: boolean;
  allowDvrReview: boolean;
  allowFaceVerification: boolean;
};

export type OrganizationOffice = {
  id: string;
  organizationId: string;
  name: string;
  code?: string | null;
  type?: string;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  timezone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  exactRadiusMeters: number;
  expandedRadiusMeters: number;
  isDefault: boolean;
  isActive: boolean;
};

export type OrganizationAttendanceLocation = {
  id: string;
  organizationId: string;
  officeId?: string | null;
  name: string;
  latitude: number;
  longitude: number;
  exactRadiusMeters: number;
  expandedRadiusMeters: number;
  allowedForWeb: boolean;
  allowedForMobile: boolean;
  requiresReviewOutsideExactRadius: boolean;
  isActive: boolean;
};

export type OrganizationWifiRule = {
  id: string;
  organizationId: string;
  officeId?: string | null;
  name: string;
  ssid?: string | null;
  bssid?: string | null;
  macAddress?: string | null;
  appliesTo: "WEB" | "MOBILE" | "BOTH";
  isRequired: boolean;
  isActive: boolean;
};

export type OrganizationDomainRecord = {
  id: string;
  organizationId: string;
  domain: string;
  type: "SUBDOMAIN" | "SYSTEM_SUBDOMAIN" | "CUSTOM_DOMAIN" | "PATH_ALIAS";
  status: "PENDING" | "ACTIVE" | "VERIFIED" | "FAILED" | "DISABLED";
  isDefault: boolean;
  verificationToken: string;
  redirectMode: "NONE" | "REDIRECT_TO_EXTERNAL" | "PROXY_OR_SHOW_COMPANY_PROFILE";
  redirectUrl?: string | null;
  inboundSourceMode: "NONE" | "TRACK_REFERRER" | "ACCEPT_LEADS" | "WEBHOOK";
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
  organizationType?: CurrentOrganization["type"];
  companyCode?: string | null;
  country?: string | null;
  city?: string | null;
  timezone?: string | null;
  currency?: string | null;
  defaultLanguage?: string | null;
  plan?: string | null;
  planName?: string | null;
  subscriptionStatus?: OrganizationSubscription["status"] | null;
  verificationStatus?: string | null;
  usersCount?: number;
  employeesCount?: number;
  officesCount?: number;
  planExpiresAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string | null;
  archivedPreviousStatus?: OrganizationStatus | null;
  profile?: OrganizationProfile | null;
  subscription?: OrganizationSubscription | null;
  limits?: OrganizationLimits | null;
  branches?: OrganizationOffice[];
  attendanceLocations?: OrganizationAttendanceLocation[];
  wifiRules?: OrganizationWifiRule[];
  domainVerifications?: OrganizationDomainRecord[];
  companyRoleTemplates?: CompanyRoleTemplate[];
  users?: OrganizationUser[];
  portalLinks?: {
    systemSubdomain: string;
    fallbackPath: string;
    defaultDomain?: string | null;
    wildcardDnsRequired: boolean;
  };
};

export type OrganizationDeletionImpact = {
  organization: Pick<Organization, "id" | "name" | "type" | "status">;
  counts: Record<string, number>;
  canPermanentlyDeleteDraft: boolean;
  blockers: Array<{ key: string; count: number }>;
};

export type OrganizationReview = Organization & {
  status: OrganizationStatus;
  verifications?: Verification[];
};

export type ReviewActionInput = {
  reason?: string;
  notes?: string;
};

export type PlatformOrganizationInput = {
  name: string;
  organizationType?: OrganizationTypeCode;
  type?: OrganizationTypeCode;
  displayName?: string;
  legalName?: string;
  tradeName?: string;
  responsibleSubmitterName?: string;
  responsibleSubmitterEmail?: string;
  responsibleSubmitterPhone?: string;
  logoUrl?: string;
  companyCode?: string;
  slug?: string;
  country?: string;
  countryCode?: string;
  city?: string;
  timezone?: string;
  currency?: string;
  defaultCurrency?: string;
  defaultLanguage?: string;
  preferredLanguage?: string;
  registrationNumber?: string;
  commercialRegisterNumber?: string;
  taxNumber?: string;
  vatNumber?: string;
  businessEmail?: string;
  businessPhone?: string;
  address?: string;
  website?: string;
  status?: string;
  subscription?: Partial<OrganizationSubscription>;
  limits?: Partial<OrganizationLimits>;
  offices?: Partial<OrganizationOffice>[];
  attendanceLocations?: Partial<OrganizationAttendanceLocation>[];
  wifiRules?: Partial<OrganizationWifiRule>[];
  domains?: Partial<OrganizationDomainRecord>[];
  webWifiPolicy?: "BLOCK" | "MANUAL_REVIEW" | "IGNORE_FOR_WEB";
  adminUser?: {
    name?: string;
    email?: string;
    phoneCountry?: string;
    phone?: string;
    temporaryPassword?: string;
    roleTemplate?: "company_owner" | "company_admin" | "hr_manager";
  };
};

export type OrganizationInvitation = {
  id: string;
  organizationId: string;
  email: string;
  intendedRole: string;
  status: "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";
  expiresAt: string;
  acceptedAt?: string | null;
  createdAt: string;
  inviteUrl?: string;
  delivery?: "MANUAL_LINK";
};

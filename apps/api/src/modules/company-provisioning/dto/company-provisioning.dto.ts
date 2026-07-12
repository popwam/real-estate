import {
  DomainVerificationStatus,
  OrganizationBillingCycle,
  OrganizationBranchType,
  OrganizationDomainType,
  OrganizationInboundSourceMode,
  OrganizationRedirectMode,
  OrganizationDocumentType,
  OrganizationLegalForm,
  OrganizationSubscriptionStatus,
  OrganizationType,
  OrganizationWifiRuleAppliesTo,
  WebWifiPolicy,
} from '@prisma/client';

export class OrganizationProfileInputDto {
  organizationType?: OrganizationType;
  type?: OrganizationType;
  legalName?: string;
  tradeName?: string;
  displayName?: string;
  name?: string;
  companyCode?: string;
  slug?: string;
  logoUrl?: string;
  country?: string;
  city?: string;
  timezone?: string;
  currency?: string;
  defaultLanguage?: string;
  registrationNumber?: string;
  commercialRegisterNumber?: string;
  commercialRegisterOffice?: string;
  commercialRegisterIssuedAt?: string;
  commercialRegisterExpiresAt?: string;
  taxNumber?: string;
  vatNumber?: string;
  taxOffice?: string;
  legalForm?: string;
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
  publicEmail?: string;
  publicPhone?: string;
  businessEmail?: string;
  businessPhone?: string;
  address?: string;
  website?: string;
  status?: string;
}

export class SubscriptionInputDto {
  planCode?: string;
  planName?: string;
  status?: OrganizationSubscriptionStatus;
  startsAt?: string;
  endsAt?: string;
  trialEndsAt?: string;
  billingCycle?: OrganizationBillingCycle;
  autoRenew?: boolean;
  notes?: string;
}

export class LimitsInputDto {
  maxEmployees?: number;
  maxOffices?: number;
  maxBranches?: number;
  maxWorkGroups?: number;
  maxTeams?: number;
  maxStorageMb?: number;
  maxMonthlyCheckIns?: number;
  enabledModules?: string[];
  allowWebCheckIn?: boolean;
  allowMobileCheckIn?: boolean;
  allowPublicWebsite?: boolean;
  allowCustomDomain?: boolean;
  allowSubdomain?: boolean;
  allowDvrReview?: boolean;
  allowFaceVerification?: boolean;
}

export class OfficeInputDto {
  name?: string;
  code?: string;
  type?: OrganizationBranchType;
  address?: string;
  city?: string;
  country?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  exactRadiusMeters?: number;
  expandedRadiusMeters?: number;
  isDefault?: boolean;
  isActive?: boolean;
}

export class AttendanceLocationInputDto {
  officeId?: string;
  name?: string;
  latitude?: number;
  longitude?: number;
  exactRadiusMeters?: number;
  expandedRadiusMeters?: number;
  allowedForWeb?: boolean;
  allowedForMobile?: boolean;
  requiresReviewOutsideExactRadius?: boolean;
  isActive?: boolean;
}

export class WifiRuleInputDto {
  officeId?: string;
  name?: string;
  ssid?: string;
  bssid?: string;
  macAddress?: string;
  description?: string;
  appliesTo?: OrganizationWifiRuleAppliesTo;
  isRequired?: boolean;
  isActive?: boolean;
}

export class DomainInputDto {
  domain?: string;
  type?: OrganizationDomainType;
  isDefault?: boolean;
  status?: DomainVerificationStatus;
  redirectMode?: OrganizationRedirectMode;
  redirectUrl?: string;
  inboundSourceMode?: OrganizationInboundSourceMode;
}

export class FirstAdminInputDto {
  name?: string;
  email?: string;
  phoneCountry?: string;
  phone?: string;
  temporaryPassword?: string;
  roleTemplate?: 'company_owner' | 'company_admin' | 'hr_manager';
}

export class CreatePlatformCompanyDto extends OrganizationProfileInputDto {
  profile?: OrganizationProfileInputDto;
  subscription?: SubscriptionInputDto;
  limits?: LimitsInputDto;
  offices?: OfficeInputDto[];
  attendanceLocations?: AttendanceLocationInputDto[];
  wifiRules?: WifiRuleInputDto[];
  domains?: DomainInputDto[];
  adminUser?: FirstAdminInputDto;
  webWifiPolicy?: WebWifiPolicy;
}

export class ActivationReviewDto {
  reason?: string;
  notes?: string;
}

export class RequiredDocumentPolicyInputDto {
  countryCode?: string;
  organizationType?: OrganizationType;
  legalForm?: OrganizationLegalForm | null;
  documentType?: OrganizationDocumentType;
  isRequired?: boolean;
  requiresExpiryDate?: boolean;
  ownerDocumentRequired?: boolean;
  appliesToOwnerRoles?: string[];
  isActive?: boolean;
  notes?: string;
}

export class PlatformPlanInputDto {
  code?: string;
  name?: string;
  localizedName?: Record<string, unknown>;
  description?: string;
  priceAmount?: number;
  priceCurrency?: string;
  billingCycle?: OrganizationBillingCycle;
  trialDays?: number;
  limits?: Record<string, unknown>;
  enabledModules?: Record<string, unknown>;
  isActive?: boolean;
  isArchived?: boolean;
}

export class CompanyRoleTemplateInputDto {
  code?: string;
  displayName?: string;
  localizedName?: Record<string, unknown>;
  description?: string;
  permissions?: string[];
  isSystem?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

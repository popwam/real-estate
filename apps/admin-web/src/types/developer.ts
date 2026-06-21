import type { Organization } from "@/types/platform";

export type ProjectStatus = "DRAFT" | "ACTIVE" | "SOLD_OUT" | "SUSPENDED" | "ARCHIVED";
export type ProjectVisibility =
  | "PRIVATE"
  | "APPROVED_BROKERAGES"
  | "OPEN_MARKETPLACE"
  | "SELECTED_BROKERS"
  | "HIDDEN";
export type ProjectType = "COMPOUND" | "BUILDING" | "TOWER" | "VILLA_COMPOUND" | "COMMERCIAL" | "MIXED_USE";
export type ProjectSellingMode = "OWNER_ONLY" | "AUTHORIZED_BROKERS" | "OPEN_BROKERAGE";

export type UnitStatus = "AVAILABLE" | "RESERVED" | "SOLD" | "HELD" | "UNAVAILABLE";
export type UnitType = "APARTMENT" | "VILLA" | "TOWNHOUSE" | "OFFICE" | "SHOP" | "STUDIO" | "LAND" | "CHALET";
export type UnitVisibility =
  | "INHERIT_PROJECT"
  | "PRIVATE"
  | "APPROVED_BROKERAGES"
  | "OPEN_MARKETPLACE"
  | "SELECTED_BROKERS"
  | "HIDDEN";
export type UnitFinishing = "CORE_SHELL" | "SEMI_FINISHED" | "FULLY_FINISHED" | "FURNISHED";

export type PaymentPlanScope = "PROJECT" | "UNIT";
export type AgreementStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "TERMINATED";
export type BrokerAccessGranteeType = "BROKERAGE" | "BROKER";
export type BrokerAccessLevel = "VIEW" | "VIEW_PRICE" | "FULL";

export type Project = {
  id: string;
  developerId: string;
  name: string;
  slug: string;
  type: ProjectType;
  status: ProjectStatus;
  city?: string | null;
  district?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  address?: string | null;
  deliveryDate?: string | null;
  description?: string | null;
  visibility: ProjectVisibility;
  sellingMode: ProjectSellingMode;
  isFeatured?: boolean;
  createdAt: string;
  updatedAt: string;
  developer?: Organization;
  phases?: ProjectPhase[];
  paymentPlans?: PaymentPlan[];
  _count?: { inventoryUnits?: number };
  brokerAuthorizations?: ProjectBrokerAuthorization[];
};

export type ProjectBrokerAuthorization = {
  id: string;
  projectId: string;
  organizationId?: string | null;
  brokerUserId?: string | null;
  status: "ACTIVE" | "SUSPENDED" | "REVOKED";
  organization?: { id: string; name: string; slug: string; type: string } | null;
  brokerUser?: { id: string; firstName?: string | null; lastName?: string | null; email?: string | null } | null;
};

export type ProjectPhase = {
  id: string;
  projectId: string;
  name: string;
  deliveryDate?: string | null;
  totalUnits?: number | null;
  availableUnits?: number | null;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
};

export type InventoryUnit = {
  id: string;
  projectId: string;
  phaseId?: string | null;
  developerId: string;
  unitNumber: string;
  unitType: UnitType;
  floor?: string | null;
  areaSqm?: string | number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  finishing?: UnitFinishing | null;
  view?: string | null;
  basePrice?: string | number | null;
  currency?: string | null;
  pricePerSqm?: string | number | null;
  status: UnitStatus;
  visibility: UnitVisibility;
  floorPlanUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  project?: Project;
  phase?: ProjectPhase | null;
};

export type PaymentPlan = {
  id: string;
  projectId: string;
  unitId?: string | null;
  scope: PaymentPlanScope;
  name: string;
  downPaymentPct?: string | number | null;
  installmentMonths?: number | null;
  installmentPct?: string | number | null;
  onDeliveryPct?: string | number | null;
  maintenanceFee?: string | number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  unit?: InventoryUnit | null;
};

export type DeveloperAgreement = {
  id: string;
  developerId: string;
  brokerageId: string;
  status: AgreementStatus;
  signedAt?: string | null;
  expiresAt?: string | null;
  termsUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  developer?: Organization;
  brokerage?: Organization;
};

export type BrokerAccessRule = {
  id: string;
  projectId: string;
  developerId: string;
  granteeType: BrokerAccessGranteeType;
  granteeId: string;
  accessLevel: BrokerAccessLevel;
  grantedAt: string;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  project?: Project;
  developer?: Organization;
};

export type ProjectInput = Partial<Project> & {
  name?: string;
  type?: ProjectType;
};

export type ProjectPhaseInput = Partial<ProjectPhase>;
export type InventoryUnitInput = Partial<InventoryUnit>;
export type PaymentPlanInput = Partial<PaymentPlan>;
export type AgreementInput = { brokerageId: string; expiresAt?: string | null; termsUrl?: string };
export type BrokerAccessRuleInput = {
  projectId: string;
  granteeType: BrokerAccessGranteeType;
  granteeId: string;
  accessLevel: BrokerAccessLevel;
  expiresAt?: string | null;
};

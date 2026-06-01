export type OrganizationType =
  | "PLATFORM"
  | "DEVELOPER"
  | "BROKERAGE"
  | "INDIVIDUAL_BROKER";

export type OrganizationStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "SUSPENDED"
  | "REVOKED";

export type UserRole =
  | "platform_owner"
  | "platform_admin"
  | "platform_support"
  | "platform_auditor"
  | "developer_owner"
  | "developer_admin"
  | "developer_sales_manager"
  | "developer_sales_agent"
  | "brokerage_owner"
  | "brokerage_admin"
  | "broker"
  | "individual_broker"
  | "client";

export type CurrentUser = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  role: UserRole;
};

export type CurrentOrganization = {
  id: string;
  name: string;
  slug?: string | null;
  type: OrganizationType;
  status: OrganizationStatus;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: CurrentUser;
  organization: CurrentOrganization | null;
  permissions: string[];
};

export type MeResponse = {
  user: CurrentUser;
  organization: CurrentOrganization | null;
  permissions: string[];
};

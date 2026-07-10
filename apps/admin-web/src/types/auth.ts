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
  | "client"
  | "company_admin"
  | "hr_manager"
  | "hr_employee"
  | "sales_manager"
  | "sales_agent"
  | "finance_user"
  | "employee_self_service";

export type CurrentUser = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  role: UserRole;
  mustChangePassword: boolean;
};

export type CurrentOrganization = {
  id: string;
  name: string;
  slug?: string | null;
  type: OrganizationType;
  status: OrganizationStatus;
  country?: string | null;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: CurrentUser;
  organization: CurrentOrganization | null;
  permissions: string[];
  hrEmployee?: HrEmployeeSummary | null;
};

export type MeResponse = {
  user: CurrentUser;
  organization: CurrentOrganization | null;
  permissions: string[];
  hrEmployee?: HrEmployeeSummary | null;
};

export type HrEmployeeSummary = {
  id: string;
  status: string;
  attendanceEnabled: boolean;
};

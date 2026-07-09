export interface AuthUserSummaryDto {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: string;
}

export interface AuthOrganizationSummaryDto {
  id: string | null;
  name: string | null;
  slug: string | null;
  type: string | null;
  status: string | null;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: AuthUserSummaryDto;
  organization: AuthOrganizationSummaryDto;
  permissions: string[];
  hrEmployee?: AuthHrEmployeeSummaryDto | null;
}

export interface CurrentUserResponseDto {
  user: AuthUserSummaryDto;
  organization: AuthOrganizationSummaryDto;
  permissions: string[];
  hrEmployee?: AuthHrEmployeeSummaryDto | null;
}

export interface AuthHrEmployeeSummaryDto {
  id: string;
  status: string;
  attendanceEnabled: boolean;
}

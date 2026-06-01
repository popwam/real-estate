export const ACCESS_TOKEN_KIND = 'access';
export const REFRESH_TOKEN_KIND = 'refresh';

export const OWNER_ROLE_BY_ORGANIZATION_TYPE = {
  PLATFORM: 'PLATFORM_OWNER',
  DEVELOPER: 'DEVELOPER_OWNER',
  BROKERAGE: 'BROKERAGE_OWNER',
  INDIVIDUAL_BROKER: 'INDIVIDUAL_BROKER',
} as const;

export const ROLE_NAME_BY_USER_ROLE = {
  PLATFORM_OWNER: 'platform_owner',
  PLATFORM_ADMIN: 'platform_admin',
  PLATFORM_SUPPORT: 'platform_support',
  PLATFORM_AUDITOR: 'platform_auditor',
  DEVELOPER_OWNER: 'developer_owner',
  DEVELOPER_ADMIN: 'developer_admin',
  DEVELOPER_SALES_MANAGER: 'developer_sales_manager',
  DEVELOPER_SALES_AGENT: 'developer_sales_agent',
  BROKERAGE_OWNER: 'brokerage_owner',
  BROKERAGE_ADMIN: 'brokerage_admin',
  BROKER: 'broker',
  INDIVIDUAL_BROKER: 'individual_broker',
  CLIENT: 'client',
} as const;

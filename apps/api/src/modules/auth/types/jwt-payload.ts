export interface JwtPayload {
  userId: string;
  organizationId: string | null;
  organizationType: string | null;
  role: string;
  permissions: string[];
  tokenKind: 'access' | 'refresh';
  jti?: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequestUser {
  userId: string;
  organizationId: string | null;
  organizationType: string | null;
  role: string;
  permissions: string[];
}

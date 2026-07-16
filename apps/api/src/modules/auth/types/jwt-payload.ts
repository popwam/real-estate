export interface JwtPayload {
  userId: string;
  organizationId: string | null;
  organizationType: string | null;
  role: string;
  permissions: string[];
  mustChangePassword?: boolean;
  accessVersion?: string;
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
  mustChangePassword?: boolean;
  accessVersion?: string;
  session?: {
    user: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      phone: string | null;
      role: string;
      mustChangePassword: boolean;
    };
    organization: {
      id: string | null;
      name: string | null;
      slug: string | null;
      type: string | null;
      status: string | null;
      country: string | null;
    };
    permissions: string[];
    hrEmployee?: {
      id: string;
      status: string;
      attendanceEnabled: boolean;
    } | null;
    accessVersion: string;
  };
}

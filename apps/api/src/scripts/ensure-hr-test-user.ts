import { PrismaPg } from '@prisma/adapter-pg';
import {
  HrEmployeeStatus,
  OrganizationStatus,
  OrganizationType,
  PrismaClient,
  UserRole,
} from '@prisma/client';
import { HashService } from '../modules/auth/hash.service';
import { ROLE_PERMISSIONS } from '../modules/permissions/rbac.seed';

const TEST_ROLE_NAME = 'developer_owner';
const TEST_USER_ROLE = UserRole.DEVELOPER_OWNER;

type RequiredEnv = {
  DATABASE_URL?: string;
  STAGING_HR_TEST_IDENTIFIER?: string;
  STAGING_HR_TEST_PASSWORD?: string;
  STAGING_TEST_ORGANIZATION_ID?: string;
  STAGING_ATTENDANCE_LATITUDE?: string;
  STAGING_ATTENDANCE_LONGITUDE?: string;
  STAGING_ATTENDANCE_RADIUS_METERS?: string;
  STAGING_ATTENDANCE_WIFI_SSID?: string;
  STAGING_ATTENDANCE_WIFI_BSSID?: string;
};

export function validateEnsureHrTestUserEnv(env: RequiredEnv) {
  const missing: string[] = [];
  if (!env.DATABASE_URL?.trim()) missing.push('DATABASE_URL');
  if (!env.STAGING_HR_TEST_IDENTIFIER?.trim()) {
    missing.push('STAGING_HR_TEST_IDENTIFIER');
  }
  if (!env.STAGING_HR_TEST_PASSWORD?.trim()) {
    missing.push('STAGING_HR_TEST_PASSWORD');
  }
  return missing;
}

export function attendancePolicyFromEnv(env: RequiredEnv) {
  const latitude = optionalNumber(env.STAGING_ATTENDANCE_LATITUDE);
  const longitude = optionalNumber(env.STAGING_ATTENDANCE_LONGITUDE);
  const radius = optionalInteger(env.STAGING_ATTENDANCE_RADIUS_METERS) ?? 100;
  const ssid = optionalString(env.STAGING_ATTENDANCE_WIFI_SSID);
  const bssid = normalizeBssid(env.STAGING_ATTENDANCE_WIFI_BSSID);
  const hasLocation = latitude !== undefined && longitude !== undefined;
  const hasWifi = Boolean(ssid || bssid);

  return {
    requireLocation: hasLocation,
    allowedLatitude: hasLocation ? latitude : null,
    allowedLongitude: hasLocation ? longitude : null,
    allowedRadiusMeters: hasLocation ? radius : null,
    requireWifi: hasWifi,
    allowedWifiSsids: ssid ? [ssid] : [],
    allowedWifiBssids: bssid ? [bssid] : [],
    blockDeveloperOptions: true,
    blockUsbDebugging: true,
    requirePhoto: true,
    requireDvrReview: false,
  };
}

async function main() {
  const missing = validateEnsureHrTestUserEnv(process.env);
  if (missing.length) {
    console.error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
    process.exitCode = 1;
    return;
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });
  const hashService = new HashService();

  try {
    const email = identifier(process.env).toLowerCase();
    const organization = await resolveOrganization(prisma, process.env);
    const role = await ensureRole(prisma, organization.id);
    const passwordHash = await hashService.hash(
      process.env.STAGING_HR_TEST_PASSWORD!,
    );
    const user = await prisma.user.upsert({
      where: { email },
      create: {
        organizationId: organization.id,
        roleId: role.id,
        email,
        passwordHash,
        firstName: 'KH',
        lastName: 'Staging HR Test',
        userRole: TEST_USER_ROLE,
        isActive: true,
      },
      update: {
        organizationId: organization.id,
        roleId: role.id,
        passwordHash,
        userRole: TEST_USER_ROLE,
        isActive: true,
      },
    });

    const employee = await prisma.hrEmployee.upsert({
      where: { userId: user.id },
      create: {
        organizationId: organization.id,
        userId: user.id,
        name: 'KH Staging HR Test',
        email,
        roleTitle: 'HR attendance test user',
        status: HrEmployeeStatus.ACTIVE,
      },
      update: {
        organizationId: organization.id,
        email,
        status: HrEmployeeStatus.ACTIVE,
      },
    });

    const policy = attendancePolicyFromEnv(process.env);
    const attendanceSettings =
      await prisma.organizationAttendanceSettings.upsert({
        where: { organizationId: organization.id },
        create: {
          organizationId: organization.id,
          ...policy,
        },
        update: policy,
      });

    const permissionCount = await prisma.rolePermission.count({
      where: { roleId: role.id },
    });

    console.log(
      JSON.stringify(
        {
          user: 'found_or_created',
          email,
          employee: 'linked',
          employeeId: employee.id,
          organization: {
            id: organization.id,
            name: organization.name,
            type: organization.type,
            status: organization.status,
          },
          role: role.name,
          permissionsCount: permissionCount,
          attendanceSettings: {
            requireLocation: attendanceSettings.requireLocation,
            requireWifi: attendanceSettings.requireWifi,
            blockDeveloperOptions: attendanceSettings.blockDeveloperOptions,
            blockUsbDebugging: attendanceSettings.blockUsbDebugging,
            requirePhoto: attendanceSettings.requirePhoto,
            requireDvrReview: attendanceSettings.requireDvrReview,
          },
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function resolveOrganization(prisma: PrismaClient, env: RequiredEnv) {
  const organizationId = optionalString(env.STAGING_TEST_ORGANIZATION_ID);
  if (organizationId) {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!organization) {
      throw new Error('STAGING_TEST_ORGANIZATION_ID was not found.');
    }
    assertDeveloperOrganization(organization);
    return organization;
  }

  const organizations = await prisma.organization.findMany({
    where: {
      type: OrganizationType.DEVELOPER,
      status: {
        notIn: [OrganizationStatus.SUSPENDED, OrganizationStatus.REVOKED],
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (organizations.length === 1) return organizations[0];

  if (!organizations.length) {
    throw new Error('No active developer organization found for HR test user.');
  }

  console.error(
    JSON.stringify(
      {
        error:
          'Multiple developer organizations found. Set STAGING_TEST_ORGANIZATION_ID.',
        organizations: organizations.map((organization) => ({
          id: organization.id,
          name: organization.name,
          type: organization.type,
          status: organization.status,
        })),
      },
      null,
      2,
    ),
  );
  throw new Error('STAGING_TEST_ORGANIZATION_ID is required.');
}

async function ensureRole(prisma: PrismaClient, organizationId: string) {
  const role = await prisma.role.upsert({
    where: {
      organizationId_name: {
        organizationId,
        name: TEST_ROLE_NAME,
      },
    },
    create: {
      organizationId,
      name: TEST_ROLE_NAME,
      isSystem: true,
      description: 'Staging HR test role with developer owner permissions.',
    },
    update: {
      isSystem: true,
      description: 'Staging HR test role with developer owner permissions.',
    },
  });

  for (const permissionKey of ROLE_PERMISSIONS[TEST_ROLE_NAME] ?? []) {
    const permission = await prisma.permission.upsert({
      where: { key: permissionKey },
      create: {
        key: permissionKey,
        description: `Base permission: ${permissionKey}`,
      },
      update: {},
    });
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: permission.id,
        },
      },
      create: {
        roleId: role.id,
        permissionId: permission.id,
      },
      update: {},
    });
  }

  return role;
}

function assertDeveloperOrganization(organization: {
  type: OrganizationType;
  status: OrganizationStatus;
}) {
  if (organization.type !== OrganizationType.DEVELOPER) {
    throw new Error('Selected organization must be a DEVELOPER organization.');
  }
  if (
    organization.status === OrganizationStatus.SUSPENDED ||
    organization.status === OrganizationStatus.REVOKED
  ) {
    throw new Error('Selected organization cannot be suspended or revoked.');
  }
}

function identifier(env: RequiredEnv) {
  return optionalString(env.STAGING_HR_TEST_IDENTIFIER)!;
}

function optionalString(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function optionalNumber(value: string | undefined) {
  const trimmed = optionalString(value);
  if (!trimmed) return undefined;
  const number = Number(trimmed);
  if (!Number.isFinite(number)) {
    throw new Error('Attendance latitude/longitude must be valid numbers.');
  }
  return number;
}

function optionalInteger(value: string | undefined) {
  const trimmed = optionalString(value);
  if (!trimmed) return undefined;
  const number = Number(trimmed);
  if (!Number.isInteger(number) || number <= 0) {
    throw new Error('Attendance radius must be a positive integer.');
  }
  return number;
}

function normalizeBssid(value: string | undefined) {
  return optionalString(value)?.toLowerCase();
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}

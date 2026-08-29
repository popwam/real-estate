import { loadEnvironment } from '../config/load-environment';
import { EnvService } from '../config/env.service';
import { buildAccessVersion } from '../modules/auth/access-version';
import { JwtService } from '../modules/auth/jwt.service';
import { PrismaService } from '../modules/database/prisma.service';

const managementPermissions = ['hr.view', 'hr.attendance.manage'];
const exportPermissions = [
  'hr.attendance.export',
  'hr.manage',
  'exports.organization_data',
  'exports.platform_data',
];

loadEnvironment();

async function main() {
  const env = new EnvService();
  const prisma = new PrismaService(env);

  try {
    const employees = await prisma.hrEmployee.findMany({
      where: {
        status: 'ACTIVE',
        loginEnabled: true,
        userId: { not: null },
      },
      include: {
        user: {
          include: {
            organization: { include: { subscription: true } },
            hrEmployeeProfile: true,
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });
    const employee = employees.find((candidate) => {
      const user = candidate.user;
      if (!user?.isActive || user.mustChangePassword || !user.organization) {
        return false;
      }
      const permissions =
        user.role?.permissions.map((item) => item.permission.key) ?? [];
      return (
        managementPermissions.some((permission) =>
          permissions.includes(permission),
        ) &&
        exportPermissions.some((permission) => permissions.includes(permission))
      );
    });
    if (!employee?.user?.organization) {
      throw new Error(
        'No active employee has the required attendance permissions.',
      );
    }

    const user = employee.user;
    const organization = user.organization;
    if (!organization)
      throw new Error('Selected employee has no organization.');
    const permissions =
      user.role?.permissions.map((item) => item.permission.key) ?? [];
    const role = user.role?.name ?? user.userRole.toLowerCase();
    const token = new JwtService(env).signAccessToken({
      userId: user.id,
      organizationId: user.organizationId,
      organizationType: organization.type,
      role,
      permissions,
      mustChangePassword: false,
      accessVersion: buildAccessVersion(user),
    });
    const apiUrl = `https://${process.env.RAILWAY_PUBLIC_DOMAIN ?? 'api-staging.popwam.com'}`;
    const paths = [
      '/hr/attendance',
      '/hr/attendance/me/today',
      '/hr/attendance/me/history',
      '/hr/attendance/me/policy',
      '/hr/export/attendance?date=2026-08-29&dateFrom=2026-08-29&dateTo=2026-08-29&format=csv',
    ];
    const results: Array<{
      path: string;
      status: number;
      passed: boolean;
      schemaError: boolean;
      contentType: string | null;
      responseBytes: number;
    }> = [];

    for (const path of paths) {
      const response = await fetch(`${apiUrl}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await response.text();
      const schemaError = /P2022|column .* does not exist/i.test(body);
      results.push({
        path,
        status: response.status,
        passed: response.ok && !schemaError,
        schemaError,
        contentType: response.headers.get('content-type'),
        responseBytes: Buffer.byteLength(body),
      });
    }

    process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
    if (results.some((result) => !result.passed)) process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();

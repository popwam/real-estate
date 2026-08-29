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
      '/hr/attendance/monthly?month=2026-08',
      '/hr/export/attendance?dateFrom=2026-08-01&dateTo=2026-08-31&format=csv',
    ];
    const results: Array<{
      path: string;
      status: number;
      passed: boolean;
      schemaError: boolean;
      contentType: string | null;
      responseBytes: number;
      monthlyContract?: boolean;
    }> = [];

    for (const path of paths) {
      const response = await fetch(`${apiUrl}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await response.text();
      const schemaError = /P2022|column .* does not exist/i.test(body);
      const monthlyContract = path.includes('/monthly?')
        ? validatesMonthlyMatrix(body, 31)
        : path.includes('/hr/export/attendance')
          ? validatesMonthlyCsv(body, '2026-08-01', '2026-08-31')
          : undefined;
      results.push({
        path,
        status: response.status,
        passed: response.ok && !schemaError && monthlyContract !== false,
        schemaError,
        contentType: response.headers.get('content-type'),
        responseBytes: Buffer.byteLength(body),
        monthlyContract,
      });
    }

    process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
    if (results.some((result) => !result.passed)) process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

function validatesMonthlyMatrix(body: string, expectedDays: number) {
  try {
    const value = JSON.parse(body) as {
      days?: unknown[];
      employees?: Array<{ employeeName?: unknown; days?: unknown[] }>;
    };
    return (
      value.days?.length === expectedDays &&
      Array.isArray(value.employees) &&
      value.employees.every(
        (employee) =>
          typeof employee.employeeName === 'string' &&
          employee.employeeName.trim().length > 0 &&
          employee.days?.length === expectedDays,
      )
    );
  } catch {
    return false;
  }
}

function validatesMonthlyCsv(body: string, firstDay: string, lastDay: string) {
  const header = body.split(/\r?\n/, 1)[0] ?? '';
  return (
    header.includes('employeeName') &&
    body.includes(firstDay) &&
    body.includes(lastDay)
  );
}

void main();

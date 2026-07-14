import { PrismaPg } from '@prisma/adapter-pg';
import { NestFactory } from '@nestjs/core';
import { PrismaClient } from '@prisma/client';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { AppModule } from '../app.module';
import { AppService } from '../app.service';
import { loadEnvironment } from '../config/load-environment';
import { AuthService } from '../modules/auth/auth.service';
import { CompanyProvisioningService } from '../modules/company-provisioning/company-provisioning.service';
import { CrmLeadsService } from '../modules/crm/crm-leads.service';
import { HrRecruitmentService } from '../modules/hr/hr-recruitment.service';
import { HrService } from '../modules/hr/hr.service';
import { OperationsService } from '../modules/operations/operations.service';
import { OrganizationsService } from '../modules/organizations/organizations.service';
import { BASE_PERMISSIONS } from '../modules/permissions/rbac.seed';
import { RealEstateService } from '../modules/real-estate/real-estate.service';
import { UserPreferencesService } from '../modules/user-preferences/user-preferences.service';
import { inspectEnvironment } from './environment-check';

type Check = { label: string; ok: boolean; detail?: string };

export async function runPlatformDoctor() {
  loadEnvironment();
  const checks: Check[] = [];
  const environment = inspectEnvironment();
  for (const line of environment.lines) console.log(line);
  checks.push({ label: 'Environment', ok: environment.ok });

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || !/^postgres(?:ql)?:\/\//i.test(databaseUrl)) {
    printCheck({ label: 'Database connection', ok: false, detail: 'DATABASE_URL unavailable' });
    console.log('Overall readiness: NO-GO');
    return false;
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });
  let databaseConnected = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    databaseConnected = true;
    checks.push({ label: 'Database connection', ok: true });
  } catch (error) {
    checks.push({
      label: 'Database connection',
      ok: false,
      detail: safeError(error),
    });
  }

  if (databaseConnected) {
    try {
      await databaseChecks(prisma, checks);
    } catch (error) {
      checks.push({
        label: 'Database readiness checks',
        ok: false,
        detail: safeError(error),
      });
    }
  } else {
    for (const label of [
      'Migrations',
      'Required database structures',
      'Platform organization',
      'Platform owner',
      'Platform owner organization link',
      'Active role assignment',
      'Platform permissions',
      'RBAC',
      'Plan catalog',
      'Verification policies',
      'Organizations query',
      'Employee creation dependencies',
      'Attendance policy foundation',
      'Recruitment intake foundation',
    ]) checks.push({ label, ok: false, detail: 'database unavailable' });
  }

  await applicationChecks(checks);
  for (const check of checks) printCheck(check);
  const ok = checks.every((check) => check.ok);
  console.log(`Overall readiness: ${ok ? 'GO' : 'NO-GO'}`);
  await prisma.$disconnect();
  return ok;
}

async function databaseChecks(prisma: PrismaClient, checks: Check[]) {
  type MigrationRow = { migration_name: string; finished_at: Date | null; rolled_back_at: Date | null };
  let applied: MigrationRow[] = [];
  try {
    applied = await prisma.$queryRaw<MigrationRow[]>`
      SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations"
    `;
  } catch {
    applied = [];
  }
  const migrationPath = resolve(__dirname, '..', '..', 'prisma', 'migrations');
  const expected = readdirSync(migrationPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  const completed = new Set(
    applied.filter((row) => row.finished_at && !row.rolled_back_at).map((row) => row.migration_name),
  );
  const pending = expected.filter((name) => !completed.has(name));
  const failed = applied.filter((row) => !row.finished_at && !row.rolled_back_at);
  checks.push({
    label: 'Migrations',
    ok: pending.length === 0 && failed.length === 0,
    detail: pending.length || failed.length
      ? `${pending.length} pending, ${failed.length} failed`
      : 'current',
  });

  const requiredTables = [
    'organizations', 'users', 'roles', 'permissions', 'role_permissions',
    'platform_plans', 'required_document_policies', 'organization_documents',
    'platform_navigation_configurations', 'platform_metadata_records',
    'hr_employees', 'hr_attendance_records', 'organization_attendance_settings',
    'hr_applicants', 'hr_applicant_documents', 'hr_applicant_interviews',
  ];
  const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
  `;
  const tableSet = new Set(tables.map((table) => table.table_name));
  const missingTables = requiredTables.filter((table) => !tableSet.has(table));
  const requiredColumns: Record<string, string[]> = {
    organizations: ['id', 'type', 'status', 'slug', 'archivedAt', 'companySetupCompletedAt', 'enabledLoginMethods'],
    users: ['id', 'organizationId', 'roleId', 'isActive'],
    hr_employees: ['id', 'organizationId', 'userId', 'status', 'loginEnabled'],
    hr_attendance_records: ['organizationId', 'employeeId', 'checkInAt', 'checkOutAt', 'verificationStatus'],
    hr_applicants: ['organizationId', 'status', 'convertedEmployeeId'],
    organization_documents: ['organizationId', 'fileId', 'status', 'extractionStatus', 'extractedData'],
    platform_plans: ['planType', 'durationValue', 'durationUnit', 'allowedLoginMethods'],
    organization_subscriptions: ['endDateOverridden', 'endDateOverrideReason'],
    user_navigation_preferences: ['hasDismissedPlatformWelcome'],
  };
  const columnRows = await prisma.$queryRaw<Array<{ table_name: string; column_name: string }>>`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
  `;
  const columnSet = new Set(columnRows.map((column) => `${column.table_name}.${column.column_name}`));
  const missingColumns = Object.entries(requiredColumns).flatMap(([table, columns]) =>
    columns.filter((column) => !columnSet.has(`${table}.${column}`)).map((column) => `${table}.${column}`),
  );
  const enumRows: Array<{ enum_name: string; enumlabel: string }> = await prisma.$queryRaw<Array<{ enum_name: string; enumlabel: string }>>`
    SELECT t.typname AS enum_name, e.enumlabel
    FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname IN ('OrganizationType', 'HrApplicantStatus')
  `.catch(() => [] as Array<{ enum_name: string; enumlabel: string }>);
  const canonicalTypes = ['PLATFORM', 'DEVELOPER', 'BROKERAGE', 'INDIVIDUAL_BROKER'];
  const enumSet = new Set(enumRows.filter((row) => row.enum_name === 'OrganizationType').map((row) => row.enumlabel));
  const enumAligned = canonicalTypes.every((value) => enumSet.has(value));
  const requiredApplicantStatuses = ['PENDING_REVIEW', 'DOCUMENTS_MISSING', 'DOCUMENTS_UNDER_REVIEW', 'READY_FOR_INTERVIEW', 'INTERVIEW_SCHEDULED', 'INTERVIEWED', 'OFFER_PENDING', 'HIRED', 'REJECTED', 'WITHDRAWN'];
  const applicantStatusSet = new Set(enumRows.filter((row) => row.enum_name === 'HrApplicantStatus').map((row) => row.enumlabel));
  const applicantEnumAligned = requiredApplicantStatuses.every((value) => applicantStatusSet.has(value));
  const openAttendanceIndex = await prisma.$queryRaw<Array<{ indexname: string }>>`
    SELECT indexname FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'hr_attendance_one_open_per_employee_idx'
  `.catch(() => []);
  const structureIssueCount = missingTables.length + missingColumns.length + (enumAligned ? 0 : 1) + (applicantEnumAligned ? 0 : 1) + (openAttendanceIndex.length ? 0 : 1);
  checks.push({
    label: 'Required database structures',
    ok: structureIssueCount === 0,
    detail: structureIssueCount
      ? `${missingTables.length} tables, ${missingColumns.length} columns, ${(enumAligned ? 0 : 1) + (applicantEnumAligned ? 0 : 1)} enum contracts, ${openAttendanceIndex.length ? 0 : 1} indexes missing/misaligned`
      : 'tables, columns, enums, and indexes aligned',
  });

  const platformOrganization = await prisma.organization.findFirst({
    where: { type: 'PLATFORM' },
    select: { id: true },
  }).catch(() => null);
  const platformOwner = await prisma.user.findFirst({
    where: { OR: [{ userRole: 'PLATFORM_OWNER' }, { role: { name: 'platform_owner' } }] },
    select: { id: true, organizationId: true, roleId: true, isActive: true },
  }).catch(() => null);
  checks.push({ label: 'Platform organization', ok: Boolean(platformOrganization) });
  checks.push({ label: 'Platform owner', ok: Boolean(platformOwner?.isActive) });
  checks.push({ label: 'Platform owner organization link', ok: Boolean(platformOwner && platformOwner.organizationId === platformOrganization?.id) });
  checks.push({ label: 'Active role assignment', ok: Boolean(platformOwner?.roleId) });

  const countSafely = async (operation: Promise<number>) => operation.catch(() => -1);
  const [permissionCount, roleCount, assignmentCount, ownerPermissionCount, planCount, policyCount, navigationCount] = await Promise.all([
    countSafely(prisma.permission.count({ where: { key: { in: [...BASE_PERMISSIONS] } } })),
    countSafely(prisma.role.count()),
    countSafely(prisma.rolePermission.count()),
    platformOwner?.roleId
      ? countSafely(prisma.rolePermission.count({ where: { roleId: platformOwner.roleId, permission: { key: { in: [...BASE_PERMISSIONS] } } } }))
      : Promise.resolve(0),
    countSafely(prisma.platformPlan.count({ where: { isActive: true, isArchived: false } })),
    countSafely(prisma.requiredDocumentPolicy.count({ where: { isActive: true } })),
    countSafely(prisma.platformNavigationConfiguration.count()),
  ]);
  checks.push({ label: 'Platform permissions', ok: permissionCount === BASE_PERMISSIONS.length && ownerPermissionCount === BASE_PERMISSIONS.length, detail: `catalog ${permissionCount}/${BASE_PERMISSIONS.length}, owner ${ownerPermissionCount}/${BASE_PERMISSIONS.length}` });
  checks.push({ label: 'RBAC', ok: roleCount > 0 && assignmentCount > 0, detail: `${roleCount} roles, ${permissionCount} base permissions, ${assignmentCount} assignments` });
  checks.push({ label: 'Plan catalog', ok: planCount >= 0, detail: `${planCount} owner-created active plans` });
  checks.push({ label: 'Verification policies', ok: policyCount >= 0, detail: `${policyCount} configured policies; built-in required-document fallback is available` });
  checks.push({
    label: 'Navigation configuration',
    ok: navigationCount === 13,
    detail: navigationCount < 0 ? 'unavailable until the required migration is applied' : `${navigationCount}/13 sections`,
  });

  try {
    await prisma.organization.findMany({
      select: {
        id: true, name: true, slug: true, type: true, status: true,
        subscription: { select: { status: true, planName: true } },
        _count: { select: { users: true, hrEmployees: true, branches: true } },
      },
      take: 1,
    });
    checks.push({ label: 'Organizations query', ok: true });
  } catch (error) {
    checks.push({ label: 'Organizations query', ok: false, detail: safeError(error) });
  }
  checks.push({ label: 'Company creation enums align', ok: enumAligned, detail: canonicalTypes.join(', ') });
  checks.push({ label: 'Employee creation dependencies', ok: tableSet.has('hr_employees') && tableSet.has('roles') && tableSet.has('organization_branches') });
  checks.push({ label: 'Attendance policy foundation', ok: tableSet.has('organization_attendance_settings') && tableSet.has('hr_attendance_records') });
  checks.push({ label: 'Recruitment intake foundation', ok: tableSet.has('hr_applicants') && tableSet.has('hr_applicant_documents') && tableSet.has('hr_applicant_interviews') });
}

async function applicationChecks(checks: Check[]) {
  let app: Awaited<ReturnType<typeof NestFactory.createApplicationContext>> | undefined;
  try {
    app = await NestFactory.createApplicationContext(AppModule, { logger: false });
    const services: Array<[string, unknown]> = [
      ['Health module', AppService],
      ['Auth module', AuthService],
      ['RealEstateModule', RealEstateService],
      ['UserPreferencesModule', UserPreferencesService],
      ['Organizations service', OrganizationsService],
      ['HR module', HrService],
      ['Attendance service', OperationsService],
      ['Recruitment service', HrRecruitmentService],
      ['CRM service', CrmLeadsService],
      ['Finance/legal operations service', OperationsService],
      ['Company provisioning service', CompanyProvisioningService],
    ];
    for (const [label, token] of services) {
      checks.push({ label, ok: Boolean(app.get(token as never, { strict: false })) });
    }
  } catch (error) {
    checks.push({ label: 'Application modules', ok: false, detail: safeError(error) });
  } finally {
    await app?.close();
  }
}

function printCheck(check: Check) {
  console.log(`${check.label}: ${check.ok ? 'OK' : 'FAIL'}${check.detail ? ` (${check.detail})` : ''}`);
}

function safeError(error: unknown) {
  if (!error || typeof error !== 'object') return 'unknown error';
  const candidate = error as { name?: unknown; code?: unknown };
  const name = typeof candidate.name === 'string' ? candidate.name : 'Error';
  const code = typeof candidate.code === 'string' ? ` ${candidate.code}` : '';
  return `${name}${code}`;
}

if (require.main === module) {
  runPlatformDoctor()
    .then((ok) => { if (!ok) process.exitCode = 1; })
    .catch((error) => {
      console.error(`Platform doctor failed safely: ${safeError(error)}`);
      console.log('Overall readiness: NO-GO');
      process.exitCode = 1;
    });
}

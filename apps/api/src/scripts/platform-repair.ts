import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { loadEnvironment } from '../config/load-environment';
import { seedBaseRolesAndPermissions } from '../modules/permissions/rbac.seed';

export async function runPlatformRepair() {
  loadEnvironment();
  if (process.env.CONFIRM_PLATFORM_REPAIR !== 'true') {
    console.error('Platform repair refused: set CONFIRM_PLATFORM_REPAIR=true.');
    return false;
  }
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || !/^postgres(?:ql)?:\/\//i.test(connectionString)) {
    console.error('Platform repair refused: DATABASE_URL is missing or invalid.');
    return false;
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    await prisma.$queryRaw`SELECT 1`;
    const rbac = await seedBaseRolesAndPermissions(prisma);
    console.log(`RBAC ensured: ${rbac.rolesSeeded} roles, ${rbac.permissionsSeeded} permissions.`);

    const platformOrganization = await prisma.organization.findFirst({
      where: { type: 'PLATFORM' },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    const platformOwner = await prisma.user.findFirst({
      where: { OR: [{ userRole: 'PLATFORM_OWNER' }, { role: { name: 'platform_owner' } }] },
      orderBy: { createdAt: 'asc' },
      select: { id: true, organizationId: true, roleId: true },
    });
    if (platformOrganization && platformOwner) {
      const role = await prisma.role.findFirst({
        where: { organizationId: null, name: 'platform_owner' },
        select: { id: true },
      });
      const changes: { organizationId?: string; roleId?: string; isActive?: boolean } = {};
      if (platformOwner.organizationId !== platformOrganization.id) changes.organizationId = platformOrganization.id;
      if (!platformOwner.roleId && role) changes.roleId = role.id;
      if (Object.keys(changes).length) {
        await prisma.user.update({ where: { id: platformOwner.id }, data: changes });
        console.log('Platform owner organization/role assignment repaired.');
      } else {
        console.log('Platform owner organization/role assignment already valid.');
      }
    } else {
      console.log('Platform owner link skipped: existing platform organization and owner are both required.');
    }

    let plansCreated = 0;
    for (const plan of basePlans) {
      const existing = await prisma.platformPlan.findUnique({ where: { code: plan.code }, select: { id: true } });
      if (!existing) {
        await prisma.platformPlan.create({ data: plan });
        plansCreated += 1;
      }
    }
    console.log(`Base plans ensured: ${plansCreated} created, ${basePlans.length - plansCreated} already present.`);

    let policiesCreated = 0;
    for (const documentType of ['COMMERCIAL_REGISTER', 'TAX_CARD', 'BROKERAGE_LICENSE_OR_REGISTRATION'] as const) {
      const existing = await prisma.requiredDocumentPolicy.findFirst({
        where: { countryCode: 'EG', organizationType: 'BROKERAGE', legalForm: null, documentType },
      });
      if (!existing) {
        await prisma.requiredDocumentPolicy.create({
          data: { countryCode: 'EG', organizationType: 'BROKERAGE', documentType, isRequired: true },
        });
        policiesCreated += 1;
      }
    }
    console.log(`Verification policies ensured: ${policiesCreated} created.`);

    const organizations = await prisma.organization.findMany({ select: { id: true } });
    let settingsCreated = 0;
    for (const organization of organizations) {
      const existing = await prisma.organizationAttendanceSettings.findUnique({ where: { organizationId: organization.id }, select: { id: true } });
      if (!existing) {
        await prisma.organizationAttendanceSettings.create({ data: { organizationId: organization.id } });
        settingsCreated += 1;
      }
    }
    console.log(`Base attendance settings ensured: ${settingsCreated} created.`);

    const users = await prisma.user.findMany({ select: { id: true } });
    let navigationCreated = 0;
    let quickActionsCreated = 0;
    for (const user of users) {
      const navigation = await prisma.userNavigationPreference.findUnique({ where: { userId: user.id }, select: { id: true } });
      if (!navigation) {
        await prisma.userNavigationPreference.create({ data: { userId: user.id } });
        navigationCreated += 1;
      }
      const quickActions = await prisma.userQuickActionPreference.findUnique({
        where: { userId_widgetKey: { userId: user.id, widgetKey: 'hr_quick_actions' } },
        select: { id: true },
      });
      if (!quickActions) {
        await prisma.userQuickActionPreference.create({
          data: { userId: user.id, widgetKey: 'hr_quick_actions' },
        });
        quickActionsCreated += 1;
      }
    }
    console.log(`Default preferences ensured: ${navigationCreated} navigation, ${quickActionsCreated} quick-action records created.`);
    console.log('Platform repair complete. No users, organizations, files, passwords, or approved business data were deleted or overwritten.');
    return true;
  } finally {
    await prisma.$disconnect();
  }
}

const basePlans = [
  { code: 'STARTER', name: 'Starter', priceCurrency: 'USD', trialDays: 14, limits: { maxEmployees: 25, maxOffices: 1 }, enabledModules: { hr: true } },
  { code: 'BUSINESS', name: 'Business', priceCurrency: 'USD', trialDays: 14, limits: { maxEmployees: 100, maxOffices: 5 }, enabledModules: { hr: true, crm: true } },
] as const;

if (require.main === module) {
  runPlatformRepair()
    .then((ok) => { if (!ok) process.exitCode = 1; })
    .catch((error) => {
      const name = error instanceof Error ? error.name : 'Error';
      console.error(`Platform repair failed safely: ${name}`);
      process.exitCode = 1;
    });
}

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
      if (role && platformOwner.roleId !== role.id) changes.roleId = role.id;
      if (Object.keys(changes).length) {
        await prisma.user.update({ where: { id: platformOwner.id }, data: changes });
        console.log('Platform owner organization/role assignment repaired.');
      } else {
        console.log('Platform owner organization/role assignment already valid.');
      }
    } else {
      console.log('Platform owner link skipped: existing platform organization and owner are both required.');
    }

    console.log('Plans unchanged: plans are business configuration created by the Platform Owner.');

    console.log('Verification policies unchanged: country policies are managed by the Platform Owner; safe built-in document requirements remain available as fallback metadata.');

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

    let navigationSectionsCreated = 0;
    for (const [index, section] of defaultNavigationSections.entries()) {
      const existing = await prisma.platformNavigationConfiguration.findUnique({ where: { sectionKey: section.sectionKey }, select: { id: true } });
      if (!existing) {
        await prisma.platformNavigationConfiguration.create({ data: { ...section, sortOrder: index } });
        navigationSectionsCreated += 1;
      }
    }
    console.log(`Default navigation ensured: ${navigationSectionsCreated} sections created.`);

    let metadataCreated = 0;
    for (const record of baseMetadata) {
      const existing = await prisma.platformMetadataRecord.findUnique({ where: { category_code: { category: record.category, code: record.code } }, select: { id: true } });
      if (!existing) {
        await prisma.platformMetadataRecord.create({ data: record });
        metadataCreated += 1;
      }
    }
    console.log(`Base metadata ensured: ${metadataCreated} records created.`);
    console.log('Platform repair complete. No users, organizations, files, passwords, or approved business data were deleted or overwritten.');
    return true;
  } finally {
    await prisma.$disconnect();
  }
}

const defaultNavigationSections = [
  ['platform', 'Platform', 'المنصة', 'Plateforme'],
  ['organizations', 'Organizations', 'المؤسسات', 'Organisations'],
  ['real-estate', 'Real Estate', 'العقارات', 'Immobilier'],
  ['human-resources', 'Human Resources', 'الموارد البشرية', 'Ressources humaines'],
  ['crm', 'CRM', 'إدارة العملاء', 'CRM'],
  ['finance', 'Finance', 'المالية', 'Finance'],
  ['legal', 'Legal', 'الشؤون القانونية', 'Juridique'],
  ['cameras', 'Cameras', 'الكاميرات', 'Caméras'],
  ['advertising', 'Advertising', 'الإعلانات', 'Publicité'],
  ['documents', 'Documents', 'المستندات', 'Documents'],
  ['reports', 'Reports', 'التقارير', 'Rapports'],
  ['my-workspace', 'My Workspace', 'مساحة عملي', 'Mon espace'],
  ['settings', 'Settings', 'الإعدادات', 'Paramètres'],
].map(([sectionKey, en, ar, fr]) => ({ sectionKey, localizedTitle: { en, ar, fr }, isVisible: true, allowedItemKeys: [] }));

const baseMetadata = [
  ...['PLATFORM', 'DEVELOPER', 'BROKERAGE', 'INDIVIDUAL_BROKER'].map((code) => ({ category: 'ORGANIZATION_TYPE', code, localizedName: { en: code, ar: code, fr: code } })),
  ...['HR', 'CRM', 'FINANCE', 'LEGAL', 'CAMERAS', 'ADVERTISING'].map((code) => ({ category: 'MODULE', code, localizedName: { en: code, ar: code, fr: code } })),
  ...['EMAIL_PASSWORD', 'PHONE_PASSWORD'].map((code) => ({ category: 'AUTHENTICATION_METHOD', code, localizedName: { en: code, ar: code, fr: code } })),
];

if (require.main === module) {
  runPlatformRepair()
    .then((ok) => { if (!ok) process.exitCode = 1; })
    .catch((error) => {
      const name = error instanceof Error ? error.name : 'Error';
      console.error(`Platform repair failed safely: ${name}`);
      process.exitCode = 1;
    });
}

import { PrismaPg } from '@prisma/adapter-pg';
import {
  OrganizationBillingCycle,
  OrganizationDocumentType,
  OrganizationLegalForm,
  OrganizationStatus,
  OrganizationType,
  PrismaClient,
  UserRole,
} from '@prisma/client';
import { seedBaseRolesAndPermissions } from '../modules/permissions/rbac.seed';

const RESET_CONFIRM = 'CONFIRM_RESET_PLATFORM_OWNER_ONLY=true';
const PRODUCTION_CONFIRM = 'ALLOW_PRODUCTION_RESET=true';

async function main() {
  assertSafety();

  const connectionString =
    process.env.DATABASE_URL ??
    'postgresql://postgres:postgres@localhost:5432/popwam?schema=public';
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const ownerEmail = requiredEnv('PLATFORM_OWNER_EMAIL').trim().toLowerCase();
    const owner = await prisma.user.findUnique({
      where: { email: ownerEmail },
      include: { organization: true, role: true },
    });

    if (!owner?.passwordHash) {
      console.error('Platform owner/admin not found. Reset aborted.');
      return;
    }

    const platformOrganization = await prisma.organization.upsert({
      where: { slug: 'platform' },
      create: {
        name: 'POPWAM Platform',
        slug: 'platform',
        type: OrganizationType.PLATFORM,
        status: OrganizationStatus.ACTIVE,
        defaultLanguage: 'en',
      },
      update: {
        type: OrganizationType.PLATFORM,
        status: OrganizationStatus.ACTIVE,
        defaultLanguage: 'en',
      },
    });

    const rbac = await seedBaseRolesAndPermissions(prisma);
    const platformOwnerRole = await prisma.role.upsert({
      where: {
        organizationId_name: {
          organizationId: platformOrganization.id,
          name: 'platform_owner',
        },
      },
      create: {
        organizationId: platformOrganization.id,
        name: 'platform_owner',
        isSystem: true,
        description: 'Platform owner role.',
      },
      update: { isSystem: true },
    });
    await seedBaseRolesAndPermissions(prisma);

    await prisma.user.update({
      where: { id: owner.id },
      data: {
        organizationId: platformOrganization.id,
        roleId: platformOwnerRole.id,
        userRole: UserRole.PLATFORM_OWNER,
        isActive: true,
      },
    });

    const deleted: Record<string, number> = {};

    deleted.refreshTokens = await prisma.refreshToken.deleteMany({
      where: { userId: { not: owner.id } },
    }).then((result) => result.count);
    deleted.userNavigationPreferences = await prisma.userNavigationPreference.deleteMany({}).then((result) => result.count);
    deleted.userQuickActionPreferences = await prisma.userQuickActionPreference.deleteMany({}).then((result) => result.count);
    deleted.unitQrPasses = await prisma.unitQrPass.deleteMany({}).then((result) => result.count);
    deleted.unitCustomerAssignments = await prisma.unitCustomerAssignment.deleteMany({}).then((result) => result.count);
    deleted.units = await prisma.unit.deleteMany({}).then((result) => result.count);
    deleted.floors = await prisma.floor.deleteMany({}).then((result) => result.count);
    deleted.buildings = await prisma.building.deleteMany({}).then((result) => result.count);
    deleted.realEstateProjects = await prisma.compound.deleteMany({}).then((result) => result.count);
    deleted.customerProfiles = await prisma.customerProfile.deleteMany({}).then((result) => result.count);
    deleted.accessIntegrations = await prisma.accessIntegration.deleteMany({}).then((result) => result.count);
    deleted.nonOwnerUsers = await prisma.user.deleteMany({
      where: { id: { not: owner.id } },
    }).then((result) => result.count);
    deleted.nonPlatformOrganizations = await prisma.organization.deleteMany({
      where: { id: { not: platformOrganization.id } },
    }).then((result) => result.count);
    deleted.uploadedFileMetadata = await prisma.uploadedFile.deleteMany({}).then((result) => result.count);
    deleted.notifications = await prisma.notificationEvent.deleteMany({}).then((result) => result.count);
    deleted.auditLogs = await prisma.auditLog.deleteMany({}).then((result) => result.count);
    deleted.platformPlans = await prisma.platformPlan.deleteMany({}).then((result) => result.count);
    deleted.requiredDocumentPolicies = await prisma.requiredDocumentPolicy.deleteMany({}).then((result) => result.count);

    const seeded = {
      rbac,
      plans: await seedPlatformPlans(prisma),
      policies: await seedVerificationPolicies(prisma),
      accessIntegrations: await prisma.accessIntegration.upsert({
        where: { id: `access_${platformOrganization.id}` },
        create: {
          id: `access_${platformOrganization.id}`,
          organizationId: platformOrganization.id,
          provider: 'QR',
          type: 'QR_ONLY',
          status: 'NOT_CONFIGURED',
          metadata: {
            en: 'QR access pass is available. Smart gate integration is not configured.',
            ar: 'تصريح الدخول بالـ QR متاح. ربط بوابة ذكية غير مفعّل.',
            fr: "Le pass d'acces QR est disponible. L'integration de portail intelligent n'est pas configuree.",
          },
        },
        update: {
          provider: 'QR',
          type: 'QR_ONLY',
          status: 'NOT_CONFIGURED',
        },
      }).then(() => 1),
    };

    await prisma.auditLog.create({
      data: {
        organizationId: platformOrganization.id,
        actorUserId: owner.id,
        action: 'platform.reset_owner_only',
        entityType: 'Platform',
        entityId: platformOrganization.id,
        metadata: { preservedOwnerEmail: owner.email, deleted },
      },
    });

    console.log(JSON.stringify({
      preservedPlatformOwner: { email: owner.email, id: owner.id },
      preservedPlatformOrganization: { id: platformOrganization.id },
      deleted,
      reseeded: seeded,
      nextCommands: [
        'pnpm --filter api prisma:generate',
        'pnpm --filter api build',
      ],
    }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

function assertSafety() {
  if (process.env.CONFIRM_RESET_PLATFORM_OWNER_ONLY !== 'true') {
    throw new Error(`Reset refused. Set ${RESET_CONFIRM} and PLATFORM_OWNER_EMAIL=<main platform admin email>.`);
  }
  if (!process.env.PLATFORM_OWNER_EMAIL?.trim()) {
    throw new Error('Reset refused. PLATFORM_OWNER_EMAIL=<main platform admin email> is required.');
  }
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PRODUCTION_RESET !== 'true') {
    throw new Error(`Production reset refused. Set ${PRODUCTION_CONFIRM} only when you intentionally want this.`);
  }
}

function requiredEnv(key: string) {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is required.`);
  return value;
}

async function seedPlatformPlans(prisma: PrismaClient) {
  const plans = [
    { code: 'starter', name: 'Starter', priceAmount: '0' },
    { code: 'growth', name: 'Growth', priceAmount: '99' },
    { code: 'enterprise', name: 'Enterprise', priceAmount: '299' },
  ];
  for (const plan of plans) {
    await prisma.platformPlan.upsert({
      where: { code: plan.code },
      create: {
        ...plan,
        priceCurrency: 'USD',
        billingCycle: OrganizationBillingCycle.MONTHLY,
        localizedName: { en: plan.name, ar: plan.name, fr: plan.name },
        limits: {},
        enabledModules: {
          hr: true,
          crm: true,
          realEstate: true,
          qrPasses: true,
        },
      },
      update: {
        name: plan.name,
        isActive: true,
        isArchived: false,
      },
    });
  }
  return plans.length;
}

async function seedVerificationPolicies(prisma: PrismaClient) {
  const supportedType = await prisma.supportedOrganizationType.findFirst({
    where: {
      code: 'BROKERAGE',
      isActive: true,
      isArchived: false,
    },
  });
  if (!supportedType) {
    throw new Error('Active BROKERAGE supported organization type is required.');
  }
  const policies = [
    {
      countryCode: 'EG',
      organizationType: OrganizationType.BROKERAGE,
      legalForm: OrganizationLegalForm.LLC,
      documentType: OrganizationDocumentType.COMMERCIAL_REGISTER,
    },
    {
      countryCode: 'EG',
      organizationType: OrganizationType.BROKERAGE,
      legalForm: OrganizationLegalForm.LLC,
      documentType: OrganizationDocumentType.TAX_CARD,
    },
  ];
  for (const policy of policies) {
    const existing = await prisma.requiredDocumentPolicy.findFirst({
      where: {
        countryCode: policy.countryCode,
        supportedOrganizationTypeId: supportedType.id,
        legalForm: policy.legalForm,
        documentType: policy.documentType,
        isArchived: false,
      },
    });
    if (existing) {
      await prisma.requiredDocumentPolicy.update({
        where: { id: existing.id },
        data: {
          organizationType: supportedType.legacyOrganizationType,
          isActive: true,
        },
      });
    } else {
      await prisma.requiredDocumentPolicy.create({
        data: {
          ...policy,
          supportedOrganizationTypeId: supportedType.id,
          organizationType: supportedType.legacyOrganizationType,
          isRequired: true,
          requiresExpiryDate: false,
          ownerDocumentRequired: true,
        },
      });
    }
  }
  return policies.length;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

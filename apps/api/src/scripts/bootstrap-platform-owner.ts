import { PrismaPg } from '@prisma/adapter-pg';
import {
  OrganizationStatus,
  OrganizationType,
  PrismaClient,
  UserRole,
} from '@prisma/client';

import { loadEnvironment } from '../config/load-environment';
import { HashService } from '../modules/auth/hash.service';

loadEnvironment();

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required.');
  }

  const email = process.env.PLATFORM_OWNER_EMAIL?.trim().toLowerCase();
  const password = process.env.PLATFORM_OWNER_PASSWORD;
  const firstName =
    process.env.PLATFORM_OWNER_FIRST_NAME?.trim() || 'Mamdouh';
  const lastName =
    process.env.PLATFORM_OWNER_LAST_NAME?.trim() || null;

  if (!email) {
    throw new Error('PLATFORM_OWNER_EMAIL is required.');
  }

  if (!password) {
    throw new Error('PLATFORM_OWNER_PASSWORD is required.');
  }

  console.log('Connecting to database...');

  const adapter = new PrismaPg({
    connectionString: databaseUrl,
  });

  const prisma = new PrismaClient({ adapter });
  const hashService = new HashService();

  try {
    console.log('1/4 Creating platform organization...');

    const organization = await prisma.organization.upsert({
      where: {
        slug: 'platform',
      },
      create: {
        name: 'POPWAM Platform',
        slug: 'platform',
        type: OrganizationType.PLATFORM,
        status: OrganizationStatus.ACTIVE,
        defaultLanguage: 'en',
      },
      update: {
        name: 'POPWAM Platform',
        type: OrganizationType.PLATFORM,
        status: OrganizationStatus.ACTIVE,
        defaultLanguage: 'en',
      },
    });

    console.log(`Organization OK: ${organization.id}`);

    console.log('2/4 Creating platform_owner role...');

    const role = await prisma.role.upsert({
      where: {
        organizationId_name: {
          organizationId: organization.id,
          name: 'platform_owner',
        },
      },
      create: {
        organizationId: organization.id,
        name: 'platform_owner',
        description: 'Platform owner role.',
        isSystem: true,
      },
      update: {
        description: 'Platform owner role.',
        isSystem: true,
      },
    });

    console.log(`Role OK: ${role.id}`);

    console.log('3/4 Hashing password...');

    const passwordHash = await hashService.hash(password);

    console.log('Password hash OK');

    console.log('4/4 Creating platform owner...');

    const user = await prisma.user.upsert({
      where: {
        email,
      },

      create: {
        email,
        passwordHash,
        firstName,
        lastName,
        organizationId: organization.id,
        roleId: role.id,
        userRole: UserRole.PLATFORM_OWNER,
        isActive: true,
        mustChangePassword: false,
      },

      update: {
        passwordHash,
        firstName,
        lastName,
        organizationId: organization.id,
        roleId: role.id,
        userRole: UserRole.PLATFORM_OWNER,
        isActive: true,
        mustChangePassword: false,
      },
    });

    console.log('');
    console.log('======================================');
    console.log('PLATFORM OWNER CREATED');
    console.log('======================================');
    console.log(`ID:    ${user.id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role:  ${user.userRole}`);
    console.log(`Org:   ${organization.name}`);
    console.log('======================================');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('');
  console.error('BOOTSTRAP FAILED');
  console.error(error);
  process.exitCode = 1;
});
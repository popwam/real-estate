import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, UserRole } from '@prisma/client';
import { loadEnvironment } from '../config/load-environment';
import { seedBaseRolesAndPermissions } from '../modules/permissions/rbac.seed';

type SafePrismaError = {
  errorName: string;
  prismaCode: string | null;
  modelName: string | null;
  message: string;
};

export function toSafePrismaError(error: unknown): SafePrismaError {
  const value = isRecord(error) ? error : {};
  const meta = isRecord(value.meta) ? value.meta : {};
  const prismaCode = value.code ?? value.errorCode;

  return {
    errorName:
      safeIdentifier(value.name) ??
      (error instanceof Error ? safeIdentifier(error.name) : null) ??
      'Error',
    prismaCode:
      typeof prismaCode === 'string' && /^P\d{4}$/.test(prismaCode)
        ? prismaCode
        : null,
    modelName: safeIdentifier(value.modelName) ?? safeIdentifier(meta.modelName),
    message: sanitizeErrorMessage(
      error instanceof Error ? error.message : 'Database operation failed.',
    ),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function safeIdentifier(value: unknown): string | null {
  return typeof value === 'string' && /^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(value)
    ? value
    : null;
}

function sanitizeErrorMessage(message: string): string {
  const sanitized = message
    .replace(
      /\b(?:postgres(?:ql)?|mysql|sqlserver|mongodb):\/\/[^\s"'`]+/gi,
      '[REDACTED_DATABASE_URL]',
    )
    .replace(
      /\b(DATABASE_URL|password|passwd|pwd|token|secret|api[_-]?key)\b\s*[:=]\s*(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi,
      '$1=[REDACTED]',
    )
    .replace(/\s+/g, ' ')
    .trim();

  return (sanitized || 'Database operation failed.').slice(0, 240);
}

export async function repairPlatformOwnerRbac(prisma: PrismaClient) {
  const rbac = await seedBaseRolesAndPermissions(prisma);
  const platformOrganization = await prisma.organization.findFirst({
    where: { type: 'PLATFORM' },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  if (!platformOrganization) {
    throw new Error('Platform organization is required.');
  }

  const platformOwnerRole =
    (await prisma.role.findFirst({
      where: {
        name: 'platform_owner',
        organizationId: platformOrganization.id,
      },
      select: { id: true },
    })) ??
    (await prisma.role.findFirst({
      where: { name: 'platform_owner', organizationId: null },
      select: { id: true },
    }));
  if (!platformOwnerRole) {
    throw new Error('Platform Owner role is required.');
  }

  const owners = await prisma.user.findMany({
    where: { userRole: UserRole.PLATFORM_OWNER },
    select: { id: true, organizationId: true, roleId: true },
  });
  if (!owners.length) {
    throw new Error('Existing Platform Owner account is required.');
  }

  let assignmentsRepaired = 0;
  for (const owner of owners) {
    if (
      owner.organizationId === platformOrganization.id &&
      owner.roleId === platformOwnerRole.id
    ) {
      continue;
    }
    await prisma.user.update({
      where: { id: owner.id },
      data: {
        organizationId: platformOrganization.id,
        roleId: platformOwnerRole.id,
      },
    });
    assignmentsRepaired += 1;
  }

  return {
    ...rbac,
    platformOwnersChecked: owners.length,
    assignmentsRepaired,
  };
}

async function main() {
  if (!process.argv.includes('--confirm')) {
    console.error('RBAC repair refused: pass --confirm explicitly.');
    process.exitCode = 1;
    return;
  }
  loadEnvironment();
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || !/^postgres(?:ql)?:\/\//i.test(connectionString)) {
    throw new Error('DATABASE_URL is missing or invalid.');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
  try {
    const result = await repairPlatformOwnerRbac(prisma);
    console.log(JSON.stringify(result));
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(JSON.stringify(toSafePrismaError(error)));
    process.exitCode = 1;
  });
}

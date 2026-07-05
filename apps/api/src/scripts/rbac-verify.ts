import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import {
  BASE_PERMISSIONS,
  ROLE_PERMISSIONS,
} from '../modules/permissions/rbac.seed';

export const DEAL_ROOM_REQUIRED_PERMISSIONS = [
  'deal_rooms.join',
  'deal_rooms.create',
] as const;

export function verifyDealRoomRbacDefinitions() {
  const failures: string[] = [];
  for (const permission of DEAL_ROOM_REQUIRED_PERMISSIONS) {
    if (!BASE_PERMISSIONS.includes(permission)) {
      failures.push(`Missing base permission ${permission}`);
    }
  }
  for (const role of ['platform_owner', 'platform_admin'] as const) {
    for (const permission of ['deal_rooms.join'] as const) {
      if (!ROLE_PERMISSIONS[role]?.includes(permission)) {
        failures.push(`${role} missing ${permission}`);
      }
    }
  }
  return { ok: failures.length === 0, failures };
}

async function verifyDatabase() {
  if (process.env.RBAC_VERIFY_DATABASE !== 'true') {
    console.log(
      '[SKIP] database RBAC verification requires RBAC_VERIFY_DATABASE=true',
    );
    return true;
  }
  if (!process.env.DATABASE_URL?.trim()) {
    console.error(
      '[FAIL] DATABASE_URL is required for database RBAC verification',
    );
    return false;
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  try {
    const roles = await prisma.role.findMany({
      where: { name: { in: ['platform_owner', 'platform_admin'] } },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
    const failures: string[] = [];
    for (const roleName of ['platform_owner', 'platform_admin']) {
      const matchingRoles = roles.filter((role) => role.name === roleName);
      if (!matchingRoles.length) {
        failures.push(`${roleName} role not found`);
        continue;
      }
      for (const role of matchingRoles) {
        const keys = new Set(
          role.permissions.map((item) => item.permission.key),
        );
        if (!keys.has('deal_rooms.join')) {
          failures.push(`${roleName}/${role.id} missing deal_rooms.join`);
        }
      }
    }
    for (const failure of failures) console.error(`[FAIL] ${failure}`);
    if (!failures.length)
      console.log('[PASS] database platform deal-room RBAC verified');
    return failures.length === 0;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  const source = verifyDealRoomRbacDefinitions();
  for (const failure of source.failures) console.error(`[FAIL] ${failure}`);
  if (source.ok) {
    console.log('[PASS] source RBAC includes platform deal-room permissions');
  }
  verifyDatabase()
    .then((dbOk) => {
      if (!source.ok || !dbOk) process.exitCode = 1;
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}

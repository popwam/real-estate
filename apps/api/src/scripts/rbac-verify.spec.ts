import { seedBaseRolesAndPermissions } from '../modules/permissions/rbac.seed';
import {
  DEAL_ROOM_REQUIRED_PERMISSIONS,
  verifyDealRoomRbacDefinitions,
} from './rbac-verify';

describe('RBAC verification', () => {
  it('matches actual deal-room guard permissions', () => {
    expect(DEAL_ROOM_REQUIRED_PERMISSIONS).toEqual([
      'deal_rooms.join',
      'deal_rooms.create',
    ]);
    expect(verifyDealRoomRbacDefinitions()).toEqual({
      ok: true,
      failures: [],
    });
  });

  it('syncs canonical platform permissions to organization-scoped roles', async () => {
    const roles = [
      {
        id: 'system_platform_owner',
        name: 'platform_owner',
        organizationId: null,
      },
      {
        id: 'org_platform_owner',
        name: 'platform_owner',
        organizationId: 'org_1',
      },
    ];
    const permissions = new Map<string, { id: string; key: string }>();
    const rolePermission = {
      upsert: jest.fn().mockResolvedValue({}),
    };
    const prisma = {
      permission: {
        upsert: jest.fn().mockImplementation(({ where }) => {
          const permission = { id: `perm_${where.key}`, key: where.key };
          permissions.set(where.key, permission);
          return Promise.resolve(permission);
        }),
        findUniqueOrThrow: jest.fn().mockImplementation(({ where }) => {
          const permission = permissions.get(where.key) ?? {
            id: `perm_${where.key}`,
            key: where.key,
          };
          permissions.set(where.key, permission);
          return Promise.resolve(permission);
        }),
      },
      role: {
        findFirst: jest
          .fn()
          .mockImplementation(({ where }) =>
            Promise.resolve(
              roles.find(
                (role) =>
                  role.name === where.name &&
                  role.organizationId === where.organizationId,
              ),
            ),
          ),
        update: jest
          .fn()
          .mockImplementation(({ where }) =>
            Promise.resolve(roles.find((role) => role.id === where.id)),
          ),
        create: jest.fn().mockImplementation(({ data }) => {
          const role = {
            id: `system_${data.name}`,
            name: data.name,
            organizationId: data.organizationId ?? null,
          };
          roles.push(role);
          return Promise.resolve(role);
        }),
        findMany: jest
          .fn()
          .mockImplementation(({ where }) =>
            Promise.resolve(roles.filter((role) => role.name === where.name)),
          ),
      },
      rolePermission,
    };

    await seedBaseRolesAndPermissions(prisma as any);

    expect(rolePermission.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          roleId_permissionId: {
            roleId: 'org_platform_owner',
            permissionId: 'perm_deal_rooms.join',
          },
        },
      }),
    );
  });
});

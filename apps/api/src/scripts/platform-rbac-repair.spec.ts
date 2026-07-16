import { seedBaseRolesAndPermissions } from '../modules/permissions/rbac.seed';
import { repairPlatformOwnerRbac } from './platform-rbac-repair';

jest.mock('../modules/permissions/rbac.seed', () => ({
  seedBaseRolesAndPermissions: jest.fn(),
}));

describe('Platform Owner RBAC repair', () => {
  it('repairs existing owner role links without changing credentials', async () => {
    jest.mocked(seedBaseRolesAndPermissions).mockResolvedValue({
      rolesSeeded: 1,
      permissionsSeeded: 2,
    });
    const prisma = {
      organization: {
        findFirst: jest.fn().mockResolvedValue({ id: 'platform-org' }),
      },
      role: {
        findFirst: jest.fn().mockResolvedValue({ id: 'platform-owner-role' }),
      },
      user: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'owner-1', organizationId: 'platform-org', roleId: 'platform-owner-role' },
          { id: 'owner-2', organizationId: 'company-org', roleId: 'broker-role' },
        ]),
        update: jest.fn().mockResolvedValue({ id: 'owner-2' }),
      },
    };

    await expect(repairPlatformOwnerRbac(prisma as any)).resolves.toEqual({
      rolesSeeded: 1,
      permissionsSeeded: 2,
      platformOwnersChecked: 2,
      assignmentsRepaired: 1,
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'owner-2' },
      data: {
        organizationId: 'platform-org',
        roleId: 'platform-owner-role',
      },
    });
    expect(JSON.stringify(prisma.user.update.mock.calls)).not.toMatch(
      /password|token|email/i,
    );
  });
});

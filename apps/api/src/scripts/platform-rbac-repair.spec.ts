import { seedBaseRolesAndPermissions } from '../modules/permissions/rbac.seed';
import {
  repairPlatformOwnerRbac,
  toSafePrismaError,
} from './platform-rbac-repair';

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

  it('exposes only sanitized Prisma failure details', () => {
    const error = Object.assign(
      new Error(
        'Cannot connect to postgresql://admin:top-secret@db.internal/app DATABASE_URL=postgresql://hidden:password@db/app token=private-token',
      ),
      {
        name: 'PrismaClientKnownRequestError',
        code: 'P1001',
        meta: { modelName: 'Permission', databaseUrl: 'postgresql://leaked' },
      },
    );

    const safe = toSafePrismaError(error);

    expect(safe).toEqual({
      errorName: 'PrismaClientKnownRequestError',
      prismaCode: 'P1001',
      modelName: 'Permission',
      message:
        'Cannot connect to [REDACTED_DATABASE_URL] DATABASE_URL=[REDACTED] token=[REDACTED]',
    });
    expect(JSON.stringify(safe)).not.toMatch(
      /admin|top-secret|hidden|private-token|db\.internal/,
    );
  });
});

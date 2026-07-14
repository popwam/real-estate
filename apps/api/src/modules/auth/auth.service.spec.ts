import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const activeUser = {
    id: 'user_1',
    organizationId: 'org_1',
    roleId: 'role_1',
    email: 'owner@example.com',
    passwordHash: 'hash',
    firstName: 'Owner',
    lastName: 'User',
    phone: '+20 100 123 4567',
    userRole: 'DEVELOPER_OWNER',
    isActive: true,
    organization: {
      id: 'org_1',
      name: 'Northline Development Group',
      slug: 'northline',
      type: 'DEVELOPER',
      status: 'APPROVED',
    },
    role: {
      permissions: [{ permission: { key: 'projects.view_own' } }],
    },
  };

  function makeService(overrides: Record<string, unknown> = {}) {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(activeUser),
        findMany: jest.fn().mockResolvedValue([activeUser]),
        update: jest.fn().mockResolvedValue(activeUser),
      },
      refreshToken: {
        create: jest.fn().mockResolvedValue({ id: 'refresh_1' }),
      },
      ...overrides,
    } as any;
    const hashService = {
      hash: jest.fn(),
      verify: jest.fn().mockResolvedValue(true),
      fingerprint: jest.fn().mockReturnValue('token_hash'),
    };
    const jwtService = {
      signAccessToken: jest.fn().mockReturnValue('access.jwt'),
      signRefreshToken: jest.fn().mockReturnValue('refresh.jwt'),
      refreshTokenExpiresAt: jest.fn().mockReturnValue(new Date('2030-01-01')),
    };
    const auditLogs = {
      record: jest.fn().mockResolvedValue(undefined),
    };

    return {
      service: new AuthService(
        prisma,
        hashService as any,
        jwtService as any,
        auditLogs as any,
      ),
      prisma,
      hashService,
      auditLogs,
    };
  }

  it('keeps email and password login working', async () => {
    const { service, prisma } = makeService();

    await expect(
      service.login({ email: 'OWNER@example.com', password: 'secret-password' }),
    ).resolves.toMatchObject({
      accessToken: 'access.jwt',
      refreshToken: 'refresh.jwt',
      user: { email: 'owner@example.com' },
    });

    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: 'owner@example.com' } }),
    );
  });

  it('allows phone and password login through identifier', async () => {
    const { service, prisma } = makeService();

    await expect(
      service.login({ identifier: '+201001234567', password: 'secret-password' }),
    ).resolves.toMatchObject({
      user: { email: 'owner@example.com', phone: '+20 100 123 4567' },
    });

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { phone: { not: null } } }),
    );
  });

  it('includes the must-change-password flag in login responses', async () => {
    const { service, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue({
      ...activeUser,
      mustChangePassword: true,
    });

    await expect(
      service.login({ email: 'owner@example.com', password: 'secret-password' }),
    ).resolves.toMatchObject({
      user: { mustChangePassword: true },
    });
  });

  it('uses a generic error for wrong passwords', async () => {
    const { service, hashService } = makeService();
    hashService.verify.mockResolvedValue(false);

    await expect(
      service.login({ identifier: '+201001234567', password: 'wrong-password' }),
    ).rejects.toThrow(new UnauthorizedException('Invalid login details.'));
  });

  it('uses a generic error for unknown phone numbers', async () => {
    const { service, prisma, hashService } = makeService();
    prisma.user.findMany.mockResolvedValue([]);

    await expect(
      service.login({ identifier: '+201009999999', password: 'secret-password' }),
    ).rejects.toThrow('Invalid login details.');
    expect(hashService.verify).not.toHaveBeenCalled();
  });

  it('blocks inactive users', async () => {
    const { service, prisma } = makeService();
    prisma.user.findMany.mockResolvedValue([{ ...activeUser, isActive: false }]);

    await expect(
      service.login({ identifier: '+201001234567', password: 'secret-password' }),
    ).rejects.toThrow('Invalid login details.');
  });

  it('blocks login for users missing a password and records a safe diagnostic', async () => {
    const { service, prisma, hashService, auditLogs } = makeService();
    prisma.user.findUnique.mockResolvedValue({ ...activeUser, passwordHash: null });

    await expect(
      service.login({ email: 'owner@example.com', password: 'secret-password' }),
    ).rejects.toThrow('Invalid login details.');
    expect(hashService.verify).not.toHaveBeenCalled();
    expect(auditLogs.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'auth.login_failed',
        metadata: {
          identifierKind: 'email',
          failureReason: 'missing_password',
        },
      }),
    );
  });

  it('blocks suspended organizations', async () => {
    const { service, prisma } = makeService();
    prisma.user.findMany.mockResolvedValue([
      {
        ...activeUser,
        organization: { ...activeUser.organization, status: 'SUSPENDED' },
      },
    ]);

    await expect(
      service.login({ identifier: '+201001234567', password: 'secret-password' }),
    ).rejects.toThrow('Invalid login details.');
  });

  it('blocks company login while the organization is awaiting verification', async () => {
    const { service, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue({
      ...activeUser,
      organization: { ...activeUser.organization, status: 'DOCUMENTS_REQUIRED' },
    });
    await expect(
      service.login({ email: 'owner@example.com', password: 'secret-password' }),
    ).rejects.toThrow('Invalid login details.');
  });

  it('blocks a login-disabled employee account', async () => {
    const { service, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue({
      ...activeUser,
      hrEmployeeProfile: { status: 'ACTIVE', loginEnabled: false },
    });
    await expect(
      service.login({ email: 'owner@example.com', password: 'secret-password' }),
    ).rejects.toThrow('Invalid login details.');
  });

  it('changes a temporary password and clears the forced-change flag', async () => {
    const { service, prisma, hashService, auditLogs } = makeService();
    hashService.hash.mockResolvedValue('new-hash');
    prisma.user.findUnique.mockResolvedValue({
      ...activeUser,
      mustChangePassword: true,
    });

    await expect(
      service.changePassword(
        { userId: activeUser.id, organizationId: activeUser.organizationId } as any,
        {
          currentPassword: 'temporary-password',
          newPassword: 'private-password-1',
        },
      ),
    ).resolves.toEqual({ passwordChanged: true });

    expect(hashService.verify).toHaveBeenCalledWith(
      'temporary-password',
      'hash',
    );
    expect(hashService.hash).toHaveBeenCalledWith('private-password-1');
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          passwordHash: 'new-hash',
          mustChangePassword: false,
        },
      }),
    );
    expect(auditLogs.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'auth.password_changed',
      }),
    );
    expect(auditLogs.record.mock.calls[0][0]).not.toHaveProperty('metadata');
  });
});

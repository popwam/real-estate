import { ConflictException, GoneException } from '@nestjs/common';
import { InvitationsService } from './invitations.service';

describe('InvitationsService', () => {
  const future = new Date('2030-01-01');
  const organization = {
    id: 'org_1',
    name: 'Northline Development Group',
    slug: 'northline',
    type: 'DEVELOPER',
  };
  const invitation = {
    id: 'invite_1',
    organizationId: 'org_1',
    email: 'agent@example.com',
    intendedRole: 'DEVELOPER_SALES_AGENT',
    tokenHash: 'token_hash',
    status: 'PENDING',
    expiresAt: future,
    organization,
  };

  function makeService(overrides: Record<string, unknown> = {}) {
    const tx = {
      organizationInvitation: {
        findUnique: jest.fn().mockResolvedValue(invitation),
        update: jest.fn().mockResolvedValue({ ...invitation, status: 'ACCEPTED' }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 'user_1',
          email: 'agent@example.com',
          firstName: 'Sales',
          lastName: 'Agent',
          userRole: 'DEVELOPER_SALES_AGENT',
        }),
        update: jest.fn(),
      },
      role: {
        upsert: jest.fn().mockResolvedValue({ id: 'role_1' }),
      },
      permission: {
        upsert: jest.fn().mockImplementation(({ where }) =>
          Promise.resolve({ id: `permission_${where.key}`, key: where.key }),
        ),
      },
      rolePermission: {
        upsert: jest.fn().mockResolvedValue({}),
      },
    };
    const prisma = {
      organizationInvitation: {
        findUnique: jest.fn().mockResolvedValue(invitation),
        update: jest.fn().mockResolvedValue({ ...invitation, status: 'EXPIRED' }),
      },
      user: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest.fn((callback) => callback(tx)),
      ...overrides,
    } as any;
    const hashService = {
      fingerprint: jest.fn().mockReturnValue('token_hash'),
      hash: jest.fn().mockResolvedValue('password_hash'),
    };
    const auditLogs = {
      record: jest.fn().mockResolvedValue(undefined),
    };

    return {
      service: new InvitationsService(prisma, hashService as any, auditLogs as any),
      prisma,
      tx,
      auditLogs,
    };
  }

  it('accepts an invitation and creates a login user with the intended role', async () => {
    const { service, tx, auditLogs } = makeService();

    await expect(
      service.accept('invite-token-12345678901234567890123456789012', {
        password: 'strong-password-123',
        firstName: 'Sales',
        lastName: 'Agent',
        phone: '+20 100 123 4567',
      }),
    ).resolves.toMatchObject({
      accepted: true,
      user: {
        email: 'agent@example.com',
        userRole: 'DEVELOPER_SALES_AGENT',
      },
      organization: { id: 'org_1' },
    });

    expect(tx.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: 'org_1',
          roleId: 'role_1',
          passwordHash: 'password_hash',
          phone: '+201001234567',
          userRole: 'DEVELOPER_SALES_AGENT',
        }),
      }),
    );
    expect(auditLogs.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'organization.invitation_accepted',
        entityType: 'OrganizationInvitation',
      }),
    );
  });

  it('marks an expired invitation and rejects acceptance', async () => {
    const { service, prisma } = makeService({
      organizationInvitation: {
        findUnique: jest.fn().mockResolvedValue({
          ...invitation,
          expiresAt: new Date('2020-01-01'),
        }),
        update: jest.fn().mockResolvedValue({}),
      },
    });

    await expect(
      service.accept('invite-token-12345678901234567890123456789012', {
        password: 'strong-password-123',
      }),
    ).rejects.toThrow(GoneException);
    expect(prisma.organizationInvitation.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'EXPIRED' } }),
    );
  });

  it('prevents invitation token reuse', async () => {
    const { service } = makeService({
      organizationInvitation: {
        findUnique: jest.fn().mockResolvedValue({
          ...invitation,
          status: 'ACCEPTED',
        }),
        update: jest.fn(),
      },
    });

    await expect(
      service.accept('invite-token-12345678901234567890123456789012', {
        password: 'strong-password-123',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('links a passwordless pending user in the invited organization', async () => {
    const { service, tx } = makeService();
    tx.user.findUnique.mockResolvedValue({
      id: 'user_pending',
      organizationId: 'org_1',
      passwordHash: null,
      firstName: null,
      lastName: null,
      phone: null,
    });
    tx.user.update.mockResolvedValue({
      id: 'user_pending',
      email: 'agent@example.com',
      firstName: null,
      lastName: null,
      userRole: 'DEVELOPER_SALES_AGENT',
    });

    await expect(
      service.accept('invite-token-12345678901234567890123456789012', {
        password: 'strong-password-123',
      }),
    ).resolves.toMatchObject({ accepted: true });
    expect(tx.user.create).not.toHaveBeenCalled();
    expect(tx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user_pending' },
        data: expect.objectContaining({
          passwordHash: 'password_hash',
          userRole: 'DEVELOPER_SALES_AGENT',
        }),
      }),
    );
  });
});

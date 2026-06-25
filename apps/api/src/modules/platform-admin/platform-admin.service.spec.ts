import { PlatformAdminService } from './platform-admin.service';

describe('PlatformAdminService invitations', () => {
  const platformUser = {
    userId: 'platform_user',
    organizationId: 'platform_org',
    organizationType: 'PLATFORM',
    role: 'platform_owner',
    permissions: ['organizations.verify'],
  };

  function makeService() {
    const prisma = {
      organization: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'org_1',
          type: 'DEVELOPER',
        }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      organizationInvitation: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        create: jest.fn().mockResolvedValue({
          id: 'invite_1',
          organizationId: 'org_1',
          email: 'agent@example.com',
          intendedRole: 'DEVELOPER_SALES_AGENT',
          status: 'PENDING',
          expiresAt: new Date('2030-01-01'),
          acceptedAt: null,
          createdAt: new Date('2026-01-01'),
        }),
      },
    } as any;
    const auditLogs = { record: jest.fn().mockResolvedValue(undefined) };
    const verifications = {};
    const hashService = {
      fingerprint: jest.fn().mockReturnValue('token_hash'),
    };

    return {
      service: new PlatformAdminService(
        prisma,
        auditLogs as any,
        verifications as any,
        hashService as any,
      ),
      prisma,
    };
  }

  it('creates a manual-share organization invitation link', async () => {
    const { service, prisma } = makeService();

    await expect(
      service.createInvitation(
        'org_1',
        {
          email: 'Agent@Example.com',
          intendedRole: 'DEVELOPER_SALES_AGENT',
          expiresInHours: 72,
        },
        platformUser,
      ),
    ).resolves.toMatchObject({
      email: 'agent@example.com',
      status: 'PENDING',
      delivery: 'MANUAL_LINK',
      inviteUrl: expect.stringMatching(/^http:\/\/localhost:3203\/invite\/.+/),
    });

    expect(prisma.organizationInvitation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'agent@example.com',
          intendedRole: 'DEVELOPER_SALES_AGENT',
          tokenHash: 'token_hash',
        }),
      }),
    );
  });

  it('allows inviting a pending passwordless user in the same organization', async () => {
    const { service, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue({
      id: 'user_pending',
      organizationId: 'org_1',
      passwordHash: null,
    });

    await expect(
      service.createInvitation(
        'org_1',
        {
          email: 'agent@example.com',
          intendedRole: 'DEVELOPER_SALES_AGENT',
          expiresInHours: 72,
        },
        platformUser,
      ),
    ).resolves.toMatchObject({ status: 'PENDING' });
  });
});

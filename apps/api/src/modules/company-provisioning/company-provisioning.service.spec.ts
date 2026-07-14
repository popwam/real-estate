import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CompanyProvisioningService } from './company-provisioning.service';

describe('CompanyProvisioningService organization list', () => {
  const platformOwner = {
    userId: 'platform_owner_user',
    organizationId: 'platform_org',
    organizationType: 'PLATFORM',
    role: 'platform_owner',
    permissions: ['platform.organizations.view'],
  };

  function organization(overrides: Record<string, unknown> = {}) {
    return {
      id: 'org_1',
      name: 'Example Organization',
      slug: 'example-organization',
      type: 'DEVELOPER',
      status: 'ACTIVE',
      country: null,
      city: null,
      plan: null,
      planExpiresAt: null,
      createdAt: new Date('2026-07-01T00:00:00.000Z'),
      updatedAt: new Date('2026-07-02T00:00:00.000Z'),
      subscription: null,
      verifications: [],
      _count: { users: 0, hrEmployees: 0, branches: 0 },
      ...overrides,
    };
  }

  function makeService(rows: Array<ReturnType<typeof organization>> = []) {
    const prisma = {
      organization: {
        findMany: jest.fn().mockResolvedValue(rows),
      },
    };
    const service = new CompanyProvisioningService(
      prisma as any,
      { record: jest.fn() } as any,
      {} as any,
    );

    return { service, prisma };
  }

  it('allows a platform owner and returns a shallow organization summary', async () => {
    const { service, prisma } = makeService([
      organization({
        subscription: { status: 'TRIAL', planName: 'Starter' },
        verifications: [{ status: 'APPROVED' }],
        _count: { users: 2, hrEmployees: 1, branches: 3 },
      }),
    ]);

    await expect(
      service.listPlatformOrganizations(platformOwner),
    ).resolves.toEqual([
      expect.objectContaining({
        id: 'org_1',
        organizationType: 'DEVELOPER',
        type: 'DEVELOPER',
        status: 'ACTIVE',
        verificationStatus: 'APPROVED',
        subscriptionStatus: 'TRIAL',
        planName: 'Starter',
        usersCount: 2,
        employeesCount: 1,
        officesCount: 3,
      }),
    ]);
    expect(prisma.organization.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          subscription: { select: { status: true, planName: true } },
          _count: expect.any(Object),
        }),
      }),
    );
    expect(prisma.organization.findMany.mock.calls[0]?.[0]).not.toHaveProperty(
      'include',
    );
  });

  it('returns an empty list for a clean database', async () => {
    const { service } = makeService();

    await expect(
      service.listPlatformOrganizations(platformOwner),
    ).resolves.toEqual([]);
  });

  it('rejects translated organization type labels before any database write', async () => {
    const { service } = makeService();
    await expect(
      service.createPlatformOrganization(
        { name: 'Example', organizationType: 'شركة وساطة عقارية' as never },
        { ...platformOwner, permissions: ['platform.organizations.manage'] },
      ),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'ORGANIZATION_TYPE_INVALID' }),
    });
  });

  it('does not crash when subscription, plan, and verification documents are absent', async () => {
    const { service } = makeService([organization()]);

    await expect(
      service.listPlatformOrganizations(platformOwner),
    ).resolves.toEqual([
      expect.objectContaining({
        subscriptionStatus: null,
        planName: null,
        plan: null,
        verificationStatus: null,
      }),
    ]);
  });

  it('accepts and returns the legacy APPROVED status', async () => {
    const { service, prisma } = makeService([
      organization({ status: 'APPROVED' }),
    ]);

    await expect(
      service.listPlatformOrganizations(platformOwner, { status: 'APPROVED' }),
    ).resolves.toEqual([expect.objectContaining({ status: 'APPROVED' })]);
    expect(prisma.organization.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'APPROVED' } }),
    );
  });

  it('returns 403 for a platform user without the list permission', async () => {
    const { service, prisma } = makeService();

    await expect(
      service.listPlatformOrganizations({ ...platformOwner, permissions: [] }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.organization.findMany).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid query parameters', async () => {
    const { service, prisma } = makeService();

    await expect(
      service.listPlatformOrganizations(platformOwner, {
        limit: 'not-a-number',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.organization.findMany).not.toHaveBeenCalled();
  });

  it('logs a Prisma known error safely with request context and returns a safe 500', async () => {
    const { service, prisma } = makeService();
    const databaseError = Object.assign(
      new Error(
        'failed at postgresql://db_user:db_password@db.example/popwam token=private-token',
      ),
      { name: 'PrismaClientKnownRequestError', code: 'P2021' },
    );
    prisma.organization.findMany.mockRejectedValue(databaseError);
    const logError = jest.fn();
    (service as any).logger.error = logError;

    const promise = service.listPlatformOrganizations(
      platformOwner,
      { status: 'ACTIVE' },
      { requestId: 'admin-web-request-123', route: '/platform/organizations' },
    );

    await expect(promise).rejects.toBeInstanceOf(InternalServerErrorException);
    await expect(promise).rejects.toMatchObject({
      response: {
        statusCode: 500,
        message: 'Internal server error',
        error: 'Internal Server Error',
      },
    });
    expect(logError).toHaveBeenCalledWith({
      event: 'platform_organizations_list_failed',
      requestId: 'admin-web-request-123',
      route: '/platform/organizations',
      userId: 'platform_owner_user',
      organizationId: 'platform_org',
      query: {
        type: null,
        status: 'ACTIVE',
        sort: 'createdAt',
        order: 'desc',
        limit: null,
        offset: null,
      },
      errorName: 'PrismaClientKnownRequestError',
      errorMessage: 'Prisma request failed.',
      prismaCode: 'P2021',
    });
    expect(JSON.stringify(logError.mock.calls)).not.toContain('db_password');
    expect(JSON.stringify(logError.mock.calls)).not.toContain('private-token');
  });
});

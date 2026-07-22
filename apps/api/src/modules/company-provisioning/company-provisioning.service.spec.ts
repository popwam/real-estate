import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { OrganizationType, UserRole } from '@prisma/client';
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

describe('CompanyProvisioningService platform settings and profile', () => {
  const platformOwner = {
    userId: 'platform_owner_user',
    organizationId: 'platform_org',
    organizationType: 'PLATFORM',
    role: 'platform_owner',
    permissions: ['platform.settings.view', 'platform.organizations.view'],
  };

  function makeService(profile: Record<string, unknown> | null) {
    const prisma = {
      organization: { findUnique: jest.fn().mockResolvedValue(profile) },
    };
    return {
      prisma,
      service: new CompanyProvisioningService(
        prisma as any,
        { record: jest.fn() } as any,
        {} as any,
      ),
    };
  }

  it('returns Platform Settings for a Platform Owner', async () => {
    const { service } = makeService(null);
    await expect(service.getPlatformSettings(platformOwner)).resolves.toEqual(
      expect.objectContaining({ sections: expect.any(Array) }),
    );
  });

  it('returns 403 when Platform Settings permission is missing', async () => {
    const { service } = makeService(null);
    await expect(
      service.getPlatformSettings({ ...platformOwner, permissions: [] }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns a resilient organization profile with nullable setup data', async () => {
    const { service, prisma } = makeService({
      id: 'org_1',
      name: 'Example',
      slug: 'example',
      profile: null,
      subscription: null,
      limits: null,
      branches: [],
      attendanceLocations: [],
      wifiRules: [],
      domainVerifications: [],
      users: [],
    });

    await expect(
      service.getPlatformOrganization('org_1', platformOwner),
    ).resolves.toEqual(
      expect.objectContaining({
        profile: null,
        subscription: null,
        limits: null,
        branches: [],
        companyRoleTemplates: [],
      }),
    );
    expect(
      prisma.organization.findUnique.mock.calls[0][0].include,
    ).not.toHaveProperty('companyRoleTemplates');
  });

  it('returns 404 when the organization does not exist', async () => {
    const { service } = makeService(null);
    await expect(
      service.getPlatformOrganization('missing', platformOwner),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns 403 before querying an organization when permission is missing', async () => {
    const { service, prisma } = makeService(null);
    await expect(
      service.getPlatformOrganization('org_1', {
        ...platformOwner,
        permissions: ['platform.settings.view'],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.organization.findUnique).not.toHaveBeenCalled();
  });
});

describe('CompanyProvisioningService first administrator', () => {
  const platformAdmin = {
    userId: 'platform_admin_user',
    organizationId: 'platform_org',
    organizationType: 'PLATFORM',
    role: 'platform_admin',
    permissions: ['platform.organizations.manage'],
  };

  function setup(type: OrganizationType = OrganizationType.DEVELOPER) {
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([{ id: 'company_1' }]),
      user: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'user_1', ...data })),
      },
      hrEmployee: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue({ id: 'employee_1' }),
      },
    };
    const prisma = {
      organization: {
        findUnique: jest.fn().mockResolvedValue({ id: 'company_1', type }),
      },
      user: { findUnique: jest.fn().mockResolvedValue(null) },
      role: {
        upsert: jest.fn().mockResolvedValue({ id: 'role_1', name: 'company_owner' }),
      },
      permission: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
        findMany: jest.fn().mockResolvedValue([{ id: 'permission_1' }]),
      },
      rolePermission: { createMany: jest.fn().mockResolvedValue({ count: 1 }) },
      $transaction: jest.fn().mockImplementation((callback) => callback(tx)),
    };
    const audit = { record: jest.fn().mockResolvedValue(undefined) };
    const hash = { hash: jest.fn().mockResolvedValue('password_hash') };
    const service = new CompanyProvisioningService(prisma as any, audit as any, hash as any);
    jest.spyOn(service as any, 'buildActivationCheck').mockResolvedValue({
      canActivate: true,
      missingRequirements: [],
      blockingDocuments: [],
      blockingOwners: [],
      blockingSubscriptionReasons: [],
      blockingOfficeReasons: [],
      blockingAdminReasons: [],
      requiredDocuments: [],
    });
    return { service, prisma, tx, audit, hash };
  }

  const input = {
    name: 'Company Owner',
    email: 'OWNER@EXAMPLE.TEST',
    phoneCountry: 'MD',
    phone: '69123456',
    temporaryPassword: 'temporary-password-123',
    roleTemplate: 'company_owner' as const,
  };

  it('creates the user in the requested organization with the template role and forced password change', async () => {
    const { service, prisma, tx, audit, hash } = setup();

    const response = await service.createOrganizationFirstAdmin('company_1', input, platformAdmin);
    expect(response).toEqual(
      expect.objectContaining({
        user: expect.objectContaining({ id: 'user_1', organizationId: 'company_1', roleId: 'role_1' }),
        activationCheck: expect.objectContaining({ canActivate: true }),
      }),
    );
    expect(response.user).not.toHaveProperty('passwordHash');

    expect(tx.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: 'company_1',
        roleId: 'role_1',
        email: 'owner@example.test',
        passwordHash: 'password_hash',
        mustChangePassword: true,
        userRole: UserRole.DEVELOPER_OWNER,
      }),
    });
    expect(hash.hash).toHaveBeenCalledWith(input.temporaryPassword);
    expect(tx.hrEmployee.create).toHaveBeenCalledWith({ data: expect.objectContaining({ organizationId: 'company_1', userId: 'user_1' }) });
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({
      action: 'platform.organization.first_admin_created',
      entityId: 'user_1',
      organizationId: 'company_1',
      actor: platformAdmin,
    }));
    expect(prisma.$transaction.mock.invocationCallOrder[0]).toBeLessThan(audit.record.mock.invocationCallOrder[0]);
    expect(JSON.stringify(audit.record.mock.calls)).not.toContain(input.temporaryPassword);
  });

  it('blocks creation when the organization already has a qualified owner or admin', async () => {
    const { service, tx } = setup(OrganizationType.BROKERAGE);
    tx.user.findFirst.mockResolvedValue({ id: 'existing_admin' });

    const error = await service.createOrganizationFirstAdmin('company_1', input, platformAdmin).catch((caught) => caught);
    expect(error).toBeInstanceOf(ConflictException);
    expect(error.getResponse()).toEqual(expect.objectContaining({ code: 'FIRST_ADMIN_ALREADY_EXISTS' }));
    expect(tx.user.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        organizationId: 'company_1',
        userRole: { in: [UserRole.BROKERAGE_OWNER, UserRole.BROKERAGE_ADMIN] },
      }),
    }));
    expect(tx.user.create).not.toHaveBeenCalled();
  });

  it('hashes and provisions role permissions before opening the short transaction', async () => {
    const { service, prisma, tx, hash } = setup();

    await service.createOrganizationFirstAdmin('company_1', input, platformAdmin);

    expect(hash.hash.mock.invocationCallOrder[0]).toBeLessThan(prisma.$transaction.mock.invocationCallOrder[0]);
    expect(prisma.rolePermission.createMany.mock.invocationCallOrder[0]).toBeLessThan(
      prisma.$transaction.mock.invocationCallOrder[0],
    );
    expect(prisma.permission.createMany).toHaveBeenCalledTimes(1);
    expect(prisma.permission.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.rolePermission.createMany).toHaveBeenCalledTimes(1);
    expect(prisma.$transaction.mock.calls[0]).toHaveLength(1);
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('exposes safe opt-in stage timings for tests without production timing logs', async () => {
    const { service } = setup();
    const timings: Array<{ stage: string; durationMs: number }> = [];

    await service.createOrganizationFirstAdmin('company_1', input, platformAdmin, {
      requestId: 'timing-test-request',
      onTiming: (stage, durationMs) => timings.push({ stage, durationMs }),
    });

    expect(timings.map((timing) => timing.stage)).toEqual([
      'validation',
      'hash',
      'roleProvisioning',
      'dbTransaction',
      'audit',
    ]);
    expect(timings.every((timing) => Number.isFinite(timing.durationMs) && timing.durationMs >= 0)).toBe(true);
  });

  it.each([
    [OrganizationType.DEVELOPER, 'company_owner', UserRole.DEVELOPER_OWNER],
    [OrganizationType.DEVELOPER, 'company_admin', UserRole.DEVELOPER_ADMIN],
    [OrganizationType.BROKERAGE, 'company_owner', UserRole.BROKERAGE_OWNER],
    [OrganizationType.BROKERAGE, 'company_admin', UserRole.BROKERAGE_ADMIN],
    [OrganizationType.INDIVIDUAL_BROKER, 'company_owner', UserRole.INDIVIDUAL_BROKER],
  ] as const)('maps %s / %s to %s', async (type, roleTemplate, expectedRole) => {
    const { service, tx } = setup(type);

    await service.createOrganizationFirstAdmin('company_1', { ...input, roleTemplate }, platformAdmin);

    expect(tx.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userRole: expectedRole }),
    });
  });

  it('returns a duplicate-email conflict before hashing or opening a transaction', async () => {
    const { service, prisma, hash } = setup();
    prisma.user.findUnique.mockResolvedValue({ id: 'other_user' });

    const error = await service.createOrganizationFirstAdmin('company_1', input, platformAdmin).catch((caught) => caught);

    expect(error).toBeInstanceOf(ConflictException);
    expect(error.getResponse()).toEqual(expect.objectContaining({ code: 'DUPLICATE_EMAIL' }));
    expect(hash.hash).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('maps a raced unique email violation to a safe 409 business error', async () => {
    const { service, prisma } = setup();
    prisma.$transaction.mockRejectedValue({ code: 'P2002', meta: { target: ['email'] } });

    const error = await service.createOrganizationFirstAdmin('company_1', input, platformAdmin).catch((caught) => caught);

    expect(error).toBeInstanceOf(ConflictException);
    expect(error.getResponse()).toEqual(expect.objectContaining({ code: 'DUPLICATE_EMAIL' }));
  });

  it('maps P2028 to a retryable safe response while retaining request context and cause', async () => {
    const { service, prisma } = setup();
    const prismaError = Object.assign(new Error('raw transaction detail'), {
      name: 'PrismaClientKnownRequestError',
      code: 'P2028',
    });
    prisma.$transaction.mockRejectedValue(prismaError);

    const error = await service.createOrganizationFirstAdmin(
      'company_1',
      input,
      platformAdmin,
      { requestId: 'request-first-admin-1' },
    ).catch((caught) => caught);

    expect(error).toBeInstanceOf(ServiceUnavailableException);
    expect(error.getResponse()).toEqual(expect.objectContaining({
      code: 'FIRST_ADMIN_TEMPORARILY_UNAVAILABLE',
      requestId: 'request-first-admin-1',
    }));
    expect(error.cause).toBe(prismaError);
  });

  it('serializes concurrent requests so only one admin can be created', async () => {
    const { service, prisma, tx, audit } = setup();
    let adminExists = false;
    let transactionTail = Promise.resolve();
    tx.user.findFirst.mockImplementation(() => Promise.resolve(adminExists ? { id: 'user_1' } : null));
    tx.user.create.mockImplementation(({ data }) => {
      adminExists = true;
      return Promise.resolve({ id: 'user_1', ...data });
    });
    prisma.$transaction.mockImplementation((callback) => {
      const result = transactionTail.then(() => callback(tx));
      transactionTail = result.then(() => undefined, () => undefined);
      return result;
    });

    const results = await Promise.allSettled([
      service.createOrganizationFirstAdmin('company_1', input, platformAdmin),
      service.createOrganizationFirstAdmin('company_1', { ...input, email: 'second@example.test' }, platformAdmin),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    const rejection = results.find((result): result is PromiseRejectedResult => result.status === 'rejected');
    expect(rejection?.reason).toBeInstanceOf(ConflictException);
    expect(rejection?.reason.getResponse()).toEqual(expect.objectContaining({ code: 'FIRST_ADMIN_ALREADY_EXISTS' }));
    expect(tx.user.create).toHaveBeenCalledTimes(1);
    expect(audit.record).toHaveBeenCalledTimes(1);
  });

  it('allows only the owner template for an individual broker', async () => {
    const { service } = setup(OrganizationType.INDIVIDUAL_BROKER);
    await expect(service.createOrganizationFirstAdmin('company_1', { ...input, roleTemplate: 'company_admin' }, platformAdmin))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects Platform organizations and non-owner/admin platform actors', async () => {
    const platformOrganization = setup(OrganizationType.PLATFORM);
    await expect(platformOrganization.service.createOrganizationFirstAdmin('company_1', input, platformAdmin))
      .rejects.toBeInstanceOf(BadRequestException);

    const developer = setup();
    await expect(developer.service.createOrganizationFirstAdmin('company_1', input, { ...platformAdmin, role: 'platform_support' }))
      .rejects.toBeInstanceOf(ForbiddenException);
  });
});

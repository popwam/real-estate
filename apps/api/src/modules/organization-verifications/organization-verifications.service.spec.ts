import { ForbiddenException } from '@nestjs/common';
import { OrganizationVerificationsService } from './organization-verifications.service';

describe('OrganizationVerificationsService', () => {
  const developerOwner = {
    userId: 'user_dev',
    organizationId: 'org_dev',
    organizationType: 'DEVELOPER',
    role: 'developer_owner',
    permissions: ['organizations.update_own'],
  };
  const platformOwner = {
    userId: 'user_platform',
    organizationId: 'org_platform',
    organizationType: 'PLATFORM',
    role: 'platform_owner',
    permissions: ['organizations.verify'],
  };

  const makeService = (overrides: Record<string, unknown> = {}) => {
    const prisma = {
      organization: {
        findUnique: jest.fn().mockResolvedValue({ id: 'org_dev' }),
        update: jest.fn().mockResolvedValue({ id: 'org_dev' }),
      },
      uploadedFile: {
        findUnique: jest.fn().mockResolvedValue({ id: 'file_1', organizationId: 'org_dev' }),
      },
      organizationVerification: {
        create: jest.fn().mockResolvedValue({
          id: 'verification_1',
          organizationId: 'org_dev',
          documentType: 'TAX_CARD',
        }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest.fn(async (callback) => callback(prisma)),
      ...overrides,
    } as any;
    const auditLogs = { record: jest.fn().mockResolvedValue(undefined) };

    return {
      service: new OrganizationVerificationsService(prisma, auditLogs as any),
      prisma,
      auditLogs,
    };
  };

  it('allows organization owner to submit own verification', async () => {
    const { service } = makeService();

    await expect(
      service.submit(
        'org_dev',
        {
          documents: [
            {
              documentType: 'TAX_CARD',
              uploadedFileId: 'file_1',
            },
          ],
        },
        developerOwner,
      ),
    ).resolves.toMatchObject({
      organization: { id: 'org_dev' },
      documents: [{ documentType: 'TAX_CARD' }],
    });
  });

  it('blocks organization owner from submitting another organization', async () => {
    const { service } = makeService();

    await expect(
      service.submit(
        'org_other',
        {
          documents: [
            {
              documentType: 'TAX_CARD',
              uploadedFileId: 'file_1',
            },
          ],
        },
        developerOwner,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('requires platform permission for pending queue', async () => {
    const { service } = makeService();

    await expect(service.findPending(developerOwner)).rejects.toThrow(
      ForbiddenException,
    );
    await expect(service.findPending(platformOwner)).resolves.toEqual([]);
  });
});

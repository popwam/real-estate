import {
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import {
  OrganizationDocumentType,
  OrganizationLegalForm,
  OrganizationType,
} from '@prisma/client';
import { CompanyProvisioningService } from './company-provisioning.service';

describe('CompanyProvisioningService verification policies', () => {
  const actor = {
    userId: 'owner_1',
    organizationId: 'platform_1',
    organizationType: 'PLATFORM',
    role: 'platform_owner',
    permissions: ['platform.verification_policies.manage'],
  };
  const developerType = {
    id: 'dynamic_developer',
    code: 'PROPERTY_MANAGER',
    legacyOrganizationType: OrganizationType.DEVELOPER,
    names: { en: 'Property manager' },
    isActive: true,
    isArchived: false,
    sortOrder: 10,
  };
  const customType = {
    ...developerType,
    id: 'dynamic_custom',
    code: 'VALUER',
    legacyOrganizationType: null,
  };
  const secondDeveloperType = {
    ...developerType,
    id: 'dynamic_developer_2',
    code: 'ASSET_MANAGER',
  };

  function makeService() {
    const types = new Map(
      [developerType, customType, secondDeveloperType].map((type) => [type.id, type]),
    );
    const prisma: any = {
      supportedOrganizationType: {
        findUnique: jest.fn(({ where }: any) => Promise.resolve(types.get(where.id) ?? null)),
      },
      requiredDocumentPolicy: {
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn(),
        create: jest.fn(({ data }: any) => Promise.resolve({
          id: `policy_${data.supportedOrganizationTypeId}`,
          ...data,
          supportedOrganizationType: types.get(data.supportedOrganizationTypeId) ?? null,
        })),
        update: jest.fn(({ data }: any) => Promise.resolve({
          id: 'policy_1',
          countryCode: 'EG',
          legalForm: null,
          documentType: OrganizationDocumentType.TAX_CARD,
          isArchived: false,
          ...data,
          supportedOrganizationType: types.get(data.supportedOrganizationTypeId) ?? null,
        })),
      },
    };
    prisma.$transaction = jest.fn((callback: (tx: any) => unknown) => callback(prisma));
    const audit = { record: jest.fn().mockResolvedValue(undefined) };
    return {
      prisma,
      service: new CompanyProvisioningService(prisma, audit as any, {} as any),
    };
  }

  const createInput = {
    countryCode: 'eg',
    supportedOrganizationTypeId: developerType.id,
    documentType: OrganizationDocumentType.TAX_CARD,
  };

  it('creates from a dynamic type and derives its legacy type without organizationType input', async () => {
    const { service, prisma } = makeService();
    await service.createRequiredDocumentPolicy(createInput, actor);
    expect(prisma.requiredDocumentPolicy.create.mock.calls[0][0].data).toEqual(
      expect.objectContaining({
        supportedOrganizationTypeId: developerType.id,
        organizationType: OrganizationType.DEVELOPER,
      }),
    );
  });

  it('stores a null legacy type for a custom dynamic type', async () => {
    const { service, prisma } = makeService();
    await service.createRequiredDocumentPolicy(
      { ...createInput, supportedOrganizationTypeId: customType.id },
      actor,
    );
    expect(prisma.requiredDocumentPolicy.create.mock.calls[0][0].data.organizationType).toBeNull();
  });

  it('rejects PLATFORM by code or legacy type', async () => {
    const { service, prisma } = makeService();
    prisma.supportedOrganizationType.findUnique.mockResolvedValue({
      ...developerType,
      code: 'PLATFORM',
      legacyOrganizationType: null,
    });
    await expect(service.createRequiredDocumentPolicy(createInput, actor)).rejects.toBeInstanceOf(BadRequestException);
  });

  it.each([null, OrganizationLegalForm.LLC])(
    'returns 409 for a duplicate with legalForm=%s',
    async (legalForm) => {
      const { service, prisma } = makeService();
      prisma.requiredDocumentPolicy.findFirst.mockResolvedValue({ id: 'duplicate' });
      await expect(
        service.createRequiredDocumentPolicy({ ...createInput, legalForm }, actor),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'VERIFICATION_POLICY_ALREADY_EXISTS' }),
      });
    },
  );

  it('allows different dynamic types sharing the same legacy OrganizationType', async () => {
    const { service, prisma } = makeService();
    await service.createRequiredDocumentPolicy(createInput, actor);
    await service.createRequiredDocumentPolicy(
      { ...createInput, supportedOrganizationTypeId: secondDeveloperType.id },
      actor,
    );
    expect(prisma.requiredDocumentPolicy.create).toHaveBeenCalledTimes(2);
    expect(prisma.requiredDocumentPolicy.create.mock.calls.map((call: any[]) => call[0].data.organizationType)).toEqual([
      OrganizationType.DEVELOPER,
      OrganizationType.DEVELOPER,
    ]);
  });

  it('allows replacement after the prior policy is archived', async () => {
    const { service, prisma } = makeService();
    prisma.requiredDocumentPolicy.findFirst.mockResolvedValue(null);
    await expect(service.createRequiredDocumentPolicy(createInput, actor)).resolves.toEqual(
      expect.objectContaining({ supportedOrganizationTypeId: developerType.id }),
    );
  });

  it('recalculates legacy organizationType when the dynamic type changes', async () => {
    const { service, prisma } = makeService();
    prisma.supportedOrganizationType.findUnique.mockResolvedValueOnce({
      ...secondDeveloperType,
      legacyOrganizationType: OrganizationType.BROKERAGE,
    });
    prisma.requiredDocumentPolicy.findUnique.mockResolvedValue({
      id: 'policy_1',
      countryCode: 'EG',
      supportedOrganizationTypeId: developerType.id,
      organizationType: OrganizationType.DEVELOPER,
      legalForm: null,
      documentType: OrganizationDocumentType.TAX_CARD,
      isArchived: false,
    });
    await service.updateRequiredDocumentPolicy(
      'policy_1',
      {
        supportedOrganizationTypeId: secondDeveloperType.id,
        organizationType: OrganizationType.DEVELOPER,
      },
      actor,
    );
    expect(prisma.requiredDocumentPolicy.update.mock.calls[0][0].data).toEqual(
      expect.objectContaining({
        supportedOrganizationTypeId: secondDeveloperType.id,
        organizationType: OrganizationType.BROKERAGE,
      }),
    );
  });

  it('maps a database uniqueness race to Conflict 409 instead of 500', async () => {
    const { service, prisma } = makeService();
    prisma.requiredDocumentPolicy.create.mockRejectedValue({ code: 'P2002' });
    await expect(service.createRequiredDocumentPolicy(createInput, actor)).rejects.toBeInstanceOf(ConflictException);
  });
});

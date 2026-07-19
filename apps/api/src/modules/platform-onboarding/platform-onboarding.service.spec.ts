import { BadRequestException } from '@nestjs/common';
import { OrganizationOnboardingStatus, OrganizationType } from '@prisma/client';
import { PlatformOnboardingService } from './platform-onboarding.service';

describe('PlatformOnboardingService', () => {
  const actor = {
    userId: 'owner_1',
    organizationId: 'platform_1',
    organizationType: 'PLATFORM',
    role: 'platform_owner',
    permissions: [],
    tokenKind: 'access' as const,
  };
  const type = {
    id: 'type_1',
    code: 'PROPERTY_MANAGER',
    legacyOrganizationType: OrganizationType.DEVELOPER,
    isActive: true,
    isArchived: false,
    allowedCountryCodes: [],
    requiredFieldCodes: [],
    names: {},
    descriptions: {},
    iconObjectKey: null,
    allowedLegalForms: [],
    isIndividual: false,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const session = {
    id: 'session_1',
    countryCode: 'EG',
    supportedOrganizationTypeId: type.id,
    status: OrganizationOnboardingStatus.READY_TO_CREATE,
    legalForm: null,
    operationalData: {},
    completedFields: [],
    missingFields: [],
    conflictFields: [],
    createdById: actor.userId,
    organizationId: null,
    expiresAt: new Date(Date.now() + 60_000),
    completedAt: null,
    cancelledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    supportedOrganizationType: type,
    documents: [],
    fieldEvidence: [],
  };
  const prisma = {
    supportedOrganizationType: {
      findUnique: jest.fn().mockResolvedValue(type),
    },
    requiredDocumentPolicy: { findMany: jest.fn().mockResolvedValue([]) },
    organizationOnboardingSession: {
      create: jest.fn().mockResolvedValue(session),
      findUnique: jest.fn().mockResolvedValue(session),
    },
  };
  const audit = { record: jest.fn().mockResolvedValue(undefined) };
  const service = new PlatformOnboardingService(
    prisma as any,
    {} as any,
    {} as any,
    {} as any,
    audit as any,
  );

  beforeEach(() => jest.clearAllMocks());

  it('does not inject default documents when no policy exists', async () => {
    await service.createDraft(
      {
        countryCode: 'eg',
        supportedOrganizationTypeId: type.id,
        operationalData: { displayName: 'Test' },
      },
      actor,
    );
    expect(prisma.requiredDocumentPolicy.findMany).toHaveBeenCalled();
    expect(prisma.organizationOnboardingSession.create).toHaveBeenCalledWith(
      expect.objectContaining({
        // Jest asymmetric matchers are intentionally untyped at this boundary.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining({
          status: OrganizationOnboardingStatus.READY_TO_CREATE,
          missingFields: [],
        }),
      }),
    );
  });

  it('rejects PLATFORM as a creatable supported organization type', async () => {
    prisma.supportedOrganizationType.findUnique.mockResolvedValueOnce({
      ...type,
      legacyOrganizationType: OrganizationType.PLATFORM,
    });
    await expect(
      service.createDraft(
        { countryCode: 'EG', supportedOrganizationTypeId: type.id },
        actor,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('matches policies by supportedOrganizationTypeId before legacy fallback', async () => {
    const dynamicPolicy = { id: 'dynamic_policy' };
    prisma.requiredDocumentPolicy.findMany.mockResolvedValueOnce([dynamicPolicy]);
    await expect(
      (service as any).matchingPolicies(
        'EG',
        type.id,
        'LLC',
        OrganizationType.DEVELOPER,
      ),
    ).resolves.toEqual([dynamicPolicy]);
    expect(prisma.requiredDocumentPolicy.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.requiredDocumentPolicy.findMany.mock.calls[0][0].where).toEqual(
      expect.objectContaining({
        supportedOrganizationTypeId: type.id,
        legalForm: 'LLC',
        isActive: true,
        isArchived: false,
      }),
    );
  });

  it('uses legacy matching only for unlinked old policies', async () => {
    const legacyPolicy = { id: 'legacy_policy' };
    prisma.requiredDocumentPolicy.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([legacyPolicy]);
    await expect(
      (service as any).matchingPolicies(
        'EG',
        type.id,
        'LLC',
        OrganizationType.DEVELOPER,
      ),
    ).resolves.toEqual([legacyPolicy]);
    expect(prisma.requiredDocumentPolicy.findMany.mock.calls[2][0].where).toEqual(
      expect.objectContaining({
        supportedOrganizationTypeId: null,
        organizationType: OrganizationType.DEVELOPER,
        legalForm: 'LLC',
      }),
    );
  });
});

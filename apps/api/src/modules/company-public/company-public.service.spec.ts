import { CompanyPublicService } from './company-public.service';

describe('CompanyPublicService extracted-field review', () => {
  const user = {
    userId: 'owner_1',
    organizationId: 'platform_1',
    organizationType: 'PLATFORM',
    role: 'platform_owner',
    permissions: ['platform.organizations.manage'],
  } as any;

  function setup() {
    const document = {
      id: 'document_1',
      organizationId: 'org_1',
      status: 'PENDING_REVIEW',
      extractedData: { result: { legalName: 'Example Brokerage', taxNumber: '123456789' } },
    };
    const prisma = {
      organization: { findUnique: jest.fn().mockResolvedValue({ id: 'org_1' }) },
      organizationDocument: {
        findFirst: jest.fn().mockResolvedValue(document),
        update: jest.fn().mockResolvedValue(document),
      },
      organizationProfile: {
        upsert: jest.fn().mockResolvedValue({ legalName: 'Example Brokerage' }),
      },
    };
    const auditLogs = { record: jest.fn().mockResolvedValue(undefined) };
    return {
      prisma,
      auditLogs,
      service: new CompanyPublicService(prisma as any, auditLogs as any, {} as any),
    };
  }

  it('applies selected fields to the draft profile without approving the document', async () => {
    const { service, prisma, auditLogs } = setup();
    const result = await service.reviewExtractedFields(
      'org_1',
      'document_1',
      { fields: ['legalName'], action: 'APPLY' },
      user,
    );

    expect(prisma.organizationProfile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: { legalName: 'Example Brokerage' } }),
    );
    expect(prisma.organizationDocument.update).not.toHaveBeenCalled();
    expect(result.documentStatus).toBe('PENDING_REVIEW');
    expect(auditLogs.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'organization.document.extracted_fields_applied',
        metadata: { fields: ['legalName'], documentStatusUnchanged: true },
      }),
    );
  });

  it('requires explicit confirmation before applying sensitive identifiers', async () => {
    const { service, prisma } = setup();
    await expect(
      service.reviewExtractedFields(
        'org_1',
        'document_1',
        { fields: ['taxNumber'], action: 'APPLY' },
        user,
      ),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: 'SENSITIVE_EXTRACTED_FIELDS_CONFIRMATION_REQUIRED',
      }),
    });
    expect(prisma.organizationProfile.upsert).not.toHaveBeenCalled();
  });
});

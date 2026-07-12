import { ConflictException } from '@nestjs/common';
import {
  HrApplicantAiReviewStatus,
  HrApplicantDocumentStatus,
  HrApplicantDocumentType,
  HrApplicantSource,
  HrApplicantStatus,
} from '@prisma/client';
import { HrRecruitmentService } from './hr-recruitment.service';

describe('HrRecruitmentService', () => {
  const auditLogs = { record: jest.fn() };
  const storage = { putObject: jest.fn() };
  const hrService = { createEmployee: jest.fn() };
  let prisma: any;
  let service: HrRecruitmentService;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.HR_APPLICANT_AI_PROVIDER_KEY;
    delete process.env.HR_APPLICANT_OCR_PROVIDER_KEY;
    prisma = {
      organization: { findFirst: jest.fn() },
      hrJobOpening: { findMany: jest.fn(), findFirst: jest.fn() },
      hrApplicant: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      hrApplicantDocument: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      hrApplicantInterview: { count: jest.fn() },
      hrApplicantOffer: { count: jest.fn() },
      uploadedFile: { create: jest.fn() },
      hrRecruitmentSettings: { upsert: jest.fn() },
      $transaction: jest.fn(),
    };
    service = new HrRecruitmentService(prisma, storage as any, auditLogs as any, hrService as any);
  });

  it('creates a public applicant scoped to the company without exposing document URLs', async () => {
    prisma.organization.findFirst.mockResolvedValue({ id: 'org_1', slug: 'demo', name: 'Demo' });
    prisma.hrApplicant.create.mockResolvedValue({
      id: 'app_1',
      organizationId: 'org_1',
      fullName: 'Mona Applicant',
      status: HrApplicantStatus.PENDING_REVIEW,
      source: HrApplicantSource.PUBLIC_SITE,
      submittedAt: new Date('2026-07-12T10:00:00.000Z'),
      documents: [],
      interviews: [],
      offers: [],
    });

    const result = await service.createPublicApplication(
      'demo',
      { fullName: 'Mona Applicant', phoneCountry: 'EG', consent: 'true' },
      {},
    );

    expect(prisma.hrApplicant.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: 'org_1',
          fullName: 'Mona Applicant',
          source: HrApplicantSource.PUBLIC_SITE,
          status: HrApplicantStatus.PENDING_REVIEW,
        }),
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: 'app_1',
        status: HrApplicantStatus.PENDING_REVIEW,
      }),
    );
    expect(result).not.toHaveProperty('documents');
  });

  it('marks applicant extraction as manual review when no OCR provider is configured', async () => {
    prisma.hrApplicantDocument.findFirst.mockResolvedValue({
      id: 'doc_1',
      applicantId: 'app_1',
      organizationId: 'org_1',
      documentType: HrApplicantDocumentType.CV,
      status: HrApplicantDocumentStatus.PENDING_REVIEW,
      extractionStatus: HrApplicantAiReviewStatus.NOT_REQUESTED,
      file: { id: 'file_1' },
    });
    prisma.hrApplicantDocument.update.mockResolvedValue({
      id: 'doc_1',
      applicantId: 'app_1',
      organizationId: 'org_1',
      documentType: HrApplicantDocumentType.CV,
      status: HrApplicantDocumentStatus.PENDING_REVIEW,
      extractionStatus: HrApplicantAiReviewStatus.NEEDS_MANUAL_REVIEW,
      extractedData: { code: 'OCR_PROVIDER_NOT_CONFIGURED' },
    });

    const result = await service.extractApplicantDocument(
      {
        userId: 'user_1',
        role: 'hr_manager',
        organizationId: 'org_1',
        organizationType: 'BROKERAGE',
        permissions: ['hr.recruitment.documents.manage'],
      } as any,
      'app_1',
      'doc_1',
    );

    expect(prisma.hrApplicantDocument.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          extractionStatus: HrApplicantAiReviewStatus.NEEDS_MANUAL_REVIEW,
        }),
      }),
    );
    expect(result.extractionStatus).toBe(HrApplicantAiReviewStatus.NEEDS_MANUAL_REVIEW);
  });

  it('blocks duplicate conversion to employee', async () => {
    prisma.hrApplicant.findUnique.mockResolvedValue({
      id: 'app_1',
      organizationId: 'org_1',
      fullName: 'Mona Applicant',
      status: HrApplicantStatus.CONVERTED_TO_EMPLOYEE,
      convertedEmployeeId: 'emp_1',
      documents: [],
      interviews: [],
      offers: [],
    });

    await expect(
      service.convertToEmployee(
        {
          userId: 'user_1',
          role: 'hr_manager',
          organizationId: 'org_1',
          organizationType: 'BROKERAGE',
          permissions: ['hr.recruitment.convert_to_employee'],
        } as any,
        'app_1',
        {},
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(hrService.createEmployee).not.toHaveBeenCalled();
  });
});

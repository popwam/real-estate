import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  HrApplicantAiReviewStatus,
  HrApplicantDocumentStatus,
  HrApplicantDocumentType,
  HrApplicantInterviewStatus,
  HrApplicantInterviewType,
  HrApplicantOfferStatus,
  HrApplicantSource,
  HrApplicantStatus,
  HrEmploymentType,
  HrJobOpeningStatus,
  HrPaymentFrequency,
  HrWorkScheduleType,
  Prisma,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { normalizeOptionalPhoneOrThrow } from '../../common/phone-normalization';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../database/prisma.service';
import { FileStorageService } from '../files/file-storage.service';
import { HrService } from './hr.service';

type AnyRecord = Record<string, unknown>;
type FileLike = { buffer?: Buffer; size?: number; mimetype?: string; originalname?: string };

const PLATFORM_ROLES = new Set(['platform_owner', 'platform_admin', 'platform_hr']);
const RECRUITMENT_PERMISSIONS = [
  'hr.recruitment.view',
  'hr.recruitment.manage',
  'hr.recruitment.applicants.view',
  'hr.recruitment.applicants.manage',
  'hr.recruitment.documents.view',
  'hr.recruitment.documents.manage',
  'hr.recruitment.interviews.manage',
  'hr.recruitment.offers.manage',
  'hr.recruitment.convert_to_employee',
  'hr.manage',
];

@Injectable()
export class HrRecruitmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: FileStorageService,
    private readonly auditLogs: AuditLogsService,
    private readonly hrService: HrService,
  ) {}

  async dashboard(user: AuthenticatedRequestUser, requestedOrganizationId?: string) {
    const organizationId = this.resolveOrganizationId(user, requestedOrganizationId);
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalApplicants,
      pendingReview,
      documentsMissing,
      aiReviewNeeded,
      shortlisted,
      interviewsToday,
      offersPending,
      convertedThisMonth,
      rejected,
    ] = await Promise.all([
      this.prisma.hrApplicant.count({ where: { organizationId } }),
      this.prisma.hrApplicant.count({ where: { organizationId, status: HrApplicantStatus.PENDING_REVIEW } }),
      this.prisma.hrApplicant.count({ where: { organizationId, status: HrApplicantStatus.DOCUMENTS_MISSING } }),
      this.prisma.hrApplicant.count({
        where: {
          organizationId,
          OR: [
            { status: HrApplicantStatus.AI_REVIEW_NEEDED },
            { aiReviewStatus: HrApplicantAiReviewStatus.NEEDS_MANUAL_REVIEW },
          ],
        },
      }),
      this.prisma.hrApplicant.count({ where: { organizationId, status: HrApplicantStatus.SHORTLISTED } }),
      this.prisma.hrApplicantInterview.count({
        where: { organizationId, scheduledAt: { gte: startOfToday, lte: endOfToday }, status: HrApplicantInterviewStatus.SCHEDULED },
      }),
      this.prisma.hrApplicantOffer.count({ where: { organizationId, status: HrApplicantOfferStatus.SENT } }),
      this.prisma.hrApplicant.count({
        where: { organizationId, status: HrApplicantStatus.CONVERTED_TO_EMPLOYEE, updatedAt: { gte: startOfMonth } },
      }),
      this.prisma.hrApplicant.count({ where: { organizationId, status: HrApplicantStatus.REJECTED } }),
    ]);

    return {
      totalApplicants,
      pendingReview,
      documentsMissing,
      aiReviewNeeded,
      shortlisted,
      interviewsToday,
      offersPending,
      convertedThisMonth,
      rejected,
    };
  }

  async listJobs(user: AuthenticatedRequestUser, query: Record<string, string | undefined>) {
    const organizationId = this.resolveOrganizationId(user, query.organizationId);
    const where: Prisma.HrJobOpeningWhereInput = { organizationId };
    if (query.status) where.status = this.enumValue(HrJobOpeningStatus, query.status, 'status');
    if (query.publicApplyEnabled) where.publicApplyEnabled = query.publicApplyEnabled === 'true';
    if (query.search) where.title = { contains: query.search, mode: 'insensitive' };
    return this.prisma.hrJobOpening.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { applicants: true } } },
    });
  }

  async createJob(user: AuthenticatedRequestUser, body: AnyRecord) {
    const organizationId = this.resolveOrganizationId(user, this.string(body.organizationId));
    const title = this.string(body.title);
    if (!title) throw new BadRequestException('title is required.');
    const job = await this.prisma.hrJobOpening.create({
      data: {
        organizationId,
        title,
        localizedTitle: this.json(body.localizedTitle),
        departmentId: this.string(body.departmentId),
        positionId: this.string(body.positionId),
        branchId: this.string(body.branchId),
        employmentType: this.optionalEnum(HrEmploymentType, body.employmentType),
        workMode: this.optionalEnum(HrWorkScheduleType, body.workMode),
        description: this.json(body.description),
        requirements: this.json(body.requirements),
        status: this.optionalEnum(HrJobOpeningStatus, body.status) ?? HrJobOpeningStatus.DRAFT,
        publicApplyEnabled: Boolean(body.publicApplyEnabled),
        createdById: user.userId,
      },
    });
    await this.auditLogs.record({ action: 'hr.recruitment.job.created', entityType: 'HrJobOpening', entityId: job.id, organizationId, actor: user });
    return job;
  }

  async getJob(user: AuthenticatedRequestUser, id: string) {
    const job = await this.prisma.hrJobOpening.findUnique({
      where: { id },
      include: { _count: { select: { applicants: true } } },
    });
    if (!job) throw new NotFoundException('Job opening not found.');
    this.assertCanAccessOrganization(user, job.organizationId);
    return job;
  }

  async updateJob(user: AuthenticatedRequestUser, id: string, body: AnyRecord) {
    await this.getJob(user, id);
    const job = await this.prisma.hrJobOpening.update({
      where: { id },
      data: {
        title: this.string(body.title),
        localizedTitle: this.json(body.localizedTitle),
        departmentId: this.string(body.departmentId),
        positionId: this.string(body.positionId),
        branchId: this.string(body.branchId),
        employmentType: this.optionalEnum(HrEmploymentType, body.employmentType),
        workMode: this.optionalEnum(HrWorkScheduleType, body.workMode),
        description: this.json(body.description),
        requirements: this.json(body.requirements),
        status: this.optionalEnum(HrJobOpeningStatus, body.status),
        publicApplyEnabled: typeof body.publicApplyEnabled === 'boolean' ? body.publicApplyEnabled : undefined,
      },
    });
    await this.auditLogs.record({ action: 'hr.recruitment.job.updated', entityType: 'HrJobOpening', entityId: job.id, organizationId: job.organizationId, actor: user });
    return job;
  }

  async listApplicants(user: AuthenticatedRequestUser, query: Record<string, string | undefined>) {
    const organizationId = this.resolveOrganizationId(user, query.organizationId);
    const pageSize = this.clampNumber(query.pageSize, 10, 1, 50);
    const page = this.clampNumber(query.page, 1, 1, 10_000);
    const where: Prisma.HrApplicantWhereInput = { organizationId };
    if (query.jobOpeningId) where.jobOpeningId = query.jobOpeningId;
    if (query.status) where.status = this.enumValue(HrApplicantStatus, query.status, 'status');
    if (query.source) where.source = this.enumValue(HrApplicantSource, query.source, 'source');
    if (query.nationalityCountryCode) where.nationalityCountryCode = query.nationalityCountryCode;
    if (query.aiReviewStatus) where.aiReviewStatus = this.enumValue(HrApplicantAiReviewStatus, query.aiReviewStatus, 'aiReviewStatus');
    if (query.documentsMissing === 'true') {
      where.OR = [{ status: HrApplicantStatus.DOCUMENTS_MISSING }, { documents: { some: { status: HrApplicantDocumentStatus.MISSING } } }];
    }
    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const [items, total] = await Promise.all([
      this.prisma.hrApplicant.findMany({
        where,
        include: this.applicantInclude(),
        orderBy: { submittedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.hrApplicant.count({ where }),
    ]);
    return { items: items.map((item) => this.safeApplicant(item)), total, page, pageSize };
  }

  async createApplicant(user: AuthenticatedRequestUser, body: AnyRecord) {
    const organizationId = this.resolveOrganizationId(user, this.string(body.organizationId));
    const applicant = await this.createApplicantRecord(organizationId, body, {
      source: this.optionalEnum(HrApplicantSource, body.source) ?? HrApplicantSource.INTERNAL_SECRETARY,
      status: this.optionalEnum(HrApplicantStatus, body.status) ?? HrApplicantStatus.PENDING_REVIEW,
      submittedAt: new Date(),
    });
    await this.auditLogs.record({ action: 'hr.recruitment.applicant.created', entityType: 'HrApplicant', entityId: applicant.id, organizationId, actor: user });
    return this.safeApplicant(applicant);
  }

  async getApplicant(user: AuthenticatedRequestUser, id: string) {
    const applicant = await this.findApplicantOrThrow(id);
    this.assertCanAccessOrganization(user, applicant.organizationId);
    await this.auditLogs.record({ action: 'hr.recruitment.applicant.viewed', entityType: 'HrApplicant', entityId: id, organizationId: applicant.organizationId, actor: user });
    return this.safeApplicant(applicant);
  }

  async updateApplicant(user: AuthenticatedRequestUser, id: string, body: AnyRecord) {
    const existing = await this.findApplicantOrThrow(id);
    this.assertCanAccessOrganization(user, existing.organizationId);
    const requestedStatus = this.optionalEnum(HrApplicantStatus, body.status);
    if (requestedStatus === HrApplicantStatus.READY_FOR_INTERVIEW) {
      await this.assertApplicantReadyForInterview(existing);
    }
    const applicant = await this.prisma.hrApplicant.update({
      where: { id },
      data: this.applicantData(body, {
        status: requestedStatus,
        reviewedAt: body.status ? new Date() : undefined,
        reviewedById: body.status ? user.userId : undefined,
      }),
      include: this.applicantInclude(),
    });
    await this.auditLogs.record({ action: 'hr.recruitment.applicant.updated', entityType: 'HrApplicant', entityId: id, organizationId: applicant.organizationId, actor: user });
    return this.safeApplicant(applicant);
  }

  async uploadApplicantDocument(user: AuthenticatedRequestUser, applicantId: string, body: AnyRecord, file?: FileLike) {
    const applicant = await this.findApplicantOrThrow(applicantId);
    this.assertCanAccessOrganization(user, applicant.organizationId);
    const fileId = file?.buffer ? (await this.storeApplicantFile(applicant.organizationId, file, user.userId)).id : this.string(body.fileId);
    const document = await this.prisma.hrApplicantDocument.create({
      data: {
        applicantId,
        organizationId: applicant.organizationId,
        documentType: this.optionalEnum(HrApplicantDocumentType, body.documentType) ?? HrApplicantDocumentType.OTHER,
        fileId,
        status: fileId ? HrApplicantDocumentStatus.PENDING_REVIEW : HrApplicantDocumentStatus.MISSING,
        extractionStatus: HrApplicantAiReviewStatus.NOT_REQUESTED,
        expiresAt: this.date(body.expiresAt),
        reviewerNotes: this.string(body.reviewerNotes),
      },
    });
    await this.auditLogs.record({ action: 'hr.recruitment.document.uploaded', entityType: 'HrApplicantDocument', entityId: document.id, organizationId: applicant.organizationId, actor: user });
    return this.safeDocument(document);
  }

  async extractApplicantDocument(user: AuthenticatedRequestUser, applicantId: string, documentId: string) {
    const document = await this.findApplicantDocumentOrThrow(applicantId, documentId);
    this.assertCanAccessOrganization(user, document.organizationId);
    const provider = this.extractionProvider();
    if (provider === 'NONE') {
      const updated = await this.prisma.hrApplicantDocument.update({
        where: { id: document.id },
        data: {
          extractionStatus: HrApplicantAiReviewStatus.NEEDS_MANUAL_REVIEW,
          extractedData: {
            provider,
            code: 'OCR_PROVIDER_NOT_CONFIGURED',
            message: 'OCR provider not configured. Review the document manually and apply fields yourself.',
          },
        },
      });
      await this.auditLogs.record({ action: 'hr.recruitment.document.extraction_not_configured', entityType: 'HrApplicantDocument', entityId: document.id, organizationId: document.organizationId, actor: user });
      return this.safeDocument(updated);
    }
    const updated = await this.prisma.hrApplicantDocument.update({
      where: { id: document.id },
      data: {
        extractionStatus: HrApplicantAiReviewStatus.PENDING,
        extractedData: {
          provider,
          message: 'Extraction queued for configured provider. HR must confirm before applying any field.',
        },
      },
    });
    await this.auditLogs.record({ action: 'hr.recruitment.document.extraction_requested', entityType: 'HrApplicantDocument', entityId: document.id, organizationId: document.organizationId, actor: user, metadata: { provider } });
    return this.safeDocument(updated);
  }

  async reviewApplicantDocument(user: AuthenticatedRequestUser, applicantId: string, documentId: string, body: AnyRecord) {
    const document = await this.findApplicantDocumentOrThrow(applicantId, documentId);
    this.assertCanAccessOrganization(user, document.organizationId);
    const updated = await this.prisma.hrApplicantDocument.update({
      where: { id: document.id },
      data: {
        status: this.optionalEnum(HrApplicantDocumentStatus, body.status) ?? document.status,
        reviewerNotes: this.string(body.reviewerNotes),
        extractedData: this.json(body.extractedData),
        expiresAt: this.date(body.expiresAt),
      },
    });
    await this.auditLogs.record({ action: 'hr.recruitment.document.reviewed', entityType: 'HrApplicantDocument', entityId: document.id, organizationId: document.organizationId, actor: user });
    return this.safeDocument(updated);
  }

  async createInterview(user: AuthenticatedRequestUser, applicantId: string, body: AnyRecord) {
    const applicant = await this.findApplicantOrThrow(applicantId);
    this.assertCanAccessOrganization(user, applicant.organizationId);
    if (applicant.status !== HrApplicantStatus.READY_FOR_INTERVIEW) {
      throw new BadRequestException({
        code: 'APPLICANT_NOT_READY_FOR_INTERVIEW',
        message: 'Applicant must be marked ready for interview before scheduling.',
      });
    }
    const scheduledAt = this.date(body.scheduledAt);
    if (!scheduledAt) throw new BadRequestException('scheduledAt is required.');
    const interview = await this.prisma.hrApplicantInterview.create({
      data: {
        applicantId,
        organizationId: applicant.organizationId,
        scheduledAt,
        interviewType: this.optionalEnum(HrApplicantInterviewType, body.interviewType) ?? HrApplicantInterviewType.PHONE,
        location: this.string(body.location),
        interviewerId: this.string(body.interviewerId),
        status: HrApplicantInterviewStatus.SCHEDULED,
        notes: this.string(body.notes),
        score: this.number(body.score),
      },
    });
    await this.prisma.hrApplicant.update({ where: { id: applicantId }, data: { status: HrApplicantStatus.INTERVIEW_SCHEDULED } });
    return interview;
  }

  async updateInterview(user: AuthenticatedRequestUser, applicantId: string, interviewId: string, body: AnyRecord) {
    const interview = await this.prisma.hrApplicantInterview.findFirst({ where: { id: interviewId, applicantId } });
    if (!interview) throw new NotFoundException('Interview not found.');
    this.assertCanAccessOrganization(user, interview.organizationId);
    return this.prisma.hrApplicantInterview.update({
      where: { id: interview.id },
      data: {
        scheduledAt: this.date(body.scheduledAt),
        interviewType: this.optionalEnum(HrApplicantInterviewType, body.interviewType),
        location: this.string(body.location),
        interviewerId: this.string(body.interviewerId),
        status: this.optionalEnum(HrApplicantInterviewStatus, body.status),
        notes: this.string(body.notes),
        score: this.number(body.score),
      },
    });
  }

  async createOffer(user: AuthenticatedRequestUser, applicantId: string, body: AnyRecord) {
    const applicant = await this.findApplicantOrThrow(applicantId);
    this.assertCanAccessOrganization(user, applicant.organizationId);
    const offer = await this.prisma.hrApplicantOffer.create({
      data: this.offerData(applicant.organizationId, applicantId, body, HrApplicantOfferStatus.DRAFT),
    });
    await this.prisma.hrApplicant.update({ where: { id: applicantId }, data: { status: HrApplicantStatus.OFFER_PENDING } });
    return offer;
  }

  async updateOffer(user: AuthenticatedRequestUser, applicantId: string, offerId: string, body: AnyRecord) {
    const offer = await this.prisma.hrApplicantOffer.findFirst({ where: { id: offerId, applicantId } });
    if (!offer) throw new NotFoundException('Offer not found.');
    this.assertCanAccessOrganization(user, offer.organizationId);
    const updated = await this.prisma.hrApplicantOffer.update({
      where: { id: offer.id },
      data: this.offerData(offer.organizationId, applicantId, body),
    });
    if (updated.status === HrApplicantOfferStatus.ACCEPTED) {
      await this.prisma.hrApplicant.update({ where: { id: applicantId }, data: { status: HrApplicantStatus.OFFER_ACCEPTED } });
    }
    return updated;
  }

  async convertToEmployee(user: AuthenticatedRequestUser, applicantId: string, body: AnyRecord) {
    const applicant = await this.findApplicantOrThrow(applicantId);
    this.assertCanAccessOrganization(user, applicant.organizationId);
    if (applicant.convertedEmployeeId || applicant.status === HrApplicantStatus.CONVERTED_TO_EMPLOYEE) {
      throw new ConflictException('Applicant is already converted to an employee.');
    }

    const employee = await this.hrService.createEmployee(user, {
      organizationId: applicant.organizationId,
      name: applicant.fullName,
      displayName: applicant.fullName,
      legalName: applicant.fullName,
      email: applicant.email,
      phone: applicant.phone,
      phoneCountry: applicant.phoneCountry,
      nationalityCountryCode: applicant.nationalityCountryCode,
      preferredLanguage: applicant.preferredLanguage,
      currency: applicant.expectedSalaryCurrency ?? applicant.lastSalaryCurrency,
      salaryCurrency: applicant.expectedSalaryCurrency ?? applicant.lastSalaryCurrency,
      salaryAmount: applicant.expectedSalaryAmount ?? body.salaryAmount,
      roleTitle: applicant.currentJobTitle,
      jobTitle: applicant.currentJobTitle,
      employmentType: body.employmentType,
      officeId: body.officeId,
      branchId: body.branchId,
      departmentId: body.departmentId,
      positionId: body.positionId,
      jobLevelId: body.jobLevelId,
      directManagerId: body.directManagerId,
      workScheduleId: body.workScheduleId,
      attendanceProfileId: body.attendanceProfileId,
      paymentFrequency: body.paymentFrequency ?? HrPaymentFrequency.MONTHLY,
      allowLogin: body.allowLogin === true,
      role: this.string(body.role) ?? 'employee_self_service',
      permissions: Array.isArray(body.permissions) ? body.permissions.map(String) : undefined,
      hireDate: body.startDate ?? body.startsAt ?? new Date().toISOString(),
      status: 'ACTIVE',
    } as AnyRecord);

    await this.prisma.$transaction(async (tx) => {
      await tx.hrApplicant.update({
        where: { id: applicant.id },
        data: {
          status: HrApplicantStatus.CONVERTED_TO_EMPLOYEE,
          convertedEmployeeId: employee.id,
          reviewedAt: new Date(),
          reviewedById: user.userId,
        },
      });
      for (const document of applicant.documents) {
        if (!document.fileId) continue;
        await tx.hrEmployeeDocument.create({
          data: {
            organizationId: applicant.organizationId,
            employeeId: employee.id,
            documentType: document.documentType,
            fileId: document.fileId,
            status: document.status === HrApplicantDocumentStatus.APPROVED ? 'VALID' : 'PENDING',
            aiReviewStatus:
              document.extractionStatus === HrApplicantAiReviewStatus.COMPLETED
                ? 'APPROVED'
                : document.extractionStatus === HrApplicantAiReviewStatus.NEEDS_MANUAL_REVIEW
                  ? 'NEEDS_MANUAL_REVIEW'
                  : 'NOT_REVIEWED',
            manualReviewStatus: document.status === HrApplicantDocumentStatus.APPROVED ? 'APPROVED' : 'PENDING',
            expiresAt: document.expiresAt,
          },
        });
      }
    });

    await this.auditLogs.record({
      action: 'hr.recruitment.applicant.converted_to_employee',
      entityType: 'HrApplicant',
      entityId: applicant.id,
      organizationId: applicant.organizationId,
      actor: user,
      metadata: { employeeId: employee.id, allowLogin: body.allowLogin === true },
    });
    return {
      applicantId: applicant.id,
      employee,
      defaultPassword: body.allowLogin === true ? employee.temporaryPassword : undefined,
    };
  }

  async getSettings(user: AuthenticatedRequestUser, requestedOrganizationId?: string) {
    const organizationId = this.resolveOrganizationId(user, requestedOrganizationId);
    return this.ensureSettings(organizationId);
  }

  async updateSettings(user: AuthenticatedRequestUser, body: AnyRecord) {
    const organizationId = this.resolveOrganizationId(user, this.string(body.organizationId));
    const settings = await this.prisma.hrRecruitmentSettings.upsert({
      where: { organizationId },
      create: {
        organizationId,
        ...this.settingsData(body),
      },
      update: this.settingsData(body),
    });
    await this.auditLogs.record({ action: 'hr.recruitment.settings.updated', entityType: 'HrRecruitmentSettings', entityId: settings.id, organizationId, actor: user });
    return settings;
  }

  async listPublicJobs(slug: string) {
    const organization = await this.findPublicOrganization(slug);
    if (!organization) throw new NotFoundException('Company not found.');
    return this.prisma.hrJobOpening.findMany({
      where: {
        organizationId: organization.id,
        status: HrJobOpeningStatus.OPEN,
        publicApplyEnabled: true,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        localizedTitle: true,
        description: true,
        requirements: true,
        employmentType: true,
        workMode: true,
        createdAt: true,
      },
    });
  }

  async getPublicJob(slug: string, jobId: string) {
    const organization = await this.findPublicOrganization(slug);
    if (!organization) throw new NotFoundException('Company not found.');
    const job = await this.prisma.hrJobOpening.findFirst({
      where: { id: jobId, organizationId: organization.id, status: HrJobOpeningStatus.OPEN, publicApplyEnabled: true },
      select: {
        id: true,
        title: true,
        localizedTitle: true,
        description: true,
        requirements: true,
        employmentType: true,
        workMode: true,
        createdAt: true,
      },
    });
    if (!job) throw new NotFoundException('Job opening not found.');
    return job;
  }

  async createPublicApplication(slug: string, body: AnyRecord, files: Record<string, FileLike[] | undefined>) {
    const organization = await this.findPublicOrganization(slug);
    if (!organization) throw new NotFoundException('Company not found.');
    if (body.jobOpeningId) await this.getPublicJob(slug, String(body.jobOpeningId));
    if (body.consent !== true && body.consent !== 'true') {
      throw new BadRequestException('Consent is required to review applicant documents.');
    }

    const applicant = await this.createApplicantRecord(organization.id, body, {
      source: HrApplicantSource.PUBLIC_SITE,
      status: HrApplicantStatus.PENDING_REVIEW,
      submittedAt: new Date(),
    });

    const mapping: Array<[string, HrApplicantDocumentType]> = [
      ['cv', HrApplicantDocumentType.CV],
      ['graduationCertificate', HrApplicantDocumentType.GRADUATION_CERTIFICATE],
      ['nationalIdFront', HrApplicantDocumentType.NATIONAL_ID_FRONT],
      ['nationalIdBack', HrApplicantDocumentType.NATIONAL_ID_BACK],
      ['militaryCertificate', HrApplicantDocumentType.MILITARY_CERTIFICATE],
      ['lastSalaryProof', HrApplicantDocumentType.LAST_SALARY_PROOF],
      ['experienceCertificate', HrApplicantDocumentType.EXPERIENCE_CERTIFICATE],
      ['portfolio', HrApplicantDocumentType.PORTFOLIO],
    ];
    for (const [field, documentType] of mapping) {
      const file = files[field]?.[0];
      if (!file?.buffer) continue;
      const stored = await this.storeApplicantFile(organization.id, file, null);
      await this.prisma.hrApplicantDocument.create({
        data: {
          applicantId: applicant.id,
          organizationId: organization.id,
          documentType,
          fileId: stored.id,
          status: HrApplicantDocumentStatus.PENDING_REVIEW,
          extractionStatus: HrApplicantAiReviewStatus.NOT_REQUESTED,
        },
      });
    }

    await this.auditLogs.record({
      action: 'hr.recruitment.public_application.submitted',
      entityType: 'HrApplicant',
      entityId: applicant.id,
      organizationId: organization.id,
    });
    return {
      id: applicant.id,
      status: applicant.status,
      submittedAt: applicant.submittedAt,
      message: 'Application submitted for HR review.',
    };
  }

  private async createApplicantRecord(
    organizationId: string,
    body: AnyRecord,
    overrides: Partial<Prisma.HrApplicantUncheckedCreateInput>,
  ) {
    const fullName = this.string(body.fullName) ?? this.string(body.name);
    if (!fullName) throw new BadRequestException('fullName is required.');
    const phoneCountry = this.string(body.phoneCountry) ?? this.string(body.countryCode);
    const phone = normalizeOptionalPhoneOrThrow(this.string(body.phone), 'phone', phoneCountry);
    const data: Prisma.HrApplicantUncheckedCreateInput = {
        organizationId,
        ...this.applicantData(body, {
          fullName,
          phone,
          normalizedPhone: phone,
          ...overrides,
        }),
        fullName,
      };
    return this.prisma.hrApplicant.create({
      data,
      include: this.applicantInclude(),
    });
  }

  private applicantData(body: AnyRecord, overrides: Partial<Prisma.HrApplicantUncheckedCreateInput> = {}) {
    return {
      jobOpeningId: this.string(body.jobOpeningId),
      source: this.optionalEnum(HrApplicantSource, body.source),
      status: this.optionalEnum(HrApplicantStatus, body.status),
      fullName: this.string(body.fullName) ?? this.string(body.name),
      localizedName: this.json(body.localizedName),
      email: this.email(body.email),
      phoneCountry: this.string(body.phoneCountry),
      phone: this.string(body.phone),
      normalizedPhone: this.string(body.normalizedPhone),
      countryCode: this.string(body.countryCode),
      nationalityCountryCode: this.string(body.nationalityCountryCode),
      preferredLanguage: this.string(body.preferredLanguage),
      address: this.string(body.address),
      educationLevel: this.string(body.educationLevel),
      university: this.string(body.university),
      graduationYear: this.number(body.graduationYear),
      currentJobTitle: this.string(body.currentJobTitle),
      yearsOfExperience: this.decimal(body.yearsOfExperience),
      lastSalaryAmount: this.decimal(body.lastSalaryAmount),
      lastSalaryCurrency: this.string(body.lastSalaryCurrency),
      expectedSalaryAmount: this.decimal(body.expectedSalaryAmount),
      expectedSalaryCurrency: this.string(body.expectedSalaryCurrency),
      noticePeriod: this.string(body.noticePeriod),
      linkedinUrl: this.safeUrl(body.linkedinUrl),
      portfolioUrl: this.safeUrl(body.portfolioUrl),
      notes: this.string(body.notes),
      aiReviewStatus: this.optionalEnum(HrApplicantAiReviewStatus, body.aiReviewStatus),
      aiReviewSummary: this.json(body.aiReviewSummary),
      ...overrides,
    };
  }

  private offerData(
    organizationId: string,
    applicantId: string,
    body: AnyRecord,
    defaultStatus?: HrApplicantOfferStatus,
  ): Prisma.HrApplicantOfferUncheckedCreateInput & Prisma.HrApplicantOfferUncheckedUpdateInput {
    return {
      organizationId,
      applicantId,
      status: this.optionalEnum(HrApplicantOfferStatus, body.status) ?? defaultStatus,
      salaryAmount: this.decimal(body.salaryAmount),
      salaryCurrency: this.string(body.salaryCurrency),
      officeId: this.string(body.officeId),
      departmentId: this.string(body.departmentId),
      positionId: this.string(body.positionId),
      managerId: this.string(body.managerId),
      workScheduleId: this.string(body.workScheduleId),
      startsAt: this.date(body.startsAt),
      notes: this.string(body.notes),
    };
  }

  private settingsData(body: AnyRecord) {
    return {
      requiredCv: this.boolean(body.requiredCv),
      requiredGraduationCertificate: this.boolean(body.requiredGraduationCertificate),
      requiredNationalId: this.boolean(body.requiredNationalId),
      requiredMilitaryCertificate: this.boolean(body.requiredMilitaryCertificate),
      requiredLastSalaryProof: this.boolean(body.requiredLastSalaryProof),
      requiredExperienceCertificates: this.boolean(body.requiredExperienceCertificates),
      countrySpecificRequirements: this.json(body.countrySpecificRequirements),
      jobSpecificOverrides: this.json(body.jobSpecificOverrides),
    };
  }

  private async ensureSettings(organizationId: string) {
    return this.prisma.hrRecruitmentSettings.upsert({
      where: { organizationId },
      create: { organizationId },
      update: {},
    });
  }

  private applicantInclude() {
    return {
      jobOpening: true,
      documents: true,
      interviews: { orderBy: { scheduledAt: 'desc' as const } },
      offers: { orderBy: { createdAt: 'desc' as const } },
    };
  }

  private safeApplicant(applicant: any) {
    return {
      ...applicant,
      documents: (applicant.documents ?? []).map((document: any) => this.safeDocument(document)),
    };
  }

  private safeDocument(document: any) {
    if (!document) return document;
    const { file, ...safe } = document;
    return safe;
  }

  private async findApplicantOrThrow(id: string) {
    const applicant = await this.prisma.hrApplicant.findUnique({
      where: { id },
      include: this.applicantInclude(),
    });
    if (!applicant) throw new NotFoundException('Applicant not found.');
    return applicant;
  }

  private async assertApplicantReadyForInterview(applicant: any) {
    const settings = await this.prisma.hrRecruitmentSettings.findUnique({
      where: { organizationId: applicant.organizationId },
    });
    const requiredTypes: HrApplicantDocumentType[] = [];
    if (settings?.requiredCv ?? true) requiredTypes.push(HrApplicantDocumentType.CV);
    if (settings?.requiredGraduationCertificate) requiredTypes.push(HrApplicantDocumentType.GRADUATION_CERTIFICATE);
    if (settings?.requiredNationalId ?? true) {
      requiredTypes.push(HrApplicantDocumentType.NATIONAL_ID_FRONT, HrApplicantDocumentType.NATIONAL_ID_BACK);
    }
    if (settings?.requiredMilitaryCertificate) requiredTypes.push(HrApplicantDocumentType.MILITARY_CERTIFICATE);
    if (settings?.requiredLastSalaryProof) requiredTypes.push(HrApplicantDocumentType.LAST_SALARY_PROOF);
    if (settings?.requiredExperienceCertificates) requiredTypes.push(HrApplicantDocumentType.EXPERIENCE_CERTIFICATE);
    const approved = new Set(
      (applicant.documents ?? [])
        .filter((document: any) => document.status === HrApplicantDocumentStatus.APPROVED)
        .map((document: any) => document.documentType),
    );
    const missing = requiredTypes.filter((type) => !approved.has(type));
    if (missing.length) {
      throw new BadRequestException({
        code: 'APPLICANT_DOCUMENTS_MISSING',
        message: 'Required applicant documents are missing or not approved.',
        documentTypes: missing,
      });
    }
  }

  private async findApplicantDocumentOrThrow(applicantId: string, documentId: string) {
    const document = await this.prisma.hrApplicantDocument.findFirst({
      where: { id: documentId, applicantId },
      include: { file: true },
    });
    if (!document) throw new NotFoundException('Applicant document not found.');
    return document;
  }

  private async findPublicOrganization(slug: string) {
    const normalizedSlug = slug.trim().toLowerCase();
    return this.prisma.organization.findFirst({
      where: {
        slug: normalizedSlug,
        status: { in: ['APPROVED', 'ACTIVE'] as any },
        publicSiteSettings: { mode: { not: 'DISABLED' as any } },
      },
      select: { id: true, slug: true, name: true },
    });
  }

  private async storeApplicantFile(organizationId: string, file: FileLike, uploadedById: string | null) {
    if (!file.buffer || !file.size) throw new BadRequestException('Applicant document file is required.');
    const mimeType = this.documentMimeType(file.mimetype);
    const extension = this.documentExtension(file.originalname, mimeType);
    const maxSizeBytes = Number(process.env.HR_APPLICANT_DOCUMENT_MAX_BYTES ?? 10 * 1024 * 1024);
    if (file.size > maxSizeBytes) throw new BadRequestException('Applicant document file is too large.');
    const objectKey = [
      'hr',
      'applicants',
      organizationId,
      uploadedById ?? 'public',
      `${Date.now()}-${randomUUID()}${extension}`,
    ].join('/');
    const stored = await this.storage.putObject({
      purpose: 'HR_DOCUMENT',
      objectKey,
      body: file.buffer,
      mimeType,
    });
    return this.prisma.uploadedFile.create({
      data: {
        organizationId,
        uploadedById,
        filePurpose: 'HR_DOCUMENT',
        bucket: stored.bucket,
        objectKey: stored.objectKey,
        mimeType,
        sizeBytes: file.size,
        visibility: 'PRIVATE',
        checksum: this.string(file.originalname),
      },
    });
  }

  private documentMimeType(value: unknown) {
    const mimeType = typeof value === 'string' ? value.trim().toLowerCase() : '';
    if (['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(mimeType)) return mimeType;
    throw new BadRequestException('Applicant document must be a JPEG, PNG, WebP, or PDF file.');
  }

  private documentExtension(originalName: unknown, mimeType: string) {
    const extension = typeof originalName === 'string' ? extname(originalName).toLowerCase() : '';
    const allowed = new Map([
      ['image/jpeg', new Set(['.jpg', '.jpeg'])],
      ['image/png', new Set(['.png'])],
      ['image/webp', new Set(['.webp'])],
      ['application/pdf', new Set(['.pdf'])],
    ]);
    if (!extension || !allowed.get(mimeType)?.has(extension)) {
      throw new BadRequestException('Applicant document extension does not match the file type.');
    }
    return extension === '.jpeg' ? '.jpg' : extension;
  }

  private extractionProvider() {
    if (
      process.env.DOCUMENT_EXTRACTION_PROVIDER === 'CLOUDFLARE_WORKERS_AI' &&
      process.env.CLOUDFLARE_ACCOUNT_ID?.trim() &&
      process.env.CLOUDFLARE_API_TOKEN?.trim() &&
      process.env.CLOUDFLARE_AI_GATEWAY_ID?.trim()
    ) {
      return 'AI_PROVIDER';
    }
    if (process.env.HR_APPLICANT_AI_PROVIDER_KEY || process.env.COMPANY_DOCUMENT_AI_PROVIDER_KEY) return 'AI_PROVIDER';
    if (process.env.HR_APPLICANT_OCR_PROVIDER_KEY || process.env.COMPANY_DOCUMENT_OCR_PROVIDER_KEY) return 'OCR_PROVIDER';
    return 'NONE';
  }

  private resolveOrganizationId(user: AuthenticatedRequestUser, requestedOrganizationId?: string | null) {
    if (this.isPlatform(user)) {
      const id = requestedOrganizationId?.trim() || user.organizationId;
      if (!id) throw new BadRequestException('organizationId is required.');
      return id;
    }
    if (requestedOrganizationId && requestedOrganizationId !== user.organizationId) {
      throw new ForbiddenException('Cannot access recruitment data in another organization.');
    }
    if (!user.organizationId) throw new ForbiddenException('Organization is required.');
    return user.organizationId;
  }

  private assertCanAccessOrganization(user: AuthenticatedRequestUser, organizationId: string | null) {
    if (!organizationId) throw new ForbiddenException('Organization is required.');
    if (this.isPlatform(user)) return;
    if (user.organizationId !== organizationId) {
      throw new ForbiddenException('Cannot access recruitment data in another organization.');
    }
  }

  private isPlatform(user: AuthenticatedRequestUser) {
    return PLATFORM_ROLES.has(user.role) || user.permissions?.includes('organizations.view_all');
  }

  private string(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private email(value: unknown) {
    const text = this.string(value)?.toLowerCase();
    return text && /@/.test(text) ? text : undefined;
  }

  private safeUrl(value: unknown) {
    const text = this.string(value);
    if (!text) return undefined;
    try {
      const url = new URL(text);
      return ['http:', 'https:'].includes(url.protocol) ? url.toString() : undefined;
    } catch {
      return undefined;
    }
  }

  private number(value: unknown) {
    if (value === undefined || value === null || value === '') return undefined;
    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
  }

  private decimal(value: unknown) {
    const number = this.number(value);
    return number === undefined ? undefined : new Prisma.Decimal(number);
  }

  private date(value: unknown) {
    const text = this.string(value);
    if (!text) return undefined;
    const date = new Date(text);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  private boolean(value: unknown) {
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  }

  private json(value: unknown) {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as Prisma.InputJsonValue;
      } catch {
        return { en: value, ar: '', fr: '' } as Prisma.InputJsonValue;
      }
    }
    return value as Prisma.InputJsonValue;
  }

  private enumValue<T extends Record<string, string>>(source: T, value: unknown, field: string): T[keyof T] {
    const text = this.string(value);
    if (text && Object.prototype.hasOwnProperty.call(source, text)) return source[text as keyof T];
    throw new BadRequestException(`${field} is invalid.`);
  }

  private optionalEnum<T extends Record<string, string>>(source: T, value: unknown) {
    const text = this.string(value);
    if (!text) return undefined;
    if (Object.prototype.hasOwnProperty.call(source, text)) return source[text as keyof T];
    throw new BadRequestException('Invalid enum value.');
  }

  private clampNumber(value: unknown, fallback: number, min: number, max: number) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, Math.trunc(number)));
  }
}

export { RECRUITMENT_PERMISSIONS };

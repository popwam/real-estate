import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ExchangeRateSourceType,
  FieldEvidenceReviewStatus,
  FilePurpose,
  FileVisibility,
  OrganizationDocumentExtractionStatus,
  OrganizationOnboardingStatus,
  OrganizationStatus,
  OrganizationType,
  Prisma,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import type { Readable } from 'stream';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../database/prisma.service';
import { FileStorageService } from '../files/file-storage.service';
import { CloudflareDocumentAdapter } from './cloudflare-document.adapter';
import { DocumentQualityService } from './document-quality.service';
import {
  CreateOnboardingDraftDto,
  ExchangeRateDto,
  ReviewFieldEvidenceDto,
  SupportedOrganizationTypeDto,
  UpdateOnboardingDraftDto,
  UploadOnboardingDocumentDto,
} from './dto/platform-onboarding.dto';

const LEGAL_FIELDS = new Set([
  'legalName',
  'tradeName',
  'commercialRegisterNumber',
  'commercialRegisterOffice',
  'commercialRegisterIssuedAt',
  'commercialRegisterExpiresAt',
  'taxNumber',
  'vatNumber',
  'taxOffice',
  'incorporationDate',
  'addressLine1',
  'addressLine2',
]);
const SENSITIVE_FIELDS = new Set([
  'commercialRegisterNumber',
  'taxNumber',
  'vatNumber',
  'nationalId',
  'passport',
  'commercialRegisterExpiresAt',
  'expiryDate',
]);
const OPERATIONAL_FIELDS = new Set([
  'displayName',
  'preferredLanguage',
  'timezone',
  'currency',
  'adminEmail',
  'adminPhone',
  'planCode',
]);
type UploadedBinaryFile = {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname?: string;
};

@Injectable()
export class PlatformOnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: FileStorageService,
    private readonly quality: DocumentQualityService,
    private readonly cloudflare: CloudflareDocumentAdapter,
    private readonly audit: AuditLogsService,
  ) {}

  listSupportedTypes(includeArchived = false) {
    return this.prisma.supportedOrganizationType.findMany({
      where: includeArchived ? undefined : { isArchived: false },
      orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
    });
  }

  createSupportedType(
    dto: SupportedOrganizationTypeDto,
    actor: AuthenticatedRequestUser,
  ) {
    return this.prisma.supportedOrganizationType
      .create({ data: this.supportedTypeData(dto, true) })
      .then(async (record) => {
        await this.audit.record({
          action: 'platform.organization_type.created',
          entityType: 'SupportedOrganizationType',
          entityId: record.id,
          actor,
        });
        return record;
      });
  }

  async updateSupportedType(
    id: string,
    dto: SupportedOrganizationTypeDto,
    actor: AuthenticatedRequestUser,
  ) {
    await this.supportedType(id);
    const record = await this.prisma.supportedOrganizationType.update({
      where: { id },
      data: this.supportedTypeData(dto, false),
    });
    await this.audit.record({
      action: 'platform.organization_type.updated',
      entityType: 'SupportedOrganizationType',
      entityId: id,
      actor,
    });
    return record;
  }

  async deleteSupportedType(id: string, actor: AuthenticatedRequestUser) {
    const record = await this.supportedType(id);
    if (record.legacyOrganizationType === OrganizationType.PLATFORM)
      throw new ConflictException(
        'The platform organization type cannot be deleted or archived.',
      );
    const [organizations, policies, sessions] = await Promise.all([
      this.prisma.organization.count({
        where: { supportedOrganizationTypeId: id },
      }),
      this.prisma.requiredDocumentPolicy.count({
        where: { supportedOrganizationTypeId: id },
      }),
      this.prisma.organizationOnboardingSession.count({
        where: { supportedOrganizationTypeId: id },
      }),
    ]);
    if (organizations + policies + sessions > 0) {
      const archived = await this.prisma.supportedOrganizationType.update({
        where: { id },
        data: { isArchived: true, isActive: false },
      });
      await this.audit.record({
        action: 'platform.organization_type.archived',
        entityType: 'SupportedOrganizationType',
        entityId: id,
        actor,
        metadata: { organizations, policies, sessions },
      });
      return {
        disposition: 'ARCHIVED',
        record: archived,
        impact: { organizations, policies, sessions },
      };
    }
    await this.prisma.supportedOrganizationType.delete({ where: { id } });
    await this.audit.record({
      action: 'platform.organization_type.deleted',
      entityType: 'SupportedOrganizationType',
      entityId: id,
      actor,
    });
    return { disposition: 'DELETED' };
  }

  async uploadCountryIcon(
    id: string,
    file: UploadedBinaryFile | undefined,
    actor: AuthenticatedRequestUser,
  ) {
    const country = await this.prisma.platformMetadataRecord.findFirst({
      where: { id, category: 'COUNTRY' },
    });
    if (!country)
      throw new NotFoundException('Country metadata record not found.');
    if (!file?.buffer.length)
      throw new BadRequestException('A non-empty country icon is required.');
    const allowed: Record<string, string> = {
      'image/svg+xml': 'svg',
      'image/png': 'png',
      'image/webp': 'webp',
    };
    const extension = allowed[file.mimetype];
    if (!extension || file.size > 1024 * 1024)
      throw new BadRequestException(
        'Country icon must be SVG, PNG, or WebP and no larger than 1 MB.',
      );
    const originalExtension = file.originalname
      ?.split('.')
      .pop()
      ?.toLowerCase();
    if (originalExtension && originalExtension !== extension)
      throw new BadRequestException(
        'Country icon extension does not match its MIME type.',
      );
    if (file.mimetype === 'image/svg+xml') {
      const svg = file.buffer.toString('utf8');
      if (
        !/^\s*<svg[\s>]/i.test(svg) ||
        /<\s*(script|foreignObject|iframe|object|embed)\b/i.test(svg) ||
        /\son[a-z]+\s*=/i.test(svg) ||
        /(?:href|src)\s*=\s*["']\s*(?:https?:|\/\/|data:text\/html|javascript:)/i.test(
          svg,
        )
      ) {
        throw new BadRequestException('Malformed or unsafe SVG country icon.');
      }
    }
    const objectKey = `countries/${country.code.toLowerCase()}/${randomUUID()}.${extension}`;
    const stored = await this.storage.putObject({
      purpose: 'PUBLIC_MEDIA',
      objectKey,
      body: file.buffer,
      mimeType: file.mimetype,
    });
    const current =
      country.configuration &&
      typeof country.configuration === 'object' &&
      !Array.isArray(country.configuration)
        ? (country.configuration as Record<string, unknown>)
        : {};
    const updated = await this.prisma.platformMetadataRecord.update({
      where: { id },
      data: {
        configuration: {
          ...current,
          flagObjectKey: stored.objectKey,
          flagMimeType: file.mimetype,
        },
      },
    });
    await this.audit.record({
      action: 'platform.country.icon_uploaded',
      entityType: 'PlatformMetadataRecord',
      entityId: id,
      actor,
      metadata: {
        objectKey: stored.objectKey,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      },
    });
    return updated;
  }

  listExchangeRates() {
    return this.prisma.exchangeRate.findMany({
      orderBy: [{ baseCurrencyCode: 'asc' }, { quoteCurrencyCode: 'asc' }],
    });
  }

  async upsertExchangeRate(
    id: string | null,
    dto: ExchangeRateDto,
    actor: AuthenticatedRequestUser,
  ) {
    const data = await this.exchangeRateData(dto, !id);
    const record = id
      ? await this.prisma.exchangeRate.update({ where: { id }, data })
      : await this.prisma.exchangeRate.create({
          data: data as Prisma.ExchangeRateCreateInput,
        });
    await this.audit.record({
      action: id
        ? 'platform.exchange_rate.updated'
        : 'platform.exchange_rate.created',
      entityType: 'ExchangeRate',
      entityId: record.id,
      actor,
      metadata: {
        baseCurrencyCode: record.baseCurrencyCode,
        quoteCurrencyCode: record.quoteCurrencyCode,
        sourceType: record.sourceType,
      },
    });
    return record;
  }

  async deleteExchangeRate(id: string, actor: AuthenticatedRequestUser) {
    const record = await this.prisma.exchangeRate.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Exchange rate not found.');
    await this.prisma.exchangeRate.delete({ where: { id } });
    await this.audit.record({
      action: 'platform.exchange_rate.deleted',
      entityType: 'ExchangeRate',
      entityId: id,
      actor,
    });
    return { disposition: 'DELETED' };
  }

  fxProviderStatus() {
    const provider = process.env.FX_PROVIDER?.trim();
    return {
      mode: provider && process.env.FX_API_KEY?.trim() ? 'API' : 'MANUAL',
      provider: provider || null,
      refreshEnabled: Boolean(provider && process.env.FX_API_KEY?.trim()),
      reason:
        provider && process.env.FX_API_KEY?.trim()
          ? null
          : 'FX_PROVIDER and FX_API_KEY are not configured.',
    };
  }

  async createDraft(
    dto: CreateOnboardingDraftDto,
    actor: AuthenticatedRequestUser,
  ) {
    const countryCode = this.code(dto.countryCode, 'countryCode', 2, 3);
    const type = await this.supportedType(
      this.required(
        dto.supportedOrganizationTypeId,
        'supportedOrganizationTypeId',
      ),
    );
    if (
      !type.isActive ||
      type.isArchived ||
      type.legacyOrganizationType === OrganizationType.PLATFORM
    )
      throw new BadRequestException(
        'The selected organization type is not available for onboarding.',
      );
    if (
      type.allowedCountryCodes.length &&
      !type.allowedCountryCodes.includes(countryCode)
    )
      throw new BadRequestException(
        'The selected organization type is not available in this country.',
      );
    const operationalData = this.operationalData(dto.operationalData);
    const policies = await this.matchingPolicies(
      countryCode,
      type.id,
      dto.legalForm,
      type.legacyOrganizationType,
    );
    const session = await this.prisma.organizationOnboardingSession.create({
      data: {
        countryCode,
        supportedOrganizationTypeId: type.id,
        legalForm: dto.legalForm,
        operationalData: operationalData as Prisma.InputJsonValue,
        status: policies.length
          ? OrganizationOnboardingStatus.DOCUMENTS_REQUIRED
          : OrganizationOnboardingStatus.READY_TO_CREATE,
        missingFields: this.requiredFields(policies, type.requiredFieldCodes),
        createdById: actor.userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    await this.audit.record({
      action: 'platform.organization_onboarding.created',
      entityType: 'OrganizationOnboardingSession',
      entityId: session.id,
      actor,
      metadata: {
        countryCode,
        supportedOrganizationTypeId: type.id,
        policyCount: policies.length,
      },
    });
    return this.getDraft(session.id);
  }

  async getDraft(id: string) {
    const session = await this.prisma.organizationOnboardingSession.findUnique({
      where: { id },
      include: {
        supportedOrganizationType: true,
        documents: {
          where: { archivedAt: null },
          include: {
            file: {
              select: {
                id: true,
                mimeType: true,
                sizeBytes: true,
                createdAt: true,
              },
            },
            fieldEvidence: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        fieldEvidence: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!session) throw new NotFoundException('Onboarding session not found.');
    if (
      session.status !== OrganizationOnboardingStatus.COMPLETED &&
      session.status !== OrganizationOnboardingStatus.CANCELLED &&
      session.expiresAt <= new Date()
    ) {
      return this.prisma.organizationOnboardingSession.update({
        where: { id },
        data: { status: OrganizationOnboardingStatus.EXPIRED },
        include: {
          supportedOrganizationType: true,
          documents: true,
          fieldEvidence: true,
        },
      });
    }
    return session;
  }

  async updateDraft(
    id: string,
    dto: UpdateOnboardingDraftDto,
    actor: AuthenticatedRequestUser,
  ) {
    const current = await this.mutableSession(id);
    if (
      current.documents.length &&
      (dto.countryCode ||
        dto.supportedOrganizationTypeId ||
        dto.legalForm !== undefined)
    )
      throw new ConflictException(
        'Archive uploaded documents before changing onboarding policy selections.',
      );
    const countryCode = dto.countryCode
      ? this.code(dto.countryCode, 'countryCode', 2, 3)
      : current.countryCode;
    const type = dto.supportedOrganizationTypeId
      ? await this.supportedType(dto.supportedOrganizationTypeId)
      : current.supportedOrganizationType;
    if (
      type.legacyOrganizationType === OrganizationType.PLATFORM ||
      !type.isActive ||
      type.isArchived
    )
      throw new BadRequestException(
        'The selected organization type is not available.',
      );
    const legalForm =
      dto.legalForm === undefined ? current.legalForm : dto.legalForm;
    const policies = await this.matchingPolicies(
      countryCode,
      type.id,
      legalForm,
      type.legacyOrganizationType,
    );
    const updated = await this.prisma.organizationOnboardingSession.update({
      where: { id },
      data: {
        countryCode,
        supportedOrganizationTypeId: type.id,
        legalForm,
        operationalData: dto.operationalData
          ? (this.operationalData(dto.operationalData) as Prisma.InputJsonValue)
          : undefined,
        missingFields: this.requiredFields(policies, type.requiredFieldCodes),
        status: policies.length
          ? OrganizationOnboardingStatus.DOCUMENTS_REQUIRED
          : OrganizationOnboardingStatus.READY_TO_CREATE,
      },
    });
    await this.audit.record({
      action: 'platform.organization_onboarding.updated',
      entityType: 'OrganizationOnboardingSession',
      entityId: id,
      actor,
    });
    return updated;
  }

  async requiredDocuments(id: string) {
    const session = await this.getDraft(id);
    return this.matchingPolicies(
      session.countryCode,
      session.supportedOrganizationTypeId,
      session.legalForm,
      session.supportedOrganizationType.legacyOrganizationType,
    );
  }

  async uploadDocument(
    id: string,
    dto: UploadOnboardingDocumentDto,
    file: UploadedBinaryFile | undefined,
    actor: AuthenticatedRequestUser,
  ) {
    const session = await this.mutableSession(id);
    if (!file) throw new BadRequestException('A document file is required.');
    const documentType = dto.documentType;
    if (!documentType)
      throw new BadRequestException('documentType is required.');
    const policies = await this.matchingPolicies(
      session.countryCode,
      session.supportedOrganizationTypeId,
      session.legalForm,
      session.supportedOrganizationType.legacyOrganizationType,
    );
    const policy = dto.policyId
      ? policies.find((item) => item.id === dto.policyId)
      : policies.find((item) => item.documentType === documentType);
    if (policies.length && !policy)
      throw new BadRequestException(
        'The document does not match an active onboarding policy.',
      );
    if (policy && !policy.acceptedMimeTypes.includes(file.mimetype))
      throw new BadRequestException(
        'The document MIME type is not accepted by this policy.',
      );
    const maxMb = Math.min(
      policy?.maxFileSizeMb ??
        this.envNumber('DOCUMENT_EXTRACTION_MAX_FILE_MB', 10),
      this.envNumber('DOCUMENT_EXTRACTION_MAX_FILE_MB', 10),
    );
    const quality = this.quality.inspect(file.buffer, file.mimetype, maxMb);
    if (
      ['CORRUPTED', 'PASSWORD_PROTECTED', 'UNSUPPORTED'].includes(
        quality.status,
      )
    )
      throw new BadRequestException(
        `Document quality check failed: ${quality.status}.`,
      );
    const extension = this.extension(file.mimetype);
    const objectKey = `onboarding/${id}/${randomUUID()}.${extension}`;
    const stored = await this.storage.putObject({
      purpose: 'QUARANTINE',
      objectKey,
      body: file.buffer,
      mimeType: file.mimetype,
    });
    const uploaded = await this.prisma.uploadedFile.create({
      data: {
        uploadedById: actor.userId,
        filePurpose: FilePurpose.QUARANTINE,
        bucket: stored.bucket,
        objectKey: stored.objectKey,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        visibility: FileVisibility.PRIVATE,
      },
    });
    const document = await this.prisma.organizationOnboardingDocument.create({
      data: {
        sessionId: id,
        policyId: policy?.id,
        documentType,
        fileId: uploaded.id,
        qualityStatus: quality.status,
        qualityWarnings: quality.warnings,
      },
    });
    await this.audit.record({
      action: 'platform.organization_onboarding.document_uploaded',
      entityType: 'OrganizationOnboardingDocument',
      entityId: document.id,
      actor,
      metadata: { sessionId: id, documentType, qualityStatus: quality.status },
    });
    return document;
  }

  async runExtraction(
    sessionId: string,
    documentId: string,
    actor: AuthenticatedRequestUser,
  ) {
    const session = await this.mutableSession(sessionId);
    const document = await this.prisma.organizationOnboardingDocument.findFirst(
      {
        where: { id: documentId, sessionId, archivedAt: null },
        include: { file: true, policy: true },
      },
    );
    if (!document)
      throw new NotFoundException('Onboarding document not found.');
    if (
      ['CORRUPTED', 'PASSWORD_PROTECTED', 'UNSUPPORTED'].includes(
        document.qualityStatus,
      )
    )
      throw new BadRequestException(
        'Document quality does not permit extraction.',
      );
    await this.assertExtractionLimits(actor.userId);
    await this.prisma.organizationOnboardingSession.update({
      where: { id: sessionId },
      data: { status: OrganizationOnboardingStatus.EXTRACTION_PENDING },
    });
    await this.prisma.organizationOnboardingDocument.update({
      where: { id: documentId },
      data: { extractionStatus: OrganizationDocumentExtractionStatus.PENDING },
    });
    await this.audit.record({
      action: 'platform.organization_onboarding.extraction_started',
      entityType: 'OrganizationOnboardingDocument',
      entityId: documentId,
      actor,
      metadata: { sessionId },
    });
    try {
      const object = await this.storage.readObject({
        bucket: document.file.bucket,
        objectKey: document.file.objectKey,
        purpose: 'QUARANTINE',
      });
      const buffer = await this.streamToBuffer(object.body);
      const extraction = await this.cloudflare.extract({
        buffer,
        mimeType: document.file.mimeType ?? 'application/octet-stream',
        documentType: document.documentType,
        requestedFields:
          document.policy?.requiredFieldCodes ??
          session.supportedOrganizationType.requiredFieldCodes,
      });
      await this.prisma.$transaction(async (tx) => {
        await tx.organizationFieldEvidence.deleteMany({
          where: { documentId },
        });
        for (const field of extraction.result.fields) {
          const sensitive = SENSITIVE_FIELDS.has(field.fieldCode);
          const threshold = Number(document.policy?.minimumConfidence ?? 0.9);
          const reviewStatus =
            sensitive || field.confidence < threshold
              ? FieldEvidenceReviewStatus.REVIEW_REQUIRED
              : FieldEvidenceReviewStatus.AUTO_ACCEPTED;
          await tx.organizationFieldEvidence.create({
            data: {
              sessionId,
              documentId,
              fieldCode: field.fieldCode,
              rawValue: field.rawValue,
              normalizedValue: field.normalizedValue,
              finalValue:
                reviewStatus === FieldEvidenceReviewStatus.AUTO_ACCEPTED
                  ? field.normalizedValue
                  : null,
              confidence: field.confidence,
              documentType: document.documentType,
              pageNumber: field.pageNumber,
              boundingBox: field.boundingBox ?? undefined,
              extractionProvider: 'CLOUDFLARE_WORKERS_AI',
              model: extraction.model,
              reviewStatus,
            },
          });
        }
        const extractionResult = {
          documentType: extraction.result.documentType,
          detectedDocumentType: extraction.result.detectedDocumentType,
          documentTypeConfidence: extraction.result.documentTypeConfidence,
          language: extraction.result.language,
          fields: extraction.result.fields.map((field) => ({
            ...field,
            boundingBox: field.boundingBox ?? null,
            rawValue: field.rawValue?.slice(0, 5000) ?? null,
          })),
          missingFields: extraction.result.missingFields,
          warnings: extraction.result.warnings,
          providerRequestId: extraction.providerRequestId,
        } as Prisma.InputJsonValue;
        await tx.organizationOnboardingDocument.update({
          where: { id: documentId },
          data: {
            extractionProvider: 'CLOUDFLARE_WORKERS_AI',
            extractionModel: extraction.model,
            extractionStatus: OrganizationDocumentExtractionStatus.COMPLETED,
            extractionResult,
            providerRequestId: extraction.providerRequestId,
            extractedAt: new Date(),
          },
        });
      });
      await this.recomputeSession(sessionId);
      await this.audit.record({
        action: 'platform.organization_onboarding.extraction_completed',
        entityType: 'OrganizationOnboardingDocument',
        entityId: documentId,
        actor,
        metadata: {
          sessionId,
          fieldCount: extraction.result.fields.length,
          provider: 'CLOUDFLARE_WORKERS_AI',
        },
      });
      return this.getDraft(sessionId);
    } catch (error) {
      await this.prisma.organizationOnboardingDocument.update({
        where: { id: documentId },
        data: { extractionStatus: OrganizationDocumentExtractionStatus.FAILED },
      });
      await this.prisma.organizationOnboardingSession.update({
        where: { id: sessionId },
        data: { status: OrganizationOnboardingStatus.REVIEW_REQUIRED },
      });
      await this.audit.record({
        action: 'platform.organization_onboarding.extraction_failed',
        entityType: 'OrganizationOnboardingDocument',
        entityId: documentId,
        actor,
        metadata: {
          sessionId,
          errorType: error instanceof Error ? error.name : 'UnknownError',
        },
      });
      throw error;
    }
  }

  async reviewField(
    sessionId: string,
    evidenceId: string,
    dto: ReviewFieldEvidenceDto,
    actor: AuthenticatedRequestUser,
  ) {
    await this.mutableSession(sessionId);
    const evidence = await this.prisma.organizationFieldEvidence.findFirst({
      where: { id: evidenceId, sessionId },
    });
    if (!evidence) throw new NotFoundException('Field evidence not found.');
    if (
      !new Set<FieldEvidenceReviewStatus>([
        FieldEvidenceReviewStatus.CONFIRMED,
        FieldEvidenceReviewStatus.CORRECTED,
        FieldEvidenceReviewStatus.REJECTED,
      ]).has(dto.action as FieldEvidenceReviewStatus)
    )
      throw new BadRequestException(
        'action must be CONFIRMED, CORRECTED, or REJECTED.',
      );
    if (
      dto.action === FieldEvidenceReviewStatus.CORRECTED &&
      !dto.finalValue?.trim()
    )
      throw new BadRequestException('finalValue is required for a correction.');
    const finalValue =
      dto.action === FieldEvidenceReviewStatus.REJECTED
        ? null
        : dto.action === FieldEvidenceReviewStatus.CORRECTED
          ? dto.finalValue!.trim()
          : evidence.normalizedValue;
    const updated = await this.prisma.organizationFieldEvidence.update({
      where: { id: evidenceId },
      data: {
        finalValue,
        reviewStatus: dto.action,
        manuallyEdited: dto.action === FieldEvidenceReviewStatus.CORRECTED,
        reviewedByUserId: actor.userId,
        reviewedAt: new Date(),
        correctionReason: dto.reason?.trim() || null,
      },
    });
    await this.recomputeSession(sessionId);
    await this.audit.record({
      action: `platform.organization_onboarding.field_${dto.action!.toLowerCase()}`,
      entityType: 'OrganizationFieldEvidence',
      entityId: evidenceId,
      actor,
      metadata: {
        sessionId,
        fieldCode: evidence.fieldCode,
        manuallyEdited: dto.action === FieldEvidenceReviewStatus.CORRECTED,
      },
    });
    return updated;
  }

  async progress(id: string) {
    const session = await this.getDraft(id);
    const policies = await this.requiredDocuments(id);
    const remaining = policies.filter(
      (policy) =>
        !session.documents.some(
          (document) =>
            document.policyId === policy.id &&
            document.extractionStatus ===
              OrganizationDocumentExtractionStatus.COMPLETED,
        ),
    );
    const missing = session.missingFields;
    const ranked = remaining
      .map((policy) => ({
        policy,
        coverage: policy.requiredFieldCodes.filter((field) =>
          missing.includes(field),
        ).length,
      }))
      .sort(
        (a, b) =>
          b.coverage - a.coverage ||
          a.policy.sortOrder - b.policy.sortOrder ||
          Number(b.policy.isRequired) - Number(a.policy.isRequired),
      );
    return {
      completedFields: session.completedFields,
      missingFields: session.missingFields,
      conflictFields: session.conflictFields,
      nextRequiredDocument: ranked[0]?.policy ?? null,
      alternativeDocuments: ranked.slice(1).map((item) => item.policy),
      canProceed: session.conflictFields.length === 0,
      canCreateOrganization:
        session.status === OrganizationOnboardingStatus.READY_TO_CREATE,
    };
  }

  async complete(id: string, actor: AuthenticatedRequestUser) {
    await this.mutableSession(id);
    await this.recomputeSession(id);
    const fresh = await this.getDraft(id);
    if (fresh.status !== OrganizationOnboardingStatus.READY_TO_CREATE)
      throw new ConflictException(
        'Onboarding requirements must be completed and reviewed before organization creation.',
      );
    const legacyType = fresh.supportedOrganizationType.legacyOrganizationType;
    if (!legacyType)
      throw new ConflictException(
        'The selected organization type is not mapped to a compatible legacy type yet.',
      );
    if (legacyType === OrganizationType.PLATFORM) {
      const exists = await this.prisma.organization.count({
        where: { type: OrganizationType.PLATFORM },
      });
      if (exists)
        throw new ConflictException('A platform organization already exists.');
    }
    const excludedStatuses = new Set<FieldEvidenceReviewStatus>([
      FieldEvidenceReviewStatus.REJECTED,
      FieldEvidenceReviewStatus.CONFLICT,
    ]);
    const values = new Map(
      fresh.fieldEvidence
        .filter(
          (field) =>
            field.finalValue && !excludedStatuses.has(field.reviewStatus),
        )
        .map((field) => [field.fieldCode, field.finalValue!]),
    );
    const operational = fresh.operationalData as Record<string, unknown>;
    const name =
      values.get('legalName') ??
      values.get('tradeName') ??
      this.optionalText(operational.displayName) ??
      fresh.supportedOrganizationType.code;
    const slug = await this.uniqueSlug(name);
    const organization = await this.prisma.$transaction(async (tx) => {
      const created = await tx.organization.create({
        data: {
          name,
          slug,
          type: legacyType,
          country: fresh.countryCode,
          timezone: this.optionalText(operational.timezone),
          currency: this.optionalText(operational.currency),
          defaultLanguage: this.optionalText(operational.preferredLanguage),
          status: OrganizationStatus.DRAFT,
          supportedOrganizationTypeId: fresh.supportedOrganizationTypeId,
          profile: {
            create: {
              legalName: values.get('legalName'),
              tradeName: values.get('tradeName'),
              displayName: this.optionalText(operational.displayName),
              commercialRegisterNumber: values.get('commercialRegisterNumber'),
              commercialRegisterOffice: values.get('commercialRegisterOffice'),
              taxNumber: values.get('taxNumber'),
              vatNumber: values.get('vatNumber'),
              taxOffice: values.get('taxOffice'),
              countryCode: fresh.countryCode,
              legalForm: fresh.legalForm,
              preferredLanguage: this.optionalText(
                operational.preferredLanguage,
              ),
              defaultCurrency: this.optionalText(operational.currency),
              addressLine1: values.get('addressLine1'),
              addressLine2: values.get('addressLine2'),
            },
          },
        },
      });
      await tx.organizationOnboardingSession.update({
        where: { id },
        data: {
          organizationId: created.id,
          status: OrganizationOnboardingStatus.COMPLETED,
          completedAt: new Date(),
        },
      });
      return created;
    });
    await this.audit.record({
      action: 'platform.organization_onboarding.organization_created',
      entityType: 'Organization',
      entityId: organization.id,
      actor,
      organizationId: organization.id,
      metadata: {
        onboardingSessionId: id,
        supportedOrganizationTypeId: fresh.supportedOrganizationTypeId,
      },
    });
    return organization;
  }

  async cancel(id: string, actor: AuthenticatedRequestUser) {
    await this.mutableSession(id);
    const session = await this.prisma.organizationOnboardingSession.update({
      where: { id },
      data: {
        status: OrganizationOnboardingStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });
    await this.audit.record({
      action: 'platform.organization_onboarding.cancelled',
      entityType: 'OrganizationOnboardingSession',
      entityId: id,
      actor,
    });
    return session;
  }

  private async recomputeSession(id: string) {
    const session = await this.prisma.organizationOnboardingSession.findUnique({
      where: { id },
      include: { supportedOrganizationType: true, fieldEvidence: true },
    });
    if (!session) throw new NotFoundException('Onboarding session not found.');
    const policies = await this.matchingPolicies(
      session.countryCode,
      session.supportedOrganizationTypeId,
      session.legalForm,
      session.supportedOrganizationType.legacyOrganizationType,
    );
    const required = this.requiredFields(
      policies,
      session.supportedOrganizationType.requiredFieldCodes,
    );
    const groups = new Map<string, typeof session.fieldEvidence>();
    for (const field of session.fieldEvidence.filter(
      (item) => item.reviewStatus !== FieldEvidenceReviewStatus.REJECTED,
    ))
      groups.set(field.fieldCode, [
        ...(groups.get(field.fieldCode) ?? []),
        field,
      ]);
    const conflicts: string[] = [];
    for (const [fieldCode, items] of groups) {
      const values = new Set(
        items
          .map((item) => item.finalValue ?? item.normalizedValue)
          .filter(Boolean),
      );
      if (values.size > 1) {
        conflicts.push(fieldCode);
        await this.prisma.organizationFieldEvidence.updateMany({
          where: {
            id: { in: items.map((item) => item.id) },
            reviewStatus: {
              notIn: [
                FieldEvidenceReviewStatus.CONFIRMED,
                FieldEvidenceReviewStatus.CORRECTED,
              ],
            },
          },
          data: {
            reviewStatus: FieldEvidenceReviewStatus.CONFLICT,
            finalValue: null,
          },
        });
      }
    }
    const completedStatuses = new Set<FieldEvidenceReviewStatus>([
      FieldEvidenceReviewStatus.AUTO_ACCEPTED,
      FieldEvidenceReviewStatus.CONFIRMED,
      FieldEvidenceReviewStatus.CORRECTED,
    ]);
    const completed = [...groups.entries()]
      .filter(
        ([field, items]) =>
          !conflicts.includes(field) &&
          items.some(
            (item) =>
              Boolean(item.finalValue) &&
              completedStatuses.has(item.reviewStatus),
          ),
      )
      .map(([field]) => field);
    const missing = required.filter((field) => !completed.includes(field));
    const status =
      conflicts.length || missing.length
        ? OrganizationOnboardingStatus.REVIEW_REQUIRED
        : OrganizationOnboardingStatus.READY_TO_CREATE;
    return this.prisma.organizationOnboardingSession.update({
      where: { id },
      data: {
        completedFields: completed,
        missingFields: missing,
        conflictFields: conflicts,
        status,
      },
    });
  }

  private async matchingPolicies(
    countryCode: string,
    supportedOrganizationTypeId: string,
    legalForm: string | null | undefined,
    legacy: OrganizationType | null,
  ) {
    const common = { countryCode, isActive: true, isArchived: false } as const;
    const orderBy = [
      { sortOrder: 'asc' as const },
      { createdAt: 'asc' as const },
    ];
    if (legalForm) {
      const dynamicExact = await this.prisma.requiredDocumentPolicy.findMany({
        where: {
          ...common,
          supportedOrganizationTypeId,
          legalForm: legalForm as any,
        },
        orderBy,
      });
      if (dynamicExact.length) return dynamicExact;
    }
    const dynamicGeneric =
      await this.prisma.requiredDocumentPolicy.findMany({
        where: {
          ...common,
          supportedOrganizationTypeId,
          legalForm: null,
        },
        orderBy,
      });
    if (dynamicGeneric.length || !legacy) return dynamicGeneric;
    if (legalForm) {
      const legacyExact = await this.prisma.requiredDocumentPolicy.findMany({
        where: {
          ...common,
          supportedOrganizationTypeId: null,
          organizationType: legacy,
          legalForm: legalForm as any,
        },
        orderBy,
      });
      if (legacyExact.length) return legacyExact;
    }
    return this.prisma.requiredDocumentPolicy.findMany({
      where: {
        ...common,
        supportedOrganizationTypeId: null,
        organizationType: legacy,
        legalForm: null,
      },
      orderBy,
    });
  }

  private requiredFields(
    policies: Array<{ requiredFieldCodes: string[]; isRequired: boolean }>,
    typeFields: string[],
  ) {
    return [
      ...new Set([
        ...typeFields,
        ...policies
          .filter((policy) => policy.isRequired)
          .flatMap((policy) => policy.requiredFieldCodes),
      ]),
    ];
  }
  private async mutableSession(id: string) {
    const session = await this.prisma.organizationOnboardingSession.findUnique({
      where: { id },
      include: {
        supportedOrganizationType: true,
        documents: { where: { archivedAt: null } },
      },
    });
    if (!session) throw new NotFoundException('Onboarding session not found.');
    const terminal = new Set<OrganizationOnboardingStatus>([
      OrganizationOnboardingStatus.COMPLETED,
      OrganizationOnboardingStatus.CANCELLED,
      OrganizationOnboardingStatus.EXPIRED,
    ]);
    if (terminal.has(session.status) || session.expiresAt <= new Date())
      throw new ConflictException('Onboarding session is no longer mutable.');
    return session;
  }
  private async supportedType(id: string) {
    const record = await this.prisma.supportedOrganizationType.findUnique({
      where: { id },
    });
    if (!record)
      throw new NotFoundException('Supported organization type not found.');
    return record;
  }
  private supportedTypeData(
    dto: SupportedOrganizationTypeDto,
    creating: boolean,
  ): Prisma.SupportedOrganizationTypeUncheckedCreateInput {
    const code = dto.code?.trim().toUpperCase();
    if (creating && (!code || !/^[A-Z][A-Z0-9_]{1,63}$/.test(code)))
      throw new BadRequestException(
        'A valid organization type code is required.',
      );
    return {
      id: creating ? randomUUID() : undefined,
      code: code as string,
      legacyOrganizationType: dto.legacyOrganizationType,
      names: dto.names ?? undefined,
      descriptions: dto.descriptions ?? undefined,
      iconObjectKey: dto.iconObjectKey?.trim() || null,
      allowedCountryCodes: dto.allowedCountryCodes?.map((item) =>
        item.trim().toUpperCase(),
      ),
      allowedLegalForms: dto.allowedLegalForms,
      requiredFieldCodes: this.fieldCodes(dto.requiredFieldCodes),
      isIndividual: dto.isIndividual,
      isActive: dto.isActive,
      isArchived: dto.isArchived,
      sortOrder: dto.sortOrder,
    };
  }
  private async exchangeRateData(dto: ExchangeRateDto, creating: boolean) {
    const baseCurrencyCode = dto.baseCurrencyCode
      ? this.code(dto.baseCurrencyCode, 'baseCurrencyCode', 3, 3)
      : undefined;
    const quoteCurrencyCode = dto.quoteCurrencyCode
      ? this.code(dto.quoteCurrencyCode, 'quoteCurrencyCode', 3, 3)
      : undefined;
    if (creating && (!baseCurrencyCode || !quoteCurrencyCode))
      throw new BadRequestException('Both currency codes are required.');
    if (
      baseCurrencyCode &&
      quoteCurrencyCode &&
      baseCurrencyCode === quoteCurrencyCode
    )
      throw new BadRequestException(
        'Base and quote currencies must be different.',
      );
    await this.assertActiveCurrency(baseCurrencyCode);
    await this.assertActiveCurrency(quoteCurrencyCode);
    const rate =
      dto.rate === undefined ? undefined : new Prisma.Decimal(dto.rate);
    if (rate && rate.lte(0))
      throw new BadRequestException('Exchange rate must be greater than zero.');
    return {
      baseCurrencyCode,
      quoteCurrencyCode,
      rate,
      provider: dto.provider?.trim() || null,
      sourceType: dto.sourceType ?? ExchangeRateSourceType.MANUAL,
      fetchedAt: this.date(dto.fetchedAt),
      expiresAt: this.date(dto.expiresAt),
      isActive: dto.isActive,
      metadata: dto.metadata as Prisma.InputJsonValue | undefined,
    };
  }
  private async assertActiveCurrency(code: string | undefined) {
    if (!code) return;
    const record = await this.prisma.platformMetadataRecord.findUnique({
      where: { category_code: { category: 'CURRENCY', code } },
    });
    if (!record || !record.isActive || record.isArchived)
      throw new BadRequestException(`Currency ${code} is not active.`);
  }
  private operationalData(value: Record<string, unknown> | undefined) {
    const data: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value ?? {})) {
      if (LEGAL_FIELDS.has(key))
        throw new BadRequestException(
          `Legal field ${key} must come from document evidence.`,
        );
      if (!OPERATIONAL_FIELDS.has(key))
        throw new BadRequestException(`Unsupported operational field: ${key}.`);
      if (typeof item === 'string') data[key] = item.trim().slice(0, 300);
    }
    return data;
  }
  private fieldCodes(value: string[] | undefined) {
    return value
      ? [
          ...new Set(
            value
              .map((item) => item.trim())
              .filter((item) => /^[A-Za-z][A-Za-z0-9_.-]{0,99}$/.test(item)),
          ),
        ]
      : undefined;
  }
  private required(value: string | undefined, field: string) {
    if (!value?.trim()) throw new BadRequestException(`${field} is required.`);
    return value.trim();
  }
  private code(
    value: string | undefined,
    field: string,
    min: number,
    max: number,
  ) {
    const result = this.required(value, field).toUpperCase();
    if (!new RegExp(`^[A-Z]{${min},${max}}$`).test(result))
      throw new BadRequestException(`${field} is invalid.`);
    return result;
  }
  private optionalText(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }
  private date(value: string | undefined) {
    if (!value) return undefined;
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
      throw new BadRequestException('Invalid date value.');
    return date;
  }
  private extension(mimeType: string) {
    return (
      (
        {
          'application/pdf': 'pdf',
          'image/jpeg': 'jpg',
          'image/png': 'png',
          'image/webp': 'webp',
        } as Record<string, string>
      )[mimeType] ?? 'bin'
    );
  }
  private envNumber(name: string, fallback: number) {
    const value = Number(process.env[name] ?? fallback);
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }
  private async streamToBuffer(stream: Readable) {
    const chunks: Buffer[] = [];
    for await (const chunk of stream)
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    return Buffer.concat(chunks);
  }
  private async assertExtractionLimits(userId: string) {
    const now = Date.now();
    const [daily, monthly] = await Promise.all([
      this.prisma.organizationOnboardingDocument.count({
        where: {
          session: { createdById: userId },
          extractionStatus: {
            not: OrganizationDocumentExtractionStatus.NOT_REQUESTED,
          },
          updatedAt: { gte: new Date(now - 86_400_000) },
        },
      }),
      this.prisma.organizationOnboardingDocument.count({
        where: {
          session: { createdById: userId },
          extractionStatus: {
            not: OrganizationDocumentExtractionStatus.NOT_REQUESTED,
          },
          updatedAt: { gte: new Date(now - 30 * 86_400_000) },
        },
      }),
    ]);
    if (daily >= this.envNumber('DOCUMENT_EXTRACTION_DAILY_LIMIT_PER_ORG', 30))
      throw new ConflictException('Daily document extraction limit reached.');
    if (
      monthly >=
      this.envNumber('DOCUMENT_EXTRACTION_MONTHLY_LIMIT_PER_ORG', 300)
    )
      throw new ConflictException('Monthly document extraction limit reached.');
  }
  private async uniqueSlug(name: string) {
    const base =
      name
        .normalize('NFKD')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 50) || 'organization';
    for (let index = 0; index < 100; index += 1) {
      const slug = index ? `${base}-${index + 1}` : base;
      if (
        !(await this.prisma.organization.findUnique({
          where: { slug },
          select: { id: true },
        }))
      )
        return slug;
    }
    return `${base}-${randomUUID().slice(0, 8)}`;
  }
}

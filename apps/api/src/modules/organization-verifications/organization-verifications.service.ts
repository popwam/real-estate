import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  assertSameOrganizationOrPlatform,
  isPlatformUser,
} from '../../common/organization-scope';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../database/prisma.service';
import {
  SubmitVerificationDocumentDto,
  SubmitVerificationDto,
} from './dto/submit-verification.dto';
import { ReviewVerificationDto } from './dto/review-verification.dto';

const OWNER_OR_ADMIN_ROLES = new Set([
  'developer_owner',
  'developer_admin',
  'brokerage_owner',
  'brokerage_admin',
  'individual_broker',
  'platform_owner',
  'platform_admin',
]);

const REQUIRED_DOCUMENT_TYPES = new Set([
  'COMMERCIAL_REGISTRATION',
  'TAX_CARD',
  'LEGAL_REPRESENTATIVE_ID',
  'COMPANY_ADDRESS_PROOF',
  'BROKERAGE_LICENSE',
  'SIGNED_POPWAM_AGREEMENT',
  'NATIONAL_ID',
  'PERSONAL_PHOTO',
  'EXPERIENCE_CERTIFICATE',
]);

@Injectable()
export class OrganizationVerificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async submit(
    organizationId: string,
    dto: SubmitVerificationDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    this.assertCanSubmit(organizationId, currentUser);
    this.assertSubmitDto(dto);

    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found.');
    }

    assertSameOrganizationOrPlatform(currentUser, organization.id);

    const result = await this.prisma.$transaction(async (tx) => {
      const createdDocuments: any[] = [];

      for (const document of dto.documents) {
        await this.assertUploadedFileBelongsToOrganization(
          document.uploadedFileId,
          organization.id,
        );

        createdDocuments.push(
          await tx.organizationVerification.create({
            data: {
              organizationId: organization.id,
              documentType: document.documentType.trim(),
              uploadedFileId: document.uploadedFileId?.trim() || undefined,
              documentUrl: document.documentUrl?.trim() || undefined,
              expiryDate: this.parseOptionalDate(document.expiryDate),
              notes: document.notes?.trim() || dto.notes?.trim() || undefined,
              status: 'PENDING_REVIEW',
            },
            include: { uploadedFile: true, organization: true },
          }),
        );
      }

      const updatedOrganization = await tx.organization.update({
        where: { id: organization.id },
        data: { status: 'PENDING_REVIEW' },
        include: { profile: true },
      });

      return { organization: updatedOrganization, documents: createdDocuments };
    });

    await this.auditLogs.record({
      action: 'organization.submitted_for_verification',
      entityType: 'Organization',
      entityId: organization.id,
      organizationId: organization.id,
      actor: currentUser,
      metadata: {
        documentTypes: result.documents.map((document) => document.documentType),
        documentCount: result.documents.length,
      },
    });

    return result;
  }

  async findPending(currentUser: AuthenticatedRequestUser) {
    this.assertPlatformReviewer(currentUser);

    return this.prisma.organizationVerification.findMany({
      where: { status: 'PENDING_REVIEW' },
      include: {
        organization: { include: { profile: true } },
        uploadedFile: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string, currentUser: AuthenticatedRequestUser) {
    const verification = await this.prisma.organizationVerification.findUnique({
      where: { id },
      include: {
        organization: { include: { profile: true } },
        uploadedFile: true,
        verifiedBy: true,
      },
    });

    if (!verification) {
      throw new NotFoundException('Verification document not found.');
    }

    assertSameOrganizationOrPlatform(currentUser, verification.organizationId);

    return verification;
  }

  async approve(
    id: string,
    dto: ReviewVerificationDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    this.assertPlatformReviewer(currentUser);

    const existing = await this.findOne(id, currentUser);
    const updated = await this.prisma.$transaction(async (tx) => {
      const verification = await tx.organizationVerification.update({
        where: { id },
        data: {
          status: 'APPROVED',
          verifiedById: currentUser.userId,
          verifiedAt: new Date(),
          notes: dto.notes?.trim() || existing.notes,
          rejectionReason: null,
        },
        include: {
          organization: { include: { profile: true } },
          uploadedFile: true,
        },
      });

      await tx.organization.update({
        where: { id: verification.organizationId },
        data: { status: 'APPROVED' },
      });

      return verification;
    });

    await this.auditLogs.record({
      action: 'organization.verification_approved',
      entityType: 'OrganizationVerification',
      entityId: id,
      organizationId: updated.organizationId,
      actor: currentUser,
      metadata: {
        before: { status: existing.status },
        after: { status: updated.status, organizationStatus: 'APPROVED' },
      },
    });

    return updated;
  }

  async reject(
    id: string,
    dto: ReviewVerificationDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    this.assertPlatformReviewer(currentUser);
    this.assertReason(dto, 'Rejection reason is required.');

    const existing = await this.findOne(id, currentUser);
    const updated = await this.prisma.$transaction(async (tx) => {
      const verification = await tx.organizationVerification.update({
        where: { id },
        data: {
          status: 'REJECTED',
          verifiedById: currentUser.userId,
          verifiedAt: new Date(),
          rejectionReason: dto.reason!.trim(),
          notes: dto.notes?.trim() || existing.notes,
        },
        include: {
          organization: { include: { profile: true } },
          uploadedFile: true,
        },
      });

      await tx.organization.update({
        where: { id: verification.organizationId },
        data: { status: 'DRAFT' },
      });

      return verification;
    });

    await this.auditLogs.record({
      action: 'organization.verification_rejected',
      entityType: 'OrganizationVerification',
      entityId: id,
      organizationId: updated.organizationId,
      actor: currentUser,
      metadata: {
        before: { status: existing.status },
        after: { status: updated.status, organizationStatus: 'DRAFT' },
        reason: dto.reason!.trim(),
      },
    });

    return updated;
  }

  async requestMore(
    id: string,
    dto: ReviewVerificationDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    this.assertPlatformReviewer(currentUser);
    this.assertReason(dto, 'Request-more reason is required.');

    const existing = await this.findOne(id, currentUser);
    const updated = await this.prisma.organizationVerification.update({
      where: { id },
      data: {
        status: 'PENDING_REVIEW',
        verifiedById: currentUser.userId,
        verifiedAt: new Date(),
        rejectionReason: dto.reason!.trim(),
        notes: dto.notes?.trim() || existing.notes,
      },
      include: {
        organization: { include: { profile: true } },
        uploadedFile: true,
      },
    });

    await this.auditLogs.record({
      action: 'organization.verification_more_requested',
      entityType: 'OrganizationVerification',
      entityId: id,
      organizationId: updated.organizationId,
      actor: currentUser,
      metadata: {
        before: { status: existing.status },
        after: { status: updated.status },
        reason: dto.reason!.trim(),
      },
    });

    return updated;
  }

  async findOrganizationReview(
    organizationId: string,
    currentUser: AuthenticatedRequestUser,
  ) {
    this.assertPlatformReviewer(currentUser);

    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        profile: true,
        verifications: {
          include: { uploadedFile: true, verifiedBy: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found.');
    }

    return organization;
  }

  private assertCanSubmit(
    organizationId: string,
    currentUser: AuthenticatedRequestUser,
  ) {
    if (isPlatformUser(currentUser)) {
      return;
    }

    if (currentUser.organizationId !== organizationId) {
      throw new ForbiddenException('Cannot submit another organization.');
    }

    if (!OWNER_OR_ADMIN_ROLES.has(currentUser.role)) {
      throw new ForbiddenException('Owner or admin role is required.');
    }
  }

  private assertPlatformReviewer(currentUser: AuthenticatedRequestUser) {
    if (
      isPlatformUser(currentUser) &&
      currentUser.permissions.includes('organizations.verify')
    ) {
      return;
    }

    throw new ForbiddenException('Platform verification permission is required.');
  }

  private assertSubmitDto(dto: SubmitVerificationDto) {
    if (!Array.isArray(dto.documents) || dto.documents.length === 0) {
      throw new BadRequestException('documents are required.');
    }

    for (const document of dto.documents) {
      this.assertDocumentDto(document);
    }
  }

  private assertDocumentDto(document: SubmitVerificationDocumentDto) {
    if (!document.documentType?.trim()) {
      throw new BadRequestException('documentType is required.');
    }

    if (!REQUIRED_DOCUMENT_TYPES.has(document.documentType.trim())) {
      throw new BadRequestException(`Unsupported documentType: ${document.documentType}`);
    }

    if (!document.uploadedFileId?.trim() && !document.documentUrl?.trim()) {
      throw new BadRequestException('uploadedFileId or documentUrl is required.');
    }
  }

  private assertReason(dto: ReviewVerificationDto, message: string) {
    if (!dto.reason?.trim()) {
      throw new BadRequestException(message);
    }
  }

  private async assertUploadedFileBelongsToOrganization(
    uploadedFileId: string | undefined,
    organizationId: string,
  ) {
    if (!uploadedFileId?.trim()) {
      return;
    }

    const file = await this.prisma.uploadedFile.findUnique({
      where: { id: uploadedFileId },
    });

    if (!file) {
      throw new NotFoundException('Uploaded file metadata not found.');
    }

    if (file.organizationId && file.organizationId !== organizationId) {
      throw new ForbiddenException('Uploaded file belongs to another organization.');
    }
  }

  private parseOptionalDate(value: string | undefined) {
    if (!value?.trim()) {
      return undefined;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('expiryDate is invalid.');
    }

    return date;
  }
}

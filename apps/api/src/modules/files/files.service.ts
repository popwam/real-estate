import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { assertSameOrganizationOrPlatform, isPlatformUser } from '../../common/organization-scope';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../database/prisma.service';
import { CreateFileMetadataDto } from './dto/create-file-metadata.dto';
import { LinkFileToVerificationDto } from './dto/link-file-to-verification.dto';

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async createMetadata(
    dto: CreateFileMetadataDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    this.assertCreateDto(dto);

    const organizationId = this.resolveOrganizationId(dto.organizationId, currentUser);
    const file = await this.prisma.uploadedFile.create({
      data: {
        organizationId,
        uploadedById: currentUser.userId,
        bucket: dto.bucket?.trim() || 'metadata-placeholder',
        objectKey: dto.objectKey.trim(),
        url: this.optionalString(dto.url),
        mimeType: this.optionalString(dto.mimeType),
        sizeBytes: dto.sizeBytes,
        checksum: this.optionalString(dto.checksum),
      },
    });

    await this.auditLogs.record({
      action: 'file.metadata_created',
      entityType: 'UploadedFile',
      entityId: file.id,
      organizationId,
      actor: currentUser,
      metadata: {
        objectKey: file.objectKey,
        storageProvider: 'abstract',
      },
    });

    return file;
  }

  async findOne(id: string, currentUser: AuthenticatedRequestUser) {
    const file = await this.prisma.uploadedFile.findUnique({
      where: { id },
      include: { organizationVerifications: true },
    });

    if (!file) {
      throw new NotFoundException('File metadata not found.');
    }

    assertSameOrganizationOrPlatform(currentUser, file.organizationId);

    return file;
  }

  async linkToVerification(
    id: string,
    dto: LinkFileToVerificationDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    if (!dto.verificationId?.trim()) {
      throw new BadRequestException('verificationId is required.');
    }

    const file = await this.findOne(id, currentUser);
    const verification = await this.prisma.organizationVerification.findUnique({
      where: { id: dto.verificationId },
    });

    if (!verification) {
      throw new NotFoundException('Verification document not found.');
    }

    assertSameOrganizationOrPlatform(currentUser, verification.organizationId);

    if (file.organizationId && file.organizationId !== verification.organizationId) {
      throw new ForbiddenException('File belongs to another organization.');
    }

    const updated = await this.prisma.organizationVerification.update({
      where: { id: verification.id },
      data: {
        uploadedFileId: file.id,
        documentUrl: file.url ?? verification.documentUrl,
        documentType: dto.documentType?.trim() || verification.documentType,
      },
      include: { uploadedFile: true, organization: true },
    });

    await this.auditLogs.record({
      action: 'file.linked_to_verification',
      entityType: 'OrganizationVerification',
      entityId: verification.id,
      organizationId: verification.organizationId,
      actor: currentUser,
      metadata: {
        uploadedFileId: file.id,
        documentType: updated.documentType,
      },
    });

    return updated;
  }

  private resolveOrganizationId(
    requestedOrganizationId: string | undefined,
    currentUser: AuthenticatedRequestUser,
  ) {
    if (isPlatformUser(currentUser)) {
      return requestedOrganizationId?.trim() || currentUser.organizationId;
    }

    if (
      requestedOrganizationId &&
      requestedOrganizationId !== currentUser.organizationId
    ) {
      throw new ForbiddenException('Cannot create file metadata for another organization.');
    }

    if (!currentUser.organizationId) {
      throw new ForbiddenException('Current organization is required.');
    }

    return currentUser.organizationId;
  }

  private assertCreateDto(dto: CreateFileMetadataDto) {
    if (!dto.objectKey?.trim()) {
      throw new BadRequestException('objectKey is required.');
    }

    if (
      dto.sizeBytes !== undefined &&
      (!Number.isInteger(dto.sizeBytes) || dto.sizeBytes < 0)
    ) {
      throw new BadRequestException('sizeBytes must be a positive integer.');
    }
  }

  private optionalString(value: string | undefined) {
    const trimmed = value?.trim();
    return trimmed || undefined;
  }
}

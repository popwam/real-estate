import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import {
  assertSameOrganizationOrPlatform,
  isPlatformUser,
} from '../../common/organization-scope';
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

    const organizationId = this.resolveOrganizationId(
      dto.organizationId,
      currentUser,
    );
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

  async uploadAttendanceEvidencePhoto(
    file: any,
    purpose: unknown,
    currentUser: AuthenticatedRequestUser,
  ) {
    if (!currentUser.organizationId) {
      throw new ForbiddenException('Current organization is required.');
    }

    if (!file || !file.buffer || !file.size) {
      throw new BadRequestException('Attendance photo file is required.');
    }

    const normalizedPurpose = this.attendancePurpose(purpose);
    const mimeType = this.attendanceMimeType(file.mimetype);
    const extension = this.attendanceExtension(file.originalname, mimeType);
    const maxSizeBytes = Number(
      process.env.ATTENDANCE_PHOTO_MAX_BYTES ?? 5 * 1024 * 1024,
    );
    if (file.size > maxSizeBytes) {
      throw new BadRequestException('Attendance photo is too large.');
    }

    const root =
      process.env.FILE_STORAGE_LOCAL_ROOT || join(process.cwd(), 'storage');
    const objectKey = [
      'attendance',
      currentUser.organizationId,
      currentUser.userId,
      `${Date.now()}-${randomUUID()}${extension}`,
    ].join('/');
    const absolutePath = join(root, objectKey);
    await mkdir(
      join(root, 'attendance', currentUser.organizationId, currentUser.userId),
      { recursive: true },
    );
    await writeFile(absolutePath, file.buffer);

    const record = await this.prisma.uploadedFile.create({
      data: {
        organizationId: currentUser.organizationId,
        uploadedById: currentUser.userId,
        bucket: 'attendance-evidence',
        objectKey,
        mimeType,
        sizeBytes: file.size,
        checksum: this.optionalString(file.originalname),
      },
    });

    await this.auditLogs.record({
      action: 'attendance.evidence_photo_uploaded',
      entityType: 'UploadedFile',
      entityId: record.id,
      organizationId: currentUser.organizationId,
      actor: currentUser,
      metadata: {
        objectKey,
        purpose: normalizedPurpose,
        mimeType,
        sizeBytes: file.size,
        storageProvider: 'local',
      },
    });

    return {
      fileId: record.id,
      purpose: normalizedPurpose,
      mimeType,
      sizeBytes: file.size,
      createdAt: record.createdAt,
    };
  }

  async validateAttendanceEvidencePhoto(
    fileId: string | undefined,
    currentUser: AuthenticatedRequestUser,
  ) {
    const id = fileId?.trim();
    if (!id) return 'PHOTO_REQUIRED';

    const file = await this.prisma.uploadedFile.findUnique({ where: { id } });
    if (!file) return 'PHOTO_FILE_NOT_FOUND';
    if (file.organizationId !== currentUser.organizationId)
      return 'PHOTO_FILE_NOT_IN_ORGANIZATION';
    if (file.uploadedById !== currentUser.userId)
      return 'PHOTO_FILE_NOT_OWNED_BY_USER';
    if (
      file.bucket !== 'attendance-evidence' ||
      !file.objectKey.startsWith('attendance/')
    ) {
      return 'PHOTO_FILE_NOT_ATTENDANCE_EVIDENCE';
    }
    if (
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.mimeType ?? '')
    ) {
      return 'PHOTO_FILE_INVALID_TYPE';
    }
    const freshnessMinutes = Number(
      process.env.ATTENDANCE_PHOTO_FRESHNESS_MINUTES ?? 10,
    );
    const ageMs = Date.now() - new Date(file.createdAt).getTime();
    if (ageMs > freshnessMinutes * 60 * 1000) return 'PHOTO_FILE_TOO_OLD';

    return undefined;
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

    if (
      file.organizationId &&
      file.organizationId !== verification.organizationId
    ) {
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
      throw new ForbiddenException(
        'Cannot create file metadata for another organization.',
      );
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

  private attendancePurpose(value: unknown) {
    const purpose = typeof value === 'string' ? value.trim().toUpperCase() : '';
    if (purpose === 'ATTENDANCE_CHECK_OUT') return purpose;
    return 'ATTENDANCE_CHECK_IN';
  }

  private attendanceMimeType(value: unknown) {
    const mimeType =
      typeof value === 'string' ? value.trim().toLowerCase() : '';
    if (['image/jpeg', 'image/png', 'image/webp'].includes(mimeType))
      return mimeType;
    throw new BadRequestException(
      'Attendance photo must be a JPEG, PNG, or WebP image.',
    );
  }

  private attendanceExtension(originalName: unknown, mimeType: string) {
    const extension =
      typeof originalName === 'string'
        ? extname(originalName).toLowerCase()
        : '';
    const allowed = new Map([
      ['image/jpeg', new Set(['.jpg', '.jpeg'])],
      ['image/png', new Set(['.png'])],
      ['image/webp', new Set(['.webp'])],
    ]);
    if (!extension || !allowed.get(mimeType)?.has(extension)) {
      throw new BadRequestException(
        'Attendance photo extension does not match the image type.',
      );
    }
    return extension === '.jpeg' ? '.jpg' : extension;
  }

  private optionalString(value: string | undefined) {
    const trimmed = value?.trim();
    return trimmed || undefined;
  }
}

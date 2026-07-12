import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import {
  assertSameOrganizationOrPlatform,
  isPlatformUser,
} from '../../common/organization-scope';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../database/prisma.service';
import { CreateFileMetadataDto } from './dto/create-file-metadata.dto';
import { FileStorageService } from './file-storage.service';
import { LinkFileToVerificationDto } from './dto/link-file-to-verification.dto';

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
    private readonly storage: FileStorageService,
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

    const objectKey = [
      'attendance',
      currentUser.organizationId,
      currentUser.userId,
      `${Date.now()}-${randomUUID()}${extension}`,
    ].join('/');
    const stored = await this.storage.putObject({
      objectKey,
      body: file.buffer,
      mimeType,
    });

    const record = await this.prisma.uploadedFile.create({
      data: {
        organizationId: currentUser.organizationId,
        uploadedById: currentUser.userId,
        bucket: 'attendance-evidence',
        objectKey: stored.objectKey,
        mimeType,
        sizeBytes: file.size,
        checksum: this.optionalString(file.originalname),
        url: `${stored.provider}:${stored.bucket}`,
      },
    });

    await this.auditLogs.record({
      action: 'attendance.evidence_photo_uploaded',
      entityType: 'UploadedFile',
      entityId: record.id,
      organizationId: currentUser.organizationId,
      actor: currentUser,
      metadata: {
        objectKey: stored.objectKey,
        purpose: normalizedPurpose,
        mimeType,
        sizeBytes: file.size,
        storageProvider: stored.provider,
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

  async uploadHrEmployeeImage(
    file: any,
    purpose: unknown,
    organizationIdInput: string | undefined,
    currentUser: AuthenticatedRequestUser,
  ) {
    const organizationId = this.resolveOrganizationId(
      organizationIdInput,
      currentUser,
    );
    if (!organizationId) {
      throw new ForbiddenException('Organization is required for HR images.');
    }
    const normalizedPurpose = this.hrImagePurpose(purpose);
    this.assertCanManageHrImage(normalizedPurpose, currentUser);

    if (!file || !file.buffer || !file.size) {
      throw new BadRequestException('Employee image file is required.');
    }

    const mimeType = this.hrImageMimeType(file.mimetype);
    const extension = this.imageExtension(file.originalname, mimeType);
    const maxSizeBytes = Number(process.env.HR_IMAGE_MAX_BYTES ?? 5 * 1024 * 1024);
    if (file.size > maxSizeBytes) {
      throw new BadRequestException('Employee image is too large.');
    }

    const objectKey = [
      'hr',
      'employees',
      normalizedPurpose,
      organizationId,
      currentUser.userId,
      `${Date.now()}-${randomUUID()}${extension}`,
    ].join('/');
    const stored = await this.storage.putObject({
      objectKey,
      body: file.buffer,
      mimeType,
    });

    const record = await this.prisma.uploadedFile.create({
      data: {
        organizationId,
        uploadedById: currentUser.userId,
        bucket: 'hr-employee-images',
        objectKey: stored.objectKey,
        mimeType,
        sizeBytes: file.size,
        checksum: this.optionalString(file.originalname),
        url: `${stored.provider}:${stored.bucket}`,
      },
    });

    await this.auditLogs.record({
      action: 'hr.employee_image_uploaded',
      entityType: 'UploadedFile',
      entityId: record.id,
      organizationId,
      actor: currentUser,
      metadata: {
        purpose: normalizedPurpose,
        mimeType,
        sizeBytes: file.size,
        storageProvider: stored.provider,
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

  async uploadOrganizationDocument(
    file: any,
    organizationIdInput: string | undefined,
    currentUser: AuthenticatedRequestUser,
  ) {
    const organizationId = this.resolveOrganizationId(
      organizationIdInput,
      currentUser,
    );
    if (!organizationId) {
      throw new ForbiddenException('Organization is required for documents.');
    }

    if (!file || !file.buffer || !file.size) {
      throw new BadRequestException('Document file is required.');
    }

    const mimeType = this.organizationDocumentMimeType(file.mimetype);
    const extension = this.documentExtension(file.originalname, mimeType);
    const maxSizeBytes = Number(
      process.env.ORGANIZATION_DOCUMENT_MAX_BYTES ?? 10 * 1024 * 1024,
    );
    if (file.size > maxSizeBytes) {
      throw new BadRequestException('Document file is too large.');
    }

    const objectKey = [
      'organizations',
      organizationId,
      'documents',
      currentUser.userId,
      `${Date.now()}-${randomUUID()}${extension}`,
    ].join('/');
    const stored = await this.storage.putObject({
      objectKey,
      body: file.buffer,
      mimeType,
    });

    const record = await this.prisma.uploadedFile.create({
      data: {
        organizationId,
        uploadedById: currentUser.userId,
        bucket: 'organization-documents',
        objectKey: stored.objectKey,
        mimeType,
        sizeBytes: file.size,
        checksum: this.optionalString(file.originalname),
        url: `${stored.provider}:${stored.bucket}`,
      },
    });

    await this.auditLogs.record({
      action: 'organization.document_file_uploaded',
      entityType: 'UploadedFile',
      entityId: record.id,
      organizationId,
      actor: currentUser,
      metadata: {
        mimeType,
        sizeBytes: file.size,
        storageProvider: stored.provider,
      },
    });

    return {
      fileId: record.id,
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
    if ((file as any).deletedAt) return 'PHOTO_FILE_NOT_FOUND';
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

  async openAttendanceEvidenceFile(
    id: string,
    currentUser: AuthenticatedRequestUser,
  ) {
    const file = await this.prisma.uploadedFile.findUnique({ where: { id } });
    if (!file || (file as any).deletedAt) {
      throw new NotFoundException('File not found.');
    }
    this.assertCanAccessAttendanceEvidence(file, currentUser);
    const object = await this.storage.readObject({
      bucket: this.storageBucket(file),
      objectKey: file.objectKey,
    });
    return {
      stream: object.body,
      mimeType: file.mimeType || 'application/octet-stream',
      sizeBytes: file.sizeBytes,
      fileName: this.safeDownloadName(file),
    };
  }

  async openHrEmployeeImage(
    id: string,
    purpose: unknown,
    currentUser: AuthenticatedRequestUser,
  ) {
    const file = await this.prisma.uploadedFile.findUnique({ where: { id } });
    if (!file || (file as any).deletedAt) {
      throw new NotFoundException('File not found.');
    }
    this.assertCanAccessHrImage(file, purpose, currentUser);
    const object = await this.storage.readObject({
      bucket: this.storageBucket(file),
      objectKey: file.objectKey,
    });
    return {
      stream: object.body,
      mimeType: file.mimeType || 'application/octet-stream',
      sizeBytes: file.sizeBytes,
      fileName: this.safeDownloadName(file),
    };
  }

  async attendanceEvidenceMetadata(
    id: string,
    currentUser: AuthenticatedRequestUser,
  ) {
    const file = await this.prisma.uploadedFile.findUnique({ where: { id } });
    if (!file || (file as any).deletedAt) {
      throw new NotFoundException('File not found.');
    }
    this.assertCanAccessAttendanceEvidence(file, currentUser);
    return {
      id: file.id,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      createdAt: file.createdAt,
      uploadedById: file.uploadedById,
    };
  }

  async listExpiredAttendanceEvidenceDryRun(now = new Date()) {
    const retentionDays = Number(
      process.env.ATTENDANCE_EVIDENCE_RETENTION_DAYS,
    );
    if (!Number.isFinite(retentionDays) || retentionDays <= 0) {
      return {
        cleanupEnabled:
          process.env.ATTENDANCE_EVIDENCE_CLEANUP_ENABLED === 'true',
        retentionDays: null,
        expiredCount: 0,
        files: [],
        note: 'ATTENDANCE_EVIDENCE_RETENTION_DAYS is not configured.',
      };
    }
    const cutoff = new Date(
      now.getTime() - retentionDays * 24 * 60 * 60 * 1000,
    );
    const files = await this.prisma.uploadedFile.findMany({
      where: {
        bucket: 'attendance-evidence',
        objectKey: { startsWith: 'attendance/' },
        createdAt: { lt: cutoff },
      },
      select: {
        id: true,
        organizationId: true,
        uploadedById: true,
        mimeType: true,
        sizeBytes: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
      take: 500,
    });

    return {
      cleanupEnabled:
        process.env.ATTENDANCE_EVIDENCE_CLEANUP_ENABLED === 'true',
      retentionDays,
      cutoff: cutoff.toISOString(),
      expiredCount: files.length,
      files,
      note: 'Dry run only. No files were deleted.',
    };
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

  private hrImagePurpose(value: unknown) {
    const purpose = typeof value === 'string' ? value.trim().toLowerCase() : '';
    if (purpose === 'face_reference') return 'face_reference';
    return 'profile_photo';
  }

  private hrImageMimeType(value: unknown) {
    const mimeType =
      typeof value === 'string' ? value.trim().toLowerCase() : '';
    if (['image/jpeg', 'image/png', 'image/webp'].includes(mimeType))
      return mimeType;
    throw new BadRequestException(
      'Employee image must be a JPEG, PNG, or WebP image.',
    );
  }

  private imageExtension(originalName: unknown, mimeType: string) {
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
        'Image extension does not match the image type.',
      );
    }
    return extension === '.jpeg' ? '.jpg' : extension;
  }

  private organizationDocumentMimeType(value: unknown) {
    const mimeType =
      typeof value === 'string' ? value.trim().toLowerCase() : '';
    if (
      ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(
        mimeType,
      )
    ) {
      return mimeType;
    }
    throw new BadRequestException(
      'Document must be a JPEG, PNG, WebP, or PDF file.',
    );
  }

  private documentExtension(originalName: unknown, mimeType: string) {
    const extension =
      typeof originalName === 'string'
        ? extname(originalName).toLowerCase()
        : '';
    const allowed = new Map([
      ['image/jpeg', new Set(['.jpg', '.jpeg'])],
      ['image/png', new Set(['.png'])],
      ['image/webp', new Set(['.webp'])],
      ['application/pdf', new Set(['.pdf'])],
    ]);
    if (!extension || !allowed.get(mimeType)?.has(extension)) {
      throw new BadRequestException(
        'Document extension does not match the file type.',
      );
    }
    return extension === '.jpeg' ? '.jpg' : extension;
  }

  private assertCanManageHrImage(
    purpose: 'profile_photo' | 'face_reference',
    currentUser: AuthenticatedRequestUser,
  ) {
    const permissions = currentUser.permissions ?? [];
    const canManage =
      permissions.includes('hr.employees.update') ||
      permissions.includes('hr.employees.create') ||
      permissions.includes('hr.manage');
    if (!canManage) {
      throw new ForbiddenException('HR employee update permission is required.');
    }
    if (
      purpose === 'face_reference' &&
      !(
        permissions.includes('hr.employees.update') ||
        permissions.includes('hr.employees.permissions.manage') ||
        permissions.includes('hr.manage')
      )
    ) {
      throw new ForbiddenException('Face reference photo permission is required.');
    }
  }

  private assertCanAccessHrImage(
    file: {
      organizationId: string | null;
      uploadedById: string | null;
      bucket: string;
      objectKey: string;
      mimeType: string | null;
    },
    purpose: unknown,
    currentUser: AuthenticatedRequestUser,
  ) {
    assertSameOrganizationOrPlatform(currentUser, file.organizationId);
    const normalizedPurpose = this.hrImagePurpose(purpose);
    if (
      file.bucket !== 'hr-employee-images' ||
      !file.objectKey.startsWith(`hr/employees/${normalizedPurpose}/`)
    ) {
      throw new ForbiddenException('File is not an HR employee image.');
    }
    if (
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.mimeType ?? '')
    ) {
      throw new ForbiddenException('File type is not previewable.');
    }
    const permissions = currentUser.permissions ?? [];
    const canViewProfile =
      permissions.includes('hr.employees.view') ||
      permissions.includes('hr.view') ||
      permissions.includes('hr.manage');
    const canViewFace =
      permissions.includes('hr.employees.update') ||
      permissions.includes('hr.employees.permissions.manage') ||
      permissions.includes('hr.manage');
    if (normalizedPurpose === 'profile_photo' && canViewProfile) return;
    if (normalizedPurpose === 'face_reference' && canViewFace) return;
    if (file.uploadedById === currentUser.userId) return;
    throw new ForbiddenException('You do not have access to this file.');
  }

  private assertCanAccessAttendanceEvidence(
    file: {
      organizationId: string | null;
      uploadedById: string | null;
      bucket: string;
      objectKey: string;
      mimeType: string | null;
    },
    currentUser: AuthenticatedRequestUser,
  ) {
    if (file.organizationId !== currentUser.organizationId) {
      throw new ForbiddenException(
        'File is not available in this organization.',
      );
    }
    if (
      file.bucket !== 'attendance-evidence' ||
      !file.objectKey.startsWith('attendance/')
    ) {
      throw new ForbiddenException('File is not attendance evidence.');
    }
    if (
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.mimeType ?? '')
    ) {
      throw new ForbiddenException('File type is not previewable.');
    }
    const permissions = currentUser.permissions ?? [];
    const canManageAttendance =
      permissions.includes('hr.attendance.manage') ||
      permissions.includes('hr.manage') ||
      permissions.includes('hr.view');
    if (canManageAttendance) return;
    if (file.uploadedById === currentUser.userId) return;
    throw new ForbiddenException('You do not have access to this file.');
  }

  private storageBucket(file: { url: string | null; bucket: string }) {
    if (file.url?.includes(':')) {
      return file.url.split(':').slice(1).join(':') || file.bucket;
    }
    return process.env.FILE_STORAGE_BUCKET?.trim() || 'local-private';
  }

  private safeDownloadName(file: { id: string; mimeType: string | null }) {
    const extension =
      file.mimeType === 'image/png'
        ? 'png'
        : file.mimeType === 'image/webp'
          ? 'webp'
          : 'jpg';
    return `attendance-evidence-${file.id}.${extension}`;
  }

  private optionalString(value: string | undefined) {
    const trimmed = value?.trim();
    return trimmed || undefined;
  }
}

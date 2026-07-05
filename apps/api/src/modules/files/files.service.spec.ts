import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { mkdtemp, rm, stat, writeFile, mkdir } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { FileStorageService } from './file-storage.service';
import { FilesService } from './files.service';

describe('FilesService attendance evidence photos', () => {
  const user = {
    userId: 'user_1',
    organizationId: 'org_1',
    role: 'developer_sales_agent',
    permissions: [],
  } as unknown as AuthenticatedRequestUser;

  let storageRoot: string;
  let previousStorageRoot: string | undefined;

  beforeEach(async () => {
    storageRoot = await mkdtemp(join(tmpdir(), 'popwam-attendance-'));
    previousStorageRoot = process.env.FILE_STORAGE_LOCAL_ROOT;
    process.env.FILE_STORAGE_LOCAL_ROOT = storageRoot;
  });

  afterEach(async () => {
    if (previousStorageRoot === undefined) {
      delete process.env.FILE_STORAGE_LOCAL_ROOT;
    } else {
      process.env.FILE_STORAGE_LOCAL_ROOT = previousStorageRoot;
    }
    await rm(storageRoot, { recursive: true, force: true });
  });

  function setup() {
    const prisma = {
      uploadedFile: {
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: 'file_1',
            createdAt: new Date('2026-07-01T12:00:00.000Z'),
            ...data,
          }),
        ),
        findUnique: jest.fn(),
      },
    };
    const auditLogs = {
      record: jest.fn().mockResolvedValue({ id: 'audit_1' }),
    };

    return {
      prisma,
      service: new FilesService(
        prisma as any,
        auditLogs as any,
        new FileStorageService(),
      ),
    };
  }

  it('uploads an attendance photo and creates a real file record', async () => {
    const { prisma, service } = setup();

    const result = await service.uploadAttendanceEvidencePhoto(
      {
        buffer: Buffer.from('fake-jpeg'),
        size: 9,
        mimetype: 'image/jpeg',
        originalname: 'office.jpg',
      },
      'ATTENDANCE_CHECK_IN',
      user,
    );

    expect(result.fileId).toBe('file_1');
    expect(prisma.uploadedFile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: user.organizationId,
          uploadedById: user.userId,
          bucket: 'attendance-evidence',
          mimeType: 'image/jpeg',
          sizeBytes: 9,
        }),
      }),
    );
    const objectKey =
      prisma.uploadedFile.create.mock.calls[0][0].data.objectKey;
    await expect(stat(join(storageRoot, objectKey))).resolves.toBeTruthy();
  });

  it('refuses unsafe local storage object paths', async () => {
    const storage = new FileStorageService();

    await expect(
      storage.putObject({
        objectKey: '../secret.jpg',
        body: Buffer.from('x'),
        mimeType: 'image/jpeg',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('validates production object storage configuration', () => {
    const previousProvider = process.env.FILE_STORAGE_PROVIDER;
    const previousBucket = process.env.FILE_STORAGE_BUCKET;
    process.env.FILE_STORAGE_PROVIDER = 's3';
    delete process.env.FILE_STORAGE_BUCKET;

    expect(() => new FileStorageService().validateConfiguration()).toThrow(
      BadRequestException,
    );

    if (previousProvider === undefined) {
      delete process.env.FILE_STORAGE_PROVIDER;
    } else {
      process.env.FILE_STORAGE_PROVIDER = previousProvider;
    }
    if (previousBucket === undefined) {
      delete process.env.FILE_STORAGE_BUCKET;
    } else {
      process.env.FILE_STORAGE_BUCKET = previousBucket;
    }
  });

  it('rejects non-image attendance uploads', async () => {
    const { service } = setup();

    await expect(
      service.uploadAttendanceEvidencePhoto(
        {
          buffer: Buffer.from('plain'),
          size: 5,
          mimetype: 'text/plain',
          originalname: 'note.txt',
        },
        'ATTENDANCE_CHECK_IN',
        user,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects oversized attendance uploads', async () => {
    const { service } = setup();

    await expect(
      service.uploadAttendanceEvidencePhoto(
        {
          buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
          size: 5 * 1024 * 1024 + 1,
          mimetype: 'image/png',
          originalname: 'large.png',
        },
        'ATTENDANCE_CHECK_IN',
        user,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('validates attendance photo organization, owner, bucket, type, and freshness', async () => {
    const { prisma, service } = setup();
    prisma.uploadedFile.findUnique.mockResolvedValue({
      id: 'file_1',
      organizationId: user.organizationId,
      uploadedById: user.userId,
      bucket: 'attendance-evidence',
      objectKey: `attendance/${user.organizationId}/${user.userId}/photo.jpg`,
      mimeType: 'image/jpeg',
      createdAt: new Date(),
    });

    await expect(
      service.validateAttendanceEvidencePhoto('file_1', user),
    ).resolves.toBeUndefined();
  });

  it('rejects old attendance photos for self attendance', async () => {
    const { prisma, service } = setup();
    prisma.uploadedFile.findUnique.mockResolvedValue({
      id: 'file_1',
      organizationId: user.organizationId,
      uploadedById: user.userId,
      bucket: 'attendance-evidence',
      objectKey: `attendance/${user.organizationId}/${user.userId}/photo.jpg`,
      mimeType: 'image/jpeg',
      createdAt: new Date(Date.now() - 11 * 60 * 1000),
    });

    await expect(
      service.validateAttendanceEvidencePhoto('file_1', user),
    ).resolves.toBe('PHOTO_FILE_TOO_OLD');
  });

  it('allows same-organization HR/admin preview for attendance evidence', async () => {
    const { prisma, service } = setup();
    const objectKey = `attendance/${user.organizationId}/${user.userId}/photo.jpg`;
    await mkdir(
      join(storageRoot, 'attendance', user.organizationId!, user.userId),
      {
        recursive: true,
      },
    );
    await writeFile(join(storageRoot, objectKey), Buffer.from('image'));
    prisma.uploadedFile.findUnique.mockResolvedValue({
      id: 'file_1',
      organizationId: user.organizationId,
      uploadedById: 'another_user',
      bucket: 'attendance-evidence',
      objectKey,
      mimeType: 'image/jpeg',
      sizeBytes: 5,
      createdAt: new Date(),
    });

    await expect(
      service.openAttendanceEvidenceFile('file_1', {
        ...user,
        userId: 'hr_user',
        permissions: ['hr.attendance.manage'],
      }),
    ).resolves.toMatchObject({
      mimeType: 'image/jpeg',
      sizeBytes: 5,
    });
  });

  it('blocks cross-organization attendance evidence preview', async () => {
    const { prisma, service } = setup();
    prisma.uploadedFile.findUnique.mockResolvedValue({
      id: 'file_1',
      organizationId: 'org_2',
      uploadedById: user.userId,
      bucket: 'attendance-evidence',
      objectKey: 'attendance/org_2/user_1/photo.jpg',
      mimeType: 'image/jpeg',
      createdAt: new Date(),
    });

    await expect(
      service.openAttendanceEvidenceFile('file_1', user),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('blocks non-attendance private files from attendance preview', async () => {
    const { prisma, service } = setup();
    prisma.uploadedFile.findUnique.mockResolvedValue({
      id: 'file_1',
      organizationId: user.organizationId,
      uploadedById: user.userId,
      bucket: 'metadata-placeholder',
      objectKey: 'documents/file.jpg',
      mimeType: 'image/jpeg',
      createdAt: new Date(),
    });

    await expect(
      service.openAttendanceEvidenceFile('file_1', user),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('blocks missing or deleted attendance evidence files', async () => {
    const { prisma, service } = setup();
    prisma.uploadedFile.findUnique.mockResolvedValueOnce(null);
    await expect(
      service.openAttendanceEvidenceFile('missing', user),
    ).rejects.toBeInstanceOf(NotFoundException);

    prisma.uploadedFile.findUnique.mockResolvedValueOnce({
      id: 'file_1',
      organizationId: user.organizationId,
      uploadedById: user.userId,
      bucket: 'attendance-evidence',
      objectKey: `attendance/${user.organizationId}/${user.userId}/photo.jpg`,
      mimeType: 'image/jpeg',
      deletedAt: new Date(),
      createdAt: new Date(),
    });
    await expect(
      service.openAttendanceEvidenceFile('file_1', user),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

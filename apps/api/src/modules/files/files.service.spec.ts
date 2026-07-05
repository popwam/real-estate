import { BadRequestException } from '@nestjs/common';
import { mkdtemp, rm, stat } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
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
      service: new FilesService(prisma as any, auditLogs as any),
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
});

import { ConflictException, ForbiddenException } from '@nestjs/common';
import { HrAttendanceStatus, HrEmployeeStatus } from '@prisma/client';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { OperationsService } from './operations.service';

describe('OperationsService self attendance', () => {
  const user = {
    userId: 'user_1',
    organizationId: 'org_1',
    role: 'developer_sales_agent',
    permissions: [],
  } as unknown as AuthenticatedRequestUser;
  const employee = {
    id: 'employee_1',
    organizationId: 'org_1',
    userId: 'user_1',
    name: 'Linked Employee',
    status: HrEmployeeStatus.ACTIVE,
  };

  function setup() {
    const prisma = {
      hrEmployee: {
        findFirst: jest.fn().mockResolvedValue(employee),
      },
      hrAttendanceRecord: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: 'attendance_1',
            ...data,
            employee,
          }),
        ),
        update: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: 'attendance_1',
            organizationId: employee.organizationId,
            employeeId: employee.id,
            date: new Date('2026-07-01T00:00:00.000Z'),
            checkInAt: new Date('2026-07-01T08:00:00.000Z'),
            status: HrAttendanceStatus.PRESENT,
            ...data,
            employee,
          }),
        ),
      },
      operationsActivity: {
        create: jest.fn().mockResolvedValue({ id: 'activity_1' }),
      },
      organizationAttendanceSettings: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };

    return {
      prisma,
      service: new OperationsService(prisma as any),
    };
  }

  function setupWithFiles(filesService: any) {
    const base = setup();
    return {
      ...base,
      service: new OperationsService(base.prisma as any, filesService),
    };
  }

  it('creates check-in for the linked employee and ignores submitted employeeId', async () => {
    const { prisma, service } = setup();

    const result = await service.checkInHrAttendance(
      { employeeId: 'employee_2', note: 'Arrived' },
      user,
    );

    expect(result.employeeId).toBe(employee.id);
    expect(prisma.hrEmployee.findFirst).toHaveBeenCalledWith({
      where: {
        userId: user.userId,
        organizationId: user.organizationId,
        status: HrEmployeeStatus.ACTIVE,
      },
    });
    expect(prisma.hrAttendanceRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: employee.organizationId,
          employeeId: employee.id,
          status: HrAttendanceStatus.PRESENT,
        }),
      }),
    );
  });

  it('blocks duplicate open check-ins', async () => {
    const { prisma, service } = setup();
    prisma.hrAttendanceRecord.findFirst.mockResolvedValueOnce({
      id: 'attendance_1',
      organizationId: employee.organizationId,
      employeeId: employee.id,
      date: new Date('2026-07-01T00:00:00.000Z'),
      checkInAt: new Date('2026-07-01T08:00:00.000Z'),
      checkOutAt: null,
      status: HrAttendanceStatus.PRESENT,
      employee,
    });

    await expect(service.checkInHrAttendance({}, user)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('checks out the current open attendance record', async () => {
    const { prisma, service } = setup();
    prisma.hrAttendanceRecord.findFirst.mockResolvedValueOnce({
      id: 'attendance_1',
      organizationId: employee.organizationId,
      employeeId: employee.id,
      date: new Date('2026-07-01T00:00:00.000Z'),
      checkInAt: new Date('2026-07-01T08:00:00.000Z'),
      checkOutAt: null,
      status: HrAttendanceStatus.PRESENT,
      note: null,
      employee,
    });

    const result = await service.checkOutHrAttendance(
      { note: 'Leaving' },
      user,
    );

    expect(result.employeeId).toBe(employee.id);
    expect(result.canCheckOut).toBe(false);
    expect(prisma.hrAttendanceRecord.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'attendance_1' },
        data: expect.objectContaining({
          checkOutAt: expect.any(Date),
          note: 'Leaving',
        }),
      }),
    );
  });

  it('blocks check-out without an open check-in', async () => {
    const { service } = setup();

    await expect(service.checkOutHrAttendance({}, user)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('returns a safe error when no active employee is linked', async () => {
    const { prisma, service } = setup();
    prisma.hrEmployee.findFirst.mockResolvedValueOnce(null);

    await expect(service.myAttendanceToday(user)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('returns only the current employee attendance history', async () => {
    const { prisma, service } = setup();

    await service.myAttendanceHistory(user);

    expect(prisma.hrAttendanceRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizationId: employee.organizationId,
          employeeId: employee.id,
        },
      }),
    );
  });

  it('stores a rejected attempt and fails outside the configured geofence', async () => {
    const { prisma, service } = setup();
    prisma.organizationAttendanceSettings.findUnique.mockResolvedValueOnce({
      requireLocation: true,
      allowedLatitude: 30.0444,
      allowedLongitude: 31.2357,
      allowedRadiusMeters: 100,
      requireWifi: false,
      allowedWifiSsids: [],
      allowedWifiBssids: [],
      blockDeveloperOptions: true,
      blockUsbDebugging: true,
      requirePhoto: false,
      requireDvrReview: false,
    });

    await expect(
      service.checkInHrAttendance({ latitude: 31.2, longitude: 29.9 }, user),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        reasons: expect.arrayContaining(['OUTSIDE_ALLOWED_LOCATION']),
      }),
    });

    expect(prisma.hrAttendanceRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          verificationStatus: 'REJECTED',
          verificationFailureReasons: ['OUTSIDE_ALLOWED_LOCATION'],
        }),
      }),
    );
  });

  it('fails when required Wi-Fi does not match', async () => {
    const { prisma, service } = setup();
    prisma.organizationAttendanceSettings.findUnique.mockResolvedValueOnce({
      requireLocation: false,
      requireWifi: true,
      allowedWifiSsids: ['POPWAM-OFFICE'],
      allowedWifiBssids: ['aa:bb:cc:dd:ee:ff'],
      blockDeveloperOptions: true,
      blockUsbDebugging: true,
      requirePhoto: false,
      requireDvrReview: false,
    });

    await expect(
      service.checkInHrAttendance({ wifiSsid: 'Guest' }, user),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        reasons: expect.arrayContaining(['WIFI_NOT_ALLOWED']),
      }),
    });
  });

  it('fails when developer options are enabled and blocked', async () => {
    const { service } = setup();

    await expect(
      service.checkInHrAttendance({ developerOptionsEnabled: true }, user),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        reasons: expect.arrayContaining(['DEVELOPER_OPTIONS_ENABLED']),
      }),
    });
  });

  it('fails when required photo evidence is missing', async () => {
    const { prisma, service } = setup();
    prisma.organizationAttendanceSettings.findUnique.mockResolvedValueOnce({
      requireLocation: false,
      requireWifi: false,
      allowedWifiSsids: [],
      allowedWifiBssids: [],
      blockDeveloperOptions: true,
      blockUsbDebugging: true,
      requirePhoto: true,
      requireDvrReview: false,
    });

    await expect(service.checkInHrAttendance({}, user)).rejects.toMatchObject({
      response: expect.objectContaining({
        reasons: expect.arrayContaining(['PHOTO_REQUIRED']),
      }),
    });
  });

  it('accepts an owned fresh attendance photo when required', async () => {
    const filesService = {
      validateAttendanceEvidencePhoto: jest.fn().mockResolvedValue(undefined),
    };
    const { prisma, service } = setupWithFiles(filesService);
    prisma.organizationAttendanceSettings.findUnique.mockResolvedValueOnce({
      requireLocation: false,
      requireWifi: false,
      allowedWifiSsids: [],
      allowedWifiBssids: [],
      blockDeveloperOptions: true,
      blockUsbDebugging: true,
      requirePhoto: true,
      requireDvrReview: false,
    });

    const result = await service.checkInHrAttendance(
      { photoFileId: 'file_1' },
      user,
    );

    expect(result.verificationStatus).toBe('VERIFIED');
    expect(filesService.validateAttendanceEvidencePhoto).toHaveBeenCalledWith(
      'file_1',
      user,
    );
    expect(prisma.hrAttendanceRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          checkInPhotoFileId: 'file_1',
        }),
      }),
    );
  });

  it('rejects an attendance photo owned by another user or organization', async () => {
    const filesService = {
      validateAttendanceEvidencePhoto: jest
        .fn()
        .mockResolvedValue('PHOTO_FILE_NOT_OWNED_BY_USER'),
    };
    const { prisma, service } = setupWithFiles(filesService);
    prisma.organizationAttendanceSettings.findUnique.mockResolvedValueOnce({
      requireLocation: false,
      requireWifi: false,
      allowedWifiSsids: [],
      allowedWifiBssids: [],
      blockDeveloperOptions: true,
      blockUsbDebugging: true,
      requirePhoto: true,
      requireDvrReview: false,
    });

    await expect(
      service.checkInHrAttendance({ photoFileId: 'file_2' }, user),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        reasons: expect.arrayContaining(['PHOTO_FILE_NOT_OWNED_BY_USER']),
      }),
    });
  });

  it('marks attendance pending when DVR review is required', async () => {
    const { prisma, service } = setup();
    prisma.organizationAttendanceSettings.findUnique.mockResolvedValueOnce({
      requireLocation: false,
      requireWifi: false,
      allowedWifiSsids: [],
      allowedWifiBssids: [],
      blockDeveloperOptions: true,
      blockUsbDebugging: true,
      requirePhoto: false,
      requireDvrReview: true,
    });

    const result = await service.checkInHrAttendance({}, user);

    expect(result.verificationStatus).toBe('PENDING_REVIEW');
    expect(result.dvrVerificationStatus).toBe('PENDING');
  });
});

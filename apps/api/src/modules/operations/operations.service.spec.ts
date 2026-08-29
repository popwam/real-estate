import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { HrAttendanceStatus, HrEmployeeStatus } from '@prisma/client';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { OperationsService } from './operations.service';

describe('OperationsService self attendance', () => {
  const user = {
    userId: 'user_1',
    organizationId: 'org_1',
    role: 'developer_sales_agent',
    permissions: ['hr.attendance.self'],
  } as unknown as AuthenticatedRequestUser;
  const employee = {
    id: 'employee_1',
    organizationId: 'org_1',
    userId: 'user_1',
    name: 'Linked Employee',
    status: HrEmployeeStatus.ACTIVE,
    loginEnabled: true,
    organization: {
      type: 'BROKERAGE',
      status: 'ACTIVE',
    },
  };

  afterEach(() => {
    jest.useRealTimers();
  });

  function attendanceSettings(overrides: Record<string, unknown> = {}) {
    return {
      requireLocation: false,
      allowedLatitude: null,
      allowedLongitude: null,
      allowedRadiusMeters: null,
      exactRadiusMeters: 30,
      expandedRadiusMeters: 1000,
      gracePeriodMinutes: 10,
      firstLateSliceMinutes: 15,
      firstLatePenaltyType: 'MARK_LATE',
      firstLatePenaltyValue: null,
      secondLateSliceMinutes: 30,
      secondLatePenaltyType: 'MANUAL_REVIEW',
      secondLatePenaltyValue: null,
      beyondSecondSlicePenaltyType: 'MANUAL_REVIEW',
      requireWifi: false,
      allowedWifiSsids: [],
      allowedWifiBssids: [],
      blockDeveloperOptions: true,
      blockUsbDebugging: true,
      requirePhoto: false,
      requireDvrReview: false,
      allowWebCheckIn: true,
      allowMobileCheckIn: true,
      allowExpandedRadiusWithReview: true,
      webWifiPolicy: 'MANUAL_REVIEW',
      workStartTime: '09:00',
      workEndTime: '17:00',
      ...overrides,
    };
  }

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
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          id: 'attendance_1',
          organizationId: employee.organizationId,
          employeeId: employee.id,
          date: new Date('2026-07-01T00:00:00.000Z'),
          checkInAt: new Date('2026-07-01T08:00:00.000Z'),
          checkOutAt: new Date('2026-07-01T17:00:00.000Z'),
          status: HrAttendanceStatus.PRESENT,
          employee,
        }),
      },
      operationsActivity: {
        create: jest.fn().mockResolvedValue({ id: 'activity_1' }),
      },
      organizationAttendanceSettings: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      organizationAttendanceLocation: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      organizationBranch: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      hrAttendanceAttempt: {
        create: jest.fn().mockResolvedValue({ id: 'attempt_1' }),
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
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-10T00:00:00.000Z'));
    const { prisma, service } = setup();
    prisma.organizationAttendanceSettings.findUnique.mockResolvedValueOnce(
      attendanceSettings({ workStartTime: '23:59' }),
    );

    const result = await service.checkInHrAttendance(
      { employeeId: 'employee_2', organizationId: 'org_2', note: 'Arrived' },
      user,
    );

    expect(result.employeeId).toBe(employee.id);
    expect(prisma.hrEmployee.findFirst).toHaveBeenCalledWith({
      where: {
        userId: user.userId,
        organizationId: user.organizationId,
        status: HrEmployeeStatus.ACTIVE,
        loginEnabled: true,
      },
      include: { organization: { select: { type: true, status: true } } },
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

  it('keeps manual attendance restricted to attendance managers', async () => {
    const { service } = setup();

    await expect(
      service.createHrAttendance({ employeeId: employee.id }, user),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a non-positive GPS accuracy policy value', () => {
    const { service } = setup();
    expect(() =>
      (service as any).attendanceSettingsData({ maxGpsAccuracyMeters: 0 }),
    ).toThrow('maxGpsAccuracyMeters must be greater than zero.');
    expect(() =>
      (service as any).attendanceSettingsData({ maxGpsAccuracyMeters: -10 }),
    ).toThrow('maxGpsAccuracyMeters must be greater than zero.');
  });

  it('uses the nearest active mobile attendance location as the primary source', async () => {
    const { prisma, service } = setup();
    prisma.organizationAttendanceLocation.findMany.mockResolvedValueOnce([
      {
        id: 'far',
        name: 'Far',
        latitude: 30.2,
        longitude: 31.2,
        exactRadiusMeters: 30,
        expandedRadiusMeters: 100,
        requiresReviewOutsideExactRadius: true,
      },
      {
        id: 'near',
        name: 'Near',
        latitude: 30.0444,
        longitude: 31.2357,
        exactRadiusMeters: 30,
        expandedRadiusMeters: 100,
        requiresReviewOutsideExactRadius: true,
      },
    ]);

    const decision = await (service as any).attendanceLocationDecision(
      { latitude: 30.0444, longitude: 31.2357, clientPlatform: 'MOBILE' },
      attendanceSettings({ requireLocation: true }),
      'org_1',
    );

    expect(decision).toMatchObject({
      source: 'ATTENDANCE_LOCATION',
      matchedLocationId: 'near',
      mode: 'EXACT',
      blockingReasons: [],
    });
  });

  it('marks an expanded-radius location for review rather than verified acceptance', async () => {
    const { prisma, service } = setup();
    prisma.organizationAttendanceLocation.findMany.mockResolvedValueOnce([
      {
        id: 'location_1',
        name: 'Office',
        latitude: 30.0444,
        longitude: 31.2357,
        exactRadiusMeters: 1,
        expandedRadiusMeters: 500,
        requiresReviewOutsideExactRadius: true,
      },
    ]);

    const decision = await (service as any).attendanceLocationDecision(
      { latitude: 30.0448, longitude: 31.2357, clientPlatform: 'MOBILE' },
      attendanceSettings({ requireLocation: true }),
      'org_1',
    );

    expect(decision.mode).toBe('EXPANDED_REVIEW');
    expect(decision.blockingReasons).toContain('EXPANDED_LOCATION_REVIEW');
  });

  it('uses the web location policy in preflight and permits only review-only outcomes', async () => {
    const { prisma, service } = setup();
    prisma.organizationAttendanceSettings.findUnique.mockResolvedValueOnce(
      attendanceSettings({ requireLocation: false, allowWebCheckIn: false }),
    );

    const denied = await service.preflightHrAttendanceCheckIn(
      { clientPlatform: 'WEB' },
      user,
    );

    expect(denied.allowed).toBe(false);
    expect(denied.blockingReasons).toContain('WEB_CHECK_IN_NOT_ALLOWED');

    prisma.organizationAttendanceSettings.findUnique.mockResolvedValueOnce(
      attendanceSettings({
        requireLocation: false,
        requireWifi: true,
        webWifiPolicy: 'MANUAL_REVIEW',
      }),
    );
    const review = await service.preflightHrAttendanceCheckIn(
      { clientPlatform: 'WEB' },
      user,
    );

    expect(review.allowed).toBe(true);
    expect(review.blockingReasons).toContain('WEB_WIFI_MANUAL_REVIEW');
  });

  it('re-evaluates the final web check-in after a successful preflight', async () => {
    const { prisma, service } = setup();
    const policy = attendanceSettings({ requireLocation: true });
    prisma.organizationAttendanceSettings.findUnique.mockResolvedValue(policy);
    prisma.organizationAttendanceLocation.findMany.mockResolvedValue([
      {
        id: 'web-office',
        name: 'Web office',
        latitude: 30.0444,
        longitude: 31.2357,
        exactRadiusMeters: 30,
        expandedRadiusMeters: 50,
        requiresReviewOutsideExactRadius: false,
      },
    ]);

    const preflight = await service.preflightHrAttendanceCheckIn(
      {
        latitude: 30.0444,
        longitude: 31.2357,
        locationAccuracyMeters: 5,
        locationCapturedAt: new Date().toISOString(),
        clientPlatform: 'WEB',
      },
      user,
    );
    expect(preflight.allowed).toBe(true);

    await expect(
      service.checkInHrAttendance(
        {
          latitude: 31.2,
          longitude: 29.9,
          locationAccuracyMeters: 5,
          locationCapturedAt: new Date().toISOString(),
          clientPlatform: 'WEB',
        },
        user,
      ),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        reasons: expect.arrayContaining(['OUTSIDE_ALLOWED_LOCATION']),
      }),
    });
    expect(prisma.hrAttendanceRecord.create).not.toHaveBeenCalled();
    expect(prisma.organizationAttendanceLocation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ allowedForWeb: true }),
      }),
    );
  });

  it('allows at most one concurrent reference approval and surfaces the unique-index conflict', async () => {
    const { prisma, service } = setup();
    const reviewer = { ...user, permissions: ['hr.attendance.review'] };
    prisma.employeeAttendanceReferencePhoto = {
      findFirstOrThrow: jest.fn().mockResolvedValue({
        id: 'reference_1',
        organizationId: 'org_1',
        employeeId: employee.id,
        fileId: 'file_1',
      }),
    };
    const tx = {
      employeeAttendanceReferencePhoto: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        update: jest
          .fn()
          .mockResolvedValue({
            id: 'reference_1',
            status: 'APPROVED_REFERENCE',
          }),
      },
      hrEmployee: { update: jest.fn().mockResolvedValue(employee) },
    };
    prisma.$transaction = jest
      .fn()
      .mockImplementationOnce((callback: any) => callback(tx))
      .mockRejectedValueOnce({ code: 'P2002' });

    const results = await Promise.allSettled([
      service.reviewAttendanceReference(
        'reference_1',
        { approve: true },
        reviewer,
      ),
      service.reviewAttendanceReference(
        'reference_1',
        { approve: true },
        reviewer,
      ),
    ]);

    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === 'rejected')[0],
    ).toMatchObject({
      reason: expect.any(ConflictException),
    });
  });

  it('marks self check-in late when the configured schedule has already passed', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-10T23:59:00.000Z'));
    const { prisma, service } = setup();
    prisma.organizationAttendanceSettings.findUnique.mockResolvedValueOnce(
      attendanceSettings({ workStartTime: '00:00' }),
    );

    const result = await service.checkInHrAttendance({}, user);

    expect(result.status).toBe(HrAttendanceStatus.LATE);
    expect(result.minutesLate).toBeGreaterThan(0);
    expect(prisma.hrAttendanceRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: HrAttendanceStatus.LATE,
        }),
      }),
    );
  });

  it('blocks duplicate open check-ins', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-01T09:00:00.000Z'));
    const { prisma, service } = setup();
    prisma.hrAttendanceRecord.findFirst.mockResolvedValue({
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
    expect(prisma.hrAttendanceRecord.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'attendance_1', checkOutAt: null },
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

  it('returns only the safe self-service policy for the current employee organization', async () => {
    const { prisma, service } = setup();
    prisma.organizationAttendanceSettings.findUnique.mockResolvedValueOnce(
      attendanceSettings({
        allowWebCheckIn: true,
        requireLocation: true,
        requirePhoto: true,
        requireWifi: true,
        webWifiPolicy: 'MANUAL_REVIEW',
        maxGpsAccuracyMeters: 25,
        allowedWifiSsids: ['private-office-network'],
        allowedWifiBssids: ['00:11:22:33:44:55'],
      }),
    );

    const result = await service.myAttendancePolicy(user);

    expect(
      prisma.organizationAttendanceSettings.findUnique,
    ).toHaveBeenCalledWith({
      where: { organizationId: employee.organizationId },
    });
    expect(result).toEqual({
      allowWebCheckIn: true,
      allowMobileCheckIn: true,
      requireLocation: true,
      requirePhoto: true,
      requireWifi: true,
      webWifiPolicy: 'MANUAL_REVIEW',
      locationAccuracyThresholdMeters: 25,
      locationFreshnessSeconds: 600,
      canCheckIn: true,
      blockingReasons: [],
    });
    expect(result).not.toHaveProperty('allowedWifiSsids');
    expect(result).not.toHaveProperty('allowedWifiBssids');
  });

  it('reports explicit self-service policy blocks without exposing admin settings', async () => {
    const { prisma, service } = setup();
    prisma.organizationAttendanceSettings.findUnique.mockResolvedValueOnce(
      attendanceSettings({
        allowWebCheckIn: false,
        requireWifi: true,
        webWifiPolicy: 'BLOCK',
      }),
    );

    await expect(service.myAttendancePolicy(user)).resolves.toMatchObject({
      canCheckIn: false,
      blockingReasons: ['WEB_CHECK_IN_NOT_ALLOWED', 'WEB_WIFI_NOT_AVAILABLE'],
    });
  });

  it('rejects unlinked or inactive users clearly for the self-service policy', async () => {
    const { prisma, service } = setup();
    prisma.hrEmployee.findFirst.mockResolvedValueOnce(null);

    await expect(service.myAttendancePolicy(user)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('keeps the administrative attendance settings endpoint permission-gated', async () => {
    const { service } = setup();

    await expect(
      service.getAttendanceSettings({}, user),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns only active web-enabled attendance locations linked to an active branch', async () => {
    const { prisma, service } = setup();
    prisma.organizationAttendanceLocation.findMany.mockResolvedValueOnce([
      {
        id: 'location_1',
        organizationId: employee.organizationId,
        officeId: 'branch_1',
        name: 'Head office',
        latitude: 30.0444,
        longitude: 31.2357,
        exactRadiusMeters: 30,
        expandedRadiusMeters: 100,
        isActive: true,
        allowedForWeb: true,
        office: { id: 'branch_1', name: 'Head office', isActive: true },
      },
      {
        id: 'location_2',
        organizationId: employee.organizationId,
        officeId: 'branch_2',
        name: 'Inactive branch',
        latitude: 30.0444,
        longitude: 31.2357,
        exactRadiusMeters: 30,
        expandedRadiusMeters: 100,
        isActive: true,
        allowedForWeb: true,
        office: { id: 'branch_2', name: 'Inactive branch', isActive: false },
      },
    ]);

    await expect(service.myWebAttendanceLocations(user)).resolves.toEqual([
      expect.objectContaining({
        id: 'location_1',
        branchId: 'branch_1',
        radiusMeters: 30,
        allowedForWeb: true,
      }),
    ]);
    expect(prisma.organizationAttendanceLocation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: employee.organizationId,
          isActive: true,
          allowedForWeb: true,
          officeId: { not: null },
          office: {
            is: { organizationId: employee.organizationId, isActive: true },
          },
        }),
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

    expect(prisma.hrAttendanceRecord.create).not.toHaveBeenCalled();
    expect(prisma.hrAttendanceAttempt.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ decision: 'REJECTED' }),
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
      service.checkInHrAttendance(
        { wifiSsid: 'Guest', clientPlatform: 'MOBILE' },
        user,
      ),
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

  it('allows HR admin to mark DVR review matched and audits the update', async () => {
    const { prisma, service } = setup();
    const admin = {
      ...user,
      role: 'developer_admin',
      organizationType: 'DEVELOPER',
      permissions: ['hr.attendance.manage'],
    } as unknown as AuthenticatedRequestUser;
    prisma.hrAttendanceRecord.findFirst.mockResolvedValueOnce({
      id: 'attendance_1',
      organizationId: employee.organizationId,
    });

    await service.updateHrAttendance(
      'attendance_1',
      {
        dvrVerificationStatus: 'MATCHED',
        dvrReferenceId: 'cam-1:2026-07-05T09:00:00Z',
      },
      admin,
    );

    expect(prisma.hrAttendanceRecord.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'attendance_1' },
        data: expect.objectContaining({
          dvrVerificationStatus: 'MATCHED',
          dvrReferenceId: 'cam-1:2026-07-05T09:00:00Z',
        }),
      }),
    );
    expect(prisma.operationsActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'UPDATED',
          entityType: 'HrAttendanceRecord',
        }),
      }),
    );
  });

  it('blocks DVR review updates without attendance management permission', async () => {
    const { service } = setup();
    const unauthorized = {
      ...user,
      organizationType: 'DEVELOPER',
      permissions: ['hr.view'],
    } as unknown as AuthenticatedRequestUser;

    await expect(
      service.updateHrAttendance(
        'attendance_1',
        { dvrVerificationStatus: 'NOT_MATCHED' },
        unauthorized,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('blocks cross-organization DVR review updates', async () => {
    const { prisma, service } = setup();
    const admin = {
      ...user,
      role: 'developer_admin',
      organizationType: 'DEVELOPER',
      permissions: ['hr.attendance.manage'],
    } as unknown as AuthenticatedRequestUser;
    prisma.hrAttendanceRecord.findFirst.mockResolvedValueOnce(null);

    await expect(
      service.updateHrAttendance(
        'attendance_other_org',
        { dvrVerificationStatus: 'NOT_MATCHED' },
        admin,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('Attendance auto-close policy', () => {
  const policy = (overrides: Record<string, unknown> = {}) => ({
    autoCloseOpenAttendance: true,
    regularShiftAutoCloseMode: 'END_OF_WORK_DAY',
    autoCloseGraceMinutes: 60,
    autoCloseAtLocalMidnight: true,
    ...overrides,
  });
  const record = (overrides: Record<string, unknown> = {}) => ({
    id: 'attendance_1',
    organizationId: 'org_1',
    checkInAt: new Date('2026-07-01T08:00:00.000Z'),
    actualCheckInAt: null,
    checkOutAt: null,
    overnightShift: false,
    plannedCheckOutAt: null,
    autoCloseWarningSentAt: null,
    employee: { userId: 'user_1' },
    ...overrides,
  });

  it('closes a regular open record at the organization-local end of day', () => {
    const service = new OperationsService({} as any);
    const plan = (service as any).autoClosePlan(
      record(),
      policy(),
      'Europe/Chisinau',
      new Date('2026-07-02T00:10:00.000Z'),
    );
    expect(plan.reason).toBe('MISSED_CHECK_OUT_END_OF_DAY');
    expect(plan.checkOutAt.toISOString()).toBe('2026-07-01T20:59:59.000Z');
  });

  it('does not use UTC midnight for an organization in another timezone', () => {
    const service = new OperationsService({} as any);
    const plan = (service as any).autoClosePlan(
      record({ checkInAt: new Date('2026-07-02T06:00:00.000Z') }),
      policy(),
      'America/Los_Angeles',
      new Date('2026-07-02T06:30:00.000Z'),
    );
    // It is still July 1 locally; a UTC-midnight implementation would close it.
    expect(plan.reason).toBe('STALE_OPEN_RECORD');
  });

  it('never closes an overnight shift at midnight', () => {
    const service = new OperationsService({} as any);
    const plan = (service as any).autoClosePlan(
      record({
        overnightShift: true,
        plannedCheckOutAt: new Date('2026-07-02T03:00:00.000Z'),
      }),
      policy(),
      'Europe/Chisinau',
      new Date('2026-07-02T00:10:00.000Z'),
    );
    expect(plan.reason).toBe('MISSED_CHECK_OUT_AFTER_SHIFT');
    expect(plan.dueAt.toISOString()).toBe('2026-07-02T04:00:00.000Z');
  });

  it('uses the documented safety limit for an overnight record without a checkout snapshot', () => {
    const service = new OperationsService({} as any);
    const plan = (service as any).autoClosePlan(
      record({ overnightShift: true }),
      policy(),
      'Europe/Chisinau',
      new Date('2026-07-01T10:00:00.000Z'),
    );
    expect(plan.reason).toBe('STALE_OPEN_RECORD');
    expect(plan.dueAt.toISOString()).toBe('2026-07-02T20:00:00.000Z');
  });

  it('uses planned check-out plus grace when configured for a regular shift', () => {
    const service = new OperationsService({} as any);
    const plan = (service as any).autoClosePlan(
      record({ plannedCheckOutAt: new Date('2026-07-01T15:00:00.000Z') }),
      policy({
        regularShiftAutoCloseMode: 'PLANNED_CHECK_OUT_PLUS_GRACE',
        autoCloseGraceMinutes: 45,
      }),
      'Europe/Chisinau',
      new Date('2026-07-01T16:00:00.000Z'),
    );
    expect(plan.reason).toBe('MISSED_CHECK_OUT_AFTER_SHIFT');
    expect(plan.checkOutAt.toISOString()).toBe('2026-07-01T15:45:00.000Z');
  });

  it('is idempotent and never marks an auto-close as location verified', async () => {
    const prisma = {
      hrAttendanceRecord: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    const service = new OperationsService(prisma as any);
    const result = await (service as any).autoCloseRecordIfDue(
      record(),
      policy(),
      'Europe/Chisinau',
      new Date('2026-07-02T00:10:00.000Z'),
    );
    expect(result.closed).toBe(false);
    expect(prisma.hrAttendanceRecord.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          checkOutVerificationStatus: 'AUTO_CLOSED',
          requiresManualReview: true,
        }),
      }),
    );
  });
});

describe('Employee attendance schedule overrides', () => {
  const manager = {
    userId: 'manager_1',
    organizationId: 'org_1',
    role: 'developer_admin',
    permissions: ['hr.employees.view', 'hr.employees.update'],
  } as unknown as AuthenticatedRequestUser;
  const employee = {
    id: 'employee_1',
    organizationId: 'org_1',
    attendanceScheduleMode: 'EMPLOYEE_OVERRIDE',
    attendanceScheduleId: 'schedule_1',
  };
  const validRule = {
    dayOfWeek: 1,
    isWorkingDay: true,
    startTime: '09:00',
    endTime: '17:00',
    lateUntilMinutes: 15,
    severeLateUntilMinutes: 60,
    absentAfterMinutes: 60,
    earlyLeaveGraceMinutes: 0,
    overnightShift: false,
  };
  const validInput = {
    effectiveFrom: '2026-08-03',
    effectiveTo: null,
    timezone: 'Europe/Chisinau',
    weeklyRules: [validRule],
  };

  function setup(overrides: any[] = []) {
    const prisma = {
      hrEmployeeAttendanceScheduleOverride: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest
          .fn()
          .mockImplementation(({ data }) =>
            Promise.resolve({ id: 'override_1', ...data }),
          ),
        update: jest
          .fn()
          .mockImplementation(({ data }) =>
            Promise.resolve({ id: 'override_1', ...data }),
          ),
      },
      hrAttendanceSchedule: { findFirst: jest.fn().mockResolvedValue(null) },
      hrEmployee: { findFirstOrThrow: jest.fn().mockResolvedValue(employee) },
    };
    return { prisma, service: new OperationsService(prisma as any) };
  }

  it('GET returns null when no scoped override exists', async () => {
    const { prisma, service } = setup();
    jest.spyOn(service as any, 'assertExists').mockResolvedValue(employee);
    await expect(
      service.getEmployeeAttendanceOverride(employee.id, manager),
    ).resolves.toBeNull();
    expect(
      prisma.hrEmployeeAttendanceScheduleOverride.findFirst,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          employeeId: employee.id,
          organizationId: 'org_1',
        }),
      }),
    );
  });

  it('POST creates and GET reloads a valid override', async () => {
    const { prisma, service } = setup();
    jest.spyOn(service as any, 'overrideEmployee').mockResolvedValue(employee);
    const created = await service.createEmployeeAttendanceOverride(
      employee.id,
      validInput,
      manager,
    );
    expect(created).toMatchObject({
      employeeId: employee.id,
      organizationId: 'org_1',
      timezone: 'Europe/Chisinau',
    });
    prisma.hrEmployeeAttendanceScheduleOverride.findFirst
      .mockResolvedValueOnce(created)
      .mockResolvedValueOnce(created);
    jest.spyOn(service as any, 'assertExists').mockResolvedValue(employee);
    await expect(
      service.getEmployeeAttendanceOverride(employee.id, manager),
    ).resolves.toMatchObject({ id: 'override_1', weeklyRules: [validRule] });
  });

  it('PATCH updates a scoped override and excludes itself from overlap validation', async () => {
    const { prisma, service } = setup();
    jest.spyOn(service as any, 'overrideEmployee').mockResolvedValue(employee);
    prisma.hrEmployeeAttendanceScheduleOverride.findFirst
      .mockResolvedValueOnce({ id: 'override_1' })
      .mockResolvedValueOnce(null);
    await expect(
      service.updateEmployeeAttendanceOverride(
        employee.id,
        'override_1',
        {
          ...validInput,
          weeklyRules: [{ ...validRule, lateUntilMinutes: 10 }],
        },
        manager,
      ),
    ).resolves.toMatchObject({ id: 'override_1' });
    expect(
      prisma.hrEmployeeAttendanceScheduleOverride.findFirst,
    ).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: { not: 'override_1' } }),
      }),
    );
  });

  it.each([
    ['empty weekly rules', { ...validInput, weeklyRules: [] }],
    [
      'duplicate weekdays',
      { ...validInput, weeklyRules: [validRule, validRule] },
    ],
    [
      'invalid threshold order',
      {
        ...validInput,
        weeklyRules: [
          { ...validRule, lateUntilMinutes: 60, severeLateUntilMinutes: 15 },
        ],
      },
    ],
    [
      'negative threshold',
      {
        ...validInput,
        weeklyRules: [{ ...validRule, absentAfterMinutes: -1 }],
      },
    ],
    [
      'missing working-day time',
      { ...validInput, weeklyRules: [{ ...validRule, startTime: undefined }] },
    ],
    [
      'end before start without overnight',
      {
        ...validInput,
        weeklyRules: [{ ...validRule, startTime: '17:00', endTime: '09:00' }],
      },
    ],
    ['effective dates reversed', { ...validInput, effectiveTo: '2026-08-02' }],
    ['invalid timezone', { ...validInput, timezone: 'Invalid/Timezone' }],
  ])('rejects %s', async (_name, input) => {
    const { service } = setup();
    jest.spyOn(service as any, 'overrideEmployee').mockResolvedValue(employee);
    await expect(
      service.createEmployeeAttendanceOverride(employee.id, input, manager),
    ).rejects.toBeDefined();
  });

  it('allows a non-working day without times and an overnight working day', async () => {
    const { service } = setup();
    jest.spyOn(service as any, 'overrideEmployee').mockResolvedValue(employee);
    await expect(
      service.createEmployeeAttendanceOverride(
        employee.id,
        {
          ...validInput,
          weeklyRules: [
            { dayOfWeek: 0, isWorkingDay: false },
            {
              ...validRule,
              dayOfWeek: 1,
              startTime: '22:00',
              endTime: '06:00',
              overnightShift: true,
            },
          ],
        },
        manager,
      ),
    ).resolves.toMatchObject({ id: 'override_1' });
  });

  it('rejects inclusive touching effective-date boundaries and accepts different employees', async () => {
    const { prisma, service } = setup();
    jest.spyOn(service as any, 'overrideEmployee').mockResolvedValue(employee);
    prisma.hrEmployeeAttendanceScheduleOverride.findFirst.mockResolvedValueOnce(
      { id: 'other' },
    );
    await expect(
      service.createEmployeeAttendanceOverride(
        employee.id,
        validInput,
        manager,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    jest
      .spyOn(service as any, 'overrideEmployee')
      .mockResolvedValue({ ...employee, id: 'employee_2' });
    prisma.hrEmployeeAttendanceScheduleOverride.findFirst.mockResolvedValueOnce(
      null,
    );
    await expect(
      service.createEmployeeAttendanceOverride(
        'employee_2',
        validInput,
        manager,
      ),
    ).resolves.toMatchObject({ employeeId: 'employee_2' });
  });

  it('resolves override before assigned, returns no fake times for a non-working day, and supports overnight checkout', async () => {
    const { prisma, service } = setup();
    prisma.hrEmployeeAttendanceScheduleOverride.findFirst.mockResolvedValueOnce(
      {
        id: 'override_1',
        timezone: 'UTC',
        weeklyRules: [
          {
            ...validRule,
            dayOfWeek: 1,
            startTime: '22:00',
            endTime: '06:00',
            overnightShift: true,
          },
        ],
      },
    );
    const resolved = await service.resolveEffectiveAttendanceSchedule(
      {
        organizationId: 'org_1',
        employeeId: employee.id,
        attendanceDate: new Date('2026-08-03T12:00:00Z'),
      },
      employee,
      {},
    );
    expect(resolved.scheduleSource).toBe('EMPLOYEE_OVERRIDE');
    expect(resolved.plannedCheckOutAt.getTime()).toBeGreaterThan(
      resolved.plannedCheckInAt.getTime(),
    );
    prisma.hrEmployeeAttendanceScheduleOverride.findFirst.mockResolvedValueOnce(
      {
        id: 'override_1',
        timezone: 'UTC',
        weeklyRules: [{ dayOfWeek: 1, isWorkingDay: false }],
      },
    );
    const nonWorking = await service.resolveEffectiveAttendanceSchedule(
      {
        organizationId: 'org_1',
        employeeId: employee.id,
        attendanceDate: new Date('2026-08-03T12:00:00Z'),
      },
      employee,
      {},
    );
    expect(nonWorking).toMatchObject({
      isWorkingDay: false,
      plannedCheckInAt: null,
      lateUntilAt: null,
    });
  });

  it('calculates all lateness tiers without blocking an absent check-in', () => {
    const { service } = setup();
    const base = new Date('2026-08-03T09:00:00Z');
    const schedule = {
      source: 'EMPLOYEE_OVERRIDE',
      isWorkingDay: true,
      plannedCheckIn: base,
      lateUntilAt: new Date(base.getTime() + 15 * 60000),
      severeLateUntilAt: new Date(base.getTime() + 60 * 60000),
      absentAfterAt: new Date(base.getTime() + 60 * 60000),
    };
    expect(
      (service as any).calculateScheduleLatePenalty(base, schedule, {})
        .attendanceStatus,
    ).toBe(HrAttendanceStatus.PRESENT);
    expect(
      (service as any).calculateScheduleLatePenalty(
        new Date(base.getTime() + 10 * 60000),
        schedule,
        {},
      ).attendanceStatus,
    ).toBe(HrAttendanceStatus.LATE);
    expect(
      (service as any).calculateScheduleLatePenalty(
        new Date(base.getTime() + 20 * 60000),
        schedule,
        {},
      ).attendanceStatus,
    ).toBe(HrAttendanceStatus.SEVERE_LATE);
    expect(
      (service as any).calculateScheduleLatePenalty(
        new Date(base.getTime() + 61 * 60000),
        schedule,
        {},
      ).attendanceStatus,
    ).toBe(HrAttendanceStatus.ABSENT);
  });
});

describe('HR attendance date filtering', () => {
  const manager = {
    userId: 'manager_1',
    organizationId: 'org_1',
    role: 'developer_admin',
    permissions: ['hr.view'],
  } as unknown as AuthenticatedRequestUser;

  function setup(timezone = 'Europe/Chisinau') {
    const prisma = {
      organization: { findUnique: jest.fn().mockResolvedValue({ timezone }) },
      hrAttendanceRecord: { findMany: jest.fn().mockResolvedValue([]) },
      organizationAttendanceSettings: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };
    return { prisma, service: new OperationsService(prisma as any) };
  }

  it('filters a selected date using organization-local day boundaries, not UTC midnight', async () => {
    const { prisma, service } = setup('Europe/Chisinau');
    await service.listHrAttendance(manager, { date: '2026-08-03' });
    expect(prisma.hrAttendanceRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: 'org_1',
          OR: [
            {
              checkInAt: {
                gte: new Date('2026-08-02T21:00:00.000Z'),
                lt: new Date('2026-08-03T21:00:00.000Z'),
              },
            },
            {
              checkInAt: null,
              date: {
                gte: new Date('2026-08-02T21:00:00.000Z'),
                lt: new Date('2026-08-03T21:00:00.000Z'),
              },
            },
          ],
        }),
      }),
    );
  });

  it('uses exactly one check-in day range so overnight attendance cannot be duplicated', async () => {
    const { prisma, service } = setup('UTC');
    await service.listHrAttendance(manager, { date: '2026-08-03' });
    const where = prisma.hrAttendanceRecord.findMany.mock.calls[0][0].where;
    expect(where.OR).toEqual([
      {
        checkInAt: {
          gte: new Date('2026-08-03T00:00:00.000Z'),
          lt: new Date('2026-08-04T00:00:00.000Z'),
        },
      },
      {
        checkInAt: null,
        date: {
          gte: new Date('2026-08-03T00:00:00.000Z'),
          lt: new Date('2026-08-04T00:00:00.000Z'),
        },
      },
    ]);
  });

  it('rejects invalid date values safely', async () => {
    const { service } = setup();
    await expect(
      service.listHrAttendance(manager, { date: '2026-02-30' }),
    ).rejects.toThrow('valid calendar date');
    await expect(
      service.listHrAttendance(manager, { date: '03-08-2026' }),
    ).rejects.toThrow('YYYY-MM-DD');
  });
});

describe('HR attendance roster export', () => {
  const manager = {
    userId: 'manager_1',
    organizationId: 'org_1',
    role: 'developer_admin',
    permissions: ['hr.view', 'hr.attendance.export'],
  } as unknown as AuthenticatedRequestUser;

  it('exports the complete selected month with organization-local day bounds', async () => {
    const prisma = {
      organization: {
        findUnique: jest.fn().mockResolvedValue({ timezone: 'UTC' }),
      },
      hrAttendanceRecord: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const service = new OperationsService(prisma as any);

    await service.exportHrAttendance(
      { dateFrom: '2026-08-01', dateTo: '2026-08-31', format: 'csv' },
      manager,
    );

    expect(prisma.hrAttendanceRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            {
              checkInAt: {
                gte: new Date('2026-08-01T00:00:00.000Z'),
                lt: new Date('2026-09-01T00:00:00.000Z'),
              },
            },
            {
              checkInAt: null,
              date: {
                gte: new Date('2026-08-01T00:00:00.000Z'),
                lt: new Date('2026-09-01T00:00:00.000Z'),
              },
            },
          ],
        }),
      }),
    );
    expect(
      prisma.hrAttendanceRecord.findMany.mock.calls[0][0],
    ).not.toHaveProperty('take');
  });

  it('exports every active employee with channel and monthly late allowance balance', async () => {
    const employee = {
      id: 'employee_1',
      organizationId: 'org_1',
      name: 'Example Employee',
      employeeCode: 'EMP-1',
      status: 'ACTIVE',
      attendanceScheduleMode: 'ORGANIZATION_DEFAULT',
      attendanceScheduleId: null,
      workStartDate: null,
      hireDate: null,
    };
    const attendance = {
      id: 'attendance_1',
      employeeId: employee.id,
      date: new Date('2026-08-04T00:00:00.000Z'),
      plannedCheckInAt: new Date('2026-08-04T11:15:00.000Z'),
      checkInAt: new Date('2026-08-04T11:20:00.000Z'),
      plannedCheckOutAt: new Date('2026-08-04T19:00:00.000Z'),
      checkOutAt: new Date('2026-08-04T19:00:00.000Z'),
      status: 'LATE',
      entryChannel: 'WEB',
      attendanceSource: 'SELF_SERVICE',
      minutesLate: 5,
      note: null,
    };
    const prisma = {
      organization: {
        findUnique: jest.fn().mockResolvedValue({ timezone: 'UTC' }),
      },
      organizationAttendanceSettings: {
        findUnique: jest.fn().mockResolvedValue({
          workStartTime: '11:15',
          workEndTime: '19:00',
          monthlyLateAllowanceHours: 4,
          lateAllowanceChargeHoursPerDay: 1,
          missingAttendanceDisposition: 'ABSENT',
        }),
      },
      hrEmployee: { findMany: jest.fn().mockResolvedValue([employee]) },
      hrAttendanceRecord: {
        findMany: jest
          .fn()
          .mockResolvedValueOnce([attendance])
          .mockResolvedValueOnce([
            {
              employeeId: employee.id,
              date: new Date('2026-08-01T00:00:00.000Z'),
            },
            {
              employeeId: employee.id,
              date: new Date('2026-08-02T00:00:00.000Z'),
            },
            {
              employeeId: employee.id,
              date: new Date('2026-08-03T00:00:00.000Z'),
            },
            {
              employeeId: employee.id,
              date: new Date('2026-08-04T00:00:00.000Z'),
            },
          ]),
      },
    };
    const service = new OperationsService(prisma as any);

    const csv = await service.exportHrAttendance(
      {
        date: '2026-08-04',
        dateFrom: '2026-08-04',
        dateTo: '2026-08-04',
        format: 'csv',
      },
      manager,
    );

    expect(csv).toContain('employeeName');
    expect(csv).toContain('Example Employee');
    expect(csv).toContain('WEB');
    expect(csv).toContain('lateAllowanceRemainingMinutes');
    expect(csv).toContain(',60,240,0,');
  });

  it('classifies a missing working day using the configured leave policy', async () => {
    const employee = {
      id: 'employee_1',
      organizationId: 'org_1',
      status: 'ACTIVE',
      workStartDate: null,
      hireDate: null,
    };
    const prisma = {
      organization: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: 'org_1', timezone: 'UTC' }]),
      },
      organizationAttendanceSettings: {
        findUnique: jest.fn().mockResolvedValue({
          workStartTime: '11:15',
          workEndTime: '19:00',
          missingAttendanceDisposition: 'LEAVE',
        }),
      },
      hrEmployee: { findMany: jest.fn().mockResolvedValue([employee]) },
      hrAttendanceRecord: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'attendance_1' }),
      },
    };
    const service = new OperationsService(prisma as any);
    jest
      .spyOn(service, 'resolveEffectiveAttendanceSchedule')
      .mockResolvedValue({
        isWorkingDay: true,
        scheduleSource: 'ORGANIZATION_DEFAULT',
        scheduleId: null,
        timezone: 'UTC',
        overnightShift: false,
        plannedCheckInAt: new Date('2026-08-04T11:15:00.000Z'),
        plannedCheckOutAt: new Date('2026-08-04T19:00:00.000Z'),
        graceMinutes: 0,
        expectedWorkMinutes: 465,
        lateUntilAt: new Date('2026-08-04T11:30:00.000Z'),
        severeLateUntilAt: new Date('2026-08-04T12:15:00.000Z'),
        absentAfterAt: new Date('2026-08-04T12:15:00.000Z'),
      } as any);

    await expect(
      service.reconcileMissingAttendanceRecords(
        new Date('2026-08-05T01:00:00.000Z'),
      ),
    ).resolves.toMatchObject({ created: 1 });
    expect(prisma.hrAttendanceRecord.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        date: new Date('2026-08-04T00:00:00.000Z'),
        status: 'LEAVE',
        attendanceSource: 'AUTO_GENERATED',
        entryChannel: 'AUTO',
      }),
    });
  });
});

describe('OperationsService employee access management', () => {
  const companyAdmin = {
    userId: 'admin_1',
    organizationId: 'org_1',
    organizationType: 'DEVELOPER',
    role: 'company_admin',
    permissions: [
      'hr.employees.create',
      'hr.employees.update',
      'hr.employees.deactivate',
      'hr.employees.reset_password',
      'hr.employees.permissions.manage',
      'hr.employees.view',
      'users.manage_own_org',
      'hr.manage',
      'company.dashboard.view',
    ],
  } as unknown as AuthenticatedRequestUser;

  function setupEmployeeAccess() {
    const employeeRecord = {
      id: 'employee_1',
      organizationId: 'org_1',
      userId: 'employee_user_1',
      name: 'New Employee',
      email: 'employee@example.com',
      phone: '+201001111111',
      status: HrEmployeeStatus.ACTIVE,
      roleTitle: 'Agent',
      user: {
        id: 'employee_user_1',
        role: {
          id: 'role_1',
          name: 'employee_self_service',
          permissions: [
            { permission: { key: 'company.dashboard.view' } },
            { permission: { key: 'hr.attendance.self' } },
          ],
        },
      },
    };
    const tx: any = {
      hrEmployee: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'employee_1' }),
        findUniqueOrThrow: jest.fn().mockResolvedValue(employeeRecord),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'employee_user_1' }),
        update: jest.fn().mockResolvedValue({ id: 'employee_user_1' }),
      },
      role: {
        upsert: jest
          .fn()
          .mockResolvedValue({ id: 'role_1', name: 'employee_self_service' }),
      },
      permission: {
        upsert: jest
          .fn()
          .mockImplementation(({ where }) =>
            Promise.resolve({ id: `perm_${where.key}`, key: where.key }),
          ),
      },
      rolePermission: {
        upsert: jest.fn().mockResolvedValue({}),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    const prisma: any = {
      $transaction: jest.fn((callback) => callback(tx)),
      user: {
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn().mockResolvedValue({ id: 'employee_user_1' }),
      },
      hrEmployee: {
        findMany: jest.fn().mockResolvedValue([employeeRecord]),
        findFirstOrThrow: jest.fn().mockResolvedValue(employeeRecord),
        update: jest.fn().mockResolvedValue(employeeRecord),
        findFirst: jest.fn().mockResolvedValue(employeeRecord),
        findUniqueOrThrow: jest.fn().mockResolvedValue(employeeRecord),
      },
      role: tx.role,
      permission: tx.permission,
      rolePermission: tx.rolePermission,
      organization: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'org_1',
          type: 'DEVELOPER',
          country: 'Egypt',
        }),
      },
      operationsActivity: {
        create: jest.fn().mockResolvedValue({ id: 'activity_1' }),
      },
    };
    const hashService = {
      hash: jest.fn().mockResolvedValue('scrypt:salt:hash'),
    };
    const auditLogs = {
      record: jest.fn().mockResolvedValue(undefined),
    };
    return {
      tx,
      prisma,
      hashService,
      auditLogs,
      service: new OperationsService(
        prisma,
        undefined,
        hashService as any,
        auditLogs as any,
      ),
    };
  }

  it('creates a scoped login user and linked HR employee for the current organization', async () => {
    const { service, tx, hashService, auditLogs } = setupEmployeeAccess();

    const result = await service.createHrEmployee(
      {
        firstName: 'New',
        lastName: 'Employee',
        email: 'employee@example.com',
        phone: '+201001111111',
        temporaryPassword: 'temporary-password',
        role: 'employee_self_service',
      },
      companyAdmin,
    );

    expect(result.id).toBe('employee_1');
    expect(hashService.hash).toHaveBeenCalledWith('temporary-password');
    expect(tx.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: 'org_1',
          email: 'employee@example.com',
          passwordHash: 'scrypt:salt:hash',
          mustChangePassword: true,
        }),
      }),
    );
    expect(tx.hrEmployee.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: 'org_1',
          userId: 'employee_user_1',
        }),
      }),
    );
    expect(auditLogs.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'employee.created' }),
    );
  });

  it('generates a secure one-time temporary password and forces password change', async () => {
    const { service, tx, hashService } = setupEmployeeAccess();

    const result = await service.createHrEmployee(
      {
        firstName: 'Default',
        email: 'default-password@example.com',
        role: 'employee_self_service',
      },
      companyAdmin,
    );

    expect(hashService.hash).toHaveBeenCalledWith(
      expect.stringMatching(/^Pw-[A-Za-z0-9_-]{12}$/),
    );
    expect(result.temporaryPassword).toEqual(
      expect.stringMatching(/^Pw-[A-Za-z0-9_-]{12}$/),
    );
    expect(tx.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          mustChangePassword: true,
        }),
      }),
    );
  });

  it('allows brokerage admins with HR permissions to create employees in their own organization', async () => {
    const { service, tx } = setupEmployeeAccess();
    const brokerageAdmin = {
      ...companyAdmin,
      organizationType: 'BROKERAGE',
      role: 'brokerage_admin',
    } as AuthenticatedRequestUser;

    await service.createHrEmployee(
      {
        firstName: 'Brokerage',
        email: 'brokerage-employee@example.com',
        temporaryPassword: 'temporary-password',
      },
      brokerageAdmin,
    );

    expect(tx.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ organizationId: 'org_1' }),
      }),
    );
  });

  it('requires platform users to select an organization when creating an employee', async () => {
    const { service } = setupEmployeeAccess();
    const platformOwner = {
      ...companyAdmin,
      organizationId: 'platform_org',
      organizationType: 'PLATFORM',
      role: 'platform_owner',
      permissions: ['hr.manage', 'organizations.view_all'],
    } as AuthenticatedRequestUser;

    await expect(
      service.createHrEmployee(
        {
          firstName: 'Platform',
          email: 'platform-employee@example.com',
          temporaryPassword: 'temporary-password',
        },
        platformOwner,
      ),
    ).rejects.toThrow('organizationId is required for platform users.');
  });

  it('allows platform owners to create employees for a selected organization', async () => {
    const { service, tx, prisma } = setupEmployeeAccess();
    const platformOwner = {
      ...companyAdmin,
      organizationId: 'platform_org',
      organizationType: 'PLATFORM',
      role: 'platform_owner',
      permissions: ['hr.manage', 'organizations.view_all'],
    } as AuthenticatedRequestUser;

    await service.createHrEmployee(
      {
        organizationId: 'org_2',
        firstName: 'Platform',
        email: 'platform-employee@example.com',
        temporaryPassword: 'temporary-password',
      },
      platformOwner,
    );

    expect(tx.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ organizationId: 'org_2' }),
      }),
    );
    expect(prisma.operationsActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ organizationId: 'org_1' }),
      }),
    );
  });

  it('lets platform owners filter employee lists by organization', async () => {
    const { service, prisma } = setupEmployeeAccess();
    const platformOwner = {
      ...companyAdmin,
      organizationId: 'platform_org',
      organizationType: 'PLATFORM',
      role: 'platform_owner',
      permissions: ['hr.employees.view', 'organizations.view_all'],
    } as AuthenticatedRequestUser;

    await service.listHrEmployees({ organizationId: 'org_2' }, platformOwner);

    expect(prisma.hrEmployee.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: 'org_2' },
      }),
    );
  });

  it('blocks company admins from creating employees in another organization', async () => {
    const { service } = setupEmployeeAccess();

    await expect(
      service.createHrEmployee(
        {
          organizationId: 'org_2',
          firstName: 'Cross',
          email: 'cross@example.com',
          temporaryPassword: 'temporary-password',
        },
        companyAdmin,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('blocks HR users from assigning platform permissions', async () => {
    const { service } = setupEmployeeAccess();

    await expect(
      service.createHrEmployee(
        {
          firstName: 'Unsafe',
          email: 'unsafe@example.com',
          temporaryPassword: 'temporary-password',
          permissions: ['platform.organizations.manage'],
        },
        { ...companyAdmin, role: 'hr_manager' } as AuthenticatedRequestUser,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('blocks employees from changing their own permissions', async () => {
    const { service, prisma } = setupEmployeeAccess();
    prisma.hrEmployee.findFirstOrThrow.mockResolvedValueOnce({
      id: 'employee_1',
      organizationId: 'org_1',
      userId: 'admin_1',
      name: 'Admin Employee',
    });

    await expect(
      service.updateHrEmployeePermissions(
        'employee_1',
        { permissions: ['company.dashboard.view'] },
        companyAdmin,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('hashes reset passwords and writes an audit log without logging the password', async () => {
    const { service, prisma, hashService, auditLogs } = setupEmployeeAccess();

    await service.resetHrEmployeePassword(
      'employee_1',
      { temporaryPassword: 'new-temporary-password' },
      companyAdmin,
    );

    expect(hashService.hash).toHaveBeenCalledWith('new-temporary-password');
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          passwordHash: 'scrypt:salt:hash',
          mustChangePassword: true,
        }),
      }),
    );
    expect(auditLogs.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'employee.password_reset',
        metadata: undefined,
      }),
    );
  });

  it('deactivates the linked login user when an employee is deactivated', async () => {
    const { service, prisma, auditLogs } = setupEmployeeAccess();

    await service.setHrEmployeeActive('employee_1', false, companyAdmin);

    expect(prisma.hrEmployee.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: HrEmployeeStatus.INACTIVE } }),
    );
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isActive: false } }),
    );
    expect(auditLogs.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'employee.deactivated' }),
    );
  });
});

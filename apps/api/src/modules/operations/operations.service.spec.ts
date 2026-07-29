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
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-10T00:00:00.000Z'));
    const { prisma, service } = setup();
    prisma.organizationAttendanceSettings.findUnique.mockResolvedValueOnce(
      attendanceSettings({ workStartTime: '23:59' }),
    );

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

  it('rejects a non-positive GPS accuracy policy value', () => {
    const { service } = setup();
    expect(() => (service as any).attendanceSettingsData({ maxGpsAccuracyMeters: 0 }))
      .toThrow('maxGpsAccuracyMeters must be greater than zero.');
    expect(() => (service as any).attendanceSettingsData({ maxGpsAccuracyMeters: -10 }))
      .toThrow('maxGpsAccuracyMeters must be greater than zero.');
  });

  it('allows at most one concurrent reference approval and surfaces the unique-index conflict', async () => {
    const { prisma, service } = setup();
    const reviewer = { ...user, permissions: ['hr.attendance.review'] };
    prisma.employeeAttendanceReferencePhoto = {
      findFirstOrThrow: jest.fn().mockResolvedValue({
        id: 'reference_1', organizationId: 'org_1', employeeId: employee.id, fileId: 'file_1',
      }),
    };
    const tx = {
      employeeAttendanceReferencePhoto: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        update: jest.fn().mockResolvedValue({ id: 'reference_1', status: 'APPROVED_REFERENCE' }),
      },
      hrEmployee: { update: jest.fn().mockResolvedValue(employee) },
    };
    prisma.$transaction = jest
      .fn()
      .mockImplementationOnce((callback: any) => callback(tx))
      .mockRejectedValueOnce({ code: 'P2002' });

    const results = await Promise.allSettled([
      service.reviewAttendanceReference('reference_1', { approve: true }, reviewer),
      service.reviewAttendanceReference('reference_1', { approve: true }, reviewer),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')[0]).toMatchObject({
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
      service.checkInHrAttendance({ wifiSsid: 'Guest', clientPlatform: 'MOBILE' }, user),
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
        upsert: jest.fn().mockResolvedValue({ id: 'role_1', name: 'employee_self_service' }),
      },
      permission: {
        upsert: jest.fn().mockImplementation(({ where }) =>
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
      service: new OperationsService(prisma, undefined, hashService as any, auditLogs as any),
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

    expect(hashService.hash).toHaveBeenCalledWith(expect.stringMatching(/^Pw-[A-Za-z0-9_-]{12}$/));
    expect(result.temporaryPassword).toEqual(expect.stringMatching(/^Pw-[A-Za-z0-9_-]{12}$/));
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

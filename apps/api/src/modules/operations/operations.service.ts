import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import {
  AccountingTransactionStatus,
  AccountingTransactionType,
  AdsCampaignProvider,
  AdsCampaignStatus,
  AttendanceLateLevel,
  AttendanceEntryChannel,
  AutoCloseReason,
  AttendanceScheduleMode,
  AttendancePenaltyType,
  AttendanceSource,
  AttendanceFaceVerificationStatus,
  AttendanceReferencePhotoStatus,
  AttendanceVerificationStatus,
  CameraDeviceProvider,
  CameraDeviceStatus,
  DvrVerificationStatus,
  CheckOutMethod,
  CheckOutOutsideLocationPolicy,
  CheckOutVerificationStatus,
  HrAttendanceStatus,
  HrEmployeeStatus,
  LegalCaseStatus,
  LegalDocumentStatus,
  LegalDocumentType,
  OperationsModule,
  Prisma,
  RegularShiftAutoCloseMode,
  MissingAttendanceDisposition,
  UserRole,
  WebWifiPolicy,
} from '@prisma/client';
import {
  operationOrganizationWhere,
  requireDeveloperOrPlatform,
  requireOperationOrganizationId,
  requireOperationPermission,
  requireOperationsWorkspace,
} from '../../common/operations-scope';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { HashService } from '../auth/hash.service';
import { PrismaService } from '../database/prisma.service';
import { FilesService } from '../files/files.service';
import { normalizeOptionalPhoneOrThrow, phonesMatch } from '../../common/phone-normalization';
import { isPlatformUser } from '../../common/organization-scope';
import { ROLE_PERMISSIONS } from '../permissions/rbac.seed';

const COMPANY_ROLE_TO_USER_ROLE: Record<string, UserRole> = {
  platform_support: UserRole.PLATFORM_SUPPORT,
  platform_hr: UserRole.PLATFORM_SUPPORT,
  platform_sales: UserRole.PLATFORM_SUPPORT,
  platform_admin_limited: UserRole.PLATFORM_ADMIN,
  company_admin: UserRole.DEVELOPER_ADMIN,
  hr_manager: UserRole.DEVELOPER_ADMIN,
  hr_employee: UserRole.DEVELOPER_SALES_AGENT,
  sales_manager: UserRole.DEVELOPER_SALES_MANAGER,
  sales_agent: UserRole.DEVELOPER_SALES_AGENT,
  finance_user: UserRole.DEVELOPER_ADMIN,
  employee_self_service: UserRole.DEVELOPER_SALES_AGENT,
  developer_owner: UserRole.DEVELOPER_OWNER,
  developer_admin: UserRole.DEVELOPER_ADMIN,
  developer_sales_manager: UserRole.DEVELOPER_SALES_MANAGER,
  developer_sales_agent: UserRole.DEVELOPER_SALES_AGENT,
  broker: UserRole.BROKER,
  brokerage_admin: UserRole.BROKERAGE_ADMIN,
  brokerage_owner: UserRole.BROKERAGE_OWNER,
};

const PLATFORM_PERMISSION_PREFIXES = ['platform.'];
const PLATFORM_PERMISSION_KEYS = new Set([
  'organizations.verify',
  'organizations.suspend',
  'organizations.view_all',
  'organizations.update',
  'platform.settings',
  'platform.organizations.view',
  'platform.organizations.manage',
  'subscriptions.manage',
  'disputes.resolve',
  'audit_logs.view',
  'reports.platform_wide',
  'users.impersonate',
  'exports.platform_data',
]);

/** A missing overnight snapshot is never guessed.  It remains open until this
 * bounded safety limit, then is auto-closed for manual review only. */
const STALE_OPEN_ATTENDANCE_MAX_HOURS = 36;
const AUTO_CLOSE_BATCH_SIZE = 100;
const AUTO_CLOSE_WARNING_MINUTES = 30;

const ROLE_LABELS: Record<string, string> = {
  platform_support: 'Platform support',
  platform_hr: 'Platform HR',
  platform_sales: 'Platform sales',
  platform_admin_limited: 'Platform admin limited',
  company_admin: 'Company admin',
  hr_manager: 'HR manager',
  hr_employee: 'HR employee',
  sales_manager: 'Sales manager',
  sales_agent: 'Sales agent',
  finance_user: 'Finance user',
  employee_self_service: 'Employee self service',
};

const HR_EMPLOYEE_INCLUDE = {
  department: true,
  organization: {
    select: {
      id: true,
      name: true,
      type: true,
      status: true,
    },
  },
  user: {
    select: {
      id: true,
      email: true,
      phone: true,
      firstName: true,
      lastName: true,
      isActive: true,
      passwordHash: true,
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
  },
} satisfies Prisma.HrEmployeeInclude;

@Injectable()
export class OperationsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional()
    private readonly filesService?: FilesService,
    @Optional()
    private readonly hashService?: HashService,
    @Optional()
    private readonly auditLogs?: AuditLogsService,
  ) {}

  listHrDepartments(user: AuthenticatedRequestUser) {
    this.assertHrWorkspace(user);
    requireOperationPermission(user, ['hr.view', 'hr.manage']);
    return this.prisma.hrDepartment.findMany({
      where: operationOrganizationWhere(user),
      orderBy: { createdAt: 'desc' },
    });
  }

  async createHrDepartment(input: any, user: AuthenticatedRequestUser) {
    this.assertHrWorkspace(user);
    requireOperationPermission(user, ['hr.manage']);
    const record = await this.prisma.hrDepartment.create({
      data: {
        organizationId: requireOperationOrganizationId(user),
        name: this.required(input.name, 'name'),
        isActive: input.isActive === undefined ? true : Boolean(input.isActive),
      },
    });
    await this.recordActivity(
      user,
      OperationsModule.HR,
      'HrDepartment',
      record.id,
      'CREATED',
      'HR department created',
      record.name,
    );
    return record;
  }

  async updateHrDepartment(
    id: string,
    input: any,
    user: AuthenticatedRequestUser,
  ) {
    this.assertHrWorkspace(user);
    requireOperationPermission(user, ['hr.manage']);
    await this.assertExists('hrDepartment', id, user);
    const record = await this.prisma.hrDepartment.update({
      where: { id },
      data: { name: input.name, isActive: input.isActive },
    });
    await this.recordActivity(
      user,
      OperationsModule.HR,
      'HrDepartment',
      record.id,
      'UPDATED',
      'HR department updated',
      record.name,
    );
    return record;
  }

  async bulkUpdateHrDepartmentStatus(
    input: any,
    user: AuthenticatedRequestUser,
  ) {
    this.assertHrWorkspace(user);
    requireOperationPermission(user, ['hr.manage']);
    const ids = this.bulkIds(input.ids);
    const isActive = this.booleanStatus(input.status ?? input.isActive);
    const records = await this.prisma.hrDepartment.findMany({
      where: { id: { in: ids }, ...operationOrganizationWhere(user) },
    });
    this.assertBulkScope(ids, records);
    await this.prisma.hrDepartment.updateMany({
      where: { id: { in: ids } },
      data: { isActive },
    });
    await this.recordBulkActivities(
      user,
      records,
      OperationsModule.HR,
      'HrDepartment',
      'BULK_STATUS_UPDATED',
      'HR departments bulk status updated',
      { isActive },
    );
    return {
      updatedCount: records.length,
      ids: records.map((record) => record.id),
      status: isActive ? 'ACTIVE' : 'INACTIVE',
    };
  }

  getHrDepartment(id: string, user: AuthenticatedRequestUser) {
    this.assertHrWorkspace(user);
    requireOperationPermission(user, ['hr.view', 'hr.manage']);
    return this.findScoped('hrDepartment', id, user);
  }

  listOrganizationBranches(input: any, user: AuthenticatedRequestUser) {
    this.assertHrWorkspace(user);
    requireOperationPermission(user, ['company.settings.view', 'company.settings.manage', 'hr.manage']);
    return this.prisma.organizationBranch.findMany({
      where: this.organizationScopedWhere(input, user),
      orderBy: { createdAt: 'desc' },
    });
  }

  async upsertOrganizationBranch(input: any, user: AuthenticatedRequestUser) {
    this.assertHrWorkspace(user);
    requireOperationPermission(user, ['company.settings.manage', 'hr.manage']);
    const organizationId = this.resolveScopedOrganizationId(input, user);
    const id = this.optional(input.id);
    if (!id) await this.assertBranchLimit(organizationId);
    const data = {
      organizationId,
      name: this.required(input.name, 'name'),
      code: this.optional(input.code),
      address: this.optional(input.address),
      city: this.optional(input.city),
      country: this.optional(input.country),
      latitude: this.optionalNumber(input.latitude),
      longitude: this.optionalNumber(input.longitude),
      exactRadiusMeters: this.positiveInt(input.exactRadiusMeters, 30),
      expandedRadiusMeters: this.positiveInt(input.expandedRadiusMeters, 1000),
      isActive: input.isActive === undefined ? true : Boolean(input.isActive),
    };
    const record = id
      ? await this.prisma.organizationBranch.update({
          where: { id },
          data,
        })
      : await this.prisma.organizationBranch.create({ data });
    await this.recordActivity(
      user,
      OperationsModule.HR,
      'OrganizationBranch',
      record.id,
      id ? 'UPDATED' : 'CREATED',
      id ? 'Branch updated' : 'Branch created',
      record.name,
      undefined,
      record.organizationId,
    );
    return record;
  }

  async setOrganizationBranchActive(
    id: string,
    active: boolean,
    user: AuthenticatedRequestUser,
  ) {
    this.assertHrWorkspace(user);
    requireOperationPermission(user, ['company.settings.manage', 'hr.manage']);
    const existing = await this.prisma.organizationBranch.findFirst({
      where: { id, ...operationOrganizationWhere(user) },
    });
    if (!existing) throw new NotFoundException('Branch not found.');
    return this.prisma.organizationBranch.update({
      where: { id },
      data: { isActive: active },
    });
  }

  async getAttendanceSettings(input: any, user: AuthenticatedRequestUser) {
    this.assertHrWorkspace(user);
    requireOperationPermission(user, ['company.settings.view', 'company.settings.manage', 'hr.view', 'hr.manage']);
    const organizationId = this.resolveScopedOrganizationId(input, user);
    return this.attendancePolicy(organizationId);
  }

  async listAttendanceSchedules(user: AuthenticatedRequestUser) {
    this.assertHrWorkspace(user);
    requireOperationPermission(user, ['hr.employees.view', 'hr.view', 'hr.manage']);
    return this.prisma.hrAttendanceSchedule.findMany({ where: { organizationId: requireOperationOrganizationId(user), isActive: true }, orderBy: { name: 'asc' }, select: { id: true, name: true, timezone: true, effectiveFrom: true, effectiveTo: true } });
  }

  async updateAttendanceSettings(input: any, user: AuthenticatedRequestUser) {
    this.assertHrWorkspace(user);
    requireOperationPermission(user, ['company.settings.manage', 'hr.manage']);
    const organizationId = this.resolveScopedOrganizationId(input, user);
    const data = this.attendanceSettingsData(input);
    const settings = await this.prisma.organizationAttendanceSettings.upsert({
      where: { organizationId },
      create: { organizationId, ...data },
      update: data,
    });
    await this.recordActivity(
      user,
      OperationsModule.HR,
      'OrganizationAttendanceSettings',
      settings.id,
      'UPDATED',
      'Attendance policy updated',
      organizationId,
      undefined,
      organizationId,
    );
    return settings;
  }

  async listHrEmployees(input: any, user: AuthenticatedRequestUser) {
    this.assertHrWorkspace(user);
    requireOperationPermission(user, ['hr.employees.view', 'hr.view', 'hr.manage']);
    const records = await this.prisma.hrEmployee.findMany({
      where: this.employeeOrganizationWhere(input, user),
      include: HR_EMPLOYEE_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return records.map((record) => this.hrEmployeeResponse(record));
  }

  async createHrEmployee(input: any, user: AuthenticatedRequestUser) {
    this.assertHrWorkspace(user);
    requireOperationPermission(user, [
      'hr.employees.create',
      'hr.manage',
      'users.manage_own_org',
    ]);
    this.ensureHashService();

    const organizationId = this.resolveEmployeeOrganizationId(input, user);
    await this.assertEmployeeLimit(organizationId);
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, type: true, country: true },
    });
    if (!organization) {
      throw new BadRequestException('organizationId is invalid.');
    }
    const email = this.requiredEmail(input.email);
    const phone = normalizeOptionalPhoneOrThrow(
      input.phone,
      'phone',
      this.optional(input.phoneCountry) ?? organization.country,
    );
    await this.assertEmployeePhoneAvailable(phone);
    const roleName = this.employeeRoleName(input.role);
    this.assertEmployeeRoleAssignable(roleName, user);
    const requestedPermissions = this.permissionKeys(input.permissions);
    await this.assertAssignableEmployeePermissions(requestedPermissions, user);
    const generatedPassword = !this.optional(input.temporaryPassword ?? input.password);
    const password = generatedPassword
      ? this.generateTemporaryPassword()
      : this.required(input.temporaryPassword ?? input.password, 'temporaryPassword');
    if (password.length < 12 || password === '123456') {
      throw new BadRequestException('temporaryPassword must be at least 12 characters and cannot use the legacy default.');
    }
    const passwordHash = await this.hashService!.hash(password);
    const name = this.employeeName(input);
    const status = this.enumValue(
      HrEmployeeStatus,
      input.status ?? (input.isActive === false ? 'INACTIVE' : 'ACTIVE'),
      HrEmployeeStatus.ACTIVE,
    );
    const attendanceSchedule = await this.employeeAttendanceScheduleSelection(
      organizationId,
      input,
      { attendanceScheduleMode: AttendanceScheduleMode.ORGANIZATION_DEFAULT, attendanceScheduleId: null },
    );

    const record = await this.prisma.$transaction(async (tx) => {
      const existingEmployee = await tx.hrEmployee.findFirst({
        where: {
          organizationId,
          OR: [{ email }, ...(phone ? [{ phone }] : [])],
        },
      });
      if (existingEmployee) {
        throw new ConflictException('Employee already exists in this organization.');
      }

      const existingUser = await tx.user.findUnique({
        where: { email },
        include: { hrEmployeeProfile: true },
      });
      if (existingUser && existingUser.organizationId !== organizationId) {
        throw new ConflictException('Email is already registered for another organization.');
      }
      if (existingUser?.hrEmployeeProfile) {
        throw new ConflictException('User is already linked to an employee profile.');
      }

      const role = await this.ensureEmployeeRole(tx, organizationId, roleName);
      const userRecord =
        existingUser ??
        (await tx.user.create({
          data: {
            organizationId,
            roleId: role.id,
            email,
            passwordHash,
            firstName: this.optional(input.firstName),
            lastName: this.optional(input.lastName),
            phone,
            userRole: this.userRoleForEmployeeRole(roleName),
            isActive: status === HrEmployeeStatus.ACTIVE,
            mustChangePassword: true,
          },
        }));

      if (existingUser) {
        await tx.user.update({
          where: { id: existingUser.id },
          data: {
            roleId: role.id,
            passwordHash,
            firstName: this.optional(input.firstName) ?? existingUser.firstName,
            lastName: this.optional(input.lastName) ?? existingUser.lastName,
            phone: phone ?? existingUser.phone,
            userRole: this.userRoleForEmployeeRole(roleName),
            isActive: status === HrEmployeeStatus.ACTIVE,
            mustChangePassword: true,
          },
        });
      }

      const employee = await tx.hrEmployee.create({
        data: {
          organizationId,
          userId: userRecord.id,
          departmentId: this.optional(input.departmentId),
          attendanceScheduleMode: attendanceSchedule.mode,
          attendanceScheduleId: attendanceSchedule.id,
          name,
          email,
          phone,
          roleTitle: this.optional(input.jobTitle ?? input.roleTitle),
          status,
        },
      });

      if (requestedPermissions.length) {
        const customRole = await this.createCustomEmployeeRole(
          tx,
          organizationId,
          employee.id,
          requestedPermissions,
        );
        await tx.user.update({
          where: { id: userRecord.id },
          data: { roleId: customRole.id },
        });
      }

      return tx.hrEmployee.findUniqueOrThrow({
        where: { id: employee.id },
        include: HR_EMPLOYEE_INCLUDE,
      });
    });
    await this.recordActivity(
      user,
      OperationsModule.HR,
      'HrEmployee',
      record.id,
      'CREATED',
      'HR employee created',
      record.name,
      undefined,
      record.organizationId,
    );
    await this.recordAudit(user, 'employee.created', 'HrEmployee', record.id, {
      role: record.user?.role?.name ?? roleName,
    });
    return {
      ...this.hrEmployeeResponse(record),
      temporaryPassword: generatedPassword ? password : undefined,
    };
  }

  async updateHrEmployee(
    id: string,
    input: any,
    user: AuthenticatedRequestUser,
  ) {
    this.assertHrWorkspace(user);
    requireOperationPermission(user, ['hr.employees.update', 'hr.manage']);
    const existing = await this.assertExists('hrEmployee', id, user);
    const organization = await this.prisma.organization.findUnique({
      where: { id: existing.organizationId },
      select: { country: true },
    });
    const phone = normalizeOptionalPhoneOrThrow(
      input.phone,
      'phone',
      this.optional(input.phoneCountry) ?? organization?.country,
    );
    await this.assertEmployeePhoneAvailable(phone, existing.userId ?? undefined);
    const attendanceSchedule = await this.employeeAttendanceScheduleSelection(existing.organizationId, input, existing);
    const record = await this.prisma.hrEmployee.update({
      where: { id },
      data: {
        departmentId: input.departmentId,
        attendanceScheduleMode: attendanceSchedule.mode,
        attendanceScheduleId: attendanceSchedule.id,
        name: input.name ?? this.employeeName(input, existing.name),
        email: this.optional(input.email),
        phone,
        roleTitle: this.optional(input.jobTitle ?? input.roleTitle),
        status: input.status,
      },
      include: HR_EMPLOYEE_INCLUDE,
    });
    if (record.userId) {
      await this.prisma.user.update({
        where: { id: record.userId },
        data: {
          firstName: this.optional(input.firstName),
          lastName: this.optional(input.lastName),
          phone,
          isActive: record.status === HrEmployeeStatus.ACTIVE,
        },
      });
    }
    await this.recordActivity(
      user,
      OperationsModule.HR,
      'HrEmployee',
      record.id,
      'UPDATED',
      'HR employee updated',
      record.name,
      undefined,
      record.organizationId,
    );
    await this.recordAudit(user, 'employee.updated', 'HrEmployee', record.id);
    return this.hrEmployeeResponse(record);
  }

  async getEmployeeAttendanceOverride(employeeId: string, user: AuthenticatedRequestUser) {
    this.assertHrWorkspace(user); requireOperationPermission(user, ['hr.employees.view', 'hr.view', 'hr.manage']);
    const employee = await this.assertExists('hrEmployee', employeeId, user);
    // Return the currently effective override when one exists; otherwise retain
    // the most recently configured active override so switching back to this
    // mode restores the administrator's previous weekly rules.
    const now = new Date();
    return this.prisma.hrEmployeeAttendanceScheduleOverride.findFirst({
      where: { employeeId, organizationId: employee.organizationId, isActive: true },
      orderBy: [{ effectiveFrom: 'desc' }],
    }).then(async (latest: any) => this.prisma.hrEmployeeAttendanceScheduleOverride.findFirst({
      where: { employeeId, organizationId: employee.organizationId, isActive: true, effectiveFrom: { lte: now }, OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }] },
      orderBy: { effectiveFrom: 'desc' },
    }) ?? latest);
  }
  async createEmployeeAttendanceOverride(employeeId: string, input: any, user: AuthenticatedRequestUser) {
    const employee = await this.overrideEmployee(employeeId, user);
    const data = await this.validatedAttendanceOverride(employee, input);
    return this.prisma.hrEmployeeAttendanceScheduleOverride.create({ data: { ...data, employeeId, organizationId: employee.organizationId } });
  }
  async updateEmployeeAttendanceOverride(employeeId: string, overrideId: string, input: any, user: AuthenticatedRequestUser) {
    const employee = await this.overrideEmployee(employeeId, user);
    const existing = await this.prisma.hrEmployeeAttendanceScheduleOverride.findFirst({ where: { id: overrideId, employeeId, organizationId: employee.organizationId } });
    if (!existing) throw new NotFoundException('Attendance override not found.');
    const data = await this.validatedAttendanceOverride(employee, input, overrideId);
    return this.prisma.hrEmployeeAttendanceScheduleOverride.update({ where: { id: overrideId }, data });
  }
  private async overrideEmployee(employeeId: string, user: AuthenticatedRequestUser) { this.assertHrWorkspace(user); requireOperationPermission(user, ['hr.employees.update', 'hr.manage']); return this.assertExists('hrEmployee', employeeId, user); }
  private async validatedAttendanceOverride(employee: any, input: any, excludeId?: string) {
    const rules = input?.weeklyRules;
    if (!Array.isArray(rules) || !rules.length) throw new BadRequestException('weeklyRules is required.');
    const days = new Set<number>();
    for (const rule of rules) { const day = Number(rule.dayOfWeek); if (!Number.isInteger(day) || day < 0 || day > 6 || days.has(day)) throw new BadRequestException('weeklyRules contains an invalid or duplicate dayOfWeek.'); days.add(day); this.assertAttendanceRule(rule); }
    const timezone = this.attendanceTimezone(input.timezone);
    const effectiveFrom = new Date(input.effectiveFrom); const effectiveTo = input.effectiveTo ? new Date(input.effectiveTo) : null;
    if (Number.isNaN(effectiveFrom.getTime()) || (effectiveTo && (Number.isNaN(effectiveTo.getTime()) || effectiveTo < effectiveFrom))) throw new BadRequestException('Invalid effective dates.');
    const overlap = await this.prisma.hrEmployeeAttendanceScheduleOverride.findFirst({ where: { employeeId: employee.id, organizationId: employee.organizationId, isActive: true, ...(excludeId ? { id: { not: excludeId } } : {}), effectiveFrom: { lte: effectiveTo ?? new Date('9999-12-31') }, OR: [{ effectiveTo: null }, { effectiveTo: { gte: effectiveFrom } }] } });
    if (overlap) throw new ConflictException('Attendance override effective dates overlap.');
    // Boundaries are inclusive: an override ending at the same instant another
    // one starts overlaps and is rejected. This is intentional and documented.
    return { weeklyRules: rules, timezone, effectiveFrom, effectiveTo, isActive: input.isActive === false ? false : true };
  }

  private async employeeAttendanceScheduleSelection(organizationId: string, input: any, existing: any) {
    const mode = input.attendanceScheduleMode === undefined
      ? (existing.attendanceScheduleMode ?? AttendanceScheduleMode.ORGANIZATION_DEFAULT)
      : this.enumValue(AttendanceScheduleMode, input.attendanceScheduleMode, AttendanceScheduleMode.ORGANIZATION_DEFAULT);
    const requestedId = input.attendanceScheduleId === undefined ? existing.attendanceScheduleId : this.optional(input.attendanceScheduleId);
    if (mode === AttendanceScheduleMode.ORGANIZATION_DEFAULT) return { mode, id: null };
    if (mode === AttendanceScheduleMode.ASSIGNED_SCHEDULE) {
      if (!requestedId) throw new BadRequestException('attendanceScheduleId is required for an assigned schedule.');
      const schedule = await this.prisma.hrAttendanceSchedule.findFirst({ where: { id: requestedId, organizationId, isActive: true } });
      if (!schedule) throw new BadRequestException('attendanceScheduleId must reference an active schedule in this organization.');
      return { mode, id: requestedId };
    }
    // The mode is only valid after an override has been safely saved. This
    // prevents a partial web save from leaving an employee in a silent void.
    if (existing?.id) {
      const override = await this.prisma.hrEmployeeAttendanceScheduleOverride.findFirst({ where: { employeeId: existing.id, organizationId, isActive: true } });
      if (!override) throw new BadRequestException('Create an employee attendance override before selecting EMPLOYEE_OVERRIDE mode.');
    } else {
      throw new BadRequestException('Create the employee override after the employee profile is created, then select EMPLOYEE_OVERRIDE mode.');
    }
    return { mode, id: null };
  }

  async bulkUpdateHrEmployeeStatus(input: any, user: AuthenticatedRequestUser) {
    this.assertHrWorkspace(user);
    requireOperationPermission(user, ['hr.manage']);
    const ids = this.bulkIds(input.ids);
    const status = this.enumValue(
      HrEmployeeStatus,
      input.status,
      HrEmployeeStatus.ACTIVE,
    );
    const records = await this.prisma.hrEmployee.findMany({
      where: { id: { in: ids }, ...operationOrganizationWhere(user) },
    });
    this.assertBulkScope(ids, records);
    await this.prisma.hrEmployee.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });
    await this.recordBulkActivities(
      user,
      records,
      OperationsModule.HR,
      'HrEmployee',
      'BULK_STATUS_UPDATED',
      'HR employees bulk status updated',
      { status },
    );
    return {
      updatedCount: records.length,
      ids: records.map((record) => record.id),
      status,
    };
  }

  async getHrEmployee(id: string, user: AuthenticatedRequestUser) {
    this.assertHrWorkspace(user);
    requireOperationPermission(user, ['hr.employees.view', 'hr.view', 'hr.manage']);
    const record = await this.prisma.hrEmployee
      .findFirstOrThrow({
        where: { id, ...operationOrganizationWhere(user) },
        include: HR_EMPLOYEE_INCLUDE,
      })
      .catch(() => {
        throw new NotFoundException('Record not found.');
      });
    return this.hrEmployeeResponse(record);
  }

  async resetHrEmployeePassword(
    id: string,
    input: any,
    user: AuthenticatedRequestUser,
  ) {
    this.assertHrWorkspace(user);
    requireOperationPermission(user, [
      'hr.employees.reset_password',
      'hr.manage',
      'users.manage_own_org',
    ]);
    this.ensureHashService();
    const employee = await this.findEmployeeForMutation(id, user);
    if (!employee.userId) {
      throw new BadRequestException('Employee is not linked to a login user.');
    }
    const generated = !this.optional(input.temporaryPassword ?? input.password);
    const temporaryPassword = generated
      ? this.generateTemporaryPassword()
      : this.required(input.temporaryPassword ?? input.password, 'temporaryPassword');
    if (temporaryPassword.length < 12 || temporaryPassword === '123456') {
      throw new BadRequestException('temporaryPassword must be at least 12 characters and cannot use the legacy default.');
    }
    await this.prisma.user.update({
      where: { id: employee.userId },
      data: {
        passwordHash: await this.hashService!.hash(temporaryPassword),
        mustChangePassword: true,
        isActive: true,
      },
    });
    await this.recordActivity(
      user,
      OperationsModule.HR,
      'HrEmployee',
      employee.id,
      'PASSWORD_RESET',
      'HR employee password reset',
      employee.name,
      undefined,
      employee.organizationId,
    );
    await this.recordAudit(user, 'employee.password_reset', 'HrEmployee', employee.id);
    return {
      id: employee.id,
      passwordReset: true,
      temporaryPassword: generated ? temporaryPassword : undefined,
    };
  }

  async setHrEmployeeActive(
    id: string,
    active: boolean,
    user: AuthenticatedRequestUser,
  ) {
    this.assertHrWorkspace(user);
    requireOperationPermission(user, [
      'hr.employees.deactivate',
      'hr.manage',
      'users.manage_own_org',
    ]);
    const employee = await this.findEmployeeForMutation(id, user);
    const status = active ? HrEmployeeStatus.ACTIVE : HrEmployeeStatus.INACTIVE;
    const updated = await this.prisma.hrEmployee.update({
      where: { id: employee.id },
      data: { status },
      include: HR_EMPLOYEE_INCLUDE,
    });
    if (employee.userId) {
      await this.prisma.user.update({
        where: { id: employee.userId },
        data: { isActive: active },
      });
    }
    await this.recordActivity(
      user,
      OperationsModule.HR,
      'HrEmployee',
      employee.id,
      active ? 'ACTIVATED' : 'DEACTIVATED',
      active ? 'HR employee activated' : 'HR employee deactivated',
      employee.name,
      undefined,
      employee.organizationId,
    );
    await this.recordAudit(
      user,
      active ? 'employee.activated' : 'employee.deactivated',
      'HrEmployee',
      employee.id,
    );
    return this.hrEmployeeResponse(updated);
  }

  async updateHrEmployeeRole(
    id: string,
    input: any,
    user: AuthenticatedRequestUser,
  ) {
    this.assertHrWorkspace(user);
    requireOperationPermission(user, [
      'hr.employees.permissions.manage',
      'hr.manage',
      'users.manage_own_org',
    ]);
    const employee = await this.findEmployeeForMutation(id, user);
    if (employee.userId === user.userId) {
      throw new ForbiddenException('You cannot change your own role.');
    }
    if (!employee.userId) {
      throw new BadRequestException('Employee is not linked to a login user.');
    }
    const roleName = this.employeeRoleName(input.role);
    this.assertEmployeeRoleAssignable(roleName, user);
    const role = await this.ensureEmployeeRole(
      this.prisma,
      employee.organizationId,
      roleName,
    );
    await this.prisma.user.update({
      where: { id: employee.userId },
      data: {
        roleId: role.id,
        userRole: this.userRoleForEmployeeRole(roleName),
      },
    });
    await this.recordActivity(
      user,
      OperationsModule.HR,
      'HrEmployee',
      employee.id,
      'ROLE_CHANGED',
      'HR employee role changed',
      employee.name,
      { role: roleName },
      employee.organizationId,
    );
    await this.recordAudit(user, 'employee.role_changed', 'HrEmployee', employee.id, {
      role: roleName,
    });
    return this.getHrEmployee(id, user);
  }

  async updateHrEmployeePermissions(
    id: string,
    input: any,
    user: AuthenticatedRequestUser,
  ) {
    this.assertHrWorkspace(user);
    requireOperationPermission(user, [
      'hr.employees.permissions.manage',
      'hr.manage',
      'users.manage_own_org',
    ]);
    const employee = await this.findEmployeeForMutation(id, user);
    if (employee.userId === user.userId) {
      throw new ForbiddenException('You cannot change your own permissions.');
    }
    if (!employee.userId) {
      throw new BadRequestException('Employee is not linked to a login user.');
    }
    const permissions = this.permissionKeys(input.permissions);
    await this.assertAssignableEmployeePermissions(permissions, user);
    const role = await this.createCustomEmployeeRole(
      this.prisma,
      employee.organizationId,
      employee.id,
      permissions,
    );
    await this.prisma.user.update({
      where: { id: employee.userId },
      data: { roleId: role.id },
    });
    await this.recordActivity(
      user,
      OperationsModule.HR,
      'HrEmployee',
      employee.id,
      'PERMISSIONS_CHANGED',
      'HR employee permissions changed',
      employee.name,
      { permissions },
      employee.organizationId,
    );
    await this.recordAudit(
      user,
      'employee.permissions_changed',
      'HrEmployee',
      employee.id,
      { permissions },
    );
    return this.getHrEmployee(id, user);
  }

  async listHrAttendance(user: AuthenticatedRequestUser, input: Record<string, unknown> = {}) {
    this.assertHrWorkspace(user);
    requireOperationPermission(user, ['hr.view', 'hr.attendance.manage']);
    const organizationId = this.resolveScopedOrganizationId(input, user);
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { timezone: true },
    });
    const timezone = this.organizationTimezone(organization?.timezone);
    const date = this.attendanceListDate(input.date, timezone);
    const { start, end } = this.attendanceDayBounds(date, timezone);
    const records = await this.prisma.hrAttendanceRecord.findMany({
      where: {
        ...operationOrganizationWhere(user),
        // A work record belongs to its check-in's organization-local day. An
        // overnight shift therefore appears once—on its work/check-in day—not
        // again when it checks out the following day. Manual rows without a
        // check-in retain their existing work-date behavior.
        OR: [
          { checkInAt: { gte: start, lt: end } },
          { checkInAt: null, date: { gte: start, lt: end } },
        ],
      },
      include: { employee: true, branch: true },
      orderBy: { date: 'desc' },
    });
    const [year, month] = date.split('-').map(Number);
    const monthStartDate = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-01`;
    const monthStart = this.attendanceDayBounds(monthStartDate, timezone).start;
    const [policy, lateRecords] = await Promise.all([
      this.attendancePolicy(organizationId),
      this.prisma.hrAttendanceRecord.findMany({
        where: {
          organizationId,
          date: { gte: monthStart, lt: end },
          minutesLate: { gt: 0 },
        },
        select: { employeeId: true, date: true },
      }),
    ]);
    const lateDaysByEmployee = new Map<string, Set<string>>();
    for (const lateRecord of lateRecords) {
      const days = lateDaysByEmployee.get(lateRecord.employeeId) ?? new Set<string>();
      days.add(this.dateOnly(lateRecord.date));
      lateDaysByEmployee.set(lateRecord.employeeId, days);
    }
    const allowanceMinutes = Math.max(0, Number(policy.monthlyLateAllowanceHours ?? 4)) * 60;
    const chargeMinutes = Math.max(1, Number(policy.lateAllowanceChargeHoursPerDay ?? 1)) * 60;
    return records.map((record) => {
      const lateDays = lateDaysByEmployee.get(record.employeeId)?.size ?? 0;
      const usedMinutes = Math.min(allowanceMinutes, lateDays * chargeMinutes);
      const chargedToday = Number(record.minutesLate ?? 0) > 0
        ? Math.min(chargeMinutes, Math.max(0, allowanceMinutes - Math.max(0, lateDays - 1) * chargeMinutes))
        : 0;
      return {
        ...record,
        lateAllowanceChargedMinutes: chargedToday,
        lateAllowanceUsedMinutes: usedMinutes,
        lateAllowanceRemainingMinutes: Math.max(0, allowanceMinutes - usedMinutes),
      };
    });
  }

  async createHrAttendance(input: any, user: AuthenticatedRequestUser) {
    this.assertHrWorkspace(user);
    requireOperationPermission(user, ['hr.attendance.manage']);
    const record = await this.prisma.hrAttendanceRecord.create({
      data: {
        organizationId: requireOperationOrganizationId(user),
        employeeId: this.required(input.employeeId, 'employeeId'),
        date: input.date ? new Date(String(input.date)) : new Date(),
        checkInAt: input.checkInAt
          ? new Date(String(input.checkInAt))
          : undefined,
        checkOutAt: input.checkOutAt
          ? new Date(String(input.checkOutAt))
          : undefined,
        actualCheckInAt: input.checkInAt
          ? new Date(String(input.checkInAt))
          : undefined,
        actualCheckOutAt: input.checkOutAt
          ? new Date(String(input.checkOutAt))
          : undefined,
        checkOutMethod: input.checkOutAt
          ? CheckOutMethod.ADMIN_MANUAL
          : undefined,
        checkOutVerificationStatus: input.checkOutAt
          ? CheckOutVerificationStatus.NOT_VERIFIED
          : undefined,
        status: this.enumValue(
          HrAttendanceStatus,
          input.status,
          HrAttendanceStatus.PRESENT,
        ),
        note: this.optional(input.note),
        attendanceSource: AttendanceSource.MANUAL_ADMIN,
        entryChannel: AttendanceEntryChannel.MANUAL_ADMIN,
        verificationStatus: this.enumValue(
          AttendanceVerificationStatus,
          input.verificationStatus,
          AttendanceVerificationStatus.PENDING_REVIEW,
        ),
        verificationFailureReasons: this.optionalJsonArray(
          input.verificationFailureReasons,
        ),
        dvrVerificationStatus: this.enumValue(
          DvrVerificationStatus,
          input.dvrVerificationStatus,
          DvrVerificationStatus.NOT_REQUIRED,
        ),
        dvrReferenceId: this.optional(input.dvrReferenceId),
      },
      include: { employee: true },
    }).catch((error: unknown) => {
      if ((error as { code?: string })?.code === 'P2002') {
        throw new ConflictException('You are already checked in.');
      }
      throw error;
    });
    await this.recordActivity(
      user,
      OperationsModule.HR,
      'HrAttendanceRecord',
      record.id,
      'CREATED',
      'HR attendance recorded',
      record.status,
    );
    return record;
  }

  async updateHrAttendance(
    id: string,
    input: any,
    user: AuthenticatedRequestUser,
  ) {
    this.assertHrWorkspace(user);
    requireOperationPermission(user, ['hr.attendance.manage']);
    await this.assertExists('hrAttendanceRecord', id, user);
    const record = await this.prisma.hrAttendanceRecord.update({
      where: { id },
      data: {
        date: input.date ? new Date(String(input.date)) : undefined,
        checkInAt: input.checkInAt
          ? new Date(String(input.checkInAt))
          : undefined,
        checkOutAt: input.checkOutAt
          ? new Date(String(input.checkOutAt))
          : undefined,
        actualCheckInAt: input.checkInAt
          ? new Date(String(input.checkInAt))
          : undefined,
        actualCheckOutAt: input.checkOutAt
          ? new Date(String(input.checkOutAt))
          : undefined,
        checkOutMethod: input.checkOutAt
          ? CheckOutMethod.ADMIN_MANUAL
          : undefined,
        checkOutVerificationStatus: input.checkOutAt
          ? CheckOutVerificationStatus.NOT_VERIFIED
          : undefined,
        status: input.status,
        note: input.note,
        verificationStatus: input.verificationStatus,
        verificationFailureReasons: this.optionalJsonArray(
          input.verificationFailureReasons,
        ),
        dvrVerificationStatus: input.dvrVerificationStatus,
        dvrReferenceId: input.dvrReferenceId,
      },
      include: { employee: true },
    });
    await this.recordActivity(
      user,
      OperationsModule.HR,
      'HrAttendanceRecord',
      record.id,
      'UPDATED',
      'HR attendance updated',
      record.status,
    );
    return record;
  }

  getHrAttendance(id: string, user: AuthenticatedRequestUser) {
    this.assertHrWorkspace(user);
    requireOperationPermission(user, ['hr.view', 'hr.attendance.manage']);
    return this.prisma.hrAttendanceRecord
      .findFirstOrThrow({
        where: { id, ...operationOrganizationWhere(user) },
        include: { employee: true },
      })
      .catch(() => {
        throw new NotFoundException('Record not found.');
      });
  }

  async checkInHrAttendance(input: any, user: AuthenticatedRequestUser) {
    const employee = await this.resolveCurrentEmployee(user);
    const policy = await this.attendancePolicy(employee.organizationId);
    const now = new Date();
    // The partial unique index protects integrity, but this synchronous
    // fallback prevents a delayed worker from blocking the employee's next
    // check-in. The conditional update used by the helper is idempotent.
    await this.autoCloseDueOpenRecordForEmployee(employee, policy, now);
    const verification = await this.evaluateAttendanceVerification(
      input,
      policy,
      'checkIn',
      user,
    );
    if (verification.reject) {
      const attempt = await this.recordRejectedAttendanceAttempt(employee, input, verification, 'CHECK_IN');
      throw new BadRequestException({
        success: false,
        code: 'ATTENDANCE_CHECK_IN_REJECTED',
        reasons: verification.reasons,
        attemptId: attempt.id,
        attendanceRecordId: null,
      });
    }
    const photoFileId = this.optional(input.photoFileId ?? input.checkInPhotoFileId);
    const face = await this.prepareAttendanceFaceVerification(employee, photoFileId, policy);
    const timezone = await this.organizationTimezoneFor(employee.organizationId);
    const date = this.zonedWorkDate(now, timezone);
    const openRecord = await this.prisma.hrAttendanceRecord.findFirst({
      where: {
        organizationId: employee.organizationId,
        employeeId: employee.id,
        checkInAt: { not: null },
        checkOutAt: null,
        verificationStatus: {
          notIn: [
            AttendanceVerificationStatus.REJECTED,
            AttendanceVerificationStatus.FAILED,
          ],
        },
      },
      include: { employee: true },
    });

    if (openRecord) {
      throw new ConflictException({
        code: 'ATTENDANCE_ALREADY_CHECKED_IN',
        nextAction: 'CHECK_OUT',
        attendanceRecordId: openRecord.id,
      });
    }

    const schedule = await this.resolveEffectiveAttendanceSchedule({ organizationId: employee.organizationId, employeeId: employee.id, attendanceDate: date, timezone }, employee, policy);
    const late = this.calculateScheduleLatePenalty(now, schedule, policy);
    const record = await this.prisma.hrAttendanceRecord.create({
      data: {
        organizationId: employee.organizationId,
        employeeId: employee.id,
        date,
        checkInAt: now,
        actualCheckInAt: now,
        autoClosed: false,
        status: late.attendanceStatus,
        note: this.optional(input.note),
        attendanceSource: AttendanceSource.SELF_SERVICE,
        entryChannel:
          this.optional(input.clientPlatform)?.toUpperCase() === 'MOBILE'
            ? AttendanceEntryChannel.MOBILE_APP
            : AttendanceEntryChannel.WEB,
        branchId: this.optional(input.branchId),
        ...this.attendanceEvidenceData(input, 'checkIn'),
        verificationStatus: verification.status,
        verificationFailureReasons: verification.reasons.length
          ? verification.reasons
          : undefined,
        dvrVerificationStatus: verification.dvrStatus,
        dvrReferenceId: this.optional(input.dvrReferenceId),
        referenceImageId: face.referenceImageId,
        capturedImageId: photoFileId,
        faceVerificationProvider: face.provider,
        faceVerificationStatus: face.status,
        minutesLate: late.minutesLate,
        lateLevel: late.lateLevel,
        penaltyType: late.penaltyType,
        penaltyValue: late.penaltyValue,
        requiresReview:
          late.requiresReview ||
          verification.status === AttendanceVerificationStatus.PENDING_REVIEW,
        scheduleSource: schedule.source,
        scheduleId: schedule.scheduleId,
        scheduleTimezone: schedule.timezone,
        overnightShift: schedule.overnightShift,
        plannedCheckInAt: schedule.plannedCheckIn,
        plannedCheckOutAt: schedule.plannedCheckOut,
        graceMinutes: schedule.graceMinutes,
        expectedWorkMinutes: schedule.expectedWorkMinutes,
        lateUntilAt: schedule.lateUntilAt,
        severeLateUntilAt: schedule.severeLateUntilAt,
        absentAfterAt: schedule.absentAfterAt,
        attendanceStatusAtCheckIn: late.attendanceStatus,
      },
      include: { employee: true },
    });

    await this.recordActivity(
      user,
      OperationsModule.HR,
      'HrAttendanceRecord',
      record.id,
      'SELF_CHECK_IN',
      'Employee checked in',
      employee.name,
      this.attendanceMetadata(input, verification),
    );
    if (face.createReferenceCandidate && photoFileId && this.prisma.employeeAttendanceReferencePhoto) {
      await this.prisma.employeeAttendanceReferencePhoto.create({
        data: {
          organizationId: employee.organizationId,
          employeeId: employee.id,
          fileId: photoFileId,
          sourceAttendanceId: record.id,
          status: policy.firstAttendancePhotoRequiresApproval
            ? AttendanceReferencePhotoStatus.PENDING_REFERENCE_APPROVAL
            : AttendanceReferencePhotoStatus.APPROVED_REFERENCE,
          approvedById: policy.firstAttendancePhotoRequiresApproval ? undefined : user.userId,
          approvedAt: policy.firstAttendancePhotoRequiresApproval ? undefined : new Date(),
        },
      });
      if (!policy.firstAttendancePhotoRequiresApproval) {
        await this.prisma.hrEmployee.update({ where: { id: employee.id }, data: { faceReferenceFileId: photoFileId } });
      }
    }
    return this.selfAttendanceEnvelope(record);
  }

  /** Read-only location gate used before the mobile client opens its camera. */
  async preflightHrAttendanceCheckIn(input: any, user: AuthenticatedRequestUser) {
    return this.preflightSelfAttendance(input, user, 'checkIn');
  }

  /** Check-out has an independent outside-location policy and therefore must
   * not reuse a check-in preflight result. */
  async preflightHrAttendanceCheckOut(input: any, user: AuthenticatedRequestUser) {
    return this.preflightSelfAttendance(input, user, 'checkOut');
  }

  private async preflightSelfAttendance(
    input: any,
    user: AuthenticatedRequestUser,
    phase: 'checkIn' | 'checkOut',
  ) {
    const employee = await this.resolveCurrentEmployee(user);
    const policy = await this.attendancePolicy(employee.organizationId);
    const decision = await this.attendanceLocationDecision(input, policy, employee.organizationId, phase);
    const isWeb = this.optional(input.clientPlatform)?.toUpperCase() === 'WEB' || !this.optional(input.clientPlatform);
    const blockingReasons = [...decision.blockingReasons];
    if (isWeb && policy.allowWebCheckIn === false) {
      blockingReasons.push('WEB_CHECK_IN_NOT_ALLOWED');
    }
    if (isWeb && policy.requireWifi) {
      if (policy.webWifiPolicy === WebWifiPolicy.BLOCK) {
        blockingReasons.push('WEB_WIFI_NOT_AVAILABLE');
      } else if (policy.webWifiPolicy === WebWifiPolicy.MANUAL_REVIEW) {
        blockingReasons.push('WEB_WIFI_MANUAL_REVIEW');
      }
    }
    const reasons = [...new Set(blockingReasons)];
    if (phase === 'checkOut' && decision.mode !== 'EXACT' && decision.mode !== 'LOCATION_NOT_REQUIRED') {
      const outsidePolicy = policy.checkOutOutsideLocationPolicy ?? CheckOutOutsideLocationPolicy.BLOCK;
      if (outsidePolicy === CheckOutOutsideLocationPolicy.BLOCK) {
        blockingReasons.push('OUTSIDE_ALLOWED_LOCATION');
      } else if (outsidePolicy === CheckOutOutsideLocationPolicy.MANUAL_REVIEW) {
        blockingReasons.push('CHECK_OUT_OUTSIDE_LOCATION_REVIEW');
      } else {
        blockingReasons.push('CHECK_OUT_OUTSIDE_LOCATION_EVIDENCE');
      }
    }
    const reviewReasons = new Set([
      'EXPANDED_LOCATION_REVIEW',
      'WEB_WIFI_MANUAL_REVIEW',
      'CHECK_OUT_OUTSIDE_LOCATION_REVIEW',
      'CHECK_OUT_OUTSIDE_LOCATION_EVIDENCE',
    ]);
    return {
      // A review-only outcome can proceed to the live-photo step; the final
      // check-in remains PENDING_REVIEW and re-runs every verification.
      allowed: reasons.every((reason) => reviewReasons.has(reason)),
      insideAllowedRadius: decision.mode === 'EXACT' || decision.mode === 'EXPANDED_REVIEW',
      distanceMeters: decision.distanceMeters,
      allowedRadiusMeters: decision.allowedRadiusMeters,
      exactRadiusMeters: decision.exactRadiusMeters,
      expandedRadiusMeters: decision.expandedRadiusMeters,
      matchedLocationId: decision.matchedLocationId,
      matchedLocationName: decision.matchedLocationName,
      source: decision.source,
      accuracyMeters: this.optionalNumber(input.locationAccuracyMeters ?? input.accuracyMeters) ?? null,
      accuracyAccepted: !reasons.includes('GPS_ACCURACY_TOO_LOW'),
      mode: decision.mode,
      blockingReasons: reasons,
      requiresPhoto:
        Boolean(policy.requirePhoto) ||
        (phase === 'checkOut' &&
          decision.mode !== 'EXACT' &&
          decision.mode !== 'LOCATION_NOT_REQUIRED' &&
          policy.checkOutOutsideLocationPolicy ===
            CheckOutOutsideLocationPolicy.ALLOW_WITH_EVIDENCE),
      requiresWifi: Boolean(policy.requireWifi),
      requiresDeviceIntegrity: Boolean(policy.blockDeveloperOptions || policy.blockUsbDebugging),
      requiresDvrReview: Boolean(policy.requireDvrReview),
    };
  }

  async listEmployeeAttendanceReferences(employeeId: string, user: AuthenticatedRequestUser) {
    this.assertHrWorkspace(user);
    requireOperationPermission(user, ['hr.attendance.review', 'hr.attendance.manage']);
    await this.findEmployeeForMutation(employeeId, user);
    return this.prisma.employeeAttendanceReferencePhoto.findMany({
      where: { employeeId, ...operationOrganizationWhere(user) }, orderBy: { createdAt: 'desc' },
    });
  }

  async reviewAttendanceReference(id: string, input: any, user: AuthenticatedRequestUser) {
    this.assertHrWorkspace(user);
    requireOperationPermission(user, ['hr.attendance.review', 'hr.attendance.manage']);
    const reference = await this.prisma.employeeAttendanceReferencePhoto.findFirstOrThrow({ where: { id, ...operationOrganizationWhere(user) } }).catch(() => { throw new NotFoundException('Reference photo not found.'); });
    const approve = input.approve === true;
    let updated: any;
    try {
      updated = await this.prisma.$transaction(async (tx) => {
        if (approve) {
          await tx.employeeAttendanceReferencePhoto.updateMany({ where: { employeeId: reference.employeeId, status: AttendanceReferencePhotoStatus.APPROVED_REFERENCE }, data: { status: AttendanceReferencePhotoStatus.REVOKED, revokedById: user.userId, revokedAt: new Date() } });
        }
        const next = await tx.employeeAttendanceReferencePhoto.update({ where: { id }, data: approve ? { status: AttendanceReferencePhotoStatus.APPROVED_REFERENCE, approvedById: user.userId, approvedAt: new Date(), rejectionReason: null } : { status: AttendanceReferencePhotoStatus.REJECTED, rejectionReason: this.optional(input.rejectionReason) ?? 'REJECTED_BY_REVIEWER' } });
        if (approve) await tx.hrEmployee.update({ where: { id: reference.employeeId }, data: { faceReferenceFileId: reference.fileId } });
        return next;
      });
    } catch (error) {
      if ((error as { code?: string })?.code === 'P2002') {
        throw new ConflictException('Another reference photo was approved concurrently. Refresh and try again.');
      }
      throw error;
    }
    await this.recordAudit(user, approve ? 'attendance.reference_approved' : 'attendance.reference_rejected', 'EmployeeAttendanceReferencePhoto', id, { employeeId: reference.employeeId });
    return updated;
  }

  async reviewAttendanceFaceVerification(id: string, input: any, user: AuthenticatedRequestUser) {
    this.assertHrWorkspace(user);
    requireOperationPermission(user, ['hr.attendance.review', 'hr.attendance.manage']);
    await this.assertExists('hrAttendanceRecord', id, user);
    const approved = input.approve === true;
    const record = await this.prisma.hrAttendanceRecord.update({ where: { id }, data: { faceVerificationStatus: approved ? AttendanceFaceVerificationStatus.APPROVED_MANUALLY : AttendanceFaceVerificationStatus.REJECTED, faceVerificationReviewedById: user.userId, faceVerificationReviewedAt: new Date(), faceVerificationRejectionReason: approved ? null : this.optional(input.rejectionReason) ?? 'REJECTED_BY_REVIEWER', requiresReview: !approved } });
    await this.recordAudit(user, approved ? 'attendance.face_approved_manually' : 'attendance.face_rejected', 'HrAttendanceRecord', id);
    return record;
  }

  async checkOutHrAttendance(input: any, user: AuthenticatedRequestUser) {
    const employee = await this.resolveCurrentEmployee(user);
    const policy = await this.attendancePolicy(employee.organizationId);
    const attendanceRecordId = this.optional(input.attendanceRecordId);
    let record = await this.prisma.hrAttendanceRecord.findFirst({
      where: {
        organizationId: employee.organizationId,
        employeeId: employee.id,
        ...(attendanceRecordId ? { id: attendanceRecordId } : {}),
        checkInAt: { not: null },
        checkOutAt: null,
        verificationStatus: {
          notIn: [
            AttendanceVerificationStatus.REJECTED,
            AttendanceVerificationStatus.FAILED,
          ],
        },
      },
      include: { employee: true },
      orderBy: { checkInAt: 'desc' },
    });

    // Retried final requests are harmless.  The original closed record is
    // returned rather than overwriting its checkout evidence.
    if (!record && attendanceRecordId) {
      const completed = await this.prisma.hrAttendanceRecord.findFirst({
        where: {
          id: attendanceRecordId,
          organizationId: employee.organizationId,
          employeeId: employee.id,
          checkOutAt: { not: null },
        },
        include: { employee: true },
      });
      if (completed) return this.selfAttendanceEnvelope(completed);
    }
    if (!record) {
      throw new ConflictException({
        code: 'ATTENDANCE_CHECK_OUT_NOT_OPEN',
        nextAction: 'CHECK_IN',
      });
    }

    const verification = await this.evaluateAttendanceVerification(
      input,
      policy,
      'checkOut',
      user,
    );
    if (verification.reject) {
      const attempt = await this.recordRejectedAttendanceAttempt(
        employee,
        input,
        verification,
        'CHECK_OUT',
        record.id,
      );
      throw new BadRequestException({
        success: false,
        code: 'ATTENDANCE_CHECK_OUT_REJECTED',
        reasons: verification.reasons,
        attemptId: attempt.id,
      });
    }

    const checkedOutAt = new Date();
    const earlyLeave = record.plannedCheckOutAt
      ? Math.max(0, Math.round((new Date(record.plannedCheckOutAt).getTime() - checkedOutAt.getTime()) / 60000))
      : 0;
    const calculatedWorkMinutes = this.durationMinutes(
      record.actualCheckInAt ?? record.checkInAt,
      checkedOutAt,
    );
    const reviewReason = verification.reasons.length
      ? verification.reasons.join(',').slice(0, 1000)
      : null;
    const update = await this.prisma.hrAttendanceRecord.updateMany({
      where: { id: record.id, checkOutAt: null },
      data: {
        checkOutAt: checkedOutAt,
        actualCheckOutAt: checkedOutAt,
        calculatedWorkMinutes,
        checkOutMethod: CheckOutMethod.SELF_SERVICE,
        checkOutVerificationStatus:
          verification.status === AttendanceVerificationStatus.VERIFIED
            ? CheckOutVerificationStatus.VERIFIED
            : CheckOutVerificationStatus.PENDING_REVIEW,
        autoClosed: false,
        requiresManualReview:
          verification.status === AttendanceVerificationStatus.PENDING_REVIEW,
        reviewReason,
        status: earlyLeave > Number(record.graceMinutes ?? 0) && record.status === HrAttendanceStatus.PRESENT ? HrAttendanceStatus.EARLY_LEAVE : record.status,
        note: this.mergeNote(record.note, input.note),
        ...this.attendanceEvidenceData(input, 'checkOut'),
        verificationStatus: this.mergeVerificationStatus(
          record.verificationStatus,
          verification.status,
        ),
        verificationFailureReasons: this.mergeFailureReasons(
          record.verificationFailureReasons,
          verification.reasons,
        ),
        dvrVerificationStatus: this.mergeDvrStatus(
          record.dvrVerificationStatus,
          verification.dvrStatus,
        ),
        dvrReferenceId:
          this.optional(input.dvrReferenceId) ?? record.dvrReferenceId,
      },
    });
    if (!update.count) {
      const completed = await this.prisma.hrAttendanceRecord.findFirst({
        where: {
          id: record.id,
          organizationId: employee.organizationId,
          employeeId: employee.id,
          checkOutAt: { not: null },
        },
        include: { employee: true },
      });
      if (completed) return this.selfAttendanceEnvelope(completed);
      throw new ConflictException({ code: 'ATTENDANCE_CHECK_OUT_NOT_OPEN', nextAction: 'CHECK_IN' });
    }
    const updated = await this.prisma.hrAttendanceRecord.findUniqueOrThrow({
      where: { id: record.id },
      include: { employee: true },
    });

    await this.recordActivity(
      user,
      OperationsModule.HR,
      'HrAttendanceRecord',
      updated.id,
      'SELF_CHECK_OUT',
      'Employee checked out',
      employee.name,
      this.attendanceMetadata(input, verification),
    );
    return this.selfAttendanceEnvelope(updated);
  }

  async myAttendanceToday(user: AuthenticatedRequestUser) {
    const employee = await this.resolveCurrentEmployee(user);
    const timezone = await this.organizationTimezoneFor(employee.organizationId);
    const localDate = this.organizationLocalDate(new Date(), timezone);
    const { start, end } = this.attendanceDayBounds(localDate, timezone);
    const date = this.zonedWorkDate(new Date(), timezone);
    const record = await this.prisma.hrAttendanceRecord.findFirst({
      where: {
        organizationId: employee.organizationId,
        employeeId: employee.id,
        verificationStatus: { notIn: [AttendanceVerificationStatus.REJECTED, AttendanceVerificationStatus.FAILED] },
        OR: [
          { checkInAt: { gte: start, lt: end } },
          { checkInAt: null, date: { gte: start, lt: end } },
          { checkInAt: { not: null }, checkOutAt: null },
        ],
      },
      include: { employee: true },
      orderBy: [{ checkInAt: 'desc' }, { date: 'desc' }],
    });

    return this.selfAttendanceEnvelope(record, employee, date);
  }

  /**
   * Safe policy projection for self-service attendance. This deliberately does
   * not reuse the administrative settings endpoint or disclose Wi-Fi lists.
   */
  async myAttendancePolicy(user: AuthenticatedRequestUser) {
    const employee = await this.resolveCurrentEmployee(user);
    const policy = await this.attendancePolicy(employee.organizationId);
    const blockingReasons: string[] = [];
    if (policy.allowWebCheckIn === false) {
      blockingReasons.push('WEB_CHECK_IN_NOT_ALLOWED');
    }
    if (policy.requireWifi && policy.webWifiPolicy === WebWifiPolicy.BLOCK) {
      blockingReasons.push('WEB_WIFI_NOT_AVAILABLE');
    }

    return {
      allowWebCheckIn: policy.allowWebCheckIn !== false,
      allowMobileCheckIn: policy.allowMobileCheckIn !== false,
      requireLocation: Boolean(policy.requireLocation),
      requirePhoto: Boolean(policy.requirePhoto),
      requireWifi: Boolean(policy.requireWifi),
      webWifiPolicy: policy.webWifiPolicy,
      locationAccuracyThresholdMeters: policy.maxGpsAccuracyMeters ?? null,
      // Kept in sync with locationDecision's stale-location guard.
      locationFreshnessSeconds: 10 * 60,
      canCheckIn: blockingReasons.length === 0,
      blockingReasons,
    };
  }

  async myAttendanceHistory(user: AuthenticatedRequestUser) {
    const employee = await this.resolveCurrentEmployee(user);
    const records = await this.prisma.hrAttendanceRecord.findMany({
      where: {
        organizationId: employee.organizationId,
        employeeId: employee.id,
      },
      include: { employee: true },
      orderBy: { date: 'desc' },
      take: 60,
    });
    return records.map((record) =>
      this.selfAttendanceEnvelope(record, employee),
    );
  }

  /** The browser may choose only configured, active web attendance locations.
   * Organization branches alone are not attendance evidence. */
  async myWebAttendanceLocations(user: AuthenticatedRequestUser) {
    const employee = await this.resolveCurrentEmployee(user);
    const locations = await this.prisma.organizationAttendanceLocation.findMany({
      where: {
        organizationId: employee.organizationId,
        isActive: true,
        allowedForWeb: true,
        officeId: { not: null },
        office: { is: { organizationId: employee.organizationId, isActive: true } },
      },
      include: {
        office: {
          select: { id: true, name: true, isActive: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return locations
      .filter((location) => location.office?.isActive)
      .map((location) => ({
        id: location.id,
        organizationId: location.organizationId,
        branchId: location.officeId!,
        branchName: location.office!.name,
        name: location.name,
        latitude: location.latitude,
        longitude: location.longitude,
        radiusMeters: location.exactRadiusMeters,
        exactRadiusMeters: location.exactRadiusMeters,
        expandedRadiusMeters: location.expandedRadiusMeters,
        isActive: location.isActive,
        allowedForWeb: location.allowedForWeb,
      }));
  }

  async uploadAttendanceEvidencePhoto(
    file: any,
    purpose: unknown,
    user: AuthenticatedRequestUser,
  ) {
    await this.resolveCurrentEmployee(user);
    if (!this.filesService)
      throw new BadRequestException('File storage service is not available.');
    return this.filesService.uploadAttendanceEvidencePhoto(file, purpose, user);
  }

  listAccountingCategories(user: AuthenticatedRequestUser) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['accounting.view', 'accounting.manage']);
    return this.prisma.accountingCategory.findMany({
      where: operationOrganizationWhere(user),
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAccountingCategory(input: any, user: AuthenticatedRequestUser) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['accounting.manage']);
    const record = await this.prisma.accountingCategory.create({
      data: {
        organizationId: requireOperationOrganizationId(user),
        name: this.required(input.name, 'name'),
        type: input.type,
        isActive: input.isActive === undefined ? true : Boolean(input.isActive),
      },
    });
    await this.recordActivity(
      user,
      OperationsModule.ACCOUNTING,
      'AccountingCategory',
      record.id,
      'CREATED',
      'Accounting category created',
      record.name,
      { type: record.type },
    );
    return record;
  }

  async updateAccountingCategory(
    id: string,
    input: any,
    user: AuthenticatedRequestUser,
  ) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['accounting.manage']);
    await this.assertExists('accountingCategory', id, user);
    const record = await this.prisma.accountingCategory.update({
      where: { id },
      data: {
        name: input.name,
        type: input.type,
        isActive: input.isActive,
      },
    });
    await this.recordActivity(
      user,
      OperationsModule.ACCOUNTING,
      'AccountingCategory',
      record.id,
      'UPDATED',
      'Accounting category updated',
      record.name,
      { type: record.type },
    );
    return record;
  }

  getAccountingCategory(id: string, user: AuthenticatedRequestUser) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['accounting.view', 'accounting.manage']);
    return this.findScoped('accountingCategory', id, user);
  }

  listAccountingTransactions(user: AuthenticatedRequestUser) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['accounting.view', 'accounting.manage']);
    return this.prisma.accountingTransaction.findMany({
      where: operationOrganizationWhere(user),
      include: {
        category: true,
        createdBy: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
      orderBy: { occurredAt: 'desc' },
    });
  }

  async createAccountingTransaction(
    input: any,
    user: AuthenticatedRequestUser,
  ) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['accounting.manage']);
    const record = await this.prisma.accountingTransaction.create({
      data: {
        organizationId: requireOperationOrganizationId(user),
        type: this.enumValue(
          AccountingTransactionType,
          input.type,
          AccountingTransactionType.EXPENSE,
        ),
        amount: new Prisma.Decimal(Number(input.amount ?? 0)),
        currency: this.optional(input.currency) ?? 'EGP',
        categoryId: this.optional(input.categoryId),
        description: this.optional(input.description),
        occurredAt: input.occurredAt
          ? new Date(String(input.occurredAt))
          : new Date(),
        status: this.enumValue(
          AccountingTransactionStatus,
          input.status,
          AccountingTransactionStatus.DRAFT,
        ),
        createdByUserId: user.userId,
      },
      include: { category: true },
    });
    await this.recordActivity(
      user,
      OperationsModule.ACCOUNTING,
      'AccountingTransaction',
      record.id,
      'CREATED',
      'Accounting transaction created',
      record.type,
      { amount: String(record.amount), currency: record.currency },
    );
    return record;
  }

  async updateAccountingTransaction(
    id: string,
    input: any,
    user: AuthenticatedRequestUser,
  ) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['accounting.manage']);
    await this.assertExists('accountingTransaction', id, user);
    const record = await this.prisma.accountingTransaction.update({
      where: { id },
      data: {
        type: input.type,
        amount:
          input.amount === undefined
            ? undefined
            : new Prisma.Decimal(Number(input.amount)),
        currency: input.currency,
        categoryId: input.categoryId,
        description: input.description,
        occurredAt: input.occurredAt
          ? new Date(String(input.occurredAt))
          : undefined,
        status: input.status,
      },
      include: { category: true },
    });
    await this.recordActivity(
      user,
      OperationsModule.ACCOUNTING,
      'AccountingTransaction',
      record.id,
      'UPDATED',
      'Accounting transaction updated',
      record.type,
      { amount: String(record.amount), currency: record.currency },
    );
    return record;
  }

  async approveAccountingTransaction(
    id: string,
    input: any,
    user: AuthenticatedRequestUser,
  ) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['accounting.manage']);
    await this.assertExists('accountingTransaction', id, user);
    const record = await this.prisma.accountingTransaction.update({
      where: { id },
      data: {
        status: AccountingTransactionStatus.APPROVED,
        approvedByUserId: user.userId,
        approvedAt: new Date(),
        approvalNote: this.optionalLong(
          input.reviewNote ?? input.approvalNote ?? input.note,
        ),
      },
      include: { category: true },
    });
    await this.recordActivity(
      user,
      OperationsModule.ACCOUNTING,
      'AccountingTransaction',
      record.id,
      'APPROVED',
      'Accounting transaction approved',
      record.type,
      { amount: String(record.amount), currency: record.currency },
    );
    return record;
  }

  async rejectAccountingTransaction(
    id: string,
    input: any,
    user: AuthenticatedRequestUser,
  ) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['accounting.manage']);
    await this.assertExists('accountingTransaction', id, user);
    const record = await this.prisma.accountingTransaction.update({
      where: { id },
      data: {
        status: AccountingTransactionStatus.REJECTED,
        approvedByUserId: user.userId,
        approvedAt: new Date(),
        approvalNote: this.optionalLong(
          input.reviewNote ?? input.approvalNote ?? input.note,
        ),
      },
      include: { category: true },
    });
    await this.recordActivity(
      user,
      OperationsModule.ACCOUNTING,
      'AccountingTransaction',
      record.id,
      'REJECTED',
      'Accounting transaction rejected',
      record.type,
      { amount: String(record.amount), currency: record.currency },
    );
    return record;
  }

  getAccountingTransaction(id: string, user: AuthenticatedRequestUser) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['accounting.view', 'accounting.manage']);
    return this.prisma.accountingTransaction
      .findFirstOrThrow({
        where: { id, ...operationOrganizationWhere(user) },
        include: { category: true },
      })
      .catch(() => {
        throw new NotFoundException('Record not found.');
      });
  }

  async accountingSummary(user: AuthenticatedRequestUser) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['accounting.view', 'accounting.manage']);
    const where = operationOrganizationWhere(user);
    const rows = await this.prisma.accountingTransaction.findMany({ where });
    return rows.reduce(
      (summary, row) => {
        const amount = Number(row.amount);
        if (row.type === AccountingTransactionType.INCOME)
          summary.income += amount;
        if (row.type === AccountingTransactionType.EXPENSE)
          summary.expense += amount;
        summary.net = summary.income - summary.expense;
        return summary;
      },
      { income: 0, expense: 0, net: 0, count: rows.length },
    );
  }

  async operationsSummary(user: AuthenticatedRequestUser) {
    this.assertDeveloper(user);
    const where = operationOrganizationWhere(user);
    const [hr, accounting, legal, ads, cameras] = await Promise.all([
      this.hrSummary(user),
      this.accountingSummary(user),
      this.legalSummary(user),
      this.adsSummary(user),
      this.camerasSummary(user),
    ]);
    const recentActivities = await this.prisma.operationsActivity.count({
      where,
    });
    return { hr, accounting, legal, ads, cameras, recentActivities };
  }

  async operationsReportOverview(input: any, user: AuthenticatedRequestUser) {
    this.assertDeveloper(user);
    const where = operationOrganizationWhere(user);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const recentSince = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [
      totalEmployees,
      activeEmployees,
      attendanceToday,
      accountingRows,
      legalOpenCases,
      legalDocumentsByStatus,
      adsByProvider,
      adsByStatus,
      cameraActive,
      cameraInactive,
      cameraAiEnabled,
      recentActivityCount,
    ] = await Promise.all([
      this.withOptionalReportPermission(user, ['hr.view', 'hr.manage'], 0, () =>
        this.prisma.hrEmployee.count({ where }),
      ),
      this.withOptionalReportPermission(user, ['hr.view', 'hr.manage'], 0, () =>
        this.prisma.hrEmployee.count({
          where: { ...where, status: HrEmployeeStatus.ACTIVE },
        }),
      ),
      this.withOptionalReportPermission(
        user,
        ['hr.view', 'hr.attendance.manage'],
        [] as any[],
        () =>
          this.prisma.hrAttendanceRecord.groupBy({
            by: ['status'],
            where: { ...where, date: { gte: today } },
            _count: { _all: true },
          }),
      ),
      this.withOptionalReportPermission(
        user,
        ['accounting.view', 'accounting.manage'],
        [] as any[],
        () =>
          this.prisma.accountingTransaction.findMany({
            where,
            select: { type: true, amount: true },
          }),
      ),
      this.withOptionalReportPermission(
        user,
        ['legal.view', 'legal.manage'],
        0,
        () =>
          this.prisma.legalCase.count({
            where: { ...where, status: LegalCaseStatus.OPEN },
          }),
      ),
      this.withOptionalReportPermission(
        user,
        ['legal.view', 'legal.manage'],
        [] as any[],
        () =>
          this.prisma.legalDocument.groupBy({
            by: ['status'],
            where,
            _count: { _all: true },
          }),
      ),
      this.withOptionalReportPermission(
        user,
        ['ads.view', 'ads.manage'],
        [] as any[],
        () =>
          this.prisma.adsCampaign.groupBy({
            by: ['provider'],
            where,
            _count: { _all: true },
          }),
      ),
      this.withOptionalReportPermission(
        user,
        ['ads.view', 'ads.manage'],
        [] as any[],
        () =>
          this.prisma.adsCampaign.groupBy({
            by: ['status'],
            where,
            _count: { _all: true },
          }),
      ),
      this.withOptionalReportPermission(
        user,
        ['cameras.view', 'cameras.manage'],
        0,
        () =>
          this.prisma.cameraDevice.count({
            where: { ...where, status: CameraDeviceStatus.ACTIVE },
          }),
      ),
      this.withOptionalReportPermission(
        user,
        ['cameras.view', 'cameras.manage'],
        0,
        () =>
          this.prisma.cameraDevice.count({
            where: { ...where, status: CameraDeviceStatus.INACTIVE },
          }),
      ),
      this.withOptionalReportPermission(
        user,
        ['cameras.view', 'cameras.manage'],
        0,
        () =>
          this.prisma.cameraDevice.count({
            where: { ...where, aiEnabled: true },
          }),
      ),
      this.prisma.operationsActivity.count({
        where: { ...where, createdAt: { gte: recentSince } },
      }),
    ]);
    const accounting = this.sumAccounting(accountingRows);
    return {
      report: 'operations.overview',
      generatedAt: new Date().toISOString(),
      filters: this.reportFilters(input),
      cards: {
        totalEmployees,
        activeEmployees,
        attendanceToday: groupCountsBy(attendanceToday, 'status'),
        accounting,
        legalOpenCases,
        legalDocuments: {
          active: Number(
            groupCountsBy(legalDocumentsByStatus, 'status').ACTIVE ?? 0,
          ),
          expired: Number(
            groupCountsBy(legalDocumentsByStatus, 'status').EXPIRED ?? 0,
          ),
          byStatus: groupCountsBy(legalDocumentsByStatus, 'status'),
        },
        ads: {
          byProvider: groupCountsBy(adsByProvider, 'provider'),
          byStatus: groupCountsBy(adsByStatus, 'status'),
        },
        cameras: {
          active: cameraActive,
          inactive: cameraInactive,
          aiEnabled: cameraAiEnabled,
        },
        recentActivityCount,
      },
    };
  }

  async operationsReportTrends(input: any, user: AuthenticatedRequestUser) {
    this.assertDeveloper(user);
    const where = operationOrganizationWhere(user);
    const range = this.reportDateRange(input);
    const granularity = this.reportGranularity(input);
    const [activities, transactions, attendance] = await Promise.all([
      this.prisma.operationsActivity.findMany({
        where: { ...where, createdAt: range },
        select: { createdAt: true, module: true },
      }),
      this.withOptionalReportPermission(
        user,
        ['accounting.view', 'accounting.manage'],
        [] as any[],
        () =>
          this.prisma.accountingTransaction.findMany({
            where: { ...where, occurredAt: range },
            select: { occurredAt: true, type: true, amount: true },
          }),
      ),
      this.withOptionalReportPermission(
        user,
        ['hr.view', 'hr.attendance.manage'],
        [] as any[],
        () =>
          this.prisma.hrAttendanceRecord.findMany({
            where: { ...where, date: range },
            select: { date: true, status: true },
          }),
      ),
    ]);
    return {
      report: 'operations.trends',
      granularity,
      generatedAt: new Date().toISOString(),
      filters: this.reportFilters(input),
      activity: this.countTrend(activities, 'createdAt', granularity),
      accounting: this.accountingTrend(transactions, granularity),
      attendance: this.countTrend(attendance, 'date', granularity),
    };
  }

  async operationsReportActivity(input: any, user: AuthenticatedRequestUser) {
    this.assertDeveloper(user);
    requireOperationPermission(user, [
      'audit_logs.view',
      'reports.developer',
      'reports.platform_wide',
    ]);
    const where: Prisma.OperationsActivityWhereInput = {
      ...operationOrganizationWhere(user),
      module: this.optionalModule(input.module),
      createdAt: this.reportDateRange(input),
    };
    const [byModule, byAction, recentCount] = await Promise.all([
      this.prisma.operationsActivity.groupBy({
        by: ['module'],
        where,
        _count: { _all: true },
      }),
      this.prisma.operationsActivity.groupBy({
        by: ['action'],
        where,
        _count: { _all: true },
      }),
      this.prisma.operationsActivity.count({ where }),
    ]);
    return {
      report: 'operations.activity',
      generatedAt: new Date().toISOString(),
      filters: this.reportFilters(input),
      total: recentCount,
      byModule: groupCountsBy(byModule, 'module'),
      byAction: groupCountsBy(byAction, 'action'),
    };
  }

  async hrReportWorkforce(input: any, user: AuthenticatedRequestUser) {
    this.assertHrWorkspace(user);
    requireOperationPermission(user, ['hr.view', 'hr.manage']);
    const where = operationOrganizationWhere(user);
    const [employeesByStatus, departments, attendanceByStatus] =
      await Promise.all([
        this.prisma.hrEmployee.groupBy({
          by: ['status'],
          where,
          _count: { _all: true },
        }),
        this.prisma.hrDepartment.count({ where }),
        this.prisma.hrAttendanceRecord.groupBy({
          by: ['status'],
          where: { ...where, date: this.reportDateRange(input) },
          _count: { _all: true },
        }),
      ]);
    return {
      report: 'hr.workforce',
      generatedAt: new Date().toISOString(),
      filters: this.reportFilters(input),
      departments,
      employeesByStatus: groupCountsBy(employeesByStatus, 'status'),
      attendanceByStatus: groupCountsBy(attendanceByStatus, 'status'),
    };
  }

  async accountingReportCashflow(input: any, user: AuthenticatedRequestUser) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['accounting.view', 'accounting.manage']);
    const where: Prisma.AccountingTransactionWhereInput = {
      ...operationOrganizationWhere(user),
      occurredAt: this.reportDateRange(input),
    };
    const granularity = this.reportGranularity(input);
    const rows = await this.prisma.accountingTransaction.findMany({
      where,
      select: {
        type: true,
        amount: true,
        occurredAt: true,
        category: { select: { id: true, name: true } },
      },
    });
    return {
      report: 'accounting.cashflow',
      generatedAt: new Date().toISOString(),
      filters: this.reportFilters(input),
      totals: this.sumAccounting(rows),
      totalsByCategory: this.accountingByCategory(rows),
      trend: this.accountingTrend(rows, granularity),
    };
  }

  async legalReportRisk(input: any, user: AuthenticatedRequestUser) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['legal.view', 'legal.manage']);
    const where = operationOrganizationWhere(user);
    const [casesByStatus, documentsByStatus, documentsByType] =
      await Promise.all([
        this.prisma.legalCase.groupBy({
          by: ['status'],
          where,
          _count: { _all: true },
        }),
        this.prisma.legalDocument.groupBy({
          by: ['status'],
          where,
          _count: { _all: true },
        }),
        this.prisma.legalDocument.groupBy({
          by: ['type'],
          where,
          _count: { _all: true },
        }),
      ]);
    const documentStatus = groupCountsBy(documentsByStatus, 'status');
    return {
      report: 'legal.risk',
      generatedAt: new Date().toISOString(),
      filters: this.reportFilters(input),
      casesByStatus: groupCountsBy(casesByStatus, 'status'),
      documentsByStatus: documentStatus,
      documentsByType: groupCountsBy(documentsByType, 'type'),
      expiredCount: Number(documentStatus.EXPIRED ?? 0),
      expiringSoonCount: 0,
    };
  }

  async adsReportCampaigns(input: any, user: AuthenticatedRequestUser) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['ads.view', 'ads.manage']);
    const where = operationOrganizationWhere(user);
    const [byProvider, byStatus, campaigns] = await Promise.all([
      this.prisma.adsCampaign.groupBy({
        by: ['provider'],
        where,
        _count: { _all: true },
      }),
      this.prisma.adsCampaign.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
      this.prisma.adsCampaign.findMany({
        where,
        select: { budgetAmount: true },
      }),
    ]);
    return {
      report: 'ads.campaigns',
      generatedAt: new Date().toISOString(),
      filters: this.reportFilters(input),
      byProvider: groupCountsBy(byProvider, 'provider'),
      byStatus: groupCountsBy(byStatus, 'status'),
      plannedBudgetTotal: campaigns.reduce(
        (total, row) => total + Number(row.budgetAmount ?? 0),
        0,
      ),
    };
  }

  async camerasReportDevices(input: any, user: AuthenticatedRequestUser) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['cameras.view', 'cameras.manage']);
    const where = operationOrganizationWhere(user);
    const [byProvider, byStatus, aiEnabled] = await Promise.all([
      this.prisma.cameraDevice.groupBy({
        by: ['provider'],
        where,
        _count: { _all: true },
      }),
      this.prisma.cameraDevice.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
      this.prisma.cameraDevice.count({ where: { ...where, aiEnabled: true } }),
    ]);
    return {
      report: 'cameras.devices',
      generatedAt: new Date().toISOString(),
      filters: this.reportFilters(input),
      byProvider: groupCountsBy(byProvider, 'provider'),
      byStatus: groupCountsBy(byStatus, 'status'),
      aiEnabled,
    };
  }

  async hrSummary(user: AuthenticatedRequestUser) {
    this.assertHrWorkspace(user);
    requireOperationPermission(user, ['hr.view', 'hr.manage']);
    const where = operationOrganizationWhere(user);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [departments, activeEmployees, inactiveEmployees, attendance] =
      await Promise.all([
        this.prisma.hrDepartment.count({ where }),
        this.prisma.hrEmployee.count({
          where: { ...where, status: HrEmployeeStatus.ACTIVE },
        }),
        this.prisma.hrEmployee.count({
          where: { ...where, status: HrEmployeeStatus.INACTIVE },
        }),
        this.prisma.hrAttendanceRecord.groupBy({
          by: ['status'],
          where: { ...where, date: { gte: today } },
          _count: { _all: true },
        }),
      ]);
    return {
      departments,
      activeEmployees,
      inactiveEmployees,
      attendanceToday: groupCounts(attendance),
    };
  }

  listLegalDocuments(user: AuthenticatedRequestUser) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['legal.view', 'legal.manage']);
    return this.prisma.legalDocument.findMany({
      where: operationOrganizationWhere(user),
      orderBy: { createdAt: 'desc' },
    });
  }

  async createLegalDocument(input: any, user: AuthenticatedRequestUser) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['legal.manage']);
    const record = await this.prisma.legalDocument.create({
      data: {
        organizationId: requireOperationOrganizationId(user),
        title: this.required(input.title, 'title'),
        type: this.enumValue(
          LegalDocumentType,
          input.type,
          LegalDocumentType.OTHER,
        ),
        status: this.enumValue(
          LegalDocumentStatus,
          input.status,
          LegalDocumentStatus.DRAFT,
        ),
        relatedProjectId: this.optional(input.relatedProjectId),
        storageUrl: this.optional(input.storageUrl),
      },
    });
    await this.recordActivity(
      user,
      OperationsModule.LEGAL,
      'LegalDocument',
      record.id,
      'CREATED',
      'Legal document created',
      record.title,
      { type: record.type, status: record.status },
    );
    return record;
  }

  async updateLegalDocument(
    id: string,
    input: any,
    user: AuthenticatedRequestUser,
  ) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['legal.manage']);
    await this.assertExists('legalDocument', id, user);
    const record = await this.prisma.legalDocument.update({
      where: { id },
      data: input,
    });
    await this.recordActivity(
      user,
      OperationsModule.LEGAL,
      'LegalDocument',
      record.id,
      'UPDATED',
      'Legal document updated',
      record.title,
      { type: record.type, status: record.status },
    );
    return record;
  }

  async bulkUpdateLegalDocumentStatus(
    input: any,
    user: AuthenticatedRequestUser,
  ) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['legal.manage']);
    const ids = this.bulkIds(input.ids);
    const status = this.enumValue(
      LegalDocumentStatus,
      input.status,
      LegalDocumentStatus.DRAFT,
    );
    const records = await this.prisma.legalDocument.findMany({
      where: { id: { in: ids }, ...operationOrganizationWhere(user) },
    });
    this.assertBulkScope(ids, records);
    await this.prisma.legalDocument.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });
    await this.recordBulkActivities(
      user,
      records,
      OperationsModule.LEGAL,
      'LegalDocument',
      'BULK_STATUS_UPDATED',
      'Legal documents bulk status updated',
      { status },
    );
    return {
      updatedCount: records.length,
      ids: records.map((record) => record.id),
      status,
    };
  }

  async approveLegalDocument(
    id: string,
    input: any,
    user: AuthenticatedRequestUser,
  ) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['legal.manage']);
    await this.assertExists('legalDocument', id, user);
    const record = await this.prisma.legalDocument.update({
      where: { id },
      data: {
        status: LegalDocumentStatus.ACTIVE,
        reviewedByUserId: user.userId,
        reviewedAt: new Date(),
        reviewNote: this.optionalLong(input.reviewNote ?? input.note),
      },
    });
    await this.recordActivity(
      user,
      OperationsModule.LEGAL,
      'LegalDocument',
      record.id,
      'APPROVED',
      'Legal document approved',
      record.title,
      { type: record.type, status: record.status },
    );
    return record;
  }

  async rejectLegalDocument(
    id: string,
    input: any,
    user: AuthenticatedRequestUser,
  ) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['legal.manage']);
    await this.assertExists('legalDocument', id, user);
    const record = await this.prisma.legalDocument.update({
      where: { id },
      data: {
        status: LegalDocumentStatus.ARCHIVED,
        reviewedByUserId: user.userId,
        reviewedAt: new Date(),
        reviewNote: this.optionalLong(input.reviewNote ?? input.note),
      },
    });
    await this.recordActivity(
      user,
      OperationsModule.LEGAL,
      'LegalDocument',
      record.id,
      'REJECTED',
      'Legal document rejected',
      record.title,
      { type: record.type, status: record.status },
    );
    return record;
  }

  getLegalDocument(id: string, user: AuthenticatedRequestUser) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['legal.view', 'legal.manage']);
    return this.findScoped('legalDocument', id, user);
  }

  listLegalCases(user: AuthenticatedRequestUser) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['legal.view', 'legal.manage']);
    return this.prisma.legalCase.findMany({
      where: operationOrganizationWhere(user),
      orderBy: { createdAt: 'desc' },
    });
  }

  async createLegalCase(input: any, user: AuthenticatedRequestUser) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['legal.manage']);
    const record = await this.prisma.legalCase.create({
      data: {
        organizationId: requireOperationOrganizationId(user),
        title: this.required(input.title, 'title'),
        status: this.enumValue(
          LegalCaseStatus,
          input.status,
          LegalCaseStatus.OPEN,
        ),
        description: this.optional(input.description),
      },
    });
    await this.recordActivity(
      user,
      OperationsModule.LEGAL,
      'LegalCase',
      record.id,
      'CREATED',
      'Legal case created',
      record.title,
      { status: record.status },
    );
    return record;
  }

  async updateLegalCase(
    id: string,
    input: any,
    user: AuthenticatedRequestUser,
  ) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['legal.manage']);
    await this.assertExists('legalCase', id, user);
    const record = await this.prisma.legalCase.update({
      where: { id },
      data: input,
    });
    await this.recordActivity(
      user,
      OperationsModule.LEGAL,
      'LegalCase',
      record.id,
      'UPDATED',
      'Legal case updated',
      record.title,
      { status: record.status },
    );
    return record;
  }

  async bulkUpdateLegalCaseStatus(input: any, user: AuthenticatedRequestUser) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['legal.manage']);
    const ids = this.bulkIds(input.ids);
    const status = this.enumValue(
      LegalCaseStatus,
      input.status,
      LegalCaseStatus.OPEN,
    );
    const records = await this.prisma.legalCase.findMany({
      where: { id: { in: ids }, ...operationOrganizationWhere(user) },
    });
    this.assertBulkScope(ids, records);
    await this.prisma.legalCase.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });
    await this.recordBulkActivities(
      user,
      records,
      OperationsModule.LEGAL,
      'LegalCase',
      'BULK_STATUS_UPDATED',
      'Legal cases bulk status updated',
      { status },
    );
    return {
      updatedCount: records.length,
      ids: records.map((record) => record.id),
      status,
    };
  }

  getLegalCase(id: string, user: AuthenticatedRequestUser) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['legal.view', 'legal.manage']);
    return this.findScoped('legalCase', id, user);
  }

  async legalSummary(user: AuthenticatedRequestUser) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['legal.view', 'legal.manage']);
    const where = operationOrganizationWhere(user);
    const [documents, cases] = await Promise.all([
      this.prisma.legalDocument.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
      this.prisma.legalCase.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
    ]);
    return {
      documentsByStatus: groupCounts(documents),
      casesByStatus: groupCounts(cases),
    };
  }

  listAdsCampaigns(user: AuthenticatedRequestUser) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['ads.view', 'ads.manage']);
    return this.prisma.adsCampaign.findMany({
      where: operationOrganizationWhere(user),
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAdsCampaign(input: any, user: AuthenticatedRequestUser) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['ads.manage']);
    const record = await this.prisma.adsCampaign.create({
      data: {
        organizationId: requireOperationOrganizationId(user),
        name: this.required(input.name, 'name'),
        provider: this.enumValue(
          AdsCampaignProvider,
          input.provider,
          AdsCampaignProvider.OTHER,
        ),
        status: this.enumValue(
          AdsCampaignStatus,
          input.status,
          AdsCampaignStatus.DRAFT,
        ),
        budgetAmount:
          input.budgetAmount === undefined
            ? undefined
            : new Prisma.Decimal(Number(input.budgetAmount)),
        currency: this.optional(input.currency),
        externalAccountId: this.optional(input.externalAccountId),
        externalCampaignId: this.optional(input.externalCampaignId),
      },
    });
    await this.recordActivity(
      user,
      OperationsModule.ADS,
      'AdsCampaign',
      record.id,
      'CREATED',
      'Ads campaign created',
      record.name,
      { provider: record.provider, status: record.status },
    );
    return record;
  }

  async updateAdsCampaign(
    id: string,
    input: any,
    user: AuthenticatedRequestUser,
  ) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['ads.manage']);
    await this.assertExists('adsCampaign', id, user);
    const record = await this.prisma.adsCampaign.update({
      where: { id },
      data: input,
    });
    await this.recordActivity(
      user,
      OperationsModule.ADS,
      'AdsCampaign',
      record.id,
      'UPDATED',
      'Ads campaign updated',
      record.name,
      { provider: record.provider, status: record.status },
    );
    return record;
  }

  async bulkUpdateAdsCampaignStatus(
    input: any,
    user: AuthenticatedRequestUser,
  ) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['ads.manage']);
    const ids = this.bulkIds(input.ids);
    const status = this.enumValue(
      AdsCampaignStatus,
      input.status,
      AdsCampaignStatus.DRAFT,
    );
    const records = await this.prisma.adsCampaign.findMany({
      where: { id: { in: ids }, ...operationOrganizationWhere(user) },
    });
    this.assertBulkScope(ids, records);
    await this.prisma.adsCampaign.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });
    await this.recordBulkActivities(
      user,
      records,
      OperationsModule.ADS,
      'AdsCampaign',
      'BULK_STATUS_UPDATED',
      'Ads campaigns bulk status updated',
      { status },
    );
    return {
      updatedCount: records.length,
      ids: records.map((record) => record.id),
      status,
    };
  }

  getAdsCampaign(id: string, user: AuthenticatedRequestUser) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['ads.view', 'ads.manage']);
    return this.findScoped('adsCampaign', id, user);
  }

  async adsSummary(user: AuthenticatedRequestUser) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['ads.view', 'ads.manage']);
    const where = operationOrganizationWhere(user);
    const [byProvider, byStatus, campaigns] = await Promise.all([
      this.prisma.adsCampaign.groupBy({
        by: ['provider'],
        where,
        _count: { _all: true },
      }),
      this.prisma.adsCampaign.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
      this.prisma.adsCampaign.findMany({
        where,
        select: { budgetAmount: true },
      }),
    ]);
    return {
      byProvider: groupCounts(byProvider),
      byStatus: groupCounts(byStatus),
      totalPlannedBudget: campaigns.reduce(
        (total, row) => total + Number(row.budgetAmount ?? 0),
        0,
      ),
    };
  }

  listCameraDevices(user: AuthenticatedRequestUser) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['cameras.view', 'cameras.manage']);
    return this.prisma.cameraDevice.findMany({
      where: operationOrganizationWhere(user),
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCameraDevice(input: any, user: AuthenticatedRequestUser) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['cameras.manage']);
    const record = await this.prisma.cameraDevice.create({
      data: {
        organizationId: requireOperationOrganizationId(user),
        projectId: this.optional(input.projectId),
        name: this.required(input.name, 'name'),
        location: this.optional(input.location),
        provider: this.enumValue(
          CameraDeviceProvider,
          input.provider,
          CameraDeviceProvider.OTHER,
        ),
        streamUrlMasked: this.optional(input.streamUrlMasked),
        status: this.enumValue(
          CameraDeviceStatus,
          input.status,
          CameraDeviceStatus.ACTIVE,
        ),
        aiEnabled: Boolean(input.aiEnabled),
      },
    });
    await this.recordActivity(
      user,
      OperationsModule.CAMERAS,
      'CameraDevice',
      record.id,
      'CREATED',
      'Camera device created',
      record.name,
      {
        provider: record.provider,
        status: record.status,
        aiEnabled: record.aiEnabled,
      },
    );
    return record;
  }

  async updateCameraDevice(
    id: string,
    input: any,
    user: AuthenticatedRequestUser,
  ) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['cameras.manage']);
    await this.assertExists('cameraDevice', id, user);
    const record = await this.prisma.cameraDevice.update({
      where: { id },
      data: input,
    });
    await this.recordActivity(
      user,
      OperationsModule.CAMERAS,
      'CameraDevice',
      record.id,
      'UPDATED',
      'Camera device updated',
      record.name,
      {
        provider: record.provider,
        status: record.status,
        aiEnabled: record.aiEnabled,
      },
    );
    return record;
  }

  async bulkUpdateCameraDeviceStatus(
    input: any,
    user: AuthenticatedRequestUser,
  ) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['cameras.manage']);
    const ids = this.bulkIds(input.ids);
    const status = this.enumValue(
      CameraDeviceStatus,
      input.status,
      CameraDeviceStatus.ACTIVE,
    );
    const records = await this.prisma.cameraDevice.findMany({
      where: { id: { in: ids }, ...operationOrganizationWhere(user) },
    });
    this.assertBulkScope(ids, records);
    await this.prisma.cameraDevice.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });
    await this.recordBulkActivities(
      user,
      records,
      OperationsModule.CAMERAS,
      'CameraDevice',
      'BULK_STATUS_UPDATED',
      'Camera devices bulk status updated',
      { status },
    );
    return {
      updatedCount: records.length,
      ids: records.map((record) => record.id),
      status,
    };
  }

  getCameraDevice(id: string, user: AuthenticatedRequestUser) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['cameras.view', 'cameras.manage']);
    return this.findScoped('cameraDevice', id, user);
  }

  async camerasSummary(user: AuthenticatedRequestUser) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['cameras.view', 'cameras.manage']);
    const where = operationOrganizationWhere(user);
    const [byProvider, byStatus, aiEnabled] = await Promise.all([
      this.prisma.cameraDevice.groupBy({
        by: ['provider'],
        where,
        _count: { _all: true },
      }),
      this.prisma.cameraDevice.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
      this.prisma.cameraDevice.count({ where: { ...where, aiEnabled: true } }),
    ]);
    return {
      byProvider: groupCounts(byProvider),
      byStatus: groupCounts(byStatus),
      aiEnabled,
    };
  }

  async listActivities(input: any, user: AuthenticatedRequestUser) {
    this.assertDeveloper(user);
    const page = Math.max(1, Number(input.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(input.pageSize ?? 20)));
    const createdAt: Prisma.DateTimeFilter<'OperationsActivity'> = {
      gte: input.dateFrom ? new Date(String(input.dateFrom)) : undefined,
      lte: input.dateTo ? new Date(String(input.dateTo)) : undefined,
    };
    const where: Prisma.OperationsActivityWhereInput = {
      ...operationOrganizationWhere(user),
      module: this.optionalModule(input.module),
      entityType: this.optional(input.entityType),
      entityId: this.optional(input.entityId),
      action: this.optional(input.action),
      createdAt: createdAt.gte || createdAt.lte ? createdAt : undefined,
    };
    const [total, items] = await Promise.all([
      this.prisma.operationsActivity.count({ where }),
      this.prisma.operationsActivity.findMany({
        where,
        include: {
          actorUser: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async exportActivities(input: any, user: AuthenticatedRequestUser) {
    this.assertDeveloper(user);
    requireOperationPermission(user, [
      'audit_logs.view',
      'exports.organization_data',
      'exports.platform_data',
    ]);
    const where: Prisma.OperationsActivityWhereInput = {
      ...operationOrganizationWhere(user),
      module: this.optionalModule(input.module),
      entityType: this.optional(input.entityType ?? input.type),
      action: this.optional(input.action ?? input.status),
      createdAt: this.dateFilter(input),
    };
    const items = await this.prisma.operationsActivity.findMany({
      where,
      select: {
        id: true,
        organizationId: true,
        module: true,
        entityType: true,
        entityId: true,
        actorUserId: true,
        action: true,
        title: true,
        body: true,
        metadata: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: this.exportLimit(input),
    });
    return this.exportEnvelope('operations.activities', input, items);
  }

  async exportHrEmployees(input: any, user: AuthenticatedRequestUser) {
    this.assertHrWorkspace(user);
    requireOperationPermission(user, ['hr.view', 'hr.manage']);
    requireOperationPermission(user, [
      'exports.organization_data',
      'exports.platform_data',
    ]);
    const where: Prisma.HrEmployeeWhereInput = {
      ...this.employeeOrganizationWhere(input, user),
      status: this.optionalEnum(HrEmployeeStatus, input.status),
      createdAt: this.dateFilter(input),
    };
    const items = await this.prisma.hrEmployee.findMany({
      where,
      select: {
        id: true,
        organizationId: true,
        departmentId: true,
        name: true,
        email: true,
        phone: true,
        roleTitle: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: this.exportLimit(input),
    });
    return this.exportEnvelope('hr.employees', input, items);
  }

  async exportHrAttendance(input: any, user: AuthenticatedRequestUser) {
    this.assertHrWorkspace(user);
    requireOperationPermission(user, ['hr.view', 'hr.attendance.manage']);
    requireOperationPermission(user, [
      'hr.attendance.export',
      'hr.manage',
      'exports.organization_data',
      'exports.platform_data',
    ]);
    const organizationId = requireOperationOrganizationId(user);
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { timezone: true },
    });
    const timezone = this.organizationTimezone(organization?.timezone);
    const requestedDate = input.date ?? (
      input.dateFrom && input.dateFrom === input.dateTo ? input.dateFrom : null
    );
    if (requestedDate) {
      const date = this.attendanceListDate(requestedDate, timezone);
      const policy = await this.attendancePolicy(organizationId);
      let items = await this.dailyAttendanceRoster(
        organizationId,
        date,
        timezone,
        policy,
      );
      const status = this.optional(input.status);
      if (status) items = items.filter((item) => item.status === status);
      return this.exportEnvelope('hr.attendance', input, items);
    }
    const where: Prisma.HrAttendanceRecordWhereInput = {
      ...operationOrganizationWhere(user, this.optional(input.organizationId)),
      status: this.optionalEnum(HrAttendanceStatus, input.status),
      date: this.dateFilter(input),
    };
    const items = await this.prisma.hrAttendanceRecord.findMany({
      where,
      select: {
        id: true,
        organizationId: true,
        employeeId: true,
        date: true,
        checkInAt: true,
        checkOutAt: true,
        plannedCheckInAt: true,
        plannedCheckOutAt: true,
        minutesLate: true,
        entryChannel: true,
        attendanceSource: true,
        status: true,
        note: true,
      },
      orderBy: { date: 'desc' },
      take: this.exportLimit(input),
    });
    return this.exportEnvelope('hr.attendance', input, items);
  }

  private async dailyAttendanceRoster(
    organizationId: string,
    date: string,
    timezone: string,
    policy: any,
  ): Promise<Record<string, unknown>[]> {
    const { start, end } = this.attendanceDayBounds(date, timezone);
    const [year, month] = date.split('-').map(Number);
    const monthDate = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-01`;
    const monthStart = this.attendanceDayBounds(monthDate, timezone).start;
    const [employees, records, lateRecords] = await Promise.all([
      this.prisma.hrEmployee.findMany({
        where: { organizationId, status: HrEmployeeStatus.ACTIVE },
        orderBy: { name: 'asc' },
      }),
      this.prisma.hrAttendanceRecord.findMany({
        where: {
          organizationId,
          OR: [
            { checkInAt: { gte: start, lt: end } },
            { checkInAt: null, date: { gte: start, lt: end } },
          ],
        },
        orderBy: { id: 'asc' },
      }),
      this.prisma.hrAttendanceRecord.findMany({
        where: {
          organizationId,
          date: { gte: monthStart, lt: end },
          minutesLate: { gt: 0 },
        },
        select: { employeeId: true, date: true },
      }),
    ]);
    const recordByEmployee = new Map(records.map((record: any) => [record.employeeId, record]));
    const lateDaysByEmployee = new Map<string, Set<string>>();
    for (const record of lateRecords) {
      const days = lateDaysByEmployee.get(record.employeeId) ?? new Set<string>();
      days.add(this.dateOnly(record.date));
      lateDaysByEmployee.set(record.employeeId, days);
    }
    const allowanceMinutes = Math.max(0, Number(policy.monthlyLateAllowanceHours ?? 4)) * 60;
    const chargeMinutes = Math.max(1, Number(policy.lateAllowanceChargeHoursPerDay ?? 1)) * 60;
    const now = new Date();
    const rows: Record<string, unknown>[] = [];

    for (const employee of employees) {
      const employmentStart = employee.workStartDate ?? employee.hireDate;
      if (employmentStart && new Date(employmentStart).getTime() >= end.getTime()) continue;
      const record = recordByEmployee.get(employee.id) as any | undefined;
      const schedule = record
        ? null
        : await this.resolveEffectiveAttendanceSchedule(
            { organizationId, employeeId: employee.id, attendanceDate: start, timezone },
            employee,
            policy,
          );
      const lateDays = lateDaysByEmployee.get(employee.id)?.size ?? 0;
      const usedMinutes = Math.min(allowanceMinutes, lateDays * chargeMinutes);
      const chargedToday = record?.minutesLate > 0
        ? Math.min(chargeMinutes, Math.max(0, allowanceMinutes - Math.max(0, lateDays - 1) * chargeMinutes))
        : 0;
      const missingStatus = schedule?.isWorkingDay === false
        ? HrAttendanceStatus.OFF
        : schedule?.plannedCheckOut && now.getTime() < schedule.plannedCheckOut.getTime()
          ? 'NOT_RECORDED'
          : policy.missingAttendanceDisposition ?? MissingAttendanceDisposition.ABSENT;
      rows.push({
        employeeId: employee.id,
        employeeName: employee.name,
        employeeCode: employee.employeeCode ?? null,
        date,
        plannedCheckInAt: record?.plannedCheckInAt ?? schedule?.plannedCheckInAt ?? null,
        checkInAt: record?.checkInAt ?? null,
        plannedCheckOutAt: record?.plannedCheckOutAt ?? schedule?.plannedCheckOutAt ?? null,
        checkOutAt: record?.checkOutAt ?? null,
        status: record?.status ?? missingStatus,
        entryChannel: record?.entryChannel ?? AttendanceEntryChannel.AUTO,
        attendanceSource: record?.attendanceSource ?? AttendanceSource.AUTO_GENERATED,
        minutesLate: record?.minutesLate ?? 0,
        lateAllowanceChargedMinutes: chargedToday,
        lateAllowanceUsedMinutes: usedMinutes,
        lateAllowanceRemainingMinutes: Math.max(0, allowanceMinutes - usedMinutes),
        note: record?.note ?? null,
      });
    }
    return rows;
  }

  async exportAccountingTransactions(
    input: any,
    user: AuthenticatedRequestUser,
  ) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['accounting.view', 'accounting.manage']);
    requireOperationPermission(user, [
      'exports.organization_data',
      'exports.platform_data',
    ]);
    const where: Prisma.AccountingTransactionWhereInput = {
      ...operationOrganizationWhere(user),
      type: this.optionalEnum(AccountingTransactionType, input.type),
      status: this.optionalEnum(AccountingTransactionStatus, input.status),
      occurredAt: this.dateFilter(input),
    };
    const items = await this.prisma.accountingTransaction.findMany({
      where,
      select: {
        id: true,
        organizationId: true,
        type: true,
        amount: true,
        currency: true,
        categoryId: true,
        description: true,
        occurredAt: true,
        status: true,
        approvedByUserId: true,
        approvedAt: true,
        approvalNote: true,
        createdByUserId: true,
        createdAt: true,
      },
      orderBy: { occurredAt: 'desc' },
      take: this.exportLimit(input),
    });
    return this.exportEnvelope(
      'accounting.transactions',
      input,
      items.map((item) => ({ ...item, amount: String(item.amount) })),
    );
  }

  async exportLegalDocuments(input: any, user: AuthenticatedRequestUser) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['legal.view', 'legal.manage']);
    requireOperationPermission(user, [
      'exports.organization_data',
      'exports.platform_data',
    ]);
    const where: Prisma.LegalDocumentWhereInput = {
      ...operationOrganizationWhere(user),
      status: this.optionalEnum(LegalDocumentStatus, input.status),
      type: this.optionalEnum(LegalDocumentType, input.type),
      createdAt: this.dateFilter(input),
    };
    const items = await this.prisma.legalDocument.findMany({
      where,
      select: {
        id: true,
        organizationId: true,
        title: true,
        type: true,
        status: true,
        relatedProjectId: true,
        reviewedByUserId: true,
        reviewedAt: true,
        reviewNote: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: this.exportLimit(input),
    });
    return this.exportEnvelope('legal.documents', input, items);
  }

  async exportLegalCases(input: any, user: AuthenticatedRequestUser) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['legal.view', 'legal.manage']);
    requireOperationPermission(user, [
      'exports.organization_data',
      'exports.platform_data',
    ]);
    const where: Prisma.LegalCaseWhereInput = {
      ...operationOrganizationWhere(user),
      status: this.optionalEnum(LegalCaseStatus, input.status),
      createdAt: this.dateFilter(input),
    };
    const items = await this.prisma.legalCase.findMany({
      where,
      select: {
        id: true,
        organizationId: true,
        title: true,
        status: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: this.exportLimit(input),
    });
    return this.exportEnvelope('legal.cases', input, items);
  }

  async exportAdsCampaigns(input: any, user: AuthenticatedRequestUser) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['ads.view', 'ads.manage']);
    requireOperationPermission(user, [
      'exports.organization_data',
      'exports.platform_data',
    ]);
    const where: Prisma.AdsCampaignWhereInput = {
      ...operationOrganizationWhere(user),
      provider: this.optionalEnum(
        AdsCampaignProvider,
        input.type ?? input.provider,
      ),
      status: this.optionalEnum(AdsCampaignStatus, input.status),
      createdAt: this.dateFilter(input),
    };
    const items = await this.prisma.adsCampaign.findMany({
      where,
      select: {
        id: true,
        organizationId: true,
        name: true,
        provider: true,
        status: true,
        budgetAmount: true,
        currency: true,
        externalAccountId: true,
        externalCampaignId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: this.exportLimit(input),
    });
    return this.exportEnvelope(
      'ads.campaigns',
      input,
      items.map((item) => ({
        ...item,
        budgetAmount:
          item.budgetAmount === null ? null : String(item.budgetAmount),
      })),
    );
  }

  async exportCameraDevices(input: any, user: AuthenticatedRequestUser) {
    this.assertDeveloper(user);
    requireOperationPermission(user, ['cameras.view', 'cameras.manage']);
    requireOperationPermission(user, [
      'exports.organization_data',
      'exports.platform_data',
    ]);
    const where: Prisma.CameraDeviceWhereInput = {
      ...operationOrganizationWhere(user),
      provider: this.optionalEnum(
        CameraDeviceProvider,
        input.type ?? input.provider,
      ),
      status: this.optionalEnum(CameraDeviceStatus, input.status),
      createdAt: this.dateFilter(input),
    };
    const items = await this.prisma.cameraDevice.findMany({
      where,
      select: {
        id: true,
        organizationId: true,
        projectId: true,
        name: true,
        location: true,
        provider: true,
        status: true,
        aiEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: this.exportLimit(input),
    });
    return this.exportEnvelope('cameras.devices', input, items);
  }

  listModuleActivities(
    module: string,
    input: any,
    user: AuthenticatedRequestUser,
  ) {
    return this.listActivities({ ...input, module }, user);
  }

  listEntityActivities(
    module: string,
    entityType: string,
    entityId: string,
    input: any,
    user: AuthenticatedRequestUser,
  ) {
    return this.listActivities(
      { ...input, module, entityType, entityId },
      user,
    );
  }

  private assertDeveloper(user: AuthenticatedRequestUser) {
    requireDeveloperOrPlatform(user);
  }

  private assertHrWorkspace(user: AuthenticatedRequestUser) {
    requireOperationsWorkspace(user);
  }

  private resolveEmployeeOrganizationId(
    input: any,
    user: AuthenticatedRequestUser,
  ) {
    if (isPlatformUser(user)) {
      const organizationId = this.optional(input.organizationId);
      if (!organizationId) {
        throw new BadRequestException('organizationId is required for platform users.');
      }
      return organizationId;
    }

    if (
      this.optional(input.organizationId) &&
      this.optional(input.organizationId) !== user.organizationId
    ) {
      throw new ForbiddenException('Cannot create employees in another organization.');
    }

    return requireOperationOrganizationId(user);
  }

  private employeeOrganizationWhere(
    input: any,
    user: AuthenticatedRequestUser,
  ): Prisma.HrEmployeeWhereInput {
    const organizationId = this.optional(input.organizationId);
    if (isPlatformUser(user)) {
      return operationOrganizationWhere(user, organizationId);
    }

    if (organizationId && organizationId !== user.organizationId) {
      throw new ForbiddenException('Cannot access employees in another organization.');
    }

    return operationOrganizationWhere(user);
  }

  private organizationScopedWhere(input: any, user: AuthenticatedRequestUser) {
    return { organizationId: this.resolveScopedOrganizationId(input, user) };
  }

  private resolveScopedOrganizationId(input: any, user: AuthenticatedRequestUser) {
    const organizationId = this.optional(input.organizationId);
    if (isPlatformUser(user)) {
      const scoped = organizationId ?? user.organizationId;
      if (!scoped) throw new BadRequestException('organizationId is required.');
      return scoped;
    }
    if (organizationId && organizationId !== user.organizationId) {
      throw new ForbiddenException('Organization scope violation.');
    }
    return requireOperationOrganizationId(user);
  }

  private attendanceSettingsData(input: any) {
    return {
      requireLocation: Boolean(input.requireLocation),
      allowedLatitude: this.optionalNumber(input.allowedLatitude),
      allowedLongitude: this.optionalNumber(input.allowedLongitude),
      allowedRadiusMeters: this.positiveInt(input.allowedRadiusMeters, 30),
      exactRadiusMeters: this.positiveInt(input.exactRadiusMeters, 30),
      expandedRadiusMeters: this.positiveInt(input.expandedRadiusMeters, 1000),
      gracePeriodMinutes: this.nonNegativeInt(input.gracePeriodMinutes, 10),
      firstLateSliceMinutes: this.positiveInt(input.firstLateSliceMinutes, 15),
      firstLatePenaltyType: this.enumValue(
        AttendancePenaltyType,
        input.firstLatePenaltyType,
        AttendancePenaltyType.MARK_LATE,
      ),
      firstLatePenaltyValue: this.optional(input.firstLatePenaltyValue),
      secondLateSliceMinutes: this.positiveInt(input.secondLateSliceMinutes, 30),
      secondLatePenaltyType: this.enumValue(
        AttendancePenaltyType,
        input.secondLatePenaltyType,
        AttendancePenaltyType.MANUAL_REVIEW,
      ),
      secondLatePenaltyValue: this.optional(input.secondLatePenaltyValue),
      beyondSecondSlicePenaltyType: this.enumValue(
        AttendancePenaltyType,
        input.beyondSecondSlicePenaltyType,
        AttendancePenaltyType.MANUAL_REVIEW,
      ),
      requireWifi: Boolean(input.requireWifi),
      allowedWifiSsids: this.stringList(input.allowedWifiSsids),
      allowedWifiBssids: this.stringList(input.allowedWifiBssids).map((value) => normalizeWifiId(value) ?? value),
      blockDeveloperOptions: input.blockDeveloperOptions === undefined ? true : Boolean(input.blockDeveloperOptions),
      blockUsbDebugging: input.blockUsbDebugging === undefined ? true : Boolean(input.blockUsbDebugging),
      requirePhoto: Boolean(input.requirePhoto),
      maxGpsAccuracyMeters: this.optionalPositiveInt(input.maxGpsAccuracyMeters, 'maxGpsAccuracyMeters'),
      firstAttendancePhotoRequiresApproval:
        input.firstAttendancePhotoRequiresApproval === undefined
          ? true
          : Boolean(input.firstAttendancePhotoRequiresApproval),
      requireFaceVerification: Boolean(input.requireFaceVerification),
      requireDvrReview: Boolean(input.requireDvrReview),
      allowWebCheckIn: input.allowWebCheckIn === undefined ? true : Boolean(input.allowWebCheckIn),
      allowMobileCheckIn: input.allowMobileCheckIn === undefined ? true : Boolean(input.allowMobileCheckIn),
      allowExpandedRadiusWithReview:
        input.allowExpandedRadiusWithReview === undefined
          ? true
          : Boolean(input.allowExpandedRadiusWithReview),
      webWifiPolicy: this.enumValue(
        WebWifiPolicy,
        input.webWifiPolicy,
        WebWifiPolicy.MANUAL_REVIEW,
      ),
      workStartTime: this.timeValue(input.workStartTime, '11:15'),
      workEndTime: this.timeValue(input.workEndTime, '19:00'),
      monthlyLateAllowanceHours: this.nonNegativeInt(
        input.monthlyLateAllowanceHours,
        4,
      ),
      lateAllowanceChargeHoursPerDay: this.positiveInt(
        input.lateAllowanceChargeHoursPerDay,
        1,
      ),
      missingAttendanceDisposition: this.enumValue(
        MissingAttendanceDisposition,
        input.missingAttendanceDisposition,
        MissingAttendanceDisposition.ABSENT,
      ),
      autoCloseOpenAttendance:
        input.autoCloseOpenAttendance === undefined
          ? true
          : Boolean(input.autoCloseOpenAttendance),
      regularShiftAutoCloseMode: this.enumValue(
        RegularShiftAutoCloseMode,
        input.regularShiftAutoCloseMode,
        RegularShiftAutoCloseMode.END_OF_WORK_DAY,
      ),
      autoCloseGraceMinutes: this.nonNegativeInt(
        input.autoCloseGraceMinutes,
        60,
      ),
      autoCloseAtLocalMidnight:
        input.autoCloseAtLocalMidnight === undefined
          ? true
          : Boolean(input.autoCloseAtLocalMidnight),
      checkOutOutsideLocationPolicy: this.enumValue(
        CheckOutOutsideLocationPolicy,
        input.checkOutOutsideLocationPolicy,
        CheckOutOutsideLocationPolicy.BLOCK,
      ),
    };
  }

  private async findEmployeeForMutation(
    id: string,
    user: AuthenticatedRequestUser,
  ) {
    return this.prisma.hrEmployee
      .findFirstOrThrow({
        where: { id, ...operationOrganizationWhere(user) },
        include: { user: { include: { role: true } } },
      })
      .catch(() => {
        throw new NotFoundException('Record not found.');
      });
  }

  private hrEmployeeResponse(employee: any) {
    const user = employee.user
      ? {
          id: employee.user.id,
          email: employee.user.email,
          phone: employee.user.phone,
          firstName: employee.user.firstName,
          lastName: employee.user.lastName,
          isActive: employee.user.isActive,
          hasPassword: Boolean(employee.user.passwordHash),
          role: employee.user.role,
        }
      : null;

    return {
      ...employee,
      user,
      loginReadiness: this.employeeLoginReadiness(employee, user),
    };
  }

  private employeeLoginReadiness(employee: any, user: any) {
    const reasons: string[] = [];
    if (!user) reasons.push('LOGIN_USER_MISSING');
    if (user && !user.hasPassword) reasons.push('PASSWORD_MISSING');
    if (employee.status !== HrEmployeeStatus.ACTIVE) reasons.push('EMPLOYEE_INACTIVE');
    if (user && !user.isActive) reasons.push('USER_INACTIVE');
    if (!employee.email && !user?.email) reasons.push('EMAIL_REQUIRED');
    if (!user?.role?.permissions?.length) reasons.push('NO_ROLE_PERMISSIONS');

    return {
      canLogin: reasons.length === 0,
      reasons,
    };
  }

  private employeeName(input: any, fallback?: string) {
    const explicit = this.optional(input.name);
    if (explicit) return explicit;
    const name = [this.optional(input.firstName), this.optional(input.lastName)]
      .filter(Boolean)
      .join(' ');
    return name || fallback || this.required(undefined, 'name');
  }

  private requiredEmail(value: unknown) {
    const email = this.required(value, 'email').toLowerCase();
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      throw new BadRequestException('email is invalid.');
    }
    return email;
  }

  private employeeRoleName(value: unknown) {
    const role = this.optional(value) ?? 'employee_self_service';
    if (!COMPANY_ROLE_TO_USER_ROLE[role]) {
      throw new BadRequestException(`Unsupported employee role: ${role}`);
    }
    return role;
  }

  private assertEmployeeRoleAssignable(
    roleName: string,
    user: AuthenticatedRequestUser,
  ) {
    if (roleName.startsWith('platform_') && !isPlatformUser(user)) {
      throw new ForbiddenException('Company users cannot assign platform roles.');
    }
  }

  private userRoleForEmployeeRole(roleName: string) {
    return COMPANY_ROLE_TO_USER_ROLE[roleName] ?? UserRole.DEVELOPER_SALES_AGENT;
  }

  private permissionKeys(value: unknown) {
    if (!value) return [];
    if (!Array.isArray(value)) {
      throw new BadRequestException('permissions must be an array.');
    }
    return [
      ...new Set(
        value
          .map((item) => (typeof item === 'string' ? item.trim() : ''))
          .filter(Boolean),
      ),
    ];
  }

  private async assertAssignableEmployeePermissions(
    permissions: string[],
    user: AuthenticatedRequestUser,
  ) {
    if (!permissions.length) return;

    for (const permission of permissions) {
      if (this.isPlatformPermission(permission) && !isPlatformUser(user)) {
        throw new ForbiddenException('Company users cannot assign platform permissions.');
      }
    }

    if (isPlatformUser(user) || user.role === 'company_admin') {
      return;
    }

    const missing = permissions.filter(
      (permission) => !user.permissions?.includes(permission),
    );
    if (missing.length) {
      throw new ForbiddenException('Cannot assign permissions you do not have.');
    }
  }

  private isPlatformPermission(permission: string) {
    return (
      PLATFORM_PERMISSION_KEYS.has(permission) ||
      PLATFORM_PERMISSION_PREFIXES.some((prefix) => permission.startsWith(prefix))
    );
  }

  private async ensureEmployeeRole(
    prisma: Pick<any, 'role' | 'permission' | 'rolePermission'>,
    organizationId: string,
    roleName: string,
  ) {
    const role = await prisma.role.upsert({
      where: { organizationId_name: { organizationId, name: roleName } },
      create: {
        organizationId,
        name: roleName,
        isSystem: true,
        description: ROLE_LABELS[roleName] ?? `Employee role: ${roleName}`,
      },
      update: {},
    });

    await this.syncRolePermissions(prisma, role.id, ROLE_PERMISSIONS[roleName] ?? []);
    return role;
  }

  private async createCustomEmployeeRole(
    prisma: Pick<any, 'role' | 'permission' | 'rolePermission'>,
    organizationId: string,
    employeeId: string,
    permissions: string[],
  ) {
    const roleName = `employee_${employeeId}_custom`;
    const role = await prisma.role.upsert({
      where: { organizationId_name: { organizationId, name: roleName } },
      create: {
        organizationId,
        name: roleName,
        isSystem: false,
        description: 'Custom employee permission override.',
      },
      update: {},
    });

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await this.syncRolePermissions(prisma, role.id, permissions);
    return role;
  }

  private async syncRolePermissions(
    prisma: Pick<any, 'permission' | 'rolePermission'>,
    roleId: string,
    permissions: readonly string[],
  ) {
    for (const permissionKey of permissions) {
      const permission = await prisma.permission.upsert({
        where: { key: permissionKey },
        create: {
          key: permissionKey,
          description: `Base permission: ${permissionKey}`,
        },
        update: {},
      });
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId: permission.id,
          },
        },
        create: { roleId, permissionId: permission.id },
        update: {},
      });
    }
  }

  private async assertEmployeePhoneAvailable(
    phone: string | undefined,
    exceptUserId?: string,
  ) {
    if (!phone) return;
    const users = await this.prisma.user.findMany({
      where: { phone: { not: null } },
      select: { id: true, phone: true },
    });
    const conflict = users.some(
      (candidate) => candidate.id !== exceptUserId && phonesMatch(candidate.phone, phone),
    );
    if (conflict) {
      throw new ConflictException('Phone number cannot be used for this account.');
    }
  }

  private async assertEmployeeLimit(organizationId: string) {
    if (!this.prisma.organizationLimits) return;
    const [limits, employees] = await Promise.all([
      this.prisma.organizationLimits.findUnique({ where: { organizationId } }),
      this.prisma.hrEmployee.count({ where: { organizationId } }),
    ]);
    if (limits && employees >= limits.maxEmployees) {
      throw new BadRequestException('Limit exceeded: employee limit reached.');
    }
  }

  private async assertBranchLimit(organizationId: string) {
    if (!this.prisma.organizationLimits) return;
    const [limits, branches] = await Promise.all([
      this.prisma.organizationLimits.findUnique({ where: { organizationId } }),
      this.prisma.organizationBranch.count({ where: { organizationId } }),
    ]);
    const max = limits?.maxOffices ?? limits?.maxBranches;
    if (max !== undefined && branches >= max) {
      throw new BadRequestException('Limit exceeded: office limit reached.');
    }
  }

  private ensureHashService() {
    if (!this.hashService) {
      throw new BadRequestException('Password hashing service is not available.');
    }
  }

  private generateTemporaryPassword() {
    return `Pw-${randomBytes(9).toString('base64url')}`;
  }

  private async recordAudit(
    user: AuthenticatedRequestUser,
    action: string,
    entityType: string,
    entityId: string,
    metadata?: Record<string, unknown>,
  ) {
    if (!this.auditLogs) return;
    await this.auditLogs.record({
      action,
      entityType,
      entityId,
      actor: user,
      organizationId: user.organizationId,
      metadata,
    });
  }

  private async resolveCurrentEmployee(user: AuthenticatedRequestUser) {
    requireOperationPermission(user, ['hr.attendance.self']);
    const organizationId = requireOperationOrganizationId(user);
    const employee = await this.prisma.hrEmployee.findFirst({
      where: {
        userId: user.userId,
        organizationId,
        status: HrEmployeeStatus.ACTIVE,
        loginEnabled: true,
      },
      include: { organization: { select: { type: true, status: true } } },
    });

    if (!employee) {
      throw new ForbiddenException({
        code: 'EMPLOYEE_PROFILE_NOT_LINKED',
        message: 'No employee profile is linked to this account.',
      });
    }
    if (
      employee.organization.type !== 'PLATFORM' &&
      !['ACTIVE', 'APPROVED'].includes(employee.organization.status)
    ) {
      throw new ForbiddenException({
        code: 'COMPANY_AWAITING_VERIFICATION',
        message: 'The organization is awaiting platform review and activation.',
      });
    }

    return employee;
  }

  private async recordRejectedAttendanceAttempt(
    employee: any,
    input: any,
    verification: any,
    action: 'CHECK_IN' | 'CHECK_OUT',
    attendanceRecordId?: string,
  ) {
    const location = await this.attendanceLocationDecision(
      input,
      await this.attendancePolicy(employee.organizationId),
      employee.organizationId,
      action === 'CHECK_OUT' ? 'checkOut' : 'checkIn',
    );
    return (this.prisma as any).hrAttendanceAttempt.create({
      data: {
        organizationId: employee.organizationId,
        employeeId: employee.id,
        attendanceRecordId,
        action,
        actionType: action,
        source: 'SELF_SERVICE',
        decision: 'REJECTED',
        result: 'REJECTED',
        failureReasons: verification.reasons,
        matchedLocationId: location.matchedLocationId,
        distanceMeters: location.distanceMeters,
        gpsAccuracy: this.optionalNumber(
          input.locationAccuracyMeters ?? input.accuracy,
        ),
        deviceId: this.optional(input.deviceId),
        requestId: this.optional(input.requestId ?? input.idempotencyKey),
      },
    });
  }

  /**
   * Called by the dedicated worker/cron and by the check-in fallback.  The
   * update predicate includes `checkOutAt: null`, so concurrent executions are
   * safe and a record can never be auto-closed twice.
   */
  async autoCloseOpenAttendanceRecords(now = new Date()) {
    const organizations = await this.prisma.organization.findMany({
      where: { status: { in: ['ACTIVE', 'APPROVED'] } },
      select: { id: true, timezone: true },
    });
    let checked = 0;
    let closed = 0;
    let warnings = 0;

    for (const organization of organizations) {
      const policy = await this.attendancePolicy(organization.id);
      if (!policy.autoCloseOpenAttendance) continue;
      const timezone = this.organizationTimezone(organization.timezone);
      let cursorId: string | undefined;
      while (true) {
        const records = await this.prisma.hrAttendanceRecord.findMany({
          where: {
            organizationId: organization.id,
            checkInAt: { not: null },
            checkOutAt: null,
            verificationStatus: {
              notIn: [
                AttendanceVerificationStatus.REJECTED,
                AttendanceVerificationStatus.FAILED,
              ],
            },
          },
          include: { employee: { select: { userId: true } } },
          orderBy: [{ checkInAt: 'asc' }, { id: 'asc' }],
          ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
          take: AUTO_CLOSE_BATCH_SIZE,
        });
        if (!records.length) break;
        cursorId = records[records.length - 1].id;
        for (const record of records) {
          checked += 1;
          const result = await this.autoCloseRecordIfDue(
            record,
            policy,
            timezone,
            now,
          );
          if (result.warningQueued) warnings += 1;
          if (result.closed) closed += 1;
        }
        if (records.length < AUTO_CLOSE_BATCH_SIZE) break;
      }
      // IDs are deliberately shortened: no location, photo, or PII is logged.
      console.info('[attendance:auto-close]', {
        organizationId: this.shortId(organization.id),
        checked,
        closed,
        warnings,
      });
    }
    return { organizations: organizations.length, checked, closed, warnings };
  }

  /** Creates one auditable row for each active employee who had no attendance
   * on the previous organization-local working day. */
  async reconcileMissingAttendanceRecords(now = new Date()) {
    const organizations = await this.prisma.organization.findMany({
      where: { status: { in: ['ACTIVE', 'APPROVED'] } },
      select: { id: true, timezone: true },
    });
    let created = 0;
    let skipped = 0;

    for (const organization of organizations) {
      const timezone = this.organizationTimezone(organization.timezone);
      const currentDate = this.organizationLocalDate(now, timezone);
      const targetDate = this.previousDate(currentDate);
      const workDate = new Date(`${targetDate}T00:00:00.000Z`);
      const { start, end } = this.attendanceDayBounds(targetDate, timezone);
      const policy = await this.attendancePolicy(organization.id);
      const employees = await this.prisma.hrEmployee.findMany({
        where: { organizationId: organization.id, status: HrEmployeeStatus.ACTIVE },
      });

      for (const employee of employees) {
        const employmentStart = employee.workStartDate ?? employee.hireDate;
        if (employmentStart && new Date(employmentStart).getTime() >= end.getTime()) {
          skipped += 1;
          continue;
        }
        const existing = await this.prisma.hrAttendanceRecord.findFirst({
          where: {
            organizationId: organization.id,
            employeeId: employee.id,
            OR: [
              { checkInAt: { gte: start, lt: end } },
              { checkInAt: null, date: { gte: start, lt: end } },
            ],
          },
          select: { id: true },
        });
        if (existing) {
          skipped += 1;
          continue;
        }
        const schedule = await this.resolveEffectiveAttendanceSchedule(
          { organizationId: organization.id, employeeId: employee.id, attendanceDate: workDate, timezone },
          employee,
          policy,
        );
        if (!schedule.isWorkingDay) {
          skipped += 1;
          continue;
        }
        const status = policy.missingAttendanceDisposition === MissingAttendanceDisposition.LEAVE
          ? HrAttendanceStatus.LEAVE
          : HrAttendanceStatus.ABSENT;
        await this.prisma.hrAttendanceRecord.create({
          data: {
            organizationId: organization.id,
            employeeId: employee.id,
            date: workDate,
            status,
            attendanceSource: AttendanceSource.AUTO_GENERATED,
            entryChannel: AttendanceEntryChannel.AUTO,
            verificationStatus: AttendanceVerificationStatus.VERIFIED,
            note: `Automatically classified as ${status} because no attendance was recorded.`,
            scheduleSource: schedule.scheduleSource,
            scheduleId: schedule.scheduleId,
            scheduleTimezone: schedule.timezone,
            overnightShift: schedule.overnightShift,
            plannedCheckInAt: schedule.plannedCheckInAt,
            plannedCheckOutAt: schedule.plannedCheckOutAt,
            graceMinutes: schedule.graceMinutes,
            expectedWorkMinutes: schedule.expectedWorkMinutes,
            lateUntilAt: schedule.lateUntilAt,
            severeLateUntilAt: schedule.severeLateUntilAt,
            absentAfterAt: schedule.absentAfterAt,
          },
        });
        created += 1;
      }
    }
    return { organizations: organizations.length, created, skipped };
  }

  private async autoCloseDueOpenRecordForEmployee(
    employee: any,
    policy: any,
    now: Date,
  ) {
    if (!policy.autoCloseOpenAttendance) return false;
    const record = await this.prisma.hrAttendanceRecord.findFirst({
      where: {
        organizationId: employee.organizationId,
        employeeId: employee.id,
        checkInAt: { not: null },
        checkOutAt: null,
        verificationStatus: {
          notIn: [
            AttendanceVerificationStatus.REJECTED,
            AttendanceVerificationStatus.FAILED,
          ],
        },
      },
      include: { employee: { select: { userId: true } } },
      orderBy: { checkInAt: 'asc' },
    });
    if (!record) return false;
    const timezone = await this.organizationTimezoneFor(employee.organizationId);
    const result = await this.autoCloseRecordIfDue(record, policy, timezone, now);
    return result.closed;
  }

  private async autoCloseRecordIfDue(
    record: any,
    policy: any,
    organizationTimezone: string,
    now: Date,
  ): Promise<{ closed: boolean; warningQueued: boolean }> {
    const plan = this.autoClosePlan(record, policy, organizationTimezone, now);
    if (!plan) return { closed: false, warningQueued: false };

    let warningQueued = false;
    const untilDueMinutes =
      (plan.dueAt.getTime() - now.getTime()) / (60 * 1000);
    if (
      record.autoCloseWarningSentAt == null &&
      untilDueMinutes > 0 &&
      untilDueMinutes <= AUTO_CLOSE_WARNING_MINUTES
    ) {
      const marked = await this.prisma.hrAttendanceRecord.updateMany({
        where: {
          id: record.id,
          checkOutAt: null,
          autoCloseWarningSentAt: null,
        },
        data: { autoCloseWarningSentAt: now },
      });
      if (marked.count) {
        warningQueued = true;
        await this.queueAttendanceNotification(record, 'attendance.missed_checkout_warning', {
          attendanceRecordId: record.id,
          dueAt: plan.dueAt.toISOString(),
        });
      }
    }
    if (now.getTime() < plan.dueAt.getTime()) {
      return { closed: false, warningQueued };
    }

    const actualCheckInAt = record.actualCheckInAt ?? record.checkInAt;
    const calculatedWorkMinutes = this.durationMinutes(
      actualCheckInAt,
      plan.checkOutAt,
    );
    const updated = await this.prisma.hrAttendanceRecord.updateMany({
      where: {
        id: record.id,
        checkOutAt: null,
        verificationStatus: {
          notIn: [
            AttendanceVerificationStatus.REJECTED,
            AttendanceVerificationStatus.FAILED,
          ],
        },
      },
      data: {
        checkOutAt: plan.checkOutAt,
        actualCheckOutAt: plan.checkOutAt,
        calculatedWorkMinutes,
        checkOutMethod: CheckOutMethod.AUTO_CLOSE,
        checkOutVerificationStatus: CheckOutVerificationStatus.AUTO_CLOSED,
        autoClosed: true,
        autoClosedAt: now,
        autoCloseReason: plan.reason,
        requiresReview: true,
        requiresManualReview: true,
        reviewReason: plan.reason,
      },
    });
    if (updated.count) {
      await this.queueAttendanceNotification(record, 'attendance.auto_closed', {
        attendanceRecordId: record.id,
        reason: plan.reason,
        checkOutAt: plan.checkOutAt.toISOString(),
      });
    }
    return { closed: updated.count > 0, warningQueued };
  }

  private autoClosePlan(record: any, policy: any, timezone: string, now = new Date()) {
    if (!policy.autoCloseOpenAttendance || !record.checkInAt) return null;
    const checkInAt = new Date(record.actualCheckInAt ?? record.checkInAt);
    if (Number.isNaN(checkInAt.getTime())) return null;
    const graceMinutes = Math.max(0, Number(policy.autoCloseGraceMinutes ?? 60));
    const staleAt = new Date(
      checkInAt.getTime() + STALE_OPEN_ATTENDANCE_MAX_HOURS * 60 * 60 * 1000,
    );
    if (record.overnightShift === true) {
      if (record.plannedCheckOutAt) {
        const dueAt = new Date(
          new Date(record.plannedCheckOutAt).getTime() + graceMinutes * 60 * 1000,
        );
        if (!Number.isNaN(dueAt.getTime())) {
          return {
            dueAt,
            checkOutAt: dueAt,
            reason: AutoCloseReason.MISSED_CHECK_OUT_AFTER_SHIFT,
          };
        }
      }
      // No schedule snapshot means no silent overnight assumption.  The
      // documented 36-hour safety limit is review-only.
      return {
        dueAt: staleAt,
        checkOutAt: staleAt,
        reason: AutoCloseReason.STALE_OPEN_RECORD,
      };
    }

    if (
      policy.regularShiftAutoCloseMode ===
        RegularShiftAutoCloseMode.PLANNED_CHECK_OUT_PLUS_GRACE &&
      record.plannedCheckOutAt
    ) {
      const dueAt = new Date(
        new Date(record.plannedCheckOutAt).getTime() + graceMinutes * 60 * 1000,
      );
      if (!Number.isNaN(dueAt.getTime())) {
        return {
          dueAt,
          checkOutAt: dueAt,
          reason: AutoCloseReason.MISSED_CHECK_OUT_AFTER_SHIFT,
        };
      }
    }

    const checkInDate = this.organizationLocalDate(checkInAt, timezone);
    const currentDate = this.organizationLocalDate(now, timezone);
    if (policy.autoCloseAtLocalMidnight && checkInDate < currentDate) {
      const endOfWorkDay = new Date(
        this.attendanceDayBounds(checkInDate, timezone).end.getTime() - 1000,
      );
      return {
        dueAt: endOfWorkDay,
        checkOutAt: endOfWorkDay,
        reason: AutoCloseReason.MISSED_CHECK_OUT_END_OF_DAY,
      };
    }

    return {
      dueAt: staleAt,
      checkOutAt: staleAt,
      reason: AutoCloseReason.STALE_OPEN_RECORD,
    };
  }

  private async queueAttendanceNotification(
    record: any,
    type: string,
    payload: Record<string, string>,
  ) {
    try {
      const notificationEvents = (this.prisma as any).notificationEvent;
      if (!notificationEvents?.create) return;
      await notificationEvents.create({
        data: {
          organizationId: record.organizationId,
          userId: record.employee?.userId ?? undefined,
          type,
          channel: 'IN_APP',
          payload,
        },
      });
    } catch {
      // Notifications are best effort; an outage must never prevent closure.
    }
  }

  private async organizationTimezoneFor(organizationId: string) {
    const organizationDelegate = (this.prisma as any).organization;
    const organization = organizationDelegate?.findUnique
      ? await organizationDelegate.findUnique({
          where: { id: organizationId },
          select: { timezone: true },
        })
      : null;
    return this.organizationTimezone(organization?.timezone);
  }

  private shortId(value: string) {
    return value.length <= 12 ? value : `${value.slice(0, 8)}…`;
  }

  private selfAttendanceEnvelope(
    record: any | null,
    employee?: { id: string },
    fallbackDate?: Date,
  ) {
    const checkInAt = record?.checkInAt ?? null;
    const checkOutAt = record?.checkOutAt ?? null;
    const verificationStatus = record?.verificationStatus ?? null;
    const terminalFailure = [
      AttendanceVerificationStatus.REJECTED,
      AttendanceVerificationStatus.FAILED,
    ].includes(verificationStatus);
    return {
      id: record?.id ?? null,
      date: this.dateOnly(record?.date ?? fallbackDate ?? new Date()),
      employeeId: record?.employeeId ?? employee?.id ?? null,
      checkInAt,
      checkOutAt,
      actualCheckInAt: record?.actualCheckInAt ?? checkInAt,
      actualCheckOutAt: record?.actualCheckOutAt ?? checkOutAt,
      status: record?.status ?? null,
      note: record?.note ?? null,
      verificationStatus,
      verificationFailureReasons: record?.verificationFailureReasons ?? [],
      dvrVerificationStatus:
        record?.dvrVerificationStatus ?? DvrVerificationStatus.NOT_REQUIRED,
      dvrReferenceId: record?.dvrReferenceId ?? null,
      attendanceSource: record?.attendanceSource ?? null,
      branchId: record?.branchId ?? null,
      minutesLate: record?.minutesLate ?? null,
      lateLevel: record?.lateLevel ?? null,
      penaltyType: record?.penaltyType ?? null,
      penaltyValue: record?.penaltyValue ?? null,
      requiresReview: Boolean(record?.requiresReview),
      requiresManualReview: Boolean(record?.requiresManualReview),
      reviewReason: record?.reviewReason ?? null,
      checkOutMethod: record?.checkOutMethod ?? null,
      checkOutVerificationStatus: record?.checkOutVerificationStatus ?? null,
      autoClosed: Boolean(record?.autoClosed),
      autoClosedAt: record?.autoClosedAt ?? null,
      autoCloseReason: record?.autoCloseReason ?? null,
      plannedCheckOutAt: record?.plannedCheckOutAt ?? null,
      calculatedWorkMinutes: record?.calculatedWorkMinutes ?? null,
      approvedWorkMinutes: record?.approvedWorkMinutes ?? null,
      checkInLatitude: record?.checkInLatitude ?? null,
      checkInLongitude: record?.checkInLongitude ?? null,
      checkOutLatitude: record?.checkOutLatitude ?? null,
      checkOutLongitude: record?.checkOutLongitude ?? null,
      checkInWifiSsid: record?.checkInWifiSsid ?? null,
      checkInWifiBssid: record?.checkInWifiBssid ?? null,
      checkOutWifiSsid: record?.checkOutWifiSsid ?? null,
      checkOutWifiBssid: record?.checkOutWifiBssid ?? null,
      checkInPhotoFileId: record?.checkInPhotoFileId ?? null,
      checkOutPhotoFileId: record?.checkOutPhotoFileId ?? null,
      referenceImageId: record?.referenceImageId ?? null,
      capturedImageId: record?.capturedImageId ?? null,
      faceVerificationProvider: record?.faceVerificationProvider ?? null,
      faceVerificationConfidence: record?.faceVerificationConfidence ?? null,
      faceVerificationStatus: record?.faceVerificationStatus ?? AttendanceFaceVerificationStatus.NOT_REQUIRED,
      faceVerificationRejectionReason: record?.faceVerificationRejectionReason ?? null,
      canCheckIn: !checkInAt || Boolean(checkOutAt) || terminalFailure,
      canCheckOut: Boolean(checkInAt && !checkOutAt && !terminalFailure),
      durationMinutes:
        record?.calculatedWorkMinutes ??
        this.durationMinutes(checkInAt, checkOutAt),
    };
  }

  private durationMinutes(
    checkInAt?: Date | string | null,
    checkOutAt?: Date | string | null,
  ) {
    if (!checkInAt || !checkOutAt) return null;
    const start = new Date(checkInAt).getTime();
    const end = new Date(checkOutAt).getTime();
    if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
    return Math.round((end - start) / 60000);
  }

  private dateOnly(value: Date | string) {
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime())
      ? String(value).slice(0, 10)
      : date.toISOString().slice(0, 10);
  }

  private mergeNote(existing: string | null | undefined, next: unknown) {
    const note = this.optional(next);
    if (!note) return existing;
    return existing ? `${existing}\n${note}`.slice(0, 2000) : note;
  }

  /** Central schedule resolver. Historical records use its saved snapshot, never a later schedule edit. */
  async resolveEffectiveAttendanceSchedule(
    input: { organizationId: string; employeeId: string; attendanceDate: Date; timezone?: string },
    employee?: any,
    policy?: any,
  ) {
    const currentEmployee = employee ?? await this.prisma.hrEmployee.findFirstOrThrow({ where: { id: input.employeeId, organizationId: input.organizationId } });
    const effectiveAt = input.attendanceDate;
    const mode = currentEmployee.attendanceScheduleMode ?? AttendanceScheduleMode.ORGANIZATION_DEFAULT;
    const activePeriod = { isActive: true, effectiveFrom: { lte: effectiveAt }, OR: [{ effectiveTo: null }, { effectiveTo: { gte: effectiveAt } }] };
    const override = mode === AttendanceScheduleMode.EMPLOYEE_OVERRIDE && this.prisma.hrEmployeeAttendanceScheduleOverride
      ? await this.prisma.hrEmployeeAttendanceScheduleOverride.findFirst({ where: { organizationId: input.organizationId, employeeId: input.employeeId, ...activePeriod }, orderBy: { effectiveFrom: 'desc' } })
      : null;
    const assigned = !override && currentEmployee.attendanceScheduleId && this.prisma.hrAttendanceSchedule
      ? await this.prisma.hrAttendanceSchedule.findFirst({ where: { id: currentEmployee.attendanceScheduleId, organizationId: input.organizationId, ...activePeriod } })
      : null;
    const schedule = override ?? assigned;
    const scheduleSource = override ? AttendanceScheduleMode.EMPLOYEE_OVERRIDE : assigned ? AttendanceScheduleMode.ASSIGNED_SCHEDULE : AttendanceScheduleMode.ORGANIZATION_DEFAULT;
    // An invalid/missing employee override deliberately falls back; callers can
    // surface this warning without preventing a legitimate attendance action.
    const configurationWarning = mode === AttendanceScheduleMode.EMPLOYEE_OVERRIDE && !override
      ? 'EMPLOYEE_OVERRIDE_NOT_EFFECTIVE_FALLBACK_USED'
      : mode === AttendanceScheduleMode.ASSIGNED_SCHEDULE && !assigned
        ? 'ASSIGNED_SCHEDULE_NOT_EFFECTIVE_FALLBACK_USED'
        : null;
    const timezone = this.attendanceTimezone(schedule?.timezone ?? input.timezone ?? 'UTC');
    const workDate = this.zonedWorkDate(input.attendanceDate, timezone);
    const weekday = workDate.getUTCDay();
    const storedRules: any = schedule?.weeklyRules;
    const hasStoredRules = Array.isArray(storedRules) || Boolean(storedRules && typeof storedRules === 'object');
    const rules: any = Array.isArray(storedRules)
      ? Object.fromEntries(storedRules.map((rule: any) => [String(rule.dayOfWeek), rule]))
      : storedRules ?? {};
    const organizationDefaultRule = { isWorkingDay: true, startTime: policy?.workStartTime ?? '11:15', endTime: policy?.workEndTime ?? '19:00', lateUntilMinutes: Number(policy?.firstLateSliceMinutes ?? 15), severeLateUntilMinutes: Number(policy?.secondLateSliceMinutes ?? 60), absentAfterMinutes: Number(policy?.secondLateSliceMinutes ?? 60), earlyLeaveGraceMinutes: Number(policy?.gracePeriodMinutes ?? 0), overnightShift: false };
    const rule = hasStoredRules ? (rules[String(weekday)] ?? rules[weekday] ?? null) : organizationDefaultRule;
    if (!rule || rule.isWorkingDay === false) {
      return { source: scheduleSource, scheduleSource, scheduleId: schedule?.id ?? null, timezone, workDate, plannedCheckIn: null, plannedCheckOut: null, plannedCheckInAt: null, plannedCheckOutAt: null, lateUntilAt: null, severeLateUntilAt: null, absentAfterAt: null, graceMinutes: 0, earlyLeaveMinutes: 0, isWorkingDay: false, overnightShift: false, expectedWorkMinutes: 0, configurationWarning };
    }
    // Organization defaults are the established attendance-policy fallback.
    // They predate weekly-rule validation and may contain legacy overnight-like
    // hours, so only persisted weekly rules are validated as strict schedules.
    if (hasStoredRules) this.assertAttendanceRule(rule);
    const start = String(rule.startTime);
    const end = String(rule.endTime);
    const overnightShift = Boolean(rule.overnightShift);
    const plannedCheckIn = this.scheduleDateTime(workDate, start, 0, timezone);
    const plannedCheckOut = this.scheduleDateTime(workDate, end, overnightShift ? 1 : 0, timezone);
    const expectedWorkMinutes = Math.max(0, Math.round((plannedCheckOut.getTime() - plannedCheckIn.getTime()) / 60000) - Number(rule.breakMinutes ?? 0));
    const lateUntilMinutes = Number(rule.lateUntilMinutes);
    const severeLateUntilMinutes = Number(rule.severeLateUntilMinutes);
    const absentAfterMinutes = Number(rule.absentAfterMinutes);
    return { source: scheduleSource, scheduleSource, scheduleId: schedule?.id ?? null, timezone, workDate, plannedCheckIn, plannedCheckOut, plannedCheckInAt: plannedCheckIn, plannedCheckOutAt: plannedCheckOut, lateUntilAt: new Date(plannedCheckIn.getTime() + lateUntilMinutes * 60000), severeLateUntilAt: new Date(plannedCheckIn.getTime() + severeLateUntilMinutes * 60000), absentAfterAt: new Date(plannedCheckIn.getTime() + absentAfterMinutes * 60000), graceMinutes: Number(rule.earlyLeaveGraceMinutes ?? 0), earlyLeaveMinutes: Number(rule.earlyLeaveGraceMinutes ?? 0), isWorkingDay: true, overnightShift, expectedWorkMinutes, configurationWarning };
  }

  private scheduleDateTime(date: Date, time: string, dayOffset = 0, timezone = 'UTC') {
    const [hours, minutes] = time.split(':').map(Number);
    const local = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + dayOffset, hours || 0, minutes || 0, 0, 0);
    let result = new Date(local);
    // Two iterations account for the offset at the target instant (including DST).
    for (let index = 0; index < 2; index += 1) result = new Date(local - this.timezoneOffsetMilliseconds(result, timezone));
    return result;
  }

  private calculateScheduleLatePenalty(checkInAt: Date, schedule: any, policy: any) {
    if (schedule.source === AttendanceScheduleMode.ORGANIZATION_DEFAULT) {
      const legacy = this.calculateLatePenalty(schedule.plannedCheckIn, checkInAt, policy);
      return { ...legacy, attendanceStatus: legacy.minutesLate > 0 ? HrAttendanceStatus.LATE : HrAttendanceStatus.PRESENT };
    }
    if (!schedule.isWorkingDay) return { minutesLate: 0, attendanceStatus: HrAttendanceStatus.PRESENT, lateLevel: AttendanceLateLevel.ON_TIME, penaltyType: AttendancePenaltyType.NONE, penaltyValue: null, requiresReview: false };
    const minutesLate = Math.max(0, Math.round((checkInAt.getTime() - schedule.plannedCheckIn.getTime()) / 60000));
    const attendanceStatus = minutesLate <= 0 ? HrAttendanceStatus.PRESENT : checkInAt.getTime() <= schedule.lateUntilAt.getTime() ? HrAttendanceStatus.LATE : checkInAt.getTime() <= schedule.absentAfterAt.getTime() ? HrAttendanceStatus.SEVERE_LATE : HrAttendanceStatus.ABSENT;
    if (attendanceStatus === HrAttendanceStatus.PRESENT) return { minutesLate, attendanceStatus, lateLevel: minutesLate ? AttendanceLateLevel.GRACE : AttendanceLateLevel.ON_TIME, penaltyType: AttendancePenaltyType.NONE, penaltyValue: null, requiresReview: false };
    const plannedStart = `${String(schedule.plannedCheckIn.getUTCHours()).padStart(2, '0')}:${String(schedule.plannedCheckIn.getUTCMinutes()).padStart(2, '0')}`;
    return { ...this.calculateLatePenalty(schedule.plannedCheckIn, checkInAt, { ...policy, workStartTime: plannedStart, gracePeriodMinutes: 0 }), attendanceStatus };
  }

  private assertAttendanceRule(rule: any) {
    if (rule.isWorkingDay === false) return;
    if (typeof rule.startTime !== 'string' || typeof rule.endTime !== 'string') throw new BadRequestException('Working days require startTime and endTime.');
    const values = ['lateUntilMinutes', 'severeLateUntilMinutes', 'absentAfterMinutes', 'earlyLeaveGraceMinutes'].map((key) => Number(rule[key]));
    if (values.some((value) => !Number.isFinite(value) || value < 0) || values[0] >= values[1] || values[1] > values[2]) throw new BadRequestException('Attendance thresholds must satisfy 0 <= late < severe <= absent.');
    const start = String(rule.startTime); const end = String(rule.endTime);
    if (!this.isAttendanceTime(start) || !this.isAttendanceTime(end) || (end <= start && !rule.overnightShift)) throw new BadRequestException('Invalid attendance time range.');
  }

  private attendanceTimezone(value: unknown) {
    const timezone = typeof value === 'string' && value.trim() ? value.trim() : null;
    if (!timezone) throw new BadRequestException('timezone is required.');
    try { new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(); } catch { throw new BadRequestException('timezone must be a valid IANA timezone.'); }
    return timezone;
  }

  private organizationTimezone(value: unknown) {
    if (typeof value !== 'string' || !value.trim()) return 'UTC';
    try { return this.attendanceTimezone(value); } catch { return 'UTC'; }
  }

  private attendanceListDate(value: unknown, timezone: string) {
    if (value === undefined || value === null || value === '') return this.organizationLocalDate(new Date(), timezone);
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new BadRequestException('date must be YYYY-MM-DD.');
    const [year, month, day] = value.split('-').map(Number);
    const candidate = new Date(Date.UTC(year, month - 1, day));
    if (candidate.getUTCFullYear() !== year || candidate.getUTCMonth() !== month - 1 || candidate.getUTCDate() !== day) throw new BadRequestException('date must be a valid calendar date.');
    return value;
  }

  private organizationLocalDate(value: Date, timezone: string) {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(value);
    const item = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
    return `${item('year')}-${item('month')}-${item('day')}`;
  }

  private previousDate(value: string) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day - 1)).toISOString().slice(0, 10);
  }

  private attendanceDayBounds(date: string, timezone: string) {
    const [year, month, day] = date.split('-').map(Number);
    const localDate = new Date(Date.UTC(year, month - 1, day));
    const start = this.scheduleDateTime(localDate, '00:00', 0, timezone);
    const end = this.scheduleDateTime(localDate, '00:00', 1, timezone);
    return { start, end };
  }

  private isAttendanceTime(value: string) {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return false;
    return true;
  }

  private zonedWorkDate(value: Date, timezone: string) {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(value);
    const part = (type: string) => Number(parts.find((item) => item.type === type)?.value);
    return new Date(Date.UTC(part('year'), part('month') - 1, part('day')));
  }

  private timezoneOffsetMilliseconds(value: Date, timezone: string) {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(value);
    const part = (type: string) => Number(parts.find((item) => item.type === type)?.value);
    return Date.UTC(part('year'), part('month') - 1, part('day'), part('hour'), part('minute'), part('second')) - value.getTime();
  }

  private calculateLatePenalty(date: Date, checkInAt: Date, policy: any) {
    const [hours, minutes] = String(policy.workStartTime ?? '11:15')
      .split(':')
      .map(Number);
    const scheduled = new Date(date);
    scheduled.setHours(Number.isFinite(hours) ? hours : 11, Number.isFinite(minutes) ? minutes : 15, 0, 0);
    const minutesLate = Math.max(
      0,
      Math.round((checkInAt.getTime() - scheduled.getTime()) / 60000),
    );
    const grace = Number(policy.gracePeriodMinutes ?? 10);
    const first = Number(policy.firstLateSliceMinutes ?? 15);
    const second = Number(policy.secondLateSliceMinutes ?? 30);

    if (minutesLate === 0) {
      return {
        minutesLate,
        lateLevel: AttendanceLateLevel.ON_TIME,
        penaltyType: AttendancePenaltyType.NONE,
        penaltyValue: null,
        requiresReview: false,
      };
    }
    if (minutesLate <= grace) {
      return {
        minutesLate,
        lateLevel: AttendanceLateLevel.GRACE,
        penaltyType: AttendancePenaltyType.NONE,
        penaltyValue: null,
        requiresReview: false,
      };
    }
    if (minutesLate <= grace + first) {
      return {
        minutesLate,
        lateLevel: AttendanceLateLevel.FIRST_SLICE,
        penaltyType: policy.firstLatePenaltyType ?? AttendancePenaltyType.MARK_LATE,
        penaltyValue: policy.firstLatePenaltyValue ?? null,
        requiresReview: policy.firstLatePenaltyType === AttendancePenaltyType.MANUAL_REVIEW,
      };
    }
    if (minutesLate <= grace + first + second) {
      return {
        minutesLate,
        lateLevel: AttendanceLateLevel.SECOND_SLICE,
        penaltyType: policy.secondLatePenaltyType ?? AttendancePenaltyType.MANUAL_REVIEW,
        penaltyValue: policy.secondLatePenaltyValue ?? null,
        requiresReview: true,
      };
    }
    return {
      minutesLate,
      lateLevel: AttendanceLateLevel.BEYOND_SECOND,
      penaltyType:
        policy.beyondSecondSlicePenaltyType ?? AttendancePenaltyType.MANUAL_REVIEW,
      penaltyValue: null,
      requiresReview: true,
    };
  }

  private async attendancePolicy(organizationId: string) {
    const settings =
      await this.prisma.organizationAttendanceSettings.findUnique({
        where: { organizationId },
      });

    return (
      settings ?? {
        requireLocation: false,
        allowedLatitude: null,
        allowedLongitude: null,
        allowedRadiusMeters: null,
        exactRadiusMeters: 30,
        expandedRadiusMeters: 1000,
        gracePeriodMinutes: 10,
        firstLateSliceMinutes: 15,
        firstLatePenaltyType: AttendancePenaltyType.MARK_LATE,
        firstLatePenaltyValue: null,
        secondLateSliceMinutes: 30,
        secondLatePenaltyType: AttendancePenaltyType.MANUAL_REVIEW,
        secondLatePenaltyValue: null,
        beyondSecondSlicePenaltyType: AttendancePenaltyType.MANUAL_REVIEW,
        requireWifi: false,
        allowedWifiSsids: [],
        allowedWifiBssids: [],
        blockDeveloperOptions: true,
        blockUsbDebugging: true,
        requirePhoto: false,
        maxGpsAccuracyMeters: null,
        firstAttendancePhotoRequiresApproval: true,
        requireFaceVerification: false,
        requireDvrReview: false,
        allowWebCheckIn: true,
        allowMobileCheckIn: true,
        allowExpandedRadiusWithReview: true,
        webWifiPolicy: WebWifiPolicy.MANUAL_REVIEW,
        workStartTime: '11:15',
        workEndTime: '19:00',
        monthlyLateAllowanceHours: 4,
        lateAllowanceChargeHoursPerDay: 1,
        missingAttendanceDisposition: MissingAttendanceDisposition.ABSENT,
        autoCloseOpenAttendance: true,
        regularShiftAutoCloseMode: RegularShiftAutoCloseMode.END_OF_WORK_DAY,
        autoCloseGraceMinutes: 60,
        autoCloseAtLocalMidnight: true,
        checkOutOutsideLocationPolicy: CheckOutOutsideLocationPolicy.BLOCK,
      }
    );
  }

  private async evaluateAttendanceVerification(
    input: any,
    policy: any,
    phase: 'checkIn' | 'checkOut',
    user: AuthenticatedRequestUser,
  ) {
    const reasons: string[] = [];
    const latitude = this.optionalNumber(input.latitude);
    const longitude = this.optionalNumber(input.longitude);
    const locationAccuracyMeters = this.optionalNumber(
      input.locationAccuracyMeters ?? input.accuracy,
    );
    const wifiSsid = this.optional(input.wifiSsid);
    const wifiBssid = normalizeWifiId(this.optional(input.wifiBssid));
    const photoFileId = this.optional(
      input.photoFileId ??
        input[
          phase === 'checkIn' ? 'checkInPhotoFileId' : 'checkOutPhotoFileId'
        ],
    );
    const isWeb = this.optional(input.clientPlatform)?.toUpperCase() === 'WEB' || !this.optional(input.clientPlatform);
    const developerOptionsEnabled = input.developerOptionsEnabled === true;
    const usbDebuggingEnabled = input.usbDebuggingEnabled === true;

    if (policy.blockDeveloperOptions && developerOptionsEnabled) {
      reasons.push('DEVELOPER_OPTIONS_ENABLED');
    }
    if (policy.blockUsbDebugging && usbDebuggingEnabled) {
      reasons.push('USB_DEBUGGING_ENABLED');
    }
    if (policy.allowWebCheckIn === false && isWeb) {
      reasons.push('WEB_CHECK_IN_NOT_ALLOWED');
    }
    const locationDecision = await this.attendanceLocationDecision(
      input,
      policy,
      user.organizationId!,
      phase,
    );
    reasons.push(...locationDecision.blockingReasons);
    if (
      phase === 'checkOut' &&
      locationDecision.mode !== 'EXACT' &&
      locationDecision.mode !== 'LOCATION_NOT_REQUIRED'
    ) {
      const outsidePolicy =
        policy.checkOutOutsideLocationPolicy ??
        CheckOutOutsideLocationPolicy.BLOCK;
      if (outsidePolicy === CheckOutOutsideLocationPolicy.BLOCK) {
        reasons.push('OUTSIDE_ALLOWED_LOCATION');
      } else if (outsidePolicy === CheckOutOutsideLocationPolicy.MANUAL_REVIEW) {
        reasons.push('CHECK_OUT_OUTSIDE_LOCATION_REVIEW');
      } else {
        reasons.push('CHECK_OUT_OUTSIDE_LOCATION_EVIDENCE');
        if (!photoFileId) reasons.push('PHOTO_REQUIRED');
      }
    }
    if (policy.requireWifi) {
      if (isWeb) {
        if (policy.webWifiPolicy === WebWifiPolicy.BLOCK) {
          reasons.push('WEB_WIFI_NOT_AVAILABLE');
        } else if (policy.webWifiPolicy === WebWifiPolicy.MANUAL_REVIEW) {
          reasons.push('WEB_WIFI_MANUAL_REVIEW');
        }
      }
      const allowedSsids = new Set(
        (policy.allowedWifiSsids ?? [])
          .map((value: string) => value.trim())
          .filter(Boolean),
      );
      const allowedBssids = new Set(
        (policy.allowedWifiBssids ?? [])
          .map((value: string) => normalizeWifiId(value))
          .filter(Boolean),
      );
      const ssidAllowed = Boolean(wifiSsid && allowedSsids.has(wifiSsid));
      const bssidAllowed = Boolean(wifiBssid && allowedBssids.has(wifiBssid));
      if (isWeb && policy.webWifiPolicy !== WebWifiPolicy.BLOCK) {
        // Browsers cannot reliably expose SSID/BSSID; policy above decides review behavior.
      } else if (!wifiSsid && !wifiBssid) {
        reasons.push('WIFI_REQUIRED');
      } else if (!ssidAllowed && !bssidAllowed) {
        reasons.push('WIFI_NOT_ALLOWED');
      }
    }
    if (policy.requirePhoto && !photoFileId) {
      reasons.push('PHOTO_REQUIRED');
    } else if (photoFileId) {
      if (!this.filesService) {
        reasons.push('PHOTO_FILE_NOT_FOUND');
      } else {
        const photoFailure =
          await this.filesService.validateAttendanceEvidencePhoto(
            photoFileId,
            user,
          );
        if (photoFailure) reasons.push(photoFailure);
      }
    }

    const dvrStatus = policy.requireDvrReview
      ? DvrVerificationStatus.PENDING
      : DvrVerificationStatus.NOT_REQUIRED;
    const reviewReasons = new Set([
      'EXPANDED_LOCATION_REVIEW',
      'WEB_WIFI_MANUAL_REVIEW',
      'CHECK_OUT_OUTSIDE_LOCATION_REVIEW',
      'CHECK_OUT_OUTSIDE_LOCATION_EVIDENCE',
    ]);
    const hardFailures = reasons.filter((reason) => !reviewReasons.has(reason));
    const status = hardFailures.length
      ? AttendanceVerificationStatus.REJECTED
      : reasons.length
        ? AttendanceVerificationStatus.PENDING_REVIEW
      : policy.requireDvrReview
        ? AttendanceVerificationStatus.PENDING_REVIEW
        : AttendanceVerificationStatus.VERIFIED;

    return {
      status,
      dvrStatus,
      reasons,
      reject: hardFailures.length > 0,
    };
  }

  private attendanceEvidenceData(input: any, phase: 'checkIn' | 'checkOut') {
    const prefix = phase === 'checkIn' ? 'checkIn' : 'checkOut';
    return {
      [`${prefix}Latitude`]: this.optionalNumber(input.latitude),
      [`${prefix}Longitude`]: this.optionalNumber(input.longitude),
      [`${prefix}LocationAccuracyMeters`]: this.optionalNumber(
        input.locationAccuracyMeters ?? input.accuracy,
      ),
      [`${prefix}LocationCapturedAt`]: this.safeDate(input.locationCapturedAt),
      [`${prefix}WifiSsid`]: this.optional(input.wifiSsid),
      [`${prefix}WifiBssid`]: normalizeWifiId(this.optional(input.wifiBssid)),
      [`${prefix}PhotoFileId`]: this.optional(
        input.photoFileId ?? input[`${prefix}PhotoFileId`],
      ),
      [`${prefix}DeviceId`]: this.optional(input.deviceId),
      developerOptionsEnabled:
        typeof input.developerOptionsEnabled === 'boolean'
          ? input.developerOptionsEnabled
          : undefined,
      usbDebuggingEnabled:
        typeof input.usbDebuggingEnabled === 'boolean'
          ? input.usbDebuggingEnabled
          : undefined,
    };
  }

  private mergeVerificationStatus(
    current: unknown,
    next: AttendanceVerificationStatus,
  ) {
    if (
      next === AttendanceVerificationStatus.REJECTED ||
      next === AttendanceVerificationStatus.FAILED
    )
      return next;
    if (
      current === AttendanceVerificationStatus.REJECTED ||
      current === AttendanceVerificationStatus.FAILED
    )
      return current as AttendanceVerificationStatus;
    if (
      current === AttendanceVerificationStatus.PENDING_REVIEW ||
      next === AttendanceVerificationStatus.PENDING_REVIEW
    )
      return AttendanceVerificationStatus.PENDING_REVIEW;
    return AttendanceVerificationStatus.VERIFIED;
  }

  private mergeDvrStatus(current: unknown, next: DvrVerificationStatus) {
    if (next !== DvrVerificationStatus.NOT_REQUIRED) return next;
    return (
      (current as DvrVerificationStatus | null) ??
      DvrVerificationStatus.NOT_REQUIRED
    );
  }

  private mergeFailureReasons(current: unknown, next: string[]) {
    const existing = Array.isArray(current) ? current.map(String) : [];
    const merged = [...new Set([...existing, ...next])];
    return merged.length ? merged : undefined;
  }

  private optionalJsonArray(value: unknown): Prisma.InputJsonValue | undefined {
    if (!Array.isArray(value)) return undefined;
    return value.map((item) => String(item)).filter(Boolean);
  }

  private optionalNumber(value: unknown) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      const number = Number(value);
      if (Number.isFinite(number)) return number;
    }
    return undefined;
  }

  private async attendanceLocationDecision(
    input: any,
    policy: any,
    organizationId: string,
    phase: 'checkIn' | 'checkOut' = 'checkIn',
  ) {
    const latitude = this.optionalNumber(input.latitude);
    const longitude = this.optionalNumber(input.longitude);
    const accuracy = this.optionalNumber(input.locationAccuracyMeters ?? input.accuracyMeters);
    const capturedAt = this.safeDate(input.locationCapturedAt ?? input.capturedAt);
    if (!policy.requireLocation) return { blockingReasons: [] as string[], source: null, distanceMeters: null, allowedRadiusMeters: null, exactRadiusMeters: null, expandedRadiusMeters: null, matchedLocationId: null, matchedLocationName: null, mode: 'LOCATION_NOT_REQUIRED' };
    const reasons: string[] = [];
    if (latitude === undefined || longitude === undefined || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) reasons.push('LOCATION_REQUIRED');
    // Check-out is a final security decision, not a continuation of preflight:
    // it requires a fresh capture. Check-in retains old-client compatibility.
    if (phase === 'checkOut' && !capturedAt) reasons.push('LOCATION_STALE');
    if (capturedAt && (Date.now() - capturedAt.getTime() > 10 * 60 * 1000 || capturedAt.getTime() - Date.now() > 60 * 1000)) reasons.push('LOCATION_STALE');
    if (accuracy !== undefined && accuracy < 0) reasons.push('GPS_ACCURACY_TOO_LOW');
    if (policy.maxGpsAccuracyMeters && (accuracy === undefined || accuracy > policy.maxGpsAccuracyMeters)) reasons.push('GPS_ACCURACY_TOO_LOW');
    const isWeb = this.optional(input.clientPlatform)?.toUpperCase() === 'WEB' || !this.optional(input.clientPlatform);
    const branchId = this.optional(input.branchId);
    const attendanceLocationId = this.optional(input.attendanceLocationId);
    if (branchId) {
      const branch = await this.prisma.organizationBranch.findFirst({ where: { id: branchId, organizationId, isActive: true }, select: { id: true } });
      if (!branch) reasons.push('BRANCH_NOT_ALLOWED');
    }
    const configuredLocations = await this.prisma.organizationAttendanceLocation.findMany({
      where: { organizationId, isActive: true, ...(isWeb ? { allowedForWeb: true } : { allowedForMobile: true }), ...(attendanceLocationId ? { id: attendanceLocationId } : {}), ...(branchId && !reasons.includes('BRANCH_NOT_ALLOWED') ? { officeId: branchId } : {}) },
      select: { id: true, name: true, latitude: true, longitude: true, exactRadiusMeters: true, expandedRadiusMeters: true, requiresReviewOutsideExactRadius: true },
    });
    const locations = configuredLocations.filter((location) =>
      Number.isFinite(location.latitude) &&
      Number.isFinite(location.longitude) &&
      location.latitude >= -90 &&
      location.latitude <= 90 &&
      location.longitude >= -180 &&
      location.longitude <= 180 &&
      Number.isFinite(location.exactRadiusMeters) &&
      Number.isFinite(location.expandedRadiusMeters) &&
      location.exactRadiusMeters > 0 &&
      location.expandedRadiusMeters >= location.exactRadiusMeters,
    );
    if (attendanceLocationId && !locations.length) {
      reasons.push('ATTENDANCE_LOCATION_NOT_ALLOWED');
      return { blockingReasons: [...new Set(reasons)], source: 'ATTENDANCE_LOCATION', distanceMeters: null, allowedRadiusMeters: null, exactRadiusMeters: null, expandedRadiusMeters: null, matchedLocationId: null, matchedLocationName: null, mode: 'OUTSIDE' };
    }
    // Deprecated organization settings are used only for tenants with no valid Attendance Location.
    const candidates = locations.length ? locations : (typeof policy.allowedLatitude === 'number' && typeof policy.allowedLongitude === 'number'
      ? [{ id: null, name: null, latitude: policy.allowedLatitude, longitude: policy.allowedLongitude, exactRadiusMeters: Number(policy.exactRadiusMeters ?? policy.allowedRadiusMeters ?? 30), expandedRadiusMeters: Number(policy.expandedRadiusMeters ?? policy.allowedRadiusMeters ?? 1000), requiresReviewOutsideExactRadius: Boolean(policy.allowExpandedRadiusWithReview) }]
      : []);
    const source = locations.length ? 'ATTENDANCE_LOCATION' : candidates.length ? 'LEGACY_SETTINGS' : null;
    if (!candidates.length) {
      reasons.push('ATTENDANCE_LOCATION_NOT_CONFIGURED');
      return { blockingReasons: [...new Set(reasons)], source, distanceMeters: null, allowedRadiusMeters: null, exactRadiusMeters: null, expandedRadiusMeters: null, matchedLocationId: null, matchedLocationName: null, mode: 'OUTSIDE' };
    }
    if (latitude === undefined || longitude === undefined || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return { blockingReasons: [...new Set(reasons)], source, distanceMeters: null, allowedRadiusMeters: null, exactRadiusMeters: null, expandedRadiusMeters: null, matchedLocationId: null, matchedLocationName: null, mode: 'OUTSIDE' };
    const nearest = candidates.map((location) => ({ location, distance: distanceMeters(latitude, longitude, location.latitude, location.longitude) })).sort((a, b) => a.distance - b.distance)[0];
    const { location, distance } = nearest;
    if (phase === 'checkIn') {
      if (distance > location.expandedRadiusMeters || (distance > location.exactRadiusMeters && !location.requiresReviewOutsideExactRadius)) reasons.push('OUTSIDE_ALLOWED_LOCATION');
      if (distance > location.exactRadiusMeters && distance <= location.expandedRadiusMeters && location.requiresReviewOutsideExactRadius) reasons.push('EXPANDED_LOCATION_REVIEW');
    }
    const mode = distance <= location.exactRadiusMeters ? 'EXACT' : distance <= location.expandedRadiusMeters ? 'EXPANDED_REVIEW' : 'OUTSIDE';
    return { blockingReasons: [...new Set(reasons)], source, distanceMeters: Math.round(distance), allowedRadiusMeters: location.exactRadiusMeters, exactRadiusMeters: location.exactRadiusMeters, expandedRadiusMeters: location.expandedRadiusMeters, matchedLocationId: location.id, matchedLocationName: location.name, mode };
  }

  private safeDate(value: unknown) {
    if (typeof value !== 'string' && !(value instanceof Date)) return undefined;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  /** Provider boundary. No biometric provider is configured in this release, so
   * reference-backed photos deliberately remain in HR manual review. */
  private async prepareAttendanceFaceVerification(employee: any, photoFileId: string | undefined, policy: any) {
    if (!photoFileId) return { status: AttendanceFaceVerificationStatus.NOT_REQUIRED, provider: null, referenceImageId: null, createReferenceCandidate: false };
    const reference = this.prisma.employeeAttendanceReferencePhoto
      ? await this.prisma.employeeAttendanceReferencePhoto.findFirst({
      where: { employeeId: employee.id, status: AttendanceReferencePhotoStatus.APPROVED_REFERENCE },
      orderBy: { approvedAt: 'desc' },
    })
      : null;
    if (!reference) {
      return { status: AttendanceFaceVerificationStatus.PENDING, provider: 'MANUAL', referenceImageId: null, createReferenceCandidate: true };
    }
    return {
      status: policy.requireFaceVerification
        ? AttendanceFaceVerificationStatus.MANUAL_REVIEW_REQUIRED
        : AttendanceFaceVerificationStatus.NOT_REQUIRED,
      provider: policy.requireFaceVerification ? 'MANUAL' : null,
      referenceImageId: reference.fileId,
      createReferenceCandidate: false,
    };
  }

  private positiveInt(value: unknown, fallback: number) {
    const number = this.optionalNumber(value);
    if (number === undefined) return fallback;
    return Math.max(1, Math.round(number));
  }

  private optionalPositiveInt(value: unknown, field: string) {
    if (value === undefined || value === null || value === '') return undefined;
    const number = this.optionalNumber(value);
    if (number === undefined || number <= 0) {
      throw new BadRequestException(`${field} must be greater than zero.`);
    }
    return Math.round(number);
  }

  private nonNegativeInt(value: unknown, fallback: number) {
    const number = this.optionalNumber(value);
    if (number === undefined) return fallback;
    return Math.max(0, Math.round(number));
  }

  private stringList(value: unknown) {
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean);
    }
    if (typeof value === 'string') {
      return value
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  }

  private timeValue(value: unknown, fallback: string) {
    const text = this.optional(value);
    if (!text) return fallback;
    if (!text.match(/^\d{2}:\d{2}$/)) {
      throw new BadRequestException('time must use HH:mm format.');
    }
    return text;
  }

  private attendanceMetadata(
    input: any,
    verification?: {
      status: AttendanceVerificationStatus;
      dvrStatus: DvrVerificationStatus;
      reasons: string[];
    },
  ): Prisma.InputJsonValue | undefined {
    const metadata: Record<string, string | number | boolean | string[]> = {};
    if (typeof input.latitude === 'number') metadata.latitude = input.latitude;
    if (typeof input.longitude === 'number')
      metadata.longitude = input.longitude;
    if (typeof input.deviceId === 'string' && input.deviceId.trim())
      metadata.deviceId = input.deviceId.trim().slice(0, 120);
    if (typeof input.wifiSsid === 'string' && input.wifiSsid.trim())
      metadata.wifiSsid = input.wifiSsid.trim().slice(0, 120);
    if (typeof input.wifiBssid === 'string' && input.wifiBssid.trim())
      metadata.wifiBssid = normalizeWifiId(input.wifiBssid) ?? '';
    if (typeof input.photoFileId === 'string' && input.photoFileId.trim())
      metadata.photoFileId = input.photoFileId.trim().slice(0, 120);
    if (typeof input.developerOptionsEnabled === 'boolean')
      metadata.developerOptionsEnabled = input.developerOptionsEnabled;
    if (typeof input.usbDebuggingEnabled === 'boolean')
      metadata.usbDebuggingEnabled = input.usbDebuggingEnabled;
    if (verification) {
      metadata.verificationStatus = verification.status;
      metadata.dvrVerificationStatus = verification.dvrStatus;
      metadata.failureReasons = verification.reasons;
    }
    return Object.keys(metadata).length ? metadata : undefined;
  }

  private async assertExists(
    model: string,
    id: string,
    user: AuthenticatedRequestUser,
  ) {
    const delegate = (this.prisma as any)[model];
    const found = await delegate.findFirst({
      where: { id, ...operationOrganizationWhere(user) },
    });
    if (!found) throw new NotFoundException('Record not found.');
    return found;
  }

  private async findScoped(
    model: string,
    id: string,
    user: AuthenticatedRequestUser,
  ) {
    const found = await this.assertExists(model, id, user);
    return found;
  }

  private bulkIds(value: unknown, max = 100) {
    if (!Array.isArray(value))
      throw new BadRequestException('ids must be an array.');
    const ids = [
      ...new Set(
        value
          .map((item) => (typeof item === 'string' ? item.trim() : ''))
          .filter(Boolean),
      ),
    ];
    if (ids.length === 0)
      throw new BadRequestException('At least one id is required.');
    if (ids.length > max)
      throw new BadRequestException(`Bulk update supports up to ${max} ids.`);
    return ids;
  }

  private assertBulkScope(ids: string[], records: Array<{ id: string }>) {
    if (records.length !== ids.length) {
      throw new BadRequestException(
        'One or more ids are not available in the current organization scope.',
      );
    }
  }

  private booleanStatus(value: unknown) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const normalized = value.trim().toUpperCase();
      if (['ACTIVE', 'TRUE', 'ENABLED'].includes(normalized)) return true;
      if (['INACTIVE', 'FALSE', 'DISABLED'].includes(normalized)) return false;
    }
    throw new BadRequestException('status must be ACTIVE or INACTIVE.');
  }

  private dateFilter(input: any) {
    const gte = input.dateFrom ? new Date(String(input.dateFrom)) : undefined;
    const lte = input.dateTo ? new Date(String(input.dateTo)) : undefined;
    return gte || lte ? { gte, lte } : undefined;
  }

  private exportLimit(input: any) {
    return Math.min(1000, Math.max(1, Number(input.limit ?? 1000)));
  }

  private async withOptionalReportPermission(
    user: AuthenticatedRequestUser,
    permissions: string[],
    fallback: unknown,
    action: () => Promise<unknown>,
  ): Promise<any> {
    if (
      !permissions.some((permission) => user.permissions?.includes(permission))
    ) {
      return fallback;
    }
    return action();
  }

  private reportDateRange(input: any) {
    const fallbackFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const gte = input.dateFrom
      ? new Date(String(input.dateFrom))
      : fallbackFrom;
    const lte = input.dateTo ? new Date(String(input.dateTo)) : undefined;
    return lte ? { gte, lte } : { gte };
  }

  private reportGranularity(input: any): 'day' | 'week' | 'month' {
    const value = this.optional(input.granularity);
    return value === 'week' || value === 'month' ? value : 'day';
  }

  private reportFilters(input: any) {
    return {
      dateFrom: this.optional(input.dateFrom),
      dateTo: this.optional(input.dateTo),
      granularity: this.reportGranularity(input),
    };
  }

  private sumAccounting(
    rows: Array<{
      type: AccountingTransactionType;
      amount: Prisma.Decimal | number | string;
    }>,
  ) {
    return rows.reduce(
      (summary, row) => {
        const amount = Number(row.amount);
        if (row.type === AccountingTransactionType.INCOME)
          summary.income += amount;
        if (row.type === AccountingTransactionType.EXPENSE)
          summary.expense += amount;
        summary.net = summary.income - summary.expense;
        return summary;
      },
      { income: 0, expense: 0, net: 0, count: rows.length },
    );
  }

  private accountingByCategory(
    rows: Array<{
      type: AccountingTransactionType;
      amount: Prisma.Decimal | number | string;
      category?: { id: string; name: string } | null;
    }>,
  ) {
    const categories = new Map<
      string,
      {
        categoryId: string | null;
        categoryName: string;
        income: number;
        expense: number;
        net: number;
      }
    >();
    for (const row of rows) {
      const key = row.category?.id ?? 'uncategorized';
      const current = categories.get(key) ?? {
        categoryId: row.category?.id ?? null,
        categoryName: row.category?.name ?? 'Uncategorized',
        income: 0,
        expense: 0,
        net: 0,
      };
      const amount = Number(row.amount);
      if (row.type === AccountingTransactionType.INCOME)
        current.income += amount;
      if (row.type === AccountingTransactionType.EXPENSE)
        current.expense += amount;
      current.net = current.income - current.expense;
      categories.set(key, current);
    }
    return [...categories.values()];
  }

  private accountingTrend(
    rows: Array<{
      type: AccountingTransactionType;
      amount: Prisma.Decimal | number | string;
      occurredAt: Date;
    }>,
    granularity: 'day' | 'week' | 'month',
  ) {
    const buckets = new Map<
      string,
      {
        period: string;
        income: number;
        expense: number;
        net: number;
        count: number;
      }
    >();
    for (const row of rows) {
      const period = this.dateBucket(row.occurredAt, granularity);
      const current = buckets.get(period) ?? {
        period,
        income: 0,
        expense: 0,
        net: 0,
        count: 0,
      };
      const amount = Number(row.amount);
      if (row.type === AccountingTransactionType.INCOME)
        current.income += amount;
      if (row.type === AccountingTransactionType.EXPENSE)
        current.expense += amount;
      current.net = current.income - current.expense;
      current.count += 1;
      buckets.set(period, current);
    }
    return [...buckets.values()].sort((a, b) =>
      a.period.localeCompare(b.period),
    );
  }

  private countTrend<T extends Record<string, unknown>>(
    rows: T[],
    dateField: keyof T,
    granularity: 'day' | 'week' | 'month',
  ) {
    const buckets = new Map<string, { period: string; count: number }>();
    for (const row of rows) {
      const value = row[dateField];
      if (!(value instanceof Date)) continue;
      const period = this.dateBucket(value, granularity);
      const current = buckets.get(period) ?? { period, count: 0 };
      current.count += 1;
      buckets.set(period, current);
    }
    return [...buckets.values()].sort((a, b) =>
      a.period.localeCompare(b.period),
    );
  }

  private dateBucket(date: Date, granularity: 'day' | 'week' | 'month') {
    const normalized = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
    if (granularity === 'month') {
      return `${normalized.getUTCFullYear()}-${String(normalized.getUTCMonth() + 1).padStart(2, '0')}`;
    }
    if (granularity === 'week') {
      const day = normalized.getUTCDay() || 7;
      normalized.setUTCDate(normalized.getUTCDate() - day + 1);
    }
    return normalized.toISOString().slice(0, 10);
  }

  private exportEnvelope(dataset: string, input: any, items: unknown[]) {
    if (input.format === 'csv') {
      return this.toCsv(items as Record<string, unknown>[]);
    }

    return {
      dataset,
      format: 'json',
      generatedAt: new Date().toISOString(),
      filters: {
        dateFrom: this.optional(input.dateFrom),
        dateTo: this.optional(input.dateTo),
        status: this.optional(input.status),
        module: this.optional(input.module),
        type: this.optional(input.type),
      },
      count: items.length,
      items,
    };
  }

  private toCsv(items: Record<string, unknown>[]) {
    const headers = items.length ? Object.keys(items[0]) : ['id'];
    const rows = [
      headers.join(','),
      ...items.map((item) =>
        headers.map((header) => this.csvValue(item[header])).join(','),
      ),
    ];
    return rows.join('\r\n');
  }

  private csvValue(value: unknown) {
    if (value === null || value === undefined) return '';
    const text =
      value instanceof Date
        ? value.toISOString()
        : typeof value === 'object'
          ? JSON.stringify(value)
          : String(value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  private optionalEnum<T extends Record<string, string>>(
    values: T,
    value: unknown,
  ) {
    return Object.values(values).includes(value as T[keyof T])
      ? (value as T[keyof T])
      : undefined;
  }

  private async recordBulkActivities(
    user: AuthenticatedRequestUser,
    records: Array<{
      id: string;
      organizationId: string;
      name?: string | null;
      title?: string | null;
    }>,
    module: OperationsModule,
    entityType: string,
    action: string,
    title: string,
    metadata: Prisma.InputJsonValue,
  ) {
    await this.prisma.operationsActivity.createMany({
      data: records.map((record) => ({
        organizationId: record.organizationId,
        module,
        entityType,
        entityId: record.id,
        actorUserId: user.userId,
        action,
        title,
        body: (record.name ?? record.title ?? record.id).slice(0, 240),
        metadata,
      })),
    });
  }

  private async recordActivity(
    user: AuthenticatedRequestUser,
    module: OperationsModule,
    entityType: string,
    entityId: string,
    action: string,
    title: string,
    body?: string | null,
    metadata?: Prisma.InputJsonValue,
    organizationId?: string,
  ) {
    await this.prisma.operationsActivity.create({
      data: {
        organizationId: organizationId ?? requireOperationOrganizationId(user),
        module,
        entityType,
        entityId,
        actorUserId: user.userId,
        action,
        title,
        body: body ? body.slice(0, 240) : undefined,
        metadata,
      },
    });
  }

  private optionalModule(value: unknown) {
    return Object.values(OperationsModule).includes(value as OperationsModule)
      ? (value as OperationsModule)
      : undefined;
  }

  private enumValue<T extends Record<string, string>>(
    values: T,
    value: unknown,
    fallback: T[keyof T],
  ) {
    return Object.values(values).includes(value as T[keyof T])
      ? (value as T[keyof T])
      : fallback;
  }

  private required(value: unknown, field: string) {
    const text = this.optional(value);
    if (!text) throw new BadRequestException(`${field} is required.`);
    return text.slice(0, 240);
  }

  private optional(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private optionalLong(value: unknown) {
    return typeof value === 'string' && value.trim()
      ? value.trim().slice(0, 1000)
      : undefined;
  }
}

function groupCounts(
  rows: Array<Record<string, unknown> & { _count: { _all: number } }>,
) {
  return Object.fromEntries(
    rows.map((row) => [String(row.status ?? row.provider), row._count._all]),
  );
}

function groupCountsBy(
  rows: Array<Record<string, unknown> & { _count: { _all: number } }>,
  field: string,
) {
  return Object.fromEntries(
    rows.map((row) => [String(row[field]), row._count._all]),
  );
}

function normalizeWifiId(value: string | undefined) {
  return value?.trim().toLowerCase() || undefined;
}

function distanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const radius = 6371000;
  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const deltaPhi = toRadians(lat2 - lat1);
  const deltaLambda = toRadians(lon2 - lon1);
  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

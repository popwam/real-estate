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
  AttendancePenaltyType,
  AttendanceSource,
  AttendanceVerificationStatus,
  CameraDeviceProvider,
  CameraDeviceStatus,
  DvrVerificationStatus,
  HrAttendanceStatus,
  HrEmployeeStatus,
  LegalCaseStatus,
  LegalDocumentStatus,
  LegalDocumentType,
  OperationsModule,
  Prisma,
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
    const password = this.optional(input.temporaryPassword ?? input.password) ?? '123456';
    if (password !== '123456' && password.length < 8) {
      throw new BadRequestException('temporaryPassword must be at least 8 characters.');
    }
    const passwordHash = await this.hashService!.hash(password);
    const name = this.employeeName(input);
    const status = this.enumValue(
      HrEmployeeStatus,
      input.status ?? (input.isActive === false ? 'INACTIVE' : 'ACTIVE'),
      HrEmployeeStatus.ACTIVE,
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
    return this.hrEmployeeResponse(record);
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
    const record = await this.prisma.hrEmployee.update({
      where: { id },
      data: {
        departmentId: input.departmentId,
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
    if (temporaryPassword !== '123456' && temporaryPassword.length < 8) {
      throw new BadRequestException('temporaryPassword must be at least 8 characters.');
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

  listHrAttendance(user: AuthenticatedRequestUser) {
    this.assertHrWorkspace(user);
    requireOperationPermission(user, ['hr.view', 'hr.attendance.manage']);
    return this.prisma.hrAttendanceRecord.findMany({
      where: operationOrganizationWhere(user),
      include: { employee: true },
      orderBy: { date: 'desc' },
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
        status: this.enumValue(
          HrAttendanceStatus,
          input.status,
          HrAttendanceStatus.PRESENT,
        ),
        note: this.optional(input.note),
        attendanceSource: AttendanceSource.MANUAL_ADMIN,
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
    const verification = await this.evaluateAttendanceVerification(
      input,
      policy,
      'checkIn',
      user,
    );
    const { start, end, date } = this.todayBounds();
    const openRecord = await this.prisma.hrAttendanceRecord.findFirst({
      where: {
        organizationId: employee.organizationId,
        employeeId: employee.id,
        date: { gte: start, lt: end },
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
      throw new ConflictException('You are already checked in.');
    }

    const now = new Date();
    const late = this.calculateLatePenalty(date, now, policy);
    const record = await this.prisma.hrAttendanceRecord.create({
      data: {
        organizationId: employee.organizationId,
        employeeId: employee.id,
        date,
        checkInAt: now,
        status: late.minutesLate > 0 ? HrAttendanceStatus.LATE : HrAttendanceStatus.PRESENT,
        note: this.optional(input.note),
        attendanceSource: AttendanceSource.SELF_SERVICE,
        branchId: this.optional(input.branchId),
        ...this.attendanceEvidenceData(input, 'checkIn'),
        verificationStatus: verification.status,
        verificationFailureReasons: verification.reasons.length
          ? verification.reasons
          : undefined,
        dvrVerificationStatus: verification.dvrStatus,
        dvrReferenceId: this.optional(input.dvrReferenceId),
        minutesLate: late.minutesLate,
        lateLevel: late.lateLevel,
        penaltyType: late.penaltyType,
        penaltyValue: late.penaltyValue,
        requiresReview:
          late.requiresReview ||
          verification.status === AttendanceVerificationStatus.PENDING_REVIEW,
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
    if (verification.reject) {
      throw new BadRequestException({
        message: 'Attendance verification failed.',
        reasons: verification.reasons,
      });
    }
    return this.selfAttendanceEnvelope(record);
  }

  async checkOutHrAttendance(input: any, user: AuthenticatedRequestUser) {
    const employee = await this.resolveCurrentEmployee(user);
    const policy = await this.attendancePolicy(employee.organizationId);
    const verification = await this.evaluateAttendanceVerification(
      input,
      policy,
      'checkOut',
      user,
    );
    const { start, end } = this.todayBounds();
    const record = await this.prisma.hrAttendanceRecord.findFirst({
      where: {
        organizationId: employee.organizationId,
        employeeId: employee.id,
        date: { gte: start, lt: end },
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

    if (!record) {
      throw new ConflictException('You must check in before checking out.');
    }

    const updated = await this.prisma.hrAttendanceRecord.update({
      where: { id: record.id },
      data: {
        checkOutAt: new Date(),
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
    if (verification.reject) {
      throw new BadRequestException({
        message: 'Attendance verification failed.',
        reasons: verification.reasons,
      });
    }
    return this.selfAttendanceEnvelope(updated);
  }

  async myAttendanceToday(user: AuthenticatedRequestUser) {
    const employee = await this.resolveCurrentEmployee(user);
    const { start, end, date } = this.todayBounds();
    const record = await this.prisma.hrAttendanceRecord.findFirst({
      where: {
        organizationId: employee.organizationId,
        employeeId: employee.id,
        date: { gte: start, lt: end },
      },
      include: { employee: true },
      orderBy: [{ checkInAt: 'desc' }, { date: 'desc' }],
    });

    return this.selfAttendanceEnvelope(record, employee, date);
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
      'exports.organization_data',
      'exports.platform_data',
    ]);
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
        status: true,
        note: true,
      },
      orderBy: { date: 'desc' },
      take: this.exportLimit(input),
    });
    return this.exportEnvelope('hr.attendance', input, items);
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
      workStartTime: this.timeValue(input.workStartTime, '09:00'),
      workEndTime: this.timeValue(input.workEndTime, '17:00'),
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
      },
    });

    if (!employee) {
      throw new ForbiddenException(
        'No employee profile is linked to this account.',
      );
    }

    return employee;
  }

  private todayBounds(now = new Date()) {
    const start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    return { start, end, date: start };
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
      canCheckIn: !checkInAt || Boolean(checkOutAt) || terminalFailure,
      canCheckOut: Boolean(checkInAt && !checkOutAt && !terminalFailure),
      durationMinutes: this.durationMinutes(checkInAt, checkOutAt),
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

  private calculateLatePenalty(date: Date, checkInAt: Date, policy: any) {
    const [hours, minutes] = String(policy.workStartTime ?? '09:00')
      .split(':')
      .map(Number);
    const scheduled = new Date(date);
    scheduled.setHours(hours || 9, minutes || 0, 0, 0);
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
        requireDvrReview: false,
        allowWebCheckIn: true,
        allowMobileCheckIn: true,
        allowExpandedRadiusWithReview: true,
        webWifiPolicy: WebWifiPolicy.MANUAL_REVIEW,
        workStartTime: '09:00',
        workEndTime: '17:00',
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
    if (policy.requireLocation) {
      if (latitude === undefined || longitude === undefined) {
        reasons.push('LOCATION_REQUIRED');
      } else if (
        typeof policy.allowedLatitude !== 'number' ||
        typeof policy.allowedLongitude !== 'number' ||
        !(policy.expandedRadiusMeters ?? policy.allowedRadiusMeters)
      ) {
        reasons.push('LOCATION_POLICY_NOT_CONFIGURED');
      } else {
        const distance = distanceMeters(
          latitude,
          longitude,
          policy.allowedLatitude,
          policy.allowedLongitude,
        );
        const exactRadius = Number(policy.exactRadiusMeters ?? policy.allowedRadiusMeters ?? 30);
        const expandedRadius = Number(policy.expandedRadiusMeters ?? policy.allowedRadiusMeters ?? exactRadius);
        if (distance > expandedRadius) {
          reasons.push('OUTSIDE_ALLOWED_LOCATION');
        } else if (distance > exactRadius) {
          if (policy.allowExpandedRadiusWithReview) {
            reasons.push('EXPANDED_LOCATION_REVIEW');
          } else {
            reasons.push('OUTSIDE_ALLOWED_LOCATION');
          }
        }
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

  private positiveInt(value: unknown, fallback: number) {
    const number = this.optionalNumber(value);
    if (number === undefined) return fallback;
    return Math.max(1, Math.round(number));
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

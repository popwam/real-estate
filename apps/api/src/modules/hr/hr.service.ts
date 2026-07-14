import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EmployeeIdentifierType,
  EmployeeVerificationStatus,
  HrDocumentStatus,
  HrEmployeeStatus,
  HrEmploymentType,
  HrFaceVerificationStatus,
  HrManualReviewStatus,
  HrPaymentFrequency,
  HrPaymentMethod,
  HrWorkScheduleType,
  WebWifiPolicy,
} from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { normalizeOptionalPhoneOrThrow } from '../../common/phone-normalization';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { HashService } from '../auth/hash.service';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../database/prisma.service';
import { ROLE_PERMISSIONS } from '../permissions/rbac.seed';

const PLATFORM_ROLES = new Set(['platform_owner', 'platform_admin', 'platform_hr']);
const SENSITIVE_PERMISSIONS = new Set([
  'hr.employees.update',
  'hr.employees.permissions.manage',
  'hr.finance.view',
  'hr.finance.manage',
]);

type AnyRecord = Record<string, unknown>;

@Injectable()
export class HrService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hashService: HashService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async summary(user: AuthenticatedRequestUser, requestedOrganizationId?: string) {
    const organizationId = this.resolveOrganizationId(user, requestedOrganizationId);
    const today = new Date();
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalEmployees,
      activeEmployees,
      presentToday,
      lateToday,
      pendingRequests,
      missingDocuments,
      expiredDocuments,
      newHiresThisMonth,
      employeesUnderProbation,
      employeesWithoutLoginAccess,
      employeesMissingFaceReferencePhoto,
    ] = await Promise.all([
      this.prisma.hrEmployee.count({ where: { organizationId } }),
      this.prisma.hrEmployee.count({ where: { organizationId, status: HrEmployeeStatus.ACTIVE } }),
      this.prisma.hrAttendanceRecord.count({
        where: { organizationId, date: { gte: startOfToday, lte: endOfToday }, status: 'PRESENT' },
      }),
      this.prisma.hrAttendanceRecord.count({
        where: { organizationId, date: { gte: startOfToday, lte: endOfToday }, status: 'LATE' },
      }),
      Promise.resolve(0),
      this.prisma.hrEmployeeDocument.count({ where: { organizationId, status: HrDocumentStatus.MISSING } }),
      this.prisma.hrEmployeeDocument.count({
        where: {
          organizationId,
          OR: [{ status: HrDocumentStatus.EXPIRED }, { expiresAt: { lt: startOfToday } }],
        },
      }),
      this.prisma.hrEmployee.count({ where: { organizationId, hireDate: { gte: startOfMonth } } }),
      this.prisma.hrEmployee.count({ where: { organizationId, isUnderProbation: true } }),
      this.prisma.hrEmployee.count({
        where: { organizationId, OR: [{ loginEnabled: false }, { userId: null }] },
      }),
      this.prisma.hrEmployee.count({
        where: { organizationId, OR: [{ faceReferenceFileId: null }, { faceVerificationStatus: 'NOT_CONFIGURED' }] },
      }),
    ]);

    return {
      totalEmployees,
      activeEmployees,
      onLeaveToday: 0,
      presentToday,
      lateToday,
      pendingRequests,
      missingDocuments,
      expiredDocuments,
      newHiresThisMonth,
      employeesUnderProbation,
      employeesWithoutLoginAccess,
      employeesMissingFaceReferencePhoto,
      unavailableEngines: ['leave_requests', 'payroll', 'assets', 'reports'],
    };
  }

  async listEmployees(user: AuthenticatedRequestUser, query: Record<string, string | undefined>) {
    const organizationId = this.resolveOrganizationId(user, query.organizationId);
    const pageSize = this.clampNumber(query.pageSize, 10, 1, 50);
    const page = this.clampNumber(query.page, 1, 1, 10_000);
    const where: any = { organizationId };

    if (query.officeId) where.officeId = query.officeId;
    if (query.branchId) where.branchId = query.branchId;
    if (query.departmentId) where.departmentId = query.departmentId;
    if (query.positionId) where.positionId = query.positionId;
    if (query.jobLevelId) where.jobLevelId = query.jobLevelId;
    if (query.directManagerId) where.directManagerId = query.directManagerId;
    if (query.secondaryManagerId) where.secondaryManagerId = query.secondaryManagerId;
    if (query.nationalityCountryCode) where.nationalityCountryCode = query.nationalityCountryCode;
    if (query.residenceCountryCode) where.residenceCountryCode = query.residenceCountryCode;
    if (query.employmentType) where.employmentType = this.enumValue(HrEmploymentType, query.employmentType, 'employmentType');
    if (query.status) where.status = this.enumValue(HrEmployeeStatus, query.status, 'status');
    if (query.loginEnabled) where.loginEnabled = query.loginEnabled === 'true';
    if (query.isUnderProbation) where.isUnderProbation = query.isUnderProbation === 'true';
    if (query.hasDisability) where.hasDisability = query.hasDisability === 'true';
    if (query.missingDocuments === 'true') where.documents = { some: { status: HrDocumentStatus.MISSING } };
    if (query.expiredDocuments === 'true') {
      where.documents = { some: { OR: [{ status: HrDocumentStatus.EXPIRED }, { expiresAt: { lt: new Date() } }] } };
    }
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { employeeCode: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
        { jobTitle: { contains: query.search, mode: 'insensitive' } },
        { roleTitle: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.hrEmployee.findMany({
        where,
        include: this.employeeInclude(),
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.hrEmployee.count({ where }),
    ]);

    const attendanceByEmployee = await this.todayAttendanceByEmployee(organizationId, items.map((item) => item.id));

    return {
      items: items.map((employee) =>
        this.serializeEmployee(employee, user, attendanceByEmployee.get(employee.id)),
      ),
      total,
      page,
      pageSize,
    };
  }

  async getEmployee(user: AuthenticatedRequestUser, id: string) {
    const employee = await this.findEmployeeOrThrow(id);
    this.assertCanAccessOrganization(user, employee.organizationId);
    await this.auditLogs.record({
      action: 'hr.employee.viewed',
      entityType: 'HrEmployee',
      entityId: employee.id,
      organizationId: employee.organizationId,
      actor: user,
      metadata: { sensitiveValuesReturned: this.canViewSensitive(user) },
    });
    const attendance = (await this.todayAttendanceByEmployee(employee.organizationId, [employee.id])).get(employee.id);
    return this.serializeEmployee(employee, user, attendance);
  }

  async createEmployee(user: AuthenticatedRequestUser, body: AnyRecord) {
    const organizationId = this.resolveOrganizationId(user, this.string(body.organizationId));
    const email = this.optionalEmail(body.email);
    const phoneCountry = this.string(body.phoneCountry) ?? (await this.organizationCountry(organizationId));
    const phone = normalizeOptionalPhoneOrThrow(this.string(body.phone), 'phone', phoneCountry);
    const allowLogin = body.allowLogin === false || body.loginEnabled === false ? false : Boolean(email || phone);
    const roleName = this.string(body.role) ?? 'employee_self_service';
    const temporaryPassword = allowLogin
      ? this.temporaryPassword(body.temporaryPassword)
      : undefined;
    const firstName = this.string(body.firstName);
    const lastName = this.string(body.lastName);
    const name = this.string(body.name) || [firstName, lastName].filter(Boolean).join(' ') || this.string(body.displayName);

    if (!name) throw new BadRequestException('name is required.');
    await this.assertEmployeeLimit(organizationId);

    const existingEmployeeCode = this.string(body.employeeCode);
    const employeeCode = existingEmployeeCode || (await this.nextEmployeeCode(organizationId));
    const existingCode = await this.prisma.hrEmployee.findFirst({ where: { organizationId, employeeCode } });
    if (existingCode) throw new ConflictException('employeeCode already exists.');

    if (email && allowLogin) await this.assertEmailAvailable(email);
    const loginEmail = email ?? (phone ? this.phoneLoginEmail(phone, organizationId) : undefined);

    const result = await this.prisma.$transaction(async (tx) => {
      const userRecord = allowLogin
        ? await tx.user.create({
            data: {
              organizationId,
              email: loginEmail as string,
              phone,
              firstName,
              lastName,
              passwordHash: await this.hashService.hash(temporaryPassword as string),
              mustChangePassword: true,
              roleId: (await this.ensureOrganizationRole(tx, organizationId, roleName)).id,
              userRole: this.userRoleForOrganization(roleName, user.organizationType),
              isActive: true,
            },
            include: { role: { include: { permissions: { include: { permission: true } } } } },
          })
        : null;

      const employee = await tx.hrEmployee.create({
        data: {
          ...this.employeeData(body, organizationId),
          organizationId,
          userId: userRecord?.id,
          employeeCode,
          name,
          legalName: this.string(body.legalName) ?? name,
          displayName: this.string(body.displayName) ?? name,
          email,
          phone,
          loginEnabled: allowLogin,
          roleTitle: this.string(body.roleTitle) ?? this.string(body.jobTitle),
          status: this.enumValue(HrEmployeeStatus, this.string(body.status) ?? 'ACTIVE', 'status'),
        },
        include: this.employeeInclude(),
      });

      await this.replaceIdentifiers(tx, employee.id, body.identifiers);
      await this.assignRolePermissions(tx, userRecord?.roleId, roleName, this.permissionArray(body.permissions), user);
      return employee;
    });

    await this.auditLogs.record({
      action: 'hr.employee.created',
      entityType: 'HrEmployee',
      entityId: result.id,
      organizationId,
      actor: user,
      metadata: { loginEnabled: allowLogin, role: roleName },
    });

    const saved = await this.findEmployeeOrThrow(result.id);
    return {
      ...this.serializeEmployee(saved, user),
      temporaryPassword,
    };
  }

  async updateEmployee(user: AuthenticatedRequestUser, id: string, body: AnyRecord) {
    const existing = await this.findEmployeeOrThrow(id);
    this.assertCanAccessOrganization(user, existing.organizationId);
    const phoneCountry = this.string(body.phoneCountry) ?? (await this.organizationCountry(existing.organizationId));
    const phone = normalizeOptionalPhoneOrThrow(this.string(body.phone), 'phone', phoneCountry);
    const email = this.optionalEmail(body.email);
    const allowLogin = body.allowLogin === false || body.loginEnabled === false ? false : existing.loginEnabled;

    if (allowLogin && email && email !== existing.user?.email) {
      await this.assertEmailAvailable(email, existing.userId ?? undefined);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const employee = await tx.hrEmployee.update({
        where: { id },
        data: {
          ...this.employeeData(body, existing.organizationId),
          name: this.string(body.name) ?? existing.name,
          legalName: this.string(body.legalName) ?? undefined,
          displayName: this.string(body.displayName) ?? undefined,
          email,
          phone,
          loginEnabled: allowLogin,
          roleTitle: this.string(body.roleTitle) ?? this.string(body.jobTitle) ?? undefined,
          status: this.string(body.status) ? this.enumValue(HrEmployeeStatus, this.string(body.status), 'status') : undefined,
        },
        include: this.employeeInclude(),
      });

      if (employee.userId) {
        await tx.user.update({
          where: { id: employee.userId },
          data: {
            email: email ?? undefined,
            phone,
            firstName: this.string(body.firstName) ?? undefined,
            lastName: this.string(body.lastName) ?? undefined,
            isActive: allowLogin && employee.status === HrEmployeeStatus.ACTIVE,
          },
        });
      } else if (allowLogin) {
        const loginEmail = email ?? existing.email;
        if (!loginEmail) {
          throw new BadRequestException('email is required when login is enabled.');
        }
        await this.assertEmailAvailable(loginEmail);
        const roleName = this.string(body.role) ?? 'employee_self_service';
        const role = await this.ensureOrganizationRole(
          tx,
          existing.organizationId,
          roleName,
        );
        const createdUser = await tx.user.create({
          data: {
            organizationId: existing.organizationId,
            email: loginEmail,
            phone,
            firstName: this.string(body.firstName),
            lastName: this.string(body.lastName),
            passwordHash: await this.hashService.hash(
              this.temporaryPassword(body.temporaryPassword),
            ),
            mustChangePassword: true,
            roleId: role.id,
            userRole: this.userRoleForOrganization(
              roleName,
              user.organizationType,
            ),
            isActive: employee.status === HrEmployeeStatus.ACTIVE,
          },
        });
        await tx.hrEmployee.update({
          where: { id },
          data: { userId: createdUser.id, loginEnabled: true },
        });
      }

      if (body.identifiers !== undefined) await this.replaceIdentifiers(tx, employee.id, body.identifiers);
      await this.writeChangeLogs(tx, existing, employee, user, body);
      return employee;
    });

    await this.auditLogs.record({
      action: 'hr.employee.updated',
      entityType: 'HrEmployee',
      entityId: id,
      organizationId: existing.organizationId,
      actor: user,
      metadata: { sensitiveValuesChanged: this.containsSensitiveKeys(body) },
    });

    const saved = await this.findEmployeeOrThrow(updated.id);
    return this.serializeEmployee(saved, user);
  }

  async resetPassword(user: AuthenticatedRequestUser, id: string, body: AnyRecord) {
    const employee = await this.findEmployeeOrThrow(id);
    this.assertCanAccessOrganization(user, employee.organizationId);
    if (!employee.userId) throw new BadRequestException('Employee login is not enabled.');
    const temporaryPassword = this.temporaryPassword(body.temporaryPassword);
    await this.prisma.user.update({
      where: { id: employee.userId },
      data: {
        passwordHash: await this.hashService.hash(temporaryPassword),
        mustChangePassword: true,
        isActive: true,
      },
    });
    await this.prisma.hrEmployee.update({ where: { id }, data: { loginEnabled: true } });
    await this.auditLogs.record({
      action: 'hr.employee.password_reset',
      entityType: 'HrEmployee',
      entityId: id,
      organizationId: employee.organizationId,
      actor: user,
    });
    return { id, passwordReset: true, temporaryPassword };
  }

  private temporaryPassword(value: unknown) {
    const supplied = this.string(value);
    if (supplied) {
      if (supplied.length < 12 || supplied === '123456') {
        throw new BadRequestException('Temporary password must contain at least 12 characters.');
      }
      return supplied;
    }
    return `Pw!${randomBytes(12).toString('base64url')}`;
  }

  async setEmployeeActive(user: AuthenticatedRequestUser, id: string, active: boolean) {
    const employee = await this.findEmployeeOrThrow(id);
    this.assertCanAccessOrganization(user, employee.organizationId);
    const updated = await this.prisma.hrEmployee.update({
      where: { id },
      data: { status: active ? HrEmployeeStatus.ACTIVE : HrEmployeeStatus.INACTIVE },
      include: this.employeeInclude(),
    });
    if (updated.userId) {
      await this.prisma.user.update({
        where: { id: updated.userId },
        data: { isActive: active && updated.loginEnabled },
      });
    }
    await this.auditLogs.record({
      action: active ? 'hr.employee.activated' : 'hr.employee.deactivated',
      entityType: 'HrEmployee',
      entityId: id,
      organizationId: employee.organizationId,
      actor: user,
    });
    return this.serializeEmployee(updated, user);
  }

  async softDeleteEmployee(user: AuthenticatedRequestUser, id: string) {
    const employee = await this.setEmployeeActive(user, id, false);
    return { ...employee, deleted: false, deactivated: true };
  }

  async updateEmployeeRole(user: AuthenticatedRequestUser, id: string, roleName: string) {
    const employee = await this.findEmployeeOrThrow(id);
    this.assertCanAccessOrganization(user, employee.organizationId);
    if (!employee.userId) throw new BadRequestException('Employee login is not enabled.');
    if (!this.canAssignRole(user, roleName)) throw new ForbiddenException('Cannot assign this role.');
    const role = await this.ensureOrganizationRole(this.prisma, employee.organizationId, roleName);
    await this.prisma.user.update({
      where: { id: employee.userId },
      data: { roleId: role.id, userRole: this.userRoleForOrganization(roleName, user.organizationType) },
    });
    await this.auditLogs.record({
      action: 'hr.employee.role_updated',
      entityType: 'HrEmployee',
      entityId: id,
      organizationId: employee.organizationId,
      actor: user,
      metadata: { role: roleName },
    });
    return this.getEmployee(user, id);
  }

  async updateEmployeePermissions(user: AuthenticatedRequestUser, id: string, permissions: string[]) {
    const employee = await this.findEmployeeOrThrow(id);
    this.assertCanAccessOrganization(user, employee.organizationId);
    if (!employee.user?.roleId) throw new BadRequestException('Employee login is not enabled.');
    if (employee.userId === user.userId) throw new ForbiddenException('Employee cannot change their own permissions.');
    await this.assignRolePermissions(this.prisma, employee.user.roleId, employee.user.role?.name ?? 'employee_self_service', permissions, user);
    await this.auditLogs.record({
      action: 'hr.employee.permissions_updated',
      entityType: 'HrEmployee',
      entityId: id,
      organizationId: employee.organizationId,
      actor: user,
      metadata: { permissionCount: permissions.length },
    });
    return this.getEmployee(user, id);
  }

  async listWorkGroups(user: AuthenticatedRequestUser, requestedOrganizationId?: string) {
    const organizationId = this.resolveOrganizationId(user, requestedOrganizationId);
    return this.prisma.hrWorkGroup.findMany({
      where: { organizationId },
      include: { managers: { include: { user: true } }, _count: { select: { employees: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async getWorkGroup(user: AuthenticatedRequestUser, id: string) {
    const group = await this.prisma.hrWorkGroup.findUnique({
      where: { id },
      include: { managers: { include: { user: true } }, employees: true, _count: { select: { employees: true } } },
    });
    if (!group) throw new NotFoundException('Work group not found.');
    this.assertCanAccessOrganization(user, group.organizationId);
    return group;
  }

  async createWorkGroup(user: AuthenticatedRequestUser, body: AnyRecord) {
    const organizationId = this.resolveOrganizationId(user, this.string(body.organizationId));
    const name = this.requiredString(body.name, 'name');
    const group = await this.prisma.hrWorkGroup.create({
      data: {
        organizationId,
        name,
        workScheduleId: this.string(body.workScheduleId),
        allowedAttendanceLocationId: this.string(body.allowedAttendanceLocationId),
        attendanceProfileId: this.string(body.attendanceProfileId),
        managers: { create: this.stringArray(body.managerIds).map((userId) => ({ userId })) },
      },
      include: { managers: { include: { user: true } }, _count: { select: { employees: true } } },
    });
    await this.auditLogs.record({ action: 'hr.work_group.created', entityType: 'HrWorkGroup', entityId: group.id, organizationId, actor: user });
    return group;
  }

  async updateWorkGroup(user: AuthenticatedRequestUser, id: string, body: AnyRecord) {
    const existing = await this.getWorkGroup(user, id);
    const managerIds = body.managerIds === undefined ? undefined : this.stringArray(body.managerIds);
    const group = await this.prisma.$transaction(async (tx) => {
      if (managerIds) {
        await tx.hrWorkGroupManager.deleteMany({ where: { workGroupId: id } });
        await tx.hrWorkGroupManager.createMany({ data: managerIds.map((userId) => ({ workGroupId: id, userId })), skipDuplicates: true });
      }
      return tx.hrWorkGroup.update({
        where: { id },
        data: {
          name: this.string(body.name) ?? existing.name,
          workScheduleId: this.string(body.workScheduleId),
          allowedAttendanceLocationId: this.string(body.allowedAttendanceLocationId),
          attendanceProfileId: this.string(body.attendanceProfileId),
          isActive: typeof body.isActive === 'boolean' ? body.isActive : undefined,
        },
        include: { managers: { include: { user: true } }, _count: { select: { employees: true } } },
      });
    });
    await this.auditLogs.record({ action: 'hr.work_group.updated', entityType: 'HrWorkGroup', entityId: id, organizationId: existing.organizationId, actor: user });
    return group;
  }

  async listTeams(user: AuthenticatedRequestUser, requestedOrganizationId?: string) {
    const organizationId = this.resolveOrganizationId(user, requestedOrganizationId);
    return this.prisma.hrTeam.findMany({
      where: { organizationId },
      include: { workGroup: true, manager: true, _count: { select: { employees: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async getTeam(user: AuthenticatedRequestUser, id: string) {
    const team = await this.prisma.hrTeam.findUnique({
      where: { id },
      include: { workGroup: true, manager: true, employees: true, _count: { select: { employees: true } } },
    });
    if (!team) throw new NotFoundException('Team not found.');
    this.assertCanAccessOrganization(user, team.organizationId);
    return team;
  }

  async createTeam(user: AuthenticatedRequestUser, body: AnyRecord) {
    const organizationId = this.resolveOrganizationId(user, this.string(body.organizationId));
    const team = await this.prisma.hrTeam.create({
      data: {
        organizationId,
        name: this.requiredString(body.name, 'name'),
        workGroupId: this.string(body.workGroupId),
        managerId: this.string(body.managerId),
      },
      include: { workGroup: true, manager: true, _count: { select: { employees: true } } },
    });
    await this.auditLogs.record({ action: 'hr.team.created', entityType: 'HrTeam', entityId: team.id, organizationId, actor: user });
    return team;
  }

  async updateTeam(user: AuthenticatedRequestUser, id: string, body: AnyRecord) {
    const existing = await this.getTeam(user, id);
    const team = await this.prisma.hrTeam.update({
      where: { id },
      data: {
        name: this.string(body.name) ?? existing.name,
        workGroupId: this.string(body.workGroupId),
        managerId: this.string(body.managerId),
        isActive: typeof body.isActive === 'boolean' ? body.isActive : undefined,
      },
      include: { workGroup: true, manager: true, _count: { select: { employees: true } } },
    });
    await this.auditLogs.record({ action: 'hr.team.updated', entityType: 'HrTeam', entityId: id, organizationId: existing.organizationId, actor: user });
    return team;
  }

  async listEmployeeDocuments(user: AuthenticatedRequestUser, query: Record<string, string | undefined>) {
    const organizationId = this.resolveOrganizationId(user, query.organizationId);
    const where: any = { organizationId };
    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.documentType) where.documentType = query.documentType;
    if (query.status) where.status = this.enumValue(HrDocumentStatus, query.status, 'status');
    if (query.missing === 'true') where.status = HrDocumentStatus.MISSING;
    if (query.expired === 'true') where.OR = [{ status: HrDocumentStatus.EXPIRED }, { expiresAt: { lt: new Date() } }];
    return this.prisma.hrEmployeeDocument.findMany({
      where,
      include: { employee: { include: { department: true, office: true, branch: true } } },
      orderBy: [{ status: 'asc' }, { expiresAt: 'asc' }],
    });
  }

  async createEmployeeDocument(user: AuthenticatedRequestUser, body: AnyRecord) {
    const employee = await this.findEmployeeOrThrow(this.requiredString(body.employeeId, 'employeeId'));
    this.assertCanAccessOrganization(user, employee.organizationId);
    const document = await this.prisma.hrEmployeeDocument.create({
      data: {
        organizationId: employee.organizationId,
        employeeId: employee.id,
        documentType: this.requiredString(body.documentType, 'documentType'),
        fileId: this.string(body.fileId),
        expiresAt: this.date(body.expiresAt),
        status: this.string(body.status) ? this.enumValue(HrDocumentStatus, this.string(body.status), 'status') : HrDocumentStatus.PENDING,
        manualReviewStatus: this.string(body.manualReviewStatus)
          ? this.enumValue(HrManualReviewStatus, this.string(body.manualReviewStatus), 'manualReviewStatus')
          : HrManualReviewStatus.PENDING,
      },
    });
    await this.auditLogs.record({ action: 'hr.employee_document.created', entityType: 'HrEmployeeDocument', entityId: document.id, organizationId: employee.organizationId, actor: user });
    return document;
  }

  async reviewEmployeeDocument(user: AuthenticatedRequestUser, id: string, body: AnyRecord) {
    const existing = await this.prisma.hrEmployeeDocument.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Employee document not found.');
    this.assertCanAccessOrganization(user, existing.organizationId);
    const document = await this.prisma.hrEmployeeDocument.update({
      where: { id },
      data: {
        status: this.string(body.status) ? this.enumValue(HrDocumentStatus, this.string(body.status), 'status') : undefined,
        manualReviewStatus: this.string(body.manualReviewStatus)
          ? this.enumValue(HrManualReviewStatus, this.string(body.manualReviewStatus), 'manualReviewStatus')
          : undefined,
      },
    });
    await this.auditLogs.record({ action: 'hr.employee_document.reviewed', entityType: 'HrEmployeeDocument', entityId: id, organizationId: existing.organizationId, actor: user });
    return document;
  }

  async applyEmployeeAction(user: AuthenticatedRequestUser, body: AnyRecord) {
    const action = this.requiredString(body.action, 'action');
    const employeeIds = this.stringArray(body.employeeIds);
    if (!employeeIds.length) throw new BadRequestException('employeeIds is required.');
    const supportedActions = new Set([
      'assign_access_level',
      'change_department',
      'change_position',
      'change_direct_manager',
      'change_secondary_manager',
      'transfer_employee',
      'assign_temporary_password',
      'activate',
      'deactivate',
      'bulk_update_permissions',
    ]);
    if (!supportedActions.has(action)) {
      return { applied: false, status: 'coming_soon', action, affectedEmployees: 0 };
    }

    let affectedEmployees = 0;
    for (const employeeId of employeeIds) {
      if (action === 'activate') {
        await this.setEmployeeActive(user, employeeId, true);
        affectedEmployees += 1;
      } else if (action === 'deactivate') {
        await this.setEmployeeActive(user, employeeId, false);
        affectedEmployees += 1;
      } else if (action === 'assign_temporary_password') {
        await this.resetPassword(user, employeeId, { temporaryPassword: body.temporaryPassword });
        affectedEmployees += 1;
      } else if (action === 'bulk_update_permissions') {
        await this.updateEmployeePermissions(user, employeeId, this.permissionArray(body.permissions));
        affectedEmployees += 1;
      } else {
        await this.updateEmployee(user, employeeId, body.details && typeof body.details === 'object' ? (body.details as AnyRecord) : body);
        affectedEmployees += 1;
      }
    }
    await this.auditLogs.record({ action: 'hr.employee_action.applied', entityType: 'HrEmployeeAction', organizationId: user.organizationId, actor: user, metadata: { action, affectedEmployees } });
    return { applied: true, action, affectedEmployees };
  }

  async orgChart(user: AuthenticatedRequestUser, requestedOrganizationId?: string) {
    const organizationId = this.resolveOrganizationId(user, requestedOrganizationId);
    const organization = await this.prisma.organization.findUnique({ where: { id: organizationId }, select: { id: true, name: true } });
    const [offices, departments, employees] = await Promise.all([
      this.prisma.organizationBranch.findMany({ where: { organizationId }, orderBy: { name: 'asc' } }),
      this.prisma.hrDepartment.findMany({ where: { organizationId }, orderBy: { name: 'asc' } }),
      this.prisma.hrEmployee.findMany({ where: { organizationId }, include: { directManager: true, department: true, office: true }, orderBy: { name: 'asc' } }),
    ]);
    return { organization, offices, departments, employees: employees.map((employee) => this.serializeEmployee(employee, user)) };
  }

  async transferLog(user: AuthenticatedRequestUser, requestedOrganizationId?: string) {
    const organizationId = this.resolveOrganizationId(user, requestedOrganizationId);
    return this.prisma.hrEmployeeTransferLog.findMany({
      where: { organizationId },
      include: { employee: true, createdBy: true },
      orderBy: { effectiveDate: 'desc' },
      take: 200,
    });
  }

  async titleChanges(user: AuthenticatedRequestUser, requestedOrganizationId?: string) {
    const organizationId = this.resolveOrganizationId(user, requestedOrganizationId);
    return this.prisma.hrEmployeeTitleChangeLog.findMany({
      where: { organizationId },
      include: { employee: true, createdBy: true },
      orderBy: { effectiveDate: 'desc' },
      take: 200,
    });
  }

  private employeeInclude() {
    return {
      organization: true,
      user: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
      department: true,
      office: true,
      branch: true,
      directManager: true,
      secondaryManager: true,
      workGroup: true,
      team: true,
      identifiers: true,
      documents: true,
    } as const;
  }

  private serializeEmployee(employee: any, user: AuthenticatedRequestUser, attendance?: any) {
    const canViewSensitive = this.canViewSensitive(user);
    const serialized: any = {
      ...employee,
      todayAttendanceStatus: this.todayAttendanceStatus(attendance),
      checkInTime: attendance?.checkInAt ?? null,
      checkOutTime: attendance?.checkOutAt ?? null,
      loginReadiness: {
        canLogin: Boolean(employee.loginEnabled && employee.user?.isActive && employee.user?.passwordHash),
        reasons: [
          !employee.loginEnabled ? 'LOGIN_DISABLED' : null,
          !employee.user ? 'NO_LINKED_USER' : null,
          employee.user && !employee.user.isActive ? 'USER_INACTIVE' : null,
          employee.user && !employee.user.passwordHash ? 'NO_PASSWORD' : null,
        ].filter(Boolean),
      },
    };
    if (!canViewSensitive) {
      delete serialized.identifiers;
      delete serialized.disabilityNotes;
      delete serialized.salaryAmount;
      delete serialized.salaryCurrency;
      delete serialized.paymentFrequency;
      delete serialized.paymentMethod;
      delete serialized.faceReferenceFileId;
      delete serialized.documents;
    }
    return serialized;
  }

  private todayAttendanceStatus(attendance?: any) {
    if (!attendance) return 'ABSENT';
    if (attendance.verificationStatus === 'PENDING_REVIEW' || attendance.requiresReview) return 'PENDING_REVIEW';
    if (attendance.status === 'LATE') return 'LATE';
    if (attendance.status === 'PRESENT') return 'PRESENT';
    return attendance.status ?? 'ABSENT';
  }

  private async todayAttendanceByEmployee(organizationId: string, employeeIds: string[]) {
    if (!employeeIds.length) return new Map<string, any>();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const records = await this.prisma.hrAttendanceRecord.findMany({
      where: { organizationId, employeeId: { in: employeeIds }, date: { gte: start, lte: end } },
    });
    return new Map(records.map((record) => [record.employeeId, record]));
  }

  private async findEmployeeOrThrow(id: string) {
    const employee = await this.prisma.hrEmployee.findUnique({ where: { id }, include: this.employeeInclude() });
    if (!employee) throw new NotFoundException('Employee not found.');
    return employee;
  }

  private employeeData(body: AnyRecord, organizationId: string) {
    return {
      departmentId: this.string(body.departmentId),
      officeId: this.string(body.officeId),
      branchId: this.string(body.branchId),
      positionId: this.string(body.positionId),
      jobLevelId: this.string(body.jobLevelId),
      directManagerId: this.string(body.directManagerId),
      secondaryManagerId: this.string(body.secondaryManagerId),
      workGroupId: this.string(body.workGroupId),
      teamId: this.string(body.teamId),
      photoFileId: this.string(body.photoFileId),
      faceReferenceFileId: this.string(body.faceReferenceFileId),
      faceVerificationConsent: typeof body.faceVerificationConsent === 'boolean' ? body.faceVerificationConsent : undefined,
      faceVerificationStatus: this.string(body.faceVerificationStatus)
        ? this.enumValue(HrFaceVerificationStatus, this.string(body.faceVerificationStatus), 'faceVerificationStatus')
        : undefined,
      employeeCode: this.string(body.employeeCode),
      localizedNames: this.jsonObject(body.localizedNames),
      maritalStatus: this.string(body.maritalStatus),
      gender: this.string(body.gender),
      dateOfBirth: this.date(body.dateOfBirth),
      nationalityCountryCode: this.string(body.nationalityCountryCode),
      residenceCountryCode: this.string(body.residenceCountryCode) ?? this.string(body.employeeCountry),
      preferredLanguage: this.string(body.preferredLanguage),
      timezone: this.string(body.timezone),
      locale: this.string(body.locale),
      currency: this.string(body.currency),
      workStartDate: this.date(body.workStartDate),
      hireDate: this.date(body.hireDate) ?? this.date(body.hiringDate),
      isUnderProbation: typeof body.isUnderProbation === 'boolean' ? body.isUnderProbation : typeof body.underProbation === 'boolean' ? body.underProbation : undefined,
      probationEndDate: this.date(body.probationEndDate),
      hasDisability: typeof body.hasDisability === 'boolean' ? body.hasDisability : undefined,
      disabilityStatus: this.string(body.disabilityStatus),
      disabilityNotes: this.string(body.disabilityNotes),
      employmentType: this.string(body.employmentType)
        ? this.enumValue(HrEmploymentType, this.string(body.employmentType), 'employmentType')
        : undefined,
      contractType: this.string(body.contractType),
      jobTitle: this.string(body.jobTitle),
      workScheduleType: this.string(body.workScheduleType)
        ? this.enumValue(HrWorkScheduleType, this.string(body.workScheduleType), 'workScheduleType')
        : undefined,
      workScheduleId: this.string(body.workScheduleId),
      shiftGroupId: this.string(body.shiftGroupId),
      attendanceProfileId: this.string(body.attendanceProfileId),
      leaveProfileId: this.string(body.leaveProfileId),
      breakProfileId: this.string(body.breakProfileId),
      allowedAttendanceLocationId: this.string(body.allowedAttendanceLocationId),
      exactRadiusMeters: this.number(body.exactRadiusMeters),
      expandedRadiusMeters: this.number(body.expandedRadiusMeters),
      webCheckInAllowed: typeof body.webCheckInAllowed === 'boolean' ? body.webCheckInAllowed : undefined,
      mobileCheckInAllowed: typeof body.mobileCheckInAllowed === 'boolean' ? body.mobileCheckInAllowed : undefined,
      requireLivePhoto: typeof body.requireLivePhoto === 'boolean' ? body.requireLivePhoto : undefined,
      requireFaceVerification: typeof body.requireFaceVerification === 'boolean' ? body.requireFaceVerification : undefined,
      requireDvrReview: typeof body.requireDvrReview === 'boolean' ? body.requireDvrReview : undefined,
      webWifiPolicy: this.string(body.webWifiPolicy)
        ? this.enumValue(WebWifiPolicy, this.string(body.webWifiPolicy), 'webWifiPolicy')
        : undefined,
      remoteWorkAllowed: typeof body.remoteWorkAllowed === 'boolean' ? body.remoteWorkAllowed : undefined,
      holidayWorkPolicy: this.string(body.holidayWorkPolicy),
      payrollProfileId: this.string(body.payrollProfileId),
      allowancesProfileId: this.string(body.allowancesProfileId),
      deductionsProfileId: this.string(body.deductionsProfileId),
      salaryAmount: this.string(body.salaryAmount) ?? this.number(body.salaryAmount),
      salaryCurrency: this.string(body.salaryCurrency),
      paymentFrequency: this.string(body.paymentFrequency)
        ? this.enumValue(HrPaymentFrequency, this.string(body.paymentFrequency), 'paymentFrequency')
        : undefined,
      paymentMethod: this.string(body.paymentMethod)
        ? this.enumValue(HrPaymentMethod, this.string(body.paymentMethod), 'paymentMethod')
        : undefined,
    };
  }

  private async writeChangeLogs(tx: any, before: any, after: any, user: AuthenticatedRequestUser, body: AnyRecord) {
    const effectiveDate = this.date(body.effectiveDate) ?? new Date();
    if (
      before.officeId !== after.officeId ||
      before.departmentId !== after.departmentId ||
      before.positionId !== after.positionId ||
      before.directManagerId !== after.directManagerId
    ) {
      await tx.hrEmployeeTransferLog.create({
        data: {
          organizationId: after.organizationId,
          employeeId: after.id,
          fromOfficeId: before.officeId,
          fromDepartmentId: before.departmentId,
          fromPositionId: before.positionId,
          fromManagerId: before.directManagerId,
          toOfficeId: after.officeId,
          toDepartmentId: after.departmentId,
          toPositionId: after.positionId,
          toManagerId: after.directManagerId,
          reason: this.string(body.reason),
          effectiveDate,
          createdById: user.userId,
        },
      });
    }
    if (before.jobTitle !== after.jobTitle || before.positionId !== after.positionId || before.jobLevelId !== after.jobLevelId) {
      await tx.hrEmployeeTitleChangeLog.create({
        data: {
          organizationId: after.organizationId,
          employeeId: after.id,
          fromTitle: before.jobTitle,
          fromPositionId: before.positionId,
          fromJobLevelId: before.jobLevelId,
          toTitle: after.jobTitle,
          toPositionId: after.positionId,
          toJobLevelId: after.jobLevelId,
          effectiveDate,
          createdById: user.userId,
        },
      });
    }
  }

  private async replaceIdentifiers(tx: any, employeeId: string, input: unknown) {
    if (input === undefined) return;
    await tx.employeeIdentifier.deleteMany({ where: { employeeId } });
    const identifiers = Array.isArray(input) ? input : [];
    for (const item of identifiers) {
      if (!item || typeof item !== 'object') continue;
      const record = item as AnyRecord;
      const value = this.string(record.value);
      if (!value) continue;
      await tx.employeeIdentifier.create({
        data: {
          employeeId,
          type: this.enumValue(EmployeeIdentifierType, this.string(record.type) ?? 'OTHER', 'identifier.type'),
          countryCode: this.string(record.countryCode),
          value,
          expiresAt: this.date(record.expiresAt),
          isPrimary: Boolean(record.isPrimary),
          verificationStatus: this.string(record.verificationStatus)
            ? this.enumValue(EmployeeVerificationStatus, this.string(record.verificationStatus), 'identifier.verificationStatus')
            : EmployeeVerificationStatus.NOT_REVIEWED,
        },
      });
    }
  }

  private async ensureOrganizationRole(prisma: any, organizationId: string | null, roleName: string) {
    const role = await prisma.role.upsert({
      where: { organizationId_name: { organizationId, name: roleName } },
      create: { organizationId, name: roleName, isSystem: true, description: `Organization role: ${roleName}` },
      update: {},
    });

    for (const permissionKey of ROLE_PERMISSIONS[roleName] ?? []) {
      const permission = await prisma.permission.upsert({
        where: { key: permissionKey },
        create: { key: permissionKey, description: `Base permission: ${permissionKey}` },
        update: {},
      });
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        create: { roleId: role.id, permissionId: permission.id },
        update: {},
      });
    }
    return role;
  }

  private async assignRolePermissions(prisma: any, roleId: string | null | undefined, roleName: string, permissions: string[], user: AuthenticatedRequestUser) {
    if (!roleId) return;
    const filtered = permissions.filter((permission) => this.canAssignPermission(user, permission));
    const baseline = ROLE_PERMISSIONS[roleName] ?? [];
    const keys = [...new Set([...baseline, ...filtered])];
    await prisma.rolePermission.deleteMany({ where: { roleId } });
    for (const key of keys) {
      const permission = await prisma.permission.upsert({
        where: { key },
        create: { key, description: `Base permission: ${key}` },
        update: {},
      });
      await prisma.rolePermission.create({ data: { roleId, permissionId: permission.id } });
    }
  }

  private resolveOrganizationId(user: AuthenticatedRequestUser, requestedOrganizationId?: string | null) {
    if (PLATFORM_ROLES.has(user.role)) {
      const organizationId = requestedOrganizationId || user.organizationId;
      if (!organizationId) throw new BadRequestException('organizationId is required.');
      return organizationId;
    }
    if (requestedOrganizationId && requestedOrganizationId !== user.organizationId) {
      throw new ForbiddenException('Cannot access another organization.');
    }
    if (!user.organizationId) throw new ForbiddenException('Current organization is required.');
    return user.organizationId;
  }

  private assertCanAccessOrganization(user: AuthenticatedRequestUser, organizationId: string | null) {
    if (PLATFORM_ROLES.has(user.role)) return;
    if (!organizationId || user.organizationId !== organizationId) throw new ForbiddenException('Cannot access another organization.');
  }

  private canViewSensitive(user: AuthenticatedRequestUser) {
    return PLATFORM_ROLES.has(user.role) || user.permissions.some((permission) => SENSITIVE_PERMISSIONS.has(permission));
  }

  private canAssignRole(user: AuthenticatedRequestUser, roleName: string) {
    if (roleName.startsWith('platform_')) return PLATFORM_ROLES.has(user.role);
    return true;
  }

  private canAssignPermission(user: AuthenticatedRequestUser, permission: string) {
    if (permission.startsWith('platform.')) return PLATFORM_ROLES.has(user.role);
    return true;
  }

  private userRoleForOrganization(roleName: string, organizationType: string | null) {
    if (roleName.startsWith('platform_') || organizationType === 'PLATFORM') return 'PLATFORM_ADMIN' as any;
    if (organizationType === 'BROKERAGE' || organizationType === 'INDIVIDUAL_BROKER') return 'BROKERAGE_ADMIN' as any;
    if (organizationType === 'DEVELOPER') return 'DEVELOPER_ADMIN' as any;
    return 'CLIENT' as any;
  }

  private async nextEmployeeCode(organizationId: string) {
    const count = await this.prisma.hrEmployee.count({ where: { organizationId } });
    return `EMP-${String(count + 1).padStart(5, '0')}`;
  }

  private async organizationCountry(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({ where: { id: organizationId }, select: { country: true } });
    return organization?.country ?? undefined;
  }

  private async assertEmailAvailable(email: string, exceptUserId?: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== exceptUserId) throw new ConflictException('Email is already registered.');
  }

  private phoneLoginEmail(phone: string, organizationId: string) {
    const safePhone = phone.replace(/\D/g, '');
    const safeOrganization = organizationId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
    return `phone.${safePhone}.${safeOrganization}@login.invalid`.toLowerCase();
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

  private containsSensitiveKeys(body: AnyRecord) {
    return ['identifiers', 'salaryAmount', 'disabilityNotes', 'faceReferenceFileId', 'documents'].some((key) => key in body);
  }

  private permissionArray(value: unknown) {
    return this.stringArray(value).filter((item) => item.includes('.'));
  }

  private stringArray(value: unknown) {
    return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
  }

  private string(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private requiredString(value: unknown, field: string) {
    const result = this.string(value);
    if (!result) throw new BadRequestException(`${field} is required.`);
    return result;
  }

  private optionalEmail(value: unknown) {
    const email = this.string(value)?.toLowerCase();
    if (!email) return undefined;
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) throw new BadRequestException('email is invalid.');
    return email;
  }

  private number(value: unknown) {
    if (value === null || value === undefined || value === '') return undefined;
    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
  }

  private date(value: unknown) {
    const raw = this.string(value);
    if (!raw) return undefined;
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) throw new BadRequestException('date is invalid.');
    return date;
  }

  private jsonObject(value: unknown) {
    if (value && typeof value === 'object' && !Array.isArray(value)) return value as any;
    return undefined;
  }

  private enumValue<T extends Record<string, string>>(source: T, value: string | undefined, field: string) {
    const normalized = value?.trim().toUpperCase().replaceAll('-', '_').replaceAll(' ', '_');
    if (normalized && Object.values(source).includes(normalized)) return normalized as T[keyof T];
    throw new BadRequestException(`${field} is invalid.`);
  }

  private clampNumber(value: unknown, fallback: number, min: number, max: number) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, Math.trunc(parsed)));
  }
}

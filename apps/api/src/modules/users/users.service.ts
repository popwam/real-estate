import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isPlatformUser } from '../../common/organization-scope';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { HashService } from '../auth/hash.service';
import { PrismaService } from '../database/prisma.service';
import { ROLE_PERMISSIONS } from '../permissions/rbac.seed';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const ROLE_TO_USER_ROLE: Record<string, string> = {
  platform_owner: 'PLATFORM_OWNER',
  platform_admin: 'PLATFORM_ADMIN',
  platform_support: 'PLATFORM_SUPPORT',
  platform_auditor: 'PLATFORM_AUDITOR',
  developer_owner: 'DEVELOPER_OWNER',
  developer_admin: 'DEVELOPER_ADMIN',
  developer_sales_manager: 'DEVELOPER_SALES_MANAGER',
  developer_sales_agent: 'DEVELOPER_SALES_AGENT',
  brokerage_owner: 'BROKERAGE_OWNER',
  brokerage_admin: 'BROKERAGE_ADMIN',
  broker: 'BROKER',
  individual_broker: 'INDIVIDUAL_BROKER',
  client: 'CLIENT',
};

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hashService: HashService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async findAll(currentUser: AuthenticatedRequestUser) {
    if (isPlatformUser(currentUser)) {
      return this.prisma.user.findMany({
        include: { organization: true, role: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    this.assertCanManageOwnOrgUsers(currentUser);

    return this.prisma.user.findMany({
      where: { organizationId: currentUser.organizationId },
      include: { organization: true, role: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateUserDto, currentUser: AuthenticatedRequestUser) {
    this.assertCreateDto(dto);

    const email = dto.email.trim().toLowerCase();
    const organizationId = this.resolveTargetOrganizationId(
      dto.organizationId,
      currentUser,
    );
    const roleName = dto.role ?? this.defaultRoleFor(currentUser);
    const userRole = this.userRoleFor(roleName);
    const existingUser = await this.prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      throw new ConflictException('Email is already registered.');
    }

    const passwordHash = dto.password
      ? await this.hashService.hash(dto.password)
      : undefined;

    const user = await this.prisma.$transaction(async (tx) => {
      const role = await this.ensureOrganizationRole(
        tx,
        organizationId,
        roleName,
      );

      return tx.user.create({
        data: {
          organizationId,
          roleId: role.id,
          email,
          passwordHash,
          firstName: this.optionalString(dto.firstName),
          lastName: this.optionalString(dto.lastName),
          phone: this.optionalString(dto.phone),
          userRole,
        },
        include: { organization: true, role: true },
      });
    });

    await this.auditLogs.record({
      action: 'user.created',
      entityType: 'User',
      entityId: user.id,
      organizationId,
      actor: currentUser,
      metadata: { role: roleName, invitePlaceholder: !dto.password },
    });

    return user;
  }

  async findOne(id: string, currentUser: AuthenticatedRequestUser) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { organization: true, role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    this.assertCanAccessUser(user.organizationId, currentUser);

    return user;
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    const existing = await this.findOne(id, currentUser);
    const roleName = dto.role ?? existing.role?.name;
    const userRole = roleName ? this.userRoleFor(roleName) : existing.userRole;
    const role = roleName
      ? await this.ensureOrganizationRole(
          this.prisma,
          existing.organizationId,
          roleName,
        )
      : null;

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        firstName: this.optionalString(dto.firstName),
        lastName: this.optionalString(dto.lastName),
        phone: this.optionalString(dto.phone),
        userRole,
        roleId: role?.id ?? existing.roleId,
      },
      include: { organization: true, role: true },
    });

    await this.auditLogs.record({
      action: 'user.updated',
      entityType: 'User',
      entityId: id,
      organizationId: updated.organizationId,
      actor: currentUser,
    });

    return updated;
  }

  async setActive(
    id: string,
    isActive: boolean,
    currentUser: AuthenticatedRequestUser,
  ) {
    const existing = await this.findOne(id, currentUser);
    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive },
      include: { organization: true, role: true },
    });

    await this.auditLogs.record({
      action: isActive ? 'user.activated' : 'user.deactivated',
      entityType: 'User',
      entityId: id,
      organizationId: existing.organizationId,
      actor: currentUser,
    });

    return updated;
  }

  private resolveTargetOrganizationId(
    requestedOrganizationId: string | undefined,
    currentUser: AuthenticatedRequestUser,
  ) {
    if (isPlatformUser(currentUser)) {
      const organizationId = requestedOrganizationId ?? currentUser.organizationId;

      if (!organizationId) {
        throw new BadRequestException('organizationId is required.');
      }

      return organizationId;
    }

    this.assertCanManageOwnOrgUsers(currentUser);

    if (
      requestedOrganizationId &&
      requestedOrganizationId !== currentUser.organizationId
    ) {
      throw new ForbiddenException('Cannot manage another organization users.');
    }

    if (!currentUser.organizationId) {
      throw new ForbiddenException('Current organization is required.');
    }

    return currentUser.organizationId;
  }

  private assertCanAccessUser(
    organizationId: string | null,
    currentUser: AuthenticatedRequestUser,
  ) {
    if (isPlatformUser(currentUser)) {
      return;
    }

    this.assertCanManageOwnOrgUsers(currentUser);

    if (!organizationId || organizationId !== currentUser.organizationId) {
      throw new ForbiddenException('Cannot access another organization user.');
    }
  }

  private assertCanManageOwnOrgUsers(currentUser: AuthenticatedRequestUser) {
    if (
      currentUser.permissions.includes('users.manage_own_org') ||
      ['developer_owner', 'developer_admin', 'brokerage_owner', 'brokerage_admin'].includes(
        currentUser.role,
      )
    ) {
      return;
    }

    throw new ForbiddenException('User management permission is required.');
  }

  private async ensureOrganizationRole(
    prisma: Pick<any, 'role' | 'permission' | 'rolePermission'>,
    organizationId: string | null,
    roleName: string,
  ) {
    const role = await prisma.role.upsert({
      where: { organizationId_name: { organizationId, name: roleName } },
      create: {
        organizationId,
        name: roleName,
        isSystem: true,
        description: `Organization role: ${roleName}`,
      },
      update: {},
    });

    for (const permissionKey of ROLE_PERMISSIONS[roleName] ?? []) {
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
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
        update: {},
      });
    }

    return role;
  }

  private defaultRoleFor(currentUser: AuthenticatedRequestUser) {
    if (currentUser.organizationType === 'DEVELOPER') {
      return 'developer_sales_agent';
    }

    if (currentUser.organizationType === 'BROKERAGE') {
      return 'broker';
    }

    if (currentUser.organizationType === 'INDIVIDUAL_BROKER') {
      return 'individual_broker';
    }

    return 'client';
  }

  private userRoleFor(roleName: string) {
    const userRole = ROLE_TO_USER_ROLE[roleName];

    if (!userRole) {
      throw new BadRequestException(`Unsupported role: ${roleName}`);
    }

    return userRole as any;
  }

  private assertCreateDto(dto: CreateUserDto) {
    if (!this.isValidEmail(dto.email)) {
      throw new BadRequestException('email is invalid.');
    }
  }

  private optionalString(value: string | undefined) {
    const trimmed = value?.trim();
    return trimmed || undefined;
  }

  private isValidEmail(value: string | undefined) {
    return Boolean(value?.trim().match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/));
  }
}

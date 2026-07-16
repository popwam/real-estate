import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { normalizeOptionalPhoneOrThrow, normalizePhone, normalizePhoneForCountry, phonesMatch } from '../../common/phone-normalization';
import { requireCanonicalOrganizationType } from '../../common/organization-types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../database/prisma.service';
import {
  OWNER_ROLE_BY_ORGANIZATION_TYPE,
  ROLE_NAME_BY_USER_ROLE,
} from './constants';
import { AuthResponseDto, CurrentUserResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterOrganizationDto } from './dto/register-organization.dto';
import { HashService } from './hash.service';
import { JwtService } from './jwt.service';
import { AuthenticatedRequestUser } from './types/jwt-payload';
import { ROLE_PERMISSIONS } from '../permissions/rbac.seed';
import { buildAccessVersion } from './access-version';
import {
  isBlockedOrganizationStatus,
  isOperationalOrganizationStatus,
} from '../../common/organization-status';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hashService: HashService,
    private readonly jwtService: JwtService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async register(dto: RegisterOrganizationDto): Promise<AuthResponseDto> {
    this.assertRegisterDto(dto);

    const email = dto.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      throw new ConflictException('Email is already registered.');
    }

    const phone = normalizeOptionalPhoneOrThrow(dto.phone);
    await this.assertPhoneAvailable(phone);

    const organizationType = dto.organizationType;
    const userRole = OWNER_ROLE_BY_ORGANIZATION_TYPE[organizationType];
    const roleName = ROLE_NAME_BY_USER_ROLE[userRole];
    const passwordHash = await this.hashService.hash(dto.password);
    const baseSlug = this.slugify(dto.organizationName);
    const slug = await this.createUniqueOrganizationSlug(baseSlug);

    return this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: dto.organizationName.trim(),
          slug,
          type: organizationType,
          country: this.optionalString(dto.country),
          city: this.optionalString(dto.city),
          status: 'DRAFT',
          profile: {
            create: {
              legalName: this.optionalString(dto.legalName),
              tradeName: this.optionalString(dto.tradeName),
              email,
              phone,
            },
          },
        },
      });

      const role = await tx.role.create({
        data: {
          organizationId: organization.id,
          name: roleName,
          isSystem: true,
          description: 'Initial owner role created during registration.',
        },
      });

      await this.ensureRolePermissions(tx, role.id, roleName);

      const user = await tx.user.create({
        data: {
          organizationId: organization.id,
          roleId: role.id,
          email,
          passwordHash,
          firstName: this.optionalString(dto.firstName),
          lastName: this.optionalString(dto.lastName),
          phone,
          userRole,
        },
        include: {
          organization: { include: { subscription: true } },
          hrEmployeeProfile: true,
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      return this.issueAuthResponse(user, tx);
    });
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    this.assertLoginDto(dto);

    const identifier = this.loginIdentifier(dto);
    const identifierKind = this.isValidEmail(identifier) ? 'email' : 'phone';
    const user = await this.findLoginUser(identifier);

    if (
      !user ||
      !user.isActive ||
      !this.organizationCanLogin(user.organization) ||
      this.hrEmployeeIsInactive(user.hrEmployeeProfile)
    ) {
      await this.recordLoginAudit(
        'auth.login_failed',
        user,
        identifierKind,
        this.loginFailureReason(user),
      );
      throw new UnauthorizedException('Invalid login details.');
    }

    const loginMethodAllowed = await this.loginMethodAllowed(user, identifierKind);
    if (!loginMethodAllowed) {
      await this.recordLoginAudit('auth.login_failed', user, identifierKind, 'login_method_not_allowed');
      throw new UnauthorizedException('Invalid login details.');
    }

    if (!user.passwordHash) {
      await this.recordLoginAudit(
        'auth.login_failed',
        user,
        identifierKind,
        'missing_password',
      );
      throw new UnauthorizedException('Invalid login details.');
    }

    const passwordValid = await this.hashService.verify(
      dto.password,
      user.passwordHash,
    );

    if (!passwordValid) {
      await this.recordLoginAudit(
        'auth.login_failed',
        user,
        identifierKind,
        'invalid_password',
      );
      throw new UnauthorizedException('Invalid login details.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    await this.recordLoginAudit('auth.login_success', user, identifierKind);

    return this.issueAuthResponse(user);
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthResponseDto> {
    this.assertRefreshTokenDto(dto);

    const payload = this.jwtService.verifyRefreshToken(dto.refreshToken);
    const tokenHash = this.hashService.fingerprint(dto.refreshToken);
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (
      !storedToken ||
      storedToken.userId !== payload.userId ||
      storedToken.revokedAt ||
      storedToken.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        organization: { include: { subscription: true } },
        hrEmployeeProfile: true,
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive || this.hrEmployeeIsInactive(user.hrEmployeeProfile)) {
      throw new UnauthorizedException('User is not active.');
    }

    if (!this.organizationCanLogin(user.organization)) {
      throw new UnauthorizedException('Organization is not active.');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });

      return this.issueAuthResponse(user, tx);
    });
  }

  async logout(dto: LogoutDto) {
    this.assertRefreshTokenDto(dto);

    const tokenHash = this.hashService.fingerprint(dto.refreshToken);

    await this.prisma.refreshToken.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return { success: true };
  }

  async changePassword(
    currentUser: AuthenticatedRequestUser,
    dto: { currentPassword?: string; newPassword?: string },
  ) {
    if (!dto.currentPassword || !dto.newPassword) {
      throw new BadRequestException('currentPassword and newPassword are required.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: currentUser.userId },
      include: { organization: { include: { subscription: true } } },
    });

    if (!user?.isActive || !this.organizationCanLogin(user.organization)) {
      throw new UnauthorizedException('User is not active.');
    }

    const passwordValid = await this.hashService.verify(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!passwordValid) {
      throw new UnauthorizedException('Current password is invalid.');
    }

    this.assertNewPassword(dto.newPassword, user);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await this.hashService.hash(dto.newPassword),
        mustChangePassword: false,
      },
    });

    await this.auditLogs.record({
      action: 'auth.password_changed',
      entityType: 'User',
      entityId: user.id,
      actor: currentUser,
      organizationId: user.organizationId,
    });

    return { passwordChanged: true };
  }

  async me(currentUser: AuthenticatedRequestUser): Promise<CurrentUserResponseDto> {
    if (currentUser.session) return currentUser.session;

    const user = await this.prisma.user.findUnique({
      where: { id: currentUser.userId },
      include: {
        organization: { include: { subscription: true } },
        hrEmployeeProfile: true,
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive || this.hrEmployeeIsInactive(user.hrEmployeeProfile)) {
      throw new UnauthorizedException('User is not active.');
    }

    if (!this.organizationCanLogin(user.organization)) {
      throw new UnauthorizedException('Organization is not active.');
    }

    return {
      user: this.toUserSummary(user),
      organization: this.toOrganizationSummary(user.organization),
      permissions: this.toPermissions(user.role),
      hrEmployee: user.hrEmployeeProfile
        ? {
            id: user.hrEmployeeProfile.id,
            status: user.hrEmployeeProfile.status,
            attendanceEnabled: user.hrEmployeeProfile.status === 'ACTIVE',
          }
        : null,
      accessVersion: buildAccessVersion(user),
    };
  }

  private async issueAuthResponse(
    user: any,
    prisma: Pick<PrismaService, 'refreshToken'> = this.prisma,
  ): Promise<AuthResponseDto> {
    const permissions = this.toPermissions(user.role);
    const role = this.roleName(user);
    const payload = {
      userId: user.id,
      organizationId: user.organizationId,
      organizationType: user.organization?.type ?? null,
      role,
      permissions,
      mustChangePassword: Boolean(user.mustChangePassword),
      accessVersion: buildAccessVersion(user),
    };
    const accessToken = this.jwtService.signAccessToken(payload);
    const refreshToken = this.jwtService.signRefreshToken(payload);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashService.fingerprint(refreshToken),
        expiresAt: this.jwtService.refreshTokenExpiresAt(),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: this.toUserSummary(user),
      organization: this.toOrganizationSummary(user.organization),
      permissions,
      hrEmployee: user.hrEmployeeProfile
        ? {
            id: user.hrEmployeeProfile.id,
            status: user.hrEmployeeProfile.status,
            attendanceEnabled: user.hrEmployeeProfile.status === 'ACTIVE',
          }
        : null,
      accessVersion: payload.accessVersion,
    };
  }

  private toUserSummary(user: any) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: this.roleName(user),
      mustChangePassword: Boolean(user.mustChangePassword),
    };
  }

  private toOrganizationSummary(organization: any) {
    return {
      id: organization?.id ?? null,
      name: organization?.name ?? null,
      slug: organization?.slug ?? null,
      type: organization?.type ?? null,
      status: organization?.status ?? null,
      country: organization?.country ?? null,
    };
  }

  private toPermissions(role: any) {
    return (
      role?.permissions?.map((rolePermission: any) => rolePermission.permission.key) ??
      []
    );
  }

  private roleName(user: any) {
    return (
      user.role?.name ??
      ROLE_NAME_BY_USER_ROLE[user.userRole as keyof typeof ROLE_NAME_BY_USER_ROLE]
    );
  }

  private hrEmployeeIsInactive(employee: any) {
    return Boolean(
      employee && (employee.status !== 'ACTIVE' || employee.loginEnabled === false),
    );
  }

  private async ensureRolePermissions(
    prisma: Pick<any, 'permission' | 'rolePermission'>,
    roleId: string,
    roleName: string,
  ) {
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
            roleId,
            permissionId: permission.id,
          },
        },
        create: {
          roleId,
          permissionId: permission.id,
        },
        update: {},
      });
    }
  }

  private async createUniqueOrganizationSlug(baseSlug: string) {
    let slug = baseSlug;
    let suffix = 1;

    while (await this.prisma.organization.findUnique({ where: { slug } })) {
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }

    return slug;
  }

  private slugify(value: string) {
    const slug = value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    return slug || `organization-${Date.now()}`;
  }

  private async findLoginUser(identifier: string) {
    const include = {
      organization: { include: { subscription: true } },
      hrEmployeeProfile: true,
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    };

    if (this.isValidEmail(identifier)) {
      return this.prisma.user.findUnique({
        where: { email: identifier.trim().toLowerCase() },
        include,
      });
    }

    const normalizedPhone = normalizePhone(identifier);
    const egyptPhone = normalizePhoneForCountry(identifier, 'Egypt');
    if (!normalizedPhone && !egyptPhone) return null;

    const users = await this.prisma.user.findMany({
      where: { phone: { not: null } },
      include,
    });
    const matches = users.filter(
      (user) =>
        phonesMatch(user.phone, normalizedPhone) ||
        phonesMatch(user.phone, egyptPhone),
    );

    return matches.length === 1 ? matches[0] : null;
  }

  private assertNewPassword(password: string, user: any) {
    if (password.length < 8) {
      throw new BadRequestException('newPassword must be at least 8 characters.');
    }
    if (password === '123456') {
      throw new BadRequestException('newPassword cannot be the temporary password.');
    }
    if (password === user.email || password === user.phone) {
      throw new BadRequestException('newPassword cannot match email or phone.');
    }
  }

  private async assertPhoneAvailable(phone: string | undefined) {
    if (!phone) return;

    const users = await this.prisma.user.findMany({
      where: { phone: { not: null } },
      select: { id: true, phone: true },
    });
    const conflict = users.some((user) => phonesMatch(user.phone, phone));
    if (conflict) {
      throw new ConflictException('Phone number cannot be used for this account.');
    }
  }

  private organizationCanLogin(organization: any) {
    if (!organization) return true;
    if (isBlockedOrganizationStatus(organization.status)) return false;
    if (organization.type !== 'PLATFORM' && !isOperationalOrganizationStatus(organization.status)) {
      return false;
    }
    const subscription = organization.subscription;
    if (subscription?.status && ['EXPIRED', 'SUSPENDED', 'CANCELLED'].includes(subscription.status)) {
      return false;
    }
    if (subscription?.endsAt && subscription.endsAt <= new Date() && !subscription.autoRenew) {
      return false;
    }
    return true;
  }

  private async loginMethodAllowed(user: any, identifierKind: 'email' | 'phone') {
    const organization = user.organization;
    if (!organization || organization.type === 'PLATFORM') return true;

    const method = identifierKind === 'email' ? 'EMAIL_PASSWORD' : 'PHONE_PASSWORD';
    const enabledByCompany = this.stringValues(organization.enabledLoginMethods);
    if (!enabledByCompany.includes(method)) return false;

    const planCode = organization.subscription?.planCode;
    if (!planCode) return false;
    const plan = await this.prisma.platformPlan.findUnique({
      where: { code: planCode },
      select: { isActive: true, isArchived: true, allowedLoginMethods: true },
    });
    return Boolean(
      plan?.isActive &&
      !plan.isArchived &&
      this.stringValues(plan.allowedLoginMethods).includes(method),
    );
  }

  private stringValues(value: unknown) {
    return Array.isArray(value)
      ? value.filter((entry): entry is string => typeof entry === 'string')
      : [];
  }

  private loginFailureReason(user: any | undefined) {
    if (!user) return 'unknown_identifier';
    if (!user.isActive) return 'inactive_user';
    if (!this.organizationCanLogin(user.organization)) return 'inactive_organization';
    if (this.hrEmployeeIsInactive(user.hrEmployeeProfile)) return 'inactive_employee';
    return 'invalid_credentials';
  }

  private async recordLoginAudit(
    action: string,
    user: any | undefined,
    identifierKind: string,
    failureReason?: string,
  ) {
    try {
      await this.auditLogs.record({
        action,
        entityType: 'User',
        entityId: user?.id,
        organizationId: user?.organizationId ?? null,
        metadata: failureReason ? { identifierKind, failureReason } : { identifierKind },
      });
    } catch {
      // Login should not fail because audit persistence is unavailable.
    }
  }

  private loginIdentifier(dto: LoginDto) {
    return (dto.identifier ?? dto.email ?? dto.phone ?? '').trim();
  }

  private optionalString(value: string | undefined) {
    const trimmed = value?.trim();
    return trimmed || undefined;
  }

  private assertRegisterDto(dto: RegisterOrganizationDto) {
    if (!dto.organizationName?.trim()) {
      throw new BadRequestException('organizationName is required.');
    }

    requireCanonicalOrganizationType(dto.organizationType);

    if (!this.isValidEmail(dto.email)) {
      throw new BadRequestException('email is invalid.');
    }

    if (!dto.password || dto.password.length < 8) {
      throw new BadRequestException('password must be at least 8 characters.');
    }
  }

  private assertLoginDto(dto: LoginDto) {
    if (!this.loginIdentifier(dto) || !dto.password) {
      throw new BadRequestException('identifier and password are required.');
    }
  }

  private assertRefreshTokenDto(dto: RefreshTokenDto | LogoutDto) {
    if (!dto.refreshToken) {
      throw new BadRequestException('refreshToken is required.');
    }
  }

  private isValidEmail(value: string | undefined) {
    return Boolean(value?.trim().match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/));
  }
}

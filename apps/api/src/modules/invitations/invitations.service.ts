import {
  BadRequestException,
  ConflictException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { normalizeOptionalPhoneOrThrow, phonesMatch } from '../../common/phone-normalization';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { ROLE_NAME_BY_USER_ROLE } from '../auth/constants';
import { HashService } from '../auth/hash.service';
import { PrismaService } from '../database/prisma.service';
import { ROLE_PERMISSIONS } from '../permissions/rbac.seed';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hashService: HashService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async getPublicInvitation(token: string) {
    const invitation = await this.findByToken(token);
    const status = await this.statusWithExpiry(invitation);

    return {
      organization: {
        id: invitation.organization.id,
        name: invitation.organization.name,
        type: invitation.organization.type,
      },
      email: this.maskEmail(invitation.email),
      intendedRole: invitation.intendedRole,
      status,
      expiresAt: invitation.expiresAt,
      canAccept: status === 'PENDING',
    };
  }

  async accept(token: string, dto: AcceptInvitationDto) {
    this.assertAcceptDto(dto);
    const tokenHash = this.hashService.fingerprint(token);
    const initial = await this.findByToken(token);
    if (initial.status === 'ACCEPTED') {
      throw new ConflictException('Invitation has already been accepted.');
    }
    if (initial.status !== 'PENDING') {
      throw new GoneException('Invitation is no longer available.');
    }
    if (initial.expiresAt <= new Date()) {
      await this.prisma.organizationInvitation.update({
        where: { id: initial.id },
        data: { status: 'EXPIRED' },
      });
      throw new GoneException('Invitation has expired.');
    }
    const phone = normalizeOptionalPhoneOrThrow(dto.phone);
    const passwordHash = await this.hashService.hash(dto.password);

    const acceptedInvitation = await this.prisma.$transaction(async (tx) => {
      const invitation = await tx.organizationInvitation.findUnique({
        where: { tokenHash },
        include: { organization: true },
      });

      if (!invitation) throw new NotFoundException('Invitation not found.');
      if (invitation.status === 'ACCEPTED') {
        throw new ConflictException('Invitation has already been accepted.');
      }
      if (invitation.status !== 'PENDING') {
        throw new GoneException('Invitation is no longer available.');
      }
      if (invitation.expiresAt <= new Date()) {
        await tx.organizationInvitation.update({
          where: { id: invitation.id },
          data: { status: 'EXPIRED' },
        });
        throw new GoneException('Invitation has expired.');
      }

      const existing = await tx.user.findUnique({
        where: { email: invitation.email },
      });
      if (
        existing &&
        (existing.passwordHash ||
          existing.organizationId !== invitation.organizationId)
      ) {
        throw new ConflictException('Email is already registered.');
      }
      await this.assertPhoneAvailable(phone, existing?.id);

      const roleName = ROLE_NAME_BY_USER_ROLE[invitation.intendedRole];
      const role = await tx.role.upsert({
        where: {
          organizationId_name: {
            organizationId: invitation.organizationId,
            name: roleName,
          },
        },
        create: {
          organizationId: invitation.organizationId,
          name: roleName,
          description: 'Role created for organization invitation.',
          isSystem: true,
        },
        update: {},
      });

      await this.ensureRolePermissions(tx, role.id, roleName);
      const user = existing
        ? await tx.user.update({
            where: { id: existing.id },
            data: {
              organizationId: invitation.organizationId,
              roleId: role.id,
              passwordHash,
              firstName: this.optionalString(dto.firstName) ?? existing.firstName,
              lastName: this.optionalString(dto.lastName) ?? existing.lastName,
              phone: phone ?? existing.phone,
              userRole: invitation.intendedRole,
              isActive: true,
            },
          })
        : await tx.user.create({
            data: {
              organizationId: invitation.organizationId,
              roleId: role.id,
              email: invitation.email,
              passwordHash,
              firstName: this.optionalString(dto.firstName),
              lastName: this.optionalString(dto.lastName),
              phone,
              userRole: invitation.intendedRole,
            },
          });

      await tx.organizationInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
          acceptedByUserId: user.id,
        },
      });

      return {
        invitationId: invitation.id,
        organizationId: invitation.organizationId,
        intendedRole: invitation.intendedRole,
        accepted: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          userRole: user.userRole,
        },
        organization: {
          id: invitation.organization.id,
          name: invitation.organization.name,
          slug: invitation.organization.slug,
          type: invitation.organization.type,
        },
      };
    });

    await this.recordAcceptedInvitation(
      {
        id: acceptedInvitation.invitationId,
        organizationId: acceptedInvitation.organizationId,
        intendedRole: acceptedInvitation.intendedRole,
      },
      acceptedInvitation.user.id,
    );

    return {
      accepted: acceptedInvitation.accepted,
      user: acceptedInvitation.user,
      organization: acceptedInvitation.organization,
    };
  }

  private async assertPhoneAvailable(phone: string | undefined, exceptUserId?: string) {
    if (!phone) return;

    const users = await this.prisma.user.findMany({
      where: { phone: { not: null } },
      select: { id: true, phone: true },
    });
    const conflict = users.some(
      (user) => user.id !== exceptUserId && phonesMatch(user.phone, phone),
    );
    if (conflict) {
      throw new ConflictException('Phone number cannot be used for this account.');
    }
  }

  private async findByToken(token: string) {
    if (!token || token.length < 32 || token.length > 512) {
      throw new NotFoundException('Invitation not found.');
    }
    const invitation = await this.prisma.organizationInvitation.findUnique({
      where: { tokenHash: this.hashService.fingerprint(token) },
      include: { organization: true },
    });
    if (!invitation) throw new NotFoundException('Invitation not found.');
    return invitation;
  }

  private async statusWithExpiry(invitation: { id: string; status: string; expiresAt: Date }) {
    if (invitation.status === 'PENDING' && invitation.expiresAt <= new Date()) {
      await this.prisma.organizationInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      return 'EXPIRED';
    }
    return invitation.status;
  }

  private async ensureRolePermissions(
    tx: Prisma.TransactionClient,
    roleId: string,
    roleName: string,
  ) {
    for (const permissionKey of ROLE_PERMISSIONS[roleName] ?? []) {
      const permission = await tx.permission.upsert({
        where: { key: permissionKey },
        create: { key: permissionKey, description: `Base permission: ${permissionKey}` },
        update: {},
      });
      await tx.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId: permission.id } },
        create: { roleId, permissionId: permission.id },
        update: {},
      });
    }
  }

  private assertAcceptDto(dto: AcceptInvitationDto) {
    if (!dto.password || dto.password.length < 10 || dto.password.length > 200) {
      throw new BadRequestException('password must be between 10 and 200 characters.');
    }
  }

  private maskEmail(email: string) {
    const [local, domain] = email.split('@');
    return `${local.slice(0, 2)}***@${domain}`;
  }

  private optionalString(value?: string) {
    const clean = value?.trim();
    return clean ? clean.slice(0, 200) : undefined;
  }

  private async recordAcceptedInvitation(invitation: any, userId: string) {
    try {
      await this.auditLogs.record({
        action: 'organization.invitation_accepted',
        entityType: 'OrganizationInvitation',
        entityId: invitation.id,
        organizationId: invitation.organizationId,
        metadata: {
          acceptedByUserId: userId,
          intendedRole: invitation.intendedRole,
        },
      });
    } catch {
      // Invitation acceptance should not fail because audit persistence is unavailable.
    }
  }
}

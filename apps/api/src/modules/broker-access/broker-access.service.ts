import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BrokerAccessGranteeType,
  BrokerAccessLevel,
  OrganizationType,
  UserRole,
} from '@prisma/client';
import { isPlatformUser } from '../../common/organization-scope';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../database/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { CreateBrokerAccessRuleDto } from './dto/create-broker-access-rule.dto';
import { UpdateBrokerAccessRuleDto } from './dto/update-broker-access-rule.dto';

@Injectable()
export class BrokerAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: ProjectsService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async create(
    dto: CreateBrokerAccessRuleDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    this.assertCreateDto(dto);
    const project = await this.projectsService.findOne(dto.projectId, currentUser);
    this.projectsService.assertCanManageDeveloper(project.developerId, currentUser);
    await this.assertValidGrantee(dto.granteeType, dto.granteeId);

    const rule = await this.prisma.brokerAccessRule.upsert({
      where: {
        projectId_granteeType_granteeId: {
          projectId: project.id,
          granteeType: dto.granteeType as BrokerAccessGranteeType,
          granteeId: dto.granteeId,
        },
      },
      create: {
        projectId: project.id,
        developerId: project.developerId,
        granteeType: dto.granteeType as BrokerAccessGranteeType,
        granteeId: dto.granteeId,
        accessLevel: dto.accessLevel as BrokerAccessLevel,
        expiresAt: this.optionalDate(dto.expiresAt),
        grantedById: currentUser.userId,
      },
      update: {
        accessLevel: dto.accessLevel as BrokerAccessLevel,
        expiresAt: this.optionalDate(dto.expiresAt),
        grantedAt: new Date(),
        grantedById: currentUser.userId,
      },
      include: this.ruleInclude(),
    });

    await this.auditLogs.record({
      action: 'broker_access.granted',
      entityType: 'BrokerAccessRule',
      entityId: rule.id,
      organizationId: rule.developerId,
      actor: currentUser,
      metadata: {
        projectId: rule.projectId,
        granteeType: rule.granteeType,
        granteeId: rule.granteeId,
        accessLevel: rule.accessLevel,
      },
    });

    return rule;
  }

  async findMany(currentUser: AuthenticatedRequestUser) {
    if (isPlatformUser(currentUser)) {
      return this.prisma.brokerAccessRule.findMany({
        include: this.ruleInclude(),
        orderBy: { createdAt: 'desc' },
      });
    }

    if (currentUser.organizationType === 'DEVELOPER' && currentUser.organizationId) {
      return this.prisma.brokerAccessRule.findMany({
        where: { developerId: currentUser.organizationId },
        include: this.ruleInclude(),
        orderBy: { createdAt: 'desc' },
      });
    }

    if (currentUser.organizationType === 'BROKERAGE' && currentUser.organizationId) {
      return this.prisma.brokerAccessRule.findMany({
        where: {
          OR: [
            {
              granteeType: 'BROKERAGE',
              granteeId: currentUser.organizationId,
            },
            {
              granteeType: 'BROKER',
              granteeId: currentUser.userId,
            },
          ],
        },
        include: this.ruleInclude(),
        orderBy: { createdAt: 'desc' },
      });
    }

    return this.prisma.brokerAccessRule.findMany({
      where: {
        granteeType: 'BROKER',
        granteeId: currentUser.userId,
      },
      include: this.ruleInclude(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, currentUser: AuthenticatedRequestUser) {
    const rule = await this.prisma.brokerAccessRule.findUnique({
      where: { id },
      include: this.ruleInclude(),
    });

    if (!rule) {
      throw new NotFoundException('Broker access rule not found.');
    }

    this.assertCanRead(rule, currentUser);

    return rule;
  }

  async update(
    id: string,
    dto: UpdateBrokerAccessRuleDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    const existing = await this.findOne(id, currentUser);
    this.projectsService.assertCanManageDeveloper(existing.developerId, currentUser);
    this.assertUpdateDto(dto);

    const rule = await this.prisma.brokerAccessRule.update({
      where: { id },
      data: {
        accessLevel: dto.accessLevel as BrokerAccessLevel | undefined,
        expiresAt:
          dto.expiresAt === null ? null : this.optionalDate(dto.expiresAt),
      },
      include: this.ruleInclude(),
    });

    await this.auditLogs.record({
      action: 'broker_access.updated',
      entityType: 'BrokerAccessRule',
      entityId: rule.id,
      organizationId: rule.developerId,
      actor: currentUser,
      metadata: { accessLevel: rule.accessLevel, expiresAt: rule.expiresAt },
    });

    return rule;
  }

  async remove(id: string, currentUser: AuthenticatedRequestUser) {
    const existing = await this.findOne(id, currentUser);
    this.projectsService.assertCanManageDeveloper(existing.developerId, currentUser);

    await this.prisma.brokerAccessRule.delete({ where: { id } });

    await this.auditLogs.record({
      action: 'broker_access.revoked',
      entityType: 'BrokerAccessRule',
      entityId: existing.id,
      organizationId: existing.developerId,
      actor: currentUser,
      metadata: {
        projectId: existing.projectId,
        granteeType: existing.granteeType,
        granteeId: existing.granteeId,
      },
    });

    return { success: true };
  }

  private assertCanRead(rule: any, currentUser: AuthenticatedRequestUser) {
    if (isPlatformUser(currentUser)) {
      return;
    }

    if (
      currentUser.organizationType === 'DEVELOPER' &&
      currentUser.organizationId === rule.developerId
    ) {
      return;
    }

    if (
      rule.granteeType === 'BROKERAGE' &&
      currentUser.organizationId === rule.granteeId
    ) {
      return;
    }

    if (rule.granteeType === 'BROKER' && currentUser.userId === rule.granteeId) {
      return;
    }

    throw new ForbiddenException('Cannot access this broker access rule.');
  }

  private assertCreateDto(dto: CreateBrokerAccessRuleDto) {
    if (!dto.projectId?.trim()) {
      throw new BadRequestException('projectId is required.');
    }

    if (!dto.granteeId?.trim()) {
      throw new BadRequestException('granteeId is required.');
    }

    if (
      !Object.values(BrokerAccessGranteeType).includes(
        dto.granteeType as BrokerAccessGranteeType,
      )
    ) {
      throw new BadRequestException('granteeType is invalid.');
    }

    if (!dto.accessLevel?.trim()) {
      throw new BadRequestException('accessLevel is required.');
    }

    this.assertUpdateDto(dto);
  }

  private assertUpdateDto(dto: UpdateBrokerAccessRuleDto) {
    if (
      dto.accessLevel &&
      !Object.values(BrokerAccessLevel).includes(
        dto.accessLevel as BrokerAccessLevel,
      )
    ) {
      throw new BadRequestException('accessLevel is invalid.');
    }
  }

  private async assertValidGrantee(granteeType: string, granteeId: string) {
    if (granteeType === 'BROKERAGE') {
      const brokerage = await this.prisma.organization.findFirst({
        where: { id: granteeId, type: OrganizationType.BROKERAGE },
      });

      if (!brokerage) {
        throw new BadRequestException('Brokerage grantee was not found.');
      }

      return;
    }

    const broker = await this.prisma.user.findFirst({
      where: {
        id: granteeId,
        userRole: { in: [UserRole.BROKER, UserRole.INDIVIDUAL_BROKER] },
      },
    });

    if (!broker) {
      throw new BadRequestException('Broker grantee was not found.');
    }
  }

  private ruleInclude() {
    return {
      project: true,
      developer: true,
      grantedBy: true,
    };
  }

  private optionalDate(value: string | null | undefined) {
    if (!value) {
      return undefined;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Date value is invalid.');
    }

    return date;
  }
}

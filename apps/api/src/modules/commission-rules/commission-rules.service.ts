import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CommissionPartyType, CommissionType, Prisma } from '@prisma/client';
import { isPlatformUser } from '../../common/organization-scope';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../database/prisma.service';
import { CreateCommissionRuleDto } from './dto/create-commission-rule.dto';
import { UpdateCommissionRuleDto } from './dto/update-commission-rule.dto';

@Injectable()
export class CommissionRulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async create(
    dto: CreateCommissionRuleDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    this.assertDeveloperManager(currentUser);
    this.assertDto(dto, true);

    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    this.assertCanManageDeveloper(project.developerId, currentUser);

    const rule = await this.prisma.commissionRule.create({
      data: {
        developerId: project.developerId,
        projectId: project.id,
        partyType: dto.partyType as CommissionPartyType,
        targetOrganizationId: this.optionalString(dto.targetOrganizationId),
        targetUserId: this.optionalString(dto.targetUserId),
        commissionType: dto.commissionType as CommissionType,
        value: new Prisma.Decimal(dto.value),
        currency: this.optionalString(dto.currency) ?? 'EGP',
        isActive: dto.isActive ?? true,
        notes: this.optionalString(dto.notes),
      },
      include: this.ruleInclude(),
    });

    await this.auditLogs.record({
      action: 'commission_rule.created',
      entityType: 'CommissionRule',
      entityId: rule.id,
      actor: currentUser,
      organizationId: rule.developerId,
      metadata: { projectId: rule.projectId, partyType: rule.partyType },
    });

    return rule;
  }

  async findMany(currentUser: AuthenticatedRequestUser) {
    if (isPlatformUser(currentUser)) {
      return this.prisma.commissionRule.findMany({
        include: this.ruleInclude(),
        orderBy: { createdAt: 'desc' },
      });
    }

    this.assertDeveloperManager(currentUser);

    return this.prisma.commissionRule.findMany({
      where: { developerId: currentUser.organizationId ?? undefined },
      include: this.ruleInclude(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, currentUser: AuthenticatedRequestUser) {
    const rule = await this.prisma.commissionRule.findUnique({
      where: { id },
      include: this.ruleInclude(),
    });

    if (!rule) {
      throw new NotFoundException('Commission rule not found.');
    }

    this.assertCanManageDeveloper(rule.developerId, currentUser);

    return rule;
  }

  async update(
    id: string,
    dto: UpdateCommissionRuleDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    const existing = await this.findOne(id, currentUser);
    this.assertDto(dto, false);

    const rule = await this.prisma.commissionRule.update({
      where: { id },
      data: {
        partyType: dto.partyType as CommissionPartyType | undefined,
        targetOrganizationId:
          dto.targetOrganizationId === null
            ? null
            : this.optionalString(dto.targetOrganizationId),
        targetUserId:
          dto.targetUserId === null ? null : this.optionalString(dto.targetUserId),
        commissionType: dto.commissionType as CommissionType | undefined,
        value:
          dto.value === undefined ? undefined : new Prisma.Decimal(dto.value),
        currency: this.optionalString(dto.currency),
        isActive: dto.isActive,
        notes: dto.notes === null ? null : this.optionalString(dto.notes),
      },
      include: this.ruleInclude(),
    });

    await this.auditLogs.record({
      action: 'commission_rule.updated',
      entityType: 'CommissionRule',
      entityId: rule.id,
      actor: currentUser,
      organizationId: rule.developerId,
      metadata: {
        projectId: rule.projectId,
        previousActive: existing.isActive,
        isActive: rule.isActive,
      },
    });

    return rule;
  }

  private assertDeveloperManager(currentUser: AuthenticatedRequestUser) {
    if (isPlatformUser(currentUser)) {
      return;
    }

    if (
      currentUser.organizationType !== 'DEVELOPER' ||
      !currentUser.organizationId
    ) {
      throw new ForbiddenException(
        'Only developer users can manage commission rules.',
      );
    }

    if (!currentUser.permissions?.includes('commission_rules.manage')) {
      throw new ForbiddenException('Missing commission_rules.manage permission.');
    }
  }

  private assertCanManageDeveloper(
    developerId: string,
    currentUser: AuthenticatedRequestUser,
  ) {
    if (isPlatformUser(currentUser)) {
      return;
    }

    if (
      currentUser.organizationType !== 'DEVELOPER' ||
      currentUser.organizationId !== developerId
    ) {
      throw new ForbiddenException(
        'Cannot manage another developer organization commission rule.',
      );
    }
  }

  private assertDto(
    dto: CreateCommissionRuleDto | UpdateCommissionRuleDto,
    requireRequired: boolean,
  ) {
    if (requireRequired && !(dto as CreateCommissionRuleDto).projectId?.trim()) {
      throw new BadRequestException('projectId is required.');
    }

    if (requireRequired && !dto.partyType?.trim()) {
      throw new BadRequestException('partyType is required.');
    }

    if (
      dto.partyType &&
      !Object.values(CommissionPartyType).includes(
        dto.partyType as CommissionPartyType,
      )
    ) {
      throw new BadRequestException('partyType is invalid.');
    }

    if (requireRequired && !dto.commissionType?.trim()) {
      throw new BadRequestException('commissionType is required.');
    }

    if (
      dto.commissionType &&
      !Object.values(CommissionType).includes(dto.commissionType as CommissionType)
    ) {
      throw new BadRequestException('commissionType is invalid.');
    }

    if (
      dto.value !== undefined &&
      (!Number.isFinite(dto.value) || dto.value < 0)
    ) {
      throw new BadRequestException('value must be a non-negative number.');
    }

    if (requireRequired && dto.value === undefined) {
      throw new BadRequestException('value is required.');
    }
  }

  private ruleInclude() {
    return {
      project: true,
      targetOrganization: true,
      targetUser: true,
    };
  }

  private optionalString(value: string | undefined | null) {
    if (value === null) {
      return undefined;
    }

    const trimmed = value?.trim();
    return trimmed || undefined;
  }
}

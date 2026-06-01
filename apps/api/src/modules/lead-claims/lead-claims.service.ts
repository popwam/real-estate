import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  LeadClaimConflictResolution,
  LeadClaimStatus,
  LeadSource,
} from '@prisma/client';
import { createHmac } from 'node:crypto';
import { isPlatformUser } from '../../common/organization-scope';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../database/prisma.service';
import { MarketplaceAccessService } from '../marketplace/marketplace-access.service';
import { CreateLeadClaimDto } from './dto/create-lead-claim.dto';
import { ResolveLeadClaimConflictDto } from './dto/resolve-lead-claim-conflict.dto';

@Injectable()
export class LeadClaimsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly marketplaceAccess: MarketplaceAccessService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async create(dto: CreateLeadClaimDto, currentUser: AuthenticatedRequestUser) {
    this.assertCanClaimLead(currentUser);
    this.assertCreateDto(dto);

    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    if (
      !(await this.marketplaceAccess.canViewProjectForMarketplace(
        currentUser,
        project,
      ))
    ) {
      throw new ForbiddenException('Project is not visible to this broker.');
    }

    if (dto.unitId) {
      const unit = await this.prisma.inventoryUnit.findUnique({
        where: { id: dto.unitId },
        include: { project: true },
      });

      if (!unit || unit.projectId !== project.id) {
        throw new BadRequestException('unitId does not belong to the project.');
      }

      if (
        !(await this.marketplaceAccess.canViewUnitForMarketplace(
          currentUser,
          unit,
        ))
      ) {
        throw new ForbiddenException('Unit is not visible to this broker.');
      }
    }

    const normalizedPhone = this.normalizePhone(dto.phone);
    const phoneHash = this.hashPhone(normalizedPhone);
    const now = new Date();
    const existingClaim = await this.prisma.leadClaim.findFirst({
      where: {
        clientPhoneHash: phoneHash,
        projectId: project.id,
        status: LeadClaimStatus.ACTIVE,
        expiresAt: { gt: now },
      },
      include: this.claimInclude(),
    });

    if (existingClaim) {
      await this.auditLogs.record({
        action: 'lead_claim.duplicate_detected',
        entityType: 'LeadClaim',
        entityId: existingClaim.id,
        actor: currentUser,
        organizationId: project.developerId,
        metadata: {
          projectId: project.id,
          sameBroker: existingClaim.brokerUserId === currentUser.userId,
        },
      });

      if (existingClaim.brokerUserId === currentUser.userId) {
        if (dto.notes?.trim()) {
          await this.prisma.lead.update({
            where: { id: existingClaim.leadId },
            data: { notes: dto.notes.trim() },
          });
        }

        return this.findOne(existingClaim.id, currentUser);
      }

      const conflict = await this.prisma.leadClaimConflict.create({
        data: {
          existingClaimId: existingClaim.id,
          attemptedById: currentUser.userId,
          projectId: project.id,
          clientPhoneHash: phoneHash,
          notes: 'Duplicate active lead claim detected for this project.',
        },
      });

      await this.auditLogs.record({
        action: 'lead_claim.conflict_created',
        entityType: 'LeadClaimConflict',
        entityId: conflict.id,
        actor: currentUser,
        organizationId: project.developerId,
        metadata: { projectId: project.id },
      });

      throw new ConflictException(
        'An active claim already exists for this client and project.',
      );
    }

    const client = await this.prisma.client.upsert({
      where: {
        phoneHash_projectId: {
          phoneHash,
          projectId: project.id,
        },
      },
      create: {
        projectId: project.id,
        name: dto.clientName.trim(),
        phoneHash,
        phoneLast4: normalizedPhone.slice(-4),
        source: (dto.source as LeadSource | undefined) ?? LeadSource.MANUAL,
        createdById: currentUser.userId,
      },
      update: {
        name: dto.clientName.trim(),
        source: (dto.source as LeadSource | undefined) ?? LeadSource.MANUAL,
      },
    });

    const claim = await this.prisma.$transaction(async (tx) => {
      const lead = await tx.lead.create({
        data: {
          clientId: client.id,
          projectId: project.id,
          unitId: dto.unitId,
          brokerUserId: currentUser.userId,
          brokerageId: currentUser.organizationId,
          source: (dto.source as LeadSource | undefined) ?? LeadSource.MANUAL,
          notes: dto.notes?.trim(),
        },
      });

      return tx.leadClaim.create({
        data: {
          leadId: lead.id,
          clientId: client.id,
          projectId: project.id,
          unitId: dto.unitId,
          brokerUserId: currentUser.userId,
          brokerageId: currentUser.organizationId,
          clientPhoneHash: phoneHash,
          source: (dto.source as LeadSource | undefined) ?? LeadSource.MANUAL,
          notes: dto.notes?.trim(),
          expiresAt: this.defaultClaimExpiry(),
        },
        include: this.claimInclude(),
      });
    });

    await this.auditLogs.record({
      action: 'lead_claim.created',
      entityType: 'LeadClaim',
      entityId: claim.id,
      actor: currentUser,
      organizationId: project.developerId,
      metadata: { projectId: project.id, unitId: dto.unitId },
    });

    return claim;
  }

  async findMy(currentUser: AuthenticatedRequestUser) {
    if (isPlatformUser(currentUser)) {
      return this.prisma.leadClaim.findMany({
        include: this.claimInclude(),
        orderBy: { createdAt: 'desc' },
      });
    }

    this.assertBrokerParticipant(currentUser);

    return this.prisma.leadClaim.findMany({
      where:
        currentUser.organizationType === 'BROKERAGE' && currentUser.organizationId
          ? {
              OR: [
                { brokerUserId: currentUser.userId },
                { brokerageId: currentUser.organizationId },
              ],
            }
          : { brokerUserId: currentUser.userId },
      include: this.claimInclude(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, currentUser: AuthenticatedRequestUser) {
    const claim = await this.prisma.leadClaim.findUnique({
      where: { id },
      include: this.claimInclude(),
    });

    if (!claim) {
      throw new NotFoundException('Lead claim not found.');
    }

    this.assertCanReadClaim(claim, currentUser);

    return claim;
  }

  async release(id: string, currentUser: AuthenticatedRequestUser) {
    const existing = await this.findOne(id, currentUser);

    if (
      !isPlatformUser(currentUser) &&
      existing.brokerUserId !== currentUser.userId
    ) {
      throw new ForbiddenException('Only the claiming broker can release this claim.');
    }

    const claim = await this.prisma.leadClaim.update({
      where: { id },
      data: {
        status: LeadClaimStatus.RELEASED,
        releasedAt: new Date(),
      },
      include: this.claimInclude(),
    });

    await this.auditLogs.record({
      action: 'lead_claim.released',
      entityType: 'LeadClaim',
      entityId: claim.id,
      actor: currentUser,
      organizationId: claim.project.developerId,
      metadata: { projectId: claim.projectId },
    });

    return claim;
  }

  async findConflicts(currentUser: AuthenticatedRequestUser) {
    if (isPlatformUser(currentUser)) {
      return this.prisma.leadClaimConflict.findMany({
        include: this.conflictInclude(),
        orderBy: { createdAt: 'desc' },
      });
    }

    if (currentUser.organizationType === 'DEVELOPER' && currentUser.organizationId) {
      return this.prisma.leadClaimConflict.findMany({
        where: { project: { developerId: currentUser.organizationId } },
        include: this.conflictInclude(),
        orderBy: { createdAt: 'desc' },
      });
    }

    this.assertBrokerParticipant(currentUser);

    return this.prisma.leadClaimConflict.findMany({
      where: { attemptedById: currentUser.userId },
      include: this.conflictInclude(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolveConflict(
    id: string,
    dto: ResolveLeadClaimConflictDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    const conflict = await this.prisma.leadClaimConflict.findUnique({
      where: { id },
      include: this.conflictInclude(),
    });

    if (!conflict) {
      throw new NotFoundException('Lead claim conflict not found.');
    }

    if (
      !isPlatformUser(currentUser) &&
      (currentUser.organizationType !== 'DEVELOPER' ||
        currentUser.organizationId !== conflict.project.developerId)
    ) {
      throw new ForbiddenException('Cannot resolve this lead claim conflict.');
    }

    if (
      !Object.values(LeadClaimConflictResolution).includes(
        dto.resolution as LeadClaimConflictResolution,
      )
    ) {
      throw new BadRequestException('resolution is invalid.');
    }

    return this.prisma.leadClaimConflict.update({
      where: { id },
      data: {
        resolution: dto.resolution as LeadClaimConflictResolution,
        resolvedById: currentUser.userId,
        resolvedAt: new Date(),
        notes: dto.notes?.trim(),
      },
      include: this.conflictInclude(),
    });
  }

  assertCanReadClaim(claim: any, currentUser: AuthenticatedRequestUser) {
    if (isPlatformUser(currentUser)) {
      return;
    }

    if (claim.brokerUserId === currentUser.userId) {
      return;
    }

    if (
      currentUser.organizationType === 'BROKERAGE' &&
      currentUser.organizationId &&
      claim.brokerageId === currentUser.organizationId
    ) {
      return;
    }

    if (
      currentUser.organizationType === 'DEVELOPER' &&
      currentUser.organizationId === claim.project.developerId
    ) {
      return;
    }

    throw new ForbiddenException('Cannot access this lead claim.');
  }

  private assertCreateDto(dto: CreateLeadClaimDto) {
    if (!dto.clientName?.trim()) {
      throw new BadRequestException('clientName is required.');
    }

    if (!dto.phone?.trim()) {
      throw new BadRequestException('phone is required.');
    }

    if (!dto.projectId?.trim()) {
      throw new BadRequestException('projectId is required.');
    }

    if (dto.source && !Object.values(LeadSource).includes(dto.source as LeadSource)) {
      throw new BadRequestException('source is invalid.');
    }
  }

  private assertCanClaimLead(currentUser: AuthenticatedRequestUser) {
    this.assertBrokerParticipant(currentUser);

    if (!currentUser.permissions?.includes('lead_claims.create')) {
      throw new ForbiddenException('Missing lead_claims.create permission.');
    }
  }

  private assertBrokerParticipant(currentUser: AuthenticatedRequestUser) {
    if (
      !['BROKERAGE', 'INDIVIDUAL_BROKER'].includes(
        currentUser.organizationType ?? '',
      )
    ) {
      throw new ForbiddenException('Only broker users can access lead claims.');
    }
  }

  private normalizePhone(phone: string) {
    const digits = phone.replace(/\D/g, '');

    if (digits.length < 8) {
      throw new BadRequestException('phone is invalid.');
    }

    return digits;
  }

  private hashPhone(normalizedPhone: string) {
    const salt =
      process.env.LEAD_PHONE_HASH_SALT ??
      process.env.JWT_SECRET ??
      'lead-phone-development-salt';

    return createHmac('sha256', salt).update(normalizedPhone).digest('hex');
  }

  private defaultClaimExpiry() {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 60);
    return expiresAt;
  }

  private claimInclude() {
    return {
      client: true,
      lead: true,
      project: true,
      unit: true,
      broker: true,
    };
  }

  private conflictInclude() {
    return {
      existingClaim: {
        include: {
          project: true,
          unit: true,
        },
      },
      attemptedBy: true,
      project: true,
      resolvedBy: true,
    };
  }
}

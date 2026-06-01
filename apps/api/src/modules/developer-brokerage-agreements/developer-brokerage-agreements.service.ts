import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AgreementStatus, OrganizationType } from '@prisma/client';
import { isPlatformUser, requireCurrentOrganizationId } from '../../common/organization-scope';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../database/prisma.service';
import { CreateAgreementDto } from './dto/create-agreement.dto';

@Injectable()
export class DeveloperBrokerageAgreementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async create(
    dto: CreateAgreementDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    const developerId = this.requireDeveloperAgreementManager(currentUser);
    await this.assertBrokerage(dto.brokerageId);

    const agreement = await this.prisma.developerBrokerageAgreement.upsert({
      where: {
        developerId_brokerageId: {
          developerId,
          brokerageId: dto.brokerageId,
        },
      },
      create: {
        developerId,
        brokerageId: dto.brokerageId,
        status: AgreementStatus.PENDING,
        commissionOverride: dto.commissionOverride as any,
        expiresAt: this.optionalDate(dto.expiresAt),
        termsUrl: this.optionalString(dto.termsUrl),
      },
      update: {
        status: AgreementStatus.PENDING,
        commissionOverride: dto.commissionOverride as any,
        expiresAt: dto.expiresAt === null ? null : this.optionalDate(dto.expiresAt),
        termsUrl: this.optionalString(dto.termsUrl),
      },
      include: this.agreementInclude(),
    });

    await this.auditLogs.record({
      action: 'agreement.created',
      entityType: 'DeveloperBrokerageAgreement',
      entityId: agreement.id,
      organizationId: agreement.developerId,
      actor: currentUser,
      metadata: { brokerageId: agreement.brokerageId, status: agreement.status },
    });

    return agreement;
  }

  async findMany(currentUser: AuthenticatedRequestUser) {
    if (isPlatformUser(currentUser)) {
      return this.prisma.developerBrokerageAgreement.findMany({
        include: this.agreementInclude(),
        orderBy: { createdAt: 'desc' },
      });
    }

    const organizationId = requireCurrentOrganizationId(currentUser);

    return this.prisma.developerBrokerageAgreement.findMany({
      where: {
        OR: [{ developerId: organizationId }, { brokerageId: organizationId }],
      },
      include: this.agreementInclude(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, currentUser: AuthenticatedRequestUser) {
    const agreement = await this.prisma.developerBrokerageAgreement.findUnique({
      where: { id },
      include: this.agreementInclude(),
    });

    if (!agreement) {
      throw new NotFoundException('Agreement not found.');
    }

    this.assertCanRead(agreement, currentUser);

    return agreement;
  }

  async approve(id: string, currentUser: AuthenticatedRequestUser) {
    return this.updateStatus(
      id,
      AgreementStatus.ACTIVE,
      'agreement.approved',
      currentUser,
      { signedAt: new Date() },
    );
  }

  async suspend(id: string, currentUser: AuthenticatedRequestUser) {
    return this.updateStatus(
      id,
      AgreementStatus.SUSPENDED,
      'agreement.suspended',
      currentUser,
    );
  }

  async terminate(id: string, currentUser: AuthenticatedRequestUser) {
    return this.updateStatus(
      id,
      AgreementStatus.TERMINATED,
      'agreement.terminated',
      currentUser,
    );
  }

  private async updateStatus(
    id: string,
    status: AgreementStatus,
    auditAction: string,
    currentUser: AuthenticatedRequestUser,
    extraData: Record<string, unknown> = {},
  ) {
    const existing = await this.findOne(id, currentUser);
    this.assertCanManageAgreement(existing.developerId, currentUser);

    const agreement = await this.prisma.developerBrokerageAgreement.update({
      where: { id },
      data: { status, ...extraData },
      include: this.agreementInclude(),
    });

    await this.auditLogs.record({
      action: auditAction,
      entityType: 'DeveloperBrokerageAgreement',
      entityId: agreement.id,
      organizationId: agreement.developerId,
      actor: currentUser,
      metadata: {
        previousStatus: existing.status,
        status: agreement.status,
        brokerageId: agreement.brokerageId,
      },
    });

    return agreement;
  }

  private requireDeveloperAgreementManager(
    currentUser: AuthenticatedRequestUser,
  ) {
    if (isPlatformUser(currentUser)) {
      throw new ForbiddenException('Platform users cannot create developer-brokerage agreements in Slice 2.');
    }

    const organizationId = requireCurrentOrganizationId(currentUser);

    if (currentUser.organizationType !== 'DEVELOPER') {
      throw new ForbiddenException('Only developer organizations can create agreements.');
    }

    this.assertPermission(currentUser, 'brokerage_agreements.manage');

    return organizationId;
  }

  private assertCanManageAgreement(
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
      throw new ForbiddenException('Cannot manage another developer agreement.');
    }

    this.assertPermission(currentUser, 'brokerage_agreements.manage');
  }

  private assertCanRead(agreement: any, currentUser: AuthenticatedRequestUser) {
    if (isPlatformUser(currentUser)) {
      return;
    }

    if (
      currentUser.organizationId === agreement.developerId ||
      currentUser.organizationId === agreement.brokerageId
    ) {
      return;
    }

    throw new ForbiddenException('Cannot access this agreement.');
  }

  private assertPermission(
    currentUser: AuthenticatedRequestUser,
    permission: string,
  ) {
    if (!currentUser.permissions?.includes(permission)) {
      throw new ForbiddenException('Required permission is missing.');
    }
  }

  private async assertBrokerage(brokerageId: string | undefined) {
    if (!brokerageId?.trim()) {
      throw new BadRequestException('brokerageId is required.');
    }

    const brokerage = await this.prisma.organization.findFirst({
      where: { id: brokerageId, type: OrganizationType.BROKERAGE },
    });

    if (!brokerage) {
      throw new BadRequestException('Brokerage organization was not found.');
    }
  }

  private agreementInclude() {
    return {
      developer: true,
      brokerage: true,
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

  private optionalString(value: string | undefined) {
    const trimmed = value?.trim();
    return trimmed || undefined;
  }
}

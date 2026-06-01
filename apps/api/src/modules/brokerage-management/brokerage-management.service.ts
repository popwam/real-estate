import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { isPlatformUser, requireCurrentOrganizationId } from '../../common/organization-scope';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../database/prisma.service';
import { UpdateBrokerageProfileDto } from './dto/update-brokerage-profile.dto';

@Injectable()
export class BrokerageManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async findMine(currentUser: AuthenticatedRequestUser) {
    const organizationId = this.requireBrokerageOrganization(currentUser);

    return this.prisma.brokerageProfile.upsert({
      where: { organizationId },
      create: { organizationId },
      update: {},
      include: { organization: true },
    });
  }

  async updateMine(
    dto: UpdateBrokerageProfileDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    const organizationId = this.requireBrokerageOrganization(currentUser);
    this.assertNonNegative(dto.maxBrokersAllowed, 'maxBrokersAllowed');
    this.assertNonNegative(dto.activeBrokersCount, 'activeBrokersCount');

    const profile = await this.prisma.brokerageProfile.upsert({
      where: { organizationId },
      create: {
        organizationId,
        brokerLicenseNumber: this.optionalString(dto.brokerLicenseNumber),
        reraBrokerageNumber: this.optionalString(dto.reraBrokerageNumber),
        maxBrokersAllowed: dto.maxBrokersAllowed,
        activeBrokersCount: dto.activeBrokersCount,
      },
      update: {
        brokerLicenseNumber: this.optionalString(dto.brokerLicenseNumber),
        reraBrokerageNumber: this.optionalString(dto.reraBrokerageNumber),
        maxBrokersAllowed: dto.maxBrokersAllowed,
        activeBrokersCount: dto.activeBrokersCount,
      },
      include: { organization: true },
    });

    await this.auditLogs.record({
      action: 'brokerage_profile.updated',
      entityType: 'BrokerageProfile',
      entityId: profile.id,
      organizationId,
      actor: currentUser,
    });

    return profile;
  }

  private requireBrokerageOrganization(currentUser: AuthenticatedRequestUser) {
    if (isPlatformUser(currentUser)) {
      throw new ForbiddenException('Use an organization-scoped brokerage account.');
    }

    const organizationId = requireCurrentOrganizationId(currentUser);

    if (currentUser.organizationType !== 'BROKERAGE') {
      throw new ForbiddenException('Only brokerage organizations can manage brokerage profiles.');
    }

    return organizationId;
  }

  private assertNonNegative(value: number | undefined, field: string) {
    if (value !== undefined && (!Number.isInteger(value) || value < 0)) {
      throw new BadRequestException(`${field} must be a non-negative integer.`);
    }
  }

  private optionalString(value: string | undefined) {
    const trimmed = value?.trim();
    return trimmed || undefined;
  }
}

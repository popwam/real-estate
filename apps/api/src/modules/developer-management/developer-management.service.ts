import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { isPlatformUser, requireCurrentOrganizationId } from '../../common/organization-scope';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../database/prisma.service';
import { UpdateDeveloperProfileDto } from './dto/update-developer-profile.dto';

@Injectable()
export class DeveloperManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async findMine(currentUser: AuthenticatedRequestUser) {
    const organizationId = this.requireDeveloperOrganization(currentUser);

    return this.prisma.developerProfile.upsert({
      where: { organizationId },
      create: { organizationId },
      update: {},
      include: { organization: true },
    });
  }

  async updateMine(
    dto: UpdateDeveloperProfileDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    const organizationId = this.requireDeveloperOrganization(currentUser);
    this.assertNonNegative(dto.yearsInMarket, 'yearsInMarket');
    this.assertNonNegative(dto.totalUnitsDelivered, 'totalUnitsDelivered');
    this.assertNonNegative(dto.activeProjectsCount, 'activeProjectsCount');

    const profile = await this.prisma.developerProfile.upsert({
      where: { organizationId },
      create: {
        organizationId,
        yearsInMarket: dto.yearsInMarket,
        totalUnitsDelivered: dto.totalUnitsDelivered,
        portfolioUrl: this.optionalString(dto.portfolioUrl),
        reraRegistration: this.optionalString(dto.reraRegistration),
        nucaRegistration: this.optionalString(dto.nucaRegistration),
        activeProjectsCount: dto.activeProjectsCount,
        settings: dto.settings as any,
      },
      update: {
        yearsInMarket: dto.yearsInMarket,
        totalUnitsDelivered: dto.totalUnitsDelivered,
        portfolioUrl: this.optionalString(dto.portfolioUrl),
        reraRegistration: this.optionalString(dto.reraRegistration),
        nucaRegistration: this.optionalString(dto.nucaRegistration),
        activeProjectsCount: dto.activeProjectsCount,
        settings: dto.settings as any,
      },
      include: { organization: true },
    });

    await this.auditLogs.record({
      action: 'developer_profile.updated',
      entityType: 'DeveloperProfile',
      entityId: profile.id,
      organizationId,
      actor: currentUser,
    });

    return profile;
  }

  private requireDeveloperOrganization(currentUser: AuthenticatedRequestUser) {
    if (isPlatformUser(currentUser)) {
      throw new ForbiddenException('Use an organization-scoped developer account.');
    }

    const organizationId = requireCurrentOrganizationId(currentUser);

    if (currentUser.organizationType !== 'DEVELOPER') {
      throw new ForbiddenException('Only developer organizations can manage developer profiles.');
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

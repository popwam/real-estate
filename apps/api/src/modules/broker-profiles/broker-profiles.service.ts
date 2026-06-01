import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { isPlatformUser } from '../../common/organization-scope';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../database/prisma.service';
import { UpdateBrokerProfileDto } from './dto/update-broker-profile.dto';

@Injectable()
export class BrokerProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async findMine(currentUser: AuthenticatedRequestUser) {
    this.requireBrokerUser(currentUser);

    return this.prisma.brokerProfile.upsert({
      where: { userId: currentUser.userId },
      create: {
        userId: currentUser.userId,
        organizationId: currentUser.organizationId,
        isIndividual: currentUser.organizationType === 'INDIVIDUAL_BROKER',
      },
      update: {},
      include: { user: true, organization: true },
    });
  }

  async updateMine(
    dto: UpdateBrokerProfileDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    this.requireBrokerUser(currentUser);
    this.assertNonNegative(dto.yearsExperience, 'yearsExperience');

    if (
      dto.specializations !== undefined &&
      !Array.isArray(dto.specializations)
    ) {
      throw new BadRequestException('specializations must be an array.');
    }

    const profile = await this.prisma.brokerProfile.upsert({
      where: { userId: currentUser.userId },
      create: {
        userId: currentUser.userId,
        organizationId: currentUser.organizationId,
        isIndividual:
          dto.isIndividual ?? currentUser.organizationType === 'INDIVIDUAL_BROKER',
        nationalId: this.optionalString(dto.nationalId),
        nationalIdUrl: this.optionalString(dto.nationalIdUrl),
        yearsExperience: dto.yearsExperience,
        specializations: this.cleanStringArray(dto.specializations),
        restrictionLevel: this.optionalString(dto.restrictionLevel),
      },
      update: {
        isIndividual: dto.isIndividual,
        nationalId: this.optionalString(dto.nationalId),
        nationalIdUrl: this.optionalString(dto.nationalIdUrl),
        yearsExperience: dto.yearsExperience,
        specializations: dto.specializations
          ? this.cleanStringArray(dto.specializations)
          : undefined,
        restrictionLevel: this.optionalString(dto.restrictionLevel),
      },
      include: { user: true, organization: true },
    });

    await this.auditLogs.record({
      action: 'broker_profile.updated',
      entityType: 'BrokerProfile',
      entityId: profile.id,
      organizationId: profile.organizationId,
      actor: currentUser,
    });

    return profile;
  }

  private requireBrokerUser(currentUser: AuthenticatedRequestUser) {
    if (isPlatformUser(currentUser)) {
      throw new ForbiddenException('Use a broker-scoped account.');
    }

    if (!['BROKERAGE', 'INDIVIDUAL_BROKER'].includes(currentUser.organizationType ?? '')) {
      throw new ForbiddenException('Only broker users can manage broker profiles.');
    }
  }

  private assertNonNegative(value: number | undefined, field: string) {
    if (value !== undefined && (!Number.isInteger(value) || value < 0)) {
      throw new BadRequestException(`${field} must be a non-negative integer.`);
    }
  }

  private cleanStringArray(value: string[] | undefined) {
    return value?.map((item) => item.trim()).filter(Boolean) ?? [];
  }

  private optionalString(value: string | undefined) {
    const trimmed = value?.trim();
    return trimmed || undefined;
  }
}

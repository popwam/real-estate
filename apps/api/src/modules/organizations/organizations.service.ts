import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  assertSameOrganizationOrPlatform,
  isPlatformUser,
  requireCurrentOrganizationId,
} from '../../common/organization-scope';
import { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../database/prisma.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { UpdateOrganizationStatusDto } from './dto/update-organization-status.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async findAll(currentUser: AuthenticatedRequestUser) {
    if (!isPlatformUser(currentUser)) {
      throw new ForbiddenException('Only platform users can list all organizations.');
    }

    return this.prisma.organization.findMany({
      include: { profile: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findCurrent(currentUser: AuthenticatedRequestUser) {
    const organizationId = requireCurrentOrganizationId(currentUser);

    return this.findOne(organizationId, currentUser);
  }

  async findOne(id: string, currentUser: AuthenticatedRequestUser) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found.');
    }

    assertSameOrganizationOrPlatform(currentUser, organization.id);

    return organization;
  }

  async update(
    id: string,
    dto: UpdateOrganizationDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    const existing = await this.findOne(id, currentUser);

    if (!isPlatformUser(currentUser) && currentUser.organizationId !== id) {
      throw new ForbiddenException('Cannot update another organization.');
    }

    const updated = await this.prisma.organization.update({
      where: { id },
      data: {
        name: this.optionalString(dto.name) ?? existing.name,
        country: this.optionalString(dto.country),
        city: this.optionalString(dto.city),
        plan: this.optionalString(dto.plan),
        profile: {
          upsert: {
            create: {
              legalName: this.optionalString(dto.legalName),
              tradeName: this.optionalString(dto.tradeName),
              website: this.optionalString(dto.website),
              phone: this.optionalString(dto.phone),
              email: this.optionalString(dto.email),
              address: this.optionalString(dto.address),
              logoUrl: this.optionalString(dto.logoUrl),
              description: this.optionalString(dto.description),
            },
            update: {
              legalName: this.optionalString(dto.legalName),
              tradeName: this.optionalString(dto.tradeName),
              website: this.optionalString(dto.website),
              phone: this.optionalString(dto.phone),
              email: this.optionalString(dto.email),
              address: this.optionalString(dto.address),
              logoUrl: this.optionalString(dto.logoUrl),
              description: this.optionalString(dto.description),
            },
          },
        },
      },
      include: { profile: true },
    });

    await this.auditLogs.record({
      action: 'organization.updated',
      entityType: 'Organization',
      entityId: id,
      organizationId: id,
      actor: currentUser,
    });

    return updated;
  }

  async updateStatus(
    id: string,
    dto: UpdateOrganizationStatusDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    const allowedStatuses = [
      'DRAFT',
      'PENDING_REVIEW',
      'APPROVED',
      'SUSPENDED',
      'REVOKED',
    ];

    if (!allowedStatuses.includes(dto.status)) {
      throw new BadRequestException('Invalid organization status.');
    }

    if (!isPlatformUser(currentUser)) {
      throw new ForbiddenException('Only platform users can change status.');
    }

    const updated = await this.prisma.organization.update({
      where: { id },
      data: { status: dto.status },
      include: { profile: true },
    });

    await this.auditLogs.record({
      action: 'organization.status_changed',
      entityType: 'Organization',
      entityId: id,
      organizationId: id,
      actor: currentUser,
      metadata: { status: dto.status },
    });

    return updated;
  }

  private optionalString(value: string | undefined) {
    const trimmed = value?.trim();
    return trimmed || undefined;
  }
}

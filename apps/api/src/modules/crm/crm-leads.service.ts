import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CrmActivityType, CrmLeadStatus, OrganizationType, PreferredContactMethod, Prisma } from '@prisma/client';
import { isPlatformUser, requireCurrentOrganizationId } from '../../common/organization-scope';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../database/prisma.service';
import { CrmActivitiesService } from './crm-activities.service';
import { ListCrmLeadsQueryDto } from './dto/list-crm-leads-query.dto';
import { UpdateCrmLeadStatusDto } from './dto/update-crm-lead-status.dto';

@Injectable()
export class CrmLeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activities: CrmActivitiesService,
  ) {}

  async listMarketplace(currentUser: AuthenticatedRequestUser, query: ListCrmLeadsQueryDto = {}) {
    this.assertAnyPermission(currentUser, ['crm.leads.claim', 'crm.leads.view_own']);
    const wantsPaginated = this.hasQuery(query);
    const { page, pageSize, skip, take } = this.pagination(query);
    const where = this.andWhere(
      {
        status: { in: [CrmLeadStatus.NEW, CrmLeadStatus.IN_CONVERSATION, CrmLeadStatus.CLAIMED] },
        project: {
          status: 'ACTIVE',
          visibility: 'OPEN_MARKETPLACE',
          developer: { status: 'APPROVED' },
        },
      },
      this.queryWhere(query, currentUser, { marketplace: true }),
    );

    const [leads, total] = await this.prisma.$transaction([
      this.prisma.crmLead.findMany({
        where,
        include: this.includeRelations(),
        orderBy: { createdAt: 'desc' },
        ...(wantsPaginated ? { skip, take } : {}),
      }),
      this.prisma.crmLead.count({ where }),
    ]);

    const items = leads.map((lead) => {
      const claimedByOther =
        lead.claimedByBrokerUserId &&
        lead.claimedByBrokerUserId !== currentUser.userId;
      return this.toResponse(lead, { masked: Boolean(claimedByOther) });
    });

    return wantsPaginated ? this.paginated(items, page, pageSize, total) : items;
  }

  async findMany(currentUser: AuthenticatedRequestUser, query: ListCrmLeadsQueryDto = {}) {
    const wantsPaginated = this.hasQuery(query);
    const { page, pageSize, skip, take } = this.pagination(query);
    const where = this.andWhere(this.leadScope(currentUser), this.queryWhere(query, currentUser));

    const [leads, total] = await this.prisma.$transaction([
      this.prisma.crmLead.findMany({
        where,
        include: this.includeRelations(),
        orderBy: { createdAt: 'desc' },
        ...(wantsPaginated ? { skip, take } : {}),
      }),
      this.prisma.crmLead.count({ where }),
    ]);

    const items = leads.map((lead) => this.toResponse(lead));
    return wantsPaginated ? this.paginated(items, page, pageSize, total) : items;
  }

  async findOne(id: string, currentUser: AuthenticatedRequestUser) {
    const lead = await this.findAccessibleLead(id, currentUser);
    return this.toResponse(lead);
  }

  async claim(id: string, currentUser: AuthenticatedRequestUser) {
    this.assertAnyPermission(currentUser, ['crm.leads.claim']);
    const organizationId = requireCurrentOrganizationId(currentUser);

    const result = await this.prisma.$transaction(async (tx) => {
      const target = await tx.crmLead.findUnique({
        where: { id },
        select: { id: true, status: true, claimedByBrokerUserId: true },
      });
      if (!target) {
        throw new NotFoundException('CRM lead not found.');
      }
      if (target.claimedByBrokerUserId) {
        throw new ConflictException('CRM lead has already been claimed.');
      }

      const updated = await tx.crmLead.updateMany({
        where: {
          id,
          claimedByBrokerUserId: null,
          status: { in: [CrmLeadStatus.NEW, CrmLeadStatus.IN_CONVERSATION] },
        },
        data: {
          status: CrmLeadStatus.CLAIMED,
          claimedByBrokerUserId: currentUser.userId,
          claimedByOrganizationId: organizationId,
          claimedAt: new Date(),
        },
      });

      if (updated.count !== 1) {
        throw new ConflictException('CRM lead is no longer claimable.');
      }

      const claimed = await tx.crmLead.findUniqueOrThrow({
        where: { id },
        include: this.includeRelations(),
      });

      await this.activities.create(
        {
          organizationId: claimed.organizationId,
          crmLeadId: claimed.id,
          actorUserId: currentUser.userId,
          actorOrganizationId: organizationId,
          actorRole: currentUser.role,
          type: CrmActivityType.LEAD_CLAIMED,
          title: 'CRM lead claimed',
          body: 'A broker claimed this CRM lead.',
          metadata: {
            previousStatus: target.status,
            status: claimed.status,
          },
        },
        tx,
      );

      return claimed;
    });

    return this.toResponse(result);
  }

  async updateStatus(
    id: string,
    dto: UpdateCrmLeadStatusDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    const status = this.parseStatus(dto.status);
    const lead = await this.findAccessibleLead(id, currentUser);
    this.assertCanManageLead(lead, currentUser);

    const updated = await this.prisma.$transaction(async (tx) => {
      const changed = await tx.crmLead.update({
        where: { id: lead.id },
        data: {
          status,
          statusNote: this.cleanStatusNote(dto.statusNote),
        },
        include: this.includeRelations(),
      });

      await this.activities.create(
        {
          organizationId: changed.organizationId,
          crmLeadId: changed.id,
          actorUserId: currentUser.userId,
          actorOrganizationId: currentUser.organizationId,
          actorRole: currentUser.role,
          type: CrmActivityType.LEAD_STATUS_CHANGED,
          title: 'CRM lead status changed',
          body: dto.statusNote,
          metadata: {
            previousStatus: lead.status,
            status: changed.status,
          },
        },
        tx,
      );

      return changed;
    });

    return this.toResponse(updated);
  }

  async findAccessibleLead(id: string, currentUser: AuthenticatedRequestUser) {
    const lead = await this.prisma.crmLead.findFirst({
      where: { id, ...this.leadScope(currentUser) },
      include: this.includeRelations(),
    });

    if (!lead) {
      const exists = await this.prisma.crmLead.findUnique({ where: { id } });
      if (exists) {
        throw new ForbiddenException('CRM lead is outside your scope.');
      }
      throw new NotFoundException('CRM lead not found.');
    }

    return lead;
  }

  leadScope(currentUser: AuthenticatedRequestUser) {
    if (isPlatformUser(currentUser)) {
      return {};
    }

    const organizationId = requireCurrentOrganizationId(currentUser);
    if (currentUser.organizationType === OrganizationType.DEVELOPER) {
      return {
        OR: [
          { organizationId },
          { project: { developerId: organizationId } },
        ],
      };
    }

    if (
      currentUser.organizationType === OrganizationType.BROKERAGE ||
      currentUser.organizationType === OrganizationType.INDIVIDUAL_BROKER
    ) {
      return {
        OR: [
          { claimedByBrokerUserId: currentUser.userId },
          { claimedByOrganizationId: organizationId },
        ],
      };
    }

    return { claimedByBrokerUserId: currentUser.userId };
  }

  includeRelations() {
    return {
      client: true,
      organization: { select: { id: true, name: true, slug: true, type: true } },
      project: {
        select: {
          id: true,
          name: true,
          slug: true,
          developerId: true,
          status: true,
          visibility: true,
        },
      },
      publicLead: { select: { id: true, status: true } },
      claimedByBroker: { select: { id: true, firstName: true, lastName: true } },
      claimedByOrganization: { select: { id: true, name: true, slug: true, type: true } },
      pipelineStage: true,
    };
  }

  toResponse(lead: any, options: { masked?: boolean } = {}) {
    const client = options.masked
      ? {
          id: lead.clientId,
          name: 'Claimed lead',
          phoneLast4: null,
          email: null,
          masked: true,
        }
      : {
          id: lead.client.id,
          name: lead.client.name,
          phone: lead.client.phone,
          phoneLast4: lead.client.phoneLast4,
          email: lead.client.email,
          normalizedEmail: lead.client.normalizedEmail,
          source: lead.client.source,
        };

    return {
      id: lead.id,
      organizationId: lead.organizationId,
      projectId: lead.projectId,
      unitId: lead.unitId,
      publicLeadId: lead.publicLeadId,
      clientId: lead.clientId,
      status: lead.status,
      statusNote: lead.statusNote,
      preferredContactMethod: lead.preferredContactMethod,
      pipelineStageId: lead.pipelineStageId,
      claimedByBrokerUserId: options.masked ? null : lead.claimedByBrokerUserId,
      claimedByOrganizationId: options.masked ? null : lead.claimedByOrganizationId,
      claimedAt: options.masked ? null : lead.claimedAt,
      sourcePage: options.masked ? null : lead.sourcePage,
      utm: options.masked ? null : lead.utm,
      unavailable: options.masked,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      organization: lead.organization,
      project: lead.project,
      pipelineStage: lead.pipelineStage,
      client,
    };
  }

  private assertAnyPermission(currentUser: AuthenticatedRequestUser, permissions: string[]) {
    if (isPlatformUser(currentUser)) {
      return;
    }

    const hasPermission = permissions.some((permission) =>
      currentUser.permissions?.includes(permission),
    );
    if (!hasPermission) {
      throw new ForbiddenException(`Missing CRM permission: ${permissions.join(' or ')}.`);
    }
  }

  assertCanManageLead(lead: any, currentUser: AuthenticatedRequestUser) {
    if (isPlatformUser(currentUser)) {
      return;
    }

    if (currentUser.userId === lead.claimedByBrokerUserId) {
      return;
    }

    const organizationId = requireCurrentOrganizationId(currentUser);
    const sameClaimedOrganization = organizationId === lead.claimedByOrganizationId;
    const hasManagePermission = currentUser.permissions?.includes('crm.leads.manage_own');
    if (hasManagePermission && (sameClaimedOrganization || currentUser.organizationType === OrganizationType.DEVELOPER)) {
      return;
    }

    throw new ForbiddenException('Missing CRM lead management permission.');
  }

  private queryWhere(
    query: ListCrmLeadsQueryDto,
    currentUser: AuthenticatedRequestUser,
    options: { marketplace?: boolean } = {},
  ): Prisma.CrmLeadWhereInput {
    const clauses: Prisma.CrmLeadWhereInput[] = [];

    if (query.status) {
      clauses.push({ status: this.parseStatus(query.status) });
    }
    if (query.preferredContactMethod) {
      clauses.push({ preferredContactMethod: this.parsePreferredContactMethod(query.preferredContactMethod) });
    }
    if (query.projectId?.trim()) {
      clauses.push({ projectId: query.projectId.trim() });
    }
    if (query.sourcePage?.trim()) {
      clauses.push({ sourcePage: { contains: query.sourcePage.trim(), mode: 'insensitive' } });
    }
    if (this.parseBoolean(query.claimedOnly)) {
      clauses.push({ OR: [{ claimedByBrokerUserId: { not: null } }, { claimedByOrganizationId: { not: null } }] });
    }
    if (this.parseBoolean(query.unclaimedOnly)) {
      clauses.push({ claimedByBrokerUserId: null, claimedByOrganizationId: null });
    }
    if (query.dateFrom || query.dateTo) {
      clauses.push({ createdAt: this.dateRange(query.dateFrom, query.dateTo) });
    }
    const search = query.search?.trim();
    if (search) {
      const searchWhere: Prisma.CrmLeadWhereInput = {
        OR: [
          { client: { name: { contains: search, mode: 'insensitive' } } },
          { client: { phoneLast4: { contains: search } } },
          { client: { normalizedEmail: { contains: search.toLowerCase(), mode: 'insensitive' } } },
        ],
      };

      if (options.marketplace) {
        const organizationId = currentUser.organizationId;
        clauses.push({
          OR: [
            { AND: [{ claimedByBrokerUserId: null }, searchWhere] },
            { AND: [{ claimedByBrokerUserId: currentUser.userId }, searchWhere] },
            ...(organizationId
              ? [{ AND: [{ claimedByOrganizationId: organizationId }, searchWhere] }]
              : []),
          ],
        });
      } else {
        clauses.push(searchWhere);
      }
    }

    return clauses.length ? { AND: clauses } : {};
  }

  private andWhere(...clauses: Prisma.CrmLeadWhereInput[]) {
    const nonEmpty = clauses.filter((clause) => Object.keys(clause).length > 0);
    if (!nonEmpty.length) {
      return {};
    }
    if (nonEmpty.length === 1) {
      return nonEmpty[0];
    }
    return { AND: nonEmpty };
  }

  private hasQuery(query: object) {
    return Object.values(query).some((value) => value !== undefined && value !== '');
  }

  private pagination(query: ListCrmLeadsQueryDto) {
    const page = Math.max(1, Number.parseInt(query.page ?? '1', 10) || 1);
    const rawPageSize = Number.parseInt(query.pageSize ?? '20', 10) || 20;
    const pageSize = Math.min(100, Math.max(1, rawPageSize));
    return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
  }

  private paginated(items: unknown[], page: number, pageSize: number, total: number) {
    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  private parseStatus(status: string | undefined) {
    if (!status || !Object.values(CrmLeadStatus).includes(status as CrmLeadStatus)) {
      throw new BadRequestException('Unsupported CRM lead status.');
    }
    return status as CrmLeadStatus;
  }

  private parsePreferredContactMethod(method: string) {
    if (!Object.values(PreferredContactMethod).includes(method as PreferredContactMethod)) {
      throw new BadRequestException('Unsupported preferred contact method.');
    }
    return method as PreferredContactMethod;
  }

  private parseBoolean(value: string | undefined) {
    return value === 'true' || value === '1';
  }

  private dateRange(dateFrom?: string, dateTo?: string) {
    const range: Prisma.DateTimeFilter = {};
    if (dateFrom) {
      const parsed = new Date(dateFrom);
      if (Number.isNaN(parsed.getTime())) throw new BadRequestException('dateFrom is invalid.');
      range.gte = parsed;
    }
    if (dateTo) {
      const parsed = new Date(dateTo);
      if (Number.isNaN(parsed.getTime())) throw new BadRequestException('dateTo is invalid.');
      range.lte = parsed;
    }
    return range;
  }

  private cleanStatusNote(value: string | undefined) {
    const trimmed = value?.trim();
    return trimmed ? trimmed.slice(0, 1000) : null;
  }
}

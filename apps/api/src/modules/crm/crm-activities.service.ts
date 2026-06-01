import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CrmActivityType, OrganizationType, Prisma } from '@prisma/client';
import { isPlatformUser, requireCurrentOrganizationId } from '../../common/organization-scope';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../database/prisma.service';
import { ListCrmActivitiesQueryDto } from './dto/list-crm-activities-query.dto';

type ActivityClient = PrismaService | Prisma.TransactionClient;

type CreateActivityInput = {
  organizationId: string;
  crmLeadId?: string | null;
  conversationId?: string | null;
  actorUserId?: string | null;
  actorOrganizationId?: string | null;
  actorRole?: string | null;
  publicActorName?: string | null;
  type: CrmActivityType;
  title: string;
  body?: string | null;
  metadata?: Record<string, unknown> | null;
};

@Injectable()
export class CrmActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateActivityInput, client: ActivityClient = this.prisma) {
    const create = () =>
      client.crmActivity.create({
        data: {
          organizationId: input.organizationId,
          crmLeadId: input.crmLeadId ?? undefined,
          conversationId: input.conversationId ?? undefined,
          actorUserId: input.actorUserId ?? undefined,
          actorOrganizationId: input.actorOrganizationId ?? undefined,
          actorRole: this.cleanText(input.actorRole, 120),
          publicActorName: this.cleanText(input.publicActorName, 120),
          type: input.type,
          title: this.cleanRequiredText(input.title, 240),
          body: this.cleanText(input.body, 1000),
          metadata: this.cleanMetadata(input.metadata),
        },
      });

    if (client !== this.prisma) {
      return create();
    }

    try {
      return await create();
    } catch {
      return null;
    }
  }

  async findMany(currentUser: AuthenticatedRequestUser, query: ListCrmActivitiesQueryDto = {}) {
    const { page, pageSize, skip, take } = this.pagination(query);
    const where = this.andWhere(this.scope(currentUser), this.queryWhere(query));

    const [activities, total] = await this.prisma.$transaction([
      this.prisma.crmActivity.findMany({
        where,
        include: this.includeRelations(),
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.crmActivity.count({ where }),
    ]);

    return this.paginated(
      activities.map((activity) => this.toResponse(activity)),
      page,
      pageSize,
      total,
    );
  }

  async findForLead(
    crmLeadId: string,
    currentUser: AuthenticatedRequestUser,
    query: ListCrmActivitiesQueryDto = {},
  ) {
    await this.assertLeadAccessible(crmLeadId, currentUser);
    return this.findMany(currentUser, { ...query, crmLeadId });
  }

  async findForConversation(
    conversationId: string,
    currentUser: AuthenticatedRequestUser,
    query: ListCrmActivitiesQueryDto = {},
  ) {
    await this.assertConversationAccessible(conversationId, currentUser);
    return this.findMany(currentUser, { ...query, conversationId });
  }

  scope(currentUser: AuthenticatedRequestUser): Prisma.CrmActivityWhereInput {
    if (isPlatformUser(currentUser)) {
      return {};
    }

    const organizationId = requireCurrentOrganizationId(currentUser);
    if (currentUser.organizationType === OrganizationType.DEVELOPER) {
      return {
        OR: [
          { organizationId },
          { crmLead: { organizationId } },
          { crmLead: { project: { developerId: organizationId } } },
          { conversation: { organizationId } },
          { conversation: { project: { developerId: organizationId } } },
        ],
      };
    }

    return {
      OR: [
        { actorUserId: currentUser.userId },
        { actorOrganizationId: organizationId },
        { crmLead: { claimedByBrokerUserId: currentUser.userId } },
        { crmLead: { claimedByOrganizationId: organizationId } },
        { conversation: { participants: { some: { userId: currentUser.userId } } } },
        { conversation: { participants: { some: { organizationId } } } },
        { conversation: { crmLead: { claimedByBrokerUserId: currentUser.userId } } },
        { conversation: { crmLead: { claimedByOrganizationId: organizationId } } },
      ],
    };
  }

  private async assertLeadAccessible(crmLeadId: string, currentUser: AuthenticatedRequestUser) {
    const lead = await this.prisma.crmLead.findFirst({
      where: this.andLeadWhere({ id: crmLeadId }, this.leadScope(currentUser)),
      select: { id: true },
    });
    if (lead) {
      return;
    }
    const exists = await this.prisma.crmLead.findUnique({ where: { id: crmLeadId }, select: { id: true } });
    if (exists) {
      throw new ForbiddenException('CRM lead is outside your scope.');
    }
    throw new NotFoundException('CRM lead not found.');
  }

  private async assertConversationAccessible(
    conversationId: string,
    currentUser: AuthenticatedRequestUser,
  ) {
    const conversation = await this.prisma.conversation.findFirst({
      where: this.andConversationWhere({ id: conversationId }, this.conversationScope(currentUser)),
      select: { id: true },
    });
    if (conversation) {
      return;
    }
    const exists = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true },
    });
    if (exists) {
      throw new ForbiddenException('Conversation is outside your scope.');
    }
    throw new NotFoundException('Conversation not found.');
  }

  private leadScope(currentUser: AuthenticatedRequestUser): Prisma.CrmLeadWhereInput {
    if (isPlatformUser(currentUser)) {
      return {};
    }

    const organizationId = requireCurrentOrganizationId(currentUser);
    if (currentUser.organizationType === OrganizationType.DEVELOPER) {
      return { OR: [{ organizationId }, { project: { developerId: organizationId } }] };
    }

    return {
      OR: [
        { claimedByBrokerUserId: currentUser.userId },
        { claimedByOrganizationId: organizationId },
      ],
    };
  }

  private conversationScope(currentUser: AuthenticatedRequestUser): Prisma.ConversationWhereInput {
    if (isPlatformUser(currentUser)) {
      return {};
    }

    const organizationId = requireCurrentOrganizationId(currentUser);
    if (currentUser.organizationType === OrganizationType.DEVELOPER) {
      return {
        OR: [
          { organizationId },
          { project: { developerId: organizationId } },
          { participants: { some: { organizationId } } },
        ],
      };
    }

    return {
      OR: [
        { participants: { some: { userId: currentUser.userId } } },
        { participants: { some: { organizationId } } },
        { crmLead: { claimedByBrokerUserId: currentUser.userId } },
        { crmLead: { claimedByOrganizationId: organizationId } },
      ],
    };
  }

  private queryWhere(query: ListCrmActivitiesQueryDto): Prisma.CrmActivityWhereInput {
    const clauses: Prisma.CrmActivityWhereInput[] = [];

    if (query.crmLeadId?.trim()) {
      clauses.push({ crmLeadId: query.crmLeadId.trim() });
    }
    if (query.conversationId?.trim()) {
      clauses.push({ conversationId: query.conversationId.trim() });
    }
    if (query.type) {
      clauses.push({ type: this.parseType(query.type) });
    }
    if (query.dateFrom || query.dateTo) {
      clauses.push({ createdAt: this.dateRange(query.dateFrom, query.dateTo) });
    }

    return clauses.length ? { AND: clauses } : {};
  }

  private includeRelations(): Prisma.CrmActivityInclude {
    return {
      crmLead: {
        select: {
          id: true,
          status: true,
          preferredContactMethod: true,
          project: { select: { id: true, name: true, slug: true } },
          client: { select: { name: true, phoneLast4: true, email: true } },
        },
      },
      conversation: {
        select: { id: true, type: true, status: true, shareToken: true },
      },
      actorUser: { select: { id: true, firstName: true, lastName: true } },
      actorOrganization: { select: { id: true, name: true, slug: true, type: true } },
    };
  }

  private toResponse(activity: any) {
    return {
      id: activity.id,
      organizationId: activity.organizationId,
      crmLeadId: activity.crmLeadId,
      conversationId: activity.conversationId,
      type: activity.type,
      title: activity.title,
      body: activity.body,
      actorRole: activity.actorRole,
      publicActorName: activity.publicActorName,
      metadata: activity.metadata,
      createdAt: activity.createdAt,
      crmLead: activity.crmLead
        ? {
            id: activity.crmLead.id,
            status: activity.crmLead.status,
            preferredContactMethod: activity.crmLead.preferredContactMethod,
            project: activity.crmLead.project,
            client: activity.crmLead.client,
          }
        : null,
      conversation: activity.conversation,
      actorUser: activity.actorUser
        ? {
            id: activity.actorUser.id,
            name: [activity.actorUser.firstName, activity.actorUser.lastName].filter(Boolean).join(' ') || null,
          }
        : null,
      actorOrganization: activity.actorOrganization,
    };
  }

  private parseType(type: string) {
    if (!Object.values(CrmActivityType).includes(type as CrmActivityType)) {
      throw new BadRequestException('Unsupported CRM activity type.');
    }
    return type as CrmActivityType;
  }

  private pagination(query: ListCrmActivitiesQueryDto) {
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

  private andWhere(...clauses: Prisma.CrmActivityWhereInput[]) {
    const nonEmpty = clauses.filter((clause) => Object.keys(clause).length > 0);
    if (!nonEmpty.length) return {};
    return nonEmpty.length === 1 ? nonEmpty[0] : { AND: nonEmpty };
  }

  private andLeadWhere(...clauses: Prisma.CrmLeadWhereInput[]) {
    const nonEmpty = clauses.filter((clause) => Object.keys(clause).length > 0);
    if (!nonEmpty.length) return {};
    return nonEmpty.length === 1 ? nonEmpty[0] : { AND: nonEmpty };
  }

  private andConversationWhere(...clauses: Prisma.ConversationWhereInput[]) {
    const nonEmpty = clauses.filter((clause) => Object.keys(clause).length > 0);
    if (!nonEmpty.length) return {};
    return nonEmpty.length === 1 ? nonEmpty[0] : { AND: nonEmpty };
  }

  private cleanRequiredText(value: string, max: number) {
    const cleaned = this.cleanText(value, max);
    if (!cleaned) {
      throw new BadRequestException('Activity title is required.');
    }
    return cleaned;
  }

  private cleanText(value: string | null | undefined, max: number) {
    const cleaned = value
      ?.replace(/[\u0000-\u001f\u007f]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned ? cleaned.slice(0, max) : null;
  }

  private cleanMetadata(metadata: Record<string, unknown> | null | undefined) {
    if (!metadata) {
      return undefined;
    }
    return Object.fromEntries(
      Object.entries(metadata)
        .filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value) || value === null)
        .slice(0, 25),
    ) as Prisma.InputJsonValue;
  }
}

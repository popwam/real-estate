import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';
import { createHash, randomBytes } from 'node:crypto';
import {
  ConversationMessageType,
  ConversationStatus,
  ConversationType,
  CrmActivityType,
  OrganizationType,
  Prisma,
} from '@prisma/client';
import { isPlatformUser, requireCurrentOrganizationId } from '../../common/organization-scope';
import { RATE_LIMITER } from '../../common/rate-limit/rate-limiter';
import { RateLimitExceededException } from '../../common/rate-limit/rate-limit-exceeded.exception';
import type { RateLimiter, RateLimitHeaders } from '../../common/rate-limit/rate-limiter';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { CrmActivitiesService } from '../crm/crm-activities.service';
import { CrmLeadsService } from '../crm/crm-leads.service';
import { PrismaService } from '../database/prisma.service';
import { CreateConversationFromCrmLeadDto } from './dto/create-conversation-from-crm-lead.dto';
import { CreateConversationMessageDto } from './dto/create-conversation-message.dto';
import { CreatePublicConversationMessageDto } from './dto/create-public-conversation-message.dto';
import { ListConversationsQueryDto } from './dto/list-conversations-query.dto';
import { UpdateConversationStatusDto } from './dto/update-conversation-status.dto';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crmLeads: CrmLeadsService,
    private readonly activities: CrmActivitiesService,
    @Inject(RATE_LIMITER) private readonly rateLimiter: RateLimiter,
  ) {}

  async findMany(currentUser: AuthenticatedRequestUser, query: ListConversationsQueryDto = {}) {
    const wantsPaginated = this.hasQuery(query);
    const { page, pageSize, skip, take } = this.pagination(query);
    const where = this.andWhere(this.scope(currentUser), this.queryWhere(query));

    const [conversations, total] = await this.prisma.$transaction([
      this.prisma.conversation.findMany({
        where,
        include: this.includeRelations(),
        orderBy: { updatedAt: 'desc' },
        ...(wantsPaginated ? { skip, take } : {}),
      }),
      this.prisma.conversation.count({ where }),
    ]);

    const items = conversations.map((conversation) => this.toResponse(conversation));
    return wantsPaginated ? this.paginated(items, page, pageSize, total) : items;
  }

  async findOne(id: string, currentUser: AuthenticatedRequestUser) {
    const conversation = await this.findAccessibleConversation(id, currentUser);
    return this.toResponse(conversation);
  }

  async findByToken(shareToken: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { shareToken },
      include: {
        project: { select: { id: true, name: true, slug: true } },
        participants: true,
        messages: {
          include: { senderParticipant: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found.');
    }

    return {
      id: conversation.id,
      type: conversation.type,
      status: conversation.status,
      project: conversation.project,
      participants: conversation.participants.map((participant) => ({
        publicRole: participant.publicRole,
        displayName: participant.displayName,
        joinedAt: participant.joinedAt,
      })),
      messages: conversation.messages.map((message) => ({
        id: message.id,
        type: message.type,
        body: message.body,
        createdAt: message.createdAt,
        sender: message.senderParticipant
          ? {
              publicRole: message.senderParticipant.publicRole,
              displayName: message.senderParticipant.displayName,
            }
          : null,
      })),
    };
  }

  async createPublicMessageByToken(
    shareToken: string,
    dto: CreatePublicConversationMessageDto,
    request?: Request,
  ) {
    const token = shareToken?.trim();
    if (!token) {
      throw new NotFoundException('Conversation not found.');
    }

    const body = this.cleanPublicMessageBody(dto.body);
    const senderName = this.cleanPublicSenderName(dto.senderName);

    const conversation = await this.prisma.conversation.findUnique({
      where: { shareToken: token },
      select: { id: true, status: true, organizationId: true, crmLeadId: true },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found.');
    }
    if (conversation.status !== ConversationStatus.OPEN) {
      throw new BadRequestException('Conversation is not open for public replies.');
    }

    const rateLimit = await this.assertPublicMessageRateLimit(token, request);

    const message = await this.prisma.$transaction(async (tx) => {
      let participant = await tx.conversationParticipant.findFirst({
        where: {
          conversationId: conversation.id,
          publicRole: 'CLIENT',
        },
      });

      if (participant && senderName && participant.displayName !== senderName) {
        participant = await tx.conversationParticipant.update({
          where: { id: participant.id },
          data: { displayName: senderName },
        });
      }

      if (!participant) {
        participant = await tx.conversationParticipant.create({
          data: {
            conversationId: conversation.id,
            publicRole: 'CLIENT',
            displayName: senderName ?? 'Client',
          },
        });
      }

      const created = await tx.conversationMessage.create({
        data: {
          conversationId: conversation.id,
          senderParticipantId: participant.id,
          type: ConversationMessageType.TEXT,
          body,
        },
        include: { senderParticipant: true },
      });

      await tx.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      });

      await this.activities.create(
        {
          organizationId: conversation.organizationId,
          crmLeadId: conversation.crmLeadId,
          conversationId: conversation.id,
          publicActorName: senderName ?? participant.displayName ?? 'Client',
          type: CrmActivityType.PUBLIC_MESSAGE_SENT,
          title: 'Public message sent',
          body: body.slice(0, 240),
          metadata: { messageType: created.type },
        },
        tx,
      );

      return created;
    });

    return {
      body: {
        ok: true,
        message: this.toPublicMessageResponse(message),
      },
      rateLimit,
    };
  }

  async createFromCrmLead(
    crmLeadId: string,
    dto: CreateConversationFromCrmLeadDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    const lead = await this.crmLeads.findAccessibleLead(crmLeadId, currentUser);

    const existing = await this.prisma.conversation.findFirst({
      where: { crmLeadId: lead.id, type: 'PUBLIC_LEAD' },
      include: this.includeRelations(),
    });
    if (existing) {
      return this.toResponse(existing);
    }

    const conversation = await this.prisma.$transaction(async (tx) => {
      const created = await tx.conversation.create({
        data: {
          organizationId: lead.organizationId,
          projectId: lead.projectId,
          unitId: lead.unitId,
          crmLeadId: lead.id,
          type: 'PUBLIC_LEAD',
          shareToken: this.shareToken(),
          participants: {
            create: this.initialParticipants(lead),
          },
          messages: {
            create: {
              type: 'SYSTEM',
              body: dto.openingMessage?.trim() || 'Conversation created from CRM lead.',
            },
          },
        },
        include: this.includeRelations(),
      });

      await tx.crmLead.update({
        where: { id: lead.id },
        data: { status: lead.status === 'NEW' ? 'IN_CONVERSATION' : lead.status },
      });

      await this.activities.create(
        {
          organizationId: created.organizationId,
          crmLeadId: created.crmLeadId,
          conversationId: created.id,
          actorUserId: currentUser.userId,
          actorOrganizationId: currentUser.organizationId,
          actorRole: currentUser.role,
          type: CrmActivityType.CONVERSATION_CREATED,
          title: 'Conversation created',
          body: 'Conversation created from CRM lead.',
          metadata: { source: 'CRM_LEAD' },
        },
        tx,
      );

      return created;
    });

    return this.toResponse(conversation);
  }

  async listMessages(id: string, currentUser: AuthenticatedRequestUser) {
    await this.findAccessibleConversation(id, currentUser);
    const messages = await this.prisma.conversationMessage.findMany({
      where: { conversationId: id },
      include: { senderParticipant: true },
      orderBy: { createdAt: 'asc' },
    });

    return messages.map((message) => this.toMessageResponse(message));
  }

  async createMessage(
    id: string,
    dto: CreateConversationMessageDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    if (!dto.body?.trim()) {
      throw new BadRequestException('body is required.');
    }

    const conversation = await this.findAccessibleConversation(id, currentUser);
    const participant = await this.ensureParticipant(conversation.id, currentUser);

    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.conversationMessage.create({
        data: {
          conversationId: conversation.id,
          senderParticipantId: participant.id,
          type: this.parseMessageType(dto.type),
          body: dto.body.trim(),
          metadata: this.cleanMetadata(dto.metadata),
        },
        include: { senderParticipant: true },
      });

      await tx.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      });

      await this.activities.create(
        {
          organizationId: conversation.organizationId,
          crmLeadId: conversation.crmLeadId,
          conversationId: conversation.id,
          actorUserId: currentUser.userId,
          actorOrganizationId: currentUser.organizationId,
          actorRole: currentUser.role,
          type: CrmActivityType.MESSAGE_SENT,
          title: 'Message sent',
          body: created.body.slice(0, 240),
          metadata: { messageType: created.type },
        },
        tx,
      );

      return created;
    });

    return this.toMessageResponse(message);
  }

  async updateStatus(
    id: string,
    dto: UpdateConversationStatusDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    const status = this.parseConversationStatus(dto.status);
    const conversation = await this.findAccessibleConversation(id, currentUser);
    this.assertCanManageConversation(currentUser);

    const updated = await this.prisma.$transaction(async (tx) => {
      const changed = await tx.conversation.update({
        where: { id: conversation.id },
        data: {
          status,
          statusNote: this.cleanStatusNote(dto.statusNote),
        },
        include: this.includeRelations(),
      });

      await this.activities.create(
        {
          organizationId: changed.organizationId,
          crmLeadId: changed.crmLeadId,
          conversationId: changed.id,
          actorUserId: currentUser.userId,
          actorOrganizationId: currentUser.organizationId,
          actorRole: currentUser.role,
          type: CrmActivityType.CONVERSATION_STATUS_CHANGED,
          title: 'Conversation status changed',
          body: dto.statusNote,
          metadata: {
            previousStatus: conversation.status,
            status: changed.status,
          },
        },
        tx,
      );

      return changed;
    });

    return this.toResponse(updated);
  }

  private async findAccessibleConversation(id: string, currentUser: AuthenticatedRequestUser) {
    const conversation = await this.prisma.conversation.findFirst({
      where: this.andWhere({ id }, this.scope(currentUser)),
      include: this.includeRelations(),
    });

    if (!conversation) {
      const exists = await this.prisma.conversation.findUnique({ where: { id } });
      if (exists) {
        throw new ForbiddenException('Conversation is outside your scope.');
      }
      throw new NotFoundException('Conversation not found.');
    }

    return conversation;
  }

  scope(currentUser: AuthenticatedRequestUser): Prisma.ConversationWhereInput {
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

  private includeRelations(): Prisma.ConversationInclude {
    return {
      organization: { select: { id: true, name: true, slug: true, type: true } },
      project: { select: { id: true, name: true, slug: true, developerId: true } },
      crmLead: {
        include: {
          client: true,
          claimedByBroker: { select: { id: true, firstName: true, lastName: true } },
          claimedByOrganization: { select: { id: true, name: true, slug: true } },
        },
      },
      participants: true,
      messages: { orderBy: { createdAt: 'asc' as const }, take: 5 },
    };
  }

  private initialParticipants(lead: any) {
    const participants: Prisma.ConversationParticipantCreateWithoutConversationInput[] = [
      {
        publicRole: 'CLIENT',
        displayName: lead.client?.name ?? 'Client',
      },
      {
        publicRole: 'DEVELOPER',
        organization: { connect: { id: lead.organizationId } },
        displayName: lead.organization?.name ?? 'Developer',
      },
    ];

    if (lead.claimedByBrokerUserId) {
      participants.push({
        publicRole: 'BROKER',
        user: { connect: { id: lead.claimedByBrokerUserId } },
        organization: lead.claimedByOrganizationId
          ? { connect: { id: lead.claimedByOrganizationId } }
          : undefined,
        displayName: 'Claimed broker',
      });
    }

    return participants;
  }

  private async ensureParticipant(conversationId: string, currentUser: AuthenticatedRequestUser) {
    const existing = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId, userId: currentUser.userId },
    });
    if (existing) {
      return existing;
    }

    return this.prisma.conversationParticipant.create({
      data: {
        conversationId,
        userId: currentUser.userId,
        organizationId: currentUser.organizationId,
        publicRole: this.userConversationRole(currentUser),
        displayName: currentUser.role,
      },
    });
  }

  private userConversationRole(currentUser: AuthenticatedRequestUser) {
    if (isPlatformUser(currentUser)) {
      return 'PLATFORM';
    }
    if (currentUser.organizationType === OrganizationType.DEVELOPER) {
      return 'DEVELOPER';
    }
    return 'BROKER';
  }

  private parseMessageType(type: string | undefined) {
    if (!type) {
      return ConversationMessageType.TEXT;
    }
    if (!Object.values(ConversationMessageType).includes(type as ConversationMessageType)) {
      throw new BadRequestException('Unsupported message type.');
    }
    return type as ConversationMessageType;
  }

  private cleanMetadata(metadata: Record<string, unknown> | undefined) {
    if (!metadata) {
      return undefined;
    }
    return Object.fromEntries(
      Object.entries(metadata)
        .filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value))
        .slice(0, 25),
    ) as Prisma.InputJsonValue;
  }

  private toResponse(conversation: any) {
    return {
      id: conversation.id,
      organizationId: conversation.organizationId,
      projectId: conversation.projectId,
      unitId: conversation.unitId,
      crmLeadId: conversation.crmLeadId,
      type: conversation.type,
      status: conversation.status,
      statusNote: conversation.statusNote,
      shareToken: conversation.shareToken,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      organization: conversation.organization,
      project: conversation.project,
      crmLead: conversation.crmLead
        ? {
            id: conversation.crmLead.id,
            status: conversation.crmLead.status,
            preferredContactMethod: conversation.crmLead.preferredContactMethod,
            client: {
              id: conversation.crmLead.client.id,
              name: conversation.crmLead.client.name,
              phoneLast4: conversation.crmLead.client.phoneLast4,
              email: conversation.crmLead.client.email,
            },
          }
        : null,
      participants: conversation.participants?.map((participant: any) => ({
        id: participant.id,
        publicRole: participant.publicRole,
        displayName: participant.displayName,
        joinedAt: participant.joinedAt,
        lastReadAt: participant.lastReadAt,
      })),
      recentMessages: conversation.messages?.map((message: any) => ({
        id: message.id,
        type: message.type,
        body: message.body,
        createdAt: message.createdAt,
      })),
    };
  }

  private toMessageResponse(message: any) {
    return {
      id: message.id,
      conversationId: message.conversationId,
      type: message.type,
      body: message.body,
      metadata: message.metadata,
      createdAt: message.createdAt,
      sender: message.senderParticipant
        ? {
            id: message.senderParticipant.id,
            publicRole: message.senderParticipant.publicRole,
            displayName: message.senderParticipant.displayName,
          }
        : null,
    };
  }

  private toPublicMessageResponse(message: any) {
    return {
      id: message.id,
      type: message.type,
      body: message.body,
      createdAt: message.createdAt,
      sender: message.senderParticipant
        ? {
            publicRole: message.senderParticipant.publicRole,
            displayName: message.senderParticipant.displayName,
          }
        : null,
    };
  }

  private shareToken() {
    return randomBytes(32).toString('base64url');
  }

  private queryWhere(query: ListConversationsQueryDto): Prisma.ConversationWhereInput {
    const clauses: Prisma.ConversationWhereInput[] = [];

    if (query.status) {
      clauses.push({ status: this.parseConversationStatus(query.status) });
    }
    if (query.type) {
      clauses.push({ type: this.parseConversationType(query.type) });
    }
    if (query.projectId?.trim()) {
      clauses.push({ projectId: query.projectId.trim() });
    }
    if (query.crmLeadId?.trim()) {
      clauses.push({ crmLeadId: query.crmLeadId.trim() });
    }
    if (query.dateFrom || query.dateTo) {
      clauses.push({ createdAt: this.dateRange(query.dateFrom, query.dateTo) });
    }
    const search = query.search?.trim();
    if (search) {
      clauses.push({
        OR: [
          { crmLead: { client: { name: { contains: search, mode: 'insensitive' } } } },
          { crmLead: { client: { phoneLast4: { contains: search } } } },
          { crmLead: { client: { normalizedEmail: { contains: search.toLowerCase(), mode: 'insensitive' } } } },
          { project: { name: { contains: search, mode: 'insensitive' } } },
          { participants: { some: { displayName: { contains: search, mode: 'insensitive' } } } },
        ],
      });
    }

    return clauses.length ? { AND: clauses } : {};
  }

  private assertCanManageConversation(currentUser: AuthenticatedRequestUser) {
    if (isPlatformUser(currentUser)) {
      return;
    }

    const allowed = currentUser.permissions?.some((permission) =>
      ['crm.conversations.manage_own', 'crm.conversations.view_project'].includes(permission),
    );
    if (!allowed) {
      throw new ForbiddenException('Missing CRM conversation management permission.');
    }
  }

  private andWhere(...clauses: Prisma.ConversationWhereInput[]) {
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

  private pagination(query: ListConversationsQueryDto) {
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

  private parseConversationStatus(status: string | undefined) {
    if (!status || !Object.values(ConversationStatus).includes(status as ConversationStatus)) {
      throw new BadRequestException('Unsupported conversation status.');
    }
    return status as ConversationStatus;
  }

  private parseConversationType(type: string) {
    if (!Object.values(ConversationType).includes(type as ConversationType)) {
      throw new BadRequestException('Unsupported conversation type.');
    }
    return type as ConversationType;
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

  private cleanPublicMessageBody(value: unknown) {
    if (typeof value !== 'string') {
      throw new BadRequestException('body is required.');
    }
    const trimmed = value.trim();
    if (!trimmed) {
      throw new BadRequestException('body is required.');
    }
    if (trimmed.length > 2000) {
      throw new BadRequestException('body must be 2000 characters or fewer.');
    }
    return trimmed;
  }

  private cleanPublicSenderName(value: unknown) {
    if (typeof value !== 'string') {
      return undefined;
    }
    const cleaned = value
      .replace(/[\u0000-\u001f\u007f]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!cleaned) {
      return undefined;
    }
    if (cleaned.length > 120) {
      throw new BadRequestException('senderName must be 120 characters or fewer.');
    }
    return cleaned;
  }

  private async assertPublicMessageRateLimit(
    shareToken: string,
    request?: Request,
  ): Promise<RateLimitHeaders> {
    const windowSeconds = this.envInt('PUBLIC_CONVERSATION_MESSAGE_RATE_LIMIT_WINDOW_SECONDS', 60);
    const max = this.envInt('PUBLIC_CONVERSATION_MESSAGE_RATE_LIMIT_MAX', 30);
    const key = this.publicMessageRateLimitKey(shareToken, request);
    const result = await this.rateLimiter.check(key, { windowSeconds, max });
    const rateLimit = {
      limit: max,
      remaining: result.remaining,
      resetAt: result.resetAt,
    };

    if (!result.allowed) {
      throw new RateLimitExceededException(
        'Too many public conversation messages. Please try again shortly.',
        rateLimit,
      );
    }

    return rateLimit;
  }

  private publicMessageRateLimitKey(shareToken: string, request?: Request) {
    const sourceIp = this.sourceIp(request);
    const sourceIpHash = sourceIp
      ? createHash('sha256').update(`public-conversation-message:${sourceIp}`).digest('hex')
      : 'unknown';
    const tokenHash = createHash('sha256')
      .update(`public-conversation-token:${shareToken}`)
      .digest('hex');
    return createHash('sha256')
      .update(`public-conversation-message-rate:${tokenHash}:${sourceIpHash}`)
      .digest('hex');
  }

  private sourceIp(request?: Request) {
    const forwardedFor = request?.headers?.['x-forwarded-for'];
    if (Array.isArray(forwardedFor)) {
      return forwardedFor[0]?.split(',')[0]?.trim();
    }
    if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
      return forwardedFor.split(',')[0]?.trim();
    }
    return request?.ip ?? request?.socket?.remoteAddress ?? undefined;
  }

  private envInt(name: string, fallback: number) {
    const parsed = Number.parseInt(process.env[name] ?? '', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }
}

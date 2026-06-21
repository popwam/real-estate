import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { Request } from 'express';
import {
  LeadAssignmentType,
  Prisma,
  ProjectSellingMode,
  PublicVisitorEventType,
  VisitorAttributionType,
} from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateVisitorEventsDto, PublicVisitorEventDto } from './dto/create-visitor-events.dto';
import { CreateVisitorSessionDto } from './dto/create-visitor-session.dto';

type PublicProjectContext = {
  id: string;
  developerId: string;
  sellingMode: ProjectSellingMode;
};

@Injectable()
export class PublicVisitorsService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrUpdateSession(dto: CreateVisitorSessionDto, request?: Request) {
    this.assertKey(dto.anonymousKey, 'anonymousKey');
    this.assertKey(dto.sessionKey, 'sessionKey');
    const anonymousKeyHash = this.hash(`visitor:${dto.anonymousKey}`);
    const sessionKeyHash = this.hash(`session:${dto.sessionKey}`);
    const now = new Date();
    const userAgent = request?.headers['user-agent'];
    const userAgentValue = Array.isArray(userAgent) ? userAgent.join(' ') : userAgent;
    const visitor = await this.prisma.publicVisitor.upsert({
      where: { anonymousKeyHash },
      create: {
        anonymousKeyHash,
        userAgentHash: userAgentValue ? this.hash(`ua:${userAgentValue.slice(0, 500)}`) : undefined,
      },
      update: { lastSeenAt: now },
    });
    const project = dto.projectSlug ? await this.publicProject(dto.projectSlug) : null;
    const source = this.cleanSource(dto);
    const attribution = project
      ? await this.resolveAttribution(project, dto)
      : { type: VisitorAttributionType.UNKNOWN, organizationId: null, brokerUserId: null };
    const existing = await this.prisma.publicVisitorSession.findUnique({
      where: { clientSessionKeyHash: sessionKeyHash },
    });
    if (existing && existing.visitorId !== visitor.id) {
      throw new BadRequestException('sessionKey does not belong to this visitor.');
    }

    const shouldSetFirst = !existing || existing.firstTouchType === VisitorAttributionType.UNKNOWN;
    const session = existing
      ? await this.prisma.publicVisitorSession.update({
          where: { id: existing.id },
          data: {
            lastSeenAt: now,
            lastTouchSource: source as Prisma.InputJsonValue,
            projectId: existing.projectId ?? project?.id,
            ...(shouldSetFirst && project
              ? {
                  firstTouchSource: source as Prisma.InputJsonValue,
                  firstTouchType: attribution.type,
                  firstTouchOrganizationId: attribution.organizationId,
                  firstTouchBrokerUserId: attribution.brokerUserId,
                }
              : {}),
          },
        })
      : await this.prisma.publicVisitorSession.create({
          data: {
            visitorId: visitor.id,
            clientSessionKeyHash: sessionKeyHash,
            projectId: project?.id,
            firstTouchSource: source as Prisma.InputJsonValue,
            lastTouchSource: source as Prisma.InputJsonValue,
            firstTouchType: attribution.type,
            firstTouchOrganizationId: attribution.organizationId,
            firstTouchBrokerUserId: attribution.brokerUserId,
          },
        });

    return {
      visitorId: visitor.id,
      sessionId: session.id,
      startedAt: session.startedAt,
      lastSeenAt: session.lastSeenAt,
    };
  }

  async createEvents(dto: CreateVisitorEventsDto) {
    if (!dto.visitorId || !dto.sessionId) throw new BadRequestException('visitorId and sessionId are required.');
    if (!Array.isArray(dto.events) || dto.events.length < 1 || dto.events.length > 25) {
      throw new BadRequestException('events must contain between 1 and 25 items.');
    }
    const session = await this.prisma.publicVisitorSession.findFirst({
      where: { id: dto.sessionId, visitorId: dto.visitorId },
      include: { project: { select: { id: true, slug: true } } },
    });
    if (!session) throw new NotFoundException('Visitor session not found.');

    const projectSlugs = [...new Set(dto.events.map((event) => event.projectSlug).filter(Boolean))] as string[];
    const projects = projectSlugs.length
      ? await this.prisma.project.findMany({
          where: { slug: { in: projectSlugs }, status: 'ACTIVE', visibility: 'OPEN_MARKETPLACE' },
          select: { id: true, slug: true },
        })
      : [];
    const bySlug = new Map(projects.map((project) => [project.slug, project.id]));
    const rows = dto.events.map((event) => this.eventData(event, dto, bySlug, session.projectId));
    await this.prisma.$transaction([
      this.prisma.publicVisitorEvent.createMany({ data: rows }),
      this.prisma.publicVisitorSession.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } }),
      this.prisma.publicVisitor.update({ where: { id: dto.visitorId }, data: { lastSeenAt: new Date() } }),
    ]);
    return { accepted: rows.length };
  }

  async resolveLeadAssignment(
    visitorId: string | undefined,
    sessionId: string | undefined,
    project: PublicProjectContext | null,
  ) {
    const owner = {
      visitorId: undefined as string | undefined,
      visitorSessionId: undefined as string | undefined,
      assignmentType: LeadAssignmentType.COMPANY,
      assignedOrganizationId: project?.developerId,
      assignedBrokerUserId: undefined as string | undefined,
      assignmentReason: project ? 'PROJECT_OWNER_DEFAULT' : 'ORGANIZATION_DEFAULT',
      firstTouchAttribution: undefined as Prisma.InputJsonValue | undefined,
      lastTouchAttribution: undefined as Prisma.InputJsonValue | undefined,
    };
    if (!visitorId || !sessionId) return owner;
    const session = await this.prisma.publicVisitorSession.findFirst({
      where: { id: sessionId, visitorId },
    });
    if (!session) return owner;
    owner.visitorId = visitorId;
    owner.visitorSessionId = sessionId;
    owner.firstTouchAttribution = session.firstTouchSource as Prisma.InputJsonValue | undefined;
    owner.lastTouchAttribution = session.lastTouchSource as Prisma.InputJsonValue | undefined;
    if (!project || session.projectId !== project.id || project.sellingMode === ProjectSellingMode.OWNER_ONLY) {
      owner.assignmentReason = project?.sellingMode === ProjectSellingMode.OWNER_ONLY
        ? 'OWNER_ONLY_MODE'
        : 'NO_VALID_PROJECT_ATTRIBUTION';
      return owner;
    }
    if (session.firstTouchType === VisitorAttributionType.BROKER && session.firstTouchBrokerUserId) {
      const valid = await this.isAuthorized(project, session.firstTouchBrokerUserId, session.firstTouchOrganizationId);
      if (valid) {
        return {
          ...owner,
          assignmentType: LeadAssignmentType.BROKER,
          assignedOrganizationId: session.firstTouchOrganizationId ?? undefined,
          assignedBrokerUserId: session.firstTouchBrokerUserId,
          assignmentReason: 'AUTHORIZED_BROKER_FIRST_TOUCH',
        };
      }
    }
    if (session.firstTouchType === VisitorAttributionType.BROKERAGE && session.firstTouchOrganizationId) {
      const valid = await this.isAuthorized(project, undefined, session.firstTouchOrganizationId);
      if (valid) {
        return {
          ...owner,
          assignmentType: LeadAssignmentType.BROKERAGE,
          assignedOrganizationId: session.firstTouchOrganizationId,
          assignmentReason: 'AUTHORIZED_BROKERAGE_FIRST_TOUCH',
        };
      }
    }
    owner.assignmentReason = session.firstTouchType === VisitorAttributionType.COMPANY
      ? 'COMPANY_FIRST_TOUCH'
      : 'UNAUTHORIZED_OR_UNKNOWN_ATTRIBUTION';
    return owner;
  }

  private async resolveAttribution(project: PublicProjectContext, dto: CreateVisitorSessionDto) {
    if (project.sellingMode === ProjectSellingMode.OWNER_ONLY) {
      return { type: VisitorAttributionType.COMPANY, organizationId: project.developerId, brokerUserId: null };
    }
    const brokerId = dto.brokerId?.trim();
    if (brokerId) {
      const broker = await this.prisma.user.findFirst({
        where: { id: brokerId, isActive: true, userRole: { in: ['BROKER', 'INDIVIDUAL_BROKER'] } },
        include: { organization: true },
      });
      if (broker && await this.isAuthorized(project, broker.id, broker.organizationId)) {
        return { type: VisitorAttributionType.BROKER, organizationId: broker.organizationId, brokerUserId: broker.id };
      }
    }
    const orgSlug = dto.brokerageSlug?.trim().toLowerCase() ?? dto.brokerSlug?.trim().toLowerCase();
    if (orgSlug) {
      const organization = await this.prisma.organization.findFirst({
        where: { slug: orgSlug, type: { in: ['BROKERAGE', 'INDIVIDUAL_BROKER'] }, status: 'APPROVED' },
      });
      if (organization && await this.isAuthorized(project, undefined, organization.id)) {
        return { type: VisitorAttributionType.BROKERAGE, organizationId: organization.id, brokerUserId: null };
      }
    }
    return { type: VisitorAttributionType.COMPANY, organizationId: project.developerId, brokerUserId: null };
  }

  private async isAuthorized(project: PublicProjectContext, brokerUserId?: string, organizationId?: string | null) {
    if (project.sellingMode === ProjectSellingMode.OWNER_ONLY) return false;
    if (project.sellingMode === ProjectSellingMode.OPEN_BROKERAGE) {
      if (brokerUserId) {
        return Boolean(await this.prisma.user.findFirst({
          where: {
            id: brokerUserId,
            isActive: true,
            userRole: { in: ['BROKER', 'INDIVIDUAL_BROKER'] },
            organization: { status: 'APPROVED', type: { in: ['BROKERAGE', 'INDIVIDUAL_BROKER'] } },
          },
        }));
      }
      return Boolean(organizationId && await this.prisma.organization.findFirst({
        where: { id: organizationId, status: 'APPROVED', type: { in: ['BROKERAGE', 'INDIVIDUAL_BROKER'] } },
      }));
    }
    return Boolean(await this.prisma.projectBrokerAuthorization.findFirst({
      where: {
        projectId: project.id,
        status: 'ACTIVE',
        OR: [
          ...(brokerUserId ? [{ brokerUserId }] : []),
          ...(organizationId ? [{ organizationId }] : []),
        ],
      },
    }));
  }

  private async publicProject(slug: string): Promise<PublicProjectContext> {
    const project = await this.prisma.project.findFirst({
      where: { slug: slug.trim().toLowerCase(), status: 'ACTIVE', visibility: 'OPEN_MARKETPLACE' },
      select: { id: true, developerId: true, sellingMode: true },
    });
    if (!project) throw new BadRequestException('projectSlug is not public.');
    return project;
  }

  private eventData(
    event: PublicVisitorEventDto,
    dto: CreateVisitorEventsDto,
    projects: Map<string, string>,
    fallbackProjectId: string | null,
  ): Prisma.PublicVisitorEventCreateManyInput {
    if (!Object.values(PublicVisitorEventType).includes(event.eventType as PublicVisitorEventType)) {
      throw new BadRequestException('eventType is invalid.');
    }
    const path = this.cleanText(event.path, 500);
    if (!path || !path.startsWith('/')) throw new BadRequestException('event path is invalid.');
    const durationMs = this.boundedInt(event.durationMs, 0, 30 * 60 * 1000, 'durationMs');
    const scrollDepth = this.boundedInt(event.scrollDepth, 0, 100, 'scrollDepth');
    return {
      visitorId: dto.visitorId,
      sessionId: dto.sessionId,
      eventType: event.eventType as PublicVisitorEventType,
      projectId: event.projectSlug ? projects.get(event.projectSlug) : fallbackProjectId,
      path,
      searchQuery: this.cleanText(event.searchQuery, 250),
      filters: this.cleanObject(event.filters) as Prisma.InputJsonValue | undefined,
      durationMs,
      scrollDepth,
      sectionId: this.cleanText(event.sectionId, 100),
      metadata: this.cleanObject(event.metadata) as Prisma.InputJsonValue | undefined,
    };
  }

  private cleanSource(dto: CreateVisitorSessionDto) {
    return this.cleanObject({
      path: this.cleanText(dto.path, 500),
      brokerId: this.cleanText(dto.brokerId, 100),
      brokerSlug: this.cleanText(dto.brokerSlug, 100),
      brokerageSlug: this.cleanText(dto.brokerageSlug, 100),
      ref: this.cleanReferral(dto.ref),
      utm: this.cleanObject(dto.utm),
    }) ?? {};
  }

  private cleanObject(value?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
    const entries: Array<[string, unknown]> = [];
    for (const [key, item] of Object.entries(value).slice(0, 25)) {
      const safeKey = this.cleanText(key, 64);
      if (!safeKey) continue;
      if (typeof item === 'string') entries.push([safeKey, item.slice(0, 500)]);
      else if (typeof item === 'number' || typeof item === 'boolean') entries.push([safeKey, item]);
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        entries.push([safeKey, this.cleanObject(item as Record<string, unknown>) ?? {}]);
      }
    }
    return Object.fromEntries(entries);
  }

  private assertKey(value: string, field: string) {
    if (!value || value.length < 16 || value.length > 200 || !/^[A-Za-z0-9._:-]+$/.test(value)) {
      throw new BadRequestException(`${field} is invalid.`);
    }
  }

  private cleanText(value: unknown, max: number) {
    if (typeof value !== 'string') return undefined;
    const clean = value.trim();
    return clean ? clean.slice(0, max) : undefined;
  }

  private cleanReferral(value: unknown) {
    const clean = this.cleanText(value, 500);
    if (!clean) return undefined;
    if (!/^https?:\/\//i.test(clean)) return clean.slice(0, 100);
    try {
      const url = new URL(clean);
      return `${url.origin}${url.pathname}`.slice(0, 250);
    } catch {
      return undefined;
    }
  }

  private boundedInt(value: number | undefined, min: number, max: number, field: string) {
    if (value === undefined) return undefined;
    if (!Number.isInteger(value) || value < min || value > max) {
      throw new BadRequestException(`${field} is invalid.`);
    }
    return value;
  }

  private hash(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }
}

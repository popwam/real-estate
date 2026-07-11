import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { Request } from 'express';
import {
  Organization,
  OrganizationProfile,
  OrganizationStatus,
  PaymentPlan,
  Prisma,
  ProjectStatus,
  ProjectVisibility,
  UnitStatus,
  UnitType,
  UnitVisibility,
  PreferredContactMethod,
} from '@prisma/client';
import { RATE_LIMITER } from '../../common/rate-limit/rate-limiter';
import { RateLimitExceededException } from '../../common/rate-limit/rate-limit-exceeded.exception';
import type { RateLimiter, RateLimitHeaders } from '../../common/rate-limit/rate-limiter';
import { PrismaService } from '../database/prisma.service';
import { CrmConversionService } from '../crm/crm-conversion.service';
import { CreatePublicLeadDto } from './dto/create-public-lead.dto';
import { PublicProjectFiltersDto } from './dto/public-project-filters.dto';
import { PublicVisitorsService } from './public-visitors.service';

type OrganizationWithPublicProfile = Organization & {
  profile: OrganizationProfile | null;
  websiteSettings: any;
  domainVerifications?: any[];
};

@Injectable()
export class PublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crmConversion: CrmConversionService,
    private readonly visitors: PublicVisitorsService,
    @Inject(RATE_LIMITER) private readonly rateLimiter: RateLimiter,
  ) {}

  async getOrganization(slug: string) {
    const organization = await this.prisma.organization.findFirst({
      where: {
        slug,
        status: OrganizationStatus.APPROVED,
        websiteSettings: { isPublished: true },
      },
      include: {
        profile: true,
        websiteSettings: true,
        domainVerifications: {
          where: { status: 'VERIFIED' },
          orderBy: { verifiedAt: 'desc' },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Public organization not found.');
    }

    return this.toPublicOrganization(organization);
  }

  async getCompanyPortal(slug: string) {
    const normalizedSlug = this.requiredSlug(slug, 'slug');
    const pathAlias = `/c/${normalizedSlug}`;
    const organization = await this.prisma.organization.findFirst({
      where: {
        OR: [
          { slug: normalizedSlug },
          {
            domainVerifications: {
              some: {
                domain: pathAlias,
                type: 'PATH_ALIAS',
                status: { in: ['ACTIVE', 'VERIFIED'] as any },
              },
            },
          },
        ],
        status: OrganizationStatus.APPROVED,
      },
      include: {
        profile: true,
        websiteSettings: true,
        branches: {
          where: { isActive: true },
          orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
        },
        domainVerifications: {
          where: {
            OR: [
              { isDefault: true },
              { domain: pathAlias },
              { domain: `${normalizedSlug}.popwam.com` },
            ],
          },
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Public company portal not found.');
    }

    const defaultDomain = organization.domainVerifications[0];
    return {
      organization: this.toPublicOrganization(organization as OrganizationWithPublicProfile),
      offices: organization.branches.map((office) => ({
        id: office.id,
        name: office.name,
        type: office.type,
        address: office.address,
        city: office.city,
        country: office.country,
        isDefault: office.isDefault,
      })),
      domain: defaultDomain
        ? {
            id: defaultDomain.id,
            domain: defaultDomain.domain,
            type: defaultDomain.type,
            status: defaultDomain.status,
            isDefault: defaultDomain.isDefault,
            redirectMode: defaultDomain.redirectMode,
            redirectUrl: defaultDomain.redirectUrl,
            inboundSourceMode: defaultDomain.inboundSourceMode,
          }
        : null,
      portalLinks: {
        fallbackPath: `/c/${organization.slug}`,
        systemSubdomain: `${organization.slug}.popwam.com`,
      },
    };
  }

  async resolveDomain(host: string) {
    const normalizedHost = this.normalizeHost(host);
    if (!normalizedHost) {
      throw new BadRequestException('host is required.');
    }

    const localSlug = this.localDevelopmentSlug(normalizedHost);
    const where = localSlug
      ? { publicSlug: localSlug }
      : this.domainWhere(normalizedHost);

    const settings = await this.prisma.organizationWebsiteSettings.findFirst({
      where: {
        ...where,
        isPublished: true,
        organization: { status: OrganizationStatus.APPROVED },
      },
      include: {
        organization: {
          include: {
            profile: true,
            domainVerifications: {
              where: { status: 'VERIFIED' },
              orderBy: { verifiedAt: 'desc' },
            },
          },
        },
      },
    });

    if (!settings) {
      throw new NotFoundException('Public domain was not found.');
    }

    const kind =
      settings.customDomain?.toLowerCase() === normalizedHost
        ? 'CUSTOM_DOMAIN'
        : 'SUBDOMAIN';

    return {
      kind,
      host: normalizedHost,
      organization: this.toPublicOrganization({
        ...settings.organization,
        websiteSettings: settings,
      } as OrganizationWithPublicProfile),
      websiteSettings: this.toWebsiteSettings(settings),
      routes: {
        home: '/',
        projects: '/projects',
        contact: '/contact',
      },
    };
  }

  async listProjects(filters: PublicProjectFiltersDto = {}) {
    const where = this.publicProjectWhere(filters);

    const projects = await this.prisma.project.findMany({
      where,
      include: this.projectInclude(),
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    });

    return projects.map((project) => this.toProjectSummary(project));
  }

  async getProject(slug: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        slug,
        status: ProjectStatus.ACTIVE,
        visibility: ProjectVisibility.OPEN_MARKETPLACE,
        developer: {
          type: 'DEVELOPER',
          status: OrganizationStatus.APPROVED,
        },
      },
      include: this.projectDetailInclude(),
    });

    if (!project) {
      throw new NotFoundException('Public project not found.');
    }

    return this.toProjectDetail(project);
  }

  async getOrganizationProjects(slug: string) {
    await this.getOrganization(slug);

    return this.listProjects({ organizationSlug: slug });
  }

  async createLead(dto: CreatePublicLeadDto, request?: Request) {
    this.assertLeadDto(dto);

    const source = this.sourceContext(request, dto);
    const rateLimit = await this.assertPublicLeadRateLimit(source.rateLimitKey);

    const organization = dto.organizationSlug
      ? await this.findPublicOrganizationBySlug(dto.organizationSlug)
      : null;
    const project = dto.projectSlug
      ? await this.findPublicProjectBySlug(dto.projectSlug, dto.organizationSlug)
      : null;

    if (!organization && project) {
      // Keep lead routing obvious when only a project is supplied.
      await this.findPublicOrganizationById(project.developerId);
    }

    const organizationId = organization?.id ?? project?.developerId;
    const projectId = project?.id;
    const assignment = await this.visitors.resolveLeadAssignment(
      this.optionalString(dto.visitorId),
      this.optionalString(dto.visitorSessionId),
      project,
    );
    const normalizedPhone = this.normalizePhone(dto.phone);
    const phoneHash = this.hashPhone(normalizedPhone);
    const phoneLast4 = normalizedPhone.slice(-4) || null;
    const idempotencyKey = this.optionalString(dto.idempotencyKey);
    const normalizedEmail = this.optionalEmail(dto.email);
    const preferredContactMethod = this.parsePreferredContactMethod(
      dto.preferredContactMethod,
    );
    const spamSignals = this.spamSignals(dto);
    const isSpam = spamSignals.length > 0;

    const existingLead = await this.findDuplicateLead({
      organizationId,
      projectId,
      phoneHash,
      idempotencyKey,
    });

    if (existingLead) {
      const existingPreferredContactMethod =
        existingLead.preferredContactMethod ?? PreferredContactMethod.CALL;
      const chatConversation =
        existingLead.status !== 'SPAM' &&
        preferredContactMethod === PreferredContactMethod.CHAT
          ? await this.createPublicChatConversation(existingLead.id, true)
          : undefined;

      return {
        body: {
        success: true,
        ok: true,
        id: existingLead.id,
        leadId: existingLead.id,
        status: chatConversation ? 'CONVERTED' : existingLead.status,
        preferredContactMethod: chatConversation
          ? PreferredContactMethod.CHAT
          : existingPreferredContactMethod,
        duplicate: true,
        duplicateReason: existingLead.statusNote ?? 'duplicate_detected',
        conversation: chatConversation,
        shareToken: chatConversation?.shareToken,
        conversationUrl: chatConversation?.shareUrl,
        message: 'Lead already received.',
        },
        rateLimit,
      };
    }

    const lead = await this.prisma.publicLead.create({
      data: {
        organizationId,
        projectId,
        name: dto.name.trim(),
        phone: dto.phone.trim(),
        phoneHash,
        phoneLast4,
        email: normalizedEmail,
        normalizedEmail,
        message: this.optionalString(dto.message),
        sourcePage: this.optionalString(dto.sourcePage),
        utm: this.cleanUtm(dto.utm) as Prisma.InputJsonValue | undefined,
        consentAt: dto.consent ? new Date() : undefined,
        idempotencyKey,
        consent: dto.consent,
        status: isSpam ? 'SPAM' : 'NEW',
        statusNote: isSpam ? `spam_signals:${spamSignals.join(',')}` : undefined,
        spamScore: isSpam ? 90 : 0,
        spamSignals: isSpam
          ? ({ signals: spamSignals } as Prisma.InputJsonValue)
          : undefined,
        sourceIpHash: source.ipHash,
        userAgentHash: source.userAgentHash,
        preferredContactMethod,
        visitorId: assignment.visitorId,
        visitorSessionId: assignment.visitorSessionId,
        assignmentType: assignment.assignmentType,
        assignmentReason: assignment.assignmentReason,
        assignedOrganizationId: assignment.assignedOrganizationId,
        assignedBrokerUserId: assignment.assignedBrokerUserId,
        firstTouchAttribution: assignment.firstTouchAttribution,
        lastTouchAttribution: assignment.lastTouchAttribution,
      },
    });

    if (assignment.visitorId && assignment.visitorSessionId) {
      await this.prisma.publicVisitorEvent.create({
        data: {
          visitorId: assignment.visitorId,
          sessionId: assignment.visitorSessionId,
          eventType: 'LEAD_SUBMITTED',
          projectId,
          path: this.optionalString(dto.sourcePage)?.slice(0, 500) ?? '/',
          metadata: {
            assignmentType: assignment.assignmentType,
            assignmentReason: assignment.assignmentReason,
          },
        },
      });
    }

    const contact =
      preferredContactMethod === PreferredContactMethod.WHATSAPP
        ? await this.whatsappContact(organizationId)
        : undefined;
    const conversation =
      !isSpam && preferredContactMethod === PreferredContactMethod.CHAT
        ? await this.createPublicChatConversation(lead.id)
        : undefined;

    return {
      body: {
      success: true,
      ok: true,
      id: lead.id,
      leadId: lead.id,
      status: conversation ? 'CONVERTED' : lead.status,
      preferredContactMethod,
      contact,
      conversation,
      shareToken: conversation?.shareToken,
      conversationUrl: conversation?.shareUrl,
      message: conversation
        ? 'Your chat request was created.'
        : isSpam
          ? 'Lead received for review.'
          : 'Lead received.',
      },
      rateLimit,
    };
  }

  private async createPublicChatConversation(
    publicLeadId: string,
    ensureChatPreference = false,
  ) {
    if (ensureChatPreference) {
      await this.prisma.publicLead.update({
        where: { id: publicLeadId },
        data: { preferredContactMethod: PreferredContactMethod.CHAT },
      });
    }

    const conversion = await this.crmConversion.convertPublicLead(publicLeadId);
    return conversion.conversation;
  }

  private async findDuplicateLead(params: {
    organizationId?: string;
    projectId?: string;
    phoneHash: string;
    idempotencyKey?: string;
  }) {
    const { organizationId, projectId, phoneHash, idempotencyKey } = params;

    if (idempotencyKey) {
      const lead = await this.prisma.publicLead.findFirst({
      where: {
        organizationId,
        projectId,
        idempotencyKey,
      },
        orderBy: { createdAt: 'desc' },
      });

      if (lead) {
        await this.markDuplicateReason(lead.id, 'duplicate_idempotency_key');
        return lead;
      }
    }

    const recentWindow = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const lead = await this.prisma.publicLead.findFirst({
      where: {
        organizationId,
        projectId,
        phoneHash,
        createdAt: { gte: recentWindow },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (lead) {
      await this.markDuplicateReason(lead.id, 'duplicate_recent_phone');
    }

    return lead;
  }

  private async markDuplicateReason(id: string, reason: string) {
    await this.prisma.publicLead.update({
      where: { id },
      data: {
        statusNote: reason,
        spamSignals: {
          duplicateReason: reason,
        } as Prisma.InputJsonValue,
      },
    });
  }

  private publicProjectWhere(
    filters: PublicProjectFiltersDto,
  ): Prisma.ProjectWhereInput {
    const where: Prisma.ProjectWhereInput = {
      status: ProjectStatus.ACTIVE,
      visibility: ProjectVisibility.OPEN_MARKETPLACE,
      developer: {
        type: 'DEVELOPER',
        status: OrganizationStatus.APPROVED,
      },
    };

    if (filters.organizationSlug) {
      where.developer = {
        type: 'DEVELOPER',
        status: OrganizationStatus.APPROVED,
        slug: this.requiredSlug(filters.organizationSlug, 'organizationSlug'),
      };
    }

    if (filters.city) {
      where.city = filters.city.trim();
    }

    if (filters.district) {
      where.district = filters.district.trim();
    }

    const unitWhere: Prisma.InventoryUnitWhereInput = {
      status: UnitStatus.AVAILABLE,
      OR: [
        { visibility: UnitVisibility.INHERIT_PROJECT },
        { visibility: UnitVisibility.OPEN_MARKETPLACE },
      ],
    };

    if (filters.unitType) {
      if (!Object.values(UnitType).includes(filters.unitType as UnitType)) {
        throw new BadRequestException('unitType is not supported.');
      }
      unitWhere.unitType = filters.unitType as UnitType;
    }

    const minPrice = this.optionalDecimal(filters.minPrice, 'minPrice');
    const maxPrice = this.optionalDecimal(filters.maxPrice, 'maxPrice');
    if (minPrice || maxPrice) {
      unitWhere.basePrice = {
        ...(minPrice ? { gte: minPrice } : {}),
        ...(maxPrice ? { lte: maxPrice } : {}),
      };
    }

    if (
      filters.unitType ||
      filters.minPrice !== undefined ||
      filters.maxPrice !== undefined
    ) {
      where.inventoryUnits = { some: unitWhere };
    }

    return where;
  }

  private async findPublicOrganizationBySlug(slug: string) {
    const organization = await this.prisma.organization.findFirst({
      where: {
        slug: this.requiredSlug(slug, 'organizationSlug'),
        status: OrganizationStatus.APPROVED,
        websiteSettings: { isPublished: true },
      },
      select: { id: true },
    });

    if (!organization) {
      throw new BadRequestException('organizationSlug is not public.');
    }

    return organization;
  }

  private async findPublicOrganizationById(id: string) {
    const organization = await this.prisma.organization.findFirst({
      where: {
        id,
        status: OrganizationStatus.APPROVED,
        websiteSettings: { isPublished: true },
      },
      select: { id: true },
    });

    if (!organization) {
      throw new BadRequestException('projectSlug is not public.');
    }

    return organization;
  }

  private async findPublicProjectBySlug(
    slug: string,
    organizationSlug?: string,
  ) {
    const project = await this.prisma.project.findFirst({
      where: {
        slug: this.requiredSlug(slug, 'projectSlug'),
        status: ProjectStatus.ACTIVE,
        visibility: ProjectVisibility.OPEN_MARKETPLACE,
        developer: {
          type: 'DEVELOPER',
          status: OrganizationStatus.APPROVED,
          slug: organizationSlug
            ? this.requiredSlug(organizationSlug, 'organizationSlug')
            : undefined,
          websiteSettings: { isPublished: true },
        },
      },
      select: { id: true, developerId: true, sellingMode: true },
    });

    if (!project) {
      throw new BadRequestException('projectSlug is not public.');
    }

    return project;
  }

  private projectInclude() {
    return {
      developer: {
        include: {
          profile: true,
          websiteSettings: true,
        },
      },
      inventoryUnits: {
        where: this.publicUnitWhere(),
      },
      paymentPlans: {
        where: { isActive: true, unitId: null },
      },
    };
  }

  private projectDetailInclude() {
    return {
      developer: {
        include: {
          profile: true,
          websiteSettings: true,
        },
      },
      phases: {
        where: { status: ProjectStatus.ACTIVE },
        orderBy: { createdAt: 'asc' as const },
      },
      inventoryUnits: {
        where: this.publicUnitWhere(),
        include: {
          paymentPlans: { where: { isActive: true } },
        },
        orderBy: { createdAt: 'asc' as const },
      },
      paymentPlans: {
        where: { isActive: true, unitId: null },
      },
    };
  }

  private publicUnitWhere(): Prisma.InventoryUnitWhereInput {
    return {
      status: UnitStatus.AVAILABLE,
      OR: [
        { visibility: UnitVisibility.INHERIT_PROJECT },
        { visibility: UnitVisibility.OPEN_MARKETPLACE },
      ],
    };
  }

  private toPublicOrganization(organization: OrganizationWithPublicProfile) {
    const profile = organization.profile;

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      type: organization.type,
      status: organization.status,
      profile: {
        summary: profile?.description ?? null,
        logoUrl: profile?.logoUrl ?? null,
        website: profile?.website ?? null,
        city: organization.city ?? null,
        country: organization.country ?? null,
      },
      websiteSettings: this.toWebsiteSettings(organization.websiteSettings),
      verification: {
        badge: organization.status === OrganizationStatus.APPROVED,
        status:
          organization.status === OrganizationStatus.APPROVED
            ? 'APPROVED'
            : null,
      },
      contact: {
        phone:
          organization.websiteSettings?.contactPhone ?? profile?.phone ?? null,
        email:
          organization.websiteSettings?.contactEmail ?? profile?.email ?? null,
        whatsappUrl: organization.websiteSettings?.whatsappUrl ?? null,
      },
    };
  }

  private toWebsiteSettings(settings: any) {
    if (!settings) {
      return null;
    }

    return {
      publicSlug: settings.publicSlug,
      subdomain: settings.subdomain,
      customDomain: settings.customDomain,
      siteTitle: settings.siteTitle,
      siteDescription: settings.siteDescription,
      logoUrl: settings.logoUrl,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      contactPhone: settings.contactPhone,
      contactEmail: settings.contactEmail,
      whatsappUrl: settings.whatsappUrl,
      isPublished: settings.isPublished,
    };
  }

  private toProjectSummary(project: any) {
    const prices = project.inventoryUnits
      .map((unit: any) => this.numberOrNull(unit.basePrice))
      .filter((value: number | null): value is number => value !== null);

    return {
      id: project.id,
      name: project.name,
      slug: project.slug,
      type: project.type,
      city: project.city,
      district: project.district,
      address: project.address,
      deliveryDate: project.deliveryDate,
      description: project.description,
      coverImageUrl: project.coverImageUrl,
      images: project.images,
      amenities: project.amenities,
      isFeatured: project.isFeatured,
      availableUnitsCount: project.inventoryUnits.length,
      startingPrice: prices.length ? Math.min(...prices) : null,
      currency: project.inventoryUnits[0]?.currency ?? null,
      developer: this.toDeveloperSummary(project.developer),
      paymentPlans: project.paymentPlans.map((plan: PaymentPlan) =>
        this.toPaymentPlan(plan),
      ),
    };
  }

  private toProjectDetail(project: any) {
    return {
      ...this.toProjectSummary(project),
      latitude: this.numberOrNull(project.latitude),
      longitude: this.numberOrNull(project.longitude),
      videos: project.videos,
      brochureUrl: project.brochureUrl,
      phases: project.phases.map((phase: any) => ({
        id: phase.id,
        name: phase.name,
        deliveryDate: phase.deliveryDate,
        totalUnits: phase.totalUnits,
        availableUnits: phase.availableUnits,
        status: phase.status,
      })),
      units: project.inventoryUnits.map((unit: any) => ({
        id: unit.id,
        unitType: unit.unitType,
        areaSqm: this.numberOrNull(unit.areaSqm),
        bedrooms: unit.bedrooms,
        bathrooms: unit.bathrooms,
        finishing: unit.finishing,
        view: unit.view,
        basePrice: this.numberOrNull(unit.basePrice),
        currency: unit.currency,
        pricePerSqm: this.numberOrNull(unit.pricePerSqm),
        images: unit.images,
        floorPlanUrl: unit.floorPlanUrl,
        paymentPlans: unit.paymentPlans.map((plan: PaymentPlan) =>
          this.toPaymentPlan(plan),
        ),
      })),
    };
  }

  private toDeveloperSummary(developer: any) {
    return {
      id: developer.id,
      name: developer.name,
      slug: developer.slug,
      type: developer.type,
      logoUrl:
        developer.websiteSettings?.logoUrl ?? developer.profile?.logoUrl ?? null,
      summary: developer.profile?.description ?? null,
      contact: {
        phone:
          developer.websiteSettings?.contactPhone ??
          developer.profile?.phone ??
          null,
        email:
          developer.websiteSettings?.contactEmail ??
          developer.profile?.email ??
          null,
        whatsappUrl: developer.websiteSettings?.whatsappUrl ?? null,
      },
    };
  }

  private toPaymentPlan(plan: PaymentPlan) {
    return {
      id: plan.id,
      scope: plan.scope,
      name: plan.name,
      downPaymentPct: this.numberOrNull(plan.downPaymentPct),
      installmentMonths: plan.installmentMonths,
      installmentPct: this.numberOrNull(plan.installmentPct),
      onDeliveryPct: this.numberOrNull(plan.onDeliveryPct),
      maintenanceFee: this.numberOrNull(plan.maintenanceFee),
      conditions: plan.conditions,
    };
  }

  private domainWhere(host: string) {
    const subdomain = this.extractSubdomain(host);

    return subdomain
      ? { OR: [{ subdomain }, { customDomain: host }] }
      : { customDomain: host };
  }

  private extractSubdomain(host: string) {
    const suffix = '.popwam.com';
    if (!host.endsWith(suffix)) {
      return null;
    }

    const subdomain = host.slice(0, -suffix.length);
    return subdomain && subdomain !== 'www' ? subdomain : null;
  }

  private localDevelopmentSlug(host: string) {
    if (host === 'localhost' || host === '127.0.0.1') {
      return null;
    }

    const localSuffixes = ['.localhost', '.local', '.test'];
    for (const suffix of localSuffixes) {
      if (host.endsWith(suffix)) {
        return host.slice(0, -suffix.length);
      }
    }

    return null;
  }

  private normalizeHost(host: string) {
    return decodeURIComponent(host ?? '')
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .replace(/:\d+$/, '');
  }

  private assertLeadDto(dto: CreatePublicLeadDto) {
    if (!dto.name?.trim()) {
      throw new BadRequestException('name is required.');
    }

    if (!dto.phone?.trim()) {
      throw new BadRequestException('phone is required.');
    }

    if (dto.email && !this.isValidEmail(dto.email)) {
      throw new BadRequestException('email is invalid.');
    }

    if (dto.consent !== true) {
      throw new BadRequestException('consent must be true.');
    }

    if (!dto.organizationSlug && !dto.projectSlug) {
      throw new BadRequestException(
        'organizationSlug or projectSlug is required.',
      );
    }

    if (dto.utm !== undefined && !this.isPlainObject(dto.utm)) {
      throw new BadRequestException('utm must be an object.');
    }

    if (
      dto.preferredContactMethod !== undefined &&
      !Object.values(PreferredContactMethod).includes(
        dto.preferredContactMethod as PreferredContactMethod,
      )
    ) {
      throw new BadRequestException('preferredContactMethod is invalid.');
    }
  }

  private parsePreferredContactMethod(value: string | undefined) {
    if (!value) {
      return PreferredContactMethod.CALL;
    }

    return value as PreferredContactMethod;
  }

  private async whatsappContact(organizationId: string | undefined) {
    if (!organizationId) {
      return {
        whatsappUrl: null,
        note: 'WhatsApp method requested. No provider was called.',
      };
    }

    const settings = await this.prisma.organizationWebsiteSettings.findUnique({
      where: { organizationId },
      select: { whatsappUrl: true },
    });

    return {
      whatsappUrl: settings?.whatsappUrl ?? null,
      note:
        'WhatsApp method requested. Link is from organization website settings only. No WhatsApp provider was called.',
    };
  }

  private async assertPublicLeadRateLimit(key: string): Promise<RateLimitHeaders> {
    const windowSeconds = this.envInt(
      'PUBLIC_LEAD_RATE_LIMIT_WINDOW_SECONDS',
      60,
    );
    const max = this.envInt('PUBLIC_LEAD_RATE_LIMIT_MAX', 100);
    const result = await this.rateLimiter.check(key, { windowSeconds, max });
    const rateLimit = {
      limit: max,
      remaining: result.remaining,
      resetAt: result.resetAt,
    };

    if (!result.allowed) {
      throw new RateLimitExceededException(
        'Too many public lead submissions. Please try again shortly.',
        rateLimit,
      );
    }

    return rateLimit;
  }

  private sourceContext(request: Request | undefined, dto: CreatePublicLeadDto) {
    const ip = this.extractIp(request);
    const userAgent = request?.headers['user-agent'];
    const userAgentValue = Array.isArray(userAgent)
      ? userAgent.join(' ')
      : userAgent;
    const ipHash = ip ? this.hashValue(`ip:${ip}`) : undefined;
    const orgContext = this.optionalString(dto.organizationSlug)?.toLowerCase() ?? 'no-org';
    const projectContext = this.optionalString(dto.projectSlug)?.toLowerCase() ?? 'no-project';

    return {
      rateLimitKey: this.hashValue(
        `public-lead-rate:${orgContext}:${projectContext}:${ipHash ?? 'anonymous'}`,
      ),
      ipHash,
      userAgentHash: userAgentValue
        ? this.hashValue(`ua:${userAgentValue.slice(0, 500)}`)
        : undefined,
    };
  }

  private extractIp(request: Request | undefined) {
    const forwarded = request?.headers['x-forwarded-for'];
    const forwardedValue = Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded;
    const firstForwarded = forwardedValue?.split(',')[0]?.trim();

    return (
      firstForwarded ||
      request?.ip ||
      request?.socket?.remoteAddress ||
      undefined
    );
  }

  private spamSignals(dto: CreatePublicLeadDto) {
    const signals: string[] = [];
    if (this.optionalString(dto.website) || this.optionalString(dto.companyWebsite)) {
      signals.push('honeypot_filled');
    }

    return signals;
  }

  private envInt(name: string, fallback: number) {
    const parsed = Number(process.env[name]);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
  }

  private cleanUtm(utm: Record<string, unknown> | undefined) {
    if (!utm) {
      return undefined;
    }

    return Object.fromEntries(
      Object.entries(utm)
        .filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value))
        .slice(0, 25),
    );
  }

  private optionalDecimal(value: string | undefined, field: string) {
    if (value === undefined) {
      return undefined;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new BadRequestException(`${field} must be a non-negative number.`);
    }

    return new Prisma.Decimal(parsed);
  }

  private numberOrNull(value: unknown) {
    if (value === null || value === undefined) {
      return null;
    }

    return Number(value);
  }

  private requiredSlug(value: string, field: string) {
    const slug = value?.trim().toLowerCase();
    if (!slug) {
      throw new BadRequestException(`${field} is required.`);
    }

    return slug;
  }

  private optionalString(value: string | undefined | null) {
    const trimmed = value?.trim();
    return trimmed || undefined;
  }

  private normalizePhone(value: string) {
    const trimmed = value.trim();
    const plus = trimmed.startsWith('+') ? '+' : '';
    const digits = trimmed.replace(/\D/g, '');
    return `${plus}${digits}`;
  }

  private hashPhone(value: string) {
    return this.hashValue(`public-lead:${value}`);
  }

  private hashValue(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }

  private optionalEmail(value: string | undefined) {
    const email = this.optionalString(value)?.toLowerCase();
    if (email && !this.isValidEmail(email)) {
      throw new BadRequestException('email is invalid.');
    }

    return email;
  }

  private isValidEmail(value: string | undefined) {
    return Boolean(value?.trim().match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/));
  }

  private isPlainObject(value: unknown) {
    return Boolean(
      value &&
        typeof value === 'object' &&
        !Array.isArray(value),
    );
  }
}

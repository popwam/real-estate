import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DomainVerificationStatus,
  OrganizationDocumentStatus,
  OrganizationPublicSiteMode,
  OrganizationStatus,
  Prisma,
  ProjectStatus,
  ProjectVisibility,
} from '@prisma/client';
import {
  isPlatformUser,
  requireCurrentOrganizationId,
} from '../../common/organization-scope';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../database/prisma.service';
import { DocumentExtractionService } from './document-extraction.service';
import {
  ApplyOrganizationDocumentFieldsDto,
  ReviewOrganizationDocumentDto,
  UpdateOrganizationLegalDto,
  UpdatePublicSiteDto,
  UpsertOrganizationDocumentDto,
  UpsertOrganizationOwnerDto,
} from './company-public.dto';

const EXTRACTED_PROFILE_FIELDS: Record<string, string> = {
  legalName: 'legalName',
  tradeName: 'tradeName',
  commercialRegisterNumber: 'commercialRegisterNumber',
  registrationNumber: 'registrationNumber',
  commercialRegisterIssuedAt: 'commercialRegisterIssuedAt',
  commercialRegisterExpiresAt: 'commercialRegisterExpiresAt',
  issueDate: 'commercialRegisterIssuedAt',
  expiryDate: 'commercialRegisterExpiresAt',
  taxNumber: 'taxNumber',
  vatNumber: 'vatNumber',
  registeredAddress: 'addressLine1',
  address: 'addressLine1',
};

const SENSITIVE_EXTRACTED_FIELDS = new Set([
  'commercialRegisterNumber',
  'registrationNumber',
  'taxNumber',
  'vatNumber',
]);

@Injectable()
export class CompanyPublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
    private readonly extraction: DocumentExtractionService,
  ) {}

  async getPublicSite(slug: string) {
    const normalizedSlug = this.slug(slug);
    const fallbackPath = `${this.fallbackPath()}/${normalizedSlug}`;
    const rootDomain = this.rootDomain();
    const organization = await this.prisma.organization.findFirst({
      where: {
        OR: [
          { slug: normalizedSlug },
          {
            domainVerifications: {
              some: {
                domain: fallbackPath,
                type: 'PATH_ALIAS',
                status: { in: [DomainVerificationStatus.ACTIVE, DomainVerificationStatus.VERIFIED] },
              },
            },
          },
        ],
        status: { in: [OrganizationStatus.APPROVED, OrganizationStatus.ACTIVE] },
      },
      include: {
        profile: true,
        publicSiteSettings: true,
        websiteSettings: true,
        branches: {
          where: { isActive: true },
          orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
          take: 10,
        },
        domainVerifications: {
          where: {
            OR: [
              { isDefault: true },
              { domain: fallbackPath },
              ...(rootDomain ? [{ domain: `${normalizedSlug}.${rootDomain}` }] : []),
            ],
          },
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
        },
        projects: {
          where: {
            status: ProjectStatus.ACTIVE,
            visibility: ProjectVisibility.OPEN_MARKETPLACE,
          },
          orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
          take: 6,
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            district: true,
            coverImageUrl: true,
            images: true,
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Public site not found.');
    }

    const settings =
      organization.publicSiteSettings ??
      this.defaultPublicSiteSettings(organization);
    if (settings.mode === OrganizationPublicSiteMode.DISABLED) {
      return {
        mode: OrganizationPublicSiteMode.DISABLED,
        disabled: true,
        organization: {
          name: organization.name,
          slug: organization.slug,
        },
        links: this.publicLinks(organization),
      };
    }

    if (
      settings.mode === OrganizationPublicSiteMode.REDIRECT &&
      !this.isSafeRedirectUrl(settings.redirectUrl)
    ) {
      return {
        ...this.toPublicSiteResponse(organization, settings),
        diagnostics: ['UNSAFE_REDIRECT_BLOCKED'],
      };
    }

    return this.toPublicSiteResponse(organization, settings);
  }

  async getPublicSiteSettings(
    organizationId: string,
    user: AuthenticatedRequestUser,
  ) {
    await this.assertCanManageOrganization(organizationId, user, false);
    return this.ensurePublicSiteSettings(organizationId);
  }

  async updatePublicSiteSettings(
    organizationId: string,
    dto: UpdatePublicSiteDto,
    user: AuthenticatedRequestUser,
  ) {
    await this.assertCanManageOrganization(organizationId, user, true);
    if (dto.redirectUrl !== undefined && dto.redirectUrl !== null) {
      this.assertSafeRedirect(dto.redirectUrl);
    }
    const data = this.publicSiteData(dto);
    const updated = await this.prisma.organizationPublicSiteSettings.upsert({
      where: { organizationId },
      create: {
        organizationId,
        ...data,
      } as any,
      update: data,
    });
    await this.auditLogs.record({
      action: 'organization.public_site.updated',
      entityType: 'OrganizationPublicSiteSettings',
      entityId: updated.id,
      organizationId,
      actor: user,
    });
    return updated;
  }

  async getLegal(organizationId: string, user: AuthenticatedRequestUser) {
    await this.assertCanManageOrganization(organizationId, user, false);
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: { profile: true },
    });
    if (!organization) throw new NotFoundException('Organization not found.');
    return {
      organizationId,
      legalName: organization.profile?.legalName ?? null,
      tradeName: organization.profile?.tradeName ?? null,
      displayName: organization.profile?.displayName ?? organization.name,
      registrationNumber: organization.profile?.registrationNumber ?? null,
      commercialRegisterNumber:
        organization.profile?.commercialRegisterNumber ??
        organization.profile?.commercialRegNumber ??
        null,
      commercialRegisterOffice:
        organization.profile?.commercialRegisterOffice ?? null,
      commercialRegisterIssuedAt:
        organization.profile?.commercialRegisterIssuedAt ?? null,
      commercialRegisterExpiresAt:
        organization.profile?.commercialRegisterExpiresAt ?? null,
      taxNumber: organization.profile?.taxNumber ?? null,
      vatNumber: organization.profile?.vatNumber ?? null,
      taxOffice: organization.profile?.taxOffice ?? null,
      legalForm: organization.profile?.legalForm ?? null,
      incorporationDate: organization.profile?.incorporationDate ?? null,
      countryCode: organization.profile?.countryCode ?? organization.country,
      regionCode: organization.profile?.regionCode ?? null,
      cityCode: organization.profile?.cityCode ?? null,
      cityName: organization.profile?.cityName ?? organization.city,
      addressLine1:
        organization.profile?.addressLine1 ?? organization.profile?.address,
      addressLine2: organization.profile?.addressLine2 ?? null,
      postalCode: organization.profile?.postalCode ?? null,
      preferredLanguage:
        organization.profile?.preferredLanguage ?? organization.defaultLanguage,
      defaultCurrency: organization.profile?.defaultCurrency ?? organization.currency,
      timezone: organization.timezone,
      website: organization.profile?.website ?? null,
      publicEmail: organization.profile?.publicEmail ?? organization.profile?.email,
      publicPhone: organization.profile?.publicPhone ?? organization.profile?.phone,
    };
  }

  async updateLegal(
    organizationId: string,
    dto: UpdateOrganizationLegalDto,
    user: AuthenticatedRequestUser,
  ) {
    await this.assertCanManageOrganization(organizationId, user, true);
    const data = {
      legalName: this.string(dto.legalName),
      tradeName: this.string(dto.tradeName),
      displayName: this.string(dto.displayName),
      registrationNumber: this.string(dto.registrationNumber),
      commercialRegNumber: this.string(dto.commercialRegisterNumber),
      commercialRegisterNumber: this.string(dto.commercialRegisterNumber),
      commercialRegisterOffice: this.string(dto.commercialRegisterOffice),
      commercialRegisterIssuedAt: this.date(dto.commercialRegisterIssuedAt),
      commercialRegisterExpiresAt: this.date(dto.commercialRegisterExpiresAt),
      taxNumber: this.string(dto.taxNumber),
      vatNumber: this.string(dto.vatNumber),
      taxOffice: this.string(dto.taxOffice),
      legalForm: dto.legalForm,
      incorporationDate: this.date(dto.incorporationDate),
      countryCode: this.code(dto.countryCode),
      regionCode: this.string(dto.regionCode),
      cityCode: this.string(dto.cityCode),
      cityName: this.string(dto.cityName),
      addressLine1: this.string(dto.addressLine1),
      addressLine2: this.string(dto.addressLine2),
      postalCode: this.string(dto.postalCode),
      preferredLanguage: this.lang(dto.preferredLanguage),
      defaultCurrency: this.currency(dto.defaultCurrency),
      website: this.string(dto.website),
      publicEmail: this.email(dto.publicEmail),
      publicPhone: this.string(dto.publicPhone),
      email: this.email(dto.publicEmail),
      phone: this.string(dto.publicPhone),
      address: this.string(dto.addressLine1),
    };
    const updated = await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        name: this.string(dto.displayName ?? dto.tradeName) ?? undefined,
        country: this.code(dto.countryCode),
        city: this.string(dto.cityName),
        timezone: this.string(dto.timezone),
        currency: this.currency(dto.defaultCurrency),
        defaultLanguage: this.lang(dto.preferredLanguage),
        profile: { upsert: { create: data as any, update: data as any } },
      },
      include: { profile: true },
    });
    await this.auditLogs.record({
      action: 'organization.legal.updated',
      entityType: 'OrganizationProfile',
      entityId: updated.profile?.id,
      organizationId,
      actor: user,
    });
    return this.getLegal(organizationId, user);
  }

  async listOwners(organizationId: string, user: AuthenticatedRequestUser) {
    await this.assertCanManageOrganization(organizationId, user, false);
    const owners = await this.prisma.organizationOwner.findMany({
      where: { organizationId },
      orderBy: [{ createdAt: 'asc' }],
    });
    return owners.map((owner) => this.toOwnerResponse(owner));
  }

  async createOwner(
    organizationId: string,
    dto: UpsertOrganizationOwnerDto,
    user: AuthenticatedRequestUser,
  ) {
    await this.assertCanManageOrganization(organizationId, user, true);
    const data = await this.ownerData(organizationId, dto, true);
    const owner = await this.prisma.organizationOwner.create({ data: data as any });
    await this.auditLogs.record({
      action: 'organization.owner.created',
      entityType: 'OrganizationOwner',
      entityId: owner.id,
      organizationId,
      actor: user,
    });
    return this.toOwnerResponse(owner);
  }

  async updateOwner(
    organizationId: string,
    ownerId: string,
    dto: UpsertOrganizationOwnerDto,
    user: AuthenticatedRequestUser,
  ) {
    await this.assertCanManageOrganization(organizationId, user, true);
    await this.findOwner(organizationId, ownerId);
    const data = await this.ownerData(organizationId, dto, false);
    const owner = await this.prisma.organizationOwner.update({
      where: { id: ownerId },
      data,
    });
    await this.auditLogs.record({
      action: 'organization.owner.updated',
      entityType: 'OrganizationOwner',
      entityId: owner.id,
      organizationId,
      actor: user,
    });
    return this.toOwnerResponse(owner);
  }

  async deleteOwner(
    organizationId: string,
    ownerId: string,
    user: AuthenticatedRequestUser,
  ) {
    await this.assertCanManageOrganization(organizationId, user, true);
    await this.findOwner(organizationId, ownerId);
    await this.prisma.organizationOwner.delete({ where: { id: ownerId } });
    await this.auditLogs.record({
      action: 'organization.owner.deleted',
      entityType: 'OrganizationOwner',
      entityId: ownerId,
      organizationId,
      actor: user,
    });
    return { deleted: true };
  }

  async listDocuments(organizationId: string, user: AuthenticatedRequestUser) {
    await this.assertCanManageOrganization(organizationId, user, false);
    const documents = await this.prisma.organizationDocument.findMany({
      where: { organizationId },
      orderBy: [{ createdAt: 'desc' }],
    });
    return {
      required: this.requiredDocumentsForOrganization(),
      documents: documents.map((document) => this.toDocumentResponse(document)),
    };
  }

  async createDocument(
    organizationId: string,
    dto: UpsertOrganizationDocumentDto,
    user: AuthenticatedRequestUser,
  ) {
    await this.assertCanManageOrganization(organizationId, user, true);
    const data = await this.documentData(organizationId, dto, true);
    const document = await this.prisma.organizationDocument.create({
      data: data as any,
    });
    await this.auditLogs.record({
      action: 'organization.document.created',
      entityType: 'OrganizationDocument',
      entityId: document.id,
      organizationId,
      actor: user,
    });
    return this.toDocumentResponse(document);
  }

  async updateDocument(
    organizationId: string,
    documentId: string,
    dto: UpsertOrganizationDocumentDto,
    user: AuthenticatedRequestUser,
  ) {
    await this.assertCanManageOrganization(organizationId, user, true);
    await this.findDocument(organizationId, documentId);
    const data = await this.documentData(organizationId, dto, false);
    const document = await this.prisma.organizationDocument.update({
      where: { id: documentId },
      data,
    });
    await this.auditLogs.record({
      action: 'organization.document.updated',
      entityType: 'OrganizationDocument',
      entityId: document.id,
      organizationId,
      actor: user,
    });
    return this.toDocumentResponse(document);
  }

  async extractDocument(
    organizationId: string,
    documentId: string,
    user: AuthenticatedRequestUser,
  ) {
    await this.assertCanManageOrganization(organizationId, user, true);
    await this.findDocument(organizationId, documentId);
    const document = await this.extraction.extractOrganizationDocument(
      documentId,
      user,
    );
    if (!document) throw new NotFoundException('Document not found.');
    return this.toDocumentResponse(document);
  }

  async reviewDocument(
    organizationId: string,
    documentId: string,
    dto: ReviewOrganizationDocumentDto,
    user: AuthenticatedRequestUser,
  ) {
    await this.assertCanManageOrganization(organizationId, user, true);
    await this.findDocument(organizationId, documentId);
    if (dto.status === OrganizationDocumentStatus.REJECTED && !this.string(dto.note)) {
      throw new BadRequestException('Document rejection requires a reason.');
    }
    const document = await this.prisma.organizationDocument.update({
      where: { id: documentId },
      data: {
        status: dto.status ?? OrganizationDocumentStatus.PENDING_REVIEW,
        reviewedById: user.userId,
        reviewedAt: new Date(),
      },
    });
    await this.auditLogs.record({
      action: 'organization.document.reviewed',
      entityType: 'OrganizationDocument',
      entityId: document.id,
      organizationId,
      actor: user,
      metadata: { note: this.string(dto.note), status: document.status },
    });
    return this.toDocumentResponse(document);
  }

  async reviewExtractedFields(
    organizationId: string,
    documentId: string,
    dto: ApplyOrganizationDocumentFieldsDto,
    user: AuthenticatedRequestUser,
  ) {
    await this.assertCanManageOrganization(organizationId, user, true);
    const document = await this.findDocument(organizationId, documentId);
    const fields = [...new Set((dto.fields ?? []).map((field) => String(field).trim()).filter(Boolean))];
    if (!fields.length) throw new BadRequestException('Select at least one extracted field.');
    const unsupported = fields.filter((field) => !Object.hasOwn(EXTRACTED_PROFILE_FIELDS, field));
    if (unsupported.length) throw new BadRequestException('One or more extracted fields are unsupported.');
    if (dto.action !== 'APPLY' && dto.action !== 'REJECT') {
      throw new BadRequestException('Extracted-field review action must be APPLY or REJECT.');
    }
    const action = dto.action;
    const sensitive = fields.filter((field) => SENSITIVE_EXTRACTED_FIELDS.has(field));
    if (action === 'APPLY' && sensitive.length && dto.confirmSensitive !== true) {
      throw new BadRequestException({
        code: 'SENSITIVE_EXTRACTED_FIELDS_CONFIRMATION_REQUIRED',
        message: 'Sensitive extracted fields require explicit confirmation.',
        fields: sensitive,
      });
    }

    const extracted = this.extractedFieldValues(document.extractedData, fields);
    const missing = fields.filter((field) => extracted[field] === undefined);
    if (missing.length) {
      throw new BadRequestException({
        code: 'EXTRACTED_FIELDS_MISSING',
        message: 'One or more selected fields are not present in extracted data.',
        fields: missing,
      });
    }

    let profile: unknown = null;
    if (action === 'APPLY') {
      const data: Record<string, unknown> = {};
      for (const field of fields) {
        const target = EXTRACTED_PROFILE_FIELDS[field];
        const raw = extracted[field];
        data[target] = target.endsWith('At') ? this.date(raw) : this.string(raw);
      }
      profile = await this.prisma.organizationProfile.upsert({
        where: { organizationId },
        create: { organizationId, ...data },
        update: data,
      });
    } else {
      const source = document.extractedData && typeof document.extractedData === 'object'
        ? document.extractedData as Record<string, unknown>
        : {};
      await this.prisma.organizationDocument.update({
        where: { id: document.id },
        data: {
          extractedData: {
            ...source,
            manualReview: {
              rejectedFields: fields,
              reviewedAt: new Date().toISOString(),
            },
          },
        },
      });
    }

    await this.auditLogs.record({
      action: action === 'APPLY'
        ? 'organization.document.extracted_fields_applied'
        : 'organization.document.extracted_fields_rejected',
      entityType: 'OrganizationDocument',
      entityId: document.id,
      organizationId,
      actor: user,
      metadata: { fields, documentStatusUnchanged: true },
    });
    return {
      action,
      appliedFields: action === 'APPLY' ? fields : [],
      rejectedFields: action === 'REJECT' ? fields : [],
      documentStatus: document.status,
      profile,
    };
  }

  async domainDiagnostics(
    organizationId: string,
    user: AuthenticatedRequestUser,
  ) {
    await this.assertCanManageOrganization(organizationId, user, false);
    const [organization, settings, domains] = await Promise.all([
      this.prisma.organization.findUnique({
        where: { id: organizationId },
        select: { slug: true },
      }),
      this.ensurePublicSiteSettings(organizationId),
      this.prisma.organizationDomainVerification.findMany({
        where: { organizationId },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      }),
    ]);
    if (!organization) throw new NotFoundException('Organization not found.');
    const codes = new Set<string>(['APP_ROUTE_OK', 'FALLBACK_LINK_OK']);
    if (process.env.ENABLE_WILDCARD_SUBDOMAINS !== 'true') {
      codes.add('DNS_WILDCARD_REQUIRED');
    }
    if (!domains.some((domain) => domain.type === 'CUSTOM_DOMAIN')) {
      codes.add('RAILWAY_DOMAIN_REQUIRED');
    }
    for (const domain of domains) {
      if (domain.status === DomainVerificationStatus.VERIFIED) {
        codes.add('DNS_RECORD_FOUND');
      } else if (domain.status === DomainVerificationStatus.PENDING) {
        codes.add('DNS_RECORD_MISSING');
        codes.add('SSL_PENDING');
      } else {
        codes.add('SSL_UNKNOWN');
      }
    }
    if (settings.mode === OrganizationPublicSiteMode.REDIRECT) {
      codes.add(
        this.isSafeRedirectUrl(settings.redirectUrl)
          ? 'SAFE_REDIRECT_OK'
          : 'UNSAFE_REDIRECT_BLOCKED',
      );
    }
    if (!domains.length) codes.add('DNS_CHECK_UNAVAILABLE');
    return {
      codes: Array.from(codes),
      fallbackLink: `${this.fallbackBaseUrl()}${this.fallbackPath()}/${organization.slug}`,
      instructions: {
        publicRootDomain: this.rootDomain(),
        stagingRootDomain: process.env.PUBLIC_STAGING_ROOT_DOMAIN ?? 'staging.popwam.com',
        wildcardEnabled: process.env.ENABLE_WILDCARD_SUBDOMAINS === 'true',
        railway: 'Add *.popwam.com or each custom domain to Railway and wait for SSL to become active.',
        cloudflare: 'Create matching DNS records in Cloudflare. Railway verification records must be DNS Only while verifying.',
        resourceNote: settings.mode === OrganizationPublicSiteMode.REDIRECT
          ? 'Redirect uses the least POPWAM resources.'
          : 'Portal/gallery is hosted by POPWAM.',
      },
    };
  }

  private toPublicSiteResponse(organization: any, settings: any) {
    const profile = organization.profile;
    const gallery = Array.isArray(settings.galleryImages)
      ? settings.galleryImages
      : [];
    const includeProjects =
      settings.mode === OrganizationPublicSiteMode.PORTAL &&
      settings.showProjects;
    return {
      mode: settings.mode,
      theme: settings.theme,
      defaultLanguage: settings.defaultLanguage,
      supportedLanguages: settings.supportedLanguages,
      redirectUrl:
        settings.mode === OrganizationPublicSiteMode.REDIRECT &&
        this.isSafeRedirectUrl(settings.redirectUrl)
          ? settings.redirectUrl
          : null,
      seoTitle: settings.seoTitle,
      seoDescription: settings.seoDescription,
      headline: settings.publicHeadline,
      description: settings.publicDescription,
      organization: {
        id: organization.id,
        name: profile?.displayName ?? profile?.tradeName ?? organization.name,
        slug: organization.slug,
        type: organization.type,
        logoUrl: settings.showLogo
          ? profile?.logoUrl ?? organization.websiteSettings?.logoUrl ?? null
          : null,
        summary: profile?.description ?? null,
        website: profile?.website ?? null,
        city: profile?.cityName ?? organization.city ?? null,
        country: profile?.countryCode ?? organization.country ?? null,
      },
      contact: settings.showContactInfo
        ? {
            email: profile?.publicEmail ?? organization.websiteSettings?.contactEmail ?? null,
            phone: profile?.publicPhone ?? organization.websiteSettings?.contactPhone ?? null,
            website: profile?.website ?? null,
          }
        : null,
      offices:
        settings.mode === OrganizationPublicSiteMode.PORTAL && settings.showOffices
          ? organization.branches.map((office: any) => ({
              id: office.id,
              name: office.name,
              type: office.type,
              address: office.address,
              city: office.city,
              country: office.country,
              isDefault: office.isDefault,
            }))
          : [],
      gallery:
        (settings.mode === OrganizationPublicSiteMode.GALLERY ||
          settings.showGallery)
          ? gallery.slice(0, 30)
          : [],
      projects: includeProjects
        ? organization.projects.map((project: any) => ({
            id: project.id,
            name: project.name,
            slug: project.slug,
            city: project.city,
            district: project.district,
            coverImageUrl: project.coverImageUrl,
            images: project.images?.slice?.(0, 4) ?? [],
          }))
        : [],
      leadFormEnabled:
        settings.mode === OrganizationPublicSiteMode.PORTAL &&
        settings.showLeadForm,
      links: this.publicLinks(organization),
      cache: {
        maxAgeSeconds: settings.mode === OrganizationPublicSiteMode.REDIRECT ? 300 : 120,
      },
    };
  }

  private publicLinks(organization: { slug: string; domainVerifications?: any[] }) {
    const defaultDomain = organization.domainVerifications?.find((item) => item.isDefault);
    return {
      fallbackPath: `${this.fallbackPath()}/${organization.slug}`,
      fallbackUrl: `${this.fallbackBaseUrl()}${this.fallbackPath()}/${organization.slug}`,
      systemSubdomain: `${organization.slug}.${this.rootDomain()}`,
      defaultDomain: defaultDomain?.domain ?? null,
    };
  }

  private async ensurePublicSiteSettings(organizationId: string) {
    const existing = await this.prisma.organizationPublicSiteSettings.findUnique({
      where: { organizationId },
    });
    if (existing) return existing;
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true, slug: true, defaultLanguage: true },
    });
    if (!organization) throw new NotFoundException('Organization not found.');
    return this.prisma.organizationPublicSiteSettings.create({
      data: {
        organizationId,
        defaultLanguage: organization.defaultLanguage ?? 'en',
        publicHeadline: {
          en: organization.name,
          ar: organization.name,
          fr: organization.name,
        } as Prisma.InputJsonValue,
      },
    });
  }

  private defaultPublicSiteSettings(organization: any) {
    return {
      mode: OrganizationPublicSiteMode.PORTAL,
      theme: 'REAL_ESTATE',
      defaultLanguage: organization.defaultLanguage ?? 'en',
      supportedLanguages: ['en', 'ar', 'fr'],
      showLogo: true,
      showContactInfo: true,
      showOffices: true,
      showGallery: true,
      showProjects: true,
      showLeadForm: true,
      redirectUrl: null,
      seoTitle: null,
      seoDescription: null,
      publicHeadline: {
        en: organization.name,
        ar: organization.name,
        fr: organization.name,
      },
      publicDescription: null,
      galleryImages: [],
    };
  }

  private publicSiteData(dto: UpdatePublicSiteDto) {
    const data: Record<string, unknown> = {};
    for (const key of [
      'mode',
      'theme',
      'defaultLanguage',
      'supportedLanguages',
      'showLogo',
      'showContactInfo',
      'showOffices',
      'showGallery',
      'showProjects',
      'showLeadForm',
    ] as const) {
      if (dto[key] !== undefined) data[key] = dto[key];
    }
    if (dto.redirectUrl !== undefined) {
      data.redirectUrl = dto.redirectUrl ? this.assertSafeRedirect(dto.redirectUrl) : null;
    }
    if (dto.seoTitle !== undefined) data.seoTitle = this.translated(dto.seoTitle);
    if (dto.seoDescription !== undefined) data.seoDescription = this.translated(dto.seoDescription);
    if (dto.publicHeadline !== undefined) data.publicHeadline = this.translated(dto.publicHeadline);
    if (dto.publicDescription !== undefined) data.publicDescription = this.translated(dto.publicDescription);
    if (dto.galleryImages !== undefined) {
      data.galleryImages = dto.galleryImages
        .filter((item) => this.string(item.url))
        .slice(0, 30)
        .map((item) => ({
          url: this.string(item.url),
          alt: this.translated(item.alt),
          caption: this.translated(item.caption),
        }));
    }
    return data;
  }

  private async ownerData(
    organizationId: string,
    dto: UpsertOrganizationOwnerDto,
    creating: boolean,
  ) {
    await Promise.all([
      this.assertFileInOrganization(dto.idFrontFileId, organizationId),
      this.assertFileInOrganization(dto.idBackFileId, organizationId),
      this.assertFileInOrganization(dto.passportFileId, organizationId),
      this.assertFileInOrganization(dto.proofFileId, organizationId),
    ]);
    return {
      organizationId,
      ownerType: dto.ownerType,
      name: creating ? this.required(dto.name, 'name') : this.string(dto.name),
      localizedName: this.translated(dto.localizedName),
      nationalityCountryCode: this.code(dto.nationalityCountryCode),
      identifierType: dto.identifierType,
      identifierValue: this.string(dto.identifierValue),
      identifierCountryCode: this.code(dto.identifierCountryCode),
      ownershipPercentage: this.percentage(dto.ownershipPercentage),
      role: dto.role,
      phone: this.string(dto.phone),
      email: this.email(dto.email),
      idFrontFileId: dto.idFrontFileId === null ? null : this.string(dto.idFrontFileId),
      idBackFileId: dto.idBackFileId === null ? null : this.string(dto.idBackFileId),
      passportFileId: dto.passportFileId === null ? null : this.string(dto.passportFileId),
      proofFileId: dto.proofFileId === null ? null : this.string(dto.proofFileId),
      verificationStatus: dto.verificationStatus,
    };
  }

  private async documentData(
    organizationId: string,
    dto: UpsertOrganizationDocumentDto,
    creating: boolean,
  ) {
    await this.assertFileInOrganization(dto.fileId, organizationId);
    return {
      organizationId,
      documentType: creating
        ? (dto.documentType ?? this.bad('documentType is required.'))
        : dto.documentType,
      fileId: dto.fileId === null ? null : this.string(dto.fileId),
      status:
        dto.status ??
        (creating && dto.fileId
          ? OrganizationDocumentStatus.UPLOADED
          : undefined),
      expiresAt: dto.expiresAt === null ? null : this.date(dto.expiresAt),
      issuedAt: dto.issuedAt === null ? null : this.date(dto.issuedAt),
      issuingAuthority:
        dto.issuingAuthority === null ? null : this.string(dto.issuingAuthority),
      extractedData:
        dto.extractedData === null ? Prisma.JsonNull : (dto.extractedData as any),
      extractionStatus: dto.extractionStatus,
      extractionProvider: dto.extractionProvider,
      extractionMessage:
        dto.extractionMessage === null ? null : this.string(dto.extractionMessage),
    };
  }

  private toOwnerResponse(owner: any) {
    return {
      id: owner.id,
      organizationId: owner.organizationId,
      ownerType: owner.ownerType,
      name: owner.name,
      localizedName: owner.localizedName,
      nationalityCountryCode: owner.nationalityCountryCode,
      identifierType: owner.identifierType,
      identifierValue: owner.identifierValue,
      identifierCountryCode: owner.identifierCountryCode,
      ownershipPercentage:
        owner.ownershipPercentage === null || owner.ownershipPercentage === undefined
          ? null
          : Number(owner.ownershipPercentage),
      role: owner.role,
      phone: owner.phone,
      email: owner.email,
      idFrontFileId: owner.idFrontFileId,
      idBackFileId: owner.idBackFileId,
      passportFileId: owner.passportFileId,
      proofFileId: owner.proofFileId,
      missingDocuments: !owner.idFrontFileId && !owner.passportFileId,
      verificationStatus: owner.verificationStatus,
      createdAt: owner.createdAt,
      updatedAt: owner.updatedAt,
    };
  }

  private toDocumentResponse(document: any) {
    return {
      id: document.id,
      organizationId: document.organizationId,
      documentType: document.documentType,
      fileId: document.fileId,
      status: document.status,
      expiresAt: document.expiresAt,
      issuedAt: document.issuedAt,
      issuingAuthority: document.issuingAuthority,
      extractedData: document.extractedData,
      extractionProvider: document.extractionProvider,
      extractionStatus: document.extractionStatus,
      extractionMessage: document.extractionMessage,
      reviewedById: document.reviewedById,
      reviewedAt: document.reviewedAt,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }

  private requiredDocumentsForOrganization() {
    return ['COMMERCIAL_REGISTER', 'TAX_CARD', 'OWNER_ID'];
  }

  private async assertCanManageOrganization(
    organizationId: string,
    user: AuthenticatedRequestUser,
    write: boolean,
  ) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true },
    });
    if (!organization) throw new NotFoundException('Organization not found.');
    if (isPlatformUser(user)) {
      const permission = write
        ? 'platform.organizations.manage'
        : 'platform.organizations.view';
      if (
        user.permissions.includes(permission) ||
        user.permissions.includes('organizations.view_all') ||
        user.permissions.includes('organizations.verify')
      ) return;
      throw new ForbiddenException(`Missing permission: ${permission}.`);
    }
    const currentOrganizationId = requireCurrentOrganizationId(user);
    if (currentOrganizationId !== organizationId) {
      throw new ForbiddenException('Cannot access another organization.');
    }
    const permissions = write
      ? ['company.settings.manage', 'company.profile.manage']
      : ['company.settings.view', 'company.profile.view', 'company.settings.manage'];
    if (permissions.some((permission) => user.permissions.includes(permission))) return;
    throw new ForbiddenException(`Missing permission: ${permissions[0]}.`);
  }

  private async assertFileInOrganization(
    fileId: string | null | undefined,
    organizationId: string,
  ) {
    const id = this.string(fileId);
    if (!id) return;
    const file = await this.prisma.uploadedFile.findUnique({ where: { id } });
    if (!file) throw new NotFoundException('File not found.');
    if (file.organizationId && file.organizationId !== organizationId) {
      throw new ForbiddenException('File belongs to another organization.');
    }
  }

  private async findOwner(organizationId: string, ownerId: string) {
    const owner = await this.prisma.organizationOwner.findFirst({
      where: { id: ownerId, organizationId },
    });
    if (!owner) throw new NotFoundException('Owner not found.');
    return owner;
  }

  private async findDocument(organizationId: string, documentId: string) {
    const document = await this.prisma.organizationDocument.findFirst({
      where: { id: documentId, organizationId },
    });
    if (!document) throw new NotFoundException('Document not found.');
    return document;
  }

  private extractedFieldValues(source: unknown, fields: string[]) {
    const values: Record<string, unknown> = {};
    for (const field of fields) {
      values[field] = this.findExtractedValue(source, field, 0);
    }
    return values;
  }

  private findExtractedValue(source: unknown, field: string, depth: number): unknown {
    if (depth > 6 || source === null || source === undefined) return undefined;
    if (typeof source === 'string') {
      const text = source.trim();
      if (!(text.startsWith('{') || text.startsWith('['))) return undefined;
      try { return this.findExtractedValue(JSON.parse(text), field, depth + 1); } catch { return undefined; }
    }
    if (Array.isArray(source)) {
      for (const value of source) {
        const found = this.findExtractedValue(value, field, depth + 1);
        if (found !== undefined) return found;
      }
      return undefined;
    }
    if (typeof source !== 'object') return undefined;
    const record = source as Record<string, unknown>;
    const directKey = Object.keys(record).find((key) => key.toLowerCase() === field.toLowerCase());
    if (directKey && ['string', 'number'].includes(typeof record[directKey])) return record[directKey];
    for (const value of Object.values(record)) {
      const found = this.findExtractedValue(value, field, depth + 1);
      if (found !== undefined) return found;
    }
    return undefined;
  }

  private slug(value: string) {
    const slug = value?.trim().toLowerCase();
    if (!slug || !slug.match(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/)) {
      throw new BadRequestException('slug is invalid.');
    }
    return slug;
  }

  private assertSafeRedirect(value: string) {
    if (!this.isSafeRedirectUrl(value)) {
      throw new BadRequestException('redirectUrl must use http or https.');
    }
    return new URL(value).toString();
  }

  private isSafeRedirectUrl(value: string | null | undefined) {
    if (!value) return false;
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private fallbackBaseUrl() {
    return (
      process.env.COMPANY_PORTAL_FALLBACK_BASE_URL?.replace(/\/$/, '') ??
      'https://popwam.com'
    );
  }

  private fallbackPath() {
    const path = process.env.COMPANY_PUBLIC_SITE_FALLBACK_PATH?.trim() || '/sites';
    return path.startsWith('/') ? path.replace(/\/$/, '') : `/${path.replace(/\/$/, '')}`;
  }

  private rootDomain() {
    return process.env.PUBLIC_ROOT_DOMAIN ?? '';
  }

  private translated(value: any) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
    return {
      en: this.string(value.en) ?? '',
      ar: this.string(value.ar) ?? '',
      fr: this.string(value.fr) ?? '',
    } as Prisma.InputJsonValue;
  }

  private string(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private required(value: unknown, field: string) {
    const result = this.string(value);
    if (!result) throw new BadRequestException(`${field} is required.`);
    return result;
  }

  private bad(message: string): never {
    throw new BadRequestException(message);
  }

  private email(value: unknown) {
    const email = this.string(value)?.toLowerCase();
    if (!email) return undefined;
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      throw new BadRequestException('email is invalid.');
    }
    return email;
  }

  private date(value: unknown) {
    const raw = this.string(value);
    if (!raw) return undefined;
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) throw new BadRequestException('date is invalid.');
    return date;
  }

  private code(value: unknown) {
    return this.string(value)?.toUpperCase();
  }

  private lang(value: unknown) {
    return this.string(value)?.toLowerCase();
  }

  private currency(value: unknown) {
    return this.string(value)?.toUpperCase();
  }

  private percentage(value: unknown) {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
      throw new BadRequestException('ownershipPercentage must be between 0 and 100.');
    }
    return new Prisma.Decimal(parsed);
  }
}

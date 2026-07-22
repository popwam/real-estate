import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  DomainVerificationStatus,
  OrganizationDocumentStatus,
  OrganizationDocumentType,
  OrganizationBillingCycle,
  OrganizationBranchType,
  OrganizationDomainType,
  OrganizationInboundSourceMode,
  OrganizationLegalForm,
  OrganizationRedirectMode,
  OrganizationStatus,
  OrganizationSubscriptionStatus,
  OrganizationType,
  OrganizationWifiRuleAppliesTo,
  Prisma,
  UserRole,
  WebWifiPolicy,
} from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { normalizeOptionalPhoneOrThrow } from '../../common/phone-normalization';
import { requireCanonicalOrganizationType } from '../../common/organization-types';
import { isPlatformUser, requireCurrentOrganizationId } from '../../common/organization-scope';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { HashService } from '../auth/hash.service';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../database/prisma.service';
import { ROLE_PERMISSIONS } from '../permissions/rbac.seed';
import {
  AttendanceLocationInputDto,
  ActivationReviewDto,
  CompanyRoleTemplateInputDto,
  CreateRequiredDocumentPolicyDto,
  CreatePlatformCompanyDto,
  DomainInputDto,
  FirstAdminInputDto,
  LimitsInputDto,
  OfficeInputDto,
  OrganizationProfileInputDto,
  PlatformPlanInputDto,
  PlatformNavigationInputDto,
  PlatformMetadataInputDto,
  RequiredDocumentPolicyInputDto,
  SubscriptionInputDto,
  UpdateRequiredDocumentPolicyDto,
  WifiRuleInputDto,
} from './dto/company-provisioning.dto';

const DEFAULT_NAVIGATION_SECTIONS = [
  ['platform', { en: 'Platform', ar: 'المنصة', fr: 'Plateforme' }],
  ['organizations', { en: 'Organizations', ar: 'المؤسسات', fr: 'Organisations' }],
  ['real-estate', { en: 'Real Estate', ar: 'العقارات', fr: 'Immobilier' }],
  ['human-resources', { en: 'Human Resources', ar: 'الموارد البشرية', fr: 'Ressources humaines' }],
  ['crm', { en: 'CRM', ar: 'إدارة العملاء', fr: 'CRM' }],
  ['finance', { en: 'Finance', ar: 'المالية', fr: 'Finance' }],
  ['legal', { en: 'Legal', ar: 'الشؤون القانونية', fr: 'Juridique' }],
  ['cameras', { en: 'Cameras', ar: 'الكاميرات', fr: 'Caméras' }],
  ['advertising', { en: 'Advertising', ar: 'الإعلانات', fr: 'Publicité' }],
  ['documents', { en: 'Documents', ar: 'المستندات', fr: 'Documents' }],
  ['reports', { en: 'Reports', ar: 'التقارير', fr: 'Rapports' }],
  ['my-workspace', { en: 'My Workspace', ar: 'مساحة عملي', fr: 'Mon espace' }],
  ['settings', { en: 'Settings', ar: 'الإعدادات', fr: 'Paramètres' }],
] as const;

const SUPPORTED_LOGIN_METHODS = new Set([
  'EMAIL_PASSWORD',
  'PHONE_PASSWORD',
]);

type Tx = Prisma.TransactionClient;
type RoleProvisioningClient = Pick<Tx, 'permission' | 'role' | 'rolePermission'>;
type PreparedFirstAdmin = {
  email: string;
  phone?: string;
  firstName: string;
  lastName?: string;
  name: string;
  passwordHash: string;
  roleName: string;
  userRole: UserRole;
};
type RequiredPolicyWithSupportedType = Prisma.RequiredDocumentPolicyGetPayload<{
  include: { supportedOrganizationType: true };
}>;

type OrganizationListRequestContext = {
  requestId?: string;
  route?: string;
};

type FirstAdminRequestContext = {
  requestId?: string;
  onTiming?: (
    stage: 'validation' | 'hash' | 'roleProvisioning' | 'dbTransaction' | 'audit',
    durationMs: number,
  ) => void;
};

const PLATFORM_PERMISSIONS = [
  'platform.organizations.manage',
  'organizations.verify',
  'organizations.view_all',
];

const COMPANY_ADMIN_ROLES = new Set([
  'company_owner',
  'company_admin',
  'developer_owner',
  'developer_admin',
  'brokerage_owner',
  'brokerage_admin',
  'individual_broker',
]);

@Injectable()
export class CompanyProvisioningService {
  private readonly logger = new Logger(CompanyProvisioningService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
    private readonly hashService: HashService,
  ) {}

  async listPlatformOrganizations(
    user: AuthenticatedRequestUser,
    rawQuery: Record<string, unknown> = {},
    context: OrganizationListRequestContext = {},
  ) {
    this.assertPlatform(user, 'platform.organizations.view');
    const query = this.organizationListQuery(rawQuery);
    try {
      const organizations = await this.prisma.organization.findMany({
        where: query.where,
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          status: true,
          country: true,
          city: true,
          plan: true,
          planExpiresAt: true,
          createdAt: true,
          updatedAt: true,
          subscription: { select: { status: true, planName: true } },
          verifications: {
            select: { status: true },
            orderBy: { updatedAt: 'desc' },
            take: 1,
          },
          _count: { select: { users: true, hrEmployees: true, branches: true } },
        },
        orderBy: { [query.sort]: query.order },
        skip: query.offset,
        take: query.limit,
      });
      return organizations.map((organization) => ({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        organizationType: organization.type,
        type: organization.type,
        status: organization.status,
        verificationStatus: organization.verifications[0]?.status ?? null,
        subscriptionStatus: organization.subscription?.status ?? null,
        planName: organization.subscription?.planName ?? organization.plan ?? null,
        plan: organization.plan ?? null,
        planExpiresAt: organization.planExpiresAt,
        country: organization.country,
        city: organization.city,
        usersCount: organization._count.users,
        employeesCount: organization._count.hrEmployees,
        officesCount: organization._count.branches,
        createdAt: organization.createdAt,
        updatedAt: organization.updatedAt,
      }));
    } catch (error) {
      this.logger.error({
        event: 'platform_organizations_list_failed',
        requestId: context.requestId ?? null,
        route: context.route ?? '/platform/organizations',
        userId: user.userId,
        organizationId: user.organizationId,
        query: query.safeParams,
        errorName: this.safeErrorName(error),
        errorMessage: this.safeErrorMessage(error),
        prismaCode: this.prismaErrorCode(error) ?? null,
      });
      throw new InternalServerErrorException('Internal server error');
    }
  }

  async createPlatformOrganization(
    dto: CreatePlatformCompanyDto,
    user: AuthenticatedRequestUser,
  ) {
    this.assertPlatform(user, 'platform.organizations.manage');
    if ([dto.offices, dto.attendanceLocations, dto.wifiRules, dto.domains].some((items) => items?.length)) {
      throw new BadRequestException({ code: 'COMPANY_SETUP_REQUIRED', message: 'Offices, attendance, Wi-Fi, and domains are configured after organization activation.' });
    }
    const profile = dto.profile ?? dto;
    const type = this.enumValue(
      OrganizationType,
      profile.organizationType ?? profile.type ?? dto.organizationType ?? dto.type,
      'organizationType',
    );
    if (type === OrganizationType.PLATFORM) {
      const platformExists = await this.prisma.organization.count({ where: { type: OrganizationType.PLATFORM } });
      if (platformExists) throw new ConflictException('A platform organization already exists.');
    }
    const name = this.requiredString(
      profile.displayName ?? profile.tradeName ?? profile.name ?? dto.name,
      'displayName',
    );
    const slug = await this.uniqueSlug(this.string(profile.slug) ?? name);
    const companyCode = await this.companyCode(profile.companyCode, slug);
    const requestedStatus = this.organizationStatus(profile.status);
    const status =
      requestedStatus === OrganizationStatus.ACTIVE ||
      requestedStatus === OrganizationStatus.APPROVED
        ? OrganizationStatus.DOCUMENTS_REQUIRED
        : requestedStatus;
    const defaultDomain = this.systemDomain(slug);
    const subscription = dto.subscription?.planCode
      ? await this.prepareSubscription(dto.subscription)
      : undefined;
    const activeLanguageCodes = (await this.prisma.platformMetadataRecord.findMany({ where: { category: 'LANGUAGE', isActive: true, isArchived: false }, orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }], select: { code: true } })).map((item) => item.code.toLowerCase());
    const supportedLanguages = activeLanguageCodes.length ? activeLanguageCodes : ['en', 'ar', 'fr'];
    const preparedAdmin = dto.adminUser
      ? await this.prepareFirstAdmin(type, dto.adminUser)
      : null;

    const result = await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name,
          slug,
          companyCode,
          type,
          country: this.string(profile.countryCode ?? profile.country),
          city: this.string(profile.cityName ?? profile.city),
          timezone: this.string(profile.timezone),
          currency: this.string(profile.defaultCurrency ?? profile.currency),
          defaultLanguage: this.string(profile.preferredLanguage ?? profile.defaultLanguage),
          status,
          plan: subscription?.planCode,
          planExpiresAt: subscription?.endsAt,
          profile: {
            create: {
              legalName: this.string(profile.legalName),
              tradeName: this.string(profile.tradeName ?? profile.displayName),
              displayName: this.string(profile.displayName ?? profile.tradeName ?? name),
              responsibleSubmitterName: this.string(profile.responsibleSubmitterName),
              responsibleSubmitterEmail: this.optionalEmail(profile.responsibleSubmitterEmail),
              responsibleSubmitterPhone: normalizeOptionalPhoneOrThrow(profile.responsibleSubmitterPhone, 'responsible submitter phone'),
              commercialRegNumber: this.string(profile.commercialRegisterNumber ?? profile.registrationNumber),
              commercialRegisterNumber: this.string(profile.commercialRegisterNumber ?? profile.registrationNumber),
              commercialRegisterOffice: this.string(profile.commercialRegisterOffice),
              commercialRegisterIssuedAt: this.date(profile.commercialRegisterIssuedAt),
              commercialRegisterExpiresAt: this.date(profile.commercialRegisterExpiresAt),
              registrationNumber: this.string(profile.registrationNumber),
              taxNumber: this.string(profile.taxNumber),
              vatNumber: this.string(profile.vatNumber),
              taxOffice: this.string(profile.taxOffice),
              legalForm: profile.legalForm ? this.enumValue(OrganizationLegalForm, profile.legalForm, 'legalForm') : undefined,
              incorporationDate: this.date(profile.incorporationDate),
              countryCode: this.string(profile.countryCode ?? profile.country),
              regionCode: this.string(profile.regionCode),
              cityCode: this.string(profile.cityCode),
              cityName: this.string(profile.cityName ?? profile.city),
              addressLine1: this.string(profile.addressLine1 ?? profile.address),
              addressLine2: this.string(profile.addressLine2),
              postalCode: this.string(profile.postalCode),
              preferredLanguage: this.string(profile.preferredLanguage ?? profile.defaultLanguage),
              defaultCurrency: this.string(profile.defaultCurrency ?? profile.currency),
              website: this.string(profile.website),
              phone: this.string(profile.businessPhone),
              email: this.optionalEmail(profile.businessEmail),
              publicEmail: this.optionalEmail(profile.publicEmail ?? profile.businessEmail),
              publicPhone: this.string(profile.publicPhone ?? profile.businessPhone),
              address: this.string(profile.address),
              logoUrl: this.string(profile.logoUrl),
            },
          },
          subscription: subscription ? { create: subscription } : undefined,
          limits: dto.limits ? { create: this.limitsCreate(dto.limits) } : undefined,
          attendanceSettings: {
            create: {
              allowWebCheckIn: dto.limits?.allowWebCheckIn ?? true,
              allowMobileCheckIn: dto.limits?.allowMobileCheckIn ?? true,
              requireDvrReview: dto.limits?.allowDvrReview ?? false,
              webWifiPolicy: dto.webWifiPolicy ?? WebWifiPolicy.MANUAL_REVIEW,
            },
          },
          websiteSettings: {
            create: {
              publicSlug: slug,
              subdomain: slug,
              siteTitle: name,
              siteDescription: this.string(profile.tradeName ?? profile.legalName),
              logoUrl: this.string(profile.logoUrl),
              contactPhone: this.string(profile.businessPhone),
              contactEmail: this.optionalEmail(profile.businessEmail),
              isPublished: false,
            },
          },
          publicSiteSettings: {
            create: {
              mode: 'DISABLED',
              theme: 'REAL_ESTATE',
              defaultLanguage: this.string(profile.defaultLanguage) ?? 'en',
              supportedLanguages,
              publicHeadline: {
                en: name,
                ar: name,
                fr: name,
              },
              publicDescription: this.string(profile.tradeName ?? profile.legalName)
                ? {
                    en: this.string(profile.tradeName ?? profile.legalName),
                    ar: this.string(profile.tradeName ?? profile.legalName),
                    fr: this.string(profile.tradeName ?? profile.legalName),
                  }
                : undefined,
            },
          },
          domainVerifications: defaultDomain
            ? {
                create: {
                  domain: defaultDomain,
                  type: OrganizationDomainType.SYSTEM_SUBDOMAIN,
                  status: DomainVerificationStatus.PENDING,
                  verificationToken: this.verificationToken(),
                  isDefault: true,
                  statusNote: 'wildcard_subdomain_pending_dns_and_hosting_verification',
                  redirectMode: OrganizationRedirectMode.PROXY_OR_SHOW_COMPANY_PROFILE,
                },
              }
            : undefined,
        },
      });

      const adminUser = preparedAdmin
        ? await this.createFirstAdmin(tx, organization.id, preparedAdmin)
        : null;

      return { organizationId: organization.id, adminUserId: adminUser?.id ?? null };
    });

    const organization = await this.findOrganizationForPlatform(result.organizationId);
    await this.auditLogs.record({
      action: 'platform.organization.provisioned',
      entityType: 'Organization',
      entityId: organization.id,
      organizationId: organization.id,
      actor: user,
      metadata: { slug: organization.slug, companyCode: organization.companyCode },
    });
    return this.withPortalLinks(organization);
  }

  async getPlatformOrganization(id: string, user: AuthenticatedRequestUser) {
    this.assertPlatform(user, 'platform.organizations.view');
    return this.withPortalLinks(await this.findOrganizationForPlatform(id));
  }

  async updatePlatformOrganization(
    id: string,
    dto: OrganizationProfileInputDto,
    user: AuthenticatedRequestUser,
  ) {
    this.assertPlatform(user, 'platform.organizations.manage');
    const existing = await this.findOrganization(id);
    const slug = this.string(dto.slug);
    if (slug && slug !== existing.slug) await this.assertSlugAvailable(slug, id);
    const companyCode = this.string(dto.companyCode);
    if (companyCode && companyCode !== existing.companyCode) {
      await this.assertCompanyCodeAvailable(companyCode, id);
    }

    const updated = await this.prisma.organization.update({
      where: { id },
      data: {
        name: this.string(dto.displayName ?? dto.name ?? dto.tradeName) ?? undefined,
        slug,
        companyCode,
        type: dto.organizationType
          ? this.enumValue(OrganizationType, dto.organizationType, 'organizationType')
          : undefined,
        country: this.string(dto.countryCode ?? dto.country),
        city: this.string(dto.cityName ?? dto.city),
        timezone: this.string(dto.timezone),
        currency: this.string(dto.defaultCurrency ?? dto.currency),
        defaultLanguage: this.string(dto.preferredLanguage ?? dto.defaultLanguage),
        status: dto.status ? this.organizationStatus(dto.status) : undefined,
        profile: { upsert: this.profileUpsert(dto) },
      },
      include: this.organizationInclude(),
    });
    await this.record(user, 'platform.organization.updated', 'Organization', id);
    return this.withPortalLinks(updated);
  }

  async getSubscription(id: string, user: AuthenticatedRequestUser) {
    await this.assertPlatformCanReadOrganization(id, user);
    return this.prisma.organizationSubscription.findUnique({ where: { organizationId: id } });
  }

  async updateSubscription(
    id: string,
    dto: SubscriptionInputDto,
    user: AuthenticatedRequestUser,
  ) {
    this.assertPlatform(user, 'platform.subscriptions.manage');
    await this.findOrganization(id);
    const subscription = await this.prepareSubscription(dto);
    const updated = await this.prisma.organizationSubscription.upsert({
      where: { organizationId: id },
      create: { organizationId: id, ...subscription },
      update: subscription,
    });
    await this.prisma.organization.update({
      where: { id },
      data: { plan: updated.planCode, planExpiresAt: updated.endsAt },
    });
    await this.auditLogs.record({
      action: 'platform.organization.subscription_updated',
      entityType: 'OrganizationSubscription',
      entityId: updated.id,
      organizationId: id,
      actor: user,
      metadata: { endDateOverridden: subscription.endDateOverridden, overrideReason: subscription.endDateOverrideReason },
    });
    return updated;
  }

  async getLimits(id: string, user: AuthenticatedRequestUser) {
    await this.assertPlatformCanReadOrganization(id, user);
    return this.prisma.organizationLimits.findUnique({ where: { organizationId: id } });
  }

  async updateLimits(id: string, dto: LimitsInputDto, user: AuthenticatedRequestUser) {
    this.assertPlatform(user, 'platform.organizations.manage');
    await this.assertLimitsCanShrink(id, dto);
    const updated = await this.prisma.organizationLimits.upsert({
      where: { organizationId: id },
      create: { organizationId: id, ...this.limitsCreate(dto) },
      update: this.limitsUpdate(dto) as any,
    });
    await this.record(user, 'platform.organization.limits_updated', 'OrganizationLimits', updated.id, id);
    return updated;
  }

  async listOffices(organizationId: string, user: AuthenticatedRequestUser) {
    this.assertCanManageCompanyResource(organizationId, user, [
      'company.offices.view',
      'company.offices.manage',
      'platform.organizations.view',
    ]);
    return this.prisma.organizationBranch.findMany({
      where: { organizationId },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  async createOffice(
    organizationId: string,
    dto: OfficeInputDto,
    user: AuthenticatedRequestUser,
  ) {
    this.assertCanManageCompanyResource(organizationId, user, [
      'company.offices.manage',
      'platform.organizations.manage',
    ]);
    await this.assertOfficeLimit(organizationId);
    await this.assertOfficeParent(organizationId, dto);
    const data = this.officeData(organizationId, dto, true);
    const created = await this.prisma.$transaction(async (tx) => {
      if (data.isDefault) await this.clearDefaultOffice(tx, organizationId);
      return tx.organizationBranch.create({ data: data as any });
    });
    await this.record(user, 'organization.office.created', 'OrganizationBranch', created.id, organizationId);
    return created;
  }

  async updateOffice(
    organizationId: string,
    officeId: string,
    dto: OfficeInputDto,
    user: AuthenticatedRequestUser,
  ) {
    this.assertCanManageCompanyResource(organizationId, user, [
      'company.offices.manage',
      'platform.organizations.manage',
    ]);
    await this.findOffice(organizationId, officeId);
    await this.assertOfficeParent(organizationId, dto, officeId);
    const data = this.officeData(organizationId, dto, false);
    const updated = await this.prisma.$transaction(async (tx) => {
      if (data.isDefault) await this.clearDefaultOffice(tx, organizationId);
      return tx.organizationBranch.update({ where: { id: officeId }, data });
    });
    await this.record(user, 'organization.office.updated', 'OrganizationBranch', updated.id, organizationId);
    return updated;
  }

  async listAttendanceLocations(organizationId: string, user: AuthenticatedRequestUser) {
    this.assertCanManageCompanyResource(organizationId, user, [
      'company.attendance_settings.view',
      'company.attendance_settings.manage',
      'platform.organizations.view',
    ]);
    return this.prisma.organizationAttendanceLocation.findMany({
      where: { organizationId },
      include: { office: true },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
  }

  async createAttendanceLocation(
    organizationId: string,
    dto: AttendanceLocationInputDto,
    user: AuthenticatedRequestUser,
  ) {
    this.assertCanManageCompanyResource(organizationId, user, [
      'company.attendance_settings.manage',
      'platform.organizations.manage',
    ]);
    const created = await this.prisma.organizationAttendanceLocation.create({
      data: (await this.attendanceLocationData(organizationId, dto, true)) as any,
    });
    await this.record(user, 'organization.attendance_location.created', 'OrganizationAttendanceLocation', created.id, organizationId);
    return created;
  }

  async updateAttendanceLocation(
    organizationId: string,
    locationId: string,
    dto: AttendanceLocationInputDto,
    user: AuthenticatedRequestUser,
  ) {
    this.assertCanManageCompanyResource(organizationId, user, [
      'company.attendance_settings.manage',
      'platform.organizations.manage',
    ]);
    await this.findAttendanceLocation(organizationId, locationId);
    const updated = await this.prisma.organizationAttendanceLocation.update({
      where: { id: locationId },
      data: await this.attendanceLocationData(organizationId, dto, false),
    });
    await this.record(user, 'organization.attendance_location.updated', 'OrganizationAttendanceLocation', updated.id, organizationId);
    return updated;
  }

  async listWifiRules(organizationId: string, user: AuthenticatedRequestUser) {
    this.assertCanManageCompanyResource(organizationId, user, [
      'company.wifi_rules.view',
      'company.wifi_rules.manage',
      'platform.organizations.view',
    ]);
    return this.prisma.organizationWifiRule.findMany({
      where: { organizationId },
      include: { office: true },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
  }

  async createWifiRule(
    organizationId: string,
    dto: WifiRuleInputDto,
    user: AuthenticatedRequestUser,
  ) {
    this.assertCanManageCompanyResource(organizationId, user, [
      'company.wifi_rules.manage',
      'platform.organizations.manage',
    ]);
    const created = await this.prisma.organizationWifiRule.create({
      data: (await this.wifiRuleData(organizationId, dto, true)) as any,
    });
    await this.record(user, 'organization.wifi_rule.created', 'OrganizationWifiRule', created.id, organizationId);
    return created;
  }

  async updateWifiRule(
    organizationId: string,
    ruleId: string,
    dto: WifiRuleInputDto,
    user: AuthenticatedRequestUser,
  ) {
    this.assertCanManageCompanyResource(organizationId, user, [
      'company.wifi_rules.manage',
      'platform.organizations.manage',
    ]);
    await this.findWifiRule(organizationId, ruleId);
    const updated = await this.prisma.organizationWifiRule.update({
      where: { id: ruleId },
      data: await this.wifiRuleData(organizationId, dto, false),
    });
    await this.record(user, 'organization.wifi_rule.updated', 'OrganizationWifiRule', updated.id, organizationId);
    return updated;
  }

  async listDomains(organizationId: string, user: AuthenticatedRequestUser) {
    this.assertDomainManagementEnabled();
    this.assertCanManageCompanyResource(organizationId, user, [
      'company.domains.view',
      'company.domains.manage',
      'organization_domains.view_own',
      'platform.organizations.view',
    ]);
    return this.prisma.organizationDomainVerification.findMany({
      where: { organizationId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createDomain(
    organizationId: string,
    dto: DomainInputDto,
    user: AuthenticatedRequestUser,
  ) {
    this.assertDomainManagementEnabled();
    this.assertCanManageCompanyResource(organizationId, user, [
      'company.domains.manage',
      'organization_domains.manage_own',
      'platform.organizations.manage',
    ]);
    await this.assertCustomDomainAllowed(organizationId, dto.type);
    const domain = await this.domainData(organizationId, dto, true);
    const created = await this.prisma.$transaction(async (tx) => {
      if (domain.isDefault) await this.clearDefaultDomain(tx, organizationId);
      return tx.organizationDomainVerification.create({ data: domain as any });
    });
    await this.record(user, 'organization.domain.created', 'OrganizationDomainVerification', created.id, organizationId);
    return created;
  }

  async updateDomain(
    organizationId: string,
    domainId: string,
    dto: DomainInputDto,
    user: AuthenticatedRequestUser,
  ) {
    this.assertDomainManagementEnabled();
    this.assertCanManageCompanyResource(organizationId, user, [
      'company.domains.manage',
      'organization_domains.manage_own',
      'platform.organizations.manage',
    ]);
    await this.findDomain(organizationId, domainId);
    const data = await this.domainData(organizationId, dto, false);
    const updated = await this.prisma.$transaction(async (tx) => {
      if (data.isDefault) await this.clearDefaultDomain(tx, organizationId);
      return tx.organizationDomainVerification.update({ where: { id: domainId }, data });
    });
    await this.record(user, 'organization.domain.updated', 'OrganizationDomainVerification', updated.id, organizationId);
    return updated;
  }

  testDomain(organizationId: string, domainId: string, user: AuthenticatedRequestUser) {
    return this.updateDomain(organizationId, domainId, {}, user);
  }

  verifyDomain(organizationId: string, domainId: string, user: AuthenticatedRequestUser) {
    return this.updateDomain(
      organizationId,
      domainId,
      { status: DomainVerificationStatus.VERIFIED },
      user,
    );
  }

  async setDefaultDomain(
    organizationId: string,
    domainId: string,
    user: AuthenticatedRequestUser,
  ) {
    return this.updateDomain(organizationId, domainId, { isDefault: true }, user);
  }

  async getCompanySettings(user: AuthenticatedRequestUser) {
    const organizationId = requireCurrentOrganizationId(user);
    this.assertAnyPermission(user, ['company.settings.view', 'company.profile.view']);
    return this.withPortalLinks(await this.findOrganizationScoped(organizationId, user));
  }

  async updateCompanySettings(
    dto: OrganizationProfileInputDto,
    user: AuthenticatedRequestUser,
  ) {
    const organizationId = requireCurrentOrganizationId(user);
    this.assertAnyPermission(user, ['company.settings.manage', 'company.profile.manage']);
    const updated = await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        name: this.string(dto.displayName ?? dto.tradeName ?? dto.name) ?? undefined,
        country: this.string(dto.countryCode ?? dto.country),
        city: this.string(dto.cityName ?? dto.city),
        timezone: this.string(dto.timezone),
        currency: this.string(dto.defaultCurrency ?? dto.currency),
        defaultLanguage: this.string(dto.preferredLanguage ?? dto.defaultLanguage),
        profile: { upsert: this.profileUpsert(dto, false) },
      },
      include: this.organizationInclude(),
    });
    await this.record(user, 'company.settings.updated', 'Organization', organizationId, organizationId);
    return this.withPortalLinks(updated);
  }

  async activationCheck(id: string, user: AuthenticatedRequestUser) {
    await this.assertPlatformCanReadOrganization(id, user);
    return this.buildActivationCheck(id);
  }

  async activateOrganization(id: string, user: AuthenticatedRequestUser) {
    this.assertPlatform(user, 'platform.organizations.activate');
    const check = await this.buildActivationCheck(id);
    if (!check.canActivate) return check;
    const updated = await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.update({
        where: { id },
        data: { status: OrganizationStatus.ACTIVE },
      });
      await tx.organizationWebsiteSettings.updateMany({
        where: { organizationId: id },
        data: { isPublished: true },
      });
      await tx.organizationPublicSiteSettings.upsert({
        where: { organizationId: id },
        update: { mode: 'PORTAL' },
        create: {
          organizationId: id,
          mode: 'PORTAL',
          theme: 'REAL_ESTATE',
          defaultLanguage: organization.defaultLanguage ?? 'en',
          supportedLanguages: ['en', 'ar', 'fr'],
        },
      });
      return tx.organization.findUniqueOrThrow({
        where: { id },
        include: this.organizationInclude(),
      });
    });
    await this.record(user, 'platform.organization.activated', 'Organization', id, id);
    return { canActivate: true, organization: this.withPortalLinks(updated) };
  }

  async rejectOrganization(id: string, dto: ActivationReviewDto, user: AuthenticatedRequestUser) {
    this.assertPlatform(user, 'platform.organizations.verify');
    const reason = this.requiredString(dto.reason, 'reason');
    const updated = await this.prisma.organization.update({
      where: { id },
      data: { status: OrganizationStatus.REJECTED },
      include: this.organizationInclude(),
    });
    await this.auditLogs.record({
      action: 'platform.organization.rejected',
      entityType: 'Organization',
      entityId: id,
      organizationId: id,
      actor: user,
      metadata: { reason, notes: this.string(dto.notes) },
    });
    return this.withPortalLinks(updated);
  }

  async getPlatformSettings(user: AuthenticatedRequestUser) {
    this.assertPlatform(user, 'platform.settings.view');
    return {
      sections: ['countries', 'currencies', 'languages', 'plans', 'subscriptions', 'verification-policies', 'modules', 'authentication-methods', 'navigation'],
      domainManagementEnabled: process.env.ENABLE_DOMAIN_MANAGEMENT === 'true',
    };
  }

  async listPlatformPlans(user: AuthenticatedRequestUser) {
    this.assertPlatform(user, 'platform.plans.view');
    return this.prisma.platformPlan.findMany({ orderBy: [{ isArchived: 'asc' }, { code: 'asc' }] });
  }

  async createPlatformPlan(dto: PlatformPlanInputDto, user: AuthenticatedRequestUser) {
    this.assertPlatform(user, 'platform.plans.manage');
    await this.assertActivePlanCurrency(dto.priceCurrency);
    const plan = await this.prisma.platformPlan.create({ data: this.platformPlanData(dto, true) as any });
    await this.record(user, 'platform.plan.created', 'PlatformPlan', plan.id);
    return plan;
  }

  async updatePlatformPlan(id: string, dto: PlatformPlanInputDto, user: AuthenticatedRequestUser) {
    this.assertPlatform(user, 'platform.plans.manage');
    await this.assertActivePlanCurrency(dto.priceCurrency);
    const current = await this.prisma.platformPlan.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Platform plan not found.');
    if (dto.isArchived === true) dto.isActive = false;
    const plan = await this.prisma.platformPlan.update({ where: { id }, data: this.platformPlanData(dto, false) as any });
    await this.record(user, 'platform.plan.updated', 'PlatformPlan', plan.id);
    return plan;
  }

  async createOrganizationFirstAdmin(
    organizationId: string,
    dto: FirstAdminInputDto,
    user: AuthenticatedRequestUser,
    context: FirstAdminRequestContext = {},
  ) {
    const validationStartedAt = performance.now();
    this.assertFirstAdminPlatformActor(user);
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, type: true },
    });
    if (!organization) throw new NotFoundException('Organization not found.');

    const input = this.validateFirstAdminInput(organization.type, dto);
    const duplicateEmail = await this.prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });
    if (duplicateEmail) throw this.duplicateFirstAdminEmail();
    this.recordFirstAdminTiming(context, 'validation', validationStartedAt);

    // Password hashing is deliberately completed before opening the interactive
    // transaction. Role provisioning is also idempotent and does not need to hold
    // the organization row lock.
    const hashStartedAt = performance.now();
    const passwordHash = await this.hashService.hash(input.temporaryPassword);
    this.recordFirstAdminTiming(context, 'hash', hashStartedAt);
    const roleStartedAt = performance.now();
    const role = await this.ensureRole(this.prisma, organizationId, input.roleName);
    this.recordFirstAdminTiming(context, 'roleProvisioning', roleStartedAt);
    const { temporaryPassword: _discardedPassword, ...preparedInput } = input;
    const prepared: PreparedFirstAdmin = { ...preparedInput, passwordHash };

    let result: { user: Awaited<ReturnType<CompanyProvisioningService['createFirstAdmin']>>; organizationType: OrganizationType };
    const transactionStartedAt = performance.now();
    try {
      result = await this.prisma.$transaction(async (tx) => {
        const lockedOrganizations = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
          SELECT "id"
          FROM "organizations"
          WHERE "id" = ${organizationId}
          FOR UPDATE
        `);
        if (!lockedOrganizations.length) throw new NotFoundException('Organization not found.');

        const existingAdmin = await tx.user.findFirst({
          where: {
            organizationId,
            userRole: { in: this.qualifiedAdminRoles(organization.type) },
          },
          select: { id: true },
        });
        if (existingAdmin) throw this.firstAdminAlreadyExists();

        return {
          user: await this.createFirstAdmin(tx, organizationId, prepared, role),
          organizationType: organization.type,
        };
      });
    } catch (error) {
      throw this.mapFirstAdminPersistenceError(error, context.requestId);
    } finally {
      this.recordFirstAdminTiming(context, 'dbTransaction', transactionStartedAt);
    }

    const auditStartedAt = performance.now();
    try {
      await this.auditLogs.record({
        action: 'platform.organization.first_admin_created',
        entityType: 'User',
        entityId: result.user.id,
        organizationId,
        actor: user,
        metadata: {
          roleTemplate: this.firstAdminRoleTemplate(result.organizationType, dto.roleTemplate),
        },
      });
    } finally {
      this.recordFirstAdminTiming(context, 'audit', auditStartedAt);
    }

    return {
      user: {
        id: result.user.id,
        organizationId: result.user.organizationId,
        roleId: result.user.roleId,
        email: result.user.email,
        phone: result.user.phone,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        userRole: result.user.userRole,
        isActive: result.user.isActive,
        mustChangePassword: result.user.mustChangePassword,
        createdAt: result.user.createdAt,
        updatedAt: result.user.updatedAt,
      },
      activationCheck: await this.buildActivationCheck(organizationId),
    };
  }

  async platformPlanDeletionImpact(id: string, user: AuthenticatedRequestUser) {
    this.assertPlatform(user, 'platform.plans.view');
    const plan = await this.prisma.platformPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Platform plan not found.');
    const subscriptions = await this.prisma.organizationSubscription.count({ where: { planCode: plan.code } });
    return { planId: id, subscriptions, canDelete: subscriptions === 0, disposition: subscriptions ? 'ARCHIVE_ONLY' : 'DELETE_ALLOWED' };
  }

  async copyPlatformPlan(id: string, user: AuthenticatedRequestUser) {
    this.assertPlatform(user, 'platform.plans.manage');
    const plan = await this.prisma.platformPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Platform plan not found.');
    let code = `${plan.code}_copy`;
    let suffix = 2;
    while (await this.prisma.platformPlan.findUnique({ where: { code } })) code = `${plan.code}_copy_${suffix++}`;
    const copied = await this.prisma.platformPlan.create({ data: { code, name: `${plan.name} copy`, localizedName: (plan.localizedName ?? undefined) as Prisma.InputJsonValue | undefined, description: plan.description, planType: plan.planType, priceAmount: plan.priceAmount, priceCurrency: plan.priceCurrency, billingCycle: plan.billingCycle, durationValue: plan.durationValue, durationUnit: plan.durationUnit, allowsNoExpiry: plan.allowsNoExpiry, trialDays: plan.trialDays, limits: plan.limits as Prisma.InputJsonValue, enabledModules: plan.enabledModules as Prisma.InputJsonValue, allowedLoginMethods: plan.allowedLoginMethods as Prisma.InputJsonValue, isActive: false, isArchived: false } });
    await this.record(user, 'platform.plan.copied', 'PlatformPlan', copied.id, undefined, { sourcePlanId: id });
    return copied;
  }

  async deletePlatformPlan(id: string, user: AuthenticatedRequestUser) {
    this.assertPlatform(user, 'platform.plans.manage');
    const impact = await this.platformPlanDeletionImpact(id, user);
    if (!impact.canDelete) {
      const archived = await this.prisma.platformPlan.update({ where: { id }, data: { isArchived: true, isActive: false } });
      await this.record(user, 'platform.plan.archived', 'PlatformPlan', id, undefined, { subscriptions: impact.subscriptions });
      return { disposition: 'ARCHIVED', subscriptions: impact.subscriptions, plan: archived };
    }
    await this.prisma.platformPlan.delete({ where: { id } });
    await this.record(user, 'platform.plan.deleted', 'PlatformPlan', id);
    return { disposition: 'DELETED', subscriptions: 0 };
  }

  async listPlatformSubscriptions(user: AuthenticatedRequestUser) {
    this.assertPlatform(user, 'platform.subscriptions.view');
    return this.prisma.organizationSubscription.findMany({
      include: { organization: { select: { id: true, name: true, slug: true, type: true, status: true } } },
      orderBy: [{ updatedAt: 'desc' }],
      take: 200,
    });
  }

  async listRequiredDocumentPolicies(user: AuthenticatedRequestUser) {
    this.assertPlatform(user, 'platform.verification_policies.view');
    const policies = await this.prisma.requiredDocumentPolicy.findMany({
      include: { supportedOrganizationType: true },
      orderBy: [{ countryCode: 'asc' }, { legalForm: 'asc' }, { sortOrder: 'asc' }, { documentType: 'asc' }],
    });
    return policies
      .sort((left, right) =>
        left.countryCode.localeCompare(right.countryCode)
        || (left.supportedOrganizationType?.sortOrder ?? Number.MAX_SAFE_INTEGER) - (right.supportedOrganizationType?.sortOrder ?? Number.MAX_SAFE_INTEGER)
        || (left.supportedOrganizationType?.code ?? '').localeCompare(right.supportedOrganizationType?.code ?? '')
        || (left.legalForm ?? '').localeCompare(right.legalForm ?? '')
        || left.sortOrder - right.sortOrder,
      )
      .map((policy) => this.requiredPolicyResponse(policy));
  }

  async createRequiredDocumentPolicy(dto: CreateRequiredDocumentPolicyDto, user: AuthenticatedRequestUser) {
    this.assertPlatform(user, 'platform.verification_policies.manage');
    let policy;
    try {
      policy = await this.prisma.$transaction(async (tx) => {
        const data = await this.requiredPolicyData(dto, true, tx);
        await this.assertNoRequiredPolicyDuplicate(tx, data);
        return tx.requiredDocumentPolicy.create({
          data: data as Prisma.RequiredDocumentPolicyUncheckedCreateInput,
          include: { supportedOrganizationType: true },
        });
      });
    } catch (error) {
      this.rethrowRequiredPolicyConflict(error);
    }
    await this.record(user, 'platform.verification_policy.created', 'RequiredDocumentPolicy', policy.id);
    return this.requiredPolicyResponse(policy);
  }

  async updateRequiredDocumentPolicy(id: string, dto: UpdateRequiredDocumentPolicyDto, user: AuthenticatedRequestUser) {
    this.assertPlatform(user, 'platform.verification_policies.manage');
    let policy;
    try {
      policy = await this.prisma.$transaction(async (tx) => {
        const current = await tx.requiredDocumentPolicy.findUnique({ where: { id } });
        if (!current) throw new NotFoundException('Verification policy not found.');
        const data = await this.requiredPolicyData(dto, false, tx, current);
        await this.assertNoRequiredPolicyDuplicate(tx, data, current);
        return tx.requiredDocumentPolicy.update({
          where: { id },
          data: data as Prisma.RequiredDocumentPolicyUncheckedUpdateInput,
          include: { supportedOrganizationType: true },
        });
      });
    } catch (error) {
      this.rethrowRequiredPolicyConflict(error);
    }
    await this.record(user, 'platform.verification_policy.updated', 'RequiredDocumentPolicy', policy.id);
    return this.requiredPolicyResponse(policy);
  }

  async deleteRequiredDocumentPolicy(id: string, user: AuthenticatedRequestUser) {
    this.assertPlatform(user, 'platform.verification_policies.manage');
    const policy = await this.prisma.requiredDocumentPolicy.findUnique({ where: { id }, include: { _count: { select: { onboardingDocuments: true } } } });
    if (!policy) throw new NotFoundException('Verification policy not found.');
    if (policy._count.onboardingDocuments) {
      const archived = await this.prisma.requiredDocumentPolicy.update({ where: { id }, data: { isArchived: true, isActive: false } });
      await this.record(user, 'platform.verification_policy.archived', 'RequiredDocumentPolicy', id, undefined, { onboardingDocuments: policy._count.onboardingDocuments });
      return { disposition: 'ARCHIVED', policy: archived };
    }
    await this.prisma.requiredDocumentPolicy.delete({ where: { id } });
    await this.record(user, 'platform.verification_policy.deleted', 'RequiredDocumentPolicy', id);
    return { disposition: 'DELETED' };
  }

  getPlatformModules(user: AuthenticatedRequestUser) {
    this.assertPlatform(user, 'platform.settings.view');
    return [
      'HR',
      'CRM',
      'ACCOUNTING',
      'LEGAL',
      'MARKETING',
      'TEMPLATES',
      'REPORTS',
      'PUBLIC_SITE',
    ];
  }

  getPlatformDomainSettings(user: AuthenticatedRequestUser) {
    this.assertDomainManagementEnabled();
    this.assertPlatform(user, 'platform.settings.view');
    return this.domainDefaults();
  }

  async listCompanyRoleTemplates(organizationId: string, user: AuthenticatedRequestUser) {
    this.assertCanManageCompanyResource(organizationId, user, [
      'company.access_levels.view',
      'company.access_levels.manage',
      'platform.organizations.view',
    ]);
    return this.prisma.companyRoleTemplate.findMany({
      where: { organizationId },
      orderBy: [{ sortOrder: 'asc' }, { displayName: 'asc' }],
    });
  }

  async createCompanyRoleTemplate(
    organizationId: string,
    dto: CompanyRoleTemplateInputDto,
    user: AuthenticatedRequestUser,
  ) {
    this.assertCanManageCompanyResource(organizationId, user, [
      'company.access_levels.manage',
      'platform.organizations.manage',
    ]);
    const created = await this.prisma.companyRoleTemplate.create({
      data: this.companyRoleTemplateData(organizationId, dto, true) as any,
    });
    await this.record(user, 'company.access_level.created', 'CompanyRoleTemplate', created.id, organizationId);
    return created;
  }

  async updateCompanyRoleTemplate(
    organizationId: string,
    templateId: string,
    dto: CompanyRoleTemplateInputDto,
    user: AuthenticatedRequestUser,
  ) {
    this.assertCanManageCompanyResource(organizationId, user, [
      'company.access_levels.manage',
      'platform.organizations.manage',
    ]);
    const current = await this.prisma.companyRoleTemplate.findFirst({ where: { id: templateId, organizationId } });
    if (!current) throw new NotFoundException('Access level not found.');
    if (current.isSystem && !isPlatformUser(user)) throw new ForbiddenException('System access levels can only be edited by platform users.');
    const updated = await this.prisma.companyRoleTemplate.update({
      where: { id: templateId },
      data: this.companyRoleTemplateData(organizationId, dto, false) as any,
    });
    await this.record(user, 'company.access_level.updated', 'CompanyRoleTemplate', updated.id, organizationId);
    return updated;
  }

  private async buildActivationCheck(organizationId: string) {
    const organization = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
      include: {
        profile: true,
        subscription: true,
        limits: true,
        branches: true,
        users: true,
        organizationDocuments: true,
        owners: true,
      },
    });
    const policies = await this.policiesForOrganization(organization);
    const requiredPolicies = policies.filter((policy) => policy.isRequired);
    const blockingDocuments: string[] = [];
    const blockingOwners: string[] = [];
    const blockingSubscriptionReasons: string[] = [];
    const blockingOfficeReasons: string[] = [];
    const blockingAdminReasons: string[] = [];
    const missingRequirements: string[] = [];
    const now = new Date();

    for (const policy of requiredPolicies) {
      const matchingDocuments = organization.organizationDocuments.filter(
        (document) => document.documentType === policy.documentType,
      );
      const approved = matchingDocuments.find((document) => {
        if (document.status !== OrganizationDocumentStatus.APPROVED) return false;
        if (policy.requiresExpiryDate && !document.expiresAt) return false;
        if (document.expiresAt && document.expiresAt <= now) return false;
        return true;
      });
      if (!approved) {
        blockingDocuments.push(policy.documentType);
      }
      for (const document of matchingDocuments) {
        if (document.status === OrganizationDocumentStatus.REJECTED) {
          blockingDocuments.push(`${policy.documentType}:REJECTED`);
        }
        if (document.expiresAt && document.expiresAt <= now) {
          blockingDocuments.push(`${policy.documentType}:EXPIRED`);
        }
      }
    }

    const ownerPolicies = requiredPolicies.filter((policy) => policy.ownerDocumentRequired);
    if (ownerPolicies.length) {
      for (const owner of organization.owners) {
        if (!this.ownerRoleApplies(owner.role, ownerPolicies)) continue;
        const needsFront = ownerPolicies.some((policy) => policy.documentType === OrganizationDocumentType.OWNER_ID_FRONT);
        const needsBack = ownerPolicies.some((policy) => policy.documentType === OrganizationDocumentType.OWNER_ID_BACK);
        if ((needsFront && !owner.idFrontFileId) || (needsBack && !owner.idBackFileId)) {
          blockingOwners.push(`${owner.id}:MISSING_ID_DOCUMENTS`);
        }
        if (owner.verificationStatus !== 'APPROVED') {
          blockingOwners.push(`${owner.id}:NOT_APPROVED`);
        }
      }
    }

    if (!organization.subscription) {
      blockingSubscriptionReasons.push('SUBSCRIPTION_REQUIRED');
    } else if (!['TRIAL', 'ACTIVE'].includes(organization.subscription.status)) {
      blockingSubscriptionReasons.push(`SUBSCRIPTION_${organization.subscription.status}`);
    }
    if (!organization.plan && !organization.subscription?.planCode) {
      blockingSubscriptionReasons.push('PLAN_REQUIRED');
    }
    if (!organization.limits) missingRequirements.push('LIMITS_REQUIRED');
    const hasAdmin = organization.users.some((user) =>
      ['DEVELOPER_OWNER', 'DEVELOPER_ADMIN', 'BROKERAGE_OWNER', 'BROKERAGE_ADMIN', 'INDIVIDUAL_BROKER'].includes(user.userRole),
    );
    if (!hasAdmin) blockingAdminReasons.push('FIRST_ADMIN_REQUIRED');
    if (['REJECTED', 'SUSPENDED', 'EXPIRED', 'REVOKED'].includes(organization.status)) {
      missingRequirements.push(`STATUS_${organization.status}`);
    }

    if (blockingDocuments.length) missingRequirements.push('REQUIRED_DOCUMENTS_NOT_APPROVED');
    if (blockingOwners.length) missingRequirements.push('OWNER_DOCUMENTS_NOT_APPROVED');
    if (blockingSubscriptionReasons.length) missingRequirements.push('SUBSCRIPTION_NOT_READY');
    if (blockingAdminReasons.length) missingRequirements.push('FIRST_ADMIN_NOT_READY');

    return {
      canActivate:
        missingRequirements.length === 0 &&
        blockingDocuments.length === 0 &&
        blockingOwners.length === 0 &&
        blockingSubscriptionReasons.length === 0 &&
        blockingOfficeReasons.length === 0 &&
        blockingAdminReasons.length === 0,
      missingRequirements: [...new Set(missingRequirements)],
      blockingDocuments: [...new Set(blockingDocuments)],
      blockingOwners: [...new Set(blockingOwners)],
      blockingSubscriptionReasons: [...new Set(blockingSubscriptionReasons)],
      blockingOfficeReasons: [...new Set(blockingOfficeReasons)],
      blockingAdminReasons: [...new Set(blockingAdminReasons)],
      requiredDocuments: requiredPolicies.map((policy) => ({
        documentType: policy.documentType,
        ownerDocumentRequired: policy.ownerDocumentRequired,
        requiresExpiryDate: policy.requiresExpiryDate,
      })),
    };
  }

  private async policiesForOrganization(organization: {
    type: OrganizationType;
    supportedOrganizationTypeId: string | null;
    country: string | null;
    profile: { countryCode: string | null; legalForm: OrganizationLegalForm | null } | null;
  }) {
    const countryCode = (organization.profile?.countryCode ?? organization.country ?? '').toUpperCase();
    if (!countryCode) return [];
    const common = { countryCode, isActive: true, isArchived: false } as const;
    const ordered = [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }];
    if (organization.supportedOrganizationTypeId && organization.profile?.legalForm) {
      const exact = await this.prisma.requiredDocumentPolicy.findMany({
        where: { ...common, supportedOrganizationTypeId: organization.supportedOrganizationTypeId, legalForm: organization.profile.legalForm },
        orderBy: ordered,
      });
      if (exact.length) return exact;
    }
    if (organization.supportedOrganizationTypeId) {
      const generic = await this.prisma.requiredDocumentPolicy.findMany({
        where: { ...common, supportedOrganizationTypeId: organization.supportedOrganizationTypeId, legalForm: null },
        orderBy: ordered,
      });
      if (generic.length) return generic;
    }
    if (organization.profile?.legalForm) {
      const legacyExact = await this.prisma.requiredDocumentPolicy.findMany({
        where: { ...common, supportedOrganizationTypeId: null, organizationType: organization.type, legalForm: organization.profile.legalForm },
        orderBy: ordered,
      });
      if (legacyExact.length) return legacyExact;
    }
    return this.prisma.requiredDocumentPolicy.findMany({
      where: { ...common, supportedOrganizationTypeId: null, organizationType: organization.type, legalForm: null },
      orderBy: ordered,
    });
  }

  private ownerRoleApplies(role: string, policies: Array<{ appliesToOwnerRoles: any }>) {
    return policies.some((policy) => {
      const roles = Array.isArray(policy.appliesToOwnerRoles) ? policy.appliesToOwnerRoles : [];
      return roles.length === 0 || roles.includes(role);
    });
  }

  private platformPlanData(dto: PlatformPlanInputDto, creating: boolean) {
    const allowedLoginMethods = dto.allowedLoginMethods === undefined
      ? undefined
      : [...new Set(dto.allowedLoginMethods.filter((method) => SUPPORTED_LOGIN_METHODS.has(method)))];
    if (dto.allowedLoginMethods && allowedLoginMethods?.length !== dto.allowedLoginMethods.length) {
      throw new BadRequestException('One or more login methods are unsupported.');
    }
    if (dto.allowedLoginMethods && !allowedLoginMethods?.length) {
      throw new BadRequestException('At least one implemented login method is required.');
    }
    return {
      code: creating ? this.requiredString(dto.code, 'code').toLowerCase() : this.string(dto.code)?.toLowerCase(),
      name: creating ? this.requiredString(dto.name, 'name') : this.string(dto.name),
      localizedName: dto.localizedName ? (this.jsonObject(dto.localizedName) as Prisma.InputJsonValue) : undefined,
      description: this.string(dto.description),
      planType: dto.planType,
      priceAmount: dto.priceAmount === undefined ? undefined : this.decimal(dto.priceAmount, 'priceAmount'),
      priceCurrency: this.string(dto.priceCurrency)?.toUpperCase(),
      billingCycle: dto.billingCycle,
      durationValue: this.optionalInt(dto.durationValue, 1, 3650),
      durationUnit: dto.durationUnit,
      allowsNoExpiry: this.booleanOrUndefined(dto.allowsNoExpiry),
      trialDays: this.optionalInt(dto.trialDays, 0, 3650),
      limits: dto.limits ? (this.jsonObject(dto.limits) as Prisma.InputJsonValue) : undefined,
      enabledModules: Array.isArray(dto.enabledModules) ? dto.enabledModules : undefined,
      allowedLoginMethods: allowedLoginMethods as Prisma.InputJsonValue | undefined,
      isActive: this.booleanOrUndefined(dto.isActive),
      isArchived: this.booleanOrUndefined(dto.isArchived),
    };
  }

  private async assertActivePlanCurrency(currency: string | undefined) {
    if (!currency) return;
    const code = currency.trim().toUpperCase();
    const record = await this.prisma.platformMetadataRecord.findUnique({ where: { category_code: { category: 'CURRENCY', code } } });
    if (!record || !record.isActive || record.isArchived) throw new BadRequestException('Plan currency must be an active platform currency.');
  }

  private async requiredPolicyData(
    dto: RequiredDocumentPolicyInputDto,
    creating: boolean,
    db: Pick<Tx, 'supportedOrganizationType'>,
    current?: {
      countryCode: string;
      supportedOrganizationTypeId: string | null;
      organizationType: OrganizationType | null;
      legalForm: OrganizationLegalForm | null;
      documentType: OrganizationDocumentType;
      isArchived: boolean;
    },
  ) {
    const supportedOrganizationTypeId = creating
      ? this.requiredString(dto.supportedOrganizationTypeId, 'supportedOrganizationTypeId')
      : this.string(dto.supportedOrganizationTypeId);
    const supportedType = supportedOrganizationTypeId
      ? await this.resolveSupportedOrganizationTypeForPolicy(db, supportedOrganizationTypeId)
      : undefined;
    return {
      countryCode: creating ? this.requiredString(dto.countryCode, 'countryCode').toUpperCase() : this.string(dto.countryCode)?.toUpperCase(),
      organizationType: supportedType ? supportedType.legacyOrganizationType : undefined,
      legalForm: creating ? dto.legalForm || null : dto.legalForm === undefined ? undefined : dto.legalForm || null,
      documentType: creating
        ? this.enumValue(OrganizationDocumentType, dto.documentType, 'documentType')
        : dto.documentType
          ? this.enumValue(OrganizationDocumentType, dto.documentType, 'documentType')
          : undefined,
      isRequired: this.booleanOrUndefined(dto.isRequired),
      requiresExpiryDate: this.booleanOrUndefined(dto.requiresExpiryDate),
      ownerDocumentRequired: this.booleanOrUndefined(dto.ownerDocumentRequired),
      appliesToOwnerRoles: dto.appliesToOwnerRoles ? (dto.appliesToOwnerRoles as Prisma.InputJsonValue) : undefined,
      isActive: this.booleanOrUndefined(dto.isActive),
      supportedOrganizationTypeId,
      requiredFieldCodes: dto.requiredFieldCodes ? this.stringArray(dto.requiredFieldCodes) : undefined,
      acceptedMimeTypes: dto.acceptedMimeTypes ? this.stringArray(dto.acceptedMimeTypes) : undefined,
      maxFileSizeMb: this.optionalInt(dto.maxFileSizeMb, 1, 25),
      minimumConfidence: dto.minimumConfidence === undefined ? undefined : this.decimal(dto.minimumConfidence, 'minimumConfidence'),
      blocksActivation: this.booleanOrUndefined(dto.blocksActivation),
      sortOrder: this.optionalInt(dto.sortOrder, 0, 100000),
      isArchived: this.booleanOrUndefined(dto.isArchived),
      notes: this.string(dto.notes),
    };
  }

  private async resolveSupportedOrganizationTypeForPolicy(
    db: Pick<Tx, 'supportedOrganizationType'>,
    id: string,
  ) {
    const type = await db.supportedOrganizationType.findUnique({ where: { id } });
    if (!type) throw new NotFoundException('Supported organization type not found.');
    if (!type.isActive || type.isArchived) {
      throw new BadRequestException('Supported organization type must be active and not archived.');
    }
    if (type.code.toUpperCase() === 'PLATFORM' || type.legacyOrganizationType === OrganizationType.PLATFORM) {
      throw new BadRequestException('Verification policies cannot be created for PLATFORM.');
    }
    return type;
  }

  private async assertNoRequiredPolicyDuplicate(
    tx: Tx,
    data: {
      countryCode?: string;
      supportedOrganizationTypeId?: string | null;
      legalForm?: OrganizationLegalForm | null;
      documentType?: OrganizationDocumentType;
      isArchived?: boolean;
    },
    current?: {
      id: string;
      countryCode: string;
      supportedOrganizationTypeId: string | null;
      legalForm: OrganizationLegalForm | null;
      documentType: OrganizationDocumentType;
      isArchived: boolean;
    },
  ) {
    const countryCode = data.countryCode ?? current?.countryCode;
    const typeId = data.supportedOrganizationTypeId ?? current?.supportedOrganizationTypeId;
    const legalForm = data.legalForm === undefined ? current?.legalForm ?? null : data.legalForm;
    const documentType = data.documentType ?? current?.documentType;
    const isArchived = data.isArchived ?? current?.isArchived ?? false;
    if (isArchived || !countryCode || !typeId || !documentType) return;
    const duplicate = await tx.requiredDocumentPolicy.findFirst({
      where: {
        countryCode,
        supportedOrganizationTypeId: typeId,
        legalForm,
        documentType,
        isArchived: false,
        ...(current ? { id: { not: current.id } } : {}),
      },
      select: { id: true },
    });
    if (duplicate) this.throwRequiredPolicyConflict();
  }

  private throwRequiredPolicyConflict(): never {
    throw new ConflictException({
      code: 'VERIFICATION_POLICY_ALREADY_EXISTS',
      message: 'An active verification policy already exists for this country, organization type, legal form, and document type.',
    });
  }

  private rethrowRequiredPolicyConflict(error: unknown): never {
    if (error instanceof ConflictException) throw error;
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      this.throwRequiredPolicyConflict();
    }
    throw error;
  }

  private requiredPolicyResponse(policy: RequiredPolicyWithSupportedType) {
    return {
      ...policy,
      supportedOrganizationTypeCode: policy.supportedOrganizationType?.code ?? null,
      supportedOrganizationTypeNames: policy.supportedOrganizationType?.names ?? null,
      legacyOrganizationType: policy.organizationType,
    };
  }

  private companyRoleTemplateData(
    organizationId: string,
    dto: CompanyRoleTemplateInputDto,
    creating: boolean,
  ) {
    const permissions = this.companyPermissions(dto.permissions);
    const displayName = creating ? this.requiredString(dto.displayName, 'displayName') : this.string(dto.displayName);
    return {
      organizationId,
      code: creating ? this.accessLevelCode(dto.code ?? displayName) : dto.code ? this.accessLevelCode(dto.code) : undefined,
      displayName,
      localizedName: dto.localizedName ? (this.jsonObject(dto.localizedName) as Prisma.InputJsonValue) : undefined,
      description: this.string(dto.description),
      permissions,
      isSystem: this.booleanOrUndefined(dto.isSystem),
      isActive: this.booleanOrUndefined(dto.isActive),
      sortOrder: this.optionalInt(dto.sortOrder, 0, 100000),
    };
  }

  private companyPermissions(value: unknown) {
    const permissions = Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
    const blocked = permissions.filter((permission) =>
      permission.startsWith('platform.') ||
      permission.startsWith('organizations.') ||
      PLATFORM_PERMISSIONS.includes(permission),
    );
    if (blocked.length) {
      throw new BadRequestException('Company access levels cannot include platform permissions.');
    }
    return [...new Set(permissions.map((permission) => permission.trim()).filter(Boolean))];
  }

  private accessLevelCode(value: string | undefined) {
    return this.requiredString(value, 'code')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  private domainDefaults() {
    return {
      publicRootDomain: process.env.PUBLIC_ROOT_DOMAIN ?? null,
      stagingRootDomain: process.env.PUBLIC_STAGING_ROOT_DOMAIN ?? null,
      fallbackPath: process.env.COMPANY_PUBLIC_SITE_FALLBACK_PATH ?? '/sites',
      wildcardEnabled: process.env.ENABLE_WILDCARD_SUBDOMAINS === 'true',
      companyDefaultDomainPattern: process.env.COMPANY_DEFAULT_DOMAIN_PATTERN ?? null,
      companyStagingDomainPattern: process.env.COMPANY_STAGING_DOMAIN_PATTERN ?? null,
      railway: 'Add wildcard/custom domains in Railway and wait for SSL to become active.',
      cloudflare: 'Use DNS Only verification records while Railway verifies domains; do not proxy until SSL is active.',
    };
  }

  private organizationInclude() {
    return {
      profile: true,
      subscription: true,
      limits: true,
      branches: true,
      attendanceLocations: true,
      wifiRules: true,
      domainVerifications: true,
      websiteSettings: true,
      users: { select: { id: true, email: true, phone: true, firstName: true, lastName: true, userRole: true, isActive: true, mustChangePassword: true, role: true } },
    } as const;
  }

  private prismaErrorCode(error: unknown) {
    return typeof error === 'object' && error && 'code' in error
      ? String((error as { code?: unknown }).code)
      : undefined;
  }

  async organizationDeletionImpact(id: string, user: AuthenticatedRequestUser) {
    this.assertAnyPermission(user, ['platform.organizations.archive', 'platform.organizations.delete_draft']);
    const organization = await this.findOrganization(id);
    if (organization.type === OrganizationType.PLATFORM) {
      throw new ForbiddenException('The Platform organization is protected.');
    }
    const [postedFinancialTransactions, activeEmployees, approvedDocuments, activeSubscriptions, activeContracts, attendanceRecords, linkedUsers, totalDocuments] = await Promise.all([
      this.prisma.accountingTransaction.count({ where: { organizationId: id, status: 'APPROVED' } }),
      this.prisma.hrEmployee.count({ where: { organizationId: id, status: 'ACTIVE' } }),
      this.prisma.organizationDocument.count({ where: { organizationId: id, status: 'APPROVED' } }),
      this.prisma.organizationSubscription.count({ where: { organizationId: id, status: { in: ['TRIAL', 'ACTIVE', 'PAST_DUE'] } } }),
      this.prisma.legalDocument.count({ where: { organizationId: id, status: 'ACTIVE' } }),
      this.prisma.hrAttendanceRecord.count({ where: { organizationId: id } }),
      this.prisma.user.count({ where: { organizationId: id } }),
      this.prisma.organizationDocument.count({ where: { organizationId: id } }),
    ]);
    const blockers = {
      postedFinancialTransactions,
      activeEmployees,
      approvedDocuments,
      activeSubscriptions,
      activeContracts,
      attendanceRecords,
    };
    return {
      organization: { id: organization.id, name: organization.name, type: organization.type, status: organization.status },
      counts: { ...blockers, linkedUsers, totalDocuments },
      canPermanentlyDeleteDraft:
        new Set<OrganizationStatus>([OrganizationStatus.DRAFT, OrganizationStatus.DOCUMENTS_REQUIRED, OrganizationStatus.REJECTED]).has(organization.status) &&
        Object.values(blockers).every((value) => value === 0),
      blockers: Object.entries(blockers).filter(([, value]) => value > 0).map(([key, value]) => ({ key, count: value })),
    };
  }

  async archiveOrganization(id: string, reason: string | undefined, user: AuthenticatedRequestUser) {
    this.assertPlatform(user, 'platform.organizations.archive');
    const existing = await this.findOrganization(id);
    if (existing.type === OrganizationType.PLATFORM) throw new ForbiddenException('The Platform organization is protected.');
    if (existing.archivedAt) return this.getPlatformOrganization(id, user);
    const updated = await this.prisma.organization.update({
      where: { id },
      data: { archivedAt: new Date(), archivedPreviousStatus: existing.status, status: OrganizationStatus.REVOKED },
      include: this.organizationInclude(),
    });
    await this.auditLogs.record({ action: 'platform.organization.archived', entityType: 'Organization', entityId: id, organizationId: id, actor: user, metadata: { reason: this.string(reason), previousStatus: existing.status } });
    return this.withPortalLinks(updated);
  }

  async restoreOrganization(id: string, user: AuthenticatedRequestUser) {
    this.assertPlatform(user, 'platform.organizations.archive');
    const existing = await this.findOrganization(id);
    if (existing.type === OrganizationType.PLATFORM) throw new ForbiddenException('The Platform organization is protected.');
    if (!existing.archivedAt) throw new BadRequestException('Organization is not archived.');
    const status = existing.archivedPreviousStatus === OrganizationStatus.ACTIVE
      ? OrganizationStatus.SUSPENDED
      : existing.archivedPreviousStatus ?? OrganizationStatus.DRAFT;
    const updated = await this.prisma.organization.update({ where: { id }, data: { archivedAt: null, archivedPreviousStatus: null, status }, include: this.organizationInclude() });
    await this.record(user, 'platform.organization.restored', 'Organization', id, id);
    return this.withPortalLinks(updated);
  }

  async suspendOrganizationLifecycle(id: string, reason: string | undefined, user: AuthenticatedRequestUser) {
    this.assertPlatform(user, 'platform.organizations.suspend');
    const existing = await this.findOrganization(id);
    if (existing.type === OrganizationType.PLATFORM) throw new ForbiddenException('The Platform organization is protected.');
    const updated = await this.prisma.organization.update({ where: { id }, data: { status: OrganizationStatus.SUSPENDED }, include: this.organizationInclude() });
    await this.auditLogs.record({ action: 'platform.organization.suspended', entityType: 'Organization', entityId: id, organizationId: id, actor: user, metadata: { reason: this.string(reason), previousStatus: existing.status } });
    return this.withPortalLinks(updated);
  }

  async deleteDraftOrganization(id: string, confirmationName: string | undefined, user: AuthenticatedRequestUser) {
    this.assertPlatform(user, 'platform.organizations.delete_draft');
    const impact = await this.organizationDeletionImpact(id, user);
    if (confirmationName !== impact.organization.name) throw new BadRequestException('Type the exact organization name to confirm permanent deletion.');
    if (!impact.canPermanentlyDeleteDraft) throw new ConflictException({ code: 'ORGANIZATION_DELETE_BLOCKED', blockers: impact.blockers });
    await this.prisma.$transaction(async (tx) => {
      await tx.auditLog.create({ data: { action: 'platform.organization.draft_deleted', entityType: 'Organization', entityId: id, actorUserId: user.userId, organizationId: id, metadata: impact.counts } });
      await tx.organization.delete({ where: { id } });
    });
    return { deleted: true, organizationId: id, removedCounts: impact.counts };
  }

  async getPlatformDashboard(user: AuthenticatedRequestUser) {
    this.assertPlatform(user, 'platform.dashboard.view');
    const now = new Date();
    const expiringAt = new Date(now);
    expiringAt.setUTCDate(expiringAt.getUTCDate() + 30);
    const [
      organizationsByStatus,
      organizationsByType,
      organizationsByCountry,
      subscriptionsByStatus,
      expiringSubscriptions,
      planDistribution,
      supportedCountries,
      platformUsers,
      companyUsers,
      employees,
      applicantsAwaitingReview,
      interviewsScheduled,
      activeOffices,
      attendanceIssues,
      unresolvedAlerts,
      migrationRows,
    ] = await Promise.all([
      this.prisma.organization.groupBy({ by: ['status'], orderBy: { status: 'asc' }, _count: { id: true } }),
      this.prisma.organization.groupBy({ by: ['type'], orderBy: { type: 'asc' }, _count: { id: true } }),
      this.prisma.organization.groupBy({ by: ['country'], where: { country: { not: null } }, orderBy: { country: 'asc' }, _count: { id: true } }),
      this.prisma.organizationSubscription.groupBy({ by: ['status'], orderBy: { status: 'asc' }, _count: { id: true } }),
      this.prisma.organizationSubscription.count({ where: { status: 'ACTIVE', endsAt: { gte: now, lte: expiringAt } } }),
      this.prisma.organizationSubscription.groupBy({ by: ['planCode', 'planName'], orderBy: [{ planCode: 'asc' }, { planName: 'asc' }], _count: { id: true } }),
      this.prisma.platformMetadataRecord.count({ where: { category: 'COUNTRY', isActive: true } }),
      this.prisma.user.count({ where: { organization: { type: 'PLATFORM' } } }),
      this.prisma.user.count({ where: { organization: { type: { not: 'PLATFORM' } } } }),
      this.prisma.hrEmployee.count(),
      this.prisma.hrApplicant.count({ where: { status: { in: ['PENDING_REVIEW', 'DOCUMENTS_MISSING', 'DOCUMENTS_UNDER_REVIEW'] } } }),
      this.prisma.hrApplicantInterview.count({ where: { status: 'SCHEDULED', scheduledAt: { gte: now } } }),
      this.prisma.organizationBranch.count({ where: { isActive: true, type: { in: ['HEAD_OFFICE', 'SALES_OFFICE', 'REMOTE_HUB'] } } }),
      this.prisma.hrAttendanceRecord.count({ where: { OR: [{ requiresReview: true }, { verificationStatus: 'PENDING_REVIEW' }] } }),
      this.prisma.leadClaimConflict.count({ where: { resolvedAt: null } }),
      this.prisma.$queryRaw<Array<{ migration_name: string; finished_at: Date | null; rolled_back_at: Date | null; logs: string | null }>>`
        SELECT migration_name, finished_at, rolled_back_at, logs FROM "_prisma_migrations"
      `,
    ]);
    const count = (rows: Array<{ _count: { id: number } }>) =>
      rows.reduce((total, row) => total + row._count.id, 0);
    const failedMigrations = migrationRows.filter((row) => !row.finished_at && !row.rolled_back_at && Boolean(row.logs)).length;
    const unfinishedMigrations = migrationRows.filter((row) => !row.finished_at && !row.rolled_back_at && !row.logs).length;
    const appliedMigrations = new Set(migrationRows.filter((row) => row.finished_at && !row.rolled_back_at).map((row) => row.migration_name));
    const expectedMigrations = this.localMigrationNames();
    const pendingMigrations = expectedMigrations ? expectedMigrations.filter((name) => !appliedMigrations.has(name)).length : null;
    return {
      generatedAt: now.toISOString(),
      organizations: {
        total: count(organizationsByStatus),
        byStatus: Object.fromEntries(organizationsByStatus.map((row) => [row.status, row._count.id])),
        byType: Object.fromEntries(organizationsByType.map((row) => [row.type, row._count.id])),
        byCountry: organizationsByCountry.map((row) => ({ country: row.country, count: row._count.id })),
      },
      subscriptions: {
        byStatus: Object.fromEntries(subscriptionsByStatus.map((row) => [row.status, row._count.id])),
        expiringWithin30Days: expiringSubscriptions,
        planDistribution: planDistribution.map((row) => ({ planCode: row.planCode, planName: row.planName, count: row._count.id })),
      },
      people: { platformUsers, companyUsers, employees, applicantsAwaitingReview, interviewsScheduled },
      operations: { supportedCountries, activeOffices, attendanceIssues, unresolvedAlerts },
      health: {
        database: { connected: true, migrationsReady: failedMigrations === 0 && unfinishedMigrations === 0 && pendingMigrations === 0, failedMigrations, unfinishedMigrations, pendingMigrations },
        r2: { configured: this.r2Configured() },
        cloudflareExtraction: { enabled: process.env.DOCUMENT_EXTRACTION_PROVIDER === 'CLOUDFLARE_WORKERS_AI', configured: Boolean(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_AI_GATEWAY_ID) },
        integrations: {
          cameras: process.env.ENABLE_CAMERA_INTEGRATIONS === 'true' ? 'CONFIGURATION_REQUIRED' : 'DISABLED',
          googleAds: process.env.ENABLE_AD_PROVIDER_INTEGRATIONS === 'true' ? 'CONFIGURATION_REQUIRED' : 'DISABLED',
          metaAds: process.env.ENABLE_AD_PROVIDER_INTEGRATIONS === 'true' ? 'CONFIGURATION_REQUIRED' : 'DISABLED',
          tiktokAds: process.env.ENABLE_AD_PROVIDER_INTEGRATIONS === 'true' ? 'CONFIGURATION_REQUIRED' : 'DISABLED',
        },
      },
    };
  }

  async listNavigationConfiguration(user: AuthenticatedRequestUser) {
    if (!user.userId) throw new ForbiddenException('Authentication is required.');
    await this.ensureDefaultNavigationConfiguration();
    return this.prisma.platformNavigationConfiguration.findMany({ orderBy: [{ sortOrder: 'asc' }, { sectionKey: 'asc' }] });
  }

  async updateNavigationConfiguration(dto: PlatformNavigationInputDto, user: AuthenticatedRequestUser) {
    this.assertPlatform(user, 'platform.settings.manage');
    const sections = Array.isArray(dto.sections) ? dto.sections : [];
    if (sections.length !== DEFAULT_NAVIGATION_SECTIONS.length) {
      throw new BadRequestException('All navigation sections are required. Disable a section instead of removing it.');
    }
    const allowedKeys = new Set(DEFAULT_NAVIGATION_SECTIONS.map(([key]) => key));
    const seen = new Set<string>();
    const assignedItems = new Set<string>();
    await this.prisma.$transaction(sections.map((section, index) => {
      const sectionKey = this.requiredString(section.sectionKey, 'sectionKey');
      if (!allowedKeys.has(sectionKey as any) || seen.has(sectionKey)) throw new BadRequestException('Invalid or duplicate navigation section.');
      seen.add(sectionKey);
      const allowedItemKeys = this.stringArray(section.allowedItemKeys);
      if (allowedItemKeys.some((itemKey) => assignedItems.has(itemKey))) {
        throw new BadRequestException('A navigation item can only be assigned to one section.');
      }
      allowedItemKeys.forEach((itemKey) => assignedItems.add(itemKey));
      return this.prisma.platformNavigationConfiguration.upsert({
        where: { sectionKey },
        create: {
          sectionKey,
          localizedTitle: this.localizedTitle(section.localizedTitle),
          sortOrder: index,
          isVisible: section.isVisible ?? true,
          allowedItemKeys,
        },
        update: {
          localizedTitle: this.localizedTitle(section.localizedTitle),
          sortOrder: index,
          isVisible: section.isVisible ?? true,
          allowedItemKeys,
        },
      });
    }));
    await this.record(user, 'platform.navigation.updated', 'PlatformNavigationConfiguration', 'global');
    return this.listNavigationConfiguration(user);
  }

  async restoreNavigationConfiguration(user: AuthenticatedRequestUser) {
    this.assertPlatform(user, 'platform.settings.manage');
    await this.prisma.$transaction(async (tx) => {
      await tx.platformNavigationConfiguration.deleteMany();
      await this.createDefaultNavigationConfiguration(tx);
    });
    await this.record(user, 'platform.navigation.restored', 'PlatformNavigationConfiguration', 'global');
    return this.listNavigationConfiguration(user);
  }

  async listPlatformMetadata(category: string | undefined, user: AuthenticatedRequestUser) {
    this.assertPlatform(user, 'platform.metadata.view');
    return this.prisma.platformMetadataRecord.findMany({
      where: category ? { category: category.trim().toUpperCase() } : undefined,
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { code: 'asc' }],
    });
  }

  async createPlatformMetadata(dto: PlatformMetadataInputDto, user: AuthenticatedRequestUser) {
    this.assertPlatform(user, 'platform.metadata.manage');
    await this.validateMetadataConfiguration(dto);
    if (dto.category?.trim().toUpperCase() === 'LANGUAGE' && dto.configuration?.isDefault === true) await this.clearDefaultLanguage();
    const created = await this.prisma.platformMetadataRecord.create({ data: this.platformMetadataData(dto, true) as any });
    await this.record(user, 'platform.metadata.created', 'PlatformMetadataRecord', created.id);
    return created;
  }

  async updatePlatformMetadata(id: string, dto: PlatformMetadataInputDto, user: AuthenticatedRequestUser) {
    this.assertPlatform(user, 'platform.metadata.manage');
    const current = await this.prisma.platformMetadataRecord.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Platform metadata record not found.');
    await this.validateMetadataConfiguration({ ...dto, category: dto.category ?? current.category, code: dto.code ?? current.code }, id);
    if (current.category === 'LANGUAGE' && dto.configuration?.isDefault === true) await this.clearDefaultLanguage(id);
    if (current.category === 'LANGUAGE' && this.metadataIsDefault(current.configuration) && (dto.isActive === false || dto.isArchived === true)) throw new ConflictException('Assign another default language before disabling or archiving this language.');
    const updated = await this.prisma.platformMetadataRecord.update({
      where: { id },
      data: this.platformMetadataData({ ...dto, category: dto.category ?? current.category, code: dto.code ?? current.code }, false) as any,
    });
    await this.record(user, 'platform.metadata.updated', 'PlatformMetadataRecord', updated.id);
    return updated;
  }

  async deletePlatformMetadata(id: string, user: AuthenticatedRequestUser) {
    this.assertPlatform(user, 'platform.metadata.manage');
    const record = await this.prisma.platformMetadataRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Platform metadata record not found.');
    if (record.category === 'LANGUAGE' && this.metadataIsDefault(record.configuration)) throw new ConflictException('The default language cannot be deleted. Assign a replacement first.');
    const impact = await this.metadataDeletionImpact(record.category, record.code);
    if (impact.references > 0) {
      const archived = await this.prisma.platformMetadataRecord.update({ where: { id }, data: { isArchived: true, isActive: false } });
      await this.record(user, 'platform.metadata.archived', 'PlatformMetadataRecord', id, undefined, impact);
      return { disposition: 'ARCHIVED', impact, record: archived };
    }
    await this.prisma.platformMetadataRecord.delete({ where: { id } });
    await this.record(user, 'platform.metadata.deleted', 'PlatformMetadataRecord', id);
    return { disposition: 'DELETED', impact };
  }

  private safeErrorName(error: unknown) {
    const name = error instanceof Error ? error.name : 'UnknownError';
    return /^[A-Za-z0-9_.-]{1,80}$/.test(name) ? name : 'UnknownError';
  }

  private safeErrorMessage(error: unknown) {
    if (this.prismaErrorCode(error)) return 'Prisma request failed.';
    if (!(error instanceof Error)) return 'Unknown error.';
    return error.message
      .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, '[REDACTED_DATABASE_URL]')
      .replace(/Bearer\s+[A-Za-z0-9._~+\/-]+=*/gi, 'Bearer [REDACTED]')
      .replace(/\b(password|secret|token|api[_-]?key)\s*[:=]\s*[^\s,;]+/gi, '$1=[REDACTED]')
      .replace(/\s+/g, ' ')
      .slice(0, 300);
  }

  private organizationListQuery(rawQuery: Record<string, unknown>) {
    const allowedKeys = new Set(['type', 'status', 'sort', 'order', 'limit', 'offset']);
    if (Object.keys(rawQuery).some((key) => !allowedKeys.has(key))) {
      throw new BadRequestException('Invalid organizations list query.');
    }
    const value = (key: string) => {
      const candidate = rawQuery[key];
      if (candidate === undefined) return undefined;
      if (typeof candidate !== 'string' || !candidate.trim()) {
        throw new BadRequestException(`Query parameter ${key} must be a single value.`);
      }
      return candidate.trim();
    };
    const typeValue = value('type');
    const statusValue = value('status');
    const type = typeValue ? this.enumValue(OrganizationType, typeValue, 'type') : undefined;
    const status = statusValue ? this.enumValue(OrganizationStatus, statusValue, 'status') : undefined;
    const sortValue = value('sort') ?? 'createdAt';
    if (!['createdAt', 'updatedAt', 'name'].includes(sortValue)) {
      throw new BadRequestException('sort must be createdAt, updatedAt, or name.');
    }
    const orderValue = (value('order') ?? 'desc').toLowerCase();
    if (orderValue !== 'asc' && orderValue !== 'desc') {
      throw new BadRequestException('order must be asc or desc.');
    }
    const limit = this.optionalListInteger(value('limit'), 'limit', 1, 100);
    const offset = this.optionalListInteger(value('offset'), 'offset', 0, 100_000);
    return {
      where: { ...(type ? { type } : {}), ...(status ? { status } : {}) } satisfies Prisma.OrganizationWhereInput,
      sort: sortValue as 'createdAt' | 'updatedAt' | 'name',
      order: orderValue as Prisma.SortOrder,
      limit,
      offset,
      safeParams: {
        type: type ?? null,
        status: status ?? null,
        sort: sortValue,
        order: orderValue,
        limit: limit ?? null,
        offset: offset ?? null,
      },
    };
  }

  private optionalListInteger(value: string | undefined, field: string, minimum: number, maximum: number) {
    if (value === undefined) return undefined;
    if (!/^\d+$/.test(value)) throw new BadRequestException(`${field} must be an integer.`);
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
      throw new BadRequestException(`${field} must be between ${minimum} and ${maximum}.`);
    }
    return parsed;
  }

  private async findOrganizationForPlatform(id: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: this.organizationInclude(),
    });
    if (!organization) throw new NotFoundException('Organization not found.');
    return organization;
  }

  private async findOrganization(id: string) {
    const organization = await this.prisma.organization.findUnique({ where: { id } });
    if (!organization) throw new NotFoundException('Organization not found.');
    return organization;
  }

  private async findOrganizationScoped(id: string, user: AuthenticatedRequestUser) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: this.organizationInclude(),
    });
    if (!organization) throw new NotFoundException('Organization not found.');
    if (!isPlatformUser(user) && user.organizationId !== id) {
      throw new ForbiddenException('Cannot access another organization.');
    }
    return organization;
  }

  private async createInitialOffices(tx: Tx, organizationId: string, offices: OfficeInputDto[]) {
    const officeMap = new Map<number, string>();
    for (const [index, office] of offices.entries()) {
      const created = await tx.organizationBranch.create({
        data: this.officeData(organizationId, { ...office, isDefault: office.isDefault ?? index === 0 }, true) as any,
      });
      officeMap.set(index, created.id);
    }
    return officeMap;
  }

  private async createInitialAttendanceLocations(
    tx: Tx,
    organizationId: string,
    locations: AttendanceLocationInputDto[],
    officeMap: Map<number, string>,
  ) {
    for (const [index, location] of locations.entries()) {
      const officeId = location.officeId ?? officeMap.get(index) ?? officeMap.get(0);
      await tx.organizationAttendanceLocation.create({
        data: (await this.attendanceLocationData(organizationId, { ...location, officeId }, true, tx)) as any,
      });
    }
  }

  private async createInitialWifiRules(
    tx: Tx,
    organizationId: string,
    rules: WifiRuleInputDto[],
    officeMap: Map<number, string>,
  ) {
    for (const [index, rule] of rules.entries()) {
      const officeId = rule.officeId ?? officeMap.get(index) ?? officeMap.get(0);
      await tx.organizationWifiRule.create({
        data: (await this.wifiRuleData(organizationId, { ...rule, officeId }, true, tx)) as any,
      });
    }
  }

  private async createInitialDomains(tx: Tx, organizationId: string, domains: DomainInputDto[]) {
    for (const domain of domains) {
      const data = await this.domainData(organizationId, domain, true, tx);
      if (data.isDefault) await this.clearDefaultDomain(tx, organizationId);
      await tx.organizationDomainVerification.create({ data: data as any });
    }
  }

  private async createFirstAdmin(
    tx: Tx,
    organizationId: string,
    prepared: PreparedFirstAdmin,
    preparedRole?: { id: string },
  ) {
    const role = preparedRole ?? await this.ensureRole(tx, organizationId, prepared.roleName);
    const user = await tx.user.create({
      data: {
        organizationId,
        roleId: role.id,
        email: prepared.email,
        phone: prepared.phone,
        firstName: prepared.firstName,
        lastName: prepared.lastName,
        passwordHash: prepared.passwordHash,
        mustChangePassword: true,
        userRole: prepared.userRole,
      },
    });
    await tx.hrEmployee.create({
      data: {
        organizationId,
        userId: user.id,
        employeeCode: await this.nextEmployeeCode(tx, organizationId),
        name: prepared.name,
        legalName: prepared.name,
        displayName: prepared.name,
        email: prepared.email,
        phone: prepared.phone,
        loginEnabled: true,
        roleTitle: prepared.roleName.replaceAll('_', ' '),
      },
    });
    return user;
  }

  private validateFirstAdminInput(organizationType: OrganizationType, dto: FirstAdminInputDto) {
    const email = this.optionalEmail(dto.email);
    if (!email) throw new BadRequestException('admin email is required.');
    const roleName = this.firstAdminRoleTemplate(organizationType, dto.roleTemplate);
    this.assertFirstAdminRoleTemplate(organizationType, roleName);
    const name = this.requiredString(dto.name, 'admin name');
    const temporaryPassword = this.requiredString(dto.temporaryPassword, 'temporaryPassword');
    if (temporaryPassword.length < 12 || temporaryPassword === '123456') {
      throw new BadRequestException('temporaryPassword must be at least 12 characters and cannot use the legacy default.');
    }
    const [firstName, ...rest] = name.split(/\s+/);
    return {
      email,
      phone: normalizeOptionalPhoneOrThrow(dto.phone, 'admin phone', dto.phoneCountry),
      firstName,
      lastName: rest.join(' ') || undefined,
      name,
      temporaryPassword,
      roleName,
      userRole: this.userRoleForOrganization(organizationType, roleName),
    };
  }

  private async prepareFirstAdmin(organizationType: OrganizationType, dto: FirstAdminInputDto): Promise<PreparedFirstAdmin> {
    const input = this.validateFirstAdminInput(organizationType, dto);
    const passwordHash = await this.hashService.hash(input.temporaryPassword);
    const { temporaryPassword: _discardedPassword, ...preparedInput } = input;
    return { ...preparedInput, passwordHash };
  }

  private async prepareSubscription(dto: SubscriptionInputDto) {
    const planCode = this.requiredString(dto.planCode, 'planCode').toLowerCase();
    const plan = await this.prisma.platformPlan.findUnique({ where: { code: planCode } });
    if (!plan || !plan.isActive || plan.isArchived) {
      throw new BadRequestException({ code: 'PLAN_NOT_AVAILABLE', message: 'Select an active Platform plan.' });
    }
    const startsAt = this.date(dto.startsAt) ?? new Date();
    let endsAt: Date | null = this.addPlanDuration(startsAt, plan.durationValue, plan.durationUnit);
    if (dto.noExpiry) {
      if (!plan.allowsNoExpiry) throw new BadRequestException('This plan does not allow a subscription without an end date.');
      endsAt = null;
    }
    let endDateOverridden = false;
    let endDateOverrideReason: string | null = null;
    if (dto.overrideEndDate) {
      endsAt = this.date(dto.endsAt) ?? null;
      endDateOverrideReason = this.requiredString(dto.overrideReason, 'overrideReason');
      endDateOverridden = true;
    }
    if (endsAt && endsAt <= startsAt) throw new BadRequestException('subscription end must be after subscription start.');
    const trialEndsAt = plan.trialDays > 0 ? this.addDays(startsAt, plan.trialDays) : null;
    return {
      planCode: plan.code,
      planName: plan.name,
      status: dto.status ?? (plan.planType === 'TRIAL' ? OrganizationSubscriptionStatus.TRIAL : OrganizationSubscriptionStatus.ACTIVE),
      startsAt,
      endsAt,
      trialEndsAt,
      billingCycle: plan.billingCycle,
      autoRenew: Boolean(dto.autoRenew),
      notes: this.string(dto.notes),
      endDateOverridden,
      endDateOverrideReason,
    };
  }

  private addPlanDuration(start: Date, value: number, unit: string) {
    if (unit === 'DAY') return this.addDays(start, value);
    const result = new Date(start);
    const day = result.getUTCDate();
    result.setUTCDate(1);
    if (unit === 'YEAR') result.setUTCFullYear(result.getUTCFullYear() + value);
    else result.setUTCMonth(result.getUTCMonth() + value);
    const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
    result.setUTCDate(Math.min(day, lastDay));
    return result;
  }

  private addDays(start: Date, days: number) {
    const result = new Date(start);
    result.setUTCDate(result.getUTCDate() + days);
    return result;
  }

  private limitsCreate(dto?: LimitsInputDto) {
    return {
      maxEmployees: this.int(dto?.maxEmployees, 25, 0, 100000),
      maxOffices: this.int(dto?.maxOffices, 1, 0, 10000),
      maxBranches: this.int(dto?.maxBranches, dto?.maxOffices ?? 1, 0, 10000),
      maxWorkGroups: this.int(dto?.maxWorkGroups, 5, 0, 10000),
      maxTeams: this.int(dto?.maxTeams, 10, 0, 10000),
      maxStorageMb: this.int(dto?.maxStorageMb, 1024, 0, 10_000_000),
      maxMonthlyCheckIns: this.int(dto?.maxMonthlyCheckIns, 1000, 0, 10_000_000),
      enabledModules: this.jsonObject(dto?.enabledModules) as Prisma.InputJsonValue,
      allowWebCheckIn: dto?.allowWebCheckIn ?? true,
      allowMobileCheckIn: dto?.allowMobileCheckIn ?? true,
      allowPublicWebsite: dto?.allowPublicWebsite ?? true,
      allowCustomDomain: dto?.allowCustomDomain ?? false,
      allowSubdomain: dto?.allowSubdomain ?? true,
      allowDvrReview: dto?.allowDvrReview ?? false,
      allowFaceVerification: dto?.allowFaceVerification ?? false,
    };
  }

  private limitsUpdate(dto: LimitsInputDto) {
    return {
      maxEmployees: this.optionalInt(dto.maxEmployees, 0, 100000),
      maxOffices: this.optionalInt(dto.maxOffices, 0, 10000),
      maxBranches: this.optionalInt(dto.maxBranches, 0, 10000),
      maxWorkGroups: this.optionalInt(dto.maxWorkGroups, 0, 10000),
      maxTeams: this.optionalInt(dto.maxTeams, 0, 10000),
      maxStorageMb: this.optionalInt(dto.maxStorageMb, 0, 10_000_000),
      maxMonthlyCheckIns: this.optionalInt(dto.maxMonthlyCheckIns, 0, 10_000_000),
      enabledModules: dto.enabledModules ? (this.jsonObject(dto.enabledModules) as Prisma.InputJsonValue) : undefined,
      allowWebCheckIn: this.booleanOrUndefined(dto.allowWebCheckIn),
      allowMobileCheckIn: this.booleanOrUndefined(dto.allowMobileCheckIn),
      allowPublicWebsite: this.booleanOrUndefined(dto.allowPublicWebsite),
      allowCustomDomain: this.booleanOrUndefined(dto.allowCustomDomain),
      allowSubdomain: this.booleanOrUndefined(dto.allowSubdomain),
      allowDvrReview: this.booleanOrUndefined(dto.allowDvrReview),
      allowFaceVerification: this.booleanOrUndefined(dto.allowFaceVerification),
    };
  }

  private officeData(organizationId: string, dto: OfficeInputDto, creating: boolean) {
    const exact = this.radius(dto.exactRadiusMeters, 'exactRadiusMeters', 1, 50000) ?? (creating ? 30 : undefined);
    const expanded = this.radius(dto.expandedRadiusMeters, 'expandedRadiusMeters', 1, 100000) ?? (creating ? 1000 : undefined);
    if (exact && expanded && expanded < exact) {
      throw new BadRequestException('expandedRadiusMeters must be greater than or equal to exactRadiusMeters.');
    }
    return {
      organizationId,
      parentBranchId: this.string(dto.parentBranchId),
      name: creating ? this.requiredString(dto.name, 'name') : this.string(dto.name),
      code: this.string(dto.code),
      type: dto.type ?? (creating ? OrganizationBranchType.BRANCH : undefined),
      address: this.string(dto.address),
      city: this.string(dto.city),
      country: this.string(dto.country),
      timezone: this.string(dto.timezone),
      latitude: this.latitude(dto.latitude),
      longitude: this.longitude(dto.longitude),
      exactRadiusMeters: exact,
      expandedRadiusMeters: expanded,
      isDefault: this.booleanOrUndefined(dto.isDefault),
      isActive: this.booleanOrUndefined(dto.isActive),
    };
  }

  private async attendanceLocationData(
    organizationId: string,
    dto: AttendanceLocationInputDto,
    creating: boolean,
    prisma: Pick<Tx, 'organizationBranch'> | PrismaService = this.prisma,
  ) {
    if (dto.officeId) await this.findOffice(organizationId, dto.officeId, prisma);
    const exact = this.radius(dto.exactRadiusMeters, 'exactRadiusMeters', 1, 50000) ?? (creating ? 30 : undefined);
    const expanded = this.radius(dto.expandedRadiusMeters, 'expandedRadiusMeters', 1, 100000) ?? (creating ? 1000 : undefined);
    if (exact && expanded && expanded < exact) {
      throw new BadRequestException('expandedRadiusMeters must be greater than or equal to exactRadiusMeters.');
    }
    return {
      organizationId,
      officeId: this.string(dto.officeId),
      name: creating ? this.requiredString(dto.name, 'name') : this.string(dto.name),
      latitude: creating ? this.requiredLatitude(dto.latitude) : this.latitude(dto.latitude),
      longitude: creating ? this.requiredLongitude(dto.longitude) : this.longitude(dto.longitude),
      exactRadiusMeters: exact,
      expandedRadiusMeters: expanded,
      allowedForWeb: this.booleanOrUndefined(dto.allowedForWeb),
      allowedForMobile: this.booleanOrUndefined(dto.allowedForMobile),
      requiresReviewOutsideExactRadius: this.booleanOrUndefined(dto.requiresReviewOutsideExactRadius),
      isActive: this.booleanOrUndefined(dto.isActive),
    };
  }

  private async wifiRuleData(
    organizationId: string,
    dto: WifiRuleInputDto,
    creating: boolean,
    prisma: Pick<Tx, 'organizationBranch'> | PrismaService = this.prisma,
  ) {
    if (dto.officeId) await this.findOffice(organizationId, dto.officeId, prisma);
    const ssid = this.string(dto.ssid);
    if (ssid && ssid.length > 32) throw new BadRequestException('SSID must be 32 characters or less.');
    const bssid = this.mac(dto.bssid, 'bssid');
    const macAddress = this.mac(dto.macAddress, 'macAddress');
    return {
      organizationId,
      officeId: this.string(dto.officeId),
      name: creating ? this.requiredString(dto.name ?? ssid, 'name') : this.string(dto.name),
      ssid,
      bssid,
      macAddress,
      description: this.string(dto.description),
      appliesTo: dto.appliesTo ?? (creating ? OrganizationWifiRuleAppliesTo.BOTH : undefined),
      isRequired: this.booleanOrUndefined(dto.isRequired),
      isActive: this.booleanOrUndefined(dto.isActive),
    };
  }

  private async domainData(
    organizationId: string,
    dto: DomainInputDto,
    creating: boolean,
    prisma: Pick<Tx, 'organizationDomainVerification'> | PrismaService = this.prisma,
  ) {
    const type = dto.type ?? (creating ? OrganizationDomainType.CUSTOM_DOMAIN : undefined);
    const domain = dto.domain ? this.normalizeDomain(dto.domain, type ?? OrganizationDomainType.CUSTOM_DOMAIN) : undefined;
    if (domain) await this.assertDomainAvailable(domain, organizationId, prisma);
    const redirectUrl = this.redirectUrl(dto.redirectUrl, dto.redirectMode);
    return {
      organizationId,
      domain: creating ? this.requiredString(domain, 'domain') : domain,
      type,
      status:
        dto.status ??
        (type === OrganizationDomainType.SUBDOMAIN || type === OrganizationDomainType.SYSTEM_SUBDOMAIN || type === OrganizationDomainType.PATH_ALIAS
          ? DomainVerificationStatus.VERIFIED
          : creating
            ? DomainVerificationStatus.PENDING
            : undefined),
      verificationToken: creating ? this.verificationToken() : undefined,
      verifiedAt:
        type === OrganizationDomainType.SUBDOMAIN ||
        type === OrganizationDomainType.SYSTEM_SUBDOMAIN ||
        type === OrganizationDomainType.PATH_ALIAS ||
        dto.status === DomainVerificationStatus.VERIFIED
          ? new Date()
          : undefined,
      isDefault: this.booleanOrUndefined(dto.isDefault),
      redirectMode: dto.redirectMode,
      redirectUrl,
      inboundSourceMode: dto.inboundSourceMode,
    };
  }

  private profileUpsert(dto: OrganizationProfileInputDto, platform = true) {
    const data = {
      legalName: this.string(dto.legalName),
      tradeName: this.string(dto.tradeName ?? dto.displayName),
      displayName: this.string(dto.displayName ?? dto.tradeName ?? dto.name),
      responsibleSubmitterName: this.string(dto.responsibleSubmitterName),
      responsibleSubmitterEmail: this.optionalEmail(dto.responsibleSubmitterEmail),
      responsibleSubmitterPhone: normalizeOptionalPhoneOrThrow(dto.responsibleSubmitterPhone, 'responsible submitter phone'),
      commercialRegNumber: platform ? this.string(dto.commercialRegisterNumber ?? dto.registrationNumber) : undefined,
      commercialRegisterNumber: platform ? this.string(dto.commercialRegisterNumber ?? dto.registrationNumber) : undefined,
      commercialRegisterOffice: platform ? this.string(dto.commercialRegisterOffice) : undefined,
      commercialRegisterIssuedAt: platform ? this.date(dto.commercialRegisterIssuedAt) : undefined,
      commercialRegisterExpiresAt: platform ? this.date(dto.commercialRegisterExpiresAt) : undefined,
      registrationNumber: platform ? this.string(dto.registrationNumber) : undefined,
      taxNumber: platform ? this.string(dto.taxNumber) : undefined,
      vatNumber: platform ? this.string(dto.vatNumber) : undefined,
      taxOffice: platform ? this.string(dto.taxOffice) : undefined,
      legalForm: platform && dto.legalForm ? this.enumValue(OrganizationLegalForm, dto.legalForm, 'legalForm') : undefined,
      incorporationDate: platform ? this.date(dto.incorporationDate) : undefined,
      countryCode: this.string(dto.countryCode ?? dto.country),
      regionCode: this.string(dto.regionCode),
      cityCode: this.string(dto.cityCode),
      cityName: this.string(dto.cityName ?? dto.city),
      addressLine1: this.string(dto.addressLine1 ?? dto.address),
      addressLine2: this.string(dto.addressLine2),
      postalCode: this.string(dto.postalCode),
      preferredLanguage: this.string(dto.preferredLanguage ?? dto.defaultLanguage),
      defaultCurrency: this.string(dto.defaultCurrency ?? dto.currency),
      website: this.string(dto.website),
      phone: this.string(dto.businessPhone),
      email: this.optionalEmail(dto.businessEmail),
      publicEmail: this.optionalEmail(dto.publicEmail ?? dto.businessEmail),
      publicPhone: this.string(dto.publicPhone ?? dto.businessPhone),
      address: this.string(dto.address),
      logoUrl: this.string(dto.logoUrl),
    };
    return { create: data, update: data };
  }

  private async ensureRole(db: RoleProvisioningClient, organizationId: string, roleName: string) {
    const role = await db.role.upsert({
      where: { organizationId_name: { organizationId, name: roleName } },
      create: { organizationId, name: roleName, isSystem: true, description: `Organization role: ${roleName}` },
      update: {},
    });
    const permissionKeys = [...new Set(ROLE_PERMISSIONS[roleName] ?? ROLE_PERMISSIONS.company_admin)];
    await db.permission.createMany({
      data: permissionKeys.map((key) => ({ key, description: `Base permission: ${key}` })),
      skipDuplicates: true,
    });
    const permissions = await db.permission.findMany({
      where: { key: { in: permissionKeys } },
      select: { id: true },
    });
    await db.rolePermission.createMany({
      data: permissions.map((permission) => ({ roleId: role.id, permissionId: permission.id })),
      skipDuplicates: true,
    });
    return role;
  }

  private firstAdminAlreadyExists() {
    return new ConflictException({
      code: 'FIRST_ADMIN_ALREADY_EXISTS',
      message: 'This organization already has an owner or administrator.',
    });
  }

  private duplicateFirstAdminEmail() {
    return new ConflictException({
      code: 'DUPLICATE_EMAIL',
      message: 'Admin email is already registered.',
    });
  }

  private mapFirstAdminPersistenceError(error: unknown, requestId?: string): unknown {
    if (error instanceof ConflictException || error instanceof NotFoundException) return error;
    const code = this.prismaErrorCode(error);
    if (code === 'P2002' && this.prismaUniqueTargetIncludes(error, 'email')) {
      return this.duplicateFirstAdminEmail();
    }
    if (code === 'P2002' || code === 'P2028' || code === 'P2034') {
      return new ServiceUnavailableException(
        {
          code: 'FIRST_ADMIN_TEMPORARILY_UNAVAILABLE',
          message: 'The first administrator could not be created safely. Please retry.',
          ...(requestId ? { requestId } : {}),
        },
        { cause: error },
      );
    }
    return error;
  }

  private prismaUniqueTargetIncludes(error: unknown, field: string) {
    if (!error || typeof error !== 'object' || !('meta' in error)) return false;
    const target = (error as { meta?: { target?: unknown } }).meta?.target;
    const values = Array.isArray(target) ? target : [target];
    return values.some((value) => typeof value === 'string' && value.toLowerCase().includes(field.toLowerCase()));
  }

  private recordFirstAdminTiming(
    context: FirstAdminRequestContext,
    stage: 'validation' | 'hash' | 'roleProvisioning' | 'dbTransaction' | 'audit',
    startedAt: number,
  ) {
    try {
      context.onTiming?.(stage, Math.max(0, performance.now() - startedAt));
    } catch {
      // Test-only instrumentation must never affect provisioning behavior.
    }
  }

  private userRoleForOrganization(type: OrganizationType, roleName: string) {
    if (type === OrganizationType.PLATFORM) {
      throw new BadRequestException('Platform organizations cannot be provisioned through the first-admin flow.');
    }
    if (type === OrganizationType.INDIVIDUAL_BROKER) return UserRole.INDIVIDUAL_BROKER;
    if (type === OrganizationType.BROKERAGE) {
      return roleName === 'company_owner' ? UserRole.BROKERAGE_OWNER : UserRole.BROKERAGE_ADMIN;
    }
    return roleName === 'company_owner' ? UserRole.DEVELOPER_OWNER : UserRole.DEVELOPER_ADMIN;
  }

  private assertFirstAdminRoleTemplate(type: OrganizationType, roleTemplate?: string) {
    const role = this.firstAdminRoleTemplate(type, roleTemplate);
    const allowed = type === OrganizationType.INDIVIDUAL_BROKER
      ? ['company_owner']
      : type === OrganizationType.DEVELOPER || type === OrganizationType.BROKERAGE
        ? ['company_owner', 'company_admin']
        : [];
    if (!allowed.includes(role)) {
      throw new BadRequestException('roleTemplate is not valid for this organization type.');
    }
  }

  private firstAdminRoleTemplate(type: OrganizationType, roleTemplate?: string) {
    return roleTemplate ?? (type === OrganizationType.INDIVIDUAL_BROKER ? 'company_owner' : 'company_admin');
  }

  private qualifiedAdminRoles(type: OrganizationType): UserRole[] {
    if (type === OrganizationType.DEVELOPER) {
      return [UserRole.DEVELOPER_OWNER, UserRole.DEVELOPER_ADMIN];
    }
    if (type === OrganizationType.BROKERAGE) {
      return [UserRole.BROKERAGE_OWNER, UserRole.BROKERAGE_ADMIN];
    }
    if (type === OrganizationType.INDIVIDUAL_BROKER) {
      return [UserRole.INDIVIDUAL_BROKER];
    }
    return [];
  }

  private assertFirstAdminPlatformActor(user: AuthenticatedRequestUser) {
    if (
      !isPlatformUser(user) ||
      !['platform_owner', 'platform_admin'].includes(user.role) ||
      !user.permissions.includes('platform.organizations.manage')
    ) {
      throw new ForbiddenException('Platform Owner or Platform Admin permission is required.');
    }
  }

  private async nextEmployeeCode(tx: Tx, organizationId: string) {
    const count = await tx.hrEmployee.count({ where: { organizationId } });
    return `EMP-${String(count + 1).padStart(5, '0')}`;
  }

  private async assertLimitsCanShrink(organizationId: string, dto: LimitsInputDto) {
    if (dto.maxEmployees !== undefined) {
      const count = await this.prisma.hrEmployee.count({ where: { organizationId } });
      if (dto.maxEmployees < count) {
        throw new BadRequestException('maxEmployees cannot be below current employee count.');
      }
    }
    if (dto.maxOffices !== undefined || dto.maxBranches !== undefined) {
      const count = await this.prisma.organizationBranch.count({ where: { organizationId } });
      const limit = dto.maxOffices ?? dto.maxBranches;
      if (limit !== undefined && limit < count) {
        throw new BadRequestException('Office limit cannot be below current office count.');
      }
    }
  }

  private async assertOfficeLimit(organizationId: string) {
    const [limits, offices] = await Promise.all([
      this.prisma.organizationLimits.findUnique({ where: { organizationId } }),
      this.prisma.organizationBranch.count({ where: { organizationId } }),
    ]);
    const max = limits?.maxOffices ?? limits?.maxBranches;
    if (max !== undefined && offices >= max) {
      throw new BadRequestException('Limit exceeded: office limit reached.');
    }
  }

  private async assertCustomDomainAllowed(organizationId: string, type?: OrganizationDomainType) {
    if (type && type !== OrganizationDomainType.CUSTOM_DOMAIN) return;
    const limits = await this.prisma.organizationLimits.findUnique({ where: { organizationId } });
    if (limits && !limits.allowCustomDomain) {
      throw new ForbiddenException('Custom domain is not allowed for this organization.');
    }
  }

  private async findOffice(
    organizationId: string,
    officeId: string,
    prisma: Pick<Tx, 'organizationBranch'> | PrismaService = this.prisma,
  ) {
    const office = await prisma.organizationBranch.findFirst({ where: { id: officeId, organizationId } });
    if (!office) throw new NotFoundException('Office not found.');
    return office;
  }

  private async findAttendanceLocation(organizationId: string, id: string) {
    const record = await this.prisma.organizationAttendanceLocation.findFirst({ where: { id, organizationId } });
    if (!record) throw new NotFoundException('Attendance location not found.');
    return record;
  }

  private async findWifiRule(organizationId: string, id: string) {
    const record = await this.prisma.organizationWifiRule.findFirst({ where: { id, organizationId } });
    if (!record) throw new NotFoundException('Wi-Fi rule not found.');
    return record;
  }

  private async findDomain(organizationId: string, id: string) {
    const record = await this.prisma.organizationDomainVerification.findFirst({ where: { id, organizationId } });
    if (!record) throw new NotFoundException('Domain not found.');
    return record;
  }

  private clearDefaultOffice(tx: Tx, organizationId: string) {
    return tx.organizationBranch.updateMany({ where: { organizationId }, data: { isDefault: false } });
  }

  private clearDefaultDomain(tx: Tx, organizationId: string) {
    return tx.organizationDomainVerification.updateMany({ where: { organizationId }, data: { isDefault: false } });
  }

  private assertPlatform(user: AuthenticatedRequestUser, permission: string) {
    if (!isPlatformUser(user)) throw new ForbiddenException('Platform access is required.');
    if (user.permissions.includes(permission) || PLATFORM_PERMISSIONS.some((item) => user.permissions.includes(item))) return;
    throw new ForbiddenException(`Missing permission: ${permission}.`);
  }

  private async assertPlatformCanReadOrganization(id: string, user: AuthenticatedRequestUser) {
    this.assertPlatform(user, 'platform.organizations.view');
    await this.findOrganization(id);
  }

  private assertCanManageCompanyResource(
    organizationId: string,
    user: AuthenticatedRequestUser,
    permissions: string[],
  ) {
    if (isPlatformUser(user)) {
      if (permissions.some((permission) => user.permissions.includes(permission)) || PLATFORM_PERMISSIONS.some((permission) => user.permissions.includes(permission))) return;
      throw new ForbiddenException('Platform organization permission is required.');
    }
    if (user.organizationId !== organizationId) throw new ForbiddenException('Cannot access another organization.');
    if (!COMPANY_ADMIN_ROLES.has(user.role)) throw new ForbiddenException('Company admin role is required.');
    this.assertAnyPermission(user, permissions);
  }

  private assertAnyPermission(user: AuthenticatedRequestUser, permissions: string[]) {
    if (permissions.some((permission) => user.permissions.includes(permission))) return;
    if (permissions.some((permission) => permission.startsWith('company.')) && user.permissions.includes('company.settings.manage')) return;
    throw new ForbiddenException(`Missing permission: ${permissions[0]}.`);
  }

  private async companyCode(input: string | undefined, slug: string) {
    const base = (this.string(input) ?? slug).toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '');
    let code = base || `ORG-${Date.now()}`;
    let suffix = 1;
    while (await this.prisma.organization.findUnique({ where: { companyCode: code } })) {
      suffix += 1;
      code = `${base}-${suffix}`;
    }
    return code;
  }

  private async uniqueSlug(value: string) {
    const base = this.slugify(value);
    let slug = base;
    let suffix = 1;
    while (await this.prisma.organization.findUnique({ where: { slug } })) {
      suffix += 1;
      slug = `${base}-${suffix}`;
    }
    return slug;
  }

  private async assertSlugAvailable(slug: string, exceptId: string) {
    const existing = await this.prisma.organization.findUnique({ where: { slug } });
    if (existing && existing.id !== exceptId) throw new ConflictException('slug must be unique.');
  }

  private async assertCompanyCodeAvailable(companyCode: string, exceptId: string) {
    const existing = await this.prisma.organization.findUnique({ where: { companyCode } });
    if (existing && existing.id !== exceptId) throw new ConflictException('company code must be unique.');
  }

  private async assertDomainAvailable(
    domain: string,
    organizationId: string,
    prisma: Pick<Tx, 'organizationDomainVerification'> | PrismaService = this.prisma,
  ) {
    const existing = await prisma.organizationDomainVerification.findFirst({
      where: { domain, organizationId: { not: organizationId } },
    });
    if (existing) throw new ConflictException('Domain is already registered for another organization.');
  }

  private normalizeDomain(domain: string, type: OrganizationDomainType) {
    const normalized = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/:\d+$/, '');
    if (!normalized) throw new BadRequestException('domain is required.');
    if (type === OrganizationDomainType.PATH_ALIAS) {
      const slug = normalized.replace(/^\/?(c|sites)\//, '').replace(/[^a-z0-9-]/g, '-').replace(/^-|-$/g, '');
      if (!slug) throw new BadRequestException('path alias is invalid.');
      return `/sites/${slug}`;
    }
    if (type === OrganizationDomainType.SUBDOMAIN || type === OrganizationDomainType.SYSTEM_SUBDOMAIN) {
      const subdomain = normalized.endsWith('.popwam.com') ? normalized.slice(0, -'.popwam.com'.length) : normalized;
      if (!subdomain.match(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/)) throw new BadRequestException('subdomain is invalid.');
      return `${subdomain}.popwam.com`;
    }
    if (!normalized.match(/^[a-z0-9.-]+\.[a-z]{2,}$/)) throw new BadRequestException('custom domain is invalid.');
    return normalized;
  }

  private redirectUrl(value: string | undefined, mode?: OrganizationRedirectMode) {
    const url = this.string(value);
    if (!url) return undefined;
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new BadRequestException('redirectUrl is invalid.');
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new BadRequestException('redirectUrl must use http or https.');
    }
    if (mode && mode !== OrganizationRedirectMode.REDIRECT_TO_EXTERNAL) {
      throw new BadRequestException('redirectUrl is only allowed for external redirect mode.');
    }
    return parsed.toString();
  }

  private assertSubscriptionDates(dto: SubscriptionInputDto) {
    const startsAt = this.date(dto.startsAt);
    const endsAt = this.date(dto.endsAt);
    const trialEndsAt = this.date(dto.trialEndsAt);
    if (startsAt && endsAt && endsAt <= startsAt) {
      throw new BadRequestException('subscription end must be after start.');
    }
    if (startsAt && trialEndsAt && trialEndsAt < startsAt) {
      throw new BadRequestException('trial end must be after subscription start.');
    }
  }

  private organizationStatus(value: string | undefined) {
    if (!value) return OrganizationStatus.DRAFT;
    const normalized = value.toUpperCase();
    if (normalized === 'ARCHIVED') return OrganizationStatus.REVOKED;
    return this.enumValue(OrganizationStatus, normalized, 'status');
  }

  private systemDomain(slug: string) {
    if (process.env.ENABLE_DOMAIN_MANAGEMENT !== 'true') return null;
    if (process.env.ENABLE_WILDCARD_SUBDOMAINS !== 'true') return null;
    const pattern = process.env.COMPANY_DEFAULT_DOMAIN_PATTERN?.trim();
    if (pattern?.includes('{slug}')) return pattern.replaceAll('{slug}', slug);
    const root = process.env.PUBLIC_ROOT_DOMAIN?.trim();
    return root ? `${slug}.${root}` : null;
  }

  private assertDomainManagementEnabled() {
    if (process.env.ENABLE_DOMAIN_MANAGEMENT !== 'true') {
      throw new NotFoundException('Domain management is disabled.');
    }
  }

  private withPortalLinks(organization: any) {
    const defaultDomain = organization.domainVerifications?.find((item: any) => item.isDefault);
    const wildcardEnabled = process.env.ENABLE_WILDCARD_SUBDOMAINS === 'true';
    const systemSubdomain = wildcardEnabled ? this.systemDomain(organization.slug) : null;
    return {
      ...organization,
      profile: organization.profile ?? null,
      subscription: organization.subscription ?? null,
      limits: organization.limits ?? null,
      branches: organization.branches ?? [],
      attendanceLocations: organization.attendanceLocations ?? [],
      wifiRules: organization.wifiRules ?? [],
      domainVerifications: organization.domainVerifications ?? [],
      companyRoleTemplates: organization.companyRoleTemplates ?? [],
      portalLinks: {
        systemSubdomain,
        fallbackPath: `${this.domainDefaults().fallbackPath}/${organization.slug}`,
        defaultDomain: defaultDomain?.domain ?? null,
        wildcardDnsRequired: !wildcardEnabled,
      },
    };
  }

  private record(
    actor: AuthenticatedRequestUser,
    action: string,
    entityType: string,
    entityId: string,
    organizationId = actor.organizationId,
    metadata?: Record<string, unknown>,
  ) {
    return this.auditLogs.record({ action, entityType, entityId, organizationId, actor, metadata });
  }

  private async assertOfficeParent(organizationId: string, dto: OfficeInputDto, currentId?: string) {
    const type = dto.type ?? OrganizationBranchType.BRANCH;
    const isBranch = type === OrganizationBranchType.BRANCH || type === OrganizationBranchType.HEAD_OFFICE;
    if (isBranch && dto.parentBranchId) throw new BadRequestException('A branch cannot belong to another branch.');
    if (isBranch || (!dto.parentBranchId && currentId)) return;
    if (!dto.parentBranchId) throw new BadRequestException('Every office must belong to a branch.');
    const parent = await this.prisma.organizationBranch.findFirst({ where: { id: dto.parentBranchId, organizationId } });
    if (!parent || !new Set<OrganizationBranchType>([OrganizationBranchType.BRANCH, OrganizationBranchType.HEAD_OFFICE]).has(parent.type)) {
      throw new BadRequestException('Select a valid branch for this office.');
    }
  }

  private async ensureDefaultNavigationConfiguration() {
    const count = await this.prisma.platformNavigationConfiguration.count();
    if (count) return;
    await this.prisma.$transaction(async (tx) => this.createDefaultNavigationConfiguration(tx));
  }

  private async createDefaultNavigationConfiguration(tx: Tx) {
    for (const [index, [sectionKey, localizedTitle]] of DEFAULT_NAVIGATION_SECTIONS.entries()) {
      await tx.platformNavigationConfiguration.upsert({
        where: { sectionKey },
        create: { sectionKey, localizedTitle, sortOrder: index, isVisible: true, allowedItemKeys: [] },
        update: {},
      });
    }
  }

  private localizedTitle(value: unknown) {
    const source = this.jsonObject(value);
    const normalized: Record<string, string> = {};
    for (const locale of ['en', 'ar', 'fr']) {
      const title = this.string(source[locale]);
      if (title) normalized[locale] = title.slice(0, 80);
    }
    if (!normalized.en) throw new BadRequestException('English section title is required.');
    normalized.ar ??= normalized.en;
    normalized.fr ??= normalized.en;
    return normalized as Prisma.InputJsonValue;
  }

  private stringArray(value: unknown) {
    return [...new Set((Array.isArray(value) ? value : [])
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean))];
  }

  private platformMetadataData(dto: PlatformMetadataInputDto, creating: boolean) {
    const allowedCategories = new Set(['COUNTRY', 'CURRENCY', 'LANGUAGE', 'ORGANIZATION_TYPE', 'MODULE', 'VERIFICATION_RULE', 'SUBSCRIPTION_DEFAULT', 'AUTHENTICATION_METHOD']);
    const category = this.string(dto.category)?.toUpperCase();
    if ((creating || category) && (!category || !allowedCategories.has(category))) {
      throw new BadRequestException('Metadata category is invalid.');
    }
    const code = this.string(dto.code)?.toUpperCase();
    if (code && !/^[A-Z0-9][A-Z0-9_-]{0,63}$/.test(code)) {
      throw new BadRequestException('Metadata code is invalid.');
    }
    if (category === 'COUNTRY' && code && !/^[A-Z]{2,3}$/.test(code)) {
      throw new BadRequestException('Country code must contain 2 or 3 letters.');
    }
    if (category === 'CURRENCY' && code && !/^[A-Z]{3}$/.test(code)) {
      throw new BadRequestException('Currency code must contain 3 letters.');
    }
    if (category === 'LANGUAGE' && code && !/^[A-Z]{2,3}(?:-[A-Z0-9]{2,8})?$/.test(code)) {
      throw new BadRequestException('Language code is invalid.');
    }
    if (category === 'AUTHENTICATION_METHOD' && code && !SUPPORTED_LOGIN_METHODS.has(code)) {
      throw new BadRequestException('Authentication method is not implemented.');
    }
    return {
      category,
      code: creating ? this.requiredString(code, 'code') : code,
      localizedName: creating || dto.localizedName ? this.localizedMetadataName(dto.localizedName) : undefined,
      configuration: dto.configuration ? this.jsonObject(dto.configuration) as Prisma.InputJsonValue : undefined,
      sortOrder: this.optionalInt(dto.sortOrder, 0, 100000),
      isActive: this.booleanOrUndefined(dto.isActive),
      isArchived: this.booleanOrUndefined(dto.isArchived),
    };
  }

  private localizedMetadataName(value: unknown) {
    const source = this.jsonObject(value);
    const normalized: Record<string, string> = {};
    for (const [locale, candidate] of Object.entries(source)) {
      if (!/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})?$/.test(locale)) continue;
      const title = this.string(candidate);
      if (title) normalized[locale.toLowerCase()] = title.slice(0, 120);
    }
    if (!normalized.en) throw new BadRequestException('English metadata name is required as a core fallback.');
    return normalized as Prisma.InputJsonValue;
  }

  private async validateMetadataConfiguration(dto: PlatformMetadataInputDto, currentId?: string) {
    const category = dto.category?.trim().toUpperCase();
    const code = dto.code?.trim().toUpperCase();
    const config = dto.configuration ?? {};
    if (category === 'LANGUAGE') {
      const direction = typeof config.direction === 'string' ? config.direction.toUpperCase() : 'LTR';
      if (!['RTL', 'LTR'].includes(direction)) throw new BadRequestException('Language direction must be RTL or LTR.');
      if (config.fallbackLanguageCode && String(config.fallbackLanguageCode).toUpperCase() === code) throw new BadRequestException('A language cannot fall back to itself.');
      if (config.isDefault === true && (dto.isActive === false || dto.isArchived === true)) throw new BadRequestException('The default language must remain active and unarchived.');
    }
    if (category === 'COUNTRY') {
      const defaultCurrencyCode = typeof config.defaultCurrencyCode === 'string' ? config.defaultCurrencyCode.trim().toUpperCase() : undefined;
      const allowed = Array.isArray(config.allowedCurrencyCodes) ? config.allowedCurrencyCodes.filter((item): item is string => typeof item === 'string').map((item) => item.trim().toUpperCase()) : [];
      if (defaultCurrencyCode && !allowed.includes(defaultCurrencyCode)) throw new BadRequestException('Country default currency must be included in allowedCurrencyCodes.');
      for (const currencyCode of new Set(allowed)) {
        const currency = await this.prisma.platformMetadataRecord.findUnique({ where: { category_code: { category: 'CURRENCY', code: currencyCode } } });
        if (!currency || !currency.isActive || currency.isArchived) throw new BadRequestException(`Country currency ${currencyCode} is not active.`);
      }
    }
    if (category === 'CURRENCY' && code && !/^[A-Z]{3}$/.test(code)) throw new BadRequestException('Currency code must follow ISO 4217 format.');
    if (currentId && dto.isArchived && dto.isActive) throw new BadRequestException('Archived metadata cannot remain active.');
  }

  private metadataIsDefault(configuration: Prisma.JsonValue) {
    return Boolean(configuration && typeof configuration === 'object' && !Array.isArray(configuration) && (configuration as Record<string, unknown>).isDefault === true);
  }

  private async clearDefaultLanguage(exceptId?: string) {
    const records = await this.prisma.platformMetadataRecord.findMany({ where: { category: 'LANGUAGE', ...(exceptId ? { id: { not: exceptId } } : {}) } });
    const updates = records.filter((record) => this.metadataIsDefault(record.configuration)).map((record) => this.prisma.platformMetadataRecord.update({ where: { id: record.id }, data: { configuration: { ...(record.configuration as Record<string, unknown>), isDefault: false } as Prisma.InputJsonValue } }));
    if (updates.length) await this.prisma.$transaction(updates);
  }

  private async metadataDeletionImpact(category: string, code: string) {
    if (category === 'LANGUAGE') {
      const [organizations, profiles] = await Promise.all([this.prisma.organization.count({ where: { defaultLanguage: { equals: code, mode: 'insensitive' } } }), this.prisma.organizationProfile.count({ where: { preferredLanguage: { equals: code, mode: 'insensitive' } } })]);
      return { references: organizations + profiles, organizations, profiles };
    }
    if (category === 'CURRENCY') {
      const [organizations, profiles, plans] = await Promise.all([this.prisma.organization.count({ where: { currency: { equals: code, mode: 'insensitive' } } }), this.prisma.organizationProfile.count({ where: { defaultCurrency: { equals: code, mode: 'insensitive' } } }), this.prisma.platformPlan.count({ where: { priceCurrency: code } })]);
      return { references: organizations + profiles + plans, organizations, profiles, plans };
    }
    if (category === 'COUNTRY') {
      const [organizations, profiles, policies] = await Promise.all([this.prisma.organization.count({ where: { country: { equals: code, mode: 'insensitive' } } }), this.prisma.organizationProfile.count({ where: { countryCode: { equals: code, mode: 'insensitive' } } }), this.prisma.requiredDocumentPolicy.count({ where: { countryCode: code } })]);
      return { references: organizations + profiles + policies, organizations, profiles, policies };
    }
    return { references: 0 };
  }

  private r2Configured() {
    const prefixes = [
      'PUBLIC_MEDIA',
      'PROJECT_MEDIA',
      'COMPANY_DOCUMENTS',
      'CHAT_ATTACHMENTS',
      'HR_DOCUMENTS',
      'ATTENDANCE_EVIDENCE',
      'QUARANTINE_UPLOADS',
    ];
    return Boolean(process.env.R2_ENDPOINT) && prefixes.every((prefix) =>
      [`R2_${prefix}_BUCKET`, `R2_${prefix}_ACCESS_KEY_ID`, `R2_${prefix}_SECRET_ACCESS_KEY`]
        .every((key) => Boolean(process.env[key]?.trim())),
    );
  }

  private localMigrationNames() {
    const candidates = [
      resolve(process.cwd(), 'prisma', 'migrations'),
      resolve(process.cwd(), 'apps', 'api', 'prisma', 'migrations'),
      resolve(__dirname, '..', '..', '..', 'prisma', 'migrations'),
    ];
    const directory = candidates.find((candidate) => existsSync(candidate));
    if (!directory) return null;
    return readdirSync(directory, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  }

  private string(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private requiredString(value: unknown, field: string) {
    const result = this.string(value);
    if (!result) throw new BadRequestException(`${field} is required.`);
    return result;
  }

  private optionalEmail(value: unknown) {
    const email = this.string(value)?.toLowerCase();
    if (!email) return undefined;
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) throw new BadRequestException('email is invalid.');
    return email;
  }

  private date(value: unknown) {
    const raw = this.string(value);
    if (!raw) return undefined;
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) throw new BadRequestException('date is invalid.');
    return date;
  }

  private int(value: unknown, fallback: number, min: number, max: number) {
    return this.optionalInt(value, min, max) ?? fallback;
  }

  private optionalInt(value: unknown, min: number, max: number) {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
      throw new BadRequestException(`number must be between ${min} and ${max}.`);
    }
    return parsed;
  }

  private decimal(value: unknown, field: string) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new BadRequestException(`${field} must be a positive number.`);
    }
    return parsed;
  }

  private latitude(value: unknown) {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < -90 || parsed > 90) throw new BadRequestException('latitude is invalid.');
    return parsed;
  }

  private longitude(value: unknown) {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < -180 || parsed > 180) throw new BadRequestException('longitude is invalid.');
    return parsed;
  }

  private requiredLatitude(value: unknown) {
    const result = this.latitude(value);
    if (result === undefined) throw new BadRequestException('latitude is required.');
    return result;
  }

  private requiredLongitude(value: unknown) {
    const result = this.longitude(value);
    if (result === undefined) throw new BadRequestException('longitude is required.');
    return result;
  }

  private radius(value: unknown, field: string, min: number, max: number) {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
      throw new BadRequestException(`${field} must be between ${min} and ${max}.`);
    }
    return parsed;
  }

  private mac(value: unknown, field: string) {
    const text = this.string(value);
    if (!text) return undefined;
    if (!text.match(/^([0-9a-f]{2}[:-]){5}[0-9a-f]{2}$/i)) {
      throw new BadRequestException(`${field} is invalid.`);
    }
    return text.toLowerCase().replaceAll('-', ':');
  }

  private jsonObject(value: unknown) {
    if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
    return {};
  }

  private booleanOrUndefined(value: unknown) {
    return typeof value === 'boolean' ? value : undefined;
  }

  private enumValue<T extends Record<string, string>>(source: T, value: unknown, field: string) {
    if (field === 'organizationType') {
      return requireCanonicalOrganizationType(value) as T[keyof T];
    }
    const normalized = this.string(value);
    if (normalized && Object.values(source).includes(normalized)) return normalized as T[keyof T];
    throw new BadRequestException(
      `${field} is invalid. Allowed values: ${Object.values(source).join(', ')}.`,
    );
  }

  private slugify(value: string) {
    return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `organization-${Date.now()}`;
  }

  private verificationToken() {
    return `popwam-domain-${randomBytes(24).toString('hex')}`;
  }
}

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DomainVerificationStatus,
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
import { normalizeOptionalPhoneOrThrow } from '../../common/phone-normalization';
import { isPlatformUser, requireCurrentOrganizationId } from '../../common/organization-scope';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { HashService } from '../auth/hash.service';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../database/prisma.service';
import { ROLE_PERMISSIONS } from '../permissions/rbac.seed';
import {
  AttendanceLocationInputDto,
  CreatePlatformCompanyDto,
  DomainInputDto,
  FirstAdminInputDto,
  LimitsInputDto,
  OfficeInputDto,
  OrganizationProfileInputDto,
  SubscriptionInputDto,
  WifiRuleInputDto,
} from './dto/company-provisioning.dto';

type Tx = Prisma.TransactionClient;

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
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
    private readonly hashService: HashService,
  ) {}

  listPlatformOrganizations(user: AuthenticatedRequestUser) {
    this.assertPlatform(user, 'platform.organizations.view');
    return this.prisma.organization.findMany({
      include: this.organizationInclude(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPlatformOrganization(
    dto: CreatePlatformCompanyDto,
    user: AuthenticatedRequestUser,
  ) {
    this.assertPlatform(user, 'platform.organizations.manage');
    const profile = dto.profile ?? dto;
    const type = this.enumValue(
      OrganizationType,
      profile.organizationType ?? profile.type ?? dto.organizationType ?? dto.type,
      'organizationType',
    );
    const name = this.requiredString(
      profile.displayName ?? profile.tradeName ?? profile.name ?? dto.name,
      'displayName',
    );
    const slug = await this.uniqueSlug(this.string(profile.slug) ?? name);
    const companyCode = await this.companyCode(profile.companyCode, slug);
    const status = this.organizationStatus(profile.status);
    const defaultDomain = this.systemDomain(slug);

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
          plan: this.string(dto.subscription?.planCode),
          planExpiresAt: this.date(dto.subscription?.endsAt),
          profile: {
            create: {
              legalName: this.string(profile.legalName),
              tradeName: this.string(profile.tradeName ?? profile.displayName),
              displayName: this.string(profile.displayName ?? profile.tradeName ?? name),
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
          subscription: { create: this.subscriptionCreate(dto.subscription) },
          limits: { create: this.limitsCreate(dto.limits) },
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
              isPublished: status === OrganizationStatus.APPROVED,
            },
          },
          publicSiteSettings: {
            create: {
              mode: status === OrganizationStatus.APPROVED ? 'PORTAL' : 'DISABLED',
              theme: 'REAL_ESTATE',
              defaultLanguage: this.string(profile.defaultLanguage) ?? 'en',
              supportedLanguages: ['en', 'ar', 'fr'],
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
          domainVerifications: {
            create: {
              domain: defaultDomain,
              type: OrganizationDomainType.SYSTEM_SUBDOMAIN,
              status: DomainVerificationStatus.VERIFIED,
              verificationToken: this.verificationToken(),
              verifiedAt: new Date(),
              isDefault: true,
              statusNote: 'system_domain_auto_created',
              redirectMode: OrganizationRedirectMode.PROXY_OR_SHOW_COMPANY_PROFILE,
            },
          },
        },
      });

      const officeMap = await this.createInitialOffices(tx, organization.id, dto.offices ?? []);
      await this.createInitialAttendanceLocations(
        tx,
        organization.id,
        dto.attendanceLocations ?? [],
        officeMap,
      );
      await this.createInitialWifiRules(tx, organization.id, dto.wifiRules ?? [], officeMap);
      await this.createInitialDomains(tx, organization.id, dto.domains ?? []);
      const adminUser = dto.adminUser
        ? await this.createFirstAdmin(tx, organization.id, type, dto.adminUser)
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
    this.assertSubscriptionDates(dto);
    const updated = await this.prisma.organizationSubscription.upsert({
      where: { organizationId: id },
      create: { organizationId: id, ...this.subscriptionCreate(dto) },
      update: this.subscriptionUpdate(dto),
    });
    await this.prisma.organization.update({
      where: { id },
      data: { plan: updated.planCode, planExpiresAt: updated.endsAt },
    });
    await this.record(user, 'platform.organization.subscription_updated', 'OrganizationSubscription', updated.id, id);
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
      users: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
    } as const;
  }

  private async findOrganizationForPlatform(id: string) {
    return this.prisma.organization.findUniqueOrThrow({
      where: { id },
      include: this.organizationInclude(),
    });
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
    organizationType: OrganizationType,
    dto: FirstAdminInputDto,
  ) {
    const email = this.optionalEmail(dto.email);
    if (!email) throw new BadRequestException('admin email is required.');
    const existing = await tx.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Admin email is already registered.');
    const roleName = dto.roleTemplate ?? 'company_admin';
    const role = await this.ensureRole(tx, organizationId, roleName);
    const name = this.requiredString(dto.name, 'admin name');
    const [firstName, ...rest] = name.split(/\s+/);
    const phone = normalizeOptionalPhoneOrThrow(dto.phone, 'admin phone', dto.phoneCountry);
    const user = await tx.user.create({
      data: {
        organizationId,
        roleId: role.id,
        email,
        phone,
        firstName,
        lastName: rest.join(' ') || undefined,
        passwordHash: await this.hashService.hash(dto.temporaryPassword || '123456'),
        mustChangePassword: true,
        userRole: this.userRoleForOrganization(organizationType, roleName),
      },
    });
    await tx.hrEmployee.create({
      data: {
        organizationId,
        userId: user.id,
        employeeCode: await this.nextEmployeeCode(tx, organizationId),
        name,
        legalName: name,
        displayName: name,
        email,
        phone,
        loginEnabled: true,
        roleTitle: roleName.replaceAll('_', ' '),
      },
    });
    return user;
  }

  private subscriptionCreate(dto?: SubscriptionInputDto) {
    this.assertSubscriptionDates(dto ?? {});
    return {
      planCode: this.string(dto?.planCode) ?? 'starter',
      planName: this.string(dto?.planName) ?? 'Starter',
      status: dto?.status ?? OrganizationSubscriptionStatus.TRIAL,
      startsAt: this.date(dto?.startsAt) ?? new Date(),
      endsAt: this.date(dto?.endsAt),
      trialEndsAt: this.date(dto?.trialEndsAt),
      billingCycle: dto?.billingCycle ?? OrganizationBillingCycle.MONTHLY,
      autoRenew: Boolean(dto?.autoRenew),
      notes: this.string(dto?.notes),
    };
  }

  private subscriptionUpdate(dto: SubscriptionInputDto) {
    return {
      planCode: this.string(dto.planCode),
      planName: this.string(dto.planName),
      status: dto.status,
      startsAt: this.date(dto.startsAt),
      endsAt: this.date(dto.endsAt),
      trialEndsAt: this.date(dto.trialEndsAt),
      billingCycle: dto.billingCycle,
      autoRenew: typeof dto.autoRenew === 'boolean' ? dto.autoRenew : undefined,
      notes: this.string(dto.notes),
    };
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

  private async ensureRole(tx: Tx, organizationId: string, roleName: string) {
    const role = await tx.role.upsert({
      where: { organizationId_name: { organizationId, name: roleName } },
      create: { organizationId, name: roleName, isSystem: true, description: `Organization role: ${roleName}` },
      update: {},
    });
    for (const permissionKey of ROLE_PERMISSIONS[roleName] ?? ROLE_PERMISSIONS.company_admin) {
      const permission = await tx.permission.upsert({
        where: { key: permissionKey },
        create: { key: permissionKey, description: `Base permission: ${permissionKey}` },
        update: {},
      });
      await tx.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        create: { roleId: role.id, permissionId: permission.id },
        update: {},
      });
    }
    return role;
  }

  private userRoleForOrganization(type: OrganizationType, roleName: string) {
    if (type === OrganizationType.PLATFORM) return UserRole.PLATFORM_ADMIN;
    if (type === OrganizationType.BROKERAGE || type === OrganizationType.INDIVIDUAL_BROKER) {
      return roleName === 'company_owner' ? UserRole.BROKERAGE_OWNER : UserRole.BROKERAGE_ADMIN;
    }
    return roleName === 'company_owner' ? UserRole.DEVELOPER_OWNER : UserRole.DEVELOPER_ADMIN;
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
    if (normalized === 'ACTIVE') return OrganizationStatus.APPROVED;
    if (normalized === 'ARCHIVED' || normalized === 'EXPIRED') return OrganizationStatus.REVOKED;
    return this.enumValue(OrganizationStatus, normalized, 'status');
  }

  private systemDomain(slug: string) {
    return `${slug}.popwam.com`;
  }

  private withPortalLinks(organization: any) {
    const defaultDomain = organization.domainVerifications?.find((item: any) => item.isDefault);
    return {
      ...organization,
      portalLinks: {
        systemSubdomain: `${organization.slug}.popwam.com`,
        fallbackPath: `/sites/${organization.slug}`,
        defaultDomain: defaultDomain?.domain ?? null,
        wildcardDnsRequired: true,
      },
    };
  }

  private record(
    actor: AuthenticatedRequestUser,
    action: string,
    entityType: string,
    entityId: string,
    organizationId = actor.organizationId,
  ) {
    return this.auditLogs.record({ action, entityType, entityId, organizationId, actor });
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
    const normalized = this.string(value)?.toUpperCase().replaceAll('-', '_').replaceAll(' ', '_');
    if (normalized && Object.values(source).includes(normalized)) return normalized as T[keyof T];
    throw new BadRequestException(`${field} is invalid.`);
  }

  private slugify(value: string) {
    return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `organization-${Date.now()}`;
  }

  private verificationToken() {
    return `popwam-domain-${randomBytes(24).toString('hex')}`;
  }
}

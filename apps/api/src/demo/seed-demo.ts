import { PrismaPg } from '@prisma/adapter-pg';
import {
  AvailabilityHoldType,
  CommissionPartyType,
  CommissionStatus,
  CommissionType,
  DealRoomMessageType,
  DealRoomParticipantRole,
  DealRoomParticipantStatus,
  DealRoomStatus,
  DealStatus,
  LeadClaimStatus,
  LeadSource,
  LeadStatus,
  PrismaClient,
  ProjectStatus,
  ProjectType,
  ProjectVisibility,
  ReservationRequestStatus,
  UnitStatus,
  UnitType,
  UnitVisibility,
} from '@prisma/client';
import { createHmac } from 'node:crypto';
import { HashService } from '../modules/auth/hash.service';
import { ROLE_PERMISSIONS, seedBaseRolesAndPermissions } from '../modules/permissions/rbac.seed';

const DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/popwam?schema=public';

const DEMO_PASSWORDS = {
  platform: '30@@mmMM',
  default: 'Demo@123456',
};

const IDS = {
  platformOrg: 'demo_org_platform_popwam',
  platformOwnerRole: 'demo_role_platform_owner',
  platformOwner: 'demo_user_platform_owner',
  developerOrg: 'demo_org_developer_popwam',
  developerOwnerRole: 'demo_role_developer_owner',
  developerOwner: 'demo_user_developer_owner',
  brokerageOrg: 'demo_org_brokerage_popwam',
  brokerageOwnerRole: 'demo_role_brokerage_owner',
  brokerageOwner: 'demo_user_brokerage_owner',
  brokerRole: 'demo_role_broker',
  brokerUser: 'demo_user_broker',
  developerProfile: 'demo_developer_profile',
  brokerageProfile: 'demo_brokerage_profile',
  brokerProfile: 'demo_broker_profile',
  developerWebsiteSettings: 'demo_developer_website_settings',
  project: 'demo_project_northline',
  phase: 'demo_project_phase_one',
  availableUnit: 'demo_unit_available_1201',
  soldUnit: 'demo_unit_sold_901',
  paymentPlan: 'demo_payment_plan_project',
  agreement: 'demo_agreement_dev_brokerage',
  brokerAccess: 'demo_broker_access_brokerage',
  commissionRuleBrokerage: 'demo_commission_rule_brokerage',
  commissionRuleBroker: 'demo_commission_rule_broker',
  client: 'demo_client_sold_chain',
  lead: 'demo_lead_sold_chain',
  leadClaim: 'demo_lead_claim_sold_chain',
  reservation: 'demo_reservation_sold_chain',
  hold: 'demo_unit_hold_sold_chain',
  dealRoom: 'demo_deal_room_sold_chain',
  developerParticipant: 'demo_deal_room_participant_developer',
  brokerParticipant: 'demo_deal_room_participant_broker',
  clientParticipant: 'demo_deal_room_participant_client',
  message: 'demo_deal_room_message_intro',
  deal: 'demo_deal_sold_chain',
  brokerageCommission: 'demo_commission_brokerage',
  brokerCommission: 'demo_commission_broker',
};

const hashService = new HashService();

async function main() {
  const adapter = new PrismaPg({ connectionString: DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    await seedBaseRolesAndPermissions(prisma);

    const platformHash = await hashService.hash(DEMO_PASSWORDS.platform);
    const defaultHash = await hashService.hash(DEMO_PASSWORDS.default);
    const now = new Date();
    const claimExpiresAt = new Date(now);
    claimExpiresAt.setDate(claimExpiresAt.getDate() + 60);

    const platform = await upsertOrganization(prisma, {
      id: IDS.platformOrg,
      name: 'POPWAM Platform',
      slug: 'popwam-platform',
      type: 'PLATFORM',
      status: 'APPROVED',
      city: 'Cairo',
      country: 'EG',
      email: 'ceo@popwam.com',
    });
    const developer = await upsertOrganization(prisma, {
      id: IDS.developerOrg,
      name: 'Demo Development Group',
      slug: 'demo-development-group',
      type: 'DEVELOPER',
      status: 'APPROVED',
      city: 'Cairo',
      country: 'EG',
      email: 'developer.demo@popwam.local',
    });
    const brokerage = await upsertOrganization(prisma, {
      id: IDS.brokerageOrg,
      name: 'Demo Brokerage Collective',
      slug: 'demo-brokerage-collective',
      type: 'BROKERAGE',
      status: 'APPROVED',
      city: 'Cairo',
      country: 'EG',
      email: 'brokerage.demo@popwam.local',
    });

    const platformRole = await ensureOrganizationRole(
      prisma,
      IDS.platformOwnerRole,
      platform.id,
      'platform_owner',
    );
    const developerRole = await ensureOrganizationRole(
      prisma,
      IDS.developerOwnerRole,
      developer.id,
      'developer_owner',
    );
    const brokerageRole = await ensureOrganizationRole(
      prisma,
      IDS.brokerageOwnerRole,
      brokerage.id,
      'brokerage_owner',
    );
    const brokerRole = await ensureOrganizationRole(
      prisma,
      IDS.brokerRole,
      brokerage.id,
      'broker',
    );

    const platformUser = await upsertUser(prisma, {
      id: IDS.platformOwner,
      organizationId: platform.id,
      roleId: platformRole.id,
      email: 'ceo@popwam.com',
      passwordHash: platformHash,
      firstName: 'POPWAM',
      lastName: 'CEO',
      userRole: 'PLATFORM_OWNER',
    });
    const developerUser = await upsertUser(prisma, {
      id: IDS.developerOwner,
      organizationId: developer.id,
      roleId: developerRole.id,
      email: 'developer.demo@popwam.local',
      passwordHash: defaultHash,
      firstName: 'Demo',
      lastName: 'Developer',
      userRole: 'DEVELOPER_OWNER',
    });
    const brokerageUser = await upsertUser(prisma, {
      id: IDS.brokerageOwner,
      organizationId: brokerage.id,
      roleId: brokerageRole.id,
      email: 'brokerage.demo@popwam.local',
      passwordHash: defaultHash,
      firstName: 'Demo',
      lastName: 'Brokerage',
      userRole: 'BROKERAGE_OWNER',
    });
    const brokerUser = await upsertUser(prisma, {
      id: IDS.brokerUser,
      organizationId: brokerage.id,
      roleId: brokerRole.id,
      email: 'broker.demo@popwam.local',
      passwordHash: defaultHash,
      firstName: 'Demo',
      lastName: 'Broker',
      userRole: 'BROKER',
    });

    await prisma.developerProfile.upsert({
      where: { organizationId: developer.id },
      create: {
        id: IDS.developerProfile,
        organizationId: developer.id,
        yearsInMarket: 10,
        totalUnitsDelivered: 1200,
        activeProjectsCount: 1,
      },
      update: {
        yearsInMarket: 10,
        totalUnitsDelivered: 1200,
        activeProjectsCount: 1,
      },
    });
    await prisma.brokerageProfile.upsert({
      where: { organizationId: brokerage.id },
      create: {
        id: IDS.brokerageProfile,
        organizationId: brokerage.id,
        brokerLicenseNumber: 'DEMO-BROKERAGE-LICENSE',
        activeBrokersCount: 1,
      },
      update: {
        brokerLicenseNumber: 'DEMO-BROKERAGE-LICENSE',
        activeBrokersCount: 1,
      },
    });
    await prisma.brokerProfile.upsert({
      where: { userId: brokerUser.id },
      create: {
        id: IDS.brokerProfile,
        userId: brokerUser.id,
        organizationId: brokerage.id,
        yearsExperience: 5,
        specializations: ['New Cairo', 'Primary market'],
        verificationStatus: 'APPROVED',
        verifiedById: platformUser.id,
      },
      update: {
        organizationId: brokerage.id,
        yearsExperience: 5,
        specializations: ['New Cairo', 'Primary market'],
        verificationStatus: 'APPROVED',
        verifiedById: platformUser.id,
      },
    });
    await prisma.organizationWebsiteSettings.upsert({
      where: { organizationId: developer.id },
      create: {
        id: IDS.developerWebsiteSettings,
        organizationId: developer.id,
        publicSlug: developer.slug,
        subdomain: 'developer-demo',
        customDomain: null,
        siteTitle: 'Demo Development Group',
        siteDescription: 'Demo public developer website for Stage 2 API smoke checks.',
        logoUrl: null,
        contactPhone: '+201000000000',
        contactEmail: 'developer.demo@popwam.local',
        whatsappUrl: 'https://wa.me/201000000000',
        isPublished: true,
      },
      update: {
        publicSlug: developer.slug,
        subdomain: 'developer-demo',
        customDomain: null,
        siteTitle: 'Demo Development Group',
        siteDescription: 'Demo public developer website for Stage 2 API smoke checks.',
        contactPhone: '+201000000000',
        contactEmail: 'developer.demo@popwam.local',
        whatsappUrl: 'https://wa.me/201000000000',
        isPublished: true,
      },
    });
    await prisma.organizationDomainVerification.upsert({
      where: {
        organizationId_domain: {
          organizationId: developer.id,
          domain: 'developer-demo.popwam.com',
        },
      },
      create: {
        organizationId: developer.id,
        domain: 'developer-demo.popwam.com',
        type: 'SUBDOMAIN',
        status: 'VERIFIED',
        verificationToken: 'demo-developer-subdomain-token',
        verifiedAt: now,
      },
      update: {
        status: 'VERIFIED',
        verifiedAt: now,
        failureReason: null,
      },
    });

    const project = await prisma.project.upsert({
      where: {
        developerId_slug: {
          developerId: developer.id,
          slug: 'northline-demo-residences',
        },
      },
      create: {
        id: IDS.project,
        developerId: developer.id,
        name: 'Northline Demo Residences',
        slug: 'northline-demo-residences',
        type: ProjectType.COMPOUND,
        status: ProjectStatus.ACTIVE,
        city: 'New Cairo',
        district: 'Golden Square',
        address: 'Demo District, New Cairo',
        description: 'Stable Phase 1 demo project for local walkthroughs.',
        visibility: ProjectVisibility.OPEN_MARKETPLACE,
        isFeatured: true,
        amenities: ['Clubhouse', 'Retail promenade', 'Parks'],
        images: [],
        videos: [],
      },
      update: {
        name: 'Northline Demo Residences',
        status: ProjectStatus.ACTIVE,
        city: 'New Cairo',
        district: 'Golden Square',
        visibility: ProjectVisibility.OPEN_MARKETPLACE,
        isFeatured: true,
      },
    });

    const phase = await prisma.projectPhase.upsert({
      where: { id: IDS.phase },
      create: {
        id: IDS.phase,
        projectId: project.id,
        name: 'Phase 1',
        totalUnits: 2,
        availableUnits: 1,
        status: ProjectStatus.ACTIVE,
      },
      update: {
        projectId: project.id,
        name: 'Phase 1',
        totalUnits: 2,
        availableUnits: 1,
        status: ProjectStatus.ACTIVE,
      },
    });

    await prisma.inventoryUnit.upsert({
      where: {
        projectId_unitNumber: {
          projectId: project.id,
          unitNumber: 'A-1201',
        },
      },
      create: {
        id: IDS.availableUnit,
        projectId: project.id,
        phaseId: phase.id,
        developerId: developer.id,
        unitNumber: 'A-1201',
        unitType: UnitType.APARTMENT,
        floor: '12',
        areaSqm: 145,
        bedrooms: 3,
        bathrooms: 2,
        basePrice: 4200000,
        currency: 'EGP',
        status: UnitStatus.AVAILABLE,
        visibility: UnitVisibility.INHERIT_PROJECT,
        images: [],
      },
      update: {
        phaseId: phase.id,
        developerId: developer.id,
        status: UnitStatus.AVAILABLE,
        visibility: UnitVisibility.INHERIT_PROJECT,
        basePrice: 4200000,
      },
    });

    const soldUnit = await prisma.inventoryUnit.upsert({
      where: {
        projectId_unitNumber: {
          projectId: project.id,
          unitNumber: 'A-0901',
        },
      },
      create: {
        id: IDS.soldUnit,
        projectId: project.id,
        phaseId: phase.id,
        developerId: developer.id,
        unitNumber: 'A-0901',
        unitType: UnitType.APARTMENT,
        floor: '9',
        areaSqm: 132,
        bedrooms: 2,
        bathrooms: 2,
        basePrice: 3800000,
        currency: 'EGP',
        status: UnitStatus.SOLD,
        visibility: UnitVisibility.INHERIT_PROJECT,
        images: [],
      },
      update: {
        phaseId: phase.id,
        developerId: developer.id,
        status: UnitStatus.SOLD,
        visibility: UnitVisibility.INHERIT_PROJECT,
        basePrice: 3800000,
      },
    });

    await prisma.paymentPlan.upsert({
      where: { id: IDS.paymentPlan },
      create: {
        id: IDS.paymentPlan,
        projectId: project.id,
        scope: 'PROJECT',
        name: 'Demo 10 Percent Down',
        downPaymentPct: 10,
        installmentMonths: 96,
        installmentPct: 80,
        onDeliveryPct: 10,
        maintenanceFee: 250000,
        isActive: true,
      },
      update: {
        projectId: project.id,
        name: 'Demo 10 Percent Down',
        downPaymentPct: 10,
        installmentMonths: 96,
        installmentPct: 80,
        onDeliveryPct: 10,
        maintenanceFee: 250000,
        isActive: true,
      },
    });

    await prisma.developerBrokerageAgreement.upsert({
      where: {
        developerId_brokerageId: {
          developerId: developer.id,
          brokerageId: brokerage.id,
        },
      },
      create: {
        id: IDS.agreement,
        developerId: developer.id,
        brokerageId: brokerage.id,
        status: 'ACTIVE',
        signedAt: now,
      },
      update: {
        status: 'ACTIVE',
        signedAt: now,
      },
    });

    await prisma.brokerAccessRule.upsert({
      where: {
        projectId_granteeType_granteeId: {
          projectId: project.id,
          granteeType: 'BROKERAGE',
          granteeId: brokerage.id,
        },
      },
      create: {
        id: IDS.brokerAccess,
        projectId: project.id,
        developerId: developer.id,
        granteeType: 'BROKERAGE',
        granteeId: brokerage.id,
        accessLevel: 'FULL',
        grantedById: developerUser.id,
      },
      update: {
        developerId: developer.id,
        accessLevel: 'FULL',
        grantedById: developerUser.id,
      },
    });

    const brokerageRule = await prisma.commissionRule.upsert({
      where: { id: IDS.commissionRuleBrokerage },
      create: {
        id: IDS.commissionRuleBrokerage,
        developerId: developer.id,
        projectId: project.id,
        partyType: CommissionPartyType.BROKERAGE,
        targetOrganizationId: brokerage.id,
        commissionType: CommissionType.PERCENTAGE,
        value: 2.5,
        currency: 'EGP',
        isActive: true,
        notes: 'Demo brokerage commission rule.',
      },
      update: {
        developerId: developer.id,
        projectId: project.id,
        targetOrganizationId: brokerage.id,
        value: 2.5,
        isActive: true,
      },
    });
    const brokerRule = await prisma.commissionRule.upsert({
      where: { id: IDS.commissionRuleBroker },
      create: {
        id: IDS.commissionRuleBroker,
        developerId: developer.id,
        projectId: project.id,
        partyType: CommissionPartyType.BROKER,
        targetUserId: brokerUser.id,
        commissionType: CommissionType.FIXED,
        value: 15000,
        currency: 'EGP',
        isActive: true,
        notes: 'Demo broker commission rule.',
      },
      update: {
        developerId: developer.id,
        projectId: project.id,
        targetUserId: brokerUser.id,
        value: 15000,
        isActive: true,
      },
    });

    const normalizedPhone = '201000000901';
    const phoneHash = hashPhone(normalizedPhone);
    const client = await prisma.client.upsert({
      where: {
        phoneHash_projectId: {
          phoneHash,
          projectId: project.id,
        },
      },
      create: {
        id: IDS.client,
        projectId: project.id,
        name: 'Demo Client',
        phoneHash,
        phoneLast4: normalizedPhone.slice(-4),
        source: LeadSource.MANUAL,
        createdById: brokerUser.id,
      },
      update: {
        name: 'Demo Client',
        source: LeadSource.MANUAL,
        createdById: brokerUser.id,
      },
    });

    const lead = await prisma.lead.upsert({
      where: { id: IDS.lead },
      create: {
        id: IDS.lead,
        clientId: client.id,
        projectId: project.id,
        unitId: soldUnit.id,
        brokerUserId: brokerUser.id,
        brokerageId: brokerage.id,
        status: LeadStatus.RESERVATION,
        source: LeadSource.MANUAL,
        notes: 'Demo sold-chain lead.',
      },
      update: {
        clientId: client.id,
        projectId: project.id,
        unitId: soldUnit.id,
        brokerUserId: brokerUser.id,
        brokerageId: brokerage.id,
        status: LeadStatus.RESERVATION,
      },
    });

    const leadClaim = await prisma.leadClaim.upsert({
      where: { id: IDS.leadClaim },
      create: {
        id: IDS.leadClaim,
        leadId: lead.id,
        clientId: client.id,
        projectId: project.id,
        unitId: soldUnit.id,
        brokerUserId: brokerUser.id,
        brokerageId: brokerage.id,
        clientPhoneHash: phoneHash,
        status: LeadClaimStatus.WON,
        source: LeadSource.MANUAL,
        notes: 'Demo claim won through sold-chain flow.',
        expiresAt: claimExpiresAt,
      },
      update: {
        leadId: lead.id,
        clientId: client.id,
        projectId: project.id,
        unitId: soldUnit.id,
        brokerUserId: brokerUser.id,
        brokerageId: brokerage.id,
        clientPhoneHash: phoneHash,
        status: LeadClaimStatus.WON,
        expiresAt: claimExpiresAt,
      },
    });

    const reservation = await prisma.reservationRequest.upsert({
      where: { id: IDS.reservation },
      create: {
        id: IDS.reservation,
        leadId: lead.id,
        leadClaimId: leadClaim.id,
        projectId: project.id,
        unitId: soldUnit.id,
        developerId: developer.id,
        brokerUserId: brokerUser.id,
        brokerageId: brokerage.id,
        status: ReservationRequestStatus.APPROVED,
        notes: 'Demo reservation approved.',
        approvedAt: now,
      },
      update: {
        leadId: lead.id,
        leadClaimId: leadClaim.id,
        projectId: project.id,
        unitId: soldUnit.id,
        developerId: developer.id,
        brokerUserId: brokerUser.id,
        brokerageId: brokerage.id,
        status: ReservationRequestStatus.APPROVED,
        approvedAt: now,
      },
    });

    await prisma.unitAvailability.upsert({
      where: { id: IDS.hold },
      create: {
        id: IDS.hold,
        unitId: soldUnit.id,
        heldById: brokerUser.id,
        reservationRequestId: reservation.id,
        heldType: AvailabilityHoldType.SOLD,
        heldAt: now,
        releasedAt: now,
      },
      update: {
        unitId: soldUnit.id,
        heldById: brokerUser.id,
        reservationRequestId: reservation.id,
        heldType: AvailabilityHoldType.SOLD,
        releasedAt: now,
      },
    });

    const dealRoom = await prisma.dealRoom.upsert({
      where: { reservationRequestId: reservation.id },
      create: {
        id: IDS.dealRoom,
        reservationRequestId: reservation.id,
        leadClaimId: leadClaim.id,
        leadId: lead.id,
        clientId: client.id,
        projectId: project.id,
        unitId: soldUnit.id,
        developerId: developer.id,
        brokerageId: brokerage.id,
        brokerUserId: brokerUser.id,
        createdByUserId: developerUser.id,
        status: DealRoomStatus.SOLD,
        clientInviteToken: 'demo-client-invite-token',
        clientInvitedAt: now,
      },
      update: {
        leadClaimId: leadClaim.id,
        leadId: lead.id,
        clientId: client.id,
        projectId: project.id,
        unitId: soldUnit.id,
        developerId: developer.id,
        brokerageId: brokerage.id,
        brokerUserId: brokerUser.id,
        createdByUserId: developerUser.id,
        status: DealRoomStatus.SOLD,
        clientInviteToken: 'demo-client-invite-token',
        clientInvitedAt: now,
      },
    });

    await upsertDealRoomParticipant(prisma, IDS.developerParticipant, {
      dealRoomId: dealRoom.id,
      userId: developerUser.id,
      organizationId: developer.id,
      role: DealRoomParticipantRole.DEVELOPER_SALES,
    });
    await upsertDealRoomParticipant(prisma, IDS.brokerParticipant, {
      dealRoomId: dealRoom.id,
      userId: brokerUser.id,
      organizationId: brokerage.id,
      role: DealRoomParticipantRole.BROKER,
    });
    await upsertDealRoomParticipant(prisma, IDS.clientParticipant, {
      dealRoomId: dealRoom.id,
      clientId: client.id,
      role: DealRoomParticipantRole.CLIENT,
      status: DealRoomParticipantStatus.INVITED,
    });

    await prisma.dealRoomMessage.upsert({
      where: { id: IDS.message },
      create: {
        id: IDS.message,
        dealRoomId: dealRoom.id,
        senderUserId: brokerUser.id,
        messageType: DealRoomMessageType.TEXT,
        body: 'Demo message: client documents are ready for review.',
      },
      update: {
        dealRoomId: dealRoom.id,
        senderUserId: brokerUser.id,
        messageType: DealRoomMessageType.TEXT,
        body: 'Demo message: client documents are ready for review.',
      },
    });

    const deal = await prisma.deal.upsert({
      where: { dealRoomId: dealRoom.id },
      create: {
        id: IDS.deal,
        dealRoomId: dealRoom.id,
        projectId: project.id,
        unitId: soldUnit.id,
        developerId: developer.id,
        brokerageId: brokerage.id,
        brokerUserId: brokerUser.id,
        leadId: lead.id,
        leadClaimId: leadClaim.id,
        clientId: client.id,
        status: DealStatus.SOLD,
        finalPrice: 3800000,
        currency: 'EGP',
        createdByUserId: developerUser.id,
        approvedById: developerUser.id,
        approvedAt: now,
        soldAt: now,
      },
      update: {
        projectId: project.id,
        unitId: soldUnit.id,
        developerId: developer.id,
        brokerageId: brokerage.id,
        brokerUserId: brokerUser.id,
        leadId: lead.id,
        leadClaimId: leadClaim.id,
        clientId: client.id,
        status: DealStatus.SOLD,
        finalPrice: 3800000,
        currency: 'EGP',
        approvedById: developerUser.id,
        approvedAt: now,
        soldAt: now,
      },
    });

    await prisma.commissionEntry.upsert({
      where: { id: IDS.brokerageCommission },
      create: {
        id: IDS.brokerageCommission,
        dealId: deal.id,
        commissionRuleId: brokerageRule.id,
        projectId: project.id,
        unitId: soldUnit.id,
        developerId: developer.id,
        brokerageId: brokerage.id,
        brokerUserId: brokerUser.id,
        partyType: CommissionPartyType.BROKERAGE,
        recipientOrganizationId: brokerage.id,
        commissionType: CommissionType.PERCENTAGE,
        amount: 95000,
        currency: 'EGP',
        status: CommissionStatus.APPROVED,
        approvedAt: now,
      },
      update: {
        dealId: deal.id,
        commissionRuleId: brokerageRule.id,
        amount: 95000,
        status: CommissionStatus.APPROVED,
        approvedAt: now,
        rejectionReason: null,
      },
    });
    await prisma.commissionEntry.upsert({
      where: { id: IDS.brokerCommission },
      create: {
        id: IDS.brokerCommission,
        dealId: deal.id,
        commissionRuleId: brokerRule.id,
        projectId: project.id,
        unitId: soldUnit.id,
        developerId: developer.id,
        brokerageId: brokerage.id,
        brokerUserId: brokerUser.id,
        partyType: CommissionPartyType.BROKER,
        recipientUserId: brokerUser.id,
        commissionType: CommissionType.FIXED,
        amount: 15000,
        currency: 'EGP',
        status: CommissionStatus.PENDING,
      },
      update: {
        dealId: deal.id,
        commissionRuleId: brokerRule.id,
        amount: 15000,
        status: CommissionStatus.PENDING,
        rejectionReason: null,
      },
    });

    console.log(
      JSON.stringify(
        {
          status: 'ok',
          accounts: [
            'ceo@popwam.com',
            'developer.demo@popwam.local',
            'brokerage.demo@popwam.local',
            'broker.demo@popwam.local',
          ],
          projectId: project.id,
          availableUnitId: IDS.availableUnit,
          soldDealId: deal.id,
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function upsertOrganization(
  prisma: PrismaClient,
  input: {
    id: string;
    name: string;
    slug: string;
    type: 'PLATFORM' | 'DEVELOPER' | 'BROKERAGE';
    status: 'APPROVED';
    city: string;
    country: string;
    email: string;
  },
) {
  return prisma.organization.upsert({
    where: { slug: input.slug },
    create: {
      id: input.id,
      name: input.name,
      slug: input.slug,
      type: input.type,
      status: input.status,
      city: input.city,
      country: input.country,
      profile: {
        create: {
          legalName: input.name,
          tradeName: input.name,
          email: input.email,
        },
      },
    },
    update: {
      name: input.name,
      type: input.type,
      status: input.status,
      city: input.city,
      country: input.country,
      profile: {
        upsert: {
          create: {
            legalName: input.name,
            tradeName: input.name,
            email: input.email,
          },
          update: {
            legalName: input.name,
            tradeName: input.name,
            email: input.email,
          },
        },
      },
    },
  });
}

async function ensureOrganizationRole(
  prisma: PrismaClient,
  id: string,
  organizationId: string,
  name: string,
) {
  const role = await prisma.role.upsert({
    where: {
      organizationId_name: {
        organizationId,
        name,
      },
    },
    create: {
      id,
      organizationId,
      name,
      isSystem: true,
      description: `Demo role: ${name}`,
    },
    update: {
      isSystem: true,
      description: `Demo role: ${name}`,
    },
  });

  for (const permissionKey of ROLE_PERMISSIONS[name] ?? []) {
    const permission = await prisma.permission.upsert({
      where: { key: permissionKey },
      create: {
        key: permissionKey,
        description: `Base permission: ${permissionKey}`,
      },
      update: {},
    });

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: permission.id,
        },
      },
      create: {
        roleId: role.id,
        permissionId: permission.id,
      },
      update: {},
    });
  }

  return role;
}

function upsertUser(
  prisma: PrismaClient,
  input: {
    id: string;
    organizationId: string;
    roleId: string;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    userRole:
      | 'PLATFORM_OWNER'
      | 'DEVELOPER_OWNER'
      | 'BROKERAGE_OWNER'
      | 'BROKER';
  },
) {
  return prisma.user.upsert({
    where: { email: input.email },
    create: {
      id: input.id,
      organizationId: input.organizationId,
      roleId: input.roleId,
      email: input.email,
      passwordHash: input.passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      userRole: input.userRole,
      isActive: true,
    },
    update: {
      organizationId: input.organizationId,
      roleId: input.roleId,
      passwordHash: input.passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      userRole: input.userRole,
      isActive: true,
    },
  });
}

function upsertDealRoomParticipant(
  prisma: PrismaClient,
  id: string,
  input: {
    dealRoomId: string;
    userId?: string;
    clientId?: string;
    organizationId?: string;
    role: DealRoomParticipantRole;
    status?: DealRoomParticipantStatus;
  },
) {
  return prisma.dealRoomParticipant.upsert({
    where: { id },
    create: {
      id,
      dealRoomId: input.dealRoomId,
      userId: input.userId,
      clientId: input.clientId,
      organizationId: input.organizationId,
      role: input.role,
      status: input.status ?? DealRoomParticipantStatus.ACTIVE,
      invitedAt:
        input.status === DealRoomParticipantStatus.INVITED ? new Date() : null,
      joinedAt:
        input.status === DealRoomParticipantStatus.INVITED ? null : new Date(),
    },
    update: {
      dealRoomId: input.dealRoomId,
      userId: input.userId,
      clientId: input.clientId,
      organizationId: input.organizationId,
      role: input.role,
      status: input.status ?? DealRoomParticipantStatus.ACTIVE,
    },
  });
}

function hashPhone(normalizedPhone: string) {
  const salt =
    process.env.LEAD_PHONE_HASH_SALT ??
    process.env.JWT_SECRET ??
    'lead-phone-development-salt';

  return createHmac('sha256', salt).update(normalizedPhone).digest('hex');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

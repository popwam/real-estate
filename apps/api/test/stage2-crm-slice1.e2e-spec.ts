import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/modules/database/prisma.service';
import { AppModule } from './../src/app.module';

describe('Stage 2 CRM Slice 1 (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    process.env.PUBLIC_LEAD_RATE_LIMIT_MAX = '1000';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    delete process.env.PUBLIC_LEAD_RATE_LIMIT_MAX;
    await app.close();
  });

  it('converts public leads, supports broker claiming, and creates safe conversations', async () => {
    const stamp = Date.now();
    const password = 'Passw0rd!Crm1';

    const developer = await registerOrg(
      `stage2-crm-dev+${stamp}@popwam.local`,
      `Stage 2 CRM Developer ${stamp}`,
      'DEVELOPER',
      password,
    );
    const developerToken = developer.body.accessToken;
    const developerOrgId = developer.body.organization.id;
    const developerSlug = developer.body.organization.slug;

    const otherDeveloper = await registerOrg(
      `stage2-crm-other-dev+${stamp}@popwam.local`,
      `Stage 2 CRM Other Developer ${stamp}`,
      'DEVELOPER',
      password,
    );
    const otherDeveloperToken = otherDeveloper.body.accessToken;

    const brokerOne = await registerOrg(
      `stage2-crm-broker-one+${stamp}@popwam.local`,
      `Stage 2 CRM Brokerage One ${stamp}`,
      'BROKERAGE',
      password,
    );
    const brokerOneToken = brokerOne.body.accessToken;

    const brokerTwo = await registerOrg(
      `stage2-crm-broker-two+${stamp}@popwam.local`,
      `Stage 2 CRM Brokerage Two ${stamp}`,
      'BROKERAGE',
      password,
    );
    const brokerTwoToken = brokerTwo.body.accessToken;

    await prisma.organization.updateMany({
      where: {
        id: {
          in: [
            developerOrgId,
            otherDeveloper.body.organization.id,
            brokerOne.body.organization.id,
            brokerTwo.body.organization.id,
          ],
        },
      },
      data: { status: 'APPROVED' },
    });

    await publishWebsite(developerToken, developerSlug, stamp);

    const project = await createProject(developerToken, {
      name: `Stage 2 CRM Project ${stamp}`,
      slug: `stage2-crm-project-${stamp}`,
      status: 'ACTIVE',
      visibility: 'OPEN_MARKETPLACE',
    });

    const beforeLeadClaims = await prisma.leadClaim.count();
    const beforeReservations = await prisma.reservationRequest.count();
    const beforeDealRooms = await prisma.dealRoom.count();

    const publicLead = await request(app.getHttpServer())
      .post('/public/leads')
      .send({
        organizationSlug: developerSlug,
        projectSlug: project.body.slug,
        name: 'CRM Buyer',
        phone: `+20155${String(stamp).slice(-8)}`,
        email: `crm-buyer-${stamp}@example.com`,
        preferredContactMethod: 'WHATSAPP',
        sourcePage: `/projects/${project.body.slug}`,
        utm: { source: 'crm-e2e' },
        consent: true,
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.contact.whatsappUrl).toContain('wa.me');
        expect(body.preferredContactMethod).toBe('WHATSAPP');
      });

    const converted = await request(app.getHttpServer())
      .patch(`/public-leads/${publicLead.body.id}/convert-placeholder`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.converted).toBe(true);
        expect(body.crmClient.name).toBe('CRM Buyer');
        expect(body.crmLead.publicLeadId).toBe(publicLead.body.id);
        expect(body.crmLead.preferredContactMethod).toBe('WHATSAPP');
        expect(body.safety).toContain('No LeadClaim');
      });

    const idempotentConversion = await request(app.getHttpServer())
      .patch(`/public-leads/${publicLead.body.id}/convert-placeholder`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200);
    expect(idempotentConversion.body.crmLead.id).toBe(converted.body.crmLead.id);
    expect(idempotentConversion.body.idempotent).toBe(true);

    expect(await prisma.leadClaim.count()).toBe(beforeLeadClaims);
    expect(await prisma.reservationRequest.count()).toBe(beforeReservations);
    expect(await prisma.dealRoom.count()).toBe(beforeDealRooms);

    await request(app.getHttpServer())
      .get('/crm/leads/marketplace')
      .set('Authorization', `Bearer ${brokerOneToken}`)
      .expect(200)
      .expect(({ body }) => {
        const lead = body.find((item: any) => item.id === converted.body.crmLead.id);
        expect(lead.client.name).toBe('CRM Buyer');
        expect(lead.unavailable).toBe(false);
      });

    await request(app.getHttpServer())
      .post(`/crm/leads/${converted.body.crmLead.id}/claim`)
      .set('Authorization', `Bearer ${brokerOneToken}`)
      .send({})
      .expect(201)
      .expect(({ body }) => {
        expect(body.status).toBe('CLAIMED');
        expect(body.claimedByOrganizationId).toBe(brokerOne.body.organization.id);
      });

    await request(app.getHttpServer())
      .post(`/crm/leads/${converted.body.crmLead.id}/claim`)
      .set('Authorization', `Bearer ${brokerTwoToken}`)
      .send({})
      .expect(409);

    await request(app.getHttpServer())
      .get('/crm/leads/marketplace')
      .set('Authorization', `Bearer ${brokerTwoToken}`)
      .expect(200)
      .expect(({ body }) => {
        const lead = body.find((item: any) => item.id === converted.body.crmLead.id);
        expect(lead.unavailable).toBe(true);
        expect(lead.client.name).toBe('Claimed lead');
        expect(lead.client.email).toBeNull();
      });

    const conversation = await request(app.getHttpServer())
      .post(`/conversations/from-crm-lead/${converted.body.crmLead.id}`)
      .set('Authorization', `Bearer ${brokerOneToken}`)
      .send({ openingMessage: 'Broker opened CRM conversation.' })
      .expect(201)
      .expect(({ body }) => {
        expect(body.crmLead.id).toBe(converted.body.crmLead.id);
        expect(body.shareToken).toBeTruthy();
      });

    await request(app.getHttpServer())
      .get('/conversations')
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.some((item: any) => item.id === conversation.body.id)).toBe(true);
      });

    await request(app.getHttpServer())
      .get(`/conversations/${conversation.body.id}`)
      .set('Authorization', `Bearer ${otherDeveloperToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get(`/conversations/by-token/${conversation.body.shareToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.id).toBe(conversation.body.id);
        expect(body.participants[0]).not.toHaveProperty('userId');
      });

    const message = await request(app.getHttpServer())
      .post(`/conversations/${conversation.body.id}/messages`)
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ body: 'Developer reply from CRM foundation.' })
      .expect(201)
      .expect(({ body }) => {
        expect(body.body).toBe('Developer reply from CRM foundation.');
        expect(body.sender.publicRole).toBe('DEVELOPER');
      });

    await request(app.getHttpServer())
      .get(`/conversations/${conversation.body.id}/messages`)
      .set('Authorization', `Bearer ${brokerOneToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.some((item: any) => item.id === message.body.id)).toBe(true);
      });
  });

  function registerOrg(
    email: string,
    organizationName: string,
    organizationType: string,
    password: string,
  ) {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        organizationName,
        organizationType,
        email,
        password,
        firstName: 'Stage2',
        lastName: 'CRM',
      })
      .expect(201);
  }

  function publishWebsite(token: string, organizationSlug: string, stamp: number) {
    return request(app.getHttpServer())
      .patch('/organization-website-settings/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        publicSlug: organizationSlug,
        subdomain: `stage2-crm-${stamp}`,
        siteTitle: 'Stage 2 CRM Developer',
        whatsappUrl: 'https://wa.me/201000000000',
        isPublished: true,
      })
      .expect(200);
  }

  function createProject(token: string, data: Record<string, unknown>) {
    return request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'COMPOUND',
        city: 'Cairo',
        district: 'New Cairo',
        description: 'CRM foundation public project.',
        coverImageUrl: 'https://cdn.example.com/crm-project.jpg',
        amenities: ['clubhouse'],
        ...data,
      })
      .expect(201);
  }
});

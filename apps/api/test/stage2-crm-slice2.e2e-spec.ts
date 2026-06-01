import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/modules/database/prisma.service';
import { AppModule } from './../src/app.module';

describe('Stage 2 CRM Slice 2 (e2e)', () => {
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

  it('filters, paginates, updates statuses, and returns scoped CRM summary', async () => {
    const stamp = Date.now();
    const password = 'Passw0rd!Crm2';

    const developer = await registerOrg(
      `stage2-crm2-dev+${stamp}@popwam.local`,
      `Stage 2 CRM2 Developer ${stamp}`,
      'DEVELOPER',
      password,
    );
    const developerToken = developer.body.accessToken;
    const developerOrgId = developer.body.organization.id;
    const developerSlug = developer.body.organization.slug;

    const otherDeveloper = await registerOrg(
      `stage2-crm2-other-dev+${stamp}@popwam.local`,
      `Stage 2 CRM2 Other Developer ${stamp}`,
      'DEVELOPER',
      password,
    );
    const otherDeveloperToken = otherDeveloper.body.accessToken;

    const brokerOne = await registerOrg(
      `stage2-crm2-broker-one+${stamp}@popwam.local`,
      `Stage 2 CRM2 Brokerage One ${stamp}`,
      'BROKERAGE',
      password,
    );
    const brokerOneToken = brokerOne.body.accessToken;

    const brokerTwo = await registerOrg(
      `stage2-crm2-broker-two+${stamp}@popwam.local`,
      `Stage 2 CRM2 Brokerage Two ${stamp}`,
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
      name: `Stage 2 CRM2 Project ${stamp}`,
      slug: `stage2-crm2-project-${stamp}`,
      status: 'ACTIVE',
      visibility: 'OPEN_MARKETPLACE',
    });

    const leadAlpha = await createAndConvertPublicLead({
      token: developerToken,
      developerSlug,
      projectSlug: project.body.slug,
      name: `CRM2 Alpha Buyer ${stamp}`,
      email: `crm2-alpha-${stamp}@example.com`,
      phone: `+20161${String(stamp).slice(-8)}`,
      preferredContactMethod: 'WHATSAPP',
    });
    const leadBravo = await createAndConvertPublicLead({
      token: developerToken,
      developerSlug,
      projectSlug: project.body.slug,
      name: `CRM2 Bravo Buyer ${stamp}`,
      email: `crm2-bravo-${stamp}@example.com`,
      phone: `+20162${String(stamp).slice(-8)}`,
      preferredContactMethod: 'CHAT',
    });

    await request(app.getHttpServer())
      .get('/crm/leads')
      .query({ status: 'NEW', page: 1, pageSize: 10 })
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(Array.isArray(body.items)).toBe(true);
        expect(body.pagination.page).toBe(1);
        expect(body.pagination.pageSize).toBe(10);
        expect(body.items.some((item: any) => item.id === leadAlpha.id)).toBe(true);
      });

    await request(app.getHttpServer())
      .get('/crm/leads')
      .query({ preferredContactMethod: 'WHATSAPP', page: 1 })
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.items.some((item: any) => item.id === leadAlpha.id)).toBe(true);
        expect(body.items.every((item: any) => item.preferredContactMethod === 'WHATSAPP')).toBe(true);
      });

    await request(app.getHttpServer())
      .get('/crm/leads')
      .query({ search: `alpha-${stamp}@example.com`, page: 1 })
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.items.some((item: any) => item.id === leadAlpha.id)).toBe(true);
        expect(body.pagination.total).toBeGreaterThanOrEqual(1);
      });

    await request(app.getHttpServer())
      .get('/crm/leads/marketplace')
      .query({ page: 1, pageSize: 5 })
      .set('Authorization', `Bearer ${brokerOneToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.pagination.page).toBe(1);
        expect(body.items.some((item: any) => item.id === leadAlpha.id)).toBe(true);
      });

    await request(app.getHttpServer())
      .post(`/crm/leads/${leadAlpha.id}/claim`)
      .set('Authorization', `Bearer ${brokerOneToken}`)
      .send({})
      .expect(201);

    await request(app.getHttpServer())
      .get('/crm/leads/marketplace')
      .query({ page: 1, pageSize: 20 })
      .set('Authorization', `Bearer ${brokerTwoToken}`)
      .expect(200)
      .expect(({ body }) => {
        const masked = body.items.find((item: any) => item.id === leadAlpha.id);
        expect(masked.unavailable).toBe(true);
        expect(masked.client.name).toBe('Claimed lead');
        expect(masked.client.email).toBeNull();
      });

    await request(app.getHttpServer())
      .patch(`/crm/leads/${leadAlpha.id}/status`)
      .set('Authorization', `Bearer ${brokerOneToken}`)
      .send({ status: 'QUALIFIED', statusNote: 'Called and qualified.' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('QUALIFIED');
        expect(body.statusNote).toBe('Called and qualified.');
      });

    await request(app.getHttpServer())
      .patch(`/crm/leads/${leadAlpha.id}/status`)
      .set('Authorization', `Bearer ${otherDeveloperToken}`)
      .send({ status: 'LOST' })
      .expect(403);

    const conversation = await request(app.getHttpServer())
      .post(`/conversations/from-crm-lead/${leadAlpha.id}`)
      .set('Authorization', `Bearer ${brokerOneToken}`)
      .send({ openingMessage: 'Slice 2 conversation.' })
      .expect(201);

    await request(app.getHttpServer())
      .get('/conversations')
      .query({ status: 'OPEN', page: 1, pageSize: 10 })
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.pagination.page).toBe(1);
        expect(body.items.some((item: any) => item.id === conversation.body.id)).toBe(true);
      });

    await request(app.getHttpServer())
      .patch(`/conversations/${conversation.body.id}/status`)
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ status: 'CLOSED', statusNote: 'Resolved.' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('CLOSED');
        expect(body.statusNote).toBe('Resolved.');
      });

    await request(app.getHttpServer())
      .patch(`/conversations/${conversation.body.id}/status`)
      .send({ status: 'ARCHIVED' })
      .expect(401);

    await request(app.getHttpServer())
      .get('/crm/summary')
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.leads.total).toBeGreaterThanOrEqual(2);
        expect(body.leads.qualified).toBeGreaterThanOrEqual(1);
        expect(body.conversations.closed).toBeGreaterThanOrEqual(1);
        expect(body.today.newLeads).toBeGreaterThanOrEqual(2);
      });
  });

  async function createAndConvertPublicLead(input: {
    token: string;
    developerSlug: string;
    projectSlug: string;
    name: string;
    email: string;
    phone: string;
    preferredContactMethod: 'CALL' | 'CHAT' | 'WHATSAPP';
  }) {
    const publicLead = await request(app.getHttpServer())
      .post('/public/leads')
      .send({
        organizationSlug: input.developerSlug,
        projectSlug: input.projectSlug,
        name: input.name,
        phone: input.phone,
        email: input.email,
        preferredContactMethod: input.preferredContactMethod,
        sourcePage: `/projects/${input.projectSlug}`,
        utm: { source: 'crm-slice2-e2e' },
        consent: true,
      })
      .expect(201);

    const converted = await request(app.getHttpServer())
      .patch(`/public-leads/${publicLead.body.id}/convert-placeholder`)
      .set('Authorization', `Bearer ${input.token}`)
      .expect(200);

    return converted.body.crmLead;
  }

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
        lastName: 'CRM2',
      })
      .expect(201);
  }

  function publishWebsite(token: string, organizationSlug: string, stamp: number) {
    return request(app.getHttpServer())
      .patch('/organization-website-settings/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        publicSlug: organizationSlug,
        subdomain: `stage2-crm2-${stamp}`,
        siteTitle: 'Stage 2 CRM2 Developer',
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
        description: 'CRM Slice 2 public project.',
        coverImageUrl: 'https://cdn.example.com/crm-slice2-project.jpg',
        amenities: ['clubhouse'],
        ...data,
      })
      .expect(201);
  }
});

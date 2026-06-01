import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/modules/database/prisma.service';
import { AppModule } from './../src/app.module';

describe('Stage 3 CRM/domain mutation rate limits (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const originalEnv = {
    AUTH_REGISTER_RATE_LIMIT_MAX: process.env.AUTH_REGISTER_RATE_LIMIT_MAX,
    PUBLIC_LEAD_RATE_LIMIT_MAX: process.env.PUBLIC_LEAD_RATE_LIMIT_MAX,
    CRM_MUTATION_RATE_LIMIT_WINDOW_SECONDS:
      process.env.CRM_MUTATION_RATE_LIMIT_WINDOW_SECONDS,
    CRM_MUTATION_RATE_LIMIT_MAX: process.env.CRM_MUTATION_RATE_LIMIT_MAX,
    DOMAIN_MUTATION_RATE_LIMIT_WINDOW_SECONDS:
      process.env.DOMAIN_MUTATION_RATE_LIMIT_WINDOW_SECONDS,
    DOMAIN_MUTATION_RATE_LIMIT_MAX: process.env.DOMAIN_MUTATION_RATE_LIMIT_MAX,
    PUBLIC_LEAD_MANAGEMENT_RATE_LIMIT_WINDOW_SECONDS:
      process.env.PUBLIC_LEAD_MANAGEMENT_RATE_LIMIT_WINDOW_SECONDS,
    PUBLIC_LEAD_MANAGEMENT_RATE_LIMIT_MAX:
      process.env.PUBLIC_LEAD_MANAGEMENT_RATE_LIMIT_MAX,
  };

  beforeAll(async () => {
    process.env.AUTH_REGISTER_RATE_LIMIT_MAX = '100';
    process.env.PUBLIC_LEAD_RATE_LIMIT_MAX = '100';
    process.env.CRM_MUTATION_RATE_LIMIT_WINDOW_SECONDS = '60';
    process.env.CRM_MUTATION_RATE_LIMIT_MAX = '1';
    process.env.DOMAIN_MUTATION_RATE_LIMIT_WINDOW_SECONDS = '300';
    process.env.DOMAIN_MUTATION_RATE_LIMIT_MAX = '1';
    process.env.PUBLIC_LEAD_MANAGEMENT_RATE_LIMIT_WINDOW_SECONDS = '300';
    process.env.PUBLIC_LEAD_MANAGEMENT_RATE_LIMIT_MAX = '10';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();

    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it('emits CRM and public lead management headers and throttles repeated CRM mutations', async () => {
    const stamp = Date.now();
    const password = 'Passw0rd!Stage3Crm';
    const developer = await registerOrg(
      `stage3-crm-rate-dev+${stamp}@popwam.local`,
      `Stage 3 CRM Rate Developer ${stamp}`,
      'DEVELOPER',
      password,
    );
    const developerToken = developer.body.accessToken;
    const developerOrgId = developer.body.organization.id;
    const developerSlug = developer.body.organization.slug;

    await prisma.organization.update({
      where: { id: developerOrgId },
      data: { status: 'APPROVED' },
    });

    await publishWebsite(developerToken, developerSlug, stamp);
    const project = await createProject(developerToken, stamp);
    const publicLead = await createPublicLead(developerSlug, project.body.slug, stamp);

    const converted = await request(app.getHttpServer())
      .patch(`/public-leads/${publicLead.body.id}/convert-placeholder`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.headers['x-rate-limit-limit']).toBe('10');
        expect(response.headers['x-rate-limit-remaining']).toBeDefined();
        expect(response.headers['x-rate-limit-reset']).toBeDefined();
      });
    const crmLeadId = converted.body.crmLead.id;

    await request(app.getHttpServer())
      .patch(`/crm/leads/${crmLeadId}/status`)
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ status: 'QUALIFIED', statusNote: 'Qualified in rate-limit smoke.' })
      .expect(200)
      .expect((response) => {
        expect(response.headers['x-rate-limit-limit']).toBe('1');
        expect(response.headers['x-rate-limit-remaining']).toBeDefined();
        expect(response.headers['x-rate-limit-reset']).toBeDefined();
      });

    await request(app.getHttpServer())
      .patch(`/crm/leads/${crmLeadId}/status`)
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ status: 'LOST', statusNote: 'Should be throttled.' })
      .expect(429)
      .expect((response) => {
        expect(response.headers['x-rate-limit-limit']).toBe('1');
        expect(response.headers['x-rate-limit-remaining']).toBe('0');
        expect(response.headers['x-rate-limit-reset']).toBeDefined();
      });

    const conversation = await request(app.getHttpServer())
      .post(`/conversations/from-crm-lead/${crmLeadId}`)
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ openingMessage: 'Open CRM rate-limit conversation.' })
      .expect(201)
      .expect((response) => {
        expect(response.headers['x-rate-limit-limit']).toBe('1');
        expect(response.headers['x-rate-limit-remaining']).toBeDefined();
        expect(response.headers['x-rate-limit-reset']).toBeDefined();
      });

    await request(app.getHttpServer())
      .post(`/conversations/${conversation.body.id}/messages`)
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ body: 'Authenticated message under limit.' })
      .expect(201)
      .expect((response) => {
        expect(response.headers['x-rate-limit-limit']).toBe('1');
        expect(response.headers['x-rate-limit-remaining']).toBeDefined();
        expect(response.headers['x-rate-limit-reset']).toBeDefined();
      });

    await request(app.getHttpServer())
      .post(`/conversations/${conversation.body.id}/messages`)
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ body: 'Authenticated message should be throttled.' })
      .expect(429)
      .expect((response) => {
        expect(response.headers['x-rate-limit-limit']).toBe('1');
        expect(response.headers['x-rate-limit-remaining']).toBe('0');
        expect(response.headers['x-rate-limit-reset']).toBeDefined();
      });
  });

  it('emits domain mutation headers and throttles repeated domain creation', async () => {
    const stamp = Date.now();
    const password = 'Passw0rd!Stage3Domain';
    const developer = await registerOrg(
      `stage3-domain-rate-dev+${stamp}@popwam.local`,
      `Stage 3 Domain Rate Developer ${stamp}`,
      'DEVELOPER',
      password,
    );
    const developerToken = developer.body.accessToken;

    const domain = await request(app.getHttpServer())
      .post('/organization-domains/me')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ domain: `stage3-domain-rate-${stamp}`, type: 'SUBDOMAIN' })
      .expect(201)
      .expect((response) => {
        expect(response.headers['x-rate-limit-limit']).toBe('1');
        expect(response.headers['x-rate-limit-remaining']).toBeDefined();
        expect(response.headers['x-rate-limit-reset']).toBeDefined();
      });

    await request(app.getHttpServer())
      .patch(`/organization-domains/${domain.body.id}/request-verification`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.headers['x-rate-limit-limit']).toBe('1');
        expect(response.headers['x-rate-limit-remaining']).toBeDefined();
        expect(response.headers['x-rate-limit-reset']).toBeDefined();
      });

    await request(app.getHttpServer())
      .post('/organization-domains/me')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ domain: `stage3-domain-rate-second-${stamp}`, type: 'SUBDOMAIN' })
      .expect(429)
      .expect((response) => {
        expect(response.headers['x-rate-limit-limit']).toBe('1');
        expect(response.headers['x-rate-limit-remaining']).toBe('0');
        expect(response.headers['x-rate-limit-reset']).toBeDefined();
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
        firstName: 'Stage3',
        lastName: 'RateLimit',
      })
      .expect(201);
  }

  function publishWebsite(token: string, organizationSlug: string, stamp: number) {
    return request(app.getHttpServer())
      .patch('/organization-website-settings/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        publicSlug: organizationSlug,
        subdomain: `stage3-crm-rate-${stamp}`,
        siteTitle: 'Stage 3 CRM Rate Developer',
        whatsappUrl: 'https://wa.me/201000000000',
        isPublished: true,
      })
      .expect(200);
  }

  function createProject(token: string, stamp: number) {
    return request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Stage 3 CRM Rate Project ${stamp}`,
        slug: `stage3-crm-rate-project-${stamp}`,
        type: 'COMPOUND',
        status: 'ACTIVE',
        city: 'Cairo',
        district: 'New Cairo',
        description: 'Stage 3 CRM rate-limit project.',
        visibility: 'OPEN_MARKETPLACE',
      })
      .expect(201);
  }

  function createPublicLead(organizationSlug: string, projectSlug: string, stamp: number) {
    return request(app.getHttpServer())
      .post('/public/leads')
      .send({
        organizationSlug,
        projectSlug,
        name: 'Stage 3 Rate Buyer',
        phone: `+20155${String(stamp).slice(-8)}`,
        email: `stage3-rate-buyer-${stamp}@example.com`,
        preferredContactMethod: 'CHAT',
        sourcePage: `/projects/${projectSlug}`,
        consent: true,
      })
      .expect(201);
  }
});

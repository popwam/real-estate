import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/modules/database/prisma.service';
import { AppModule } from './../src/app.module';

describe('Stage 2 public API Slice 3 (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    process.env.PUBLIC_LEAD_RATE_LIMIT_WINDOW_SECONDS = '60';
    process.env.PUBLIC_LEAD_RATE_LIMIT_MAX = '100';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    delete process.env.PUBLIC_LEAD_RATE_LIMIT_WINDOW_SECONDS;
    delete process.env.PUBLIC_LEAD_RATE_LIMIT_MAX;
    delete process.env.PUBLIC_DOMAIN_DNS_MOCK_TXT_JSON;
    await app.close();
  });

  it('hardens public lead capture and checks DNS TXT verification safely', async () => {
    const stamp = Date.now();
    const password = 'Passw0rd!Public3';
    const developer = await registerDeveloper(
      `stage2-public-hardening+${stamp}@popwam.local`,
      `Stage 2 Hardening Developer ${stamp}`,
      password,
    );
    const developerToken = developer.body.accessToken;
    const developerOrgId = developer.body.organization.id;
    const developerSlug = developer.body.organization.slug;

    await publishWebsite(developerToken, developerSlug, stamp);
    await prisma.organization.update({
      where: { id: developerOrgId },
      data: { status: 'APPROVED' },
    });

    const project = await createProject(developerToken, {
      name: `Stage 2 Hardening Project ${stamp}`,
      slug: `stage2-hardening-project-${stamp}`,
      status: 'ACTIVE',
      visibility: 'OPEN_MARKETPLACE',
    });
    await createUnit(developerToken, project.body.id, `HARD-${stamp}`);

    const validLead = await request(app.getHttpServer())
      .post('/public/leads')
      .set('x-forwarded-for', `198.51.100.${stamp % 200}`)
      .set('user-agent', `stage2-hardening/${stamp}`)
      .send({
        organizationSlug: developerSlug,
        projectSlug: project.body.slug,
        name: 'Hardened Buyer',
        phone: '+20 (111) 555-7777',
        email: `Buyer+${stamp}@Example.COM`,
        message: 'Interested in the launch.',
        sourcePage: `/projects/${project.body.slug}`,
        utm: { source: 'google', nested: { ignored: true } },
        consent: true,
      })
      .expect(201)
      .expect(({ body, headers }) => {
        expect(body.success).toBe(true);
        expect(body.status).toBe('NEW');
        expect(headers['x-rate-limit-limit']).toBe('100');
        expect(headers['x-rate-limit-remaining']).toBeDefined();
        expect(headers['x-rate-limit-reset']).toBeDefined();
      });

    const storedValidLead = await prisma.publicLead.findUniqueOrThrow({
      where: { id: validLead.body.id },
    });
    expect(storedValidLead.phoneLast4).toBe('7777');
    expect(storedValidLead.normalizedEmail).toBe(`buyer+${stamp}@example.com`);
    expect(storedValidLead.consentAt).toBeTruthy();
    expect(storedValidLead.sourceIpHash).toBeTruthy();
    expect(storedValidLead.userAgentHash).toBeTruthy();
    expect(storedValidLead.spamScore).toBe(0);

    const spamLead = await request(app.getHttpServer())
      .post('/public/leads')
      .set('x-forwarded-for', `203.0.113.${stamp % 200}`)
      .send({
        organizationSlug: developerSlug,
        projectSlug: project.body.slug,
        name: 'Honeypot Buyer',
        phone: '+201115558888',
        email: `honeypot-${stamp}@example.com`,
        website: 'https://spam.example',
        consent: true,
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.status).toBe('SPAM');
      });

    const storedSpamLead = await prisma.publicLead.findUniqueOrThrow({
      where: { id: spamLead.body.id },
    });
    expect(storedSpamLead.spamScore).toBeGreaterThanOrEqual(90);
    expect(storedSpamLead.statusNote).toContain('honeypot_filled');

    await request(app.getHttpServer())
      .post('/public/leads')
      .set('x-forwarded-for', `198.51.100.${stamp % 200}`)
      .send({
        organizationSlug: developerSlug,
        projectSlug: project.body.slug,
        name: 'Duplicate Phone Buyer',
        phone: '+201115557777',
        consent: true,
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.id).toBe(validLead.body.id);
        expect(body.duplicate).toBe(true);
      });

    const idempotentLead = await request(app.getHttpServer())
      .post('/public/leads')
      .set('x-forwarded-for', `203.0.113.${(stamp + 1) % 200}`)
      .send({
        organizationSlug: developerSlug,
        projectSlug: project.body.slug,
        name: 'Idempotent Buyer',
        phone: '+201116660000',
        idempotencyKey: `slice3-key-${stamp}`,
        consent: true,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/public/leads')
      .set('x-forwarded-for', `203.0.113.${(stamp + 1) % 200}`)
      .send({
        organizationSlug: developerSlug,
        projectSlug: project.body.slug,
        name: 'Idempotent Buyer Again',
        phone: '+201116660001',
        idempotencyKey: `slice3-key-${stamp}`,
        consent: true,
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.id).toBe(idempotentLead.body.id);
        expect(body.duplicate).toBe(true);
      });

    process.env.PUBLIC_LEAD_RATE_LIMIT_WINDOW_SECONDS = '60';
    process.env.PUBLIC_LEAD_RATE_LIMIT_MAX = '2';
    const rateLimitIp = `192.0.2.${stamp % 200}`;
    await createRateLimitedLead(developerSlug, project.body.slug, rateLimitIp, 1).expect(201);
    await createRateLimitedLead(developerSlug, project.body.slug, rateLimitIp, 2).expect(201);
    await createRateLimitedLead(developerSlug, project.body.slug, rateLimitIp, 3)
      .expect(429)
      .expect(({ body, headers }) => {
        expect(String(body.message)).toContain('Too many public lead submissions');
        expect(headers['x-rate-limit-limit']).toBe('2');
        expect(headers['x-rate-limit-remaining']).toBe('0');
        expect(headers['x-rate-limit-reset']).toBeDefined();
      });
    process.env.PUBLIC_LEAD_RATE_LIMIT_MAX = '100';

    const domain = await request(app.getHttpServer())
      .post('/organization-domains/me')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({
        domain: `slice3-${stamp}.example.com`,
        type: 'CUSTOM_DOMAIN',
      })
      .expect(201);

    process.env.PUBLIC_DOMAIN_DNS_MOCK_TXT_JSON = JSON.stringify({
      [`_popwam.${domain.body.domain}`]: [domain.body.verificationToken],
    });

    await request(app.getHttpServer())
      .patch(`/organization-domains/${domain.body.id}/check-dns`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('VERIFIED');
        expect(body.statusNote).toBe('dns_txt_verified');
      });

    const missingDomain = await request(app.getHttpServer())
      .post('/organization-domains/me')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({
        domain: `missing-slice3-${stamp}.example.com`,
        type: 'CUSTOM_DOMAIN',
      })
      .expect(201);

    process.env.PUBLIC_DOMAIN_DNS_MOCK_TXT_JSON = JSON.stringify({
      [`_popwam.${missingDomain.body.domain}`]: ['wrong-token'],
    });

    await request(app.getHttpServer())
      .patch(`/organization-domains/${missingDomain.body.id}/check-dns`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('PENDING');
        expect(body.statusNote).toBe('dns_txt_missing');
        expect(body.failureReason).toContain('token was not found');
      });

    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    await request(app.getHttpServer())
      .patch(`/organization-domains/${missingDomain.body.id}/mark-verified-dev-only`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(403);
    process.env.NODE_ENV = originalNodeEnv;
  });

  function registerDeveloper(
    email: string,
    organizationName: string,
    password: string,
  ) {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        organizationName,
        organizationType: 'DEVELOPER',
        email,
        password,
        firstName: 'Stage2',
        lastName: 'Hardening',
      })
      .expect(201);
  }

  function publishWebsite(token: string, organizationSlug: string, stamp: number) {
    return request(app.getHttpServer())
      .patch('/organization-website-settings/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        publicSlug: organizationSlug,
        subdomain: `stage2-slice3-${stamp}`,
        siteTitle: 'Stage 2 Slice 3 Developer',
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
        description: 'Safe public project description.',
        coverImageUrl: 'https://cdn.example.com/project-cover.jpg',
        amenities: ['clubhouse', 'parking'],
        ...data,
      })
      .expect(201);
  }

  function createUnit(token: string, projectId: string, unitNumber: string) {
    return request(app.getHttpServer())
      .post('/inventory/units')
      .set('Authorization', `Bearer ${token}`)
      .send({
        projectId,
        unitNumber,
        unitType: 'APARTMENT',
        status: 'AVAILABLE',
        visibility: 'INHERIT_PROJECT',
        bedrooms: 2,
        bathrooms: 2,
        areaSqm: 115,
        currency: 'EGP',
        basePrice: 1250000,
      })
      .expect(201);
  }

  function createRateLimitedLead(
    organizationSlug: string,
    projectSlug: string,
    ip: string,
    index: number,
  ) {
    return request(app.getHttpServer())
      .post('/public/leads')
      .set('x-forwarded-for', ip)
      .send({
        organizationSlug,
        projectSlug,
        name: `Rate Buyer ${index}`,
        phone: `+20111777${Date.now().toString().slice(-5)}${index}`,
        consent: true,
      });
  }
});

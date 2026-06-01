import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/modules/database/prisma.service';
import { AppModule } from './../src/app.module';

describe('Stage 2 public API Slice 2 (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('manages public leads and domain verification without creating CRM/deal artifacts', async () => {
    const stamp = Date.now();
    const password = 'Passw0rd!Public2';

    const developer = await registerOrganization({
      email: `stage2-public-leads-dev+${stamp}@popwam.local`,
      organizationName: `Stage 2 Leads Developer ${stamp}`,
      organizationType: 'DEVELOPER',
      password,
    });
    const developerToken = developer.body.accessToken;
    const developerOrgId = developer.body.organization.id;
    const developerSlug = developer.body.organization.slug;

    await publishWebsite(developerToken, developerSlug, stamp);
    await prisma.organization.update({
      where: { id: developerOrgId },
      data: { status: 'APPROVED' },
    });

    const project = await createProject(developerToken, {
      name: `Stage 2 Leads Project ${stamp}`,
      slug: `stage2-leads-project-${stamp}`,
      status: 'ACTIVE',
      visibility: 'OPEN_MARKETPLACE',
    });
    await createUnit(developerToken, project.body.id, `LEAD-${stamp}`);

    await request(app.getHttpServer()).get('/public-leads').expect(401);

    const firstLead = await request(app.getHttpServer())
      .post('/public/leads')
      .send({
        organizationSlug: developerSlug,
        projectSlug: project.body.slug,
        name: 'Duplicate Buyer',
        phone: '+20 111 222 3333',
        email: `buyer-${stamp}@example.com`,
        message: 'Interested in public lead management.',
        sourcePage: `/projects/${project.body.slug}`,
        utm: { source: 'google', campaign: 'slice2', ignored: { nested: true } },
        idempotencyKey: `lead-key-${stamp}`,
        consent: true,
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.success).toBe(true);
        expect(body.status).toBe('NEW');
        expect(body.duplicate).toBeUndefined();
      });

    await request(app.getHttpServer())
      .post('/public/leads')
      .send({
        organizationSlug: developerSlug,
        projectSlug: project.body.slug,
        name: 'Duplicate Buyer Again',
        phone: '+20 111 222 3333',
        idempotencyKey: `lead-key-${stamp}`,
        consent: true,
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.id).toBe(firstLead.body.id);
        expect(body.duplicate).toBe(true);
      });

    await request(app.getHttpServer())
      .post('/public/leads')
      .send({
        organizationSlug: developerSlug,
        projectSlug: project.body.slug,
        name: 'Duplicate Buyer By Phone',
        phone: '+201112223333',
        consent: true,
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.id).toBe(firstLead.body.id);
        expect(body.duplicate).toBe(true);
      });

    const storedLead = await prisma.publicLead.findUniqueOrThrow({
      where: { id: firstLead.body.id },
    });
    expect(storedLead.status).toBe('NEW');
    expect(storedLead.phoneHash).toBeTruthy();
    expect(storedLead.phoneLast4).toBe('3333');
    expect(storedLead.utm).toEqual({ source: 'google', campaign: 'slice2' });

    await request(app.getHttpServer())
      .get('/public-leads')
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.map((lead: any) => lead.id)).toContain(firstLead.body.id);
        expect(body[0].leadClaims).toBeUndefined();
        expect(body[0].deals).toBeUndefined();
      });

    const otherDeveloper = await registerOrganization({
      email: `stage2-public-leads-other+${stamp}@popwam.local`,
      organizationName: `Stage 2 Other Developer ${stamp}`,
      organizationType: 'DEVELOPER',
      password,
    });

    await request(app.getHttpServer())
      .get(`/public-leads/${firstLead.body.id}`)
      .set('Authorization', `Bearer ${otherDeveloper.body.accessToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/public-leads/${firstLead.body.id}/status`)
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ status: 'REVIEWED', note: 'Reviewed by sales ops.' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('REVIEWED');
        expect(body.statusNote).toBe('Reviewed by sales ops.');
      });

    await request(app.getHttpServer())
      .patch(`/public-leads/${firstLead.body.id}/convert-placeholder`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('CONVERTED');
        expect(body.statusNote).toContain('Conversion placeholder');
      });

    const spamLead = await createPublicLead(
      developerSlug,
      project.body.slug,
      `+20111444${stamp.toString().slice(-4)}`,
    );
    await request(app.getHttpServer())
      .patch(`/public-leads/${spamLead.body.id}/mark-spam`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('SPAM');
      });

    await expect(
      prisma.leadClaim.count({ where: { projectId: project.body.id } }),
    ).resolves.toBe(0);
    await expect(
      prisma.reservationRequest.count({ where: { projectId: project.body.id } }),
    ).resolves.toBe(0);

    const platform = await registerOrganization({
      email: `stage2-public-leads-platform+${stamp}@popwam.local`,
      organizationName: `Stage 2 Platform ${stamp}`,
      organizationType: 'PLATFORM',
      password,
    });
    await request(app.getHttpServer())
      .get('/public-leads')
      .set('Authorization', `Bearer ${platform.body.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.map((lead: any) => lead.id)).toEqual(
          expect.arrayContaining([firstLead.body.id, spamLead.body.id]),
        );
      });

    const domain = await request(app.getHttpServer())
      .post('/organization-domains/me')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({
        domain: `slice2-${stamp}.example.com`,
        type: 'CUSTOM_DOMAIN',
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.domain).toBe(`slice2-${stamp}.example.com`);
        expect(body.status).toBe('PENDING');
        expect(body.verificationToken).toContain('popwam-domain-');
      });

    await request(app.getHttpServer())
      .get('/organization-domains/me')
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.map((item: any) => item.id)).toContain(domain.body.id);
      });

    await request(app.getHttpServer())
      .patch(`/organization-domains/${domain.body.id}/request-verification`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('PENDING');
        expect(body.verificationToken).not.toBe(domain.body.verificationToken);
      });

    await request(app.getHttpServer())
      .get('/platform-admin/domains')
      .set('Authorization', `Bearer ${platform.body.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.map((item: any) => item.id)).toContain(domain.body.id);
      });

    await request(app.getHttpServer())
      .patch(`/platform-admin/domains/${domain.body.id}/reject`)
      .set('Authorization', `Bearer ${platform.body.accessToken}`)
      .send({ reason: 'DNS TXT record missing.' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('FAILED');
        expect(body.failureReason).toBe('DNS TXT record missing.');
      });

    await request(app.getHttpServer())
      .patch(`/organization-domains/${domain.body.id}/request-verification`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('PENDING');
      });

    await request(app.getHttpServer())
      .patch(`/organization-domains/${domain.body.id}/mark-verified-dev-only`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('VERIFIED');
      });

    await request(app.getHttpServer())
      .patch(`/platform-admin/domains/${domain.body.id}/approve`)
      .set('Authorization', `Bearer ${platform.body.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('VERIFIED');
      });

    const websiteSettings = await prisma.organizationWebsiteSettings.findUnique({
      where: { organizationId: developerOrgId },
    });
    expect(websiteSettings?.customDomain).toBe(`slice2-${stamp}.example.com`);
  });

  function registerOrganization(params: {
    email: string;
    organizationName: string;
    organizationType: 'DEVELOPER' | 'PLATFORM';
    password: string;
  }) {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        organizationName: params.organizationName,
        organizationType: params.organizationType,
        email: params.email,
        password: params.password,
        firstName: 'Stage2',
        lastName: 'Public',
      })
      .expect(201);
  }

  function publishWebsite(token: string, organizationSlug: string, stamp: number) {
    return request(app.getHttpServer())
      .patch('/organization-website-settings/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        publicSlug: organizationSlug,
        subdomain: `stage2-slice2-${stamp}`,
        siteTitle: 'Stage 2 Slice 2 Developer',
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

  function createPublicLead(
    organizationSlug: string,
    projectSlug: string,
    phone: string,
  ) {
    return request(app.getHttpServer())
      .post('/public/leads')
      .send({
        organizationSlug,
        projectSlug,
        name: 'Fresh Buyer',
        phone,
        consent: true,
      })
      .expect(201);
  }
});

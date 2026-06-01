import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/modules/database/prisma.service';
import { AppModule } from './../src/app.module';

describe('Stage 2 public API Slice 1 (e2e)', () => {
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

  it('exposes only approved public projects, profiles, domains, and safe leads', async () => {
    const stamp = Date.now();
    const password = 'Passw0rd!Public1';

    const approvedDeveloper = await registerDeveloper(
      `stage2-public-dev+${stamp}@popwam.local`,
      `Stage 2 Public Developer ${stamp}`,
      password,
    );
    const approvedToken = approvedDeveloper.body.accessToken;
    const approvedOrgId = approvedDeveloper.body.organization.id;
    const approvedOrgSlug = approvedDeveloper.body.organization.slug;

    await request(app.getHttpServer())
      .patch('/organization-website-settings/me')
      .set('Authorization', `Bearer ${approvedToken}`)
      .send({
        publicSlug: approvedOrgSlug,
        subdomain: `stage2-public-${stamp}`,
        customDomain: `stage2-public-${stamp}.example.com`,
        siteTitle: 'Stage 2 Public Developer',
        siteDescription: 'Public developer website',
        contactPhone: '+201000000001',
        contactEmail: `public-${stamp}@example.com`,
        whatsappUrl: 'https://wa.me/201000000001',
        isPublished: true,
      })
      .expect(200);

    await request(app.getHttpServer())
      .get('/organization-website-settings/me')
      .set('Authorization', `Bearer ${approvedToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.isPublished).toBe(true);
        expect(body.subdomain).toBe(`stage2-public-${stamp}`);
      });

    await prisma.organization.update({
      where: { id: approvedOrgId },
      data: {
        status: 'APPROVED',
        profile: {
          upsert: {
            create: {
              description: 'Safe public profile summary',
              phone: '+201000000002',
              email: `fallback-${stamp}@example.com`,
              logoUrl: 'https://cdn.example.com/logo.png',
            },
            update: {
              description: 'Safe public profile summary',
              phone: '+201000000002',
              email: `fallback-${stamp}@example.com`,
              logoUrl: 'https://cdn.example.com/logo.png',
            },
          },
        },
      },
    });

    const publicProject = await createProject(approvedToken, {
      name: `Stage 2 Public Project ${stamp}`,
      slug: `stage2-public-project-${stamp}`,
      status: 'ACTIVE',
      visibility: 'OPEN_MARKETPLACE',
    });
    const privateProject = await createProject(approvedToken, {
      name: `Stage 2 Private Project ${stamp}`,
      slug: `stage2-private-project-${stamp}`,
      status: 'ACTIVE',
      visibility: 'PRIVATE',
    });
    const hiddenProject = await createProject(approvedToken, {
      name: `Stage 2 Hidden Project ${stamp}`,
      slug: `stage2-hidden-project-${stamp}`,
      status: 'ACTIVE',
      visibility: 'HIDDEN',
    });
    const draftProject = await createProject(approvedToken, {
      name: `Stage 2 Draft Project ${stamp}`,
      slug: `stage2-draft-project-${stamp}`,
      status: 'DRAFT',
      visibility: 'OPEN_MARKETPLACE',
    });

    await createUnit(approvedToken, publicProject.body.id, `PUB-${stamp}`, {
      visibility: 'INHERIT_PROJECT',
      basePrice: 1250000,
    });
    await createUnit(approvedToken, publicProject.body.id, `HID-${stamp}`, {
      visibility: 'HIDDEN',
      basePrice: 900000,
    });
    await createUnit(approvedToken, privateProject.body.id, `PRI-${stamp}`, {
      visibility: 'INHERIT_PROJECT',
      basePrice: 800000,
    });

    await request(app.getHttpServer())
      .post(`/projects/${publicProject.body.id}/payment-plans`)
      .set('Authorization', `Bearer ${approvedToken}`)
      .send({
        name: 'Public 10% down plan',
        scope: 'PROJECT',
        downPaymentPct: 10,
        installmentMonths: 60,
        installmentPct: 80,
        onDeliveryPct: 10,
        isActive: true,
      })
      .expect(201);

    const unapprovedDeveloper = await registerDeveloper(
      `stage2-public-unapproved+${stamp}@popwam.local`,
      `Stage 2 Unapproved Developer ${stamp}`,
      password,
    );
    await request(app.getHttpServer())
      .patch('/organization-website-settings/me')
      .set('Authorization', `Bearer ${unapprovedDeveloper.body.accessToken}`)
      .send({
        publicSlug: unapprovedDeveloper.body.organization.slug,
        subdomain: `stage2-unapproved-${stamp}`,
        siteTitle: 'Unapproved Developer',
        isPublished: true,
      })
      .expect(200);
    const unapprovedProject = await createProject(
      unapprovedDeveloper.body.accessToken,
      {
        name: `Stage 2 Unapproved Project ${stamp}`,
        slug: `stage2-unapproved-project-${stamp}`,
        status: 'ACTIVE',
        visibility: 'OPEN_MARKETPLACE',
      },
    );
    await createUnit(
      unapprovedDeveloper.body.accessToken,
      unapprovedProject.body.id,
      `UNAPP-${stamp}`,
      { visibility: 'INHERIT_PROJECT', basePrice: 700000 },
    );

    const listResponse = await request(app.getHttpServer())
      .get('/public/projects')
      .query({ organizationSlug: approvedOrgSlug })
      .expect(200);
    const listedSlugs = listResponse.body.map((project: any) => project.slug);
    expect(listedSlugs).toContain(publicProject.body.slug);
    expect(listedSlugs).not.toContain(privateProject.body.slug);
    expect(listedSlugs).not.toContain(hiddenProject.body.slug);
    expect(listedSlugs).not.toContain(draftProject.body.slug);
    expect(listedSlugs).not.toContain(unapprovedProject.body.slug);

    await request(app.getHttpServer())
      .get('/public/projects')
      .query({ organizationSlug: approvedOrgSlug, unitType: 'APARTMENT' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.map((project: any) => project.slug)).toContain(
          publicProject.body.slug,
        );
      });

    await request(app.getHttpServer())
      .get(`/public/organizations/${approvedOrgSlug}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.id).toBe(approvedOrgId);
        expect(body.profile.summary).toBe('Safe public profile summary');
        expect(body.contact.email).toBe(`public-${stamp}@example.com`);
        expect(body.users).toBeUndefined();
        expect(body.verifications).toBeUndefined();
        expect(body.auditLogs).toBeUndefined();
      });

    await request(app.getHttpServer())
      .get(`/public/organizations/${approvedOrgSlug}/projects`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.map((project: any) => project.slug)).toContain(
          publicProject.body.slug,
        );
      });

    await request(app.getHttpServer())
      .get(`/public/domain/stage2-public-${stamp}.popwam.com`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.kind).toBe('SUBDOMAIN');
        expect(body.organization.slug).toBe(approvedOrgSlug);
      });

    await request(app.getHttpServer())
      .get(`/public/domain/stage2-public-${stamp}.example.com`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.kind).toBe('CUSTOM_DOMAIN');
        expect(body.organization.slug).toBe(approvedOrgSlug);
      });

    await request(app.getHttpServer())
      .get(`/public/projects/${publicProject.body.slug}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.slug).toBe(publicProject.body.slug);
        expect(body.units).toHaveLength(1);
        expect(body.units[0].unitNumber).toBeUndefined();
        expect(body.units[0].basePrice).toBe(1250000);
        expect(body.paymentPlans[0].name).toBe('Public 10% down plan');
        expect(body.leads).toBeUndefined();
        expect(body.leadClaims).toBeUndefined();
        expect(body.dealRooms).toBeUndefined();
        expect(body.deals).toBeUndefined();
        expect(body.commissionRules).toBeUndefined();
        expect(body.developer.email).toBeUndefined();
      });

    await request(app.getHttpServer())
      .get(`/public/projects/${privateProject.body.slug}`)
      .expect(404);

    await request(app.getHttpServer())
      .get(`/public/projects/${unapprovedProject.body.slug}`)
      .expect(404);

    await request(app.getHttpServer())
      .post('/public/leads')
      .send({
        organizationSlug: approvedOrgSlug,
        projectSlug: publicProject.body.slug,
        phone: '+201111111111',
        consent: true,
      })
      .expect(400);

    const leadResponse = await request(app.getHttpServer())
      .post('/public/leads')
      .send({
        organizationSlug: approvedOrgSlug,
        projectSlug: publicProject.body.slug,
        name: 'Public Buyer',
        phone: '+201111111111',
        email: `buyer-${stamp}@example.com`,
        message: 'Interested in the launch.',
        sourcePage: `/projects/${publicProject.body.slug}`,
        utm: {
          source: 'google',
          campaign: 'stage2',
          nested: { ignored: true },
        },
        consent: true,
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.success).toBe(true);
        expect(body.status).toBe('NEW');
      });

    const storedLead = await prisma.publicLead.findUniqueOrThrow({
      where: { id: leadResponse.body.id },
    });
    expect(storedLead.organizationId).toBe(approvedOrgId);
    expect(storedLead.projectId).toBe(publicProject.body.id);
    expect(storedLead.utm).toEqual({
      source: 'google',
      campaign: 'stage2',
    });
    await expect(
      prisma.leadClaim.count({ where: { projectId: publicProject.body.id } }),
    ).resolves.toBe(0);
    await expect(
      prisma.reservationRequest.count({
        where: { projectId: publicProject.body.id },
      }),
    ).resolves.toBe(0);
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
        lastName: 'Developer',
      })
      .expect(201);
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

  function createUnit(
    token: string,
    projectId: string,
    unitNumber: string,
    data: Record<string, unknown>,
  ) {
    return request(app.getHttpServer())
      .post('/inventory/units')
      .set('Authorization', `Bearer ${token}`)
      .send({
        projectId,
        unitNumber,
        unitType: 'APARTMENT',
        status: 'AVAILABLE',
        bedrooms: 2,
        bathrooms: 2,
        areaSqm: 115,
        currency: 'EGP',
        ...data,
      })
      .expect(201);
  }
});

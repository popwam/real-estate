import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/database/prisma.service';

describe('Stage 8 marketplace governance (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    process.env.PUBLIC_LEAD_RATE_LIMIT_MAX = '1000';
    process.env.PUBLIC_VISITOR_RATE_LIMIT_MAX = '1000';
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    delete process.env.PUBLIC_LEAD_RATE_LIMIT_MAX;
    delete process.env.PUBLIC_VISITOR_RATE_LIMIT_MAX;
    await app.close();
  });

  it('creates a company and accepts a hashed, expiring invitation once', async () => {
    const stamp = Date.now();
    const platform = await register(`stage8-platform-${stamp}@example.com`, `Stage 8 Platform ${stamp}`, 'PLATFORM');
    const token = platform.body.accessToken;
    const organization = await request(app.getHttpServer())
      .post('/platform-admin/organizations')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `Invited Developer ${stamp}`, type: 'DEVELOPER', city: 'Cairo' })
      .expect(201);

    const invitation = await request(app.getHttpServer())
      .post(`/platform-admin/organizations/${organization.body.id}/invitations`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: `invited-owner-${stamp}@example.com`, intendedRole: 'DEVELOPER_OWNER', expiresInHours: 24 })
      .expect(201);
    expect(invitation.body.inviteUrl).toContain('/invite/');
    const rawToken = invitation.body.inviteUrl.split('/').pop();
    const stored = await prisma.organizationInvitation.findUnique({ where: { id: invitation.body.id } });
    expect(stored?.tokenHash).not.toBe(rawToken);

    await request(app.getHttpServer()).get(`/invitations/${rawToken}`).expect(200).expect(({ body }) => {
      expect(body.canAccept).toBe(true);
      expect(body.email).toContain('***');
      expect(body).not.toHaveProperty('tokenHash');
    });
    await request(app.getHttpServer())
      .post(`/invitations/${rawToken}/accept`)
      .send({ password: 'Stage8StrongPassword!', firstName: 'Invited', lastName: 'Owner' })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/invitations/${rawToken}/accept`)
      .send({ password: 'Stage8StrongPassword!' })
      .expect(409);
  });

  it('enforces selling modes, first-touch ownership, broker scope, and visitor summaries', async () => {
    const stamp = Date.now();
    const developer = await register(`stage8-dev-${stamp}@example.com`, `Stage 8 Developer ${stamp}`, 'DEVELOPER');
    const broker = await register(`stage8-broker-${stamp}@example.com`, `Stage 8 Brokerage ${stamp}`, 'BROKERAGE');
    const unauthorized = await register(`stage8-other-${stamp}@example.com`, `Stage 8 Other Brokerage ${stamp}`, 'BROKERAGE');
    const platform = await register(`stage8-governance-${stamp}@example.com`, `Stage 8 Governance ${stamp}`, 'PLATFORM');
    await prisma.organization.updateMany({
      where: { id: { in: [developer.body.organization.id, broker.body.organization.id, unauthorized.body.organization.id] } },
      data: { status: 'APPROVED' },
    });
    await publishWebsite(developer.body.accessToken, developer.body.organization.slug, stamp);

    const ownerProject = await createProject(developer.body.accessToken, `stage8-owner-${stamp}`);
    const authorizedProject = await createProject(developer.body.accessToken, `stage8-authorized-${stamp}`);
    await request(app.getHttpServer())
      .patch(`/projects/${authorizedProject.body.id}/selling-mode`)
      .set('Authorization', `Bearer ${developer.body.accessToken}`)
      .send({ sellingMode: 'AUTHORIZED_BROKERS' })
      .expect(200);
    const authorization = await request(app.getHttpServer())
      .post(`/projects/${authorizedProject.body.id}/broker-authorizations`)
      .set('Authorization', `Bearer ${developer.body.accessToken}`)
      .send({ organizationId: broker.body.organization.id })
      .expect(201);

    const ownerSession = await createSession(ownerProject.body.slug, broker.body.user.id, stamp, 'owner');
    const ownerLead = await createLead(developer.body.organization.slug, ownerProject.body.slug, ownerSession.body, stamp, 'owner');
    const ownerRecord = await prisma.publicLead.findUniqueOrThrow({ where: { id: ownerLead.body.id } });
    expect(ownerRecord.assignmentType).toBe('COMPANY');
    expect(ownerRecord.assignmentReason).toBe('OWNER_ONLY_MODE');

    const brokerSession = await createSession(authorizedProject.body.slug, broker.body.user.id, stamp, 'broker');
    await request(app.getHttpServer())
      .post('/public/visitors/events')
      .send({
        visitorId: brokerSession.body.visitorId,
        sessionId: brokerSession.body.sessionId,
        events: [
          { eventType: 'PROJECT_VIEW', projectSlug: authorizedProject.body.slug, path: `/projects/${authorizedProject.body.slug}` },
          { eventType: 'SCROLL_DEPTH', projectSlug: authorizedProject.body.slug, path: `/projects/${authorizedProject.body.slug}`, scrollDepth: 75 },
          { eventType: 'TIME_ON_PAGE', projectSlug: authorizedProject.body.slug, path: `/projects/${authorizedProject.body.slug}`, durationMs: 12000 },
        ],
      })
      .expect(201)
      .expect(({ body }) => expect(body.accepted).toBe(3));
    const brokerLead = await createLead(developer.body.organization.slug, authorizedProject.body.slug, brokerSession.body, stamp, 'broker');
    const brokerRecord = await prisma.publicLead.findUniqueOrThrow({ where: { id: brokerLead.body.id } });
    expect(brokerRecord.assignmentType).toBe('BROKER');
    expect(brokerRecord.assignedBrokerUserId).toBe(broker.body.user.id);

    const companyFirst = await createSession(authorizedProject.body.slug, undefined, stamp, 'company-first');
    await request(app.getHttpServer())
      .post('/public/visitors/session')
      .send({ anonymousKey: `visitor-${stamp}-company-first`, sessionKey: `session-${stamp}-company-first`, projectSlug: authorizedProject.body.slug, brokerId: broker.body.user.id, path: `/projects/${authorizedProject.body.slug}?brokerId=${broker.body.user.id}` })
      .expect(201);
    const companyLead = await createLead(developer.body.organization.slug, authorizedProject.body.slug, companyFirst.body, stamp, 'company-first');
    expect((await prisma.publicLead.findUniqueOrThrow({ where: { id: companyLead.body.id } })).assignmentReason).toBe('COMPANY_FIRST_TOUCH');

    const invalidSession = await createSession(authorizedProject.body.slug, unauthorized.body.user.id, stamp, 'unauthorized');
    const invalidLead = await createLead(developer.body.organization.slug, authorizedProject.body.slug, invalidSession.body, stamp, 'unauthorized');
    expect((await prisma.publicLead.findUniqueOrThrow({ where: { id: invalidLead.body.id } })).assignmentType).toBe('COMPANY');

    const brokerVisible = await request(app.getHttpServer())
      .get('/public-leads')
      .set('Authorization', `Bearer ${broker.body.accessToken}`)
      .expect(200);
    expect(brokerVisible.body.some((lead: any) => lead.id === brokerLead.body.id)).toBe(true);
    expect(brokerVisible.body.some((lead: any) => lead.id === ownerLead.body.id)).toBe(false);
    const platformVisible = await request(app.getHttpServer())
      .get('/public-leads')
      .set('Authorization', `Bearer ${platform.body.accessToken}`)
      .expect(200);
    expect(platformVisible.body.some((lead: any) => lead.id === ownerLead.body.id)).toBe(true);

    const converted = await request(app.getHttpServer())
      .patch(`/public-leads/${brokerLead.body.id}/convert-placeholder`)
      .set('Authorization', `Bearer ${developer.body.accessToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .get(`/crm/leads/${converted.body.crmLead.id}`)
      .set('Authorization', `Bearer ${developer.body.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.assignmentReason).toBe('AUTHORIZED_BROKER_FIRST_TOUCH');
        expect(body.visitorBehavior.maxScrollDepth).toBe(75);
        expect(body.visitorBehavior.totalTimeOnPageMs).toBeGreaterThanOrEqual(12000);
      });

    await request(app.getHttpServer())
      .delete(`/projects/${authorizedProject.body.id}/broker-authorizations/${authorization.body.id}`)
      .set('Authorization', `Bearer ${developer.body.accessToken}`)
      .expect(200)
      .expect(({ body }) => expect(body.status).toBe('REVOKED'));
  });

  function register(email: string, organizationName: string, organizationType: string) {
    return request(app.getHttpServer()).post('/auth/register').send({
      email,
      organizationName,
      organizationType,
      password: 'Stage8StrongPassword!',
      firstName: 'Stage',
      lastName: 'Eight',
    }).expect(201);
  }

  function publishWebsite(token: string, slug: string, stamp: number) {
    return request(app.getHttpServer()).patch('/organization-website-settings/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ publicSlug: slug, subdomain: `stage8-${stamp}`, siteTitle: 'Stage 8', isPublished: true })
      .expect(200);
  }

  function createProject(token: string, slug: string) {
    return request(app.getHttpServer()).post('/projects').set('Authorization', `Bearer ${token}`).send({
      name: slug,
      slug,
      type: 'COMPOUND',
      status: 'ACTIVE',
      visibility: 'OPEN_MARKETPLACE',
      city: 'Cairo',
    }).expect(201);
  }

  function createSession(projectSlug: string, brokerId: string | undefined, stamp: number, suffix: string) {
    return request(app.getHttpServer()).post('/public/visitors/session').send({
      anonymousKey: `visitor-${stamp}-${suffix}`,
      sessionKey: `session-${stamp}-${suffix}`,
      projectSlug,
      brokerId,
      path: `/projects/${projectSlug}${brokerId ? `?brokerId=${brokerId}` : ''}`,
      utm: { utm_source: brokerId ? 'broker' : 'direct' },
    }).expect(201);
  }

  function createLead(organizationSlug: string, projectSlug: string, context: any, stamp: number, suffix: string) {
    return request(app.getHttpServer()).post('/public/leads').send({
      organizationSlug,
      projectSlug,
      name: `Stage 8 Lead ${suffix}`,
      phone: `+201${String(stamp).slice(-7)}${suffix.length}`,
      sourcePage: `/projects/${projectSlug}`,
      visitorId: context.visitorId,
      visitorSessionId: context.sessionId,
      consent: true,
    }).expect(201);
  }
});

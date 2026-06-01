import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/modules/database/prisma.service';
import { AppModule } from './../src/app.module';

describe('Stage 2 CRM activity timeline (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    process.env.PUBLIC_LEAD_RATE_LIMIT_MAX = '1000';
    process.env.PUBLIC_CONVERSATION_MESSAGE_RATE_LIMIT_MAX = '1000';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    delete process.env.PUBLIC_LEAD_RATE_LIMIT_MAX;
    delete process.env.PUBLIC_CONVERSATION_MESSAGE_RATE_LIMIT_MAX;
    await app.close();
  });

  it('records and scopes CRM lead and conversation activities', async () => {
    const stamp = Date.now();
    const password = 'Passw0rd!CrmActivity';

    const developer = await register(
      `stage2-crm-activity-dev+${stamp}@popwam.local`,
      `Stage 2 CRM Activity Developer ${stamp}`,
      'DEVELOPER',
      password,
    );
    const developerToken = developer.body.accessToken;
    const developerOrgId = developer.body.organization.id;
    const developerSlug = developer.body.organization.slug;

    const otherDeveloper = await register(
      `stage2-crm-activity-other-dev+${stamp}@popwam.local`,
      `Stage 2 CRM Activity Other Developer ${stamp}`,
      'DEVELOPER',
      password,
    );
    const otherDeveloperToken = otherDeveloper.body.accessToken;

    const broker = await register(
      `stage2-crm-activity-broker+${stamp}@popwam.local`,
      `Stage 2 CRM Activity Brokerage ${stamp}`,
      'BROKERAGE',
      password,
    );
    const brokerToken = broker.body.accessToken;

    const platform = await register(
      `stage2-crm-activity-platform+${stamp}@popwam.local`,
      `Stage 2 CRM Activity Platform ${stamp}`,
      'PLATFORM',
      password,
    );
    const platformToken = platform.body.accessToken;

    await prisma.organization.updateMany({
      where: {
        id: {
          in: [
            developerOrgId,
            otherDeveloper.body.organization.id,
            broker.body.organization.id,
            platform.body.organization.id,
          ],
        },
      },
      data: { status: 'APPROVED' },
    });

    await publishWebsite(developerToken, developerSlug, stamp);
    const project = await createProject(developerToken, {
      name: `Stage 2 CRM Activity Project ${stamp}`,
      slug: `stage2-crm-activity-project-${stamp}`,
      status: 'ACTIVE',
      visibility: 'OPEN_MARKETPLACE',
    });

    const publicLead = await request(app.getHttpServer())
      .post('/public/leads')
      .send({
        organizationSlug: developerSlug,
        projectSlug: project.body.slug,
        name: `Activity Buyer ${stamp}`,
        phone: `+20191${String(stamp).slice(-8)}`,
        email: `activity-buyer-${stamp}@example.com`,
        preferredContactMethod: 'CALL',
        sourcePage: `/projects/${project.body.slug}`,
        consent: true,
      })
      .expect(201);

    const converted = await request(app.getHttpServer())
      .patch(`/public-leads/${publicLead.body.id}/convert-placeholder`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200);
    const crmLeadId = converted.body.crmLead.id;

    await expectActivityTypes(developerToken, `/crm/leads/${crmLeadId}/activities`, [
      'LEAD_CREATED',
      'LEAD_CONVERTED',
    ]);

    await request(app.getHttpServer())
      .post(`/crm/leads/${crmLeadId}/claim`)
      .set('Authorization', `Bearer ${brokerToken}`)
      .send({})
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/crm/leads/${crmLeadId}/status`)
      .set('Authorization', `Bearer ${brokerToken}`)
      .send({ status: 'QUALIFIED', statusNote: 'Activity timeline qualified.' })
      .expect(200);

    const conversation = await request(app.getHttpServer())
      .post(`/conversations/from-crm-lead/${crmLeadId}`)
      .set('Authorization', `Bearer ${brokerToken}`)
      .send({ openingMessage: 'Activity conversation opened.' })
      .expect(201);
    const conversationId = conversation.body.id;
    const shareToken = conversation.body.shareToken;

    await request(app.getHttpServer())
      .post(`/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ body: 'Authenticated activity message.' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/conversations/by-token/${shareToken}/messages`)
      .send({ body: 'Public activity message.', senderName: 'Public Buyer' })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/conversations/${conversationId}/status`)
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ status: 'CLOSED', statusNote: 'Activity conversation closed.' })
      .expect(200);

    await expectActivityTypes(developerToken, '/crm/activities', [
      'LEAD_CLAIMED',
      'LEAD_STATUS_CHANGED',
      'CONVERSATION_CREATED',
      'MESSAGE_SENT',
      'PUBLIC_MESSAGE_SENT',
      'CONVERSATION_STATUS_CHANGED',
    ]);

    await request(app.getHttpServer())
      .get('/crm/activities')
      .query({ page: 1, pageSize: 3 })
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(Array.isArray(body.items)).toBe(true);
        expect(body.items.length).toBeLessThanOrEqual(3);
        expect(body.pagination.page).toBe(1);
        expect(body.pagination.pageSize).toBe(3);
        expect(body.pagination.total).toBeGreaterThanOrEqual(7);
      });

    await request(app.getHttpServer())
      .get(`/crm/leads/${crmLeadId}/activities`)
      .set('Authorization', `Bearer ${otherDeveloperToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get(`/crm/leads/${crmLeadId}/activities`)
      .set('Authorization', `Bearer ${brokerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.items.some((item: any) => item.type === 'LEAD_CLAIMED')).toBe(true);
      });

    await request(app.getHttpServer())
      .get(`/conversations/${conversationId}/activities`)
      .set('Authorization', `Bearer ${brokerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.items.some((item: any) => item.type === 'PUBLIC_MESSAGE_SENT')).toBe(true);
      });

    await request(app.getHttpServer())
      .get('/crm/activities')
      .query({ type: 'PUBLIC_MESSAGE_SENT', page: 1 })
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.items.some((item: any) => item.conversationId === conversationId)).toBe(true);
      });

    await request(app.getHttpServer())
      .get('/crm/activities')
      .expect(401);
  });

  async function expectActivityTypes(token: string, path: string, expectedTypes: string[]) {
    await request(app.getHttpServer())
      .get(path)
      .query({ page: 1, pageSize: 50 })
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        const types = body.items.map((item: any) => item.type);
        for (const type of expectedTypes) {
          expect(types).toContain(type);
        }
      });
  }

  function register(
    email: string,
    organizationName: string,
    organizationType: 'DEVELOPER' | 'BROKERAGE' | 'PLATFORM',
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
        lastName: 'Activity',
      })
      .expect(201);
  }

  function publishWebsite(token: string, organizationSlug: string, stamp: number) {
    return request(app.getHttpServer())
      .patch('/organization-website-settings/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        publicSlug: organizationSlug,
        subdomain: `stage2-crm-activity-${stamp}`,
        siteTitle: 'Stage 2 CRM Activity Developer',
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
        description: 'CRM activity public project.',
        coverImageUrl: 'https://cdn.example.com/crm-activity-project.jpg',
        amenities: ['clubhouse'],
        ...data,
      })
      .expect(201);
  }
});

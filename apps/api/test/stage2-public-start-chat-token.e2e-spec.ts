import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/modules/database/prisma.service';
import { AppModule } from './../src/app.module';

describe('Stage 2 public safe start chat token (e2e)', () => {
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

  it('returns and reuses a public-safe conversation token for CHAT public leads', async () => {
    const stamp = Date.now();
    const password = 'Passw0rd!ChatToken';

    const developer = await registerDeveloper(
      `stage2-start-chat+${stamp}@popwam.local`,
      `Stage 2 Start Chat Developer ${stamp}`,
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
      name: `Stage 2 Start Chat Project ${stamp}`,
      slug: `stage2-start-chat-project-${stamp}`,
      status: 'ACTIVE',
      visibility: 'OPEN_MARKETPLACE',
    });

    const chatPayload = {
      organizationSlug: developerSlug,
      projectSlug: project.body.slug,
      name: 'Chat Buyer',
      phone: `+20122${String(stamp).slice(-8)}`,
      email: `chat-buyer-${stamp}@example.com`,
      preferredContactMethod: 'CHAT',
      sourcePage: `/projects/${project.body.slug}`,
      idempotencyKey: `start-chat-${stamp}`,
      consent: true,
    };

    const chatLead = await request(app.getHttpServer())
      .post('/public/leads')
      .send(chatPayload)
      .expect(201)
      .expect(({ body }) => {
        expect(body.success).toBe(true);
        expect(body.ok).toBe(true);
        expect(body.id).toBeTruthy();
        expect(body.leadId).toBe(body.id);
        expect(body.preferredContactMethod).toBe('CHAT');
        expect(body.conversation.shareToken).toBeTruthy();
        expect(body.conversation.shareUrl).toBe(`/c/${body.conversation.shareToken}`);
        expect(body.shareToken).toBe(body.conversation.shareToken);
        expect(body.conversationUrl).toBe(body.conversation.shareUrl);
        expectForbiddenKeys(body);
      });

    await request(app.getHttpServer())
      .get(`/conversations/by-token/${chatLead.body.conversation.shareToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('OPEN');
        expect(body.project.slug).toBe(project.body.slug);
        expect(body.messages.length).toBeGreaterThanOrEqual(1);
        expectForbiddenKeys(body);
      });

    const repeat = await request(app.getHttpServer())
      .post('/public/leads')
      .send({
        ...chatPayload,
        name: 'Chat Buyer Repeat',
        phone: '+201220000000',
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.duplicate).toBe(true);
        expect(body.id).toBe(chatLead.body.id);
        expect(body.conversation.shareToken).toBe(chatLead.body.conversation.shareToken);
        expectForbiddenKeys(body);
      });

    await request(app.getHttpServer())
      .post('/public/leads')
      .send({
        organizationSlug: developerSlug,
        projectSlug: project.body.slug,
        name: 'Chat Buyer Phone Duplicate',
        phone: chatPayload.phone,
        preferredContactMethod: 'CHAT',
        consent: true,
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.duplicate).toBe(true);
        expect(body.id).toBe(chatLead.body.id);
        expect(body.conversation.shareToken).toBe(repeat.body.conversation.shareToken);
        expectForbiddenKeys(body);
      });

    await expect(
      prisma.conversation.count({
        where: { shareToken: chatLead.body.conversation.shareToken },
      }),
    ).resolves.toBe(1);

    const publicLead = await prisma.publicLead.findUniqueOrThrow({
      where: { id: chatLead.body.id },
      include: { crmLead: true },
    });
    expect(publicLead.status).toBe('CONVERTED');
    expect(publicLead.crmLead?.publicLeadId).toBe(chatLead.body.id);

    await request(app.getHttpServer())
      .post('/public/leads')
      .send({
        organizationSlug: developerSlug,
        projectSlug: project.body.slug,
        name: 'Call Buyer',
        phone: `+20123${String(stamp).slice(-8)}`,
        preferredContactMethod: 'CALL',
        consent: true,
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.preferredContactMethod).toBe('CALL');
        expect(body.conversation).toBeUndefined();
        expect(body.shareToken).toBeUndefined();
        expectForbiddenKeys(body);
      });

    await request(app.getHttpServer())
      .post('/public/leads')
      .send({
        organizationSlug: developerSlug,
        projectSlug: project.body.slug,
        name: 'WhatsApp Buyer',
        phone: `+20124${String(stamp).slice(-8)}`,
        preferredContactMethod: 'WHATSAPP',
        consent: true,
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.preferredContactMethod).toBe('WHATSAPP');
        expect(body.contact.whatsappUrl).toBe('https://wa.me/201000000000');
        expect(body.contact.note).toContain('No WhatsApp provider was called');
        expect(body.conversation).toBeUndefined();
        expectForbiddenKeys(body);
      });
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
        lastName: 'Chat',
      })
      .expect(201);
  }

  function publishWebsite(token: string, organizationSlug: string, stamp: number) {
    return request(app.getHttpServer())
      .patch('/organization-website-settings/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        publicSlug: organizationSlug,
        subdomain: `stage2-start-chat-${stamp}`,
        siteTitle: 'Stage 2 Start Chat Developer',
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
        description: 'Public start chat project.',
        coverImageUrl: 'https://cdn.example.com/start-chat-project.jpg',
        amenities: ['clubhouse'],
        ...data,
      })
      .expect(201);
  }

  function expectForbiddenKeys(value: unknown) {
    const forbidden = new Set([
      'organizationId',
      'crmLeadId',
      'clientId',
      'userId',
      'brokerId',
      'claimedByBrokerUserId',
      'claimedByOrganizationId',
      'dealId',
      'reservationRequestId',
      'commissionId',
      'commissionEntryId',
      'passwordHash',
      'refreshToken',
      'tokenHash',
    ]);
    const seen: string[] = [];

    const visit = (current: unknown) => {
      if (!current || typeof current !== 'object') {
        return;
      }
      if (Array.isArray(current)) {
        current.forEach(visit);
        return;
      }
      for (const [key, nested] of Object.entries(current)) {
        if (forbidden.has(key)) {
          seen.push(key);
        }
        visit(nested);
      }
    };

    visit(value);
    expect(seen).toEqual([]);
  }
});

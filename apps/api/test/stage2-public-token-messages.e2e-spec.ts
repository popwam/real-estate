import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/modules/database/prisma.service';
import { AppModule } from './../src/app.module';

describe('Stage 2 public token conversation messages (e2e)', () => {
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
    delete process.env.PUBLIC_CONVERSATION_MESSAGE_RATE_LIMIT_WINDOW_SECONDS;
    await app.close();
  });

  it('posts safe public token messages and preserves conversation privacy', async () => {
    const stamp = Date.now();
    const password = 'Passw0rd!TokenMsg';

    const developer = await registerDeveloper(
      `stage2-token-msg+${stamp}@popwam.local`,
      `Stage 2 Token Message Developer ${stamp}`,
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
      name: `Stage 2 Token Message Project ${stamp}`,
      slug: `stage2-token-message-project-${stamp}`,
      status: 'ACTIVE',
      visibility: 'OPEN_MARKETPLACE',
    });

    const chat = await createPublicChat({
      developerSlug,
      projectSlug: project.body.slug,
      stamp,
      label: 'primary',
    });
    const token = chat.body.conversation.shareToken;

    const publicMessage = await request(app.getHttpServer())
      .post(`/conversations/by-token/${token}/messages`)
      .send({
        body: '  Hello, I am still interested.  ',
        senderName: ' Buyer Name ',
      })
      .expect(201)
      .expect(({ body, headers }) => {
        expect(body.ok).toBe(true);
        expect(body.message.id).toBeTruthy();
        expect(body.message.type).toBe('TEXT');
        expect(body.message.body).toBe('Hello, I am still interested.');
        expect(body.message.sender.publicRole).toBe('CLIENT');
        expect(body.message.sender.displayName).toBe('Buyer Name');
        expect(headers['x-rate-limit-limit']).toBe('1000');
        expect(headers['x-rate-limit-remaining']).toBeDefined();
        expect(headers['x-rate-limit-reset']).toBeDefined();
        expectForbiddenKeys(body);
      });

    const publicConversation = await request(app.getHttpServer())
      .get(`/conversations/by-token/${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('OPEN');
        expect(
          body.messages.some((message: any) => message.id === publicMessage.body.message.id),
        ).toBe(true);
        expectForbiddenKeys(body);
      });

    const conversationId = publicConversation.body.id;

    await request(app.getHttpServer())
      .post(`/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ body: 'Developer authenticated reply.' })
      .expect(201)
      .expect(({ body }) => {
        expect(body.body).toBe('Developer authenticated reply.');
        expect(body.sender.publicRole).toBe('DEVELOPER');
      });

    await request(app.getHttpServer())
      .post(`/conversations/by-token/${token}/messages`)
      .send({ body: '   ', senderName: 'Buyer Name' })
      .expect(400);

    await request(app.getHttpServer())
      .post(`/conversations/by-token/${token}/messages`)
      .send({ body: 'x'.repeat(2001), senderName: 'Buyer Name' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/conversations/by-token/not-a-real-token/messages')
      .send({ body: 'Can anyone see this?' })
      .expect(404);

    await request(app.getHttpServer())
      .patch(`/conversations/${conversationId}/status`)
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ status: 'CLOSED', statusNote: 'Closed for public reply test.' })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/conversations/by-token/${token}/messages`)
      .send({ body: 'Reply after close.' })
      .expect(400);

    const archivedChat = await createPublicChat({
      developerSlug,
      projectSlug: project.body.slug,
      stamp,
      label: 'archived',
    });
    const archivedConversation = await request(app.getHttpServer())
      .get(`/conversations/by-token/${archivedChat.body.conversation.shareToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/conversations/${archivedConversation.body.id}/status`)
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ status: 'ARCHIVED', statusNote: 'Archived for public reply test.' })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/conversations/by-token/${archivedChat.body.conversation.shareToken}/messages`)
      .send({ body: 'Reply after archive.' })
      .expect(400);

    process.env.PUBLIC_CONVERSATION_MESSAGE_RATE_LIMIT_MAX = '2';
    process.env.PUBLIC_CONVERSATION_MESSAGE_RATE_LIMIT_WINDOW_SECONDS = '60';
    const rateLimitedChat = await createPublicChat({
      developerSlug,
      projectSlug: project.body.slug,
      stamp,
      label: 'rate-limit',
    });
    const rateToken = rateLimitedChat.body.conversation.shareToken;
    const rateIp = '203.0.113.45';

    await request(app.getHttpServer())
      .post(`/conversations/by-token/${rateToken}/messages`)
      .set('x-forwarded-for', rateIp)
      .send({ body: 'Rate message one.' })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/conversations/by-token/${rateToken}/messages`)
      .set('x-forwarded-for', rateIp)
      .send({ body: 'Rate message two.' })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/conversations/by-token/${rateToken}/messages`)
      .set('x-forwarded-for', rateIp)
      .send({ body: 'Rate message three.' })
      .expect(429)
      .expect(({ body, headers }) => {
        expect(body.message).toContain('Too many public conversation messages');
        expect(headers['x-rate-limit-limit']).toBe('2');
        expect(headers['x-rate-limit-remaining']).toBe('0');
        expect(headers['x-rate-limit-reset']).toBeDefined();
      });
    process.env.PUBLIC_CONVERSATION_MESSAGE_RATE_LIMIT_MAX = '1000';
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
        lastName: 'TokenMessage',
      })
      .expect(201);
  }

  function publishWebsite(token: string, organizationSlug: string, stamp: number) {
    return request(app.getHttpServer())
      .patch('/organization-website-settings/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        publicSlug: organizationSlug,
        subdomain: `stage2-token-msg-${stamp}`,
        siteTitle: 'Stage 2 Token Message Developer',
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
        description: 'Public token message project.',
        coverImageUrl: 'https://cdn.example.com/token-message-project.jpg',
        amenities: ['clubhouse'],
        ...data,
      })
      .expect(201);
  }

  function createPublicChat(input: {
    developerSlug: string;
    projectSlug: string;
    stamp: number;
    label: string;
  }) {
    return request(app.getHttpServer())
      .post('/public/leads')
      .send({
        organizationSlug: input.developerSlug,
        projectSlug: input.projectSlug,
        name: `Token Message Buyer ${input.label}`,
        phone: `+20170${String(input.stamp).slice(-7)}${input.label.length}`,
        email: `token-message-${input.label}-${input.stamp}@example.com`,
        preferredContactMethod: 'CHAT',
        sourcePage: `/projects/${input.projectSlug}`,
        idempotencyKey: `token-message-${input.label}-${input.stamp}`,
        consent: true,
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.conversation.shareToken).toBeTruthy();
      });
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
      'conversationId',
      'senderParticipantId',
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

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/modules/database/prisma.service';
import { AppModule } from './../src/app.module';

describe('Team 2 marketplace Slice 5 deal rooms (e2e)', () => {
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

  it('creates deal rooms from approved reservations and enforces Slice 5 boundaries', async () => {
    const stamp = Date.now();
    const password = 'Passw0rd!Slice5';

    const developer = await register(
      app,
      `team2-slice5-dev+${stamp}@popwam.local`,
      `Slice 5 Developer ${stamp}`,
      'DEVELOPER',
      password,
    );
    const developerToken = developer.body.accessToken;

    const otherDeveloper = await register(
      app,
      `team2-slice5-other-dev+${stamp}@popwam.local`,
      `Slice 5 Other Developer ${stamp}`,
      'DEVELOPER',
      password,
    );
    const otherDeveloperToken = otherDeveloper.body.accessToken;

    const brokerage = await register(
      app,
      `team2-slice5-brokerage+${stamp}@popwam.local`,
      `Slice 5 Brokerage ${stamp}`,
      'BROKERAGE',
      password,
    );
    const brokerageToken = brokerage.body.accessToken;

    const platform = await register(
      app,
      `team2-slice5-platform+${stamp}@popwam.local`,
      `Slice 5 Platform ${stamp}`,
      'PLATFORM',
      password,
    );
    const platformToken = platform.body.accessToken;

    await createBrokerUser(
      `team2-slice5-broker+${stamp}@popwam.local`,
      brokerageToken,
      password,
      'broker',
    );
    const brokerToken = await login(
      `team2-slice5-broker+${stamp}@popwam.local`,
      password,
    );

    await createBrokerUser(
      `team2-slice5-brokerage-admin+${stamp}@popwam.local`,
      brokerageToken,
      password,
      'brokerage_admin',
    );
    const brokerageAdminToken = await login(
      `team2-slice5-brokerage-admin+${stamp}@popwam.local`,
      password,
    );

    const project = await createProject(developerToken, stamp, {
      name: `Slice 5 Open ${stamp}`,
      slug: `slice-5-open-${stamp}`,
      visibility: 'OPEN_MARKETPLACE',
    });
    const approvedUnit = await createUnit(
      developerToken,
      project.body.id,
      `S5-APPROVED-${stamp}`,
    );
    const pendingUnit = await createUnit(
      developerToken,
      project.body.id,
      `S5-PENDING-${stamp}`,
    );

    await request(app.getHttpServer())
      .get(`/marketplace/projects/${project.body.id}`)
      .set('Authorization', `Bearer ${brokerToken}`)
      .expect(200);

    const approvedClaim = await request(app.getHttpServer())
      .post('/lead-claims')
      .set('Authorization', `Bearer ${brokerToken}`)
      .send({
        clientName: 'Slice Five Approved Client',
        phone: `+20 100 555 ${stamp.toString().slice(-4)}`,
        projectId: project.body.id,
        unitId: approvedUnit.body.id,
      })
      .expect(201);

    const pendingClaim = await request(app.getHttpServer())
      .post('/lead-claims')
      .set('Authorization', `Bearer ${brokerToken}`)
      .send({
        clientName: 'Slice Five Pending Client',
        phone: `+20 100 777 ${stamp.toString().slice(-4)}`,
        projectId: project.body.id,
        unitId: pendingUnit.body.id,
      })
      .expect(201);

    const approvedReservation = await request(app.getHttpServer())
      .post('/reservation-requests')
      .set('Authorization', `Bearer ${brokerToken}`)
      .send({ leadClaimId: approvedClaim.body.id })
      .expect(201);

    const pendingReservation = await request(app.getHttpServer())
      .post('/reservation-requests')
      .set('Authorization', `Bearer ${brokerToken}`)
      .send({ leadClaimId: pendingClaim.body.id })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/deal-rooms/from-reservation/${pendingReservation.body.id}`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(400);

    await request(app.getHttpServer())
      .patch(`/reservation-requests/${approvedReservation.body.id}/approve`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200);

    const dealRoom = await request(app.getHttpServer())
      .post(`/deal-rooms/from-reservation/${approvedReservation.body.id}`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(201)
      .expect(({ body }) => {
        expect(body.status).toBe('OPEN');
        expect(body.reservationRequestId).toBe(approvedReservation.body.id);
        expect(body.leadClaimId).toBe(approvedClaim.body.id);
        expect(body.participants).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ role: 'BROKER', status: 'ACTIVE' }),
            expect.objectContaining({
              role: 'DEVELOPER_SALES',
              status: 'ACTIVE',
            }),
          ]),
        );
      });

    await request(app.getHttpServer())
      .post(`/deal-rooms/from-reservation/${approvedReservation.body.id}`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(409);

    await request(app.getHttpServer())
      .get('/deal-rooms')
      .set('Authorization', `Bearer ${brokerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(ids(body)).toContain(dealRoom.body.id);
      });

    await request(app.getHttpServer())
      .get(`/deal-rooms/${dealRoom.body.id}`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.id).toBe(dealRoom.body.id);
      });

    await request(app.getHttpServer())
      .get(`/deal-rooms/${dealRoom.body.id}`)
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.id).toBe(dealRoom.body.id);
        expect(body.participants).toEqual(expect.any(Array));
        expect(body._count?.messages).toEqual(expect.any(Number));
      });

    await request(app.getHttpServer())
      .get(`/deal-rooms/${dealRoom.body.id}`)
      .set('Authorization', `Bearer ${otherDeveloperToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get('/deal-rooms/missing-deal-room')
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(404)
      .expect(({ body }) => {
        expect(body.message).toBe('Deal room not found.');
      });

    await request(app.getHttpServer())
      .get('/deal-rooms')
      .set('Authorization', `Bearer ${brokerageAdminToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(ids(body)).toContain(dealRoom.body.id);
      });

    await request(app.getHttpServer())
      .get('/deal-rooms')
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(ids(body)).toContain(dealRoom.body.id);
      });

    await request(app.getHttpServer())
      .post(`/deal-rooms/${dealRoom.body.id}/invite-client`)
      .set('Authorization', `Bearer ${brokerToken}`)
      .expect(201)
      .expect(({ body }) => {
        expect(body.participant.role).toBe('CLIENT');
        expect(body.participant.status).toBe('INVITED');
        expect(body.invite.delivery).toBe('placeholder');
      });

    const message = await request(app.getHttpServer())
      .post(`/deal-rooms/${dealRoom.body.id}/messages`)
      .set('Authorization', `Bearer ${brokerToken}`)
      .send({
        messageType: 'TEXT',
        body: 'Client confirmed documents will be uploaded later.',
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.messageType).toBe('TEXT');
        expect(body.body).toBe('Client confirmed documents will be uploaded later.');
      });

    await request(app.getHttpServer())
      .get(`/deal-rooms/${dealRoom.body.id}/messages`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(ids(body)).toContain(message.body.id);
      });

    await request(app.getHttpServer())
      .get(`/deal-rooms/${dealRoom.body.id}/messages`)
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(ids(body)).toContain(message.body.id);
      });

    await request(app.getHttpServer())
      .patch(`/deal-rooms/${dealRoom.body.id}/status`)
      .set('Authorization', `Bearer ${brokerToken}`)
      .send({ status: 'NEGOTIATION' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('NEGOTIATION');
      });

    await request(app.getHttpServer())
      .patch(`/deal-rooms/${dealRoom.body.id}/status`)
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ status: 'PENDING_APPROVAL' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('PENDING_APPROVAL');
      });

    await request(app.getHttpServer())
      .patch(`/deal-rooms/${dealRoom.body.id}/status`)
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ status: 'SOLD' })
      .expect(400);

    const auditActions = await prisma.auditLog.findMany({
      where: {
        action: {
          in: [
            'deal_room.created',
            'deal_room.client_invited',
            'deal_room.message_created',
            'deal_room.status_changed',
          ],
        },
      },
      select: { action: true },
    });
    expect(auditActions.map((item) => item.action)).toEqual(
      expect.arrayContaining([
        'deal_room.created',
        'deal_room.client_invited',
        'deal_room.message_created',
        'deal_room.status_changed',
      ]),
    );

    await expect(
      prisma.deal.count({ where: { dealRoomId: dealRoom.body.id } }),
    ).resolves.toBe(0);
    await expect(
      prisma.commissionEntry.count({
        where: { deal: { dealRoomId: dealRoom.body.id } },
      }),
    ).resolves.toBe(0);
    expect((prisma as any).payment).toBeUndefined();
    expect((prisma as any).ledgerEntry).toBeUndefined();
  });

  function createBrokerUser(
    email: string,
    token: string,
    password: string,
    role: 'broker' | 'brokerage_admin',
  ) {
    return request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email,
        password,
        firstName: 'Team2',
        lastName: 'Slice5',
        role,
      })
      .expect(201);
  }

  async function login(email: string, password: string) {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    return response.body.accessToken;
  }

  function createProject(
    token: string,
    stamp: number,
    data: Record<string, unknown>,
  ) {
    return request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'COMPOUND',
        status: 'ACTIVE',
        city: 'Cairo',
        district: 'New Cairo',
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
        basePrice: 1800000,
        bedrooms: 3,
        areaSqm: 140,
      })
      .expect(201);
  }
});

function register(
  app: INestApplication<App>,
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
      firstName: 'Team2',
      lastName: 'Slice5',
    })
    .expect(201);
}

function ids(items: Array<{ id: string }> | undefined) {
  return (items ?? []).map((item) => item.id);
}

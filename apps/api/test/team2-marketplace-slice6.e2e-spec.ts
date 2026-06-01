import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/modules/database/prisma.service';
import { AppModule } from './../src/app.module';

describe('Team 2 marketplace Slice 6 deal finalization and commissions (e2e)', () => {
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

  it('finalizes approved deal rooms, marks units sold, and creates commission placeholders', async () => {
    const stamp = Date.now();
    const password = 'Passw0rd!Slice6';

    const developer = await register(
      app,
      `team2-slice6-dev+${stamp}@popwam.local`,
      `Slice 6 Developer ${stamp}`,
      'DEVELOPER',
      password,
    );
    const developerToken = developer.body.accessToken;

    const otherDeveloper = await register(
      app,
      `team2-slice6-other-dev+${stamp}@popwam.local`,
      `Slice 6 Other Developer ${stamp}`,
      'DEVELOPER',
      password,
    );
    const otherDeveloperToken = otherDeveloper.body.accessToken;

    const brokerage = await register(
      app,
      `team2-slice6-brokerage+${stamp}@popwam.local`,
      `Slice 6 Brokerage ${stamp}`,
      'BROKERAGE',
      password,
    );
    const brokerageToken = brokerage.body.accessToken;

    await createBrokerUser(
      `team2-slice6-broker+${stamp}@popwam.local`,
      brokerageToken,
      password,
      'broker',
    );
    const brokerToken = await login(
      `team2-slice6-broker+${stamp}@popwam.local`,
      password,
    );
    const brokerUser = await prisma.user.findUniqueOrThrow({
      where: { email: `team2-slice6-broker+${stamp}@popwam.local` },
      select: { id: true },
    });

    const project = await createProject(developerToken, stamp, {
      name: `Slice 6 Open ${stamp}`,
      slug: `slice-6-open-${stamp}`,
      visibility: 'OPEN_MARKETPLACE',
    });
    const unit = await createUnit(
      developerToken,
      project.body.id,
      `S6-SOLD-${stamp}`,
    );

    await request(app.getHttpServer())
      .get(`/marketplace/projects/${project.body.id}`)
      .set('Authorization', `Bearer ${brokerToken}`)
      .expect(200);

    const claim = await request(app.getHttpServer())
      .post('/lead-claims')
      .set('Authorization', `Bearer ${brokerToken}`)
      .send({
        clientName: 'Slice Six Client',
        phone: `+20 101 666 ${stamp.toString().slice(-4)}`,
        projectId: project.body.id,
        unitId: unit.body.id,
      })
      .expect(201);

    const reservation = await request(app.getHttpServer())
      .post('/reservation-requests')
      .set('Authorization', `Bearer ${brokerToken}`)
      .send({ leadClaimId: claim.body.id })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/reservation-requests/${reservation.body.id}/approve`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200);

    const dealRoom = await request(app.getHttpServer())
      .post(`/deal-rooms/from-reservation/${reservation.body.id}`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/deal-rooms/${dealRoom.body.id}/status`)
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ status: 'PENDING_APPROVAL' })
      .expect(200);

    const brokerageRule = await request(app.getHttpServer())
      .post('/commission-rules')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({
        projectId: project.body.id,
        partyType: 'BROKERAGE',
        targetOrganizationId: brokerage.body.organization.id,
        commissionType: 'PERCENTAGE',
        value: 2.5,
        currency: 'EGP',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/commission-rules')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({
        projectId: project.body.id,
        partyType: 'BROKER',
        targetUserId: brokerUser.id,
        commissionType: 'FIXED',
        value: 15000,
        currency: 'EGP',
      })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/commission-rules/${brokerageRule.body.id}`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/commission-rules/${brokerageRule.body.id}`)
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ notes: 'Slice 6 verified rule' })
      .expect(200);

    await request(app.getHttpServer())
      .post(`/deals/from-deal-room/${dealRoom.body.id}`)
      .set('Authorization', `Bearer ${otherDeveloperToken}`)
      .send({ finalPrice: 2000000, currency: 'EGP' })
      .expect(403);

    const deal = await request(app.getHttpServer())
      .post(`/deals/from-deal-room/${dealRoom.body.id}`)
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ finalPrice: 2000000, currency: 'EGP' })
      .expect(201)
      .expect(({ body }) => {
        expect(body.status).toBe('SOLD');
        expect(body.dealRoomId).toBe(dealRoom.body.id);
        expect(body.commissionEntries).toHaveLength(2);
      });

    await request(app.getHttpServer())
      .post(`/deals/from-deal-room/${dealRoom.body.id}`)
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ finalPrice: 2000000, currency: 'EGP' })
      .expect(409);

    await request(app.getHttpServer())
      .get(`/deals/${deal.body.id}`)
      .set('Authorization', `Bearer ${otherDeveloperToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get(`/deals/${deal.body.id}`)
      .set('Authorization', `Bearer ${brokerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.id).toBe(deal.body.id);
      });

    await request(app.getHttpServer())
      .get('/deals')
      .set('Authorization', `Bearer ${brokerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(ids(body)).toContain(deal.body.id);
      });

    await request(app.getHttpServer())
      .get(`/inventory/units/${unit.body.id}`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('SOLD');
      });

    await request(app.getHttpServer())
      .get(`/deal-rooms/${dealRoom.body.id}`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('SOLD');
      });

    const brokerCommissions = await request(app.getHttpServer())
      .get('/commissions')
      .set('Authorization', `Bearer ${brokerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ dealId: deal.body.id, status: 'PENDING' }),
          ]),
        );
      });

    const commissionIds = brokerCommissions.body
      .filter((item: { dealId: string }) => item.dealId === deal.body.id)
      .map((item: { id: string }) => item.id);
    expect(commissionIds).toHaveLength(2);

    await request(app.getHttpServer())
      .get(`/commissions/${commissionIds[0]}`)
      .set('Authorization', `Bearer ${brokerToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/commissions/${commissionIds[0]}/approve`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('APPROVED');
      });

    await request(app.getHttpServer())
      .patch(`/commissions/${commissionIds[1]}/reject`)
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ reason: 'Rejected for Slice 6 placeholder coverage.' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('REJECTED');
        expect(body.rejectionReason).toBe(
          'Rejected for Slice 6 placeholder coverage.',
        );
      });

    const finalUnit = await prisma.inventoryUnit.findUniqueOrThrow({
      where: { id: unit.body.id },
      select: { status: true },
    });
    expect(finalUnit.status).toBe('SOLD');

    const finalDealRoom = await prisma.dealRoom.findUniqueOrThrow({
      where: { id: dealRoom.body.id },
      select: { status: true },
    });
    expect(finalDealRoom.status).toBe('SOLD');

    await expect(
      prisma.commissionEntry.count({ where: { dealId: deal.body.id } }),
    ).resolves.toBe(2);
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
        lastName: 'Slice6',
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
      lastName: 'Slice6',
    })
    .expect(201);
}

function ids(items: Array<{ id: string }> | undefined) {
  return (items ?? []).map((item) => item.id);
}

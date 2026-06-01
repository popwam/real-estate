import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/modules/database/prisma.service';
import { AppModule } from './../src/app.module';

describe('Team 2 marketplace Slice 4 contracts (e2e)', () => {
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

  it('handles lead claims, duplicate conflicts, reservation approval/rejection, and unit holds', async () => {
    const stamp = Date.now();
    const password = 'Passw0rd!Slice4';
    const clientPhone = '+20 (109) 988-7766';

    const developer = await register(
      app,
      `team2-slice4-dev+${stamp}@popwam.local`,
      `Slice 4 Developer ${stamp}`,
      'DEVELOPER',
      password,
    );
    const developerToken = developer.body.accessToken;

    const unauthorizedDeveloper = await register(
      app,
      `team2-slice4-other-dev+${stamp}@popwam.local`,
      `Slice 4 Other Developer ${stamp}`,
      'DEVELOPER',
      password,
    );
    const unauthorizedDeveloperToken = unauthorizedDeveloper.body.accessToken;

    const brokerage = await register(
      app,
      `team2-slice4-brokerage+${stamp}@popwam.local`,
      `Slice 4 Brokerage ${stamp}`,
      'BROKERAGE',
      password,
    );
    const brokerageToken = brokerage.body.accessToken;

    await createBrokerUser(
      `team2-slice4-broker-one+${stamp}@popwam.local`,
      brokerageToken,
      password,
    );
    const brokerOneToken = await login(
      `team2-slice4-broker-one+${stamp}@popwam.local`,
      password,
    );

    await createBrokerUser(
      `team2-slice4-broker-two+${stamp}@popwam.local`,
      brokerageToken,
      password,
    );
    const brokerTwoToken = await login(
      `team2-slice4-broker-two+${stamp}@popwam.local`,
      password,
    );

    const project = await createProject(developerToken, stamp, {
      name: `Slice 4 Open ${stamp}`,
      slug: `slice-4-open-${stamp}`,
      visibility: 'OPEN_MARKETPLACE',
    });
    const unitForApproval = await createUnit(
      developerToken,
      project.body.id,
      `S4-APPROVE-${stamp}`,
    );
    const unitForRejection = await createUnit(
      developerToken,
      project.body.id,
      `S4-REJECT-${stamp}`,
    );

    await request(app.getHttpServer())
      .get(`/marketplace/projects/${project.body.id}`)
      .set('Authorization', `Bearer ${brokerOneToken}`)
      .expect(200);

    const firstClaim = await request(app.getHttpServer())
      .post('/lead-claims')
      .set('Authorization', `Bearer ${brokerOneToken}`)
      .send({
        clientName: 'Slice Four Client',
        phone: clientPhone,
        projectId: project.body.id,
        unitId: unitForApproval.body.id,
        notes: 'Initial claim',
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.clientPhoneHash).toEqual(expect.any(String));
        expect(body.client.phoneHash).toEqual(body.clientPhoneHash);
        expect(body.client.phoneLast4).toBe('7766');
        expect(JSON.stringify(body)).not.toContain('1099887766');
        expect(JSON.stringify(body)).not.toContain(clientPhone);
      });

    await request(app.getHttpServer())
      .post('/lead-claims')
      .set('Authorization', `Bearer ${brokerOneToken}`)
      .send({
        clientName: 'Slice Four Client',
        phone: clientPhone,
        projectId: project.body.id,
        unitId: unitForApproval.body.id,
        notes: 'Same broker can safely reuse this claim',
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.id).toBe(firstClaim.body.id);
        expect(body.lead.notes).toBe('Same broker can safely reuse this claim');
      });

    await request(app.getHttpServer())
      .post('/lead-claims')
      .set('Authorization', `Bearer ${brokerTwoToken}`)
      .send({
        clientName: 'Competing Broker Client',
        phone: clientPhone,
        projectId: project.body.id,
        unitId: unitForApproval.body.id,
      })
      .expect(409)
      .expect(({ body }) => {
        expect(JSON.stringify(body)).not.toContain(firstClaim.body.brokerUserId);
      });

    let conflictId = '';
    await request(app.getHttpServer())
      .get('/lead-claims/conflicts')
      .set('Authorization', `Bearer ${brokerTwoToken}`)
      .expect(200)
      .expect(({ body }) => {
        const conflict = body.find(
          (item: { existingClaimId: string }) =>
            item.existingClaimId === firstClaim.body.id,
        );
        expect(conflict).toBeTruthy();
        expect(conflict.existingClaim.broker).toBeUndefined();
        conflictId = conflict.id;
      });

    await request(app.getHttpServer())
      .patch(`/lead-claims/conflicts/${conflictId}/resolve`)
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ resolution: 'FIRST_WINS', notes: 'First active claim keeps ownership.' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.resolution).toBe('FIRST_WINS');
      });

    const reservation = await request(app.getHttpServer())
      .post('/reservation-requests')
      .set('Authorization', `Bearer ${brokerOneToken}`)
      .send({
        leadClaimId: firstClaim.body.id,
        notes: 'Client wants this unit.',
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.status).toBe('PENDING');
        expect(body.unitId).toBe(unitForApproval.body.id);
      });

    await request(app.getHttpServer())
      .post('/reservation-requests')
      .set('Authorization', `Bearer ${brokerOneToken}`)
      .send({ leadClaimId: `missing-${stamp}`, unitId: unitForApproval.body.id })
      .expect(404);

    await request(app.getHttpServer())
      .patch(`/reservation-requests/${reservation.body.id}/approve`)
      .set('Authorization', `Bearer ${unauthorizedDeveloperToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/reservation-requests/${reservation.body.id}/approve`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('APPROVED');
        expect(body.unit.status).toBe('HELD');
      });

    const heldUnit = await prisma.inventoryUnit.findUniqueOrThrow({
      where: { id: unitForApproval.body.id },
      include: { availabilityRecords: true },
    });
    expect(heldUnit.status).toBe('HELD');
    expect(heldUnit.availabilityRecords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          reservationRequestId: reservation.body.id,
          heldType: 'RESERVATION',
          releasedAt: null,
        }),
      ]),
    );

    const rejectionRequest = await request(app.getHttpServer())
      .post('/reservation-requests')
      .set('Authorization', `Bearer ${brokerOneToken}`)
      .send({
        leadClaimId: firstClaim.body.id,
        unitId: unitForRejection.body.id,
        notes: 'Alternative unit request.',
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/reservation-requests/${rejectionRequest.body.id}/reject`)
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ reason: 'Unit is reserved for a direct buyer.' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('REJECTED');
        expect(body.rejectionReason).toBe('Unit is reserved for a direct buyer.');
      });

    const auditActions = await prisma.auditLog.findMany({
      where: {
        action: {
          in: [
            'lead_claim.created',
            'lead_claim.duplicate_detected',
            'lead_claim.conflict_created',
            'reservation_request.created',
            'reservation_request.approved',
            'reservation_request.rejected',
            'unit.held_for_reservation',
          ],
        },
      },
      select: { action: true },
    });
    expect(auditActions.map((item) => item.action)).toEqual(
      expect.arrayContaining([
        'lead_claim.created',
        'lead_claim.duplicate_detected',
        'lead_claim.conflict_created',
        'reservation_request.created',
        'reservation_request.approved',
        'reservation_request.rejected',
        'unit.held_for_reservation',
      ]),
    );

    await expect(
      prisma.dealRoom.count({
        where: {
          reservationRequestId: {
            in: [reservation.body.id, rejectionRequest.body.id],
          },
        },
      }),
    ).resolves.toBe(0);
  });

  function createBrokerUser(email: string, token: string, password: string) {
    return request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email,
        password,
        firstName: 'Team2',
        lastName: 'Broker',
        role: 'broker',
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
      lastName: 'Slice4',
    })
    .expect(201);
}

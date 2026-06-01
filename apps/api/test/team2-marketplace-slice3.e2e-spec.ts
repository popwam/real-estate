import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Team 2 marketplace Slice 3 contracts (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('enforces marketplace visibility for projects, units, access rules, and map search', async () => {
    const stamp = Date.now();
    const password = 'Passw0rd!Slice3';

    const developer = await register(
      app,
      `team2-slice3-dev+${stamp}@popwam.local`,
      `Slice 3 Developer ${stamp}`,
      'DEVELOPER',
      password,
    );
    const developerToken = developer.body.accessToken;

    const brokerage = await register(
      app,
      `team2-slice3-brokerage+${stamp}@popwam.local`,
      `Slice 3 Brokerage ${stamp}`,
      'BROKERAGE',
      password,
    );
    const brokerageToken = brokerage.body.accessToken;
    const brokerageId = brokerage.body.organization.id;

    const brokerOne = await createBrokerUser(
      `team2-slice3-broker-one+${stamp}@popwam.local`,
      brokerageToken,
      password,
    );
    const brokerOneToken = await login(
      `team2-slice3-broker-one+${stamp}@popwam.local`,
      password,
    );

    await createBrokerUser(
      `team2-slice3-broker-two+${stamp}@popwam.local`,
      brokerageToken,
      password,
    );
    const brokerTwoToken = await login(
      `team2-slice3-broker-two+${stamp}@popwam.local`,
      password,
    );

    const openProject = await createProject(developerToken, stamp, {
      name: `Slice 3 Open ${stamp}`,
      slug: `slice-3-open-${stamp}`,
      visibility: 'OPEN_MARKETPLACE',
      latitude: 30.01,
      longitude: 31.01,
    });
    const openUnit = await createUnit(developerToken, openProject.body.id, stamp, {
      unitNumber: `S3-OPEN-${stamp}`,
      basePrice: 1500000,
      bedrooms: 2,
      areaSqm: 120,
    });
    const hiddenUnit = await createUnit(
      developerToken,
      openProject.body.id,
      stamp,
      {
        unitNumber: `S3-HIDDEN-UNIT-${stamp}`,
        visibility: 'HIDDEN',
      },
    );

    const privateProject = await createProject(developerToken, stamp, {
      name: `Slice 3 Private ${stamp}`,
      slug: `slice-3-private-${stamp}`,
      visibility: 'PRIVATE',
      latitude: 30.02,
      longitude: 31.02,
    });
    const privateUnit = await createUnit(
      developerToken,
      privateProject.body.id,
      stamp,
      { unitNumber: `S3-PRIVATE-UNIT-${stamp}` },
    );

    const hiddenProject = await createProject(developerToken, stamp, {
      name: `Slice 3 Hidden ${stamp}`,
      slug: `slice-3-hidden-${stamp}`,
      visibility: 'HIDDEN',
      latitude: 30.03,
      longitude: 31.03,
    });

    const approvedProject = await createProject(developerToken, stamp, {
      name: `Slice 3 Approved ${stamp}`,
      slug: `slice-3-approved-${stamp}`,
      visibility: 'APPROVED_BROKERAGES',
      latitude: 30.04,
      longitude: 31.04,
    });
    const approvedUnit = await createUnit(
      developerToken,
      approvedProject.body.id,
      stamp,
      { unitNumber: `S3-APPROVED-UNIT-${stamp}` },
    );

    const selectedProject = await createProject(developerToken, stamp, {
      name: `Slice 3 Selected ${stamp}`,
      slug: `slice-3-selected-${stamp}`,
      visibility: 'SELECTED_BROKERS',
      latitude: 30.05,
      longitude: 31.05,
    });
    const selectedUnit = await createUnit(
      developerToken,
      selectedProject.body.id,
      stamp,
      { unitNumber: `S3-SELECTED-UNIT-${stamp}` },
    );

    await request(app.getHttpServer())
      .get('/marketplace/projects')
      .set('Authorization', `Bearer ${brokerageToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(ids(body)).toContain(openProject.body.id);
        expect(ids(body)).not.toContain(privateProject.body.id);
        expect(ids(body)).not.toContain(hiddenProject.body.id);
        expect(ids(body)).not.toContain(approvedProject.body.id);
        expect(ids(body)).not.toContain(selectedProject.body.id);
      });

    await request(app.getHttpServer())
      .get('/marketplace/units')
      .set('Authorization', `Bearer ${brokerageToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(ids(body)).toContain(openUnit.body.id);
        expect(ids(body)).not.toContain(hiddenUnit.body.id);
        expect(ids(body)).not.toContain(privateUnit.body.id);
        expect(ids(body)).not.toContain(approvedUnit.body.id);
      });

    await request(app.getHttpServer())
      .post('/broker-access-rules')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({
        projectId: approvedProject.body.id,
        granteeType: 'BROKERAGE',
        granteeId: brokerageId,
        accessLevel: 'VIEW',
      })
      .expect(201);

    await request(app.getHttpServer())
      .get('/marketplace/projects')
      .set('Authorization', `Bearer ${brokerageToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(ids(body)).toContain(approvedProject.body.id);
      });

    await request(app.getHttpServer())
      .get('/marketplace/units')
      .set('Authorization', `Bearer ${brokerageToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(ids(body)).toContain(approvedUnit.body.id);
      });

    await request(app.getHttpServer())
      .post('/broker-access-rules')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({
        projectId: selectedProject.body.id,
        granteeType: 'BROKER',
        granteeId: brokerOne.body.id,
        accessLevel: 'VIEW_PRICE',
      })
      .expect(201);

    await request(app.getHttpServer())
      .get('/marketplace/projects')
      .set('Authorization', `Bearer ${brokerOneToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(ids(body)).toContain(selectedProject.body.id);
      });

    await request(app.getHttpServer())
      .get('/marketplace/projects')
      .set('Authorization', `Bearer ${brokerTwoToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(ids(body)).not.toContain(selectedProject.body.id);
      });

    await request(app.getHttpServer())
      .get(`/marketplace/units/${selectedUnit.body.id}`)
      .set('Authorization', `Bearer ${brokerOneToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .post('/marketplace/map-search')
      .set('Authorization', `Bearer ${brokerageToken}`)
      .send({
        bbox: {
          minLat: 30,
          maxLat: 30.06,
          minLng: 31,
          maxLng: 31.06,
        },
        filters: { city: 'Cairo', minPrice: '1000000', maxPrice: '3000000' },
      })
      .expect(201)
      .expect(({ body }) => {
        expect(ids(body.projects)).toContain(openProject.body.id);
        expect(ids(body.projects)).toContain(approvedProject.body.id);
        expect(ids(body.projects)).not.toContain(privateProject.body.id);
        expect(ids(body.projects)).not.toContain(hiddenProject.body.id);
      });

    const platform = await register(
      app,
      `team2-slice3-platform+${stamp}@popwam.local`,
      `Slice 3 Platform ${stamp}`,
      'PLATFORM',
      password,
    );
    const platformToken = platform.body.accessToken;

    await request(app.getHttpServer())
      .get('/marketplace/projects')
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(ids(body)).toEqual(
          expect.arrayContaining([
            openProject.body.id,
            privateProject.body.id,
            hiddenProject.body.id,
          ]),
        );
      });

    await request(app.getHttpServer())
      .get('/marketplace/units')
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(ids(body)).toEqual(
          expect.arrayContaining([openUnit.body.id, hiddenUnit.body.id]),
        );
      });
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

  function createUnit(
    token: string,
    projectId: string,
    stamp: number,
    data: Record<string, unknown>,
  ) {
    return request(app.getHttpServer())
      .post('/inventory/units')
      .set('Authorization', `Bearer ${token}`)
      .send({
        projectId,
        unitType: 'APARTMENT',
        status: 'AVAILABLE',
        visibility: 'INHERIT_PROJECT',
        basePrice: 1800000,
        bedrooms: 3,
        areaSqm: 140,
        ...data,
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
      lastName: 'Slice3',
    })
    .expect(201);
}

function ids(items: Array<{ id: string }> | undefined) {
  return (items ?? []).map((item) => item.id);
}

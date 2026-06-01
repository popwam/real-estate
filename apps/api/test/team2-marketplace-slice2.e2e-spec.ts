import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Team 2 marketplace Slice 2 contracts (e2e)', () => {
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

  it('supports visibility, broker access rules, agreements, and scoped inventory', async () => {
    const stamp = Date.now();
    const password = 'Passw0rd!Slice2';

    const developer = await register(
      app,
      `team2-slice2-dev+${stamp}@popwam.local`,
      `Slice 2 Developer ${stamp}`,
      'DEVELOPER',
      password,
    );
    const developerToken = developer.body.accessToken;

    const project = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({
        name: `Slice 2 Project ${stamp}`,
        type: 'COMPOUND',
        city: 'Cairo',
        district: 'New Cairo',
        visibility: 'PRIVATE',
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/projects/${project.body.id}/visibility`)
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ visibility: 'APPROVED_BROKERAGES' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.visibility).toBe('APPROVED_BROKERAGES');
      });

    await request(app.getHttpServer())
      .get('/projects')
      .query({ status: 'DRAFT', city: 'Cairo' })
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.some((item: any) => item.id === project.body.id)).toBe(true);
      });

    const phase = await request(app.getHttpServer())
      .post(`/projects/${project.body.id}/phases`)
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ name: 'Phase A', status: 'ACTIVE' })
      .expect(201);

    const unit = await request(app.getHttpServer())
      .post('/inventory/units')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({
        projectId: project.body.id,
        phaseId: phase.body.id,
        unitNumber: `S2-${stamp}`,
        unitType: 'APARTMENT',
        status: 'AVAILABLE',
        visibility: 'INHERIT_PROJECT',
      })
      .expect(201);

    await request(app.getHttpServer())
      .get('/inventory/units')
      .query({ projectId: project.body.id, status: 'AVAILABLE' })
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.some((item: any) => item.id === unit.body.id)).toBe(true);
      });

    await request(app.getHttpServer())
      .patch(`/inventory/units/${unit.body.id}`)
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ visibility: 'OPEN_MARKETPLACE' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.visibility).toBe('OPEN_MARKETPLACE');
      });

    const brokerage = await register(
      app,
      `team2-slice2-brokerage+${stamp}@popwam.local`,
      `Slice 2 Brokerage ${stamp}`,
      'BROKERAGE',
      password,
    );
    const brokerageToken = brokerage.body.accessToken;
    const brokerageId = brokerage.body.organization.id;

    await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${brokerageToken}`)
      .send({ name: 'Blocked Project', type: 'COMPOUND' })
      .expect(403);

    await request(app.getHttpServer())
      .post('/broker-access-rules')
      .set('Authorization', `Bearer ${brokerageToken}`)
      .send({
        projectId: project.body.id,
        granteeType: 'BROKERAGE',
        granteeId: brokerageId,
        accessLevel: 'VIEW',
      })
      .expect(403);

    const accessRule = await request(app.getHttpServer())
      .post('/broker-access-rules')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({
        projectId: project.body.id,
        granteeType: 'BROKERAGE',
        granteeId: brokerageId,
        accessLevel: 'VIEW_PRICE',
      })
      .expect(201);

    await request(app.getHttpServer())
      .get('/broker-access-rules')
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.some((item: any) => item.id === accessRule.body.id)).toBe(true);
      });

    const agreement = await request(app.getHttpServer())
      .post('/agreements')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({
        brokerageId,
        commissionOverride: { defaultPct: 2.5 },
        termsUrl: 'https://example.com/terms.pdf',
      })
      .expect(201);

    await request(app.getHttpServer())
      .get('/agreements')
      .set('Authorization', `Bearer ${brokerageToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.some((item: any) => item.id === agreement.body.id)).toBe(true);
      });

    const otherDeveloper = await register(
      app,
      `team2-slice2-dev-other+${stamp}@popwam.local`,
      `Slice 2 Other Developer ${stamp}`,
      'DEVELOPER',
      password,
    );
    const otherDeveloperToken = otherDeveloper.body.accessToken;

    await request(app.getHttpServer())
      .patch(`/projects/${project.body.id}/visibility`)
      .set('Authorization', `Bearer ${otherDeveloperToken}`)
      .send({ visibility: 'OPEN_MARKETPLACE' })
      .expect(403);

    await request(app.getHttpServer())
      .post('/broker-access-rules')
      .set('Authorization', `Bearer ${otherDeveloperToken}`)
      .send({
        projectId: project.body.id,
        granteeType: 'BROKERAGE',
        granteeId: brokerageId,
        accessLevel: 'VIEW',
      })
      .expect(403);

    await request(app.getHttpServer())
      .get('/inventory/units')
      .set('Authorization', `Bearer ${otherDeveloperToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.some((item: any) => item.id === unit.body.id)).toBe(false);
      });

    const platform = await register(
      app,
      `team2-slice2-platform+${stamp}@popwam.local`,
      `Slice 2 Platform ${stamp}`,
      'PLATFORM',
      password,
    );
    const platformToken = platform.body.accessToken;

    await request(app.getHttpServer())
      .get('/agreements')
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.some((item: any) => item.id === agreement.body.id)).toBe(true);
      });

    await request(app.getHttpServer())
      .get('/broker-access-rules')
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.some((item: any) => item.id === accessRule.body.id)).toBe(true);
      });
  });
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
      lastName: 'Slice2',
    })
    .expect(201);
}

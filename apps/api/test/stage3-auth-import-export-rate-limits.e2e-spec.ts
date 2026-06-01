import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Stage 3 auth and import/export rate limits (e2e)', () => {
  let app: INestApplication<App>;
  const originalEnv = {
    AUTH_LOGIN_RATE_LIMIT_WINDOW_SECONDS:
      process.env.AUTH_LOGIN_RATE_LIMIT_WINDOW_SECONDS,
    AUTH_LOGIN_RATE_LIMIT_MAX: process.env.AUTH_LOGIN_RATE_LIMIT_MAX,
    AUTH_REGISTER_RATE_LIMIT_WINDOW_SECONDS:
      process.env.AUTH_REGISTER_RATE_LIMIT_WINDOW_SECONDS,
    AUTH_REGISTER_RATE_LIMIT_MAX: process.env.AUTH_REGISTER_RATE_LIMIT_MAX,
    AUTH_REFRESH_RATE_LIMIT_WINDOW_SECONDS:
      process.env.AUTH_REFRESH_RATE_LIMIT_WINDOW_SECONDS,
    AUTH_REFRESH_RATE_LIMIT_MAX: process.env.AUTH_REFRESH_RATE_LIMIT_MAX,
    IMPORT_EXPORT_RATE_LIMIT_WINDOW_SECONDS:
      process.env.IMPORT_EXPORT_RATE_LIMIT_WINDOW_SECONDS,
    IMPORT_EXPORT_RATE_LIMIT_MAX: process.env.IMPORT_EXPORT_RATE_LIMIT_MAX,
  };

  beforeAll(async () => {
    process.env.AUTH_LOGIN_RATE_LIMIT_WINDOW_SECONDS = '60';
    process.env.AUTH_LOGIN_RATE_LIMIT_MAX = '2';
    process.env.AUTH_REGISTER_RATE_LIMIT_WINDOW_SECONDS = '300';
    process.env.AUTH_REGISTER_RATE_LIMIT_MAX = '100';
    process.env.AUTH_REFRESH_RATE_LIMIT_WINDOW_SECONDS = '60';
    process.env.AUTH_REFRESH_RATE_LIMIT_MAX = '10';
    process.env.IMPORT_EXPORT_RATE_LIMIT_WINDOW_SECONDS = '300';
    process.env.IMPORT_EXPORT_RATE_LIMIT_MAX = '2';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();

    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it('emits auth rate-limit headers and blocks repeated login attempts', async () => {
    const stamp = Date.now();
    const password = 'Passw0rd!Stage3Rate';
    const email = `stage3-rate-auth+${stamp}@popwam.local`;

    const register = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        organizationName: `Stage 3 Rate Auth ${stamp}`,
        organizationType: 'DEVELOPER',
        email,
        password,
        firstName: 'Stage3',
        lastName: 'Rate',
      })
      .expect(201)
      .expect((response) => {
        expect(response.headers['x-rate-limit-limit']).toBe('100');
        expect(response.headers['x-rate-limit-remaining']).toBeDefined();
        expect(response.headers['x-rate-limit-reset']).toBeDefined();
      });

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: register.body.refreshToken })
      .expect(201)
      .expect((response) => {
        expect(response.headers['x-rate-limit-limit']).toBe('10');
        expect(response.headers['x-rate-limit-remaining']).toBeDefined();
        expect(response.headers['x-rate-limit-reset']).toBeDefined();
      });

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201)
      .expect((response) => {
        expect(response.headers['x-rate-limit-limit']).toBe('2');
        expect(response.headers['x-rate-limit-remaining']).toBeDefined();
        expect(response.headers['x-rate-limit-reset']).toBeDefined();
      });

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'wrong-password' })
      .expect(401)
      .expect((response) => {
        expect(response.headers['x-rate-limit-limit']).toBe('2');
        expect(response.headers['x-rate-limit-remaining']).toBeDefined();
        expect(response.headers['x-rate-limit-reset']).toBeDefined();
      });

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(429)
      .expect((response) => {
        expect(response.headers['x-rate-limit-limit']).toBe('2');
        expect(response.headers['x-rate-limit-remaining']).toBe('0');
        expect(response.headers['x-rate-limit-reset']).toBeDefined();
      });
  });

  it('emits import/export mutation headers and blocks repeated previews', async () => {
    const stamp = Date.now();
    const password = 'Passw0rd!Stage3Import';
    const developer = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        organizationName: `Stage 3 Import Rate ${stamp}`,
        organizationType: 'DEVELOPER',
        email: `stage3-rate-import+${stamp}@popwam.local`,
        password,
        firstName: 'Stage3',
        lastName: 'ImportRate',
      })
      .expect(201);
    const token = developer.body.accessToken;

    const firstPreview = await request(app.getHttpServer())
      .post('/import-export/project-inventory/preview')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sourceFormat: 'JSON',
        originalFileName: 'stage3-rate-a.json',
        rows: [importRow(stamp, 'A')],
      })
      .expect(201)
      .expect((response) => {
        expect(response.headers['x-rate-limit-limit']).toBe('2');
        expect(response.headers['x-rate-limit-remaining']).toBeDefined();
        expect(response.headers['x-rate-limit-reset']).toBeDefined();
      });

    const secondPreview = await request(app.getHttpServer())
      .post('/import-export/project-inventory/preview')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sourceFormat: 'JSON',
        originalFileName: 'stage3-rate-b.json',
        rows: [importRow(stamp, 'B')],
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/import-export/jobs/${firstPreview.body.jobId}/commit`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201)
      .expect((response) => {
        expect(response.headers['x-rate-limit-limit']).toBe('2');
        expect(response.headers['x-rate-limit-remaining']).toBeDefined();
        expect(response.headers['x-rate-limit-reset']).toBeDefined();
      });

    await request(app.getHttpServer())
      .post(`/import-export/jobs/${secondPreview.body.jobId}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201)
      .expect((response) => {
        expect(response.headers['x-rate-limit-limit']).toBe('2');
        expect(response.headers['x-rate-limit-remaining']).toBeDefined();
        expect(response.headers['x-rate-limit-reset']).toBeDefined();
      });

    await request(app.getHttpServer())
      .post('/import-export/project-inventory/preview')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sourceFormat: 'JSON',
        originalFileName: 'stage3-rate-c.json',
        rows: [importRow(stamp, 'C')],
      })
      .expect(429)
      .expect((response) => {
        expect(response.headers['x-rate-limit-limit']).toBe('2');
        expect(response.headers['x-rate-limit-remaining']).toBe('0');
        expect(response.headers['x-rate-limit-reset']).toBeDefined();
      });
  });
});

function importRow(stamp: number, suffix: string) {
  return {
    projectName: `Stage 3 Rate Project ${stamp} ${suffix}`,
    projectSlug: `stage3-rate-project-${stamp}-${suffix.toLowerCase()}`,
    projectType: 'COMPOUND',
    city: 'Cairo',
    district: 'New Cairo',
    projectStatus: 'ACTIVE',
    projectVisibility: 'PRIVATE',
    unitCode: `S3R-${stamp}-${suffix}`,
    unitType: 'APARTMENT',
    areaSqm: 100,
    basePrice: 2000000,
  };
}

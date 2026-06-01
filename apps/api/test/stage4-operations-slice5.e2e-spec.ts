import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/modules/database/prisma.service';
import { AppModule } from './../src/app.module';

describe('Stage 4 operations backend slice 5 (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    process.env.AUTH_LOGIN_RATE_LIMIT_MAX = '1000';
    process.env.AUTH_REGISTER_RATE_LIMIT_MAX = '1000';
    process.env.IMPORT_EXPORT_RATE_LIMIT_MAX = '1000';
    process.env.OPERATIONS_EXPORT_RATE_LIMIT_MAX = '1000';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    delete process.env.AUTH_LOGIN_RATE_LIMIT_MAX;
    delete process.env.AUTH_REGISTER_RATE_LIMIT_MAX;
    delete process.env.IMPORT_EXPORT_RATE_LIMIT_MAX;
    delete process.env.OPERATIONS_EXPORT_RATE_LIMIT_MAX;
    delete process.env.OPERATIONS_EXPORT_RATE_LIMIT_WINDOW_SECONDS;
    await app.close();
  });

  it('previews and commits operations import jobs with valid and invalid rows', async () => {
    const stamp = Date.now();
    const developer = await registerDeveloper(stamp);
    const token = developer.body.accessToken;
    await approveOrg(developer.body.organization.id);

    const preview = await request(app.getHttpServer())
      .post('/import-export/operations/hr-employees/preview')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sourceFormat: 'JSON',
        rows: [
          { name: `Slice 5 Employee, "Quoted"\nLine ${stamp}`, email: `slice5-${stamp}@example.com`, status: 'ACTIVE' },
          { email: 'missing-name@example.com', status: 'ACTIVE' },
        ],
      })
      .expect(201);

    expect(preview.body.validRows).toBe(1);
    expect(preview.body.invalidRows).toBe(1);
    expect(preview.body.rowErrors[0].errors[0].field).toBe('name');

    await request(app.getHttpServer())
      .post(`/import-export/jobs/${preview.body.jobId}/commit`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201)
      .expect(({ body }) => {
        expect(body.status).toBe('COMMITTED');
        expect(body.rowsCommitted).toBe(1);
        expect(body.rowsSkipped).toBe(1);
        expect(body.created).toBe(1);
      });

    const employees = await request(app.getHttpServer())
      .get('/hr/export/employees')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(employees.body.items.some((item: any) => item.email === `slice5-${stamp}@example.com`)).toBe(true);

    const category = await request(app.getHttpServer())
      .post('/accounting/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `Slice 5 Income ${stamp}`, type: 'INCOME' })
      .expect(201);

    const accountingPreview = await request(app.getHttpServer())
      .post('/import-export/operations/accounting-transactions/preview')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sourceFormat: 'CSV',
        csv: [
          'type,amount,currency,categoryId,description,status',
          `INCOME,1250,EGP,${category.body.id},"CSV amount, escaped",DRAFT`,
        ].join('\n'),
      })
      .expect(201);

    expect(accountingPreview.body.validRows).toBe(1);

    await request(app.getHttpServer())
      .post(`/import-export/jobs/${accountingPreview.body.jobId}/commit`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201)
      .expect(({ body }) => {
        expect(body.created).toBe(1);
        expect(body.rowsCommitted).toBe(1);
      });

    const cameraPreview = await request(app.getHttpServer())
      .post('/import-export/operations/camera-devices/preview')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sourceFormat: 'JSON',
        rows: [
          {
            name: `Slice 5 Camera ${stamp}`,
            provider: 'GENERIC',
            status: 'ACTIVE',
            streamUrl: 'rtsp://admin:secret@example.local/stream',
            credentials: 'secret',
          },
        ],
      })
      .expect(201);

    expect(cameraPreview.body.validRows).toBe(1);
    expect(cameraPreview.body.warnings[0].warnings[0].message).toMatch(/ignored/i);

    const job = await request(app.getHttpServer())
      .get(`/import-export/jobs/${cameraPreview.body.jobId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(JSON.stringify(job.body)).not.toContain('rtsp://admin:secret');
    expect(JSON.stringify(job.body)).not.toContain('credentials');

    await request(app.getHttpServer())
      .post(`/import-export/jobs/${cameraPreview.body.jobId}/commit`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    await request(app.getHttpServer())
      .get('/cameras/export/devices')
      .query({ format: 'csv' })
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((response) => {
        expect(response.headers['content-type']).toMatch(/text\/csv/);
        expect(response.text).toContain('Slice 5 Camera');
        expect(response.text).not.toContain('rtsp://');
        expect(response.text).not.toContain('streamUrlMasked');
      });
  });

  it('returns escaped CSV and export rate-limit headers, then blocks after threshold', async () => {
    const stamp = Date.now();
    const developer = await registerDeveloper(stamp + 1);
    const token = developer.body.accessToken;
    await approveOrg(developer.body.organization.id);

    await request(app.getHttpServer())
      .post('/hr/employees')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `CSV, "Escaped"\nEmployee ${stamp}`, email: `csv-${stamp}@example.com` })
      .expect(201);

    await request(app.getHttpServer())
      .get('/hr/export/employees')
      .query({ format: 'csv' })
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((response) => {
        expect(response.headers['content-type']).toMatch(/text\/csv/);
        expect(response.headers['x-rate-limit-limit']).toBeDefined();
        expect(response.headers['x-rate-limit-remaining']).toBeDefined();
        expect(response.headers['x-rate-limit-reset']).toBeDefined();
        expect(response.text).toContain('"CSV, ""Escaped""\nEmployee');
        expect(response.text).not.toContain('passwordHash');
        expect(response.text).not.toContain('userId');
      });

    const previousMax = process.env.OPERATIONS_EXPORT_RATE_LIMIT_MAX;
    const previousWindow = process.env.OPERATIONS_EXPORT_RATE_LIMIT_WINDOW_SECONDS;
    process.env.OPERATIONS_EXPORT_RATE_LIMIT_MAX = '1';
    process.env.OPERATIONS_EXPORT_RATE_LIMIT_WINDOW_SECONDS = '300';

    try {
      await request(app.getHttpServer())
        .get('/legal/export/cases')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((response) => {
          expect(response.headers['x-rate-limit-limit']).toBe('1');
          expect(response.headers['x-rate-limit-remaining']).toBe('0');
        });

      await request(app.getHttpServer())
        .get('/legal/export/cases')
        .set('Authorization', `Bearer ${token}`)
        .expect(429)
        .expect((response) => {
          expect(response.headers['x-rate-limit-limit']).toBe('1');
          expect(response.body.message).toMatch(/Too many operations export requests/i);
        });
    } finally {
      if (previousMax === undefined) delete process.env.OPERATIONS_EXPORT_RATE_LIMIT_MAX;
      else process.env.OPERATIONS_EXPORT_RATE_LIMIT_MAX = previousMax;
      if (previousWindow === undefined) delete process.env.OPERATIONS_EXPORT_RATE_LIMIT_WINDOW_SECONDS;
      else process.env.OPERATIONS_EXPORT_RATE_LIMIT_WINDOW_SECONDS = previousWindow;
    }
  });

  async function registerDeveloper(stamp: number) {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        organizationName: `Stage 4 Slice 5 Developer ${stamp}`,
        organizationType: 'DEVELOPER',
        email: `stage4-slice5-dev+${stamp}@popwam.local`,
        password: 'Passw0rd!Stage5',
        firstName: 'Stage4',
        lastName: 'Slice5',
      })
      .expect(201);
  }

  async function approveOrg(id: string) {
    await prisma.organization.update({ where: { id }, data: { status: 'APPROVED' } });
  }
});

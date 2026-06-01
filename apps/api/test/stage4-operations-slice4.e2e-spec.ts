import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/modules/database/prisma.service';
import { AppModule } from './../src/app.module';

describe('Stage 4 operations backend slice 4 (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    process.env.AUTH_LOGIN_RATE_LIMIT_MAX = '1000';
    process.env.AUTH_REGISTER_RATE_LIMIT_MAX = '1000';
    process.env.OPERATIONS_MUTATION_RATE_LIMIT_MAX = '1000';

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
    delete process.env.OPERATIONS_MUTATION_RATE_LIMIT_MAX;
    await app.close();
  });

  it('supports scoped bulk actions, JSON exports, and approval foundations', async () => {
    const stamp = Date.now();
    const password = 'Passw0rd!Stage4Slice4';

    const developer = await registerOrg(
      `stage4-slice4-dev+${stamp}@popwam.local`,
      `Stage 4 Slice 4 Developer ${stamp}`,
      'DEVELOPER',
      password,
    );
    const developerToken = developer.body.accessToken;
    const developerOrgId = developer.body.organization.id;

    const otherDeveloper = await registerOrg(
      `stage4-slice4-other+${stamp}@popwam.local`,
      `Stage 4 Slice 4 Other ${stamp}`,
      'DEVELOPER',
      password,
    );
    const otherDeveloperToken = otherDeveloper.body.accessToken;
    const otherOrgId = otherDeveloper.body.organization.id;

    await prisma.organization.updateMany({
      where: { id: { in: [developerOrgId, otherOrgId] } },
      data: { status: 'APPROVED' },
    });

    const department = await request(app.getHttpServer())
      .post('/hr/departments')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ name: `Slice 4 HR ${stamp}` })
      .expect(201);

    const employee = await request(app.getHttpServer())
      .post('/hr/employees')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ name: `Slice 4 Employee ${stamp}`, departmentId: department.body.id, status: 'ACTIVE' })
      .expect(201);

    const otherEmployee = await request(app.getHttpServer())
      .post('/hr/employees')
      .set('Authorization', `Bearer ${otherDeveloperToken}`)
      .send({ name: `Other Slice 4 Employee ${stamp}`, status: 'ACTIVE' })
      .expect(201);

    await request(app.getHttpServer())
      .patch('/hr/employees/bulk/status')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ ids: [employee.body.id], status: 'INACTIVE' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.updatedCount).toBe(1);
        expect(body.status).toBe('INACTIVE');
      });

    await request(app.getHttpServer())
      .patch('/hr/employees/bulk/status')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ ids: [employee.body.id, otherEmployee.body.id], status: 'ACTIVE' })
      .expect(400);

    await request(app.getHttpServer())
      .get('/hr/export/employees')
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.dataset).toBe('hr.employees');
        expect(body.items.some((item: any) => item.id === employee.body.id)).toBe(true);
        expect(body.items.some((item: any) => item.organizationId === otherOrgId)).toBe(false);
        expect(body.items[0]).not.toHaveProperty('userId');
        expect(body.items[0]).not.toHaveProperty('passwordHash');
      });

    const legalDocument = await request(app.getHttpServer())
      .post('/legal/documents')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ title: `Slice 4 Contract ${stamp}`, type: 'CONTRACT', status: 'DRAFT' })
      .expect(201);

    const otherLegalDocument = await request(app.getHttpServer())
      .post('/legal/documents')
      .set('Authorization', `Bearer ${otherDeveloperToken}`)
      .send({ title: `Other Slice 4 Contract ${stamp}`, type: 'CONTRACT', status: 'DRAFT' })
      .expect(201);

    await request(app.getHttpServer())
      .patch('/legal/documents/bulk/status')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ ids: [legalDocument.body.id], status: 'ACTIVE' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.updatedCount).toBe(1);
        expect(body.status).toBe('ACTIVE');
      });

    await request(app.getHttpServer())
      .patch('/legal/documents/bulk/status')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ ids: [legalDocument.body.id, otherLegalDocument.body.id], status: 'ARCHIVED' })
      .expect(400);

    await request(app.getHttpServer())
      .patch(`/legal/documents/${legalDocument.body.id}/approve`)
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ reviewNote: 'Approved in Slice 4 e2e.' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('ACTIVE');
        expect(body.reviewedByUserId).toBe(developer.body.user.id);
        expect(body.reviewedAt).toBeTruthy();
      });

    await request(app.getHttpServer())
      .patch(`/legal/documents/${legalDocument.body.id}/reject`)
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ reviewNote: 'Rejected in Slice 4 e2e.' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('ARCHIVED');
        expect(body.reviewNote).toBe('Rejected in Slice 4 e2e.');
      });

    const category = await request(app.getHttpServer())
      .post('/accounting/categories')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ name: `Slice 4 Income ${stamp}`, type: 'INCOME' })
      .expect(201);

    const transaction = await request(app.getHttpServer())
      .post('/accounting/transactions')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ type: 'INCOME', amount: 2500, currency: 'EGP', categoryId: category.body.id, description: 'Slice 4 transaction' })
      .expect(201);
    expect(transaction.body.status).toBe('DRAFT');

    await request(app.getHttpServer())
      .patch(`/accounting/transactions/${transaction.body.id}/approve`)
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ approvalNote: 'Approved in Slice 4 e2e.' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('APPROVED');
        expect(body.approvedByUserId).toBe(developer.body.user.id);
        expect(body.approvedAt).toBeTruthy();
      });

    await request(app.getHttpServer())
      .patch(`/accounting/transactions/${transaction.body.id}/reject`)
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ approvalNote: 'Rejected in Slice 4 e2e.' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('REJECTED');
        expect(body.approvalNote).toBe('Rejected in Slice 4 e2e.');
      });

    const camera = await request(app.getHttpServer())
      .post('/cameras/devices')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({
        name: `Slice 4 Camera ${stamp}`,
        provider: 'GENERIC',
        status: 'ACTIVE',
        streamUrlMasked: 'rtsp://***:***@camera.local/stream',
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch('/cameras/devices/bulk/status')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ ids: [camera.body.id], status: 'INACTIVE' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('INACTIVE');
      });

    await request(app.getHttpServer())
      .get('/cameras/export/devices')
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        const exported = body.items.find((item: any) => item.id === camera.body.id);
        expect(exported).toBeTruthy();
        expect(exported).not.toHaveProperty('streamUrlMasked');
        expect(JSON.stringify(exported)).not.toContain('rtsp://');
      });

    await request(app.getHttpServer())
      .get('/operations/export/activities')
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.dataset).toBe('operations.activities');
        expect(body.items.length).toBeGreaterThan(0);
        expect(body.items.some((item: any) => item.organizationId === developerOrgId)).toBe(true);
        expect(body.items.some((item: any) => item.organizationId === otherOrgId)).toBe(false);
      });
  });

  function registerOrg(
    email: string,
    organizationName: string,
    organizationType: 'DEVELOPER',
    password: string,
  ) {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        organizationName,
        organizationType,
        email,
        password,
        firstName: 'Stage4',
        lastName: 'Slice4',
      })
      .expect(201);
  }
});

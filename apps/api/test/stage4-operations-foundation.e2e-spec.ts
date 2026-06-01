import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/modules/database/prisma.service';
import { AppModule } from './../src/app.module';

describe('Stage 4 operations modules foundation (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    process.env.AUTH_LOGIN_RATE_LIMIT_MAX = '1000';
    process.env.AUTH_REGISTER_RATE_LIMIT_MAX = '1000';
    process.env.CRM_MUTATION_RATE_LIMIT_MAX = '1000';
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
    delete process.env.CRM_MUTATION_RATE_LIMIT_MAX;
    delete process.env.OPERATIONS_MUTATION_RATE_LIMIT_WINDOW_SECONDS;
    delete process.env.OPERATIONS_MUTATION_RATE_LIMIT_MAX;
    await app.close();
  });

  it('supports scoped CRM pipeline, notes, tasks, and operations foundations', async () => {
    const stamp = Date.now();
    const password = 'Passw0rd!Stage4';

    const developer = await registerOrg(
      `stage4-dev+${stamp}@popwam.local`,
      `Stage 4 Developer ${stamp}`,
      'DEVELOPER',
      password,
    );
    const developerToken = developer.body.accessToken;
    const developerOrgId = developer.body.organization.id;

    const otherDeveloper = await registerOrg(
      `stage4-other-dev+${stamp}@popwam.local`,
      `Stage 4 Other Developer ${stamp}`,
      'DEVELOPER',
      password,
    );
    const otherDeveloperToken = otherDeveloper.body.accessToken;

    const platform = await registerOrg(
      `stage4-platform+${stamp}@popwam.local`,
      `Stage 4 Platform ${stamp}`,
      'PLATFORM',
      password,
    );
    const platformToken = platform.body.accessToken;

    await prisma.organization.updateMany({
      where: { id: { in: [developerOrgId, otherDeveloper.body.organization.id, platform.body.organization.id] } },
      data: { status: 'APPROVED' },
    });

    const client = await prisma.crmClient.create({
      data: {
        organizationId: developerOrgId,
        name: `Stage 4 Buyer ${stamp}`,
        phone: `+20155${String(stamp).slice(-8)}`,
        phoneLast4: String(stamp).slice(-4),
        normalizedPhone: `20155${String(stamp).slice(-8)}`,
        phoneHash: `stage4-phone-${stamp}`,
        email: `stage4-buyer-${stamp}@example.com`,
        normalizedEmail: `stage4-buyer-${stamp}@example.com`,
        source: 'stage4-e2e',
      },
    });
    const lead = await prisma.crmLead.create({
      data: {
        organizationId: developerOrgId,
        clientId: client.id,
        status: 'NEW',
        preferredContactMethod: 'CALL',
        sourcePage: '/stage4/e2e',
      },
    });

    const stages = await request(app.getHttpServer())
      .get('/crm/pipeline/stages')
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200);
    expect(stages.body.length).toBeGreaterThanOrEqual(7);

    const customStage = await request(app.getHttpServer())
      .post('/crm/pipeline/stages')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ name: `Custom Stage ${stamp}`, color: '#111827' })
      .expect(201);
    expect(customStage.body.key).toContain('CUSTOM_STAGE');

    await request(app.getHttpServer())
      .patch('/crm/pipeline/stages/reorder')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ stages: [{ id: customStage.body.id, order: 1 }] })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/crm/leads/${lead.id}/stage`)
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ stageId: customStage.body.id, note: 'Moved in Stage 4 e2e.' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.pipelineStageId).toBe(customStage.body.id);
      });

    await request(app.getHttpServer())
      .get(`/crm/leads/${lead.id}/stage-history`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.some((item: any) => item.toStageId === customStage.body.id)).toBe(true);
      });

    await request(app.getHttpServer())
      .get(`/crm/leads/${lead.id}/activities`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.items.some((item: any) => item.type === 'LEAD_STAGE_CHANGED')).toBe(true);
      });

    await request(app.getHttpServer())
      .patch(`/crm/leads/${lead.id}/stage`)
      .set('Authorization', `Bearer ${otherDeveloperToken}`)
      .send({ stageId: customStage.body.id })
      .expect(403);

    const note = await request(app.getHttpServer())
      .post(`/crm/leads/${lead.id}/notes`)
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ body: 'Internal Stage 4 note.' })
      .expect(201);
    expect(note.body.body).toBe('Internal Stage 4 note.');

    await request(app.getHttpServer())
      .get(`/crm/leads/${lead.id}/notes`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.some((item: any) => item.id === note.body.id)).toBe(true);
      });

    const task = await request(app.getHttpServer())
      .post('/crm/tasks')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ crmLeadId: lead.id, title: 'Call buyer', priority: 'HIGH' })
      .expect(201);
    expect(task.body.status).toBe('OPEN');

    await request(app.getHttpServer())
      .patch(`/crm/tasks/${task.body.id}/complete`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('DONE');
      });

    const department = await request(app.getHttpServer())
      .post('/hr/departments')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ name: `Sales ${stamp}` })
      .expect(201);

    await request(app.getHttpServer())
      .get('/hr/departments')
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.some((item: any) => item.id === department.body.id)).toBe(true);
      });

    await request(app.getHttpServer())
      .patch(`/hr/departments/${department.body.id}`)
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ name: `Sales Updated ${stamp}` })
      .expect(200);

    await request(app.getHttpServer())
      .get(`/hr/departments/${department.body.id}`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.id).toBe(department.body.id);
      });

    const employee = await request(app.getHttpServer())
      .post('/hr/employees')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ name: `Employee ${stamp}`, departmentId: department.body.id, roleTitle: 'Sales Agent' })
      .expect(201);
    expect(employee.body.departmentId).toBe(department.body.id);

    await request(app.getHttpServer())
      .patch(`/hr/employees/${employee.body.id}`)
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ roleTitle: 'Senior Sales Agent' })
      .expect(200);

    await request(app.getHttpServer())
      .get(`/hr/employees/${employee.body.id}`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.id).toBe(employee.body.id);
      });

    const attendance = await request(app.getHttpServer())
      .post('/hr/attendance')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ employeeId: employee.body.id, status: 'PRESENT' })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/hr/attendance/${attendance.body.id}`)
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ status: 'LATE', note: 'Arrived after standup.' })
      .expect(200);

    await request(app.getHttpServer())
      .get(`/hr/attendance/${attendance.body.id}`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.id).toBe(attendance.body.id);
      });

    const category = await request(app.getHttpServer())
      .post('/accounting/categories')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ name: `Sales Income ${stamp}`, type: 'INCOME' })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/accounting/categories/${category.body.id}`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.id).toBe(category.body.id);
      });

    const transaction = await request(app.getHttpServer())
      .post('/accounting/transactions')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ type: 'INCOME', amount: 1250, currency: 'EGP', categoryId: category.body.id, description: 'Stage 4 income' })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/accounting/transactions/${transaction.body.id}`)
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ amount: 1350 })
      .expect(200);

    await request(app.getHttpServer())
      .get(`/accounting/transactions/${transaction.body.id}`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.id).toBe(transaction.body.id);
      });

    await request(app.getHttpServer())
      .get('/accounting/summary')
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.income).toBeGreaterThanOrEqual(1250);
        expect(body.net).toBeGreaterThanOrEqual(1250);
      });

    const legalDocument = await request(app.getHttpServer())
      .post('/legal/documents')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ title: `Contract ${stamp}`, type: 'CONTRACT', status: 'ACTIVE' })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/legal/documents/${legalDocument.body.id}`)
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ status: 'ARCHIVED' })
      .expect(200);

    await request(app.getHttpServer())
      .get(`/legal/documents/${legalDocument.body.id}`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.id).toBe(legalDocument.body.id);
      });

    const legalCase = await request(app.getHttpServer())
      .post('/legal/cases')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ title: `Case ${stamp}`, description: 'Foundation case.' })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/legal/cases/${legalCase.body.id}`)
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ status: 'ON_HOLD' })
      .expect(200);

    await request(app.getHttpServer())
      .get(`/legal/cases/${legalCase.body.id}`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.id).toBe(legalCase.body.id);
      });

    const campaign = await request(app.getHttpServer())
      .post('/ads/campaigns')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ name: `Campaign ${stamp}`, provider: 'META', status: 'DRAFT', budgetAmount: 500, currency: 'EGP' })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/ads/campaigns/${campaign.body.id}`)
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ status: 'PAUSED' })
      .expect(200);

    await request(app.getHttpServer())
      .get(`/ads/campaigns/${campaign.body.id}`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.id).toBe(campaign.body.id);
      });

    const camera = await request(app.getHttpServer())
      .post('/cameras/devices')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ name: `Lobby Camera ${stamp}`, provider: 'GENERIC', location: 'Lobby', status: 'ACTIVE' })
      .expect(201)
      .expect(({ body }) => {
        expect(body.streamUrlMasked).toBeNull();
      });

    await request(app.getHttpServer())
      .patch(`/cameras/devices/${camera.body.id}`)
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ aiEnabled: true })
      .expect(200);

    await request(app.getHttpServer())
      .get(`/cameras/devices/${camera.body.id}`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.id).toBe(camera.body.id);
        expect(body.streamUrlMasked).toBeNull();
      });

    for (const path of ['/operations/summary', '/hr/summary', '/legal/summary', '/ads/summary', '/cameras/summary']) {
      await request(app.getHttpServer())
        .get(path)
        .set('Authorization', `Bearer ${developerToken}`)
        .expect(200);
    }

    await request(app.getHttpServer())
      .get('/operations/activities')
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.pagination.total).toBeGreaterThanOrEqual(10);
        expect(body.items.some((item: any) => item.module === 'HR' && item.action === 'UPDATED')).toBe(true);
        expect(body.items.some((item: any) => item.module === 'ACCOUNTING' && item.entityType === 'AccountingTransaction')).toBe(true);
        expect(body.items.some((item: any) => item.module === 'LEGAL')).toBe(true);
        expect(body.items.some((item: any) => item.module === 'ADS')).toBe(true);
        expect(body.items.some((item: any) => item.module === 'CAMERAS')).toBe(true);
      });

    await request(app.getHttpServer())
      .get(`/operations/activities/HR/HrDepartment/${department.body.id}`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.items.some((item: any) => item.entityId === department.body.id)).toBe(true);
      });

    await request(app.getHttpServer())
      .get(`/hr/departments/${department.body.id}`)
      .set('Authorization', `Bearer ${otherDeveloperToken}`)
      .expect(404);

    await request(app.getHttpServer())
      .get('/hr/departments')
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.some((item: any) => item.id === department.body.id)).toBe(true);
      });

    await request(app.getHttpServer())
      .get('/operations/activities')
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.items.some((item: any) => item.organizationId === developerOrgId)).toBe(true);
      });
  });

  it('emits operation rate-limit headers and blocks after the configured threshold', async () => {
    const stamp = Date.now();
    const password = 'Passw0rd!Stage4Limit';
    const previousWindow = process.env.OPERATIONS_MUTATION_RATE_LIMIT_WINDOW_SECONDS;
    const previousMax = process.env.OPERATIONS_MUTATION_RATE_LIMIT_MAX;
    process.env.OPERATIONS_MUTATION_RATE_LIMIT_WINDOW_SECONDS = '300';
    process.env.OPERATIONS_MUTATION_RATE_LIMIT_MAX = '1';

    try {
      const developer = await registerOrg(
        `stage4-limit-dev+${stamp}@popwam.local`,
        `Stage 4 Limit Developer ${stamp}`,
        'DEVELOPER',
        password,
      );
      const developerToken = developer.body.accessToken;
      await prisma.organization.update({
        where: { id: developer.body.organization.id },
        data: { status: 'APPROVED' },
      });

      await request(app.getHttpServer())
        .post('/hr/departments')
        .set('Authorization', `Bearer ${developerToken}`)
        .send({ name: `Limited HR ${stamp}` })
        .expect(201)
        .expect((response) => {
          expect(response.headers['x-rate-limit-limit']).toBe('1');
          expect(response.headers['x-rate-limit-remaining']).toBe('0');
          expect(response.headers['x-rate-limit-reset']).toBeDefined();
        });

      await request(app.getHttpServer())
        .post('/hr/departments')
        .set('Authorization', `Bearer ${developerToken}`)
        .send({ name: `Limited HR Blocked ${stamp}` })
        .expect(429)
        .expect((response) => {
          expect(response.headers['x-rate-limit-limit']).toBe('1');
          expect(response.headers['x-rate-limit-remaining']).toBe('0');
          expect(response.body.message).toMatch(/Too many operations requests/i);
        });
    } finally {
      if (previousWindow === undefined) delete process.env.OPERATIONS_MUTATION_RATE_LIMIT_WINDOW_SECONDS;
      else process.env.OPERATIONS_MUTATION_RATE_LIMIT_WINDOW_SECONDS = previousWindow;
      if (previousMax === undefined) delete process.env.OPERATIONS_MUTATION_RATE_LIMIT_MAX;
      else process.env.OPERATIONS_MUTATION_RATE_LIMIT_MAX = previousMax;
    }
  });

  function registerOrg(
    email: string,
    organizationName: string,
    organizationType: 'DEVELOPER' | 'PLATFORM',
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
        lastName: 'Ops',
      })
      .expect(201);
  }
});

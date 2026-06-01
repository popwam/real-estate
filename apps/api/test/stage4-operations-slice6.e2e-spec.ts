import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/modules/database/prisma.service';
import { AppModule } from './../src/app.module';

describe('Stage 4 operations backend slice 6 (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    process.env.AUTH_LOGIN_RATE_LIMIT_MAX = '1000';
    process.env.AUTH_REGISTER_RATE_LIMIT_MAX = '1000';
    process.env.OPERATIONS_MUTATION_RATE_LIMIT_MAX = '1000';
    process.env.OPERATIONS_REPORT_RATE_LIMIT_MAX = '1000';
    process.env.IMPORT_EXPORT_RATE_LIMIT_MAX = '1000';

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
    delete process.env.OPERATIONS_REPORT_RATE_LIMIT_MAX;
    delete process.env.OPERATIONS_REPORT_RATE_LIMIT_WINDOW_SECONDS;
    delete process.env.IMPORT_EXPORT_RATE_LIMIT_MAX;
    await app.close();
  });

  it('returns safe advanced reports, platform scope, and no cross-organization leakage', async () => {
    const stamp = Date.now();
    const developer = await registerOrg(`stage4-slice6-dev+${stamp}@popwam.local`, `Slice 6 Developer ${stamp}`, 'DEVELOPER');
    const otherDeveloper = await registerOrg(`stage4-slice6-other+${stamp}@popwam.local`, `Slice 6 Other ${stamp}`, 'DEVELOPER');
    const platform = await registerOrg(`stage4-slice6-platform+${stamp}@popwam.local`, `Slice 6 Platform ${stamp}`, 'PLATFORM');
    const developerToken = developer.body.accessToken;
    const otherToken = otherDeveloper.body.accessToken;
    const platformToken = platform.body.accessToken;
    const developerOrgId = developer.body.organization.id;
    const otherOrgId = otherDeveloper.body.organization.id;

    await prisma.organization.updateMany({
      where: { id: { in: [developerOrgId, otherOrgId, platform.body.organization.id] } },
      data: { status: 'APPROVED' },
    });

    const employee = await request(app.getHttpServer())
      .post('/hr/employees')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ name: `Slice 6 Employee ${stamp}`, status: 'ACTIVE' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/hr/employees')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ name: `Other Slice 6 Employee ${stamp}`, status: 'ACTIVE' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/hr/attendance')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ employeeId: employee.body.id, status: 'PRESENT' })
      .expect(201);

    const incomeCategory = await request(app.getHttpServer())
      .post('/accounting/categories')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ name: `Slice 6 Income ${stamp}`, type: 'INCOME' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/accounting/transactions')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ type: 'INCOME', amount: 1500, currency: 'EGP', categoryId: incomeCategory.body.id, description: 'Slice 6 income' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/accounting/transactions')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ type: 'EXPENSE', amount: 400, currency: 'EGP', description: 'Slice 6 expense' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/legal/documents')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ title: `Slice 6 Contract ${stamp}`, type: 'CONTRACT', status: 'EXPIRED' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/legal/cases')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ title: `Slice 6 Case ${stamp}`, description: `confidential legal narrative ${stamp}`, status: 'OPEN' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/ads/campaigns')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ name: `Slice 6 Campaign ${stamp}`, provider: 'META', status: 'ACTIVE', budgetAmount: 750, externalAccountId: `acct-${stamp}` })
      .expect(201);

    await request(app.getHttpServer())
      .post('/cameras/devices')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({ name: `Slice 6 Camera ${stamp}`, provider: 'GENERIC', status: 'ACTIVE', aiEnabled: true, streamUrlMasked: 'rtsp://***:***@camera.local/stream' })
      .expect(201);

    await request(app.getHttpServer())
      .get('/operations/reports/overview')
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.headers['x-rate-limit-limit']).toBeDefined();
        expect(response.body.cards.totalEmployees).toBe(1);
        expect(response.body.cards.accounting.income).toBeGreaterThanOrEqual(1500);
        expect(response.body.cards.accounting.expense).toBeGreaterThanOrEqual(400);
        expect(response.body.cards.legalOpenCases).toBeGreaterThanOrEqual(1);
      });

    await request(app.getHttpServer())
      .get('/accounting/reports/cashflow')
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.totals.income).toBeGreaterThanOrEqual(1500);
        expect(response.body.totals.expense).toBeGreaterThanOrEqual(400);
        expect(response.body.totals.net).toBeGreaterThanOrEqual(1100);
        expect(response.body.totalsByCategory.some((item: any) => item.categoryName === incomeCategory.body.name)).toBe(true);
      });

    await request(app.getHttpServer())
      .get('/legal/reports/risk')
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.casesByStatus.OPEN).toBeGreaterThanOrEqual(1);
        expect(response.body.documentsByStatus.EXPIRED).toBeGreaterThanOrEqual(1);
        expect(JSON.stringify(response.body)).not.toContain(`confidential legal narrative ${stamp}`);
      });

    await request(app.getHttpServer())
      .get('/ads/reports/campaigns')
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.byProvider.META).toBeGreaterThanOrEqual(1);
        expect(response.body.byStatus.ACTIVE).toBeGreaterThanOrEqual(1);
        expect(response.body.plannedBudgetTotal).toBeGreaterThanOrEqual(750);
        expect(JSON.stringify(response.body)).not.toContain(`acct-${stamp}`);
      });

    await request(app.getHttpServer())
      .get('/cameras/reports/devices')
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.byProvider.GENERIC).toBeGreaterThanOrEqual(1);
        expect(response.body.aiEnabled).toBeGreaterThanOrEqual(1);
        expect(JSON.stringify(response.body)).not.toContain('rtsp://');
        expect(JSON.stringify(response.body)).not.toContain('streamUrl');
      });

    await request(app.getHttpServer())
      .get('/operations/reports/trends')
      .query({ granularity: 'day' })
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect((response) => {
        expect(Array.isArray(response.body.activity)).toBe(true);
        expect(Array.isArray(response.body.accounting)).toBe(true);
      });

    await request(app.getHttpServer())
      .get('/operations/reports/activity')
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.byModule.HR).toBeGreaterThanOrEqual(1);
      });

    await request(app.getHttpServer())
      .get('/operations/reports/overview')
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.cards.totalEmployees).toBeGreaterThanOrEqual(2);
      });
  });

  it('rate-limits reports and enforces module-specific operations import permissions', async () => {
    const stamp = Date.now() + 1;
    const developer = await registerOrg(`stage4-slice6-rbac+${stamp}@popwam.local`, `Slice 6 RBAC ${stamp}`, 'DEVELOPER');
    await prisma.organization.update({ where: { id: developer.body.organization.id }, data: { status: 'APPROVED' } });

    const previousMax = process.env.OPERATIONS_REPORT_RATE_LIMIT_MAX;
    const previousWindow = process.env.OPERATIONS_REPORT_RATE_LIMIT_WINDOW_SECONDS;
    process.env.OPERATIONS_REPORT_RATE_LIMIT_MAX = '1';
    process.env.OPERATIONS_REPORT_RATE_LIMIT_WINDOW_SECONDS = '300';

    try {
      await request(app.getHttpServer())
        .get('/hr/reports/workforce')
        .set('Authorization', `Bearer ${developer.body.accessToken}`)
        .expect(200)
        .expect((response) => {
          expect(response.headers['x-rate-limit-limit']).toBe('1');
          expect(response.headers['x-rate-limit-remaining']).toBe('0');
          expect(response.headers['x-rate-limit-reset']).toBeDefined();
        });

      await request(app.getHttpServer())
        .get('/hr/reports/workforce')
        .set('Authorization', `Bearer ${developer.body.accessToken}`)
        .expect(429)
        .expect((response) => {
          expect(response.body.message).toMatch(/Too many operations report requests/i);
        });
    } finally {
      if (previousMax === undefined) delete process.env.OPERATIONS_REPORT_RATE_LIMIT_MAX;
      else process.env.OPERATIONS_REPORT_RATE_LIMIT_MAX = previousMax;
      if (previousWindow === undefined) delete process.env.OPERATIONS_REPORT_RATE_LIMIT_WINDOW_SECONDS;
      else process.env.OPERATIONS_REPORT_RATE_LIMIT_WINDOW_SECONDS = previousWindow;
    }

    const developerUser = await prisma.user.findUniqueOrThrow({ where: { id: developer.body.user.id }, select: { roleId: true } });
    await restrictRoleToPermissions(developerUser.roleId!, ['imports.accounting']);
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: `stage4-slice6-rbac+${stamp}@popwam.local`, password: 'Passw0rd!Slice6' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/import-export/operations/hr-employees/preview')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .send({ sourceFormat: 'JSON', rows: [{ name: `Blocked HR ${stamp}` }] })
      .expect(403);

    await request(app.getHttpServer())
      .post('/import-export/operations/accounting-transactions/preview')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .send({ sourceFormat: 'JSON', rows: [{ type: 'INCOME', amount: 25, description: `Allowed accounting ${stamp}` }] })
      .expect(201)
      .expect((response) => {
        expect(response.body.validRows).toBe(1);
      });
  });

  async function restrictRoleToPermissions(roleId: string, keys: string[]) {
    const permissions = await Promise.all(keys.map((key) =>
      prisma.permission.upsert({ where: { key }, create: { key, description: `Test permission: ${key}` }, update: {} }),
    ));
    await prisma.rolePermission.deleteMany({ where: { roleId } });
    for (const permission of permissions) {
      await prisma.rolePermission.create({ data: { roleId, permissionId: permission.id } });
    }
  }

  function registerOrg(email: string, organizationName: string, organizationType: 'DEVELOPER' | 'PLATFORM') {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        organizationName,
        organizationType,
        email,
        password: 'Passw0rd!Slice6',
        firstName: 'Stage4',
        lastName: 'Slice6',
      })
      .expect(201);
  }
});

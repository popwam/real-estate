import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/modules/database/prisma.service';
import { AppModule } from './../src/app.module';

describe('Stage 2 import/export Slice 1 (e2e)', () => {
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

  it('previews, validates, commits, re-commits safely, and exports scoped safe data', async () => {
    const stamp = Date.now();
    const password = 'Passw0rd!ImportExport';

    const developer = await register(
      app,
      `stage2-import-dev+${stamp}@popwam.local`,
      `Import Developer ${stamp}`,
      'DEVELOPER',
      password,
    );
    const developerToken = developer.body.accessToken;
    const developerOrgId = developer.body.organization.id;

    const otherDeveloper = await register(
      app,
      `stage2-import-other-dev+${stamp}@popwam.local`,
      `Other Import Developer ${stamp}`,
      'DEVELOPER',
      password,
    );
    const otherDeveloperToken = otherDeveloper.body.accessToken;

    const brokerage = await register(
      app,
      `stage2-import-brokerage+${stamp}@popwam.local`,
      `Import Brokerage ${stamp}`,
      'BROKERAGE',
      password,
    );
    const brokerageToken = brokerage.body.accessToken;

    const startingProjects = await prisma.project.count({
      where: { developerId: developerOrgId },
    });
    const startingUnits = await prisma.inventoryUnit.count({
      where: { developerId: developerOrgId },
    });

    const rows = [
      {
        projectName: `Import Residences ${stamp}`,
        projectSlug: `import-residences-${stamp}`,
        projectType: 'COMPOUND',
        city: 'Cairo',
        district: 'New Cairo',
        address: 'Demo import address',
        description: 'Imported demo project',
        projectStatus: 'ACTIVE',
        projectVisibility: 'OPEN_MARKETPLACE',
        deliveryDate: '2028-12-31',
        phaseName: 'Phase 1',
        phaseStatus: 'ACTIVE',
        phaseDeliveryDate: '2028-06-30',
        unitCode: `IE-${stamp}-A`,
        unitType: 'APARTMENT',
        areaSqm: 120,
        bedrooms: 2,
        bathrooms: 2,
        floor: '4',
        view: 'Garden',
        finishing: 'FULLY_FINISHED',
        basePrice: 2500000,
        currency: 'EGP',
        unitStatus: 'AVAILABLE',
        visibility: 'INHERIT_PROJECT',
        planName: 'Launch Plan',
        downPaymentPercent: 10,
        years: 7,
        installmentFrequency: 'quarterly',
      },
      {
        projectName: `Broken Import ${stamp}`,
        projectType: 'INVALID_TYPE',
        city: 'Cairo',
        district: 'New Cairo',
        unitType: 'APARTMENT',
        areaSqm: 100,
      },
      {
        projectName: `Import Residences ${stamp}`,
        projectSlug: `import-residences-${stamp}`,
        projectType: 'COMPOUND',
        city: 'Cairo',
        district: 'New Cairo',
        projectStatus: 'ACTIVE',
        projectVisibility: 'OPEN_MARKETPLACE',
        phaseName: 'Phase 1',
        unitCode: `IE-${stamp}-B`,
        unitType: 'VILLA',
        areaSqm: 220,
        bedrooms: 4,
        bathrooms: 3,
        basePrice: 5600000,
      },
    ];

    await request(app.getHttpServer())
      .post('/import-export/project-inventory/preview')
      .set('Authorization', `Bearer ${brokerageToken}`)
      .send({ sourceFormat: 'JSON', rows: [rows[0]] })
      .expect(403);

    const preview = await request(app.getHttpServer())
      .post('/import-export/project-inventory/preview')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({
        sourceFormat: 'JSON',
        originalFileName: 'slice1-import.json',
        rows,
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.totalRows).toBe(3);
        expect(body.validRows).toBe(2);
        expect(body.invalidRows).toBe(1);
        expect(body.rowErrors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              rowNumber: 2,
              errors: expect.arrayContaining([
                expect.objectContaining({ field: 'projectType' }),
                expect.objectContaining({ field: 'basePrice' }),
              ]),
            }),
          ]),
        );
      });

    await expect(
      prisma.project.count({ where: { developerId: developerOrgId } }),
    ).resolves.toBe(startingProjects);
    await expect(
      prisma.inventoryUnit.count({ where: { developerId: developerOrgId } }),
    ).resolves.toBe(startingUnits);

    await request(app.getHttpServer())
      .get(`/import-export/jobs/${preview.body.jobId}`)
      .set('Authorization', `Bearer ${otherDeveloperToken}`)
      .expect(404);

    const commit = await request(app.getHttpServer())
      .post(`/import-export/jobs/${preview.body.jobId}/commit`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(201)
      .expect(({ body }) => {
        expect(body.status).toBe('COMMITTED');
        expect(body.rowsCommitted).toBe(2);
        expect(body.rowsSkipped).toBe(1);
        expect(body.unitsCreated).toBe(2);
      });

    expect(commit.body.projectsCreated + commit.body.projectsUpdated).toBe(2);

    await request(app.getHttpServer())
      .post(`/import-export/jobs/${preview.body.jobId}/commit`)
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(201)
      .expect(({ body }) => {
        expect(body.alreadyCommitted).toBe(true);
      });

    await expect(
      prisma.inventoryUnit.count({
        where: {
          developerId: developerOrgId,
          unitNumber: { in: [`IE-${stamp}-A`, `IE-${stamp}-B`] },
        },
      }),
    ).resolves.toBe(2);

    const importedProject = await prisma.project.findFirstOrThrow({
      where: { developerId: developerOrgId, slug: `import-residences-${stamp}` },
      select: { id: true },
    });

    await expect(
      prisma.importJobRow.count({
        where: {
          importJobId: preview.body.jobId,
          status: 'INVALID',
        },
      }),
    ).resolves.toBe(1);

    await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${otherDeveloperToken}`)
      .send({
        name: `Other Private Project ${stamp}`,
        slug: `other-private-project-${stamp}`,
        type: 'COMPOUND',
        status: 'ACTIVE',
        city: 'Giza',
        district: 'West',
        visibility: 'PRIVATE',
      })
      .expect(201);

    await request(app.getHttpServer())
      .get('/import-export/export/projects')
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        const projectSlugs = body.data.map((item: { slug: string }) => item.slug);
        expect(projectSlugs).toContain(`import-residences-${stamp}`);
        expect(projectSlugs).not.toContain(`other-private-project-${stamp}`);
      });

    await request(app.getHttpServer())
      .get('/import-export/export/inventory')
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        const unitNumbers = body.data.map(
          (item: { unitNumber: string }) => item.unitNumber,
        );
        expect(unitNumbers).toContain(`IE-${stamp}-A`);
        expect(unitNumbers).toContain(`IE-${stamp}-B`);
        expect(body.data.every(
          (item: { projectId: string }) => item.projectId === importedProject.id,
        )).toBe(true);
      });

    await request(app.getHttpServer())
      .get('/import-export/export/account')
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        const serialized = JSON.stringify(body);
        expect(serialized).not.toContain('passwordHash');
        expect(serialized).not.toContain('refreshTokens');
        expect(serialized).not.toContain('tokenHash');
        expect(serialized).not.toContain('auditLogs');
        expect(body.data).toHaveLength(1);
        expect(body.data[0].id).toBe(developerOrgId);
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
      firstName: 'Stage2',
      lastName: 'ImportExport',
    })
    .expect(201);
}

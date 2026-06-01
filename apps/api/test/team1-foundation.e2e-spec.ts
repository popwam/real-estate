import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Team 1 foundation contracts (e2e)', () => {
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

  it('supports auth, scoped users, verification review, and platform-only protection', async () => {
    const stamp = Date.now();
    const password = 'Passw0rd!Slice5';
    const developerEmail = `slice5-dev+${stamp}@popwam.local`;
    const platformEmail = `slice5-platform+${stamp}@popwam.local`;

    const developerRegister = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        organizationName: `Slice 5 Developer ${stamp}`,
        organizationType: 'DEVELOPER',
        email: developerEmail,
        password,
        firstName: 'Slice5',
        lastName: 'Developer',
      })
      .expect(201);
    const developerToken = developerRegister.body.accessToken;
    const organizationId = developerRegister.body.organization.id;

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: developerEmail, password })
      .expect(201)
      .expect(({ body }) => {
        expect(body.accessToken).toBeDefined();
        expect(body.refreshToken).toBeDefined();
      });

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.user.email).toBe(developerEmail);
        expect(body.organization.id).toBe(organizationId);
      });

    await request(app.getHttpServer())
      .get('/organizations/me/current')
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.id).toBe(organizationId);
      });

    const createdUser = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({
        email: `slice5-user+${stamp}@popwam.local`,
        password,
        firstName: 'Scoped',
        lastName: 'User',
        role: 'developer_sales_agent',
      })
      .expect(201);

    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.some((user: any) => user.id === createdUser.body.id)).toBe(
          true,
        );
      });

    const file = await request(app.getHttpServer())
      .post('/files/metadata')
      .set('Authorization', `Bearer ${developerToken}`)
      .send({
        objectKey: `slice5/${stamp}/commercial-registration.pdf`,
        mimeType: 'application/pdf',
        sizeBytes: 1024,
      })
      .expect(201);

    const verificationSubmit = await request(app.getHttpServer())
      .post(`/organizations/${organizationId}/submit-verification`)
      .set('Authorization', `Bearer ${developerToken}`)
      .send({
        documents: [
          {
            documentType: 'COMMERCIAL_REGISTRATION',
            uploadedFileId: file.body.id,
          },
        ],
      })
      .expect(201);
    const verificationId = verificationSubmit.body.documents[0].id;

    await request(app.getHttpServer())
      .get('/platform-admin/verification-queue')
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(403);

    const platformRegister = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        organizationName: `Slice 5 Platform ${stamp}`,
        organizationType: 'PLATFORM',
        email: platformEmail,
        password,
        firstName: 'Slice5',
        lastName: 'Platform',
      })
      .expect(201);
    const platformToken = platformRegister.body.accessToken;

    await request(app.getHttpServer())
      .get('/platform-admin/verification-queue')
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.some((item: any) => item.id === verificationId)).toBe(true);
      });

    await request(app.getHttpServer())
      .patch(`/organization-verifications/${verificationId}/approve`)
      .set('Authorization', `Bearer ${platformToken}`)
      .send({ notes: 'Approved by Slice 5 e2e.' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('APPROVED');
      });

    await request(app.getHttpServer())
      .patch(`/platform-admin/organizations/${organizationId}/suspend`)
      .set('Authorization', `Bearer ${platformToken}`)
      .send({ reason: 'Slice 5 e2e suspension.' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('SUSPENDED');
      });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('ok');
        expect(body.service).toBe('popwam-api');
      });
  });

  it('/health (GET) returns a generated request id when missing', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect(({ headers }) => {
        expect(headers['x-request-id']).toEqual(expect.any(String));
        expect(headers['x-request-id']).not.toHaveLength(0);
      });
  });

  it('/health (GET) preserves an incoming request id', () => {
    return request(app.getHttpServer())
      .get('/health')
      .set('x-request-id', 'stage2-smoke-request-123')
      .expect(200)
      .expect(({ headers }) => {
        expect(headers['x-request-id']).toBe('stage2-smoke-request-123');
      });
  });

  afterEach(async () => {
    await app.close();
  });
});

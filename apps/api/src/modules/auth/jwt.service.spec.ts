import { EnvService } from '../../config/env.service';
import { JwtService } from './jwt.service';

describe('JwtService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      JWT_SECRET: 'test-access-secret',
      JWT_EXPIRES_IN: '15m',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
      JWT_REFRESH_EXPIRES_IN: '30d',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('signs and verifies access token payloads', () => {
    const service = new JwtService(new EnvService());
    const token = service.signAccessToken({
      userId: 'user_1',
      organizationId: 'org_1',
      organizationType: 'DEVELOPER',
      role: 'developer_owner',
      permissions: [],
    });
    const payload = service.verifyAccessToken(token);

    expect(payload).toMatchObject({
      userId: 'user_1',
      organizationId: 'org_1',
      organizationType: 'DEVELOPER',
      role: 'developer_owner',
      permissions: [],
      tokenKind: 'access',
    });
  });

  it('signs unique refresh tokens for the same payload', () => {
    const service = new JwtService(new EnvService());
    const payload = {
      userId: 'user_1',
      organizationId: 'org_1',
      organizationType: 'DEVELOPER',
      role: 'developer_owner',
      permissions: [],
    };
    const firstToken = service.signRefreshToken(payload);
    const secondToken = service.signRefreshToken(payload);
    const firstPayload = service.verifyRefreshToken(firstToken);
    const secondPayload = service.verifyRefreshToken(secondToken);

    expect(firstToken).not.toBe(secondToken);
    expect(firstPayload.jti).toBeDefined();
    expect(secondPayload.jti).toBeDefined();
    expect(firstPayload.jti).not.toBe(secondPayload.jti);
  });
});

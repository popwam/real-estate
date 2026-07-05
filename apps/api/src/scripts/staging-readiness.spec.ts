import { validateAttendanceSmokeEnv } from './attendance-staging-smoke';
import { validateApiReadiness } from './staging-readiness';

describe('staging readiness scripts', () => {
  it('passes local storage readiness with core secrets configured', () => {
    const result = validateApiReadiness({
      DATABASE_URL: 'postgresql://example',
      JWT_SECRET: 'secret',
      JWT_REFRESH_SECRET: 'refresh',
      FILE_STORAGE_PROVIDER: 'local',
      ATTENDANCE_PHOTO_FRESHNESS_MINUTES: '10',
    });

    expect(result.ok).toBe(true);
  });

  it('fails object storage readiness without private storage secrets', () => {
    const result = validateApiReadiness({
      DATABASE_URL: 'postgresql://example',
      JWT_SECRET: 'secret',
      JWT_REFRESH_SECRET: 'refresh',
      FILE_STORAGE_PROVIDER: 's3',
      FILE_STORAGE_BUCKET: 'bucket',
      FILE_STORAGE_REGION: 'auto',
    });

    expect(result.ok).toBe(false);
    expect(result.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'FILE_STORAGE_ACCESS_KEY_ID',
          ok: false,
        }),
        expect.objectContaining({
          name: 'FILE_STORAGE_SECRET_ACCESS_KEY',
          ok: false,
        }),
      ]),
    );
  });

  it('fails invalid attendance retention numbers', () => {
    const result = validateApiReadiness({
      DATABASE_URL: 'postgresql://example',
      JWT_SECRET: 'secret',
      JWT_REFRESH_SECRET: 'refresh',
      FILE_STORAGE_PROVIDER: 'local',
      ATTENDANCE_EVIDENCE_RETENTION_DAYS: '-1',
    });

    expect(result.ok).toBe(false);
  });

  it('requires explicit staging attendance smoke variables', () => {
    expect(
      validateAttendanceSmokeEnv({ STAGING_API_URL: 'https://api' }),
    ).toEqual([
      'STAGING_TEST_IDENTIFIER',
      'STAGING_TEST_PASSWORD',
      'STAGING_TEST_PHOTO_PATH',
    ]);
  });
});

import {
  attendancePolicyFromEnv,
  validateEnsureHrTestUserEnv,
} from './ensure-hr-test-user';

describe('ensure HR staging test user script', () => {
  it('requires database, identifier, and password env vars', () => {
    expect(validateEnsureHrTestUserEnv({})).toEqual([
      'DATABASE_URL',
      'STAGING_HR_TEST_IDENTIFIER',
      'STAGING_HR_TEST_PASSWORD',
    ]);
    expect(
      validateEnsureHrTestUserEnv({
        DATABASE_URL: 'postgresql://example',
        STAGING_HR_TEST_IDENTIFIER: 'kh@popwam.com',
        STAGING_HR_TEST_PASSWORD: 'secret-password',
      }),
    ).toEqual([]);
  });

  it('uses a smoke-safe attendance policy when location and Wi-Fi are absent', () => {
    expect(attendancePolicyFromEnv({})).toMatchObject({
      requireLocation: false,
      requireWifi: false,
      blockDeveloperOptions: true,
      blockUsbDebugging: true,
      requirePhoto: true,
      requireDvrReview: false,
    });
  });

  it('enables location and Wi-Fi policy only from explicit env values', () => {
    expect(
      attendancePolicyFromEnv({
        STAGING_ATTENDANCE_LATITUDE: '30.0444',
        STAGING_ATTENDANCE_LONGITUDE: '31.2357',
        STAGING_ATTENDANCE_RADIUS_METERS: '150',
        STAGING_ATTENDANCE_WIFI_SSID: 'Company-WiFi',
        STAGING_ATTENDANCE_WIFI_BSSID: 'AA:BB:CC:DD:EE:FF',
      }),
    ).toMatchObject({
      requireLocation: true,
      allowedLatitude: 30.0444,
      allowedLongitude: 31.2357,
      allowedRadiusMeters: 150,
      requireWifi: true,
      allowedWifiSsids: ['Company-WiFi'],
      allowedWifiBssids: ['aa:bb:cc:dd:ee:ff'],
      requirePhoto: true,
    });
  });
});

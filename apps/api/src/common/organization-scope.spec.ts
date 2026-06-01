import { ForbiddenException } from '@nestjs/common';
import {
  assertSameOrganizationOrPlatform,
  isPlatformUser,
} from './organization-scope';

describe('organization scope helpers', () => {
  it('detects platform users', () => {
    expect(
      isPlatformUser({
        userId: 'user_1',
        organizationId: null,
        organizationType: 'PLATFORM',
        role: 'platform_admin',
        permissions: [],
      }),
    ).toBe(true);
  });

  it('blocks cross-organization access for non-platform users', () => {
    expect(() =>
      assertSameOrganizationOrPlatform(
        {
          userId: 'user_1',
          organizationId: 'org_1',
          organizationType: 'DEVELOPER',
          role: 'developer_owner',
          permissions: [],
        },
        'org_2',
      ),
    ).toThrow(ForbiddenException);
  });
});

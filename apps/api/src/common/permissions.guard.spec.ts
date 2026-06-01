import { ForbiddenException } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';

describe('PermissionsGuard', () => {
  const makeContext = (user: any) =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as any;

  it('allows users with required permission from JWT payload', async () => {
    const guard = new PermissionsGuard(
      {
        getAllAndOverride: (key: string) =>
          key === 'permissions' ? ['organizations.view_all'] : undefined,
      } as any,
      { user: { findUnique: jest.fn() } } as any,
    );

    await expect(
      guard.canActivate(
        makeContext({
          userId: 'user_1',
          permissions: ['organizations.view_all'],
        }),
      ),
    ).resolves.toBe(true);
  });

  it('blocks users missing required permission', async () => {
    const guard = new PermissionsGuard(
      {
        getAllAndOverride: (key: string) =>
          key === 'permissions' ? ['organizations.view_all'] : undefined,
      } as any,
      { user: { findUnique: jest.fn().mockResolvedValue(null) } } as any,
    );

    await expect(
      guard.canActivate(makeContext({ userId: 'user_1', permissions: [] })),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows platform owner on platform-only permission when permission is present', async () => {
    const guard = new PermissionsGuard(
      {
        getAllAndOverride: (key: string) =>
          key === 'permissions' ? ['organizations.verify'] : undefined,
      } as any,
      { user: { findUnique: jest.fn() } } as any,
    );

    await expect(
      guard.canActivate(
        makeContext({
          userId: 'platform_user',
          role: 'platform_owner',
          permissions: ['organizations.verify'],
        }),
      ),
    ).resolves.toBe(true);
  });

  it('blocks developer from platform-only permission', async () => {
    const guard = new PermissionsGuard(
      {
        getAllAndOverride: (key: string) =>
          key === 'permissions' ? ['organizations.verify'] : undefined,
      } as any,
      { user: { findUnique: jest.fn().mockResolvedValue(null) } } as any,
    );

    await expect(
      guard.canActivate(
        makeContext({
          userId: 'developer_user',
          role: 'developer_owner',
          permissions: ['organizations.update_own'],
        }),
      ),
    ).rejects.toThrow(ForbiddenException);
  });
});

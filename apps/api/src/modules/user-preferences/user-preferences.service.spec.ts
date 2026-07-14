import { UserPreferencesService } from './user-preferences.service';

describe('UserPreferencesService', () => {
  const user = { userId: 'user_1' } as any;

  it('returns an undismissed welcome preference when no record exists', async () => {
    const prisma = {
      userNavigationPreference: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    } as any;
    const service = new UserPreferencesService(prisma);

    await expect(service.getPlatformWelcome(user)).resolves.toEqual({
      hasDismissedPlatformWelcome: false,
      dismissedAt: null,
    });
  });

  it('persists dismissal per user and returns the public response shape', async () => {
    const dismissedAt = new Date('2026-07-14T10:00:00.000Z');
    const prisma = {
      userNavigationPreference: {
        upsert: jest.fn().mockResolvedValue({
          hasDismissedPlatformWelcome: true,
          platformWelcomeDismissedAt: dismissedAt,
        }),
      },
    } as any;
    const service = new UserPreferencesService(prisma);

    await expect(service.savePlatformWelcome(user, true)).resolves.toEqual({
      hasDismissedPlatformWelcome: true,
      dismissedAt,
    });
    expect(prisma.userNavigationPreference.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user_1' },
        create: expect.objectContaining({ userId: 'user_1', hasDismissedPlatformWelcome: true }),
        update: expect.objectContaining({ hasDismissedPlatformWelcome: true }),
      }),
    );
  });
});

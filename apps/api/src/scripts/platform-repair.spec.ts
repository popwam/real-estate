import { runPlatformRepair } from './platform-repair';

describe('platform repair safety gate', () => {
  it('refuses to run without exact confirmation', async () => {
    const previous = process.env.CONFIRM_PLATFORM_REPAIR;
    process.env.CONFIRM_PLATFORM_REPAIR = 'false';
    await expect(runPlatformRepair()).resolves.toBe(false);
    if (previous === undefined) delete process.env.CONFIRM_PLATFORM_REPAIR;
    else process.env.CONFIRM_PLATFORM_REPAIR = previous;
  });
});

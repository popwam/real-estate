import { HashService } from './hash.service';

describe('HashService', () => {
  const service = new HashService();

  it('hashes and verifies a password without storing the plain value', async () => {
    const hash = await service.hash('correct-horse-battery');

    expect(hash).not.toContain('correct-horse-battery');
    await expect(service.verify('correct-horse-battery', hash)).resolves.toBe(
      true,
    );
    await expect(service.verify('wrong-password', hash)).resolves.toBe(false);
  });
});

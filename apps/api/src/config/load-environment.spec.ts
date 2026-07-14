import { parseEnvironmentFile } from './load-environment';

describe('environment file parser', () => {
  it('trims surrounding quotes and keeps URL content private to the caller', () => {
    expect(parseEnvironmentFile(`DATABASE_URL="postgresql://user:pass@db.example/app"\nNODE_ENV=production # deployment`)).toEqual({
      DATABASE_URL: 'postgresql://user:pass@db.example/app',
      NODE_ENV: 'production',
    });
  });
});

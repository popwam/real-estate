import { hashLogValue, sanitizeRequestPath } from './request-log-sanitizer';

describe('request log sanitizers', () => {
  it('masks public conversation token paths', () => {
    expect(sanitizeRequestPath('/conversations/by-token/token_123')).toBe(
      '/conversations/by-token/:shareToken',
    );
    expect(sanitizeRequestPath('/conversations/by-token/token_123/messages?debug=true')).toBe(
      '/conversations/by-token/:shareToken/messages',
    );
  });

  it('masks domain management ids and strips query strings', () => {
    expect(sanitizeRequestPath('/organization-domains/domain_123/check-dns?token=secret')).toBe(
      '/organization-domains/:id/check-dns',
    );
    expect(sanitizeRequestPath('/platform-admin/domains/domain_123/approve')).toBe(
      '/platform-admin/domains/:id/approve',
    );
  });

  it('hashes log values without returning the original value', () => {
    const hash = hashLogValue('192.0.2.10', 'ip');

    expect(hash).toBeDefined();
    expect(hash).not.toBe('192.0.2.10');
    expect(hash).toHaveLength(64);
  });
});

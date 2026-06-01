import {
  buildRateLimitKey,
  normalizedEmailForRateLimit,
  requestIpHash,
} from './rate-limit-keys';

describe('rate-limit key helpers', () => {
  it('normalizes email for keyed auth limits', () => {
    expect(normalizedEmailForRateLimit(' USER@Example.COM ')).toBe(
      'user@example.com',
    );
  });

  it('does not include raw sensitive values in generated keys', () => {
    const key = buildRateLimitKey('auth-login', {
      email: 'buyer@example.com',
      phone: '+201000000000',
      token: 'refresh.jwt.token',
      body: 'projectName,client,email',
      leadId: 'crm_lead_private_id',
      conversationId: 'conversation_private_id',
      statusNote: 'Called the buyer at +201000000000',
      reason: 'Reject because dns token TXT-private-value failed',
      noteBody: 'Private CRM note with buyer@example.com',
      taskTitle: 'Call +201000000000 about negotiation',
      employeeEmail: 'employee@example.com',
      accountingDescription: 'Expense for private vendor',
      legalText: 'Confidential contract clause',
      externalCampaignId: 'meta-campaign-private-id',
      streamUrl: 'rtsp://user:password@camera.local/stream',
      ip: '127.0.0.1',
    });

    expect(key).not.toContain('buyer@example.com');
    expect(key).not.toContain('+201000000000');
    expect(key).not.toContain('refresh.jwt.token');
    expect(key).not.toContain('projectName');
    expect(key).not.toContain('crm_lead_private_id');
    expect(key).not.toContain('conversation_private_id');
    expect(key).not.toContain('Called the buyer');
    expect(key).not.toContain('TXT-private-value');
    expect(key).not.toContain('Private CRM note');
    expect(key).not.toContain('employee@example.com');
    expect(key).not.toContain('rtsp://');
    expect(key).not.toContain('meta-campaign-private-id');
    expect(key).not.toContain('127.0.0.1');
    expect(key).toMatch(/^[a-f0-9]{64}$/);
  });

  it('hashes source IP values for request keys', () => {
    const request = {
      headers: { 'x-forwarded-for': '203.0.113.10, 10.0.0.1' },
    } as any;

    const hash = requestIpHash(request);

    expect(hash).not.toContain('203.0.113.10');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});

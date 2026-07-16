import {
  isBlockedOrganizationStatus,
  isOperationalOrganizationStatus,
} from './organization-status';

describe('organization status compatibility', () => {
  it.each(['ACTIVE', 'APPROVED'])('treats %s as operational', (status) => {
    expect(isOperationalOrganizationStatus(status)).toBe(true);
  });

  it.each(['DRAFT', 'PENDING_REVIEW', 'SUSPENDED'])('does not treat %s as operational', (status) => {
    expect(isOperationalOrganizationStatus(status)).toBe(false);
  });

  it.each(['SUSPENDED', 'REVOKED', 'REJECTED', 'EXPIRED'])('blocks %s', (status) => {
    expect(isBlockedOrganizationStatus(status)).toBe(true);
  });
});

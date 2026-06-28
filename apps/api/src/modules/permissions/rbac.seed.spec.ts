import { BASE_PERMISSIONS, BASE_ROLES, ROLE_PERMISSIONS } from './rbac.seed';

describe('RBAC seed definitions', () => {
  it('defines required platform and marketplace-adjacent permission names', () => {
    expect(BASE_PERMISSIONS).toContain('organizations.view_all');
    expect(BASE_PERMISSIONS).toContain('audit_logs.view');
    expect(BASE_PERMISSIONS).toContain('marketplace.view');
    expect(BASE_PERMISSIONS).toContain('lead_claims.create');
    expect(BASE_PERMISSIONS).toContain('imports.hr');
    expect(BASE_PERMISSIONS).toContain('imports.accounting');
    expect(BASE_PERMISSIONS).toContain('imports.legal');
    expect(BASE_PERMISSIONS).toContain('imports.ads');
    expect(BASE_PERMISSIONS).toContain('imports.cameras');
  });

  it('maps base roles to permissions for future guards', () => {
    expect(BASE_ROLES).toContain('developer_owner');
    expect(ROLE_PERMISSIONS.developer_owner).toContain('users.manage_own_org');
    expect(ROLE_PERMISSIONS.developer_owner).toContain('imports.hr');
    expect(ROLE_PERMISSIONS.platform_owner).toContain('organizations.view_all');
    expect(ROLE_PERMISSIONS.platform_owner).toContain('deal_rooms.join');
    expect(ROLE_PERMISSIONS.platform_admin).toContain('deal_rooms.join');
  });
});

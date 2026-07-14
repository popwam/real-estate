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

  it('assigns the complete permission catalog to the Platform Owner', () => {
    expect(new Set(ROLE_PERMISSIONS.platform_owner)).toEqual(new Set(BASE_PERMISSIONS));
    expect(ROLE_PERMISSIONS.platform_owner).toEqual(expect.arrayContaining([
      'platform.dashboard.view',
      'platform.verifications.manage',
      'platform.investigations.manage',
      'platform.organizations.archive',
      'platform.organizations.delete_draft',
      'platform.metadata.manage',
    ]));
  });

  it('never assigns platform permissions to company roles', () => {
    const companyRoles = [
      'developer_owner',
      'developer_admin',
      'brokerage_owner',
      'brokerage_admin',
      'company_admin',
      'hr_manager',
      'hr_employee',
      'employee_self_service',
    ];
    for (const role of companyRoles) {
      expect(ROLE_PERMISSIONS[role]?.filter((permission) => permission.startsWith('platform.')) ?? []).toEqual([]);
    }
  });
});

import {
  BASE_PERMISSIONS,
  BASE_ROLES,
  PLATFORM_PERMISSIONS,
  ROLE_PERMISSIONS,
  syncRolePermissions,
} from './rbac.seed';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

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
      'platform.documents.view',
      'platform.navigation.view',
      'platform.navigation.manage',
      'platform.organizations.restore',
    ]));
    expect(ROLE_PERMISSIONS.platform_owner).toEqual(
      expect.arrayContaining(PLATFORM_PERMISSIONS),
    );
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

  it('contains every permission used by @Permissions decorators', () => {
    const used = new Set<string>();
    for (const file of typescriptFiles(join(process.cwd(), 'src'))) {
      const source = readFileSync(file, 'utf8');
      for (const decorator of source.matchAll(/@Permissions\(([^)]*)\)/gs)) {
        for (const value of decorator[1].matchAll(/['"]([^'"]+)['"]/g)) {
          used.add(value[1]);
        }
      }
    }
    const catalog = new Set<string>(BASE_PERMISSIONS);
    expect([...used].filter((permission) => !catalog.has(permission))).toEqual([]);
  });

  it('contains every role permission in the base permission catalog', () => {
    const catalog = new Set<string>(BASE_PERMISSIONS);
    const missing = Object.entries(ROLE_PERMISSIONS).flatMap(
      ([role, permissions]) =>
        permissions
          .filter((permission) => !catalog.has(permission))
          .map((permission) => ({ role, permission })),
    );

    expect(missing).toEqual([]);
  });

  it('uses idempotent upserts when repairing role assignments', async () => {
    const permission = {
      findUniqueOrThrow: jest.fn(({ where }) => ({ id: `id:${where.key}` })),
    };
    const rolePermission = { upsert: jest.fn() };
    const prisma = { permission, rolePermission } as any;

    await syncRolePermissions(prisma, 'owner-role', 'platform_owner');
    await syncRolePermissions(prisma, 'owner-role', 'platform_owner');

    expect(rolePermission.upsert).toHaveBeenCalledTimes(
      ROLE_PERMISSIONS.platform_owner.length * 2,
    );
  });
});

function typescriptFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return typescriptFiles(path);
    return entry.isFile() && entry.name.endsWith('.ts') ? [path] : [];
  });
}

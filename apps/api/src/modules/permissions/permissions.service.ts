import { Injectable } from '@nestjs/common';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../database/prisma.service';
import { seedBaseRolesAndPermissions } from './rbac.seed';

@Injectable()
export class PermissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async seedBaseRbac() {
    const result = await seedBaseRolesAndPermissions(this.prisma);

    await this.auditLogs.record({
      action: 'permission.seeded',
      entityType: 'Permission',
      metadata: { permissionsSeeded: result.permissionsSeeded },
    });
    await this.auditLogs.record({
      action: 'role.seeded',
      entityType: 'Role',
      metadata: { rolesSeeded: result.rolesSeeded },
    });

    return result;
  }
}

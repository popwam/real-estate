import { Module } from '@nestjs/common';
import { PermissionsGuard } from '../../common/permissions.guard';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AuthModule } from '../auth/auth.module';
import { OrganizationVerificationsModule } from '../organization-verifications/organization-verifications.module';
import { PlatformAdminController } from './platform-admin.controller';
import { PlatformAdminService } from './platform-admin.service';

@Module({
  imports: [AuditLogsModule, AuthModule, OrganizationVerificationsModule],
  controllers: [PlatformAdminController],
  providers: [PlatformAdminService, PermissionsGuard],
})
export class PlatformAdminModule {}

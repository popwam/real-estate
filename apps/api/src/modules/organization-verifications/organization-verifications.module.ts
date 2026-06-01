import { Module } from '@nestjs/common';
import { PermissionsGuard } from '../../common/permissions.guard';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AuthModule } from '../auth/auth.module';
import { OrganizationVerificationsController } from './organization-verifications.controller';
import { OrganizationVerificationsService } from './organization-verifications.service';

@Module({
  imports: [AuditLogsModule, AuthModule],
  controllers: [OrganizationVerificationsController],
  providers: [OrganizationVerificationsService, PermissionsGuard],
  exports: [OrganizationVerificationsService],
})
export class OrganizationVerificationsModule {}

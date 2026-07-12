import { Module } from '@nestjs/common';
import { PermissionsGuard } from '../../common/permissions.guard';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AuthModule } from '../auth/auth.module';
import { CompanyProvisioningService } from './company-provisioning.service';
import {
  OrganizationProvisioningController,
  PlatformSettingsController,
  PlatformOrganizationsController,
} from './company-provisioning.controller';

@Module({
  imports: [AuditLogsModule, AuthModule],
  controllers: [
    PlatformOrganizationsController,
    PlatformSettingsController,
    OrganizationProvisioningController,
  ],
  providers: [CompanyProvisioningService, PermissionsGuard],
  exports: [CompanyProvisioningService],
})
export class CompanyProvisioningModule {}

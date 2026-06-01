import { Module } from '@nestjs/common';
import { PermissionsGuard } from '../../common/permissions.guard';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { OrganizationWebsiteSettingsController } from './organization-website-settings.controller';
import { OrganizationWebsiteSettingsService } from './organization-website-settings.service';

@Module({
  imports: [DatabaseModule, AuditLogsModule, AuthModule],
  controllers: [OrganizationWebsiteSettingsController],
  providers: [OrganizationWebsiteSettingsService, PermissionsGuard],
})
export class OrganizationWebsiteSettingsModule {}

import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import {
  OrganizationDomainsController,
  PlatformDomainsController,
} from './organization-domains.controller';
import { OrganizationDomainsService } from './organization-domains.service';

@Module({
  imports: [DatabaseModule, AuthModule, AuditLogsModule],
  controllers: [OrganizationDomainsController, PlatformDomainsController],
  providers: [OrganizationDomainsService],
})
export class OrganizationDomainsModule {}

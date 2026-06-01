import { Module } from '@nestjs/common';
import { PermissionsGuard } from '../../common/permissions.guard';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AuthModule } from '../auth/auth.module';
import { ProjectsModule } from '../projects/projects.module';
import { BrokerAccessController } from './broker-access.controller';
import { BrokerAccessService } from './broker-access.service';

@Module({
  imports: [AuditLogsModule, AuthModule, ProjectsModule],
  controllers: [BrokerAccessController],
  providers: [BrokerAccessService, PermissionsGuard],
})
export class BrokerAccessModule {}

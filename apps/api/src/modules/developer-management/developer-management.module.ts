import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AuthModule } from '../auth/auth.module';
import { DeveloperManagementController } from './developer-management.controller';
import { DeveloperManagementService } from './developer-management.service';

@Module({
  imports: [AuditLogsModule, AuthModule],
  controllers: [DeveloperManagementController],
  providers: [DeveloperManagementService],
})
export class DeveloperManagementModule {}

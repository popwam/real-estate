import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AuthModule } from '../auth/auth.module';
import { BrokerageManagementController } from './brokerage-management.controller';
import { BrokerageManagementService } from './brokerage-management.service';

@Module({
  imports: [AuditLogsModule, AuthModule],
  controllers: [BrokerageManagementController],
  providers: [BrokerageManagementService],
})
export class BrokerageManagementModule {}

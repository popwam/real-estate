import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AuthModule } from '../auth/auth.module';
import { DeveloperBrokerageAgreementsController } from './developer-brokerage-agreements.controller';
import { DeveloperBrokerageAgreementsService } from './developer-brokerage-agreements.service';

@Module({
  imports: [AuditLogsModule, AuthModule],
  controllers: [DeveloperBrokerageAgreementsController],
  providers: [DeveloperBrokerageAgreementsService],
})
export class DeveloperBrokerageAgreementsModule {}

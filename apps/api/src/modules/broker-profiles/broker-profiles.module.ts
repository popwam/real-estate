import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AuthModule } from '../auth/auth.module';
import { BrokerProfilesController } from './broker-profiles.controller';
import { BrokerProfilesService } from './broker-profiles.service';

@Module({
  imports: [AuditLogsModule, AuthModule],
  controllers: [BrokerProfilesController],
  providers: [BrokerProfilesService],
})
export class BrokerProfilesModule {}

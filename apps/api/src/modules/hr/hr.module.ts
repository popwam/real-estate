import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AuthModule } from '../auth/auth.module';
import { HrController } from './hr.controller';
import { HrService } from './hr.service';

@Module({
  imports: [AuditLogsModule, AuthModule],
  controllers: [HrController],
  providers: [HrService],
})
export class HrModule {}

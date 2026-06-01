import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { PermissionsService } from './permissions.service';

@Module({
  imports: [AuditLogsModule],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}

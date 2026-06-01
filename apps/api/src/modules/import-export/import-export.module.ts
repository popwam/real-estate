import { Module } from '@nestjs/common';
import { PermissionsGuard } from '../../common/permissions.guard';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { ImportExportController } from './import-export.controller';
import { ImportExportService } from './import-export.service';

@Module({
  imports: [DatabaseModule, AuthModule, AuditLogsModule],
  controllers: [ImportExportController],
  providers: [ImportExportService, PermissionsGuard],
})
export class ImportExportModule {}

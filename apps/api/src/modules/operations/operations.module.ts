import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { FilesModule } from '../files/files.module';
import { OperationsController } from './operations.controller';
import { OperationsService } from './operations.service';

@Module({
  imports: [DatabaseModule, AuthModule, FilesModule, AuditLogsModule],
  controllers: [OperationsController],
  providers: [OperationsService],
})
export class OperationsModule {}

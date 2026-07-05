import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AuthModule } from '../auth/auth.module';
import { FileStorageService } from './file-storage.service';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

@Module({
  imports: [AuditLogsModule, AuthModule],
  controllers: [FilesController],
  providers: [FilesService, FileStorageService],
  exports: [FilesService, FileStorageService],
})
export class FilesModule {}

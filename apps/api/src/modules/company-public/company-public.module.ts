import { Module } from '@nestjs/common';
import { PermissionsGuard } from '../../common/permissions.guard';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { FilesModule } from '../files/files.module';
import {
  CompanyPublicController,
  PublicCompanySiteController,
} from './company-public.controller';
import { CompanyPublicService } from './company-public.service';
import { DocumentExtractionService } from './document-extraction.service';

@Module({
  imports: [AuditLogsModule, AuthModule, DatabaseModule, FilesModule],
  controllers: [PublicCompanySiteController, CompanyPublicController],
  providers: [CompanyPublicService, DocumentExtractionService, PermissionsGuard],
  exports: [CompanyPublicService],
})
export class CompanyPublicModule {}

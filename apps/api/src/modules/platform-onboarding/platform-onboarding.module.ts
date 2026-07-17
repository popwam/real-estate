import { Module } from '@nestjs/common';
import { PermissionsGuard } from '../../common/permissions.guard';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AuthModule } from '../auth/auth.module';
import { FilesModule } from '../files/files.module';
import { CloudflareDocumentAdapter } from './cloudflare-document.adapter';
import { DocumentQualityService } from './document-quality.service';
import {
  PlatformMetadataV2Controller,
  PlatformOnboardingController,
} from './platform-onboarding.controller';
import { PlatformOnboardingService } from './platform-onboarding.service';

@Module({
  imports: [AuthModule, AuditLogsModule, FilesModule],
  controllers: [PlatformMetadataV2Controller, PlatformOnboardingController],
  providers: [
    PlatformOnboardingService,
    CloudflareDocumentAdapter,
    DocumentQualityService,
    PermissionsGuard,
  ],
})
export class PlatformOnboardingModule {}

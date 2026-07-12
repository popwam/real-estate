import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AuthModule } from '../auth/auth.module';
import { FilesModule } from '../files/files.module';
import { HrController } from './hr.controller';
import {
  HrRecruitmentController,
  PublicRecruitmentController,
} from './hr-recruitment.controller';
import { HrRecruitmentService } from './hr-recruitment.service';
import { HrService } from './hr.service';

@Module({
  imports: [AuditLogsModule, AuthModule, FilesModule],
  controllers: [HrController, HrRecruitmentController, PublicRecruitmentController],
  providers: [HrService, HrRecruitmentService],
})
export class HrModule {}

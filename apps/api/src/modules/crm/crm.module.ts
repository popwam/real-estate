import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { CrmActivitiesController } from './crm-activities.controller';
import { CrmActivitiesService } from './crm-activities.service';
import { CrmConversionService } from './crm-conversion.service';
import { CrmLeadsController } from './crm-leads.controller';
import { CrmLeadsService } from './crm-leads.service';
import { CrmNotesTasksController } from './crm-notes-tasks.controller';
import { CrmNotesTasksService } from './crm-notes-tasks.service';
import { CrmPipelineController } from './crm-pipeline.controller';
import { CrmPipelineService } from './crm-pipeline.service';
import { CrmSummaryController } from './crm-summary.controller';
import { CrmSummaryService } from './crm-summary.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [
    CrmLeadsController,
    CrmSummaryController,
    CrmActivitiesController,
    CrmPipelineController,
    CrmNotesTasksController,
  ],
  providers: [
    CrmLeadsService,
    CrmConversionService,
    CrmSummaryService,
    CrmActivitiesService,
    CrmPipelineService,
    CrmNotesTasksService,
  ],
  exports: [CrmLeadsService, CrmConversionService, CrmActivitiesService],
})
export class CrmModule {}

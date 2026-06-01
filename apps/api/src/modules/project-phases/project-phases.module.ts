import { Module } from '@nestjs/common';
import { PermissionsGuard } from '../../common/permissions.guard';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AuthModule } from '../auth/auth.module';
import { ProjectsModule } from '../projects/projects.module';
import { ProjectPhasesController } from './project-phases.controller';
import { ProjectPhasesService } from './project-phases.service';

@Module({
  imports: [AuditLogsModule, AuthModule, ProjectsModule],
  controllers: [ProjectPhasesController],
  providers: [ProjectPhasesService, PermissionsGuard],
})
export class ProjectPhasesModule {}

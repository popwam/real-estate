import { Module } from '@nestjs/common';
import { PermissionsGuard } from '../../common/permissions.guard';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AuthModule } from '../auth/auth.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [AuditLogsModule, AuthModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, PermissionsGuard],
  exports: [ProjectsService],
})
export class ProjectsModule {}

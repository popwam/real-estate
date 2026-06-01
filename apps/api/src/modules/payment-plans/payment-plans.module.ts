import { Module } from '@nestjs/common';
import { PermissionsGuard } from '../../common/permissions.guard';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AuthModule } from '../auth/auth.module';
import { ProjectsModule } from '../projects/projects.module';
import { PaymentPlansController } from './payment-plans.controller';
import { PaymentPlansService } from './payment-plans.service';

@Module({
  imports: [AuditLogsModule, AuthModule, ProjectsModule],
  controllers: [PaymentPlansController],
  providers: [PaymentPlansService, PermissionsGuard],
})
export class PaymentPlansModule {}

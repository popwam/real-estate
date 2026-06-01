import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { MarketplaceModule } from '../marketplace/marketplace.module';
import { LeadClaimsController } from './lead-claims.controller';
import { LeadClaimsService } from './lead-claims.service';

@Module({
  imports: [AuthModule, DatabaseModule, AuditLogsModule, MarketplaceModule],
  controllers: [LeadClaimsController],
  providers: [LeadClaimsService],
  exports: [LeadClaimsService],
})
export class LeadClaimsModule {}

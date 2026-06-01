import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { MarketplaceAccessService } from './marketplace-access.service';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';

@Module({
  imports: [DatabaseModule, AuditLogsModule, AuthModule],
  controllers: [MarketplaceController],
  providers: [MarketplaceService, MarketplaceAccessService],
  exports: [MarketplaceAccessService],
})
export class MarketplaceModule {}

import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { LeadClaimsModule } from '../lead-claims/lead-claims.module';
import { MarketplaceModule } from '../marketplace/marketplace.module';
import { ReservationRequestsController } from './reservation-requests.controller';
import { ReservationRequestsService } from './reservation-requests.service';

@Module({
  imports: [
    AuthModule,
    DatabaseModule,
    AuditLogsModule,
    MarketplaceModule,
    LeadClaimsModule,
  ],
  controllers: [ReservationRequestsController],
  providers: [ReservationRequestsService],
})
export class ReservationRequestsModule {}

import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { DealRoomsController } from './deal-rooms.controller';
import { DealRoomsService } from './deal-rooms.service';

@Module({
  imports: [AuthModule, DatabaseModule, AuditLogsModule],
  controllers: [DealRoomsController],
  providers: [DealRoomsService],
  exports: [DealRoomsService],
})
export class DealRoomsModule {}

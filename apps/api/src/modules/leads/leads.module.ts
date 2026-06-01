import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { LeadsService } from './leads.service';

@Module({
  imports: [DatabaseModule],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}

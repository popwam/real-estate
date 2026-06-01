import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ClientsService } from './clients.service';

@Module({
  imports: [DatabaseModule],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}

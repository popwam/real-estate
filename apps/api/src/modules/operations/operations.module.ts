import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { FilesModule } from '../files/files.module';
import { OperationsController } from './operations.controller';
import { OperationsService } from './operations.service';

@Module({
  imports: [DatabaseModule, AuthModule, FilesModule],
  controllers: [OperationsController],
  providers: [OperationsService],
})
export class OperationsModule {}

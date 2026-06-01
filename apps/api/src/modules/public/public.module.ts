import { Module } from '@nestjs/common';
import { RateLimitModule } from '../../common/rate-limit/rate-limit.module';
import { CrmModule } from '../crm/crm.module';
import { DatabaseModule } from '../database/database.module';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';

@Module({
  imports: [DatabaseModule, CrmModule, RateLimitModule],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}

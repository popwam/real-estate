import { Module } from '@nestjs/common';
import { VisibilityRulesService } from './visibility-rules.service';

@Module({
  providers: [VisibilityRulesService],
  exports: [VisibilityRulesService],
})
export class VisibilityRulesModule {}

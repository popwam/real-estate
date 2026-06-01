import { Module } from '@nestjs/common';
import { UnitAvailabilityService } from './unit-availability.service';

@Module({
  providers: [UnitAvailabilityService],
  exports: [UnitAvailabilityService],
})
export class UnitAvailabilityModule {}

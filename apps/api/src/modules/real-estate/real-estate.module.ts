import { Module } from '@nestjs/common';
import { PermissionsGuard } from '../../common/permissions.guard';
import { DatabaseModule } from '../database/database.module';
import {
  CustomersController,
  MyRealEstateController,
  QrPassController,
  RealEstateController,
} from './real-estate.controller';
import { RealEstateService } from './real-estate.service';

@Module({
  imports: [DatabaseModule],
  controllers: [
    CustomersController,
    RealEstateController,
    MyRealEstateController,
    QrPassController,
  ],
  providers: [RealEstateService, PermissionsGuard],
})
export class RealEstateModule {}

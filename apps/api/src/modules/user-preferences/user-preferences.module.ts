import { Module } from '@nestjs/common';
import { PermissionsGuard } from '../../common/permissions.guard';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { UserPreferencesController } from './user-preferences.controller';
import { UserPreferencesService } from './user-preferences.service';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [UserPreferencesController],
  providers: [UserPreferencesService, PermissionsGuard],
})
export class UserPreferencesModule {}

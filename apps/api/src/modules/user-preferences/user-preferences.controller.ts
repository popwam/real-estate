import { Body, Controller, Delete, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/current-user.decorator';
import { Permissions } from '../../common/permissions.decorator';
import { PermissionsGuard } from '../../common/permissions.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { UserPreferencesService } from './user-preferences.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('User Preferences')
@ApiBearerAuth()
@Controller('user-preferences')
export class UserPreferencesController {
  constructor(private readonly service: UserPreferencesService) {}

  @Permissions('navigation.customize')
  @Get('navigation')
  getNavigation(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.getNavigation(user);
  }

  @Permissions('navigation.customize')
  @Put('navigation')
  saveNavigation(@CurrentUser() user: AuthenticatedRequestUser, @Body() body: any) {
    return this.service.saveNavigation(user, body);
  }

  @Permissions('navigation.customize')
  @Delete('navigation')
  resetNavigation(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.resetNavigation(user);
  }

  @Get('platform-welcome')
  getPlatformWelcome(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.service.getPlatformWelcome(user);
  }

  @Put('platform-welcome')
  savePlatformWelcome(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() body: { hasDismissedPlatformWelcome?: boolean },
  ) {
    return this.service.savePlatformWelcome(user, body.hasDismissedPlatformWelcome === true);
  }

  @Permissions('quick_actions.customize')
  @Get('quick-actions/:widgetKey')
  getQuickAction(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('widgetKey') widgetKey: string,
  ) {
    return this.service.getQuickAction(user, widgetKey);
  }

  @Permissions('quick_actions.customize')
  @Put('quick-actions/:widgetKey')
  saveQuickAction(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('widgetKey') widgetKey: string,
    @Body() body: any,
  ) {
    return this.service.saveQuickAction(user, widgetKey, body);
  }

  @Permissions('quick_actions.customize')
  @Delete('quick-actions/:widgetKey')
  resetQuickAction(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('widgetKey') widgetKey: string,
  ) {
    return this.service.resetQuickAction(user, widgetKey);
  }
}

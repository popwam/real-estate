import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/current-user.decorator';
import { Permissions } from '../../common/permissions.decorator';
import { PermissionsGuard } from '../../common/permissions.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { UpdateOrganizationWebsiteSettingsDto } from './dto/update-organization-website-settings.dto';
import { OrganizationWebsiteSettingsService } from './organization-website-settings.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Organization Website Settings')
@ApiBearerAuth()
@Controller('organization-website-settings')
export class OrganizationWebsiteSettingsController {
  constructor(
    private readonly settingsService: OrganizationWebsiteSettingsService,
  ) {}

  @Permissions('organization_website.view_own')
  @Get('me')
  @ApiOperation({ summary: 'Get own organization website settings.' })
  findMine(@CurrentUser() currentUser: AuthenticatedRequestUser) {
    return this.settingsService.findMine(currentUser);
  }

  @Permissions('organization_website.update_own')
  @Patch('me')
  @ApiOperation({ summary: 'Update own organization website settings.' })
  @ApiBody({ type: UpdateOrganizationWebsiteSettingsDto })
  updateMine(
    @Body() dto: UpdateOrganizationWebsiteSettingsDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.settingsService.updateMine(dto, currentUser);
  }
}

import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/current-user.decorator';
import { Permissions } from '../../common/permissions.decorator';
import { PermissionsGuard } from '../../common/permissions.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { UpdateOrganizationStatusDto } from './dto/update-organization-status.dto';
import { OrganizationsService } from './organizations.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Organizations')
@ApiBearerAuth()
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Permissions('organizations.view_all')
  @Get()
  @ApiOperation({ summary: 'List all organizations. Platform only.' })
  findAll(@CurrentUser() currentUser: AuthenticatedRequestUser) {
    return this.organizationsService.findAll(currentUser);
  }

  @Get('me/current')
  @ApiOperation({ summary: 'Get current user organization.' })
  findCurrent(@CurrentUser() currentUser: AuthenticatedRequestUser) {
    return this.organizationsService.findCurrent(currentUser);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization by id within access scope.' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.organizationsService.findOne(id, currentUser);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update organization profile fields within access scope.' })
  @ApiBody({ type: UpdateOrganizationDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.organizationsService.update(id, dto, currentUser);
  }

  @Permissions('organizations.suspend')
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update organization status. Platform only.' })
  @ApiBody({ type: UpdateOrganizationStatusDto })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationStatusDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.organizationsService.updateStatus(id, dto, currentUser);
  }
}

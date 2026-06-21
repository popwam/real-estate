import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/current-user.decorator';
import { Permissions } from '../../common/permissions.decorator';
import { PermissionsGuard } from '../../common/permissions.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectFiltersDto } from './dto/project-filters.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UpdateProjectVisibilityDto } from './dto/update-project-visibility.dto';
import { UpdateProjectSellingModeDto } from './dto/update-project-selling-mode.dto';
import { CreateProjectBrokerAuthorizationDto } from './dto/create-project-broker-authorization.dto';
import { ProjectsService } from './projects.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Permissions('projects.create')
  @Post()
  create(
    @Body() dto: CreateProjectDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.projectsService.create(dto, currentUser);
  }

  @Get()
  findMany(
    @Query() filters: ProjectFiltersDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.projectsService.findMany(currentUser, filters);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.projectsService.findOne(id, currentUser);
  }

  @Patch(':id/selling-mode')
  updateSellingMode(
    @Param('id') id: string,
    @Body() dto: UpdateProjectSellingModeDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.projectsService.updateSellingMode(id, dto, currentUser);
  }

  @Get(':id/broker-authorizations')
  listBrokerAuthorizations(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.projectsService.listBrokerAuthorizations(id, currentUser);
  }

  @Post(':id/broker-authorizations')
  addBrokerAuthorization(
    @Param('id') id: string,
    @Body() dto: CreateProjectBrokerAuthorizationDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.projectsService.addBrokerAuthorization(id, dto, currentUser);
  }

  @Delete(':id/broker-authorizations/:authorizationId')
  removeBrokerAuthorization(
    @Param('id') id: string,
    @Param('authorizationId') authorizationId: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.projectsService.removeBrokerAuthorization(id, authorizationId, currentUser);
  }

  @Permissions('projects.edit')
  @Patch(':id/visibility')
  updateVisibility(
    @Param('id') id: string,
    @Body() dto: UpdateProjectVisibilityDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.projectsService.updateVisibility(id, dto, currentUser);
  }

  @Permissions('projects.edit')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.projectsService.update(id, dto, currentUser);
  }
}

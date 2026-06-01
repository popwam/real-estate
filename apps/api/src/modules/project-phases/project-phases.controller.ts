import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/current-user.decorator';
import { Permissions } from '../../common/permissions.decorator';
import { PermissionsGuard } from '../../common/permissions.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { CreateProjectPhaseDto } from './dto/create-project-phase.dto';
import { UpdateProjectPhaseDto } from './dto/update-project-phase.dto';
import { ProjectPhasesService } from './project-phases.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('projects/:projectId/phases')
export class ProjectPhasesController {
  constructor(private readonly projectPhasesService: ProjectPhasesService) {}

  @Permissions('projects.edit')
  @Post()
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateProjectPhaseDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.projectPhasesService.create(projectId, dto, currentUser);
  }

  @Get()
  findMany(
    @Param('projectId') projectId: string,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.projectPhasesService.findMany(projectId, currentUser);
  }

  @Permissions('projects.edit')
  @Patch(':id')
  update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProjectPhaseDto,
    @CurrentUser() currentUser: AuthenticatedRequestUser,
  ) {
    return this.projectPhasesService.update(projectId, id, dto, currentUser);
  }
}

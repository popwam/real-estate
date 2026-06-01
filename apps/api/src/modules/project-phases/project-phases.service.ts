import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ProjectStatus } from '@prisma/client';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../database/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { CreateProjectPhaseDto } from './dto/create-project-phase.dto';
import { UpdateProjectPhaseDto } from './dto/update-project-phase.dto';

@Injectable()
export class ProjectPhasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: ProjectsService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async create(
    projectId: string,
    dto: CreateProjectPhaseDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    const project = await this.projectsService.findOne(projectId, currentUser);
    this.projectsService.assertCanManageDeveloper(project.developerId, currentUser);
    this.assertPhaseDto(dto, true);

    const phase = await this.prisma.projectPhase.create({
      data: {
        projectId,
        name: dto.name.trim(),
        deliveryDate: this.optionalDate(dto.deliveryDate),
        totalUnits: dto.totalUnits,
        availableUnits: dto.availableUnits,
        status: (dto.status as ProjectStatus | undefined) ?? 'DRAFT',
      },
    });

    await this.auditLogs.record({
      action: 'project_phase.created',
      entityType: 'ProjectPhase',
      entityId: phase.id,
      organizationId: project.developerId,
      actor: currentUser,
    });

    return phase;
  }

  async findMany(projectId: string, currentUser: AuthenticatedRequestUser) {
    await this.projectsService.findOne(projectId, currentUser);

    return this.prisma.projectPhase.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async update(
    projectId: string,
    id: string,
    dto: UpdateProjectPhaseDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    const project = await this.projectsService.findOne(projectId, currentUser);
    this.projectsService.assertCanManageDeveloper(project.developerId, currentUser);
    this.assertPhaseDto(dto, false);

    const existing = await this.prisma.projectPhase.findFirst({
      where: { id, projectId },
    });

    if (!existing) {
      throw new NotFoundException('Project phase not found.');
    }

    const phase = await this.prisma.projectPhase.update({
      where: { id },
      data: {
        name: this.optionalString(dto.name),
        deliveryDate:
          dto.deliveryDate === null ? null : this.optionalDate(dto.deliveryDate),
        totalUnits: dto.totalUnits,
        availableUnits: dto.availableUnits,
        status: dto.status as ProjectStatus | undefined,
      },
    });

    await this.auditLogs.record({
      action: 'project_phase.updated',
      entityType: 'ProjectPhase',
      entityId: phase.id,
      organizationId: project.developerId,
      actor: currentUser,
    });

    return phase;
  }

  private assertPhaseDto(
    dto: CreateProjectPhaseDto | UpdateProjectPhaseDto,
    requireName: boolean,
  ) {
    if (requireName && !dto.name?.trim()) {
      throw new BadRequestException('name is required.');
    }

    if (dto.status && !Object.values(ProjectStatus).includes(dto.status as ProjectStatus)) {
      throw new BadRequestException('status is invalid.');
    }

    this.assertNonNegative(dto.totalUnits, 'totalUnits');
    this.assertNonNegative(dto.availableUnits, 'availableUnits');
  }

  private assertNonNegative(value: number | undefined, field: string) {
    if (value !== undefined && (!Number.isInteger(value) || value < 0)) {
      throw new BadRequestException(`${field} must be a non-negative integer.`);
    }
  }

  private optionalDate(value: string | undefined) {
    if (!value) {
      return undefined;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Date value is invalid.');
    }

    return date;
  }

  private optionalString(value: string | undefined) {
    const trimmed = value?.trim();
    return trimmed || undefined;
  }
}

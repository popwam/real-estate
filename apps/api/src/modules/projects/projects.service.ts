import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProjectStatus, ProjectType, ProjectVisibility } from '@prisma/client';
import { isPlatformUser, requireCurrentOrganizationId } from '../../common/organization-scope';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../database/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectFiltersDto } from './dto/project-filters.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UpdateProjectVisibilityDto } from './dto/update-project-visibility.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async create(dto: CreateProjectDto, currentUser: AuthenticatedRequestUser) {
    const developerId = this.requireDeveloperOrganization(currentUser);
    this.assertProjectDto(dto, true);

    const project = await this.prisma.project.create({
      data: {
        developerId,
        name: dto.name.trim(),
        slug: await this.createUniqueSlug(developerId, dto.slug ?? dto.name),
        type: dto.type as ProjectType,
        status: (dto.status as ProjectStatus | undefined) ?? 'DRAFT',
        city: this.optionalString(dto.city),
        district: this.optionalString(dto.district),
        latitude: this.optionalDecimal(dto.latitude),
        longitude: this.optionalDecimal(dto.longitude),
        address: this.optionalString(dto.address),
        deliveryDate: this.optionalDate(dto.deliveryDate),
        description: this.optionalString(dto.description),
        coverImageUrl: this.optionalString(dto.coverImageUrl),
        images: this.cleanStringArray(dto.images),
        videos: this.cleanStringArray(dto.videos),
        brochureUrl: this.optionalString(dto.brochureUrl),
        amenities: this.cleanStringArray(dto.amenities),
        visibility: (dto.visibility as ProjectVisibility | undefined) ?? 'PRIVATE',
        isFeatured: dto.isFeatured ?? false,
      },
      include: this.projectInclude(),
    });

    await this.auditLogs.record({
      action: 'project.created',
      entityType: 'Project',
      entityId: project.id,
      organizationId: developerId,
      actor: currentUser,
      metadata: { slug: project.slug, status: project.status },
    });

    return project;
  }

  async findMany(
    currentUser: AuthenticatedRequestUser,
    filters: ProjectFiltersDto = {},
  ) {
    this.assertProjectFilters(filters);
    const where = this.toProjectWhere(filters);

    if (isPlatformUser(currentUser)) {
      return this.prisma.project.findMany({
        where,
        include: this.projectInclude(),
        orderBy: { createdAt: 'desc' },
      });
    }

    const developerId = this.requireDeveloperOrganization(currentUser);

    return this.prisma.project.findMany({
      where: { ...where, developerId },
      include: this.projectInclude(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, currentUser: AuthenticatedRequestUser) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: this.projectInclude(),
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    this.assertCanReadProject(project.developerId, currentUser);

    return project;
  }

  async update(
    id: string,
    dto: UpdateProjectDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    const existing = await this.findOne(id, currentUser);
    this.assertCanManageDeveloper(existing.developerId, currentUser);
    this.assertProjectDto(dto, false);

    const updated = await this.prisma.project.update({
      where: { id },
      data: {
        name: this.optionalString(dto.name),
        slug: dto.slug
          ? await this.createUniqueSlug(existing.developerId, dto.slug, id)
          : undefined,
        type: dto.type as ProjectType | undefined,
        status: dto.status as ProjectStatus | undefined,
        city: this.optionalString(dto.city),
        district: this.optionalString(dto.district),
        latitude: this.optionalDecimal(dto.latitude),
        longitude: this.optionalDecimal(dto.longitude),
        address: this.optionalString(dto.address),
        deliveryDate:
          dto.deliveryDate === null ? null : this.optionalDate(dto.deliveryDate),
        description: this.optionalString(dto.description),
        coverImageUrl: this.optionalString(dto.coverImageUrl),
        images: dto.images ? this.cleanStringArray(dto.images) : undefined,
        videos: dto.videos ? this.cleanStringArray(dto.videos) : undefined,
        brochureUrl: this.optionalString(dto.brochureUrl),
        amenities: dto.amenities ? this.cleanStringArray(dto.amenities) : undefined,
        visibility: dto.visibility as ProjectVisibility | undefined,
        isFeatured: dto.isFeatured,
      },
      include: this.projectInclude(),
    });

    await this.auditLogs.record({
      action: 'project.updated',
      entityType: 'Project',
      entityId: updated.id,
      organizationId: updated.developerId,
      actor: currentUser,
      metadata: { status: updated.status, visibility: updated.visibility },
    });

    return updated;
  }

  async updateVisibility(
    id: string,
    dto: UpdateProjectVisibilityDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    if (
      !dto.visibility ||
      !Object.values(ProjectVisibility).includes(
        dto.visibility as ProjectVisibility,
      )
    ) {
      throw new BadRequestException('visibility is invalid.');
    }

    const existing = await this.findOne(id, currentUser);
    this.assertCanManageDeveloper(existing.developerId, currentUser);

    const updated = await this.prisma.project.update({
      where: { id },
      data: { visibility: dto.visibility as ProjectVisibility },
      include: this.projectInclude(),
    });

    await this.auditLogs.record({
      action: 'project.visibility_changed',
      entityType: 'Project',
      entityId: updated.id,
      organizationId: updated.developerId,
      actor: currentUser,
      metadata: {
        previousVisibility: existing.visibility,
        visibility: updated.visibility,
      },
    });

    return updated;
  }

  assertCanManageDeveloper(
    developerId: string,
    currentUser: AuthenticatedRequestUser,
  ) {
    if (isPlatformUser(currentUser)) {
      throw new ForbiddenException('Platform users can read marketplace data but cannot manage developer-owned records in Slice 1.');
    }

    if (
      currentUser.organizationType !== 'DEVELOPER' ||
      currentUser.organizationId !== developerId
    ) {
      throw new ForbiddenException('Cannot manage another developer organization.');
    }
  }

  assertCanReadProject(
    developerId: string,
    currentUser: AuthenticatedRequestUser,
  ) {
    if (isPlatformUser(currentUser)) {
      return;
    }

    if (
      currentUser.organizationType !== 'DEVELOPER' ||
      currentUser.organizationId !== developerId
    ) {
      throw new ForbiddenException('Cannot access another developer organization project.');
    }
  }

  private requireDeveloperOrganization(currentUser: AuthenticatedRequestUser) {
    if (isPlatformUser(currentUser)) {
      throw new ForbiddenException('Platform users cannot create developer projects in Slice 1.');
    }

    const organizationId = requireCurrentOrganizationId(currentUser);

    if (currentUser.organizationType !== 'DEVELOPER') {
      throw new ForbiddenException('Only developer organizations can manage projects.');
    }

    return organizationId;
  }

  private assertProjectDto(
    dto: CreateProjectDto | UpdateProjectDto,
    requireRequiredFields: boolean,
  ) {
    if (requireRequiredFields && !dto.name?.trim()) {
      throw new BadRequestException('name is required.');
    }

    if (requireRequiredFields && !dto.type?.trim()) {
      throw new BadRequestException('type is required.');
    }

    if (dto.type && !Object.values(ProjectType).includes(dto.type as ProjectType)) {
      throw new BadRequestException('type is invalid.');
    }

    if (
      dto.status &&
      !Object.values(ProjectStatus).includes(dto.status as ProjectStatus)
    ) {
      throw new BadRequestException('status is invalid.');
    }

    if (
      dto.visibility &&
      !Object.values(ProjectVisibility).includes(dto.visibility as ProjectVisibility)
    ) {
      throw new BadRequestException('visibility is invalid.');
    }

    this.assertCoordinate(dto.latitude, 'latitude', -90, 90);
    this.assertCoordinate(dto.longitude, 'longitude', -180, 180);
    this.assertStringArray(dto.images, 'images');
    this.assertStringArray(dto.videos, 'videos');
    this.assertStringArray(dto.amenities, 'amenities');
  }

  private assertProjectFilters(filters: ProjectFiltersDto) {
    if (
      filters.status &&
      !Object.values(ProjectStatus).includes(filters.status as ProjectStatus)
    ) {
      throw new BadRequestException('status filter is invalid.');
    }

    if (
      filters.visibility &&
      !Object.values(ProjectVisibility).includes(
        filters.visibility as ProjectVisibility,
      )
    ) {
      throw new BadRequestException('visibility filter is invalid.');
    }
  }

  private toProjectWhere(filters: ProjectFiltersDto): Prisma.ProjectWhereInput {
    return {
      status: filters.status as ProjectStatus | undefined,
      visibility: filters.visibility as ProjectVisibility | undefined,
      city: this.optionalString(filters.city),
      district: this.optionalString(filters.district),
    };
  }

  private assertCoordinate(
    value: number | undefined,
    field: string,
    min: number,
    max: number,
  ) {
    if (value !== undefined && (!Number.isFinite(value) || value < min || value > max)) {
      throw new BadRequestException(`${field} is invalid.`);
    }
  }

  private assertStringArray(value: string[] | undefined, field: string) {
    if (value !== undefined && !Array.isArray(value)) {
      throw new BadRequestException(`${field} must be an array.`);
    }
  }

  async createUniqueSlug(
    developerId: string,
    value: string,
    ignoreProjectId?: string,
  ) {
    const baseSlug = this.slugify(value);
    let slug = baseSlug;
    let suffix = 1;

    while (
      await this.prisma.project.findFirst({
        where: {
          developerId,
          slug,
          id: ignoreProjectId ? { not: ignoreProjectId } : undefined,
        },
      })
    ) {
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }

    return slug;
  }

  private slugify(value: string) {
    const slug = value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    return slug || `project-${Date.now()}`;
  }

  private projectInclude() {
    return {
      developer: true,
      phases: true,
      paymentPlans: true,
      _count: { select: { inventoryUnits: true } },
    };
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

  private optionalDecimal(value: number | undefined) {
    return value === undefined ? undefined : new Prisma.Decimal(value);
  }

  private cleanStringArray(value: string[] | undefined) {
    return value?.map((item) => item.trim()).filter(Boolean) ?? [];
  }

  private optionalString(value: string | undefined) {
    const trimmed = value?.trim();
    return trimmed || undefined;
  }
}

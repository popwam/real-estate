import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UnitFinishing, UnitStatus, UnitType, UnitVisibility } from '@prisma/client';
import { isPlatformUser } from '../../common/organization-scope';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../database/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { CreateInventoryUnitDto } from './dto/create-inventory-unit.dto';
import { InventoryFiltersDto } from './dto/inventory-filters.dto';
import { UpdateInventoryUnitDto } from './dto/update-inventory-unit.dto';

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: ProjectsService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async create(
    dto: CreateInventoryUnitDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    this.assertCreateDto(dto);
    const project = await this.projectsService.findOne(dto.projectId, currentUser);
    this.projectsService.assertCanManageDeveloper(project.developerId, currentUser);
    await this.assertPhaseBelongsToProject(dto.phaseId, dto.projectId);

    const unit = await this.prisma.inventoryUnit.create({
      data: {
        projectId: dto.projectId,
        phaseId: this.optionalString(dto.phaseId),
        developerId: project.developerId,
        unitNumber: dto.unitNumber.trim(),
        unitType: dto.unitType as UnitType,
        floor: this.optionalString(dto.floor),
        areaSqm: this.optionalDecimal(dto.areaSqm),
        bedrooms: dto.bedrooms,
        bathrooms: dto.bathrooms,
        finishing: dto.finishing as UnitFinishing | undefined,
        view: this.optionalString(dto.view),
        basePrice: this.optionalDecimal(dto.basePrice),
        currency: this.optionalString(dto.currency) ?? 'EGP',
        pricePerSqm: this.optionalDecimal(dto.pricePerSqm),
        status: (dto.status as UnitStatus | undefined) ?? 'AVAILABLE',
        visibility: (dto.visibility as UnitVisibility | undefined) ?? 'INHERIT_PROJECT',
        images: this.cleanStringArray(dto.images),
        floorPlanUrl: this.optionalString(dto.floorPlanUrl),
        features: dto.features as any,
      },
      include: this.unitInclude(),
    });

    await this.auditLogs.record({
      action: 'inventory_unit.created',
      entityType: 'InventoryUnit',
      entityId: unit.id,
      organizationId: unit.developerId,
      actor: currentUser,
      metadata: { projectId: unit.projectId, unitNumber: unit.unitNumber },
    });

    return unit;
  }

  async findMany(
    currentUser: AuthenticatedRequestUser,
    filters: InventoryFiltersDto = {},
  ) {
    this.assertInventoryFilters(filters);
    const where = this.toInventoryWhere(filters);

    if (isPlatformUser(currentUser)) {
      return this.prisma.inventoryUnit.findMany({
        where,
        include: this.unitInclude(),
        orderBy: { createdAt: 'desc' },
      });
    }

    if (
      currentUser.organizationType !== 'DEVELOPER' ||
      !currentUser.organizationId
    ) {
      throw new ForbiddenException('Only developer organizations can list private inventory.');
    }

    return this.prisma.inventoryUnit.findMany({
      where: { ...where, developerId: currentUser.organizationId },
      include: this.unitInclude(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, currentUser: AuthenticatedRequestUser) {
    const unit = await this.prisma.inventoryUnit.findUnique({
      where: { id },
      include: this.unitInclude(),
    });

    if (!unit) {
      throw new NotFoundException('Inventory unit not found.');
    }

    if (
      !isPlatformUser(currentUser) &&
      (currentUser.organizationType !== 'DEVELOPER' ||
        currentUser.organizationId !== unit.developerId)
    ) {
      throw new ForbiddenException('Cannot access another developer organization unit.');
    }

    return unit;
  }

  async update(
    id: string,
    dto: UpdateInventoryUnitDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    const existing = await this.findOne(id, currentUser);
    this.projectsService.assertCanManageDeveloper(existing.developerId, currentUser);
    this.assertUpdateDto(dto);
    await this.assertPhaseBelongsToProject(
      dto.phaseId === null ? undefined : dto.phaseId,
      existing.projectId,
    );

    const unit = await this.prisma.inventoryUnit.update({
      where: { id },
      data: {
        phaseId: dto.phaseId === null ? null : this.optionalString(dto.phaseId),
        unitNumber: this.optionalString(dto.unitNumber),
        unitType: dto.unitType as UnitType | undefined,
        floor: this.optionalString(dto.floor),
        areaSqm: this.optionalDecimal(dto.areaSqm),
        bedrooms: dto.bedrooms,
        bathrooms: dto.bathrooms,
        finishing: dto.finishing as UnitFinishing | undefined,
        view: this.optionalString(dto.view),
        basePrice: this.optionalDecimal(dto.basePrice),
        currency: this.optionalString(dto.currency),
        pricePerSqm: this.optionalDecimal(dto.pricePerSqm),
        status: dto.status as UnitStatus | undefined,
        visibility: dto.visibility as UnitVisibility | undefined,
        images: dto.images ? this.cleanStringArray(dto.images) : undefined,
        floorPlanUrl: this.optionalString(dto.floorPlanUrl),
        features: dto.features as any,
      },
      include: this.unitInclude(),
    });

    await this.auditLogs.record({
      action: 'inventory_unit.updated',
      entityType: 'InventoryUnit',
      entityId: unit.id,
      organizationId: unit.developerId,
      actor: currentUser,
      metadata: { status: unit.status, visibility: unit.visibility },
    });

    return unit;
  }

  private assertCreateDto(dto: CreateInventoryUnitDto) {
    if (!dto.projectId?.trim()) {
      throw new BadRequestException('projectId is required.');
    }

    if (!dto.unitNumber?.trim()) {
      throw new BadRequestException('unitNumber is required.');
    }

    if (!dto.unitType?.trim()) {
      throw new BadRequestException('unitType is required.');
    }

    this.assertUpdateDto(dto);
  }

  private assertUpdateDto(dto: UpdateInventoryUnitDto | CreateInventoryUnitDto) {
    if (dto.unitType && !Object.values(UnitType).includes(dto.unitType as UnitType)) {
      throw new BadRequestException('unitType is invalid.');
    }

    if (dto.status && !Object.values(UnitStatus).includes(dto.status as UnitStatus)) {
      throw new BadRequestException('status is invalid.');
    }

    if (
      dto.visibility &&
      !Object.values(UnitVisibility).includes(dto.visibility as UnitVisibility)
    ) {
      throw new BadRequestException('visibility is invalid.');
    }

    if (
      dto.finishing &&
      !Object.values(UnitFinishing).includes(dto.finishing as UnitFinishing)
    ) {
      throw new BadRequestException('finishing is invalid.');
    }

    this.assertNonNegative(dto.areaSqm, 'areaSqm');
    this.assertNonNegative(dto.bedrooms, 'bedrooms');
    this.assertNonNegative(dto.bathrooms, 'bathrooms');
    this.assertNonNegative(dto.basePrice, 'basePrice');
    this.assertNonNegative(dto.pricePerSqm, 'pricePerSqm');

    if (dto.images !== undefined && !Array.isArray(dto.images)) {
      throw new BadRequestException('images must be an array.');
    }
  }

  private assertInventoryFilters(filters: InventoryFiltersDto) {
    if (filters.status && !Object.values(UnitStatus).includes(filters.status as UnitStatus)) {
      throw new BadRequestException('status filter is invalid.');
    }

    if (filters.unitType && !Object.values(UnitType).includes(filters.unitType as UnitType)) {
      throw new BadRequestException('unitType filter is invalid.');
    }

    if (
      filters.visibility &&
      !Object.values(UnitVisibility).includes(filters.visibility as UnitVisibility)
    ) {
      throw new BadRequestException('visibility filter is invalid.');
    }
  }

  private toInventoryWhere(
    filters: InventoryFiltersDto,
  ): Prisma.InventoryUnitWhereInput {
    return {
      projectId: this.optionalString(filters.projectId),
      status: filters.status as UnitStatus | undefined,
      unitType: filters.unitType as UnitType | undefined,
      visibility: filters.visibility as UnitVisibility | undefined,
    };
  }

  private async assertPhaseBelongsToProject(
    phaseId: string | undefined,
    projectId: string,
  ) {
    if (!phaseId) {
      return;
    }

    const phase = await this.prisma.projectPhase.findFirst({
      where: { id: phaseId, projectId },
    });

    if (!phase) {
      throw new BadRequestException('phaseId does not belong to the project.');
    }
  }

  private assertNonNegative(value: number | undefined, field: string) {
    if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
      throw new BadRequestException(`${field} must be a non-negative number.`);
    }
  }

  private unitInclude() {
    return {
      project: true,
      phase: true,
      availabilityRecords: true,
      paymentPlans: true,
    };
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

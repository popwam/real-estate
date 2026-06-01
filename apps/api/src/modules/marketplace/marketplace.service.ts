import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  ProjectStatus,
  ProjectType,
  ProjectVisibility,
  UnitStatus,
  UnitType,
} from '@prisma/client';
import { isPlatformUser } from '../../common/organization-scope';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../database/prisma.service';
import { MarketplaceMapSearchDto } from './dto/marketplace-map-search.dto';
import { MarketplaceProjectFiltersDto } from './dto/marketplace-project-filters.dto';
import { MarketplaceUnitFiltersDto } from './dto/marketplace-unit-filters.dto';
import { MarketplaceAccessService } from './marketplace-access.service';

@Injectable()
export class MarketplaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly marketplaceAccess: MarketplaceAccessService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async findProjects(
    filters: MarketplaceProjectFiltersDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    this.assertMarketplaceReadAllowed(currentUser);

    const projects = await this.prisma.project.findMany({
      where: this.buildProjectWhere(filters, currentUser),
      include: this.projectInclude(),
      orderBy: { createdAt: 'desc' },
    });

    return this.filterProjectsForUser(projects, currentUser);
  }

  async findProject(id: string, currentUser: AuthenticatedRequestUser) {
    this.assertMarketplaceReadAllowed(currentUser);

    const project = await this.prisma.project.findUnique({
      where: { id },
      include: this.projectInclude(),
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (
      !(await this.marketplaceAccess.canViewProjectForMarketplace(
        currentUser,
        project,
      ))
    ) {
      throw new ForbiddenException('Project is not visible in the marketplace');
    }

    await this.auditLogs.record({
      action: 'marketplace.project_viewed',
      entityType: 'Project',
      entityId: project.id,
      actor: currentUser,
      organizationId: project.developerId,
    });

    return project;
  }

  async findUnits(
    filters: MarketplaceUnitFiltersDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    this.assertMarketplaceReadAllowed(currentUser);

    const units = await this.prisma.inventoryUnit.findMany({
      where: this.buildUnitWhere(filters, currentUser),
      include: this.unitInclude(),
      orderBy: { createdAt: 'desc' },
    });

    return this.filterUnitsForUser(units, currentUser);
  }

  async findUnit(id: string, currentUser: AuthenticatedRequestUser) {
    this.assertMarketplaceReadAllowed(currentUser);

    const unit = await this.prisma.inventoryUnit.findUnique({
      where: { id },
      include: this.unitInclude(),
    });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    if (
      !(await this.marketplaceAccess.canViewUnitForMarketplace(currentUser, unit))
    ) {
      throw new ForbiddenException('Unit is not visible in the marketplace');
    }

    await this.auditLogs.record({
      action: 'marketplace.unit_viewed',
      entityType: 'InventoryUnit',
      entityId: unit.id,
      actor: currentUser,
      organizationId: unit.developerId,
    });

    return unit;
  }

  async mapSearch(
    dto: MarketplaceMapSearchDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    this.assertMarketplaceReadAllowed(currentUser);

    if (!dto.bbox) {
      throw new BadRequestException('bbox is required');
    }

    const { minLat, maxLat, minLng, maxLng } = dto.bbox;

    for (const [key, value] of Object.entries({ minLat, maxLat, minLng, maxLng })) {
      if (typeof value !== 'number' || Number.isNaN(value)) {
        throw new BadRequestException(`${key} must be a number`);
      }
    }

    if (minLat > maxLat || minLng > maxLng) {
      throw new BadRequestException('bbox minimum values must be below maximum values');
    }

    // TODO: replace latitude/longitude box filtering with PostGIS ST_Within once
    // Prisma geometry mapping is introduced for project locations.
    const projects = await this.prisma.project.findMany({
      where: {
        ...this.buildProjectWhere(dto.filters ?? {}, currentUser),
        latitude: {
          gte: new Prisma.Decimal(minLat),
          lte: new Prisma.Decimal(maxLat),
        },
        longitude: {
          gte: new Prisma.Decimal(minLng),
          lte: new Prisma.Decimal(maxLng),
        },
      },
      include: this.projectInclude(),
      orderBy: { createdAt: 'desc' },
    });

    return {
      projects: await this.filterProjectsForUser(projects, currentUser),
    };
  }

  private assertMarketplaceReadAllowed(currentUser: AuthenticatedRequestUser) {
    if (isPlatformUser(currentUser)) {
      return;
    }

    if (
      !['BROKERAGE', 'INDIVIDUAL_BROKER'].includes(
        currentUser.organizationType ?? '',
      )
    ) {
      throw new ForbiddenException('Marketplace reads are scoped to broker users');
    }

    if (!currentUser.permissions?.includes('marketplace.view')) {
      throw new ForbiddenException('Missing marketplace.view permission');
    }
  }

  private buildProjectWhere(
    filters: MarketplaceProjectFiltersDto,
    currentUser: AuthenticatedRequestUser,
  ): Prisma.ProjectWhereInput {
    const where: Prisma.ProjectWhereInput = {};

    if (!isPlatformUser(currentUser)) {
      where.status = ProjectStatus.ACTIVE;
    }

    if (filters.status) {
      where.status = this.enumValue(ProjectStatus, filters.status, 'status');
    }

    if (filters.visibility) {
      where.visibility = this.enumValue(
        ProjectVisibility,
        filters.visibility,
        'visibility',
      );
    }

    if (filters.type) {
      where.type = this.enumValue(ProjectType, filters.type, 'type');
    }

    if (filters.city) {
      where.city = filters.city;
    }

    if (filters.district) {
      where.district = filters.district;
    }

    const unitWhere = this.buildProjectUnitFilter(filters);
    if (Object.keys(unitWhere).length > 0) {
      where.inventoryUnits = { some: unitWhere };
    }

    return where;
  }

  private buildProjectUnitFilter(
    filters: MarketplaceProjectFiltersDto,
  ): Prisma.InventoryUnitWhereInput {
    const unitWhere: Prisma.InventoryUnitWhereInput = {};
    const minPrice = this.optionalDecimal(filters.minPrice, 'minPrice');
    const maxPrice = this.optionalDecimal(filters.maxPrice, 'maxPrice');

    if (minPrice || maxPrice) {
      unitWhere.basePrice = {
        ...(minPrice ? { gte: minPrice } : {}),
        ...(maxPrice ? { lte: maxPrice } : {}),
      };
    }

    if (filters.unitType) {
      unitWhere.unitType = this.enumValue(UnitType, filters.unitType, 'unitType');
    }

    return unitWhere;
  }

  private buildUnitWhere(
    filters: MarketplaceUnitFiltersDto,
    currentUser: AuthenticatedRequestUser,
  ): Prisma.InventoryUnitWhereInput {
    const where: Prisma.InventoryUnitWhereInput = {};

    if (!isPlatformUser(currentUser)) {
      where.status = UnitStatus.AVAILABLE;
    }

    if (filters.projectId) {
      where.projectId = filters.projectId;
    }

    if (filters.status) {
      where.status = this.enumValue(UnitStatus, filters.status, 'status');
    }

    if (filters.unitType) {
      where.unitType = this.enumValue(UnitType, filters.unitType, 'unitType');
    }

    const minPrice = this.optionalDecimal(filters.minPrice, 'minPrice');
    const maxPrice = this.optionalDecimal(filters.maxPrice, 'maxPrice');
    if (minPrice || maxPrice) {
      where.basePrice = {
        ...(minPrice ? { gte: minPrice } : {}),
        ...(maxPrice ? { lte: maxPrice } : {}),
      };
    }

    const bedrooms = this.optionalInt(filters.bedrooms, 'bedrooms');
    if (bedrooms !== undefined) {
      where.bedrooms = bedrooms;
    }

    const areaMin = this.optionalDecimal(filters.areaMin, 'areaMin');
    const areaMax = this.optionalDecimal(filters.areaMax, 'areaMax');
    if (areaMin || areaMax) {
      where.areaSqm = {
        ...(areaMin ? { gte: areaMin } : {}),
        ...(areaMax ? { lte: areaMax } : {}),
      };
    }

    if (filters.city || filters.district) {
      where.project = {
        ...(filters.city ? { city: filters.city } : {}),
        ...(filters.district ? { district: filters.district } : {}),
      };
    }

    return where;
  }

  private async filterProjectsForUser<T extends { id: string; developerId: string; status: string; visibility: ProjectVisibility }>(
    projects: T[],
    currentUser: AuthenticatedRequestUser,
  ) {
    const visibleProjects: T[] = [];

    for (const project of projects) {
      if (
        await this.marketplaceAccess.canViewProjectForMarketplace(
          currentUser,
          project,
        )
      ) {
        visibleProjects.push(project);
      }
    }

    return visibleProjects;
  }

  private async filterUnitsForUser<T extends { id: string; status: string; visibility: any; project: any }>(
    units: T[],
    currentUser: AuthenticatedRequestUser,
  ) {
    const visibleUnits: T[] = [];

    for (const unit of units) {
      if (
        await this.marketplaceAccess.canViewUnitForMarketplace(currentUser, unit)
      ) {
        visibleUnits.push(unit);
      }
    }

    return visibleUnits;
  }

  private optionalDecimal(value: string | undefined, field: string) {
    if (value === undefined) {
      return undefined;
    }

    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      throw new BadRequestException(`${field} must be a number`);
    }

    return new Prisma.Decimal(parsed);
  }

  private optionalInt(value: string | undefined, field: string) {
    if (value === undefined) {
      return undefined;
    }

    const parsed = Number(value);
    if (!Number.isInteger(parsed)) {
      throw new BadRequestException(`${field} must be an integer`);
    }

    return parsed;
  }

  private enumValue<T extends Record<string, string>>(
    enumType: T,
    value: string,
    field: string,
  ) {
    if (!Object.values(enumType).includes(value)) {
      throw new BadRequestException(`${field} is not supported`);
    }

    return value as T[keyof T];
  }

  private projectInclude() {
    return {
      developer: true,
      inventoryUnits: true,
      brokerAccessRules: true,
      paymentPlans: true,
    };
  }

  private unitInclude() {
    return {
      project: {
        include: {
          developer: true,
          brokerAccessRules: true,
        },
      },
      phase: true,
      paymentPlans: true,
    };
  }
}

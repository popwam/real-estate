import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CustomerProfileStatus,
  Prisma,
  RealEstateProjectStatus,
  RealEstateUnitStatus,
  RealEstateUnitType,
  UnitCustomerRelationType,
  UnitQrPassStatus,
  UnitQrPassType,
} from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import { isPlatformUser, requireCurrentOrganizationId } from '../../common/organization-scope';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class RealEstateService {
  constructor(private readonly prisma: PrismaService) {}

  listCustomers(user: AuthenticatedRequestUser, organizationId?: string) {
    return this.prisma.customerProfile.findMany({
      where: { organizationId: this.scopedOrganizationId(user, organizationId) },
      orderBy: { createdAt: 'desc' },
    });
  }

  createCustomer(user: AuthenticatedRequestUser, input: any) {
    const organizationId = this.requiredScopedOrganizationId(user, input.organizationId);
    return this.prisma.customerProfile.create({
      data: {
        organizationId,
        userId: this.optionalString(input.userId),
        fullName: this.requiredString(input.fullName, 'fullName'),
        localizedName: this.json(input.localizedName),
        phone: this.requiredString(input.phone, 'phone'),
        email: this.optionalString(input.email),
        nationalId: this.optionalString(input.nationalId),
        preferredLanguage: this.optionalString(input.preferredLanguage) ?? 'en',
        status: this.enumValue(CustomerProfileStatus, input.status, 'status') ?? CustomerProfileStatus.LEAD,
      },
    });
  }

  async getCustomer(user: AuthenticatedRequestUser, id: string) {
    const customer = await this.prisma.customerProfile.findUnique({
      where: { id },
      include: { assignments: { include: { unit: true } } },
    });
    if (!customer) throw new NotFoundException('Customer not found.');
    this.assertOrgAccess(user, customer.organizationId);
    return customer;
  }

  async updateCustomer(user: AuthenticatedRequestUser, id: string, input: any) {
    const existing = await this.getCustomer(user, id);
    return this.prisma.customerProfile.update({
      where: { id },
      data: {
        userId: input.userId === null ? null : this.optionalString(input.userId) ?? undefined,
        fullName: this.optionalString(input.fullName) ?? undefined,
        localizedName: input.localizedName === undefined ? undefined : this.json(input.localizedName),
        phone: this.optionalString(input.phone) ?? undefined,
        email: input.email === null ? null : this.optionalString(input.email) ?? undefined,
        nationalId: input.nationalId === null ? null : this.optionalString(input.nationalId) ?? undefined,
        preferredLanguage: this.optionalString(input.preferredLanguage) ?? undefined,
        status: input.status ? this.enumValue(CustomerProfileStatus, input.status, 'status') : undefined,
      },
    });
  }

  listProjects(user: AuthenticatedRequestUser, organizationId?: string) {
    return this.prisma.compound.findMany({
      where: { organizationId: this.scopedOrganizationId(user, organizationId) },
      orderBy: { createdAt: 'desc' },
    });
  }

  createProject(user: AuthenticatedRequestUser, input: any) {
    const organizationId = this.requiredScopedOrganizationId(user, input.organizationId);
    return this.prisma.compound.create({
      data: {
        organizationId,
        name: this.requiredString(input.name, 'name'),
        localizedName: this.json(input.localizedName),
        code: this.requiredString(input.code, 'code'),
        address: this.optionalString(input.address),
        status: this.enumValue(RealEstateProjectStatus, input.status, 'status') ?? RealEstateProjectStatus.ACTIVE,
      },
    });
  }

  getProject(user: AuthenticatedRequestUser, id: string) {
    return this.findProject(user, id, { buildings: true, units: true });
  }

  async updateProject(user: AuthenticatedRequestUser, id: string, input: any) {
    await this.findProject(user, id);
    return this.prisma.compound.update({
      where: { id },
      data: {
        name: this.optionalString(input.name) ?? undefined,
        localizedName: input.localizedName === undefined ? undefined : this.json(input.localizedName),
        code: this.optionalString(input.code) ?? undefined,
        address: input.address === null ? null : this.optionalString(input.address) ?? undefined,
        status: input.status ? this.enumValue(RealEstateProjectStatus, input.status, 'status') : undefined,
      },
    });
  }

  listBuildings(user: AuthenticatedRequestUser, organizationId?: string) {
    return this.prisma.building.findMany({
      where: { organizationId: this.scopedOrganizationId(user, organizationId) },
      include: { project: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createBuilding(user: AuthenticatedRequestUser, input: any) {
    const project = await this.findProject(user, this.requiredString(input.projectId, 'projectId'));
    return this.prisma.building.create({
      data: {
        organizationId: project.organizationId,
        projectId: project.id,
        name: this.requiredString(input.name, 'name'),
        code: this.requiredString(input.code, 'code'),
        floorsCount: this.optionalInt(input.floorsCount),
      },
    });
  }

  getBuilding(user: AuthenticatedRequestUser, id: string) {
    return this.findBuilding(user, id, { project: true, floors: true, units: true });
  }

  async updateBuilding(user: AuthenticatedRequestUser, id: string, input: any) {
    await this.findBuilding(user, id);
    return this.prisma.building.update({
      where: { id },
      data: {
        name: this.optionalString(input.name) ?? undefined,
        code: this.optionalString(input.code) ?? undefined,
        floorsCount: input.floorsCount === null ? null : this.optionalInt(input.floorsCount) ?? undefined,
      },
    });
  }

  listUnits(user: AuthenticatedRequestUser, organizationId?: string) {
    return this.prisma.unit.findMany({
      where: { organizationId: this.scopedOrganizationId(user, organizationId) },
      include: { project: true, building: true, floor: true, assignments: { include: { customerProfile: true } }, qrPasses: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createUnit(user: AuthenticatedRequestUser, input: any) {
    const building = await this.findBuilding(user, this.requiredString(input.buildingId, 'buildingId'));
    const projectId = this.optionalString(input.projectId) ?? building.projectId;
    if (projectId !== building.projectId) throw new BadRequestException('buildingId does not belong to projectId.');
    if (input.floorId) await this.findFloor(user, input.floorId);
    return this.prisma.unit.create({
      data: {
        organizationId: building.organizationId,
        projectId,
        buildingId: building.id,
        floorId: this.optionalString(input.floorId),
        unitNumber: this.requiredString(input.unitNumber, 'unitNumber'),
        unitCode: this.requiredString(input.unitCode, 'unitCode'),
        unitType: this.enumValue(RealEstateUnitType, input.unitType, 'unitType') ?? RealEstateUnitType.APARTMENT,
        status: this.enumValue(RealEstateUnitStatus, input.status, 'status') ?? RealEstateUnitStatus.AVAILABLE,
        area: this.decimal(input.area),
        bedrooms: this.optionalInt(input.bedrooms),
        bathrooms: this.optionalInt(input.bathrooms),
        qrPassEnabled: input.qrPassEnabled ?? true,
      },
    });
  }

  getUnit(user: AuthenticatedRequestUser, id: string) {
    return this.findUnit(user, id, {
      project: true,
      building: true,
      floor: true,
      assignments: { include: { customerProfile: true, user: { select: { id: true, email: true, firstName: true, lastName: true } } } },
      qrPasses: true,
    });
  }

  async updateUnit(user: AuthenticatedRequestUser, id: string, input: any) {
    await this.findUnit(user, id);
    return this.prisma.unit.update({
      where: { id },
      data: {
        floorId: input.floorId === null ? null : this.optionalString(input.floorId) ?? undefined,
        unitNumber: this.optionalString(input.unitNumber) ?? undefined,
        unitCode: this.optionalString(input.unitCode) ?? undefined,
        unitType: input.unitType ? this.enumValue(RealEstateUnitType, input.unitType, 'unitType') : undefined,
        status: input.status ? this.enumValue(RealEstateUnitStatus, input.status, 'status') : undefined,
        area: input.area === null ? null : this.decimal(input.area) ?? undefined,
        bedrooms: input.bedrooms === null ? null : this.optionalInt(input.bedrooms) ?? undefined,
        bathrooms: input.bathrooms === null ? null : this.optionalInt(input.bathrooms) ?? undefined,
        qrPassEnabled: typeof input.qrPassEnabled === 'boolean' ? input.qrPassEnabled : undefined,
      },
    });
  }

  async listAssignments(user: AuthenticatedRequestUser, unitId: string) {
    const unit = await this.findUnit(user, unitId);
    return this.prisma.unitCustomerAssignment.findMany({
      where: { organizationId: unit.organizationId, unitId },
      include: { customerProfile: true, user: { select: { id: true, email: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAssignment(user: AuthenticatedRequestUser, unitId: string, input: any) {
    const unit = await this.findUnit(user, unitId);
    const customer = await this.getCustomer(user, this.requiredString(input.customerProfileId, 'customerProfileId'));
    if (customer.organizationId !== unit.organizationId) throw new ForbiddenException('Customer belongs to another organization.');
    return this.prisma.unitCustomerAssignment.create({
      data: {
        organizationId: unit.organizationId,
        unitId,
        customerProfileId: customer.id,
        userId: this.optionalString(input.userId) ?? customer.userId,
        relationType: this.enumValue(UnitCustomerRelationType, input.relationType, 'relationType') ?? UnitCustomerRelationType.RESIDENT,
        startsAt: this.optionalDate(input.startsAt),
        endsAt: this.optionalDate(input.endsAt),
        isActive: input.isActive ?? true,
        permissions: this.json(input.permissions) ?? [],
      },
    });
  }

  async updateAssignment(user: AuthenticatedRequestUser, id: string, input: any) {
    const existing = await this.prisma.unitCustomerAssignment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Unit assignment not found.');
    this.assertOrgAccess(user, existing.organizationId);
    return this.prisma.unitCustomerAssignment.update({
      where: { id },
      data: {
        userId: input.userId === null ? null : this.optionalString(input.userId) ?? undefined,
        relationType: input.relationType ? this.enumValue(UnitCustomerRelationType, input.relationType, 'relationType') : undefined,
        startsAt: input.startsAt === null ? null : this.optionalDate(input.startsAt) ?? undefined,
        endsAt: input.endsAt === null ? null : this.optionalDate(input.endsAt) ?? undefined,
        isActive: typeof input.isActive === 'boolean' ? input.isActive : undefined,
        permissions: input.permissions === undefined ? undefined : this.json(input.permissions) ?? [],
      },
    });
  }

  async deleteAssignment(user: AuthenticatedRequestUser, id: string) {
    const existing = await this.prisma.unitCustomerAssignment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Unit assignment not found.');
    this.assertOrgAccess(user, existing.organizationId);
    await this.prisma.unitCustomerAssignment.delete({ where: { id } });
    return { deleted: true };
  }

  async listMyUnits(user: AuthenticatedRequestUser) {
    return this.prisma.unit.findMany({
      where: this.myUnitWhere(user),
      include: { project: true, building: true, floor: true, qrPasses: { where: { status: UnitQrPassStatus.ACTIVE } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyUnit(user: AuthenticatedRequestUser, id: string) {
    const unit = await this.prisma.unit.findFirst({
      where: { id, ...this.myUnitWhere(user) },
      include: { project: true, building: true, floor: true, qrPasses: { where: { status: UnitQrPassStatus.ACTIVE } } },
    });
    if (!unit) throw new ForbiddenException('This unit is not assigned to you.');
    return unit;
  }

  listMyQrPasses(user: AuthenticatedRequestUser) {
    return this.prisma.unitQrPass.findMany({
      where: {
        status: UnitQrPassStatus.ACTIVE,
        OR: [{ userId: user.userId }, { customerProfile: { userId: user.userId } }],
      },
      include: { unit: { include: { project: true, building: true, floor: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createQrPass(user: AuthenticatedRequestUser, unitId: string, input: any) {
    const unit = await this.findUnit(user, unitId);
    if (!unit.qrPassEnabled) throw new BadRequestException('QR passes are disabled for this unit.');
    const token = this.newToken();
    const pass = await this.prisma.unitQrPass.create({
      data: {
        organizationId: unit.organizationId,
        unitId,
        customerProfileId: this.optionalString(input.customerProfileId),
        userId: this.optionalString(input.userId),
        passType: this.enumValue(UnitQrPassType, input.passType, 'passType') ?? UnitQrPassType.UNIT,
        tokenHash: this.hashToken(token),
        displayCode: this.optionalString(input.displayCode) ?? this.displayCode(),
        startsAt: this.optionalDate(input.startsAt),
        expiresAt: this.optionalDate(input.expiresAt),
        maxUses: this.optionalInt(input.maxUses),
        metadata: this.json(input.metadata) ?? {},
      },
      include: { unit: true, customerProfile: true },
    });
    return this.withQrToken(pass, token);
  }

  async regenerateQrPass(user: AuthenticatedRequestUser, id: string) {
    const existing = await this.findQrPass(user, id);
    const token = this.newToken();
    const pass = await this.prisma.unitQrPass.update({
      where: { id },
      data: { tokenHash: this.hashToken(token), useCount: 0, lastUsedAt: null, status: UnitQrPassStatus.ACTIVE },
      include: { unit: true, customerProfile: true },
    });
    return this.withQrToken(pass, token);
  }

  async revokeQrPass(user: AuthenticatedRequestUser, id: string) {
    await this.findQrPass(user, id);
    return this.prisma.unitQrPass.update({ where: { id }, data: { status: UnitQrPassStatus.REVOKED } });
  }

  async suspendQrPass(user: AuthenticatedRequestUser, id: string) {
    await this.findQrPass(user, id);
    return this.prisma.unitQrPass.update({ where: { id }, data: { status: UnitQrPassStatus.SUSPENDED } });
  }

  async scanQrPass(token: string) {
    const pass = await this.prisma.unitQrPass.findUnique({
      where: { tokenHash: this.hashToken(token) },
      include: { unit: { include: { project: true, building: true } }, customerProfile: true },
    });
    if (!pass) throw new NotFoundException('QR pass not found.');
    const expired = Boolean(pass.expiresAt && pass.expiresAt <= new Date());
    const maxed = pass.maxUses !== null && pass.useCount >= pass.maxUses;
    const effectiveStatus = expired || maxed ? UnitQrPassStatus.EXPIRED : pass.status;
    if (effectiveStatus === UnitQrPassStatus.ACTIVE) {
      await this.prisma.unitQrPass.update({
        where: { id: pass.id },
        data: { useCount: { increment: 1 }, lastUsedAt: new Date() },
      });
    }
    return {
      status: effectiveStatus,
      passType: pass.passType,
      displayCode: pass.displayCode,
      unitDisplayCode: pass.unit.unitCode,
      residentDisplayName: pass.customerProfile?.fullName ?? null,
      smartGateIntegration: {
        configured: false,
        message: 'QR access pass is available. Smart gate integration is not configured.',
      },
    };
  }

  private async findProject(user: AuthenticatedRequestUser, id: string, include?: Prisma.CompoundInclude) {
    const project = await this.prisma.compound.findUnique({ where: { id }, include });
    if (!project) throw new NotFoundException('Project not found.');
    this.assertOrgAccess(user, project.organizationId);
    return project;
  }

  private async findBuilding(user: AuthenticatedRequestUser, id: string, include?: Prisma.BuildingInclude) {
    const building = await this.prisma.building.findUnique({ where: { id }, include });
    if (!building) throw new NotFoundException('Building not found.');
    this.assertOrgAccess(user, building.organizationId);
    return building;
  }

  private async findFloor(user: AuthenticatedRequestUser, id: string) {
    const floor = await this.prisma.floor.findUnique({ where: { id } });
    if (!floor) throw new NotFoundException('Floor not found.');
    this.assertOrgAccess(user, floor.organizationId);
    return floor;
  }

  private async findUnit(user: AuthenticatedRequestUser, id: string, include?: Prisma.UnitInclude) {
    const unit = await this.prisma.unit.findUnique({ where: { id }, include });
    if (!unit) throw new NotFoundException('Unit not found.');
    this.assertOrgAccess(user, unit.organizationId);
    return unit;
  }

  private async findQrPass(user: AuthenticatedRequestUser, id: string) {
    const pass = await this.prisma.unitQrPass.findUnique({ where: { id } });
    if (!pass) throw new NotFoundException('QR pass not found.');
    this.assertOrgAccess(user, pass.organizationId);
    return pass;
  }

  private myUnitWhere(user: AuthenticatedRequestUser): Prisma.UnitWhereInput {
    return {
      assignments: {
        some: {
          isActive: true,
          OR: [{ userId: user.userId }, { customerProfile: { userId: user.userId } }],
        },
      },
    };
  }

  private scopedOrganizationId(user: AuthenticatedRequestUser, organizationId?: string) {
    if (isPlatformUser(user)) return this.optionalString(organizationId);
    return requireCurrentOrganizationId(user);
  }

  private requiredScopedOrganizationId(user: AuthenticatedRequestUser, organizationId?: string) {
    if (isPlatformUser(user)) return this.optionalString(organizationId) ?? requireCurrentOrganizationId(user);
    return requireCurrentOrganizationId(user);
  }

  private assertOrgAccess(user: AuthenticatedRequestUser, organizationId: string | null) {
    if (!isPlatformUser(user) && user.organizationId !== organizationId) {
      throw new ForbiddenException('Access denied.');
    }
  }

  private withQrToken(pass: any, token: string) {
    return {
      ...pass,
      qrToken: token,
      qrPayload: `/qr/pass/${encodeURIComponent(token)}`,
    };
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private newToken() {
    return randomBytes(32).toString('base64url');
  }

  private displayCode() {
    return randomBytes(4).toString('hex').toUpperCase();
  }

  private enumValue<T extends Record<string, string>>(values: T, value: unknown, field: string) {
    if (value === undefined || value === null || value === '') return undefined;
    const normalized = String(value).trim().toUpperCase();
    if (Object.prototype.hasOwnProperty.call(values, normalized)) return values[normalized as keyof T];
    throw new BadRequestException(`${field} is invalid.`);
  }

  private requiredString(value: unknown, field: string) {
    const parsed = this.optionalString(value);
    if (!parsed) throw new BadRequestException(`${field} is required.`);
    return parsed;
  }

  private optionalString(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private optionalInt(value: unknown) {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = Number(value);
    if (!Number.isInteger(parsed)) throw new BadRequestException('Expected an integer value.');
    return parsed;
  }

  private optionalDate(value: unknown) {
    if (!value) return undefined;
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) throw new BadRequestException('Invalid date.');
    return date;
  }

  private decimal(value: unknown) {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) throw new BadRequestException('Expected a numeric value.');
    return new Prisma.Decimal(parsed);
  }

  private json(value: unknown) {
    return value === undefined ? undefined : value === null ? Prisma.JsonNull : value;
  }
}

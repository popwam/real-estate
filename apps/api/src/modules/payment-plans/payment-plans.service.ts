import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentPlanScope, Prisma } from '@prisma/client';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../database/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { CreatePaymentPlanDto } from './dto/create-payment-plan.dto';

@Injectable()
export class PaymentPlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: ProjectsService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async create(
    projectId: string,
    dto: CreatePaymentPlanDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    const project = await this.projectsService.findOne(projectId, currentUser);
    this.projectsService.assertCanManageDeveloper(project.developerId, currentUser);
    await this.assertPaymentPlanDto(projectId, dto);

    const paymentPlan = await this.prisma.paymentPlan.create({
      data: {
        projectId,
        unitId: this.optionalString(dto.unitId),
        scope:
          (dto.scope as PaymentPlanScope | undefined) ??
          (dto.unitId ? 'UNIT' : 'PROJECT'),
        name: dto.name.trim(),
        downPaymentPct: this.optionalDecimal(dto.downPaymentPct),
        installmentMonths: dto.installmentMonths,
        installmentPct: this.optionalDecimal(dto.installmentPct),
        onDeliveryPct: this.optionalDecimal(dto.onDeliveryPct),
        maintenanceFee: this.optionalDecimal(dto.maintenanceFee),
        isActive: dto.isActive ?? true,
        conditions: dto.conditions as any,
      },
      include: { project: true, unit: true },
    });

    await this.auditLogs.record({
      action: 'payment_plan.created',
      entityType: 'PaymentPlan',
      entityId: paymentPlan.id,
      organizationId: project.developerId,
      actor: currentUser,
      metadata: { projectId, unitId: paymentPlan.unitId, scope: paymentPlan.scope },
    });

    return paymentPlan;
  }

  async findMany(projectId: string, currentUser: AuthenticatedRequestUser) {
    await this.projectsService.findOne(projectId, currentUser);

    return this.prisma.paymentPlan.findMany({
      where: { projectId },
      include: { unit: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  private async assertPaymentPlanDto(
    projectId: string,
    dto: CreatePaymentPlanDto,
  ) {
    if (!dto.name?.trim()) {
      throw new BadRequestException('name is required.');
    }

    if (dto.scope && !Object.values(PaymentPlanScope).includes(dto.scope as PaymentPlanScope)) {
      throw new BadRequestException('scope is invalid.');
    }

    this.assertNonNegative(dto.downPaymentPct, 'downPaymentPct');
    this.assertNonNegative(dto.installmentMonths, 'installmentMonths');
    this.assertNonNegative(dto.installmentPct, 'installmentPct');
    this.assertNonNegative(dto.onDeliveryPct, 'onDeliveryPct');
    this.assertNonNegative(dto.maintenanceFee, 'maintenanceFee');

    if (dto.unitId) {
      const unit = await this.prisma.inventoryUnit.findFirst({
        where: { id: dto.unitId, projectId },
      });

      if (!unit) {
        throw new BadRequestException('unitId does not belong to the project.');
      }
    }
  }

  private assertNonNegative(value: number | undefined, field: string) {
    if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
      throw new BadRequestException(`${field} must be a non-negative number.`);
    }
  }

  private optionalDecimal(value: number | undefined) {
    return value === undefined ? undefined : new Prisma.Decimal(value);
  }

  private optionalString(value: string | undefined) {
    const trimmed = value?.trim();
    return trimmed || undefined;
  }
}

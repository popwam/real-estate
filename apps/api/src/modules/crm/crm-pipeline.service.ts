import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CrmActivityType } from '@prisma/client';
import { requireCurrentOrganizationId } from '../../common/organization-scope';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../database/prisma.service';
import { CrmActivitiesService } from './crm-activities.service';
import { CrmLeadsService } from './crm-leads.service';

const DEFAULT_STAGES = [
  ['NEW', 'New', '#64748b'],
  ['CONTACTED', 'Contacted', '#0ea5e9'],
  ['QUALIFIED', 'Qualified', '#22c55e'],
  ['SITE_VISIT', 'Site visit', '#a855f7'],
  ['NEGOTIATION', 'Negotiation', '#f59e0b'],
  ['WON', 'Won', '#16a34a'],
  ['LOST', 'Lost', '#ef4444'],
] as const;

@Injectable()
export class CrmPipelineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly leads: CrmLeadsService,
    private readonly activities: CrmActivitiesService,
  ) {}

  async listStages(currentUser: AuthenticatedRequestUser) {
    this.assertPipelineView(currentUser);
    const organizationId = requireCurrentOrganizationId(currentUser);
    await this.ensureDefaultStages(organizationId);
    return this.prisma.crmPipelineStage.findMany({
      where: { organizationId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async createStage(input: any, currentUser: AuthenticatedRequestUser) {
    this.assertPipelineManage(currentUser);
    const organizationId = requireCurrentOrganizationId(currentUser);
    const name = this.requiredString(input.name, 'name');
    const key = this.slugKey(input.key ?? name);
    const order =
      Number.isInteger(Number(input.order))
        ? Number(input.order)
        : await this.nextOrder(organizationId);

    return this.prisma.crmPipelineStage.create({
      data: {
        organizationId,
        name,
        key,
        order,
        color: this.optionalString(input.color),
        isDefault: Boolean(input.isDefault),
        isActive: input.isActive === undefined ? true : Boolean(input.isActive),
      },
    });
  }

  async updateStage(id: string, input: any, currentUser: AuthenticatedRequestUser) {
    this.assertPipelineManage(currentUser);
    const stage = await this.findStage(id, currentUser);
    return this.prisma.crmPipelineStage.update({
      where: { id: stage.id },
      data: {
        name: input.name === undefined ? undefined : this.requiredString(input.name, 'name'),
        order: input.order === undefined ? undefined : Number(input.order),
        color: input.color === undefined ? undefined : this.optionalString(input.color),
        isActive: input.isActive === undefined ? undefined : Boolean(input.isActive),
      },
    });
  }

  async reorderStages(input: any, currentUser: AuthenticatedRequestUser) {
    this.assertPipelineManage(currentUser);
    const organizationId = requireCurrentOrganizationId(currentUser);
    const stages = Array.isArray(input.stages) ? input.stages : [];
    await this.prisma.$transaction(
      stages.map((stage: any, index: number) =>
        this.prisma.crmPipelineStage.updateMany({
          where: { id: String(stage.id), organizationId },
          data: { order: Number.isInteger(Number(stage.order)) ? Number(stage.order) : index + 1 },
        }),
      ),
    );
    return this.listStages(currentUser);
  }

  async changeLeadStage(id: string, input: any, currentUser: AuthenticatedRequestUser) {
    this.assertPipelineManage(currentUser);
    const lead = await this.leads.findAccessibleLead(id, currentUser);
    this.leads.assertCanManageLead(lead, currentUser);
    const stage = await this.findStage(String(input.stageId ?? input.toStageId), currentUser);

    const updated = await this.prisma.$transaction(async (tx) => {
      const changed = await tx.crmLead.update({
        where: { id: lead.id },
        data: { pipelineStageId: stage.id },
        include: this.leads.includeRelations(),
      });
      await tx.crmLeadStageHistory.create({
        data: {
          crmLeadId: lead.id,
          fromStageId: lead.pipelineStageId,
          toStageId: stage.id,
          changedByUserId: currentUser.userId,
          note: this.optionalString(input.note),
        },
      });
      await this.activities.create(
        {
          organizationId: changed.organizationId,
          crmLeadId: changed.id,
          actorUserId: currentUser.userId,
          actorOrganizationId: currentUser.organizationId,
          actorRole: currentUser.role,
          type: CrmActivityType.LEAD_STAGE_CHANGED,
          title: 'CRM lead stage changed',
          body: this.optionalString(input.note),
          metadata: { fromStageId: lead.pipelineStageId, toStageId: stage.id },
        },
        tx,
      );
      return changed;
    });

    return this.leads.toResponse(updated);
  }

  async stageHistory(id: string, currentUser: AuthenticatedRequestUser) {
    await this.leads.findAccessibleLead(id, currentUser);
    return this.prisma.crmLeadStageHistory.findMany({
      where: { crmLeadId: id },
      include: {
        fromStage: true,
        toStage: true,
        changedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async ensureDefaultStages(organizationId: string) {
    const count = await this.prisma.crmPipelineStage.count({ where: { organizationId } });
    if (count > 0) return;
    await this.prisma.crmPipelineStage.createMany({
      data: DEFAULT_STAGES.map(([key, name, color], index) => ({
        organizationId,
        key,
        name,
        color,
        order: index + 1,
        isDefault: true,
        isActive: true,
      })),
      skipDuplicates: true,
    });
  }

  private async findStage(id: string, currentUser: AuthenticatedRequestUser) {
    const organizationId = requireCurrentOrganizationId(currentUser);
    const stage = await this.prisma.crmPipelineStage.findFirst({
      where: { id, organizationId },
    });
    if (!stage) throw new NotFoundException('CRM pipeline stage not found.');
    return stage;
  }

  private async nextOrder(organizationId: string) {
    const last = await this.prisma.crmPipelineStage.findFirst({
      where: { organizationId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    return (last?.order ?? 0) + 1;
  }

  private assertPipelineView(currentUser: AuthenticatedRequestUser) {
    if (!currentUser.permissions?.some((p) => ['crm.pipeline.view_own', 'crm.pipeline.manage_own'].includes(p))) {
      throw new ForbiddenException('Missing crm.pipeline.view_own permission.');
    }
  }

  private assertPipelineManage(currentUser: AuthenticatedRequestUser) {
    if (!currentUser.permissions?.includes('crm.pipeline.manage_own')) {
      throw new ForbiddenException('Missing crm.pipeline.manage_own permission.');
    }
  }

  private requiredString(value: unknown, field: string) {
    const text = this.optionalString(value);
    if (!text) throw new BadRequestException(`${field} is required.`);
    return text.slice(0, 240);
  }

  private optionalString(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private slugKey(value: unknown) {
    const key = this.requiredString(value, 'key')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    return key || 'STAGE';
  }
}

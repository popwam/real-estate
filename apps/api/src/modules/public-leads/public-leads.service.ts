import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PublicLeadStatus } from '@prisma/client';
import { isPlatformUser, requireCurrentOrganizationId } from '../../common/organization-scope';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { CrmConversionService } from '../crm/crm-conversion.service';
import { PrismaService } from '../database/prisma.service';
import { UpdatePublicLeadStatusDto } from './dto/update-public-lead-status.dto';

@Injectable()
export class PublicLeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
    private readonly crmConversion: CrmConversionService,
  ) {}

  async findMany(currentUser: AuthenticatedRequestUser) {
    const scope = this.leadReadScope(currentUser);
    const leads = await this.prisma.publicLead.findMany({
      where: scope,
      include: this.includeRelations(),
      orderBy: { createdAt: 'desc' },
    });

    return leads.map((lead) => this.toResponse(lead));
  }

  async findOne(id: string, currentUser: AuthenticatedRequestUser) {
    const lead = await this.findLeadForUser(id, currentUser, 'read');
    return this.toResponse(lead);
  }

  async updateStatus(
    id: string,
    dto: UpdatePublicLeadStatusDto,
    currentUser: AuthenticatedRequestUser,
  ) {
    const targetStatus = this.parseStatus(dto.status);
    const lead = await this.findLeadForUser(id, currentUser, 'manage');

    this.assertTransition(lead.status, targetStatus, currentUser);

    const updated = await this.prisma.publicLead.update({
      where: { id },
      data: {
        status: targetStatus,
        statusNote: this.optionalString(dto.note),
      },
      include: this.includeRelations(),
    });

    await this.auditLogs.record({
      action: 'public_lead.status_updated',
      entityType: 'PublicLead',
      entityId: updated.id,
      actor: currentUser,
      organizationId: updated.organizationId,
      metadata: {
        from: lead.status,
        to: updated.status,
      },
    });

    return this.toResponse(updated);
  }

  markSpam(id: string, currentUser: AuthenticatedRequestUser) {
    return this.updateStatus(
      id,
      { status: 'SPAM', note: 'Marked as spam.' },
      currentUser,
    );
  }

  async convertPlaceholder(id: string, currentUser: AuthenticatedRequestUser) {
    const lead = await this.findLeadForUser(id, currentUser, 'manage');
    const result = await this.crmConversion.convertPublicLead(id);
    const statusNote =
      'Conversion placeholder completed. No LeadClaim, ReservationRequest, broker assignment, deal, or commission was created.';

    const updated = await this.prisma.publicLead.update({
      where: { id },
      data: { status: 'CONVERTED', statusNote },
      include: this.includeRelations(),
    });

    await this.auditLogs.record({
      action: 'public_lead.converted_to_crm',
      entityType: 'PublicLead',
      entityId: id,
      actor: currentUser,
      organizationId: lead.organizationId,
      metadata: {
        crmLeadId: result.crmLead.id,
        crmClientId: result.crmClient.id,
        idempotent: result.idempotent,
      },
    });

    return {
      ...result,
      status: updated.status,
      statusNote: updated.statusNote,
      publicLead: this.toResponse(updated),
    };
  }

  private async findLeadForUser(
    id: string,
    currentUser: AuthenticatedRequestUser,
    access: 'read' | 'manage',
  ) {
    const scope =
      access === 'read'
        ? this.leadReadScope(currentUser)
        : this.leadManageScope(currentUser);

    const lead = await this.prisma.publicLead.findFirst({
      where: { id, ...scope },
      include: this.includeRelations(),
    });

    if (!lead) {
      const exists = await this.prisma.publicLead.findUnique({ where: { id } });
      if (exists) {
        throw new ForbiddenException('Public lead is outside your organization scope.');
      }
      throw new NotFoundException('Public lead not found.');
    }

    return lead;
  }

  private leadReadScope(currentUser: AuthenticatedRequestUser) {
    if (
      isPlatformUser(currentUser) &&
      this.hasAnyPermission(currentUser, [
        'public_leads.view_all',
        'public_leads.manage_all',
      ])
    ) {
      return {};
    }

    if (!this.hasAnyPermission(currentUser, ['public_leads.view_own', 'public_leads.manage_own'])) {
      throw new ForbiddenException('Missing public_leads.view_own permission.');
    }

    const organizationId = requireCurrentOrganizationId(currentUser);
    if (['BROKERAGE', 'INDIVIDUAL_BROKER'].includes(currentUser.organizationType ?? '')) {
      return {
        OR: [
          { assignedBrokerUserId: currentUser.userId },
          { assignedOrganizationId: organizationId },
        ],
      };
    }
    return { OR: [{ organizationId }, { project: { developerId: organizationId } }] };
  }

  private leadManageScope(currentUser: AuthenticatedRequestUser) {
    if (
      isPlatformUser(currentUser) &&
      this.hasAnyPermission(currentUser, ['public_leads.manage_all'])
    ) {
      return {};
    }

    if (!this.hasAnyPermission(currentUser, ['public_leads.manage_own'])) {
      throw new ForbiddenException('Missing public_leads.manage_own permission.');
    }

    const organizationId = requireCurrentOrganizationId(currentUser);
    if (['BROKERAGE', 'INDIVIDUAL_BROKER'].includes(currentUser.organizationType ?? '')) {
      return {
        OR: [
          { assignedBrokerUserId: currentUser.userId },
          { assignedOrganizationId: organizationId },
        ],
      };
    }
    return { OR: [{ organizationId }, { project: { developerId: organizationId } }] };
  }

  private assertTransition(
    from: PublicLeadStatus,
    to: PublicLeadStatus,
    currentUser: AuthenticatedRequestUser,
  ) {
    if (from === to) {
      return;
    }

    if (to === PublicLeadStatus.REVIEWED && from === PublicLeadStatus.NEW) {
      return;
    }

    if (
      to === PublicLeadStatus.CONVERTED &&
      (from === PublicLeadStatus.NEW || from === PublicLeadStatus.REVIEWED)
    ) {
      return;
    }

    if (
      to === PublicLeadStatus.SPAM &&
      (from === PublicLeadStatus.NEW || from === PublicLeadStatus.REVIEWED)
    ) {
      return;
    }

    if (
      from === PublicLeadStatus.SPAM &&
      to === PublicLeadStatus.CONVERTED &&
      isPlatformUser(currentUser) &&
      this.hasAnyPermission(currentUser, ['public_leads.manage_all'])
    ) {
      return;
    }

    throw new BadRequestException(`Cannot change public lead from ${from} to ${to}.`);
  }

  private parseStatus(status: string) {
    if (
      status !== PublicLeadStatus.REVIEWED &&
      status !== PublicLeadStatus.CONVERTED &&
      status !== PublicLeadStatus.SPAM
    ) {
      throw new BadRequestException('Unsupported public lead status.');
    }

    return status as PublicLeadStatus;
  }

  private hasAnyPermission(
    currentUser: AuthenticatedRequestUser,
    permissions: string[],
  ) {
    return permissions.some((permission) =>
      currentUser.permissions?.includes(permission),
    );
  }

  private includeRelations() {
    return {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          status: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          visibility: true,
        },
      },
    };
  }

  private toResponse(lead: any) {
    return {
      id: lead.id,
      organizationId: lead.organizationId,
      projectId: lead.projectId,
      name: lead.name,
      phone: lead.phone,
      phoneLast4: lead.phoneLast4,
      email: lead.email,
      message: lead.message,
      sourcePage: lead.sourcePage,
      utm: lead.utm,
      consent: lead.consent,
      idempotencyKey: lead.idempotencyKey,
      status: lead.status,
      statusNote: lead.statusNote,
      spamScore: lead.spamScore,
      spamSignals: lead.spamSignals,
      sourceIpHash: lead.sourceIpHash,
      userAgentHash: lead.userAgentHash,
      normalizedEmail: lead.normalizedEmail,
      consentAt: lead.consentAt,
      visitorId: lead.visitorId,
      visitorSessionId: lead.visitorSessionId,
      assignmentType: lead.assignmentType,
      assignmentReason: lead.assignmentReason,
      assignedOrganizationId: lead.assignedOrganizationId,
      assignedBrokerUserId: lead.assignedBrokerUserId,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      organization: lead.organization,
      project: lead.project,
    };
  }

  private optionalString(value: string | undefined | null) {
    const trimmed = value?.trim();
    return trimmed || undefined;
  }
}

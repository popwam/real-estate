import { Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import {
  CrmActivityType,
  CrmLeadStatus,
  PreferredContactMethod,
  Prisma,
  PublicLeadStatus,
} from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CrmActivitiesService } from './crm-activities.service';

@Injectable()
export class CrmConversionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activities: CrmActivitiesService,
  ) {}

  async convertPublicLead(publicLeadId: string) {
    const publicLead = await this.prisma.publicLead.findUnique({
      where: { id: publicLeadId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            websiteSettings: {
              select: { whatsappUrl: true },
            },
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
            developerId: true,
          },
        },
      },
    });

    if (!publicLead) {
      throw new NotFoundException('Public lead not found.');
    }

    const organizationId =
      publicLead.organizationId ?? publicLead.project?.developerId;
    if (!organizationId) {
      throw new NotFoundException('Public lead organization context not found.');
    }

    const preferredContactMethod =
      publicLead.preferredContactMethod ?? PreferredContactMethod.CALL;
    const assignmentNote =
      publicLead.assignmentType === 'BROKER' || publicLead.assignmentType === 'BROKERAGE'
        ? `Stage 8 first-touch assignment was preserved (${publicLead.assignmentReason ?? publicLead.assignmentType}).`
        : `Lead remains company-owned (${publicLead.assignmentReason ?? 'PROJECT_OWNER_DEFAULT'}).`;

    const result = await this.prisma.$transaction(async (tx) => {
      const existingLead = await tx.crmLead.findUnique({
        where: { publicLeadId },
        include: this.crmLeadInclude(),
      });

      if (existingLead) {
        await tx.publicLead.update({
          where: { id: publicLeadId },
          data: {
            status: PublicLeadStatus.CONVERTED,
            statusNote:
              'Conversion placeholder upgraded to CRM foundation. Existing CRM lead returned idempotently.',
          },
        });
        if (preferredContactMethod === PreferredContactMethod.CHAT) {
          await this.createConversationForLead(tx, existingLead.id);
        }
        return { crmLead: existingLead, created: false };
      }

      const normalizedPhone = this.normalizePhone(publicLead.phone);
      const phoneHash = this.hashValue(`phone:${normalizedPhone}`);
      const phoneLast4 = normalizedPhone.slice(-4) || null;
      const normalizedEmail = publicLead.normalizedEmail ?? this.optionalEmail(publicLead.email);

      let client = await tx.crmClient.findFirst({
        where: { organizationId, phoneHash },
      });

      if (!client) {
        client = await tx.crmClient.create({
          data: {
            organizationId,
            name: publicLead.name,
            phone: publicLead.phone,
            normalizedPhone,
            phoneHash,
            phoneLast4,
            email: normalizedEmail,
            normalizedEmail,
            source: 'PUBLIC_LEAD',
          },
        });
      }

      const crmLead = await tx.crmLead.create({
        data: {
          organizationId,
          projectId: publicLead.projectId,
          publicLeadId,
          clientId: client.id,
          status:
            publicLead.status === PublicLeadStatus.SPAM
              ? CrmLeadStatus.SPAM
              : publicLead.assignmentType === 'BROKER' || publicLead.assignmentType === 'BROKERAGE'
                ? CrmLeadStatus.CLAIMED
                : CrmLeadStatus.NEW,
          claimedByBrokerUserId: publicLead.assignedBrokerUserId,
          claimedByOrganizationId:
            publicLead.assignmentType === 'COMPANY'
              ? null
              : publicLead.assignedOrganizationId,
          claimedAt:
            publicLead.assignmentType === 'BROKER' || publicLead.assignmentType === 'BROKERAGE'
              ? new Date()
              : undefined,
          assignmentType: publicLead.assignmentType,
          assignmentReason: publicLead.assignmentReason,
          preferredContactMethod,
          sourcePage: publicLead.sourcePage,
          utm: publicLead.utm as Prisma.InputJsonValue | undefined,
        },
        include: this.crmLeadInclude(),
      });

      await this.activities.create(
        {
          organizationId,
          crmLeadId: crmLead.id,
          type: CrmActivityType.LEAD_CREATED,
          title: 'CRM lead created',
          body: 'CRM lead was created from a public lead.',
          metadata: {
            publicLeadId,
            preferredContactMethod,
            source: 'PUBLIC_LEAD',
            assignmentType: publicLead.assignmentType,
            assignmentReason: publicLead.assignmentReason,
          },
        },
        tx,
      );

      await tx.publicLead.update({
        where: { id: publicLeadId },
        data: {
          status: PublicLeadStatus.CONVERTED,
          statusNote:
            `Conversion placeholder upgraded to CRM foundation. Converted to CRM client and CRM lead. ${assignmentNote} No LeadClaim, ReservationRequest, DealRoom, deal, or commission was created.`,
        },
      });

      await this.activities.create(
        {
          organizationId,
          crmLeadId: crmLead.id,
          type: CrmActivityType.LEAD_CONVERTED,
          title: 'Public lead converted',
          body: 'Public lead was converted to CRM client and CRM lead.',
          metadata: {
            publicLeadId,
            preferredContactMethod,
          },
        },
        tx,
      );

      if (preferredContactMethod === PreferredContactMethod.CHAT) {
        await this.createConversationForLead(tx, crmLead.id);
      }

      return { crmLead, created: true };
    });

    const refreshedLead = await this.prisma.crmLead.findUniqueOrThrow({
      where: { id: result.crmLead.id },
      include: this.crmLeadInclude(),
    });
    const conversation =
      preferredContactMethod === PreferredContactMethod.CHAT
        ? await this.findPublicLeadConversation(refreshedLead.id)
        : null;

    return {
      success: true,
      id: publicLeadId,
      status: PublicLeadStatus.CONVERTED,
      statusNote:
        `Conversion placeholder upgraded to CRM foundation. ${assignmentNote} No LeadClaim, ReservationRequest, DealRoom, deal, or commission was created.`,
      converted: true,
      idempotent: !result.created,
      publicLeadId,
      crmClient: this.toClientResponse(refreshedLead.client),
      crmLead: this.toCrmLeadResponse(refreshedLead),
      conversation: conversation
        ? this.toPublicConversationLink(conversation)
        : undefined,
      contact: this.contactResponse(preferredContactMethod, publicLead.organization?.websiteSettings?.whatsappUrl),
      safety:
        `${assignmentNote} No LeadClaim, ReservationRequest, DealRoom, deal, or commission was created.`,
    };
  }

  private async createConversationForLead(tx: Prisma.TransactionClient, crmLeadId: string) {
    const lead = await tx.crmLead.findUniqueOrThrow({
      where: { id: crmLeadId },
      include: { client: true },
    });

    const existing = await tx.conversation.findFirst({
      where: { crmLeadId: crmLeadId, type: 'PUBLIC_LEAD' },
    });
    if (existing) {
      return existing;
    }

    const conversation = await tx.conversation.create({
      data: {
        organizationId: lead.organizationId,
        projectId: lead.projectId,
        unitId: lead.unitId,
        crmLeadId: lead.id,
        type: 'PUBLIC_LEAD',
        shareToken: this.shareToken(),
        participants: {
          create: [
            {
              publicRole: 'CLIENT',
              displayName: lead.client.name,
            },
            {
              publicRole: 'SYSTEM',
              displayName: 'POPWAM',
            },
          ],
        },
        messages: {
          create: {
            type: 'SYSTEM',
            body: 'Conversation created for public CRM lead.',
          },
        },
      },
    });

    await this.activities.create(
      {
        organizationId: lead.organizationId,
        crmLeadId: lead.id,
        conversationId: conversation.id,
        type: CrmActivityType.CONVERSATION_CREATED,
        title: 'Conversation created',
        body: 'Conversation created for public CRM lead.',
        metadata: {
          source: 'PUBLIC_LEAD',
        },
      },
      tx,
    );

    await tx.crmLead.update({
      where: { id: lead.id },
      data: { status: 'IN_CONVERSATION' },
    });

    return conversation;
  }

  private findPublicLeadConversation(crmLeadId: string) {
    return this.prisma.conversation.findFirst({
      where: { crmLeadId, type: 'PUBLIC_LEAD' },
      select: { shareToken: true },
    });
  }

  private crmLeadInclude() {
    return {
      client: true,
      organization: { select: { id: true, name: true, slug: true, type: true } },
      project: { select: { id: true, name: true, slug: true, developerId: true } },
      publicLead: { select: { id: true, status: true } },
    };
  }

  private toClientResponse(client: any) {
    return {
      id: client.id,
      organizationId: client.organizationId,
      name: client.name,
      phone: client.phone,
      phoneLast4: client.phoneLast4,
      email: client.email,
      normalizedEmail: client.normalizedEmail,
      source: client.source,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    };
  }

  private toCrmLeadResponse(lead: any) {
    return {
      id: lead.id,
      organizationId: lead.organizationId,
      projectId: lead.projectId,
      unitId: lead.unitId,
      publicLeadId: lead.publicLeadId,
      clientId: lead.clientId,
      status: lead.status,
      statusNote: lead.statusNote,
      preferredContactMethod: lead.preferredContactMethod,
      claimedByBrokerUserId: lead.claimedByBrokerUserId,
      claimedByOrganizationId: lead.claimedByOrganizationId,
      claimedAt: lead.claimedAt,
      assignmentType: lead.assignmentType,
      assignmentReason: lead.assignmentReason,
      sourcePage: lead.sourcePage,
      utm: lead.utm,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      organization: lead.organization,
      project: lead.project,
      client: this.toClientResponse(lead.client),
    };
  }

  private contactResponse(method: PreferredContactMethod, whatsappUrl?: string | null) {
    return {
      preferredContactMethod: method,
      whatsappUrl: method === PreferredContactMethod.WHATSAPP ? whatsappUrl ?? null : null,
      note:
        method === PreferredContactMethod.WHATSAPP
          ? 'WhatsApp link is a safe placeholder from organization website settings. No WhatsApp provider was called.'
          : undefined,
    };
  }

  private toPublicConversationLink(conversation: { shareToken: string }) {
    return {
      shareToken: conversation.shareToken,
      shareUrl: `/c/${conversation.shareToken}`,
    };
  }

  private normalizePhone(phone: string) {
    return phone.replace(/[^\d+]/g, '').replace(/^00/, '+');
  }

  private optionalEmail(email: string | null | undefined) {
    const trimmed = email?.trim().toLowerCase();
    return trimmed || null;
  }

  private hashValue(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }

  private shareToken() {
    return randomBytes(32).toString('base64url');
  }
}

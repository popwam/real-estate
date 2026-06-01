import { Injectable } from '@nestjs/common';
import { ConversationStatus, CrmLeadStatus, OrganizationType, Prisma } from '@prisma/client';
import { isPlatformUser, requireCurrentOrganizationId } from '../../common/organization-scope';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../database/prisma.service';
import { CrmLeadsService } from './crm-leads.service';

@Injectable()
export class CrmSummaryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crmLeads: CrmLeadsService,
  ) {}

  async summary(currentUser: AuthenticatedRequestUser) {
    const leadScope = this.crmLeads.leadScope(currentUser);
    const conversationScope = this.conversationScope(currentUser);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalLeads,
      newLeads,
      claimedLeads,
      qualifiedLeads,
      lostLeads,
      convertedLeads,
      spamLeads,
      openConversations,
      closedConversations,
      archivedConversations,
      todayNewLeads,
      todayNewMessages,
    ] = await this.prisma.$transaction([
      this.prisma.crmLead.count({ where: leadScope }),
      this.prisma.crmLead.count({ where: { AND: [leadScope, { status: CrmLeadStatus.NEW }] } }),
      this.prisma.crmLead.count({ where: { AND: [leadScope, { status: CrmLeadStatus.CLAIMED }] } }),
      this.prisma.crmLead.count({ where: { AND: [leadScope, { status: CrmLeadStatus.QUALIFIED }] } }),
      this.prisma.crmLead.count({ where: { AND: [leadScope, { status: CrmLeadStatus.LOST }] } }),
      this.prisma.crmLead.count({ where: { AND: [leadScope, { status: CrmLeadStatus.CONVERTED }] } }),
      this.prisma.crmLead.count({ where: { AND: [leadScope, { status: CrmLeadStatus.SPAM }] } }),
      this.prisma.conversation.count({ where: { AND: [conversationScope, { status: ConversationStatus.OPEN }] } }),
      this.prisma.conversation.count({ where: { AND: [conversationScope, { status: ConversationStatus.CLOSED }] } }),
      this.prisma.conversation.count({ where: { AND: [conversationScope, { status: ConversationStatus.ARCHIVED }] } }),
      this.prisma.crmLead.count({
        where: { AND: [leadScope, { createdAt: { gte: startOfToday } }] },
      }),
      this.prisma.conversationMessage.count({
        where: {
          createdAt: { gte: startOfToday },
          conversation: conversationScope,
        },
      }),
    ]);

    return {
      leads: {
        total: totalLeads,
        new: newLeads,
        claimed: claimedLeads,
        qualified: qualifiedLeads,
        lost: lostLeads,
        converted: convertedLeads,
        spam: spamLeads,
      },
      conversations: {
        open: openConversations,
        closed: closedConversations,
        archived: archivedConversations,
      },
      today: {
        newLeads: todayNewLeads,
        newMessages: todayNewMessages,
      },
    };
  }

  private conversationScope(currentUser: AuthenticatedRequestUser): Prisma.ConversationWhereInput {
    if (isPlatformUser(currentUser)) {
      return {};
    }

    const organizationId = requireCurrentOrganizationId(currentUser);
    if (currentUser.organizationType === OrganizationType.DEVELOPER) {
      return {
        OR: [
          { organizationId },
          { project: { developerId: organizationId } },
          { participants: { some: { organizationId } } },
        ],
      };
    }

    return {
      OR: [
        { participants: { some: { userId: currentUser.userId } } },
        { participants: { some: { organizationId } } },
        { crmLead: { claimedByBrokerUserId: currentUser.userId } },
        { crmLead: { claimedByOrganizationId: organizationId } },
      ],
    };
  }
}

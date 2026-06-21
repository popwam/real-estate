import { Injectable } from '@nestjs/common';
import {
  AgreementStatus,
  BrokerAccessGranteeType,
  ProjectVisibility,
  ProjectSellingMode,
  UnitVisibility,
} from '@prisma/client';
import { isPlatformUser } from '../../common/organization-scope';
import type { AuthenticatedRequestUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../database/prisma.service';

type ProjectForAccess = {
  id: string;
  developerId: string;
  status: string;
  visibility: ProjectVisibility;
  sellingMode: ProjectSellingMode;
};

type UnitForAccess = {
  id: string;
  status: string;
  visibility: UnitVisibility;
  project: ProjectForAccess;
};

@Injectable()
export class MarketplaceAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async canViewProjectForMarketplace(
    currentUser: AuthenticatedRequestUser,
    project: ProjectForAccess,
  ) {
    if (isPlatformUser(currentUser)) {
      return true;
    }

    if (project.status !== 'ACTIVE') {
      return false;
    }

    const visible = await this.canViewVisibility(
      currentUser,
      project.id,
      project.developerId,
      project.visibility,
    );
    return visible && this.canSellProject(currentUser, project);
  }

  async canViewUnitForMarketplace(
    currentUser: AuthenticatedRequestUser,
    unit: UnitForAccess,
  ) {
    if (isPlatformUser(currentUser)) {
      return true;
    }

    if (unit.status !== 'AVAILABLE') {
      return false;
    }

    const canViewProject = await this.canViewProjectForMarketplace(
      currentUser,
      unit.project,
    );

    if (!canViewProject) {
      return false;
    }

    if (unit.visibility === 'INHERIT_PROJECT') {
      return true;
    }

    return this.canViewVisibility(
      currentUser,
      unit.project.id,
      unit.project.developerId,
      unit.visibility,
    );
  }

  private async canViewVisibility(
    currentUser: AuthenticatedRequestUser,
    projectId: string,
    developerId: string,
    visibility: ProjectVisibility | UnitVisibility,
  ) {
    if (visibility === 'HIDDEN' || visibility === 'PRIVATE') {
      return false;
    }

    if (visibility === 'OPEN_MARKETPLACE') {
      return this.isMarketplaceParticipant(currentUser);
    }

    if (visibility === 'APPROVED_BROKERAGES') {
      return this.hasBrokerageProjectAccess(currentUser, projectId, developerId);
    }

    if (visibility === 'SELECTED_BROKERS') {
      return this.hasSelectedBrokerAccess(currentUser, projectId);
    }

    return false;
  }

  private isMarketplaceParticipant(currentUser: AuthenticatedRequestUser) {
    return ['BROKERAGE', 'INDIVIDUAL_BROKER'].includes(
      currentUser.organizationType ?? '',
    );
  }

  private async canSellProject(
    currentUser: AuthenticatedRequestUser,
    project: ProjectForAccess,
  ) {
    if (project.sellingMode === ProjectSellingMode.OWNER_ONLY) return false;
    if (project.sellingMode === ProjectSellingMode.OPEN_BROKERAGE) {
      if (!currentUser.organizationId) return false;
      return Boolean(await this.prisma.organization.findFirst({
        where: {
          id: currentUser.organizationId,
          status: 'APPROVED',
          type: { in: ['BROKERAGE', 'INDIVIDUAL_BROKER'] },
        },
      }));
    }
    return Boolean(await this.prisma.projectBrokerAuthorization.findFirst({
      where: {
        projectId: project.id,
        status: 'ACTIVE',
        OR: [
          { brokerUserId: currentUser.userId },
          ...(currentUser.organizationId
            ? [{ organizationId: currentUser.organizationId }]
            : []),
        ],
      },
    }));
  }

  private async hasBrokerageProjectAccess(
    currentUser: AuthenticatedRequestUser,
    projectId: string,
    developerId: string,
  ) {
    if (currentUser.organizationType !== 'BROKERAGE' || !currentUser.organizationId) {
      return this.hasSelectedBrokerAccess(currentUser, projectId);
    }

    const [accessRule, agreement] = await Promise.all([
      this.prisma.brokerAccessRule.findFirst({
        where: {
          projectId,
          AND: [
            {
              OR: [
                {
                  granteeType: BrokerAccessGranteeType.BROKERAGE,
                  granteeId: currentUser.organizationId,
                },
                {
                  granteeType: BrokerAccessGranteeType.BROKER,
                  granteeId: currentUser.userId,
                },
              ],
            },
            {
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
          ],
        },
      }),
      this.prisma.developerBrokerageAgreement.findFirst({
        where: {
          developerId,
          brokerageId: currentUser.organizationId,
          status: AgreementStatus.ACTIVE,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      }),
    ]);

    return Boolean(accessRule || agreement);
  }

  private async hasSelectedBrokerAccess(
    currentUser: AuthenticatedRequestUser,
    projectId: string,
  ) {
    const accessRule = await this.prisma.brokerAccessRule.findFirst({
      where: {
        projectId,
        granteeType: BrokerAccessGranteeType.BROKER,
        granteeId: currentUser.userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    return Boolean(accessRule);
  }
}

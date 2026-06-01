import type { CurrentUser } from "@/types/auth";
import type { DealRoom } from "@/types/deal-rooms";
import type { InventoryUnit, Project } from "@/types/developer";
import type { LeadClaim, LeadClient, LeadRecord } from "@/types/lead-reservations";
import type { Organization } from "@/types/platform";

export type DealStatus = "PENDING_APPROVAL" | "APPROVED" | "SOLD" | "CANCELLED" | "DISPUTED";
export type CommissionStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAID" | "CANCELLED";
export type CommissionType = "PERCENTAGE" | "FIXED";
export type CommissionPartyType = "DEVELOPER" | "BROKERAGE" | "BROKER" | "PLATFORM";

export type Deal = {
  id: string;
  dealRoomId: string;
  projectId: string;
  unitId: string;
  developerId: string;
  brokerageId?: string | null;
  brokerUserId: string;
  leadId: string;
  leadClaimId: string;
  clientId: string;
  status: DealStatus;
  finalPrice?: string | number | null;
  currency: string;
  createdByUserId: string;
  approvedById?: string | null;
  approvedAt?: string | null;
  soldAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
  dealRoom?: DealRoom | null;
  project?: Project | null;
  unit?: InventoryUnit | null;
  developer?: Organization | null;
  brokerage?: Organization | null;
  broker?: CurrentUser | null;
  lead?: LeadRecord | null;
  leadClaim?: LeadClaim | null;
  client?: LeadClient | null;
  commissionEntries?: CommissionEntry[];
};

export type CommissionRule = {
  id: string;
  developerId: string;
  projectId: string;
  partyType: CommissionPartyType;
  targetOrganizationId?: string | null;
  targetUserId?: string | null;
  commissionType: CommissionType;
  value: string | number;
  currency: string;
  isActive: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  project?: Project | null;
  targetOrganization?: Organization | null;
  targetUser?: CurrentUser | null;
};

export type CommissionEntry = {
  id: string;
  dealId: string;
  commissionRuleId?: string | null;
  projectId: string;
  unitId: string;
  developerId: string;
  brokerageId?: string | null;
  brokerUserId: string;
  partyType: CommissionPartyType;
  recipientOrganizationId?: string | null;
  recipientUserId?: string | null;
  commissionType?: CommissionType | null;
  amount: string | number;
  currency: string;
  status: CommissionStatus;
  rejectionReason?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  deal?: Deal | null;
  commissionRule?: CommissionRule | null;
  project?: Project | null;
  unit?: InventoryUnit | null;
  developer?: Organization | null;
  brokerage?: Organization | null;
  broker?: CurrentUser | null;
  recipientOrganization?: Organization | null;
  recipientUser?: CurrentUser | null;
};

export type CreateDealFromRoomInput = {
  dealRoomId: string;
  finalPrice?: number;
  currency?: string;
};

export type CancelDealInput = {
  reason?: string;
};

export type CommissionRuleInput = {
  projectId: string;
  partyType: CommissionPartyType;
  targetOrganizationId?: string;
  targetUserId?: string;
  commissionType: CommissionType;
  value: number;
  currency?: string;
  isActive?: boolean;
  notes?: string;
};

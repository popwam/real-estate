import type { CurrentUser } from "@/types/auth";
import type { InventoryUnit, Project } from "@/types/developer";

export type LeadClaimStatus = "ACTIVE" | "EXPIRED" | "RELEASED" | "DISPUTED";
export type ReservationRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
export type LeadClaimConflictResolution = "FIRST_WINS" | "ESCALATED" | "MANUAL_REVIEW";

export type LeadClient = {
  id: string;
  name?: string | null;
  phoneLast4?: string | null;
  createdAt?: string;
};

export type LeadRecord = {
  id: string;
  source?: string | null;
  status?: string | null;
  notes?: string | null;
  createdAt?: string;
};

export type LeadClaim = {
  id: string;
  leadId: string;
  clientId: string;
  projectId: string;
  unitId?: string | null;
  brokerUserId: string;
  brokerageId?: string | null;
  status: LeadClaimStatus;
  source?: string | null;
  notes?: string | null;
  expiresAt?: string | null;
  releasedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  client?: LeadClient | null;
  lead?: LeadRecord | null;
  project?: Project | null;
  unit?: InventoryUnit | null;
  broker?: CurrentUser | null;
};

export type LeadClaimConflict = {
  id: string;
  existingClaimId: string;
  attemptedById: string;
  projectId: string;
  resolution?: LeadClaimConflictResolution | null;
  resolvedById?: string | null;
  resolvedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  existingClaim?: LeadClaim | null;
  attemptedBy?: CurrentUser | null;
  project?: Project | null;
  resolvedBy?: CurrentUser | null;
};

export type ReservationRequest = {
  id: string;
  leadId: string;
  leadClaimId: string;
  projectId: string;
  unitId: string;
  developerId: string;
  brokerUserId: string;
  brokerageId?: string | null;
  status: ReservationRequestStatus;
  notes?: string | null;
  rejectionReason?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  lead?: LeadRecord | null;
  leadClaim?: LeadClaim | null;
  project?: Project | null;
  unit?: InventoryUnit | null;
  broker?: CurrentUser | null;
};

export type CreateLeadClaimInput = {
  clientName: string;
  phone: string;
  projectId: string;
  unitId?: string;
  source?: string;
  notes?: string;
};

export type CreateReservationRequestInput = {
  leadClaimId: string;
  unitId?: string;
  notes?: string;
};

export type ResolveLeadClaimConflictInput = {
  resolution: LeadClaimConflictResolution;
  notes?: string;
};

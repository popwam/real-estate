import type { CurrentUser } from "@/types/auth";
import type { InventoryUnit, Project } from "@/types/developer";
import type { Organization } from "@/types/platform";
import type { LeadClaim, LeadClient, LeadRecord, ReservationRequest } from "@/types/lead-reservations";

export type DealRoomStatus =
  | "OPEN"
  | "NEGOTIATION"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "SOLD"
  | "CANCELLED"
  | "DISPUTED";

export type DealRoomParticipantRole =
  | "BROKER"
  | "DEVELOPER_SALES"
  | "SALES_MANAGER"
  | "CLIENT"
  | "PLATFORM_SUPPORT";

export type DealRoomParticipantStatus = "INVITED" | "ACTIVE" | "LEFT" | "REMOVED";
export type DealRoomMessageType = "TEXT" | "SYSTEM" | "DOCUMENT" | "STATUS_UPDATE";

export type DealRoomParticipant = {
  id: string;
  dealRoomId: string;
  userId?: string | null;
  clientId?: string | null;
  organizationId?: string | null;
  role: DealRoomParticipantRole;
  status: DealRoomParticipantStatus;
  invitedAt?: string | null;
  joinedAt?: string | null;
  leftAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: CurrentUser | null;
  client?: LeadClient | null;
  organization?: Organization | null;
};

export type DealRoom = {
  id: string;
  reservationRequestId: string;
  leadClaimId: string;
  leadId: string;
  clientId: string;
  projectId: string;
  unitId: string;
  developerId: string;
  brokerageId?: string | null;
  brokerUserId: string;
  createdByUserId: string;
  status: DealRoomStatus;
  clientInviteToken?: string | null;
  clientInvitedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  reservationRequest?: ReservationRequest | null;
  leadClaim?: LeadClaim | null;
  lead?: LeadRecord | null;
  client?: LeadClient | null;
  project?: Project | null;
  unit?: InventoryUnit | null;
  developer?: Organization | null;
  brokerage?: Organization | null;
  broker?: CurrentUser | null;
  createdBy?: CurrentUser | null;
  participants?: DealRoomParticipant[];
  _count?: { messages?: number };
};

export type DealRoomMessage = {
  id: string;
  dealRoomId: string;
  senderUserId?: string | null;
  senderClientId?: string | null;
  messageType: DealRoomMessageType;
  body: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  senderUser?: CurrentUser | null;
  senderClient?: LeadClient | null;
};

export type AddDealRoomParticipantInput = {
  userId?: string;
  clientId?: string;
  organizationId?: string;
  role: DealRoomParticipantRole;
  status?: DealRoomParticipantStatus;
};

export type CreateDealRoomMessageInput = {
  messageType?: DealRoomMessageType;
  body: string;
  metadata?: Record<string, unknown>;
};

export type ClientInviteResponse = {
  participant: DealRoomParticipant;
  invite: {
    token: string;
    delivery: "placeholder" | string;
  };
};

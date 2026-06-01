import type { Organization } from "@/types/platform";

export type CrmLeadStatus =
  | "NEW"
  | "CLAIMED"
  | "IN_CONVERSATION"
  | "QUALIFIED"
  | "LOST"
  | "CONVERTED"
  | "SPAM";

export type PreferredContactMethod = "CALL" | "CHAT" | "WHATSAPP";
export type ConversationType = "PUBLIC_LEAD" | "DEAL_ROOM" | "SUPPORT";
export type ConversationStatus = "OPEN" | "CLOSED" | "ARCHIVED";
export type ConversationParticipantRole = "CLIENT" | "BROKER" | "DEVELOPER" | "PLATFORM" | "SYSTEM";
export type ConversationMessageType = "TEXT" | "SYSTEM" | "CONTACT_REQUEST" | "STATUS_UPDATE";
export type CrmActivityType =
  | "LEAD_CREATED"
  | "LEAD_CONVERTED"
  | "LEAD_CLAIMED"
  | "LEAD_STATUS_CHANGED"
  | "CONVERSATION_CREATED"
  | "CONVERSATION_STATUS_CHANGED"
  | "MESSAGE_SENT"
  | "PUBLIC_MESSAGE_SENT"
  | "NOTE_ADDED"
  | "LEAD_STAGE_CHANGED"
  | "TASK_CREATED"
  | "TASK_COMPLETED";

export type CrmClient = {
  id: string;
  name?: string | null;
  phone?: string | null;
  phoneLast4?: string | null;
  email?: string | null;
  normalizedEmail?: string | null;
  source?: string | null;
  masked?: boolean;
};

export type CrmProjectSummary = {
  id: string;
  name: string;
  slug: string;
  developerId?: string | null;
  status?: string | null;
  visibility?: string | null;
};

export type CrmUserSummary = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
};

export type CrmLead = {
  id: string;
  organizationId?: string | null;
  projectId?: string | null;
  unitId?: string | null;
  publicLeadId?: string | null;
  clientId?: string | null;
  status: CrmLeadStatus;
  statusNote?: string | null;
  pipelineStageId?: string | null;
  pipelineStage?: {
    id: string;
    name: string;
    key: string;
    order: number;
    color?: string | null;
  } | null;
  preferredContactMethod?: PreferredContactMethod | null;
  claimedByBrokerUserId?: string | null;
  claimedByOrganizationId?: string | null;
  claimedAt?: string | null;
  sourcePage?: string | null;
  utm?: Record<string, unknown> | null;
  unavailable?: boolean;
  createdAt: string;
  updatedAt: string;
  organization?: Organization | null;
  project?: CrmProjectSummary | null;
  client?: CrmClient | null;
  publicLead?: { id: string; status: string } | null;
  claimedByBroker?: CrmUserSummary | null;
  claimedByOrganization?: Organization | null;
};

export type CrmPipelineStage = {
  id: string;
  organizationId?: string | null;
  name: string;
  key: string;
  order: number;
  color?: string | null;
  isDefault?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CrmLeadStageHistory = {
  id: string;
  crmLeadId: string;
  fromStageId?: string | null;
  toStageId: string;
  note?: string | null;
  createdAt: string;
  fromStage?: CrmPipelineStage | null;
  toStage?: CrmPipelineStage | null;
};

export type CrmNote = {
  id: string;
  organizationId?: string | null;
  crmLeadId?: string | null;
  conversationId?: string | null;
  body: string;
  visibility: "INTERNAL";
  createdAt: string;
  updatedAt: string;
  author?: CrmUserSummary | null;
};

export type CrmFollowUpTask = {
  id: string;
  organizationId?: string | null;
  crmLeadId?: string | null;
  assignedToUserId?: string | null;
  title: string;
  dueAt?: string | null;
  status: "OPEN" | "DONE" | "CANCELLED";
  priority: "LOW" | "NORMAL" | "HIGH";
  createdAt: string;
  updatedAt: string;
  crmLead?: Pick<CrmLead, "id" | "status" | "client" | "project"> | null;
};

export type ConversationParticipant = {
  id: string;
  publicRole: ConversationParticipantRole;
  displayName?: string | null;
  joinedAt?: string | null;
  lastReadAt?: string | null;
};

export type ConversationMessage = {
  id: string;
  conversationId?: string | null;
  type: ConversationMessageType;
  body: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  sender?: {
    id?: string | null;
    publicRole?: ConversationParticipantRole | null;
    displayName?: string | null;
  } | null;
};

export type Conversation = {
  id: string;
  organizationId?: string | null;
  projectId?: string | null;
  unitId?: string | null;
  crmLeadId?: string | null;
  type: ConversationType;
  status: ConversationStatus;
  statusNote?: string | null;
  shareToken?: string | null;
  createdAt: string;
  updatedAt: string;
  organization?: Organization | null;
  project?: CrmProjectSummary | null;
  crmLead?: Pick<CrmLead, "id" | "status" | "preferredContactMethod" | "client"> | null;
  participants?: ConversationParticipant[];
  recentMessages?: ConversationMessage[];
};

export type CrmActivity = {
  id: string;
  organizationId?: string | null;
  crmLeadId?: string | null;
  conversationId?: string | null;
  type: CrmActivityType;
  title: string;
  body?: string | null;
  actorRole?: string | null;
  publicActorName?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  crmLead?: Pick<CrmLead, "id" | "status" | "preferredContactMethod" | "client" | "project"> | null;
  conversation?: Pick<Conversation, "id" | "type" | "status" | "shareToken"> | null;
  actorUser?: { id?: string | null; name?: string | null } | null;
  actorOrganization?: Organization | null;
};

export type CreateConversationMessageInput = {
  body: string;
  type?: ConversationMessageType;
  metadata?: Record<string, unknown>;
};

export type CreateConversationFromCrmLeadInput = {
  openingMessage?: string;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  items: T[];
  pagination: PaginationMeta;
};

export type CrmLeadListQuery = {
  status?: CrmLeadStatus | "";
  preferredContactMethod?: PreferredContactMethod | "";
  search?: string;
  claimedOnly?: boolean;
  unclaimedOnly?: boolean;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

export type ConversationListQuery = {
  status?: ConversationStatus | "";
  type?: ConversationType | "";
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

export type CrmActivityListQuery = {
  crmLeadId?: string;
  conversationId?: string;
  type?: CrmActivityType | "";
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

export type CrmSummary = {
  leads: {
    total: number;
    new: number;
    claimed: number;
    qualified: number;
    lost?: number;
    converted: number;
    spam: number;
  };
  conversations: {
    open: number;
    closed?: number;
    archived?: number;
  };
  today: {
    newLeads: number;
    newMessages: number;
  };
};

export type UpdateCrmLeadStatusInput = {
  status: CrmLeadStatus;
  statusNote?: string;
};

export type UpdateConversationStatusInput = {
  status: ConversationStatus;
  statusNote?: string;
};

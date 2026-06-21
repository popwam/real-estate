-- Stage 8 is additive. It assumes the Stage 4 schema already exists.
CREATE TYPE "ProjectSellingMode" AS ENUM ('OWNER_ONLY', 'AUTHORIZED_BROKERS', 'OPEN_BROKERAGE');
CREATE TYPE "ProjectBrokerAuthorizationStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'REVOKED');
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');
CREATE TYPE "LeadAssignmentType" AS ENUM ('COMPANY', 'BROKER', 'BROKERAGE');
CREATE TYPE "VisitorAttributionType" AS ENUM ('UNKNOWN', 'COMPANY', 'BROKER', 'BROKERAGE');
CREATE TYPE "PublicVisitorEventType" AS ENUM ('PAGE_VIEW', 'PROJECT_VIEW', 'SEARCH', 'FILTER_CHANGE', 'SECTION_REACHED', 'SCROLL_DEPTH', 'TIME_ON_PAGE', 'LEAD_SUBMITTED', 'START_CHAT_CLICKED', 'REQUEST_CALL_CLICKED');

ALTER TABLE "projects" ADD COLUMN "sellingMode" "ProjectSellingMode" NOT NULL DEFAULT 'OWNER_ONLY';

CREATE TABLE "organization_invitations" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "intendedRole" "UserRole" NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "createdByUserId" TEXT NOT NULL,
  "acceptedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "organization_invitations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "organization_invitations_tokenHash_key" ON "organization_invitations"("tokenHash");
CREATE INDEX "organization_invitations_organizationId_status_idx" ON "organization_invitations"("organizationId", "status");
CREATE INDEX "organization_invitations_email_status_idx" ON "organization_invitations"("email", "status");
CREATE INDEX "organization_invitations_expiresAt_status_idx" ON "organization_invitations"("expiresAt", "status");

CREATE TABLE "project_broker_authorizations" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "organizationId" TEXT,
  "brokerUserId" TEXT,
  "status" "ProjectBrokerAuthorizationStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "project_broker_authorizations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "project_broker_authorizations_one_grantee" CHECK (("organizationId" IS NOT NULL) <> ("brokerUserId" IS NOT NULL))
);
CREATE UNIQUE INDEX "project_broker_authorizations_projectId_organizationId_key" ON "project_broker_authorizations"("projectId", "organizationId");
CREATE UNIQUE INDEX "project_broker_authorizations_projectId_brokerUserId_key" ON "project_broker_authorizations"("projectId", "brokerUserId");
CREATE INDEX "project_broker_authorizations_projectId_status_idx" ON "project_broker_authorizations"("projectId", "status");
CREATE INDEX "project_broker_authorizations_organizationId_status_idx" ON "project_broker_authorizations"("organizationId", "status");
CREATE INDEX "project_broker_authorizations_brokerUserId_status_idx" ON "project_broker_authorizations"("brokerUserId", "status");

CREATE TABLE "public_visitors" (
  "id" TEXT NOT NULL,
  "anonymousKeyHash" TEXT NOT NULL,
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userAgentHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "public_visitors_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "public_visitors_anonymousKeyHash_key" ON "public_visitors"("anonymousKeyHash");
CREATE INDEX "public_visitors_lastSeenAt_idx" ON "public_visitors"("lastSeenAt");

CREATE TABLE "public_visitor_sessions" (
  "id" TEXT NOT NULL,
  "visitorId" TEXT NOT NULL,
  "clientSessionKeyHash" TEXT NOT NULL,
  "projectId" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "firstTouchSource" JSONB,
  "lastTouchSource" JSONB,
  "firstTouchType" "VisitorAttributionType" NOT NULL DEFAULT 'UNKNOWN',
  "firstTouchOrganizationId" TEXT,
  "firstTouchBrokerUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "public_visitor_sessions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "public_visitor_sessions_clientSessionKeyHash_key" ON "public_visitor_sessions"("clientSessionKeyHash");
CREATE INDEX "public_visitor_sessions_visitorId_lastSeenAt_idx" ON "public_visitor_sessions"("visitorId", "lastSeenAt");
CREATE INDEX "public_visitor_sessions_projectId_firstTouchType_idx" ON "public_visitor_sessions"("projectId", "firstTouchType");

CREATE TABLE "public_visitor_events" (
  "id" TEXT NOT NULL,
  "visitorId" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "eventType" "PublicVisitorEventType" NOT NULL,
  "projectId" TEXT,
  "path" TEXT NOT NULL,
  "searchQuery" TEXT,
  "filters" JSONB,
  "durationMs" INTEGER,
  "scrollDepth" INTEGER,
  "sectionId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "public_visitor_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "public_visitor_events_scrollDepth_check" CHECK ("scrollDepth" IS NULL OR "scrollDepth" BETWEEN 0 AND 100),
  CONSTRAINT "public_visitor_events_durationMs_check" CHECK ("durationMs" IS NULL OR "durationMs" BETWEEN 0 AND 1800000)
);
CREATE INDEX "public_visitor_events_visitorId_createdAt_idx" ON "public_visitor_events"("visitorId", "createdAt");
CREATE INDEX "public_visitor_events_sessionId_createdAt_idx" ON "public_visitor_events"("sessionId", "createdAt");
CREATE INDEX "public_visitor_events_projectId_eventType_createdAt_idx" ON "public_visitor_events"("projectId", "eventType", "createdAt");

ALTER TABLE "public_leads"
  ADD COLUMN "visitorId" TEXT,
  ADD COLUMN "visitorSessionId" TEXT,
  ADD COLUMN "assignmentType" "LeadAssignmentType" NOT NULL DEFAULT 'COMPANY',
  ADD COLUMN "assignmentReason" TEXT,
  ADD COLUMN "assignedOrganizationId" TEXT,
  ADD COLUMN "assignedBrokerUserId" TEXT,
  ADD COLUMN "firstTouchAttribution" JSONB,
  ADD COLUMN "lastTouchAttribution" JSONB;
ALTER TABLE "crm_leads"
  ADD COLUMN "assignmentType" "LeadAssignmentType",
  ADD COLUMN "assignmentReason" TEXT;

CREATE INDEX "public_leads_visitorId_createdAt_idx" ON "public_leads"("visitorId", "createdAt");
CREATE INDEX "public_leads_visitorSessionId_createdAt_idx" ON "public_leads"("visitorSessionId", "createdAt");
CREATE INDEX "public_leads_assignedOrganizationId_status_idx" ON "public_leads"("assignedOrganizationId", "status");
CREATE INDEX "public_leads_assignedBrokerUserId_status_idx" ON "public_leads"("assignedBrokerUserId", "status");

ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_acceptedByUserId_fkey" FOREIGN KEY ("acceptedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "project_broker_authorizations" ADD CONSTRAINT "project_broker_authorizations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_broker_authorizations" ADD CONSTRAINT "project_broker_authorizations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_broker_authorizations" ADD CONSTRAINT "project_broker_authorizations_brokerUserId_fkey" FOREIGN KEY ("brokerUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_broker_authorizations" ADD CONSTRAINT "project_broker_authorizations_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public_visitor_sessions" ADD CONSTRAINT "public_visitor_sessions_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "public_visitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public_visitor_sessions" ADD CONSTRAINT "public_visitor_sessions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public_visitor_sessions" ADD CONSTRAINT "public_visitor_sessions_firstTouchOrganizationId_fkey" FOREIGN KEY ("firstTouchOrganizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public_visitor_sessions" ADD CONSTRAINT "public_visitor_sessions_firstTouchBrokerUserId_fkey" FOREIGN KEY ("firstTouchBrokerUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public_visitor_events" ADD CONSTRAINT "public_visitor_events_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "public_visitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public_visitor_events" ADD CONSTRAINT "public_visitor_events_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public_visitor_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public_visitor_events" ADD CONSTRAINT "public_visitor_events_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public_leads" ADD CONSTRAINT "public_leads_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "public_visitors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public_leads" ADD CONSTRAINT "public_leads_visitorSessionId_fkey" FOREIGN KEY ("visitorSessionId") REFERENCES "public_visitor_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public_leads" ADD CONSTRAINT "public_leads_assignedOrganizationId_fkey" FOREIGN KEY ("assignedOrganizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public_leads" ADD CONSTRAINT "public_leads_assignedBrokerUserId_fkey" FOREIGN KEY ("assignedBrokerUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

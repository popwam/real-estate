const { NOTIFICATION_EVENT_NAMES } = require('../../../_shared/events');

function baseEnvelope(eventName, data = {}) {
  return {
    eventName,
    organizationId: 'org_sample_123',
    actorUserId: 'user_platform_admin_123',
    entityType: data.entityType || 'OrganizationVerification',
    entityId: data.entityId || 'entity_sample_123',
    occurredAt: new Date().toISOString(),
    data: {
      recipientEmail: 'owner@example.test',
      recipientUserId: 'user_owner_123',
      recipientPhone: '+10000000000',
      organizationName: 'Sample Development Co',
      ...data,
    },
  };
}

const SAMPLE_EVENTS = {
  'organization-submitted': () =>
    baseEnvelope(NOTIFICATION_EVENT_NAMES.ORGANIZATION_SUBMITTED_FOR_VERIFICATION, {
      documentTypes: ['COMMERCIAL_REG', 'TAX_CARD'],
      documentCount: 2,
    }),
  'organization-approved': () =>
    baseEnvelope(NOTIFICATION_EVENT_NAMES.ORGANIZATION_VERIFICATION_APPROVED, {
      verificationId: 'ver_sample_approved',
    }),
  'organization-rejected': () =>
    baseEnvelope(NOTIFICATION_EVENT_NAMES.ORGANIZATION_VERIFICATION_REJECTED, {
      verificationId: 'ver_sample_rejected',
      reason: 'Commercial registration document is expired.',
    }),
  'more-requested': () =>
    baseEnvelope(NOTIFICATION_EVENT_NAMES.ORGANIZATION_VERIFICATION_MORE_REQUESTED, {
      verificationId: 'ver_sample_more',
      reason: 'Please upload a clearer brokerage license scan.',
    }),
  'organization-suspended': () =>
    baseEnvelope(NOTIFICATION_EVENT_NAMES.ORGANIZATION_SUSPENDED, {
      reason: 'Compliance review required.',
    }),
  'organization-reactivated': () =>
    baseEnvelope(NOTIFICATION_EVENT_NAMES.ORGANIZATION_REACTIVATED, {
      reason: 'Compliance review completed.',
    }),
  'user-created': () =>
    baseEnvelope(NOTIFICATION_EVENT_NAMES.USER_CREATED, {
      entityType: 'User',
      entityId: 'user_new_member_123',
      userId: 'user_new_member_123',
      role: 'developer_admin',
      invitePlaceholder: true,
    }),
  'user-deactivated': () =>
    baseEnvelope(NOTIFICATION_EVENT_NAMES.USER_DEACTIVATED, {
      entityType: 'User',
      entityId: 'user_disabled_123',
      userId: 'user_disabled_123',
    }),
  'file-metadata-created': () =>
    baseEnvelope(NOTIFICATION_EVENT_NAMES.FILE_METADATA_CREATED, {
      entityType: 'UploadedFile',
      entityId: 'file_sample_123',
      uploadedFileId: 'file_sample_123',
      objectKey: 'organizations/org_sample_123/commercial-reg.pdf',
    }),
  'lead-claim-created': () =>
    baseEnvelope(NOTIFICATION_EVENT_NAMES.LEAD_CLAIM_CREATED, {
      entityType: 'LeadClaim',
      entityId: 'claim_sample_123',
      actorUserId: 'broker_sample_123',
      leadClaimId: 'claim_sample_123',
      projectId: 'project_sample_123',
      projectName: 'Sample Towers',
      unitId: 'unit_sample_901',
      unitLabel: 'Unit 901',
      recipientEmail: 'broker@example.test',
      recipientUserId: 'broker_sample_123',
    }),
  'lead-claim-conflict-created': () =>
    baseEnvelope(NOTIFICATION_EVENT_NAMES.LEAD_CLAIM_CONFLICT_CREATED, {
      entityType: 'LeadClaimConflict',
      entityId: 'conflict_sample_123',
      actorUserId: 'broker_sample_456',
      conflictId: 'conflict_sample_123',
      projectId: 'project_sample_123',
      projectName: 'Sample Towers',
      recipientEmail: 'broker@example.test',
      recipientUserId: 'broker_sample_456',
    }),
  'reservation-created': () =>
    baseEnvelope(NOTIFICATION_EVENT_NAMES.RESERVATION_REQUEST_CREATED, {
      entityType: 'ReservationRequest',
      entityId: 'reservation_sample_123',
      actorUserId: 'broker_sample_123',
      reservationRequestId: 'reservation_sample_123',
      leadClaimId: 'claim_sample_123',
      projectId: 'project_sample_123',
      projectName: 'Sample Towers',
      unitId: 'unit_sample_901',
      unitLabel: 'Unit 901',
      recipientEmail: 'developer@example.test',
      recipientUserId: 'developer_manager_123',
    }),
  'reservation-approved': () =>
    baseEnvelope(NOTIFICATION_EVENT_NAMES.RESERVATION_REQUEST_APPROVED, {
      entityType: 'ReservationRequest',
      entityId: 'reservation_sample_123',
      reservationRequestId: 'reservation_sample_123',
      projectId: 'project_sample_123',
      projectName: 'Sample Towers',
      unitId: 'unit_sample_901',
      unitLabel: 'Unit 901',
      recipientEmail: 'broker@example.test',
      recipientUserId: 'broker_sample_123',
    }),
  'reservation-rejected': () =>
    baseEnvelope(NOTIFICATION_EVENT_NAMES.RESERVATION_REQUEST_REJECTED, {
      entityType: 'ReservationRequest',
      entityId: 'reservation_sample_123',
      reservationRequestId: 'reservation_sample_123',
      reason: 'Requested hold period is unavailable.',
      recipientEmail: 'broker@example.test',
      recipientUserId: 'broker_sample_123',
    }),
  'reservation-cancelled': () =>
    baseEnvelope(NOTIFICATION_EVENT_NAMES.RESERVATION_REQUEST_CANCELLED, {
      entityType: 'ReservationRequest',
      entityId: 'reservation_sample_123',
      actorUserId: 'broker_sample_123',
      reservationRequestId: 'reservation_sample_123',
      recipientEmail: 'developer@example.test',
      recipientUserId: 'developer_manager_123',
    }),
  'unit-held-for-reservation': () =>
    baseEnvelope(NOTIFICATION_EVENT_NAMES.UNIT_HELD_FOR_RESERVATION, {
      entityType: 'UnitAvailability',
      entityId: 'availability_sample_123',
      reservationRequestId: 'reservation_sample_123',
      unitId: 'unit_sample_901',
      unitLabel: 'Unit 901',
      availabilityId: 'availability_sample_123',
      recipientEmail: 'broker@example.test',
      recipientUserId: 'broker_sample_123',
    }),
  'deal-room-created': () =>
    baseEnvelope(NOTIFICATION_EVENT_NAMES.DEAL_ROOM_CREATED, {
      entityType: 'DealRoom',
      entityId: 'deal_room_sample_123',
      dealRoomId: 'deal_room_sample_123',
      dealRoomName: 'Sample Towers Unit 901',
      reservationRequestId: 'reservation_sample_123',
      projectId: 'project_sample_123',
      unitId: 'unit_sample_901',
      recipientEmail: 'broker@example.test',
      recipientUserId: 'broker_sample_123',
    }),
  'deal-room-participant-added': () =>
    baseEnvelope(NOTIFICATION_EVENT_NAMES.DEAL_ROOM_PARTICIPANT_ADDED, {
      entityType: 'DealRoomParticipant',
      entityId: 'participant_sample_123',
      dealRoomId: 'deal_room_sample_123',
      dealRoomName: 'Sample Towers Unit 901',
      participantId: 'participant_sample_123',
      role: 'developer_sales_manager',
      recipientEmail: 'developer@example.test',
      recipientUserId: 'developer_manager_123',
    }),
  'deal-room-client-invited': () =>
    baseEnvelope(NOTIFICATION_EVENT_NAMES.DEAL_ROOM_CLIENT_INVITED, {
      entityType: 'DealRoomParticipant',
      entityId: 'client_participant_sample_123',
      dealRoomId: 'deal_room_sample_123',
      dealRoomName: 'Sample Towers Unit 901',
      participantId: 'client_participant_sample_123',
      inviteUrl: 'https://app.popwam.test/invites/sample-token',
      recipientEmail: 'client@example.test',
      recipientUserId: 'client_placeholder_123',
      recipientPhone: '+10000000001',
    }),
  'deal-room-status-changed': () =>
    baseEnvelope(NOTIFICATION_EVENT_NAMES.DEAL_ROOM_STATUS_CHANGED, {
      entityType: 'DealRoom',
      entityId: 'deal_room_sample_123',
      dealRoomId: 'deal_room_sample_123',
      dealRoomName: 'Sample Towers Unit 901',
      previousStatus: 'PENDING_APPROVAL',
      status: 'APPROVED',
      recipientEmail: 'broker@example.test',
      recipientUserId: 'broker_sample_123',
    }),
  'deal-room-message-created': () =>
    baseEnvelope(NOTIFICATION_EVENT_NAMES.DEAL_ROOM_MESSAGE_CREATED, {
      entityType: 'DealRoomMessage',
      entityId: 'message_sample_123',
      dealRoomId: 'deal_room_sample_123',
      dealRoomName: 'Sample Towers Unit 901',
      messageId: 'message_sample_123',
      messageType: 'comment',
      recipientEmail: 'broker@example.test',
      recipientUserId: 'broker_sample_123',
    }),
  'deal-created': () =>
    baseEnvelope(NOTIFICATION_EVENT_NAMES.DEAL_CREATED, {
      entityType: 'Deal',
      entityId: 'deal_sample_123',
      dealId: 'deal_sample_123',
      dealName: 'Sample Towers Unit 901 deal',
      projectId: 'project_sample_123',
      projectName: 'Sample Towers',
      unitId: 'unit_sample_901',
      unitLabel: 'Unit 901',
      recipientEmail: 'developer@example.test',
      recipientUserId: 'developer_manager_123',
    }),
  'deal-approved': () =>
    baseEnvelope(NOTIFICATION_EVENT_NAMES.DEAL_APPROVED, {
      entityType: 'Deal',
      entityId: 'deal_sample_123',
      dealId: 'deal_sample_123',
      dealName: 'Sample Towers Unit 901 deal',
      recipientEmail: 'broker@example.test',
      recipientUserId: 'broker_sample_123',
    }),
  'deal-cancelled': () =>
    baseEnvelope(NOTIFICATION_EVENT_NAMES.DEAL_CANCELLED, {
      entityType: 'Deal',
      entityId: 'deal_sample_123',
      dealId: 'deal_sample_123',
      dealName: 'Sample Towers Unit 901 deal',
      reason: 'The deal was cancelled by an authorized workflow.',
      recipientEmail: 'broker@example.test',
      recipientUserId: 'broker_sample_123',
    }),
  'deal-marked-sold': () =>
    baseEnvelope(NOTIFICATION_EVENT_NAMES.DEAL_MARKED_SOLD, {
      entityType: 'Deal',
      entityId: 'deal_sample_123',
      dealId: 'deal_sample_123',
      dealName: 'Sample Towers Unit 901 deal',
      unitId: 'unit_sample_901',
      unitLabel: 'Unit 901',
      recipientEmail: 'developer@example.test',
      recipientUserId: 'developer_manager_123',
    }),
  'commission-created': () =>
    baseEnvelope(NOTIFICATION_EVENT_NAMES.COMMISSION_CREATED, {
      entityType: 'Commission',
      entityId: 'commission_sample_123',
      commissionId: 'commission_sample_123',
      commissionReference: 'Commission record CR-123',
      dealId: 'deal_sample_123',
      recipientEmail: 'brokerage@example.test',
      recipientUserId: 'brokerage_owner_123',
    }),
  'commission-approved': () =>
    baseEnvelope(NOTIFICATION_EVENT_NAMES.COMMISSION_APPROVED, {
      entityType: 'Commission',
      entityId: 'commission_sample_123',
      commissionId: 'commission_sample_123',
      commissionReference: 'Commission record CR-123',
      recipientEmail: 'brokerage@example.test',
      recipientUserId: 'brokerage_owner_123',
    }),
  'commission-rejected': () =>
    baseEnvelope(NOTIFICATION_EVENT_NAMES.COMMISSION_REJECTED, {
      entityType: 'Commission',
      entityId: 'commission_sample_123',
      commissionId: 'commission_sample_123',
      commissionReference: 'Commission record CR-123',
      reason: 'The commission requires review in POPWAM.',
      recipientEmail: 'brokerage@example.test',
      recipientUserId: 'brokerage_owner_123',
    }),
  'inventory-marked-sold': () =>
    baseEnvelope(NOTIFICATION_EVENT_NAMES.INVENTORY_MARKED_SOLD, {
      entityType: 'InventoryUnit',
      entityId: 'unit_sample_901',
      projectId: 'project_sample_123',
      projectName: 'Sample Towers',
      unitId: 'unit_sample_901',
      unitLabel: 'Unit 901',
      recipientEmail: 'developer@example.test',
      recipientUserId: 'developer_manager_123',
    }),
};

function getSampleEvent(name) {
  const factory = SAMPLE_EVENTS[name];
  return factory ? factory() : null;
}

module.exports = {
  SAMPLE_EVENTS,
  getSampleEvent,
};

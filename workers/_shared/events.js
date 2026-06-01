const NOTIFICATION_EVENT_NAMES = {
  ORGANIZATION_SUBMITTED_FOR_VERIFICATION:
    'organization.submitted_for_verification',
  ORGANIZATION_VERIFICATION_APPROVED: 'organization.verification_approved',
  ORGANIZATION_VERIFICATION_REJECTED: 'organization.verification_rejected',
  ORGANIZATION_VERIFICATION_MORE_REQUESTED:
    'organization.verification_more_requested',
  ORGANIZATION_SUSPENDED: 'organization.suspended',
  ORGANIZATION_REACTIVATED: 'organization.reactivated',
  USER_CREATED: 'user.created',
  USER_DEACTIVATED: 'user.deactivated',
  FILE_METADATA_CREATED: 'file.metadata_created',
  LEAD_CLAIM_CREATED: 'lead_claim.created',
  LEAD_CLAIM_DUPLICATE_DETECTED: 'lead_claim.duplicate_detected',
  LEAD_CLAIM_CONFLICT_CREATED: 'lead_claim.conflict_created',
  LEAD_CLAIM_RELEASED: 'lead_claim.released',
  RESERVATION_REQUEST_CREATED: 'reservation_request.created',
  RESERVATION_REQUEST_APPROVED: 'reservation_request.approved',
  RESERVATION_REQUEST_REJECTED: 'reservation_request.rejected',
  RESERVATION_REQUEST_CANCELLED: 'reservation_request.cancelled',
  UNIT_HELD_FOR_RESERVATION: 'unit.held_for_reservation',
  DEAL_ROOM_CREATED: 'deal_room.created',
  DEAL_ROOM_PARTICIPANT_ADDED: 'deal_room.participant_added',
  DEAL_ROOM_CLIENT_INVITED: 'deal_room.client_invited',
  DEAL_ROOM_STATUS_CHANGED: 'deal_room.status_changed',
  DEAL_ROOM_MESSAGE_CREATED: 'deal_room.message_created',
  DEAL_CREATED: 'deal.created',
  DEAL_APPROVED: 'deal.approved',
  DEAL_CANCELLED: 'deal.cancelled',
  DEAL_MARKED_SOLD: 'deal.marked_sold',
  COMMISSION_CREATED: 'commission.created',
  COMMISSION_APPROVED: 'commission.approved',
  COMMISSION_REJECTED: 'commission.rejected',
  INVENTORY_MARKED_SOLD: 'inventory.marked_sold',
};

module.exports = {
  NOTIFICATION_EVENT_NAMES,
};

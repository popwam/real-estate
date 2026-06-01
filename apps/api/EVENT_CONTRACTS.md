# POPWAM Event Contracts - Team 1 Backend Core

These are stable event names for notification and worker planning. In Team 1, these are emitted as audit actions and documented as notification placeholders. A future worker can consume either `AuditLog` rows or `NotificationEvent` rows once Team 6 finalizes delivery infrastructure.

## Event Envelope

Recommended envelope for future `NotificationEvent.payload`:

```json
{
  "eventName": "organization.verification_approved",
  "organizationId": "org_cuid",
  "actorUserId": "user_cuid",
  "entityType": "OrganizationVerification",
  "entityId": "verification_cuid",
  "occurredAt": "2026-05-22T07:15:23.000Z",
  "data": {}
}
```

## Stable Events

| Event name | Payload shape | Intended consumer | When emitted |
|---|---|---|---|
| `organization.submitted_for_verification` | `organizationId`, `actorUserId`, `documentTypes`, `documentCount` | notification-worker | Owner/admin submits verification documents. |
| `organization.verification_approved` | `organizationId`, `actorUserId`, `verificationId?` | notification-worker | Platform approves verification item or organization. |
| `organization.verification_rejected` | `organizationId`, `actorUserId`, `verificationId?`, `reason` | notification-worker | Platform rejects verification item or organization. |
| `organization.verification_more_requested` | `organizationId`, `actorUserId`, `verificationId`, `reason` | notification-worker | Platform requests more documents or information. |
| `organization.suspended` | `organizationId`, `actorUserId`, `reason` | notification-worker | Platform suspends an organization. |
| `organization.reactivated` | `organizationId`, `actorUserId`, `reason?` | notification-worker | Platform reactivates an organization. |
| `user.created` | `organizationId`, `actorUserId`, `userId`, `role`, `invitePlaceholder` | notification-worker | User is created or invite placeholder is recorded. |
| `user.deactivated` | `organizationId`, `actorUserId`, `userId` | notification-worker | User is deactivated. |
| `file.metadata_created` | `organizationId`, `actorUserId`, `uploadedFileId`, `objectKey` | notification-worker | File metadata is created. |
| `lead_claim.created` | `organizationId`, `actorUserId`, `leadClaimId`, `projectId`, `unitId?` | notification-worker | Broker creates a new active lead claim. |
| `lead_claim.duplicate_detected` | `organizationId`, `actorUserId`, `leadClaimId`, `projectId`, `sameBroker` | notification-worker | Lead claim request matches an existing active claim. |
| `lead_claim.conflict_created` | `organizationId`, `actorUserId`, `conflictId`, `projectId` | notification-worker | Duplicate lead claim attempt by another broker is blocked. |
| `lead_claim.released` | `organizationId`, `actorUserId`, `leadClaimId`, `projectId` | notification-worker | Broker or platform releases a lead claim. |
| `reservation_request.created` | `organizationId`, `actorUserId`, `reservationRequestId`, `projectId`, `unitId`, `leadClaimId` | notification-worker | Broker creates a reservation request from an active claim. |
| `reservation_request.approved` | `organizationId`, `actorUserId`, `reservationRequestId`, `projectId`, `unitId` | notification-worker | Developer approves a pending reservation request. |
| `reservation_request.rejected` | `organizationId`, `actorUserId`, `reservationRequestId`, `reason` | notification-worker | Developer rejects a pending reservation request. |
| `reservation_request.cancelled` | `organizationId`, `actorUserId`, `reservationRequestId` | notification-worker | Broker cancels a pending reservation request. |
| `unit.held_for_reservation` | `organizationId`, `actorUserId`, `reservationRequestId`, `unitId`, `availabilityId` | notification-worker | Reservation approval places a hold on a unit. |
| `deal_room.created` | `organizationId`, `actorUserId`, `dealRoomId`, `reservationRequestId`, `projectId`, `unitId` | notification-worker | Deal room is created from an approved reservation request. |
| `deal_room.participant_added` | `organizationId`, `actorUserId`, `dealRoomId`, `participantId`, `role` | notification-worker | Participant is added to a deal room. |
| `deal_room.client_invited` | `organizationId`, `actorUserId`, `dealRoomId`, `participantId` | notification-worker | Client invite placeholder is created for a deal room. |
| `deal_room.status_changed` | `organizationId`, `actorUserId`, `dealRoomId`, `previousStatus`, `status` | notification-worker | Deal room status transition is recorded. |
| `deal_room.message_created` | `organizationId`, `actorUserId`, `dealRoomId`, `messageId`, `messageType` | notification-worker | Placeholder deal room message is created. |
| `deal.created` | `organizationId`, `actorUserId`, `dealId`, `dealRoomId` | notification-worker | Deal record is created from a deal room. |
| `deal.approved` | `organizationId`, `actorUserId`, `dealId`, `dealRoomId` | notification-worker | Developer approves a pending deal. |
| `deal.cancelled` | `organizationId`, `actorUserId`, `dealId`, `reason?` | notification-worker | Developer cancels a non-sold deal. |
| `deal.marked_sold` | `organizationId`, `actorUserId`, `dealId`, `unitId`, `finalPrice?` | notification-worker | Deal finalization marks the deal, deal room, and inventory unit sold. |
| `commission.created` | `organizationId`, `actorUserId`, `commissionEntryId`, `dealId`, `amount`, `partyType` | notification-worker | Pending commission entry is created for a sold deal. |
| `commission.approved` | `organizationId`, `actorUserId`, `commissionEntryId`, `dealId`, `amount` | notification-worker | Developer approves a pending commission entry. |
| `commission.rejected` | `organizationId`, `actorUserId`, `commissionEntryId`, `dealId`, `reason` | notification-worker | Developer rejects a pending commission entry. |
| `inventory.marked_sold` | `organizationId`, `actorUserId`, `unitId`, `dealId` | notification-worker | Deal finalization marks an inventory unit sold. |

## Code Reference

Runtime constants live in:

```text
apps/api/src/modules/notifications/event-contracts.ts
```

## Current Limitations

- No external queue publish is implemented in Team 1.
- No email, push, or SMS delivery is implemented in Team 1.
- No NotificationEvent writer is wired yet; Team 6 can add the dispatch layer using this contract.

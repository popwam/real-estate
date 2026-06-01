const { NOTIFICATION_EVENT_NAMES } = require('../../../_shared/events');

function recipients(event) {
  return {
    email: event.data?.recipientEmail || `organization:${event.organizationId}`,
    push: event.data?.recipientUserId || event.actorUserId,
    sms: event.data?.recipientPhone || null,
  };
}

function display(value, fallback) {
  return value || fallback;
}

function projectLabel(event) {
  return display(event.data?.projectName || event.data?.projectId || event.projectId, 'the project');
}

function unitLabel(event) {
  return display(event.data?.unitLabel || event.data?.unitId || event.unitId, 'the unit');
}

function reason(event) {
  return event.data?.reason || 'No reason provided.';
}

function createChannels(event, content, options = {}) {
  const target = recipients(event);
  const channels = [
    {
      type: 'email',
      message: {
        to: target.email,
        subject: content.subject,
        text: content.text,
        metadata: {
          eventName: event.eventName,
          organizationId: event.organizationId,
          entityType: event.entityType,
          entityId: event.entityId,
        },
      },
    },
    {
      type: 'push',
      message: {
        to: target.push,
        title: content.title || content.subject,
        body: content.pushBody || content.text,
        data: {
          eventName: event.eventName,
          organizationId: event.organizationId,
          entityType: event.entityType,
          entityId: event.entityId,
        },
      },
    },
  ];

  if (options.includeSms && target.sms) {
    channels.push({
      type: 'sms',
      message: {
        to: target.sms,
        body: content.smsBody || content.pushBody || content.text,
        metadata: {
          eventName: event.eventName,
          organizationId: event.organizationId,
        },
      },
    });
  }

  return channels;
}

const TEMPLATE_BUILDERS = {
  [NOTIFICATION_EVENT_NAMES.LEAD_CLAIM_CREATED]: (event) => ({
    id: 'lead-claim-created',
    channels: createChannels(event, {
      subject: 'Lead claim created',
      title: 'Lead claim created',
      text: `A lead claim was created for ${projectLabel(event)}${
        event.data?.unitId ? ` and ${unitLabel(event)}` : ''
      }.`,
      pushBody: 'Your lead claim was created.',
      smsBody: 'POPWAM: Your lead claim was created.',
    }, { includeSms: true }),
  }),

  [NOTIFICATION_EVENT_NAMES.LEAD_CLAIM_DUPLICATE_DETECTED]: (event) => ({
    id: 'lead-claim-duplicate-detected',
    channels: createChannels(event, {
      subject: 'Lead claim duplicate detected',
      title: 'Duplicate lead detected',
      text:
        'A duplicate active lead claim was detected for this project. ' +
        'Private broker identity is not included in this notification.',
      pushBody: 'A duplicate active lead claim was detected.',
      smsBody: 'POPWAM: A duplicate active lead claim was detected.',
    }, { includeSms: true }),
  }),

  [NOTIFICATION_EVENT_NAMES.LEAD_CLAIM_CONFLICT_CREATED]: (event) => ({
    id: 'lead-claim-conflict-created',
    channels: createChannels(event, {
      subject: 'Lead claim conflict created',
      title: 'Lead claim conflict',
      text:
        `A lead claim conflict was created for ${projectLabel(event)}. ` +
        'The existing broker identity is not disclosed.',
      pushBody: 'A lead claim conflict was created.',
      smsBody: 'POPWAM: A lead claim conflict was created.',
    }, { includeSms: true }),
  }),

  [NOTIFICATION_EVENT_NAMES.LEAD_CLAIM_RELEASED]: (event) => ({
    id: 'lead-claim-released',
    channels: createChannels(event, {
      subject: 'Lead claim released',
      title: 'Lead claim released',
      text: `A lead claim was released for ${projectLabel(event)}.`,
      pushBody: 'A lead claim was released.',
    }),
  }),

  [NOTIFICATION_EVENT_NAMES.RESERVATION_REQUEST_CREATED]: (event) => ({
    id: 'reservation-request-created',
    channels: createChannels(event, {
      subject: 'Reservation request created',
      title: 'Reservation request created',
      text: `A reservation request was created for ${unitLabel(event)} in ${projectLabel(event)}.`,
      pushBody: 'A reservation request was created.',
      smsBody: 'POPWAM: A reservation request was created.',
    }, { includeSms: true }),
  }),

  [NOTIFICATION_EVENT_NAMES.RESERVATION_REQUEST_APPROVED]: (event) => ({
    id: 'reservation-request-approved',
    channels: createChannels(event, {
      subject: 'Reservation request approved',
      title: 'Reservation approved',
      text: `A reservation request was approved for ${unitLabel(event)} in ${projectLabel(event)}.`,
      pushBody: 'A reservation request was approved.',
      smsBody: 'POPWAM: A reservation request was approved.',
    }, { includeSms: true }),
  }),

  [NOTIFICATION_EVENT_NAMES.RESERVATION_REQUEST_REJECTED]: (event) => ({
    id: 'reservation-request-rejected',
    channels: createChannels(event, {
      subject: 'Reservation request rejected',
      title: 'Reservation rejected',
      text: `A reservation request was rejected. Reason: ${reason(event)}`,
      pushBody: 'A reservation request was rejected.',
      smsBody: 'POPWAM: A reservation request was rejected.',
    }, { includeSms: true }),
  }),

  [NOTIFICATION_EVENT_NAMES.RESERVATION_REQUEST_CANCELLED]: (event) => ({
    id: 'reservation-request-cancelled',
    channels: createChannels(event, {
      subject: 'Reservation request cancelled',
      title: 'Reservation cancelled',
      text: 'A pending reservation request was cancelled.',
      pushBody: 'A reservation request was cancelled.',
      smsBody: 'POPWAM: A reservation request was cancelled.',
    }, { includeSms: true }),
  }),

  [NOTIFICATION_EVENT_NAMES.UNIT_HELD_FOR_RESERVATION]: (event) => ({
    id: 'unit-held-for-reservation',
    channels: createChannels(event, {
      subject: 'Unit held for reservation',
      title: 'Unit held',
      text: `${unitLabel(event)} is now held for an approved reservation request.`,
      pushBody: 'A unit is now held for reservation.',
      smsBody: 'POPWAM: A unit is now held for reservation.',
    }, { includeSms: true }),
  }),
};

function createTeam2NotificationTemplate(event) {
  const builder = TEMPLATE_BUILDERS[event.eventName];
  return builder ? builder(event) : null;
}

module.exports = {
  TEMPLATE_BUILDERS,
  createTeam2NotificationTemplate,
};

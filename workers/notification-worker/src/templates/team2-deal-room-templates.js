const { NOTIFICATION_EVENT_NAMES } = require('../../../_shared/events');

function recipients(event) {
  return {
    email: event.data?.recipientEmail || `organization:${event.organizationId}`,
    push: event.data?.recipientUserId || event.actorUserId,
    sms: event.data?.recipientPhone || null,
  };
}

function label(value, fallback) {
  return value || fallback;
}

function dealRoomLabel(event) {
  return label(event.data?.dealRoomName || event.data?.dealRoomId || event.dealRoomId, 'the deal room');
}

function statusLabel(event) {
  return label(event.data?.status || event.status, 'updated');
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
  [NOTIFICATION_EVENT_NAMES.DEAL_ROOM_CREATED]: (event) => ({
    id: 'deal-room-created',
    channels: createChannels(event, {
      subject: 'Deal room created',
      title: 'Deal room created',
      text: `A deal room was created for ${dealRoomLabel(event)}.`,
      pushBody: 'A deal room was created.',
      smsBody: 'POPWAM: A deal room was created.',
    }, { includeSms: true }),
  }),

  [NOTIFICATION_EVENT_NAMES.DEAL_ROOM_PARTICIPANT_ADDED]: (event) => ({
    id: 'deal-room-participant-added',
    channels: createChannels(event, {
      subject: 'Deal room participant added',
      title: 'Participant added',
      text: `A participant was added to ${dealRoomLabel(event)} as ${label(event.data?.role, 'a participant')}.`,
      pushBody: 'A participant was added to a deal room.',
    }),
  }),

  [NOTIFICATION_EVENT_NAMES.DEAL_ROOM_CLIENT_INVITED]: (event) => {
    const inviteText = event.data?.inviteUrl
      ? ` Invite link: ${event.data.inviteUrl}`
      : ' No invite link was included in this event.';

    return {
      id: 'deal-room-client-invited',
      channels: createChannels(event, {
        subject: 'Client invited to deal room',
        title: 'Client invited',
        text: `A client invite was created for ${dealRoomLabel(event)}.${inviteText}`,
        pushBody: 'A client invite was created for a deal room.',
        smsBody: event.data?.inviteUrl
          ? `POPWAM: You were invited to a deal room. ${event.data.inviteUrl}`
          : 'POPWAM: You were invited to a deal room. Check your email for details.',
      }, { includeSms: true }),
    };
  },

  [NOTIFICATION_EVENT_NAMES.DEAL_ROOM_STATUS_CHANGED]: (event) => ({
    id: 'deal-room-status-changed',
    channels: createChannels(event, {
      subject: 'Deal room status changed',
      title: 'Deal room status updated',
      text: `${dealRoomLabel(event)} status changed to ${statusLabel(event)}.`,
      pushBody: 'A deal room status was updated.',
      smsBody: 'POPWAM: A deal room status was updated.',
    }, { includeSms: true }),
  }),

  [NOTIFICATION_EVENT_NAMES.DEAL_ROOM_MESSAGE_CREATED]: (event) => ({
    id: 'deal-room-message-created',
    channels: createChannels(event, {
      subject: 'New deal room message',
      title: 'New deal room message',
      text:
        `A new ${label(event.data?.messageType, 'message')} was added to ${dealRoomLabel(event)}. ` +
        'Open the deal room to review it.',
      pushBody: 'A new deal room message is available.',
    }),
  }),
};

function createTeam2DealRoomNotificationTemplate(event) {
  const builder = TEMPLATE_BUILDERS[event.eventName];
  return builder ? builder(event) : null;
}

module.exports = {
  TEMPLATE_BUILDERS,
  createTeam2DealRoomNotificationTemplate,
};

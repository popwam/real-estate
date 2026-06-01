const { NOTIFICATION_EVENT_NAMES } = require('../../../_shared/events');

function recipients(event) {
  return {
    email: event.data?.recipientEmail || `organization:${event.organizationId}`,
    push: event.data?.recipientUserId || event.actorUserId,
    sms: event.data?.recipientPhone || null,
  };
}

function orgName(event) {
  return event.data?.organizationName || event.organizationId || 'your organization';
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
  [NOTIFICATION_EVENT_NAMES.ORGANIZATION_SUBMITTED_FOR_VERIFICATION]: (event) => ({
    id: 'organization-submitted-for-verification',
    channels: createChannels(event, {
      subject: 'Verification documents submitted',
      title: 'Verification submitted',
      text: `${orgName(event)} submitted ${
        event.data?.documentCount || 'new'
      } verification document(s) for review.`,
      pushBody: 'Your verification submission is in review.',
    }),
  }),

  [NOTIFICATION_EVENT_NAMES.ORGANIZATION_VERIFICATION_APPROVED]: (event) => ({
    id: 'organization-verification-approved',
    channels: createChannels(event, {
      subject: 'Organization verification approved',
      title: 'Verification approved',
      text: `${orgName(event)} has been approved for POPWAM access.`,
      pushBody: 'Your organization verification was approved.',
      smsBody: 'POPWAM: Your organization verification was approved.',
    }, { includeSms: true }),
  }),

  [NOTIFICATION_EVENT_NAMES.ORGANIZATION_VERIFICATION_REJECTED]: (event) => ({
    id: 'organization-verification-rejected',
    channels: createChannels(event, {
      subject: 'Organization verification rejected',
      title: 'Verification rejected',
      text: `${orgName(event)} verification was rejected. Reason: ${reason(event)}`,
      pushBody: `Verification rejected: ${reason(event)}`,
      smsBody: 'POPWAM: Your verification was rejected. Check your account for details.',
    }, { includeSms: true }),
  }),

  [NOTIFICATION_EVENT_NAMES.ORGANIZATION_VERIFICATION_MORE_REQUESTED]: (event) => ({
    id: 'organization-verification-more-requested',
    channels: createChannels(event, {
      subject: 'More verification information requested',
      title: 'More information needed',
      text: `POPWAM needs more information for ${orgName(event)}. Request: ${reason(event)}`,
      pushBody: 'More information is needed for verification.',
    }),
  }),

  [NOTIFICATION_EVENT_NAMES.ORGANIZATION_SUSPENDED]: (event) => ({
    id: 'organization-suspended',
    channels: createChannels(event, {
      subject: 'Organization suspended',
      title: 'Organization suspended',
      text: `${orgName(event)} has been suspended. Reason: ${reason(event)}`,
      pushBody: 'Your organization has been suspended.',
      smsBody: 'POPWAM: Your organization has been suspended. Check your account for details.',
    }, { includeSms: true }),
  }),

  [NOTIFICATION_EVENT_NAMES.ORGANIZATION_REACTIVATED]: (event) => ({
    id: 'organization-reactivated',
    channels: createChannels(event, {
      subject: 'Organization reactivated',
      title: 'Organization reactivated',
      text: `${orgName(event)} has been reactivated.`,
      pushBody: 'Your organization has been reactivated.',
    }),
  }),

  [NOTIFICATION_EVENT_NAMES.USER_CREATED]: (event) => ({
    id: 'user-created',
    channels: createChannels(event, {
      subject: 'User account created',
      title: 'User account created',
      text: `A ${event.data?.role || 'user'} account was created for ${orgName(event)}.`,
      pushBody: 'A new user account was created.',
    }),
  }),

  [NOTIFICATION_EVENT_NAMES.USER_DEACTIVATED]: (event) => ({
    id: 'user-deactivated',
    channels: createChannels(event, {
      subject: 'User account deactivated',
      title: 'User account deactivated',
      text: `A user account was deactivated for ${orgName(event)}.`,
      pushBody: 'A user account was deactivated.',
    }),
  }),

  [NOTIFICATION_EVENT_NAMES.FILE_METADATA_CREATED]: (event) => ({
    id: 'file-metadata-created',
    channels: createChannels(event, {
      subject: 'File metadata created',
      title: 'File registered',
      text: `File metadata was created for ${orgName(event)} with key ${
        event.data?.objectKey || event.data?.uploadedFileId || event.entityId
      }.`,
      pushBody: 'A file was registered for your organization.',
    }),
  }),
};

function createNotificationTemplate(event) {
  const builder = TEMPLATE_BUILDERS[event.eventName];
  return builder ? builder(event) : null;
}

module.exports = {
  TEMPLATE_BUILDERS,
  createNotificationTemplate,
};

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

function projectLabel(event) {
  return label(event.data?.projectName || event.data?.projectId || event.projectId, 'the project');
}

function unitLabel(event) {
  return label(event.data?.unitLabel || event.data?.unitId || event.unitId, 'the unit');
}

function dealLabel(event) {
  return label(event.data?.dealName || event.data?.dealId || event.dealId, 'the deal');
}

function commissionLabel(event) {
  return label(
    event.data?.commissionReference || event.data?.commissionId || event.commissionId,
    'the commission record',
  );
}

function reason(event) {
  return event.data?.reason || 'Check POPWAM for details.';
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
  [NOTIFICATION_EVENT_NAMES.DEAL_CREATED]: (event) => ({
    id: 'deal-created',
    channels: createChannels(event, {
      subject: 'Deal created',
      title: 'Deal created',
      text: `A deal record was created for ${projectLabel(event)} and ${unitLabel(event)}.`,
      pushBody: 'A deal record was created.',
      smsBody: 'POPWAM: A deal record was created.',
    }, { includeSms: true }),
  }),

  [NOTIFICATION_EVENT_NAMES.DEAL_APPROVED]: (event) => ({
    id: 'deal-approved',
    channels: createChannels(event, {
      subject: 'Deal approved',
      title: 'Deal approved',
      text: `${dealLabel(event)} was approved. Sensitive deal terms are available only inside POPWAM.`,
      pushBody: 'A deal was approved.',
      smsBody: 'POPWAM: A deal was approved.',
    }, { includeSms: true }),
  }),

  [NOTIFICATION_EVENT_NAMES.DEAL_CANCELLED]: (event) => ({
    id: 'deal-cancelled',
    channels: createChannels(event, {
      subject: 'Deal cancelled',
      title: 'Deal cancelled',
      text: `${dealLabel(event)} was cancelled. ${reason(event)}`,
      pushBody: 'A deal was cancelled.',
      smsBody: 'POPWAM: A deal was cancelled.',
    }, { includeSms: true }),
  }),

  [NOTIFICATION_EVENT_NAMES.DEAL_MARKED_SOLD]: (event) => ({
    id: 'deal-marked-sold',
    channels: createChannels(event, {
      subject: 'Deal marked sold',
      title: 'Deal marked sold',
      text: `${dealLabel(event)} was marked sold for ${unitLabel(event)}.`,
      pushBody: 'A deal was marked sold.',
      smsBody: 'POPWAM: A deal was marked sold.',
    }, { includeSms: true }),
  }),

  [NOTIFICATION_EVENT_NAMES.COMMISSION_CREATED]: (event) => ({
    id: 'commission-created',
    channels: createChannels(event, {
      subject: 'Commission record created',
      title: 'Commission created',
      text:
        `${commissionLabel(event)} was created for a completed marketplace workflow. ` +
        'Amounts and private terms are not included in notifications.',
      pushBody: 'A commission record was created.',
      smsBody: 'POPWAM: A commission record was created.',
    }, { includeSms: true }),
  }),

  [NOTIFICATION_EVENT_NAMES.COMMISSION_APPROVED]: (event) => ({
    id: 'commission-approved',
    channels: createChannels(event, {
      subject: 'Commission approved',
      title: 'Commission approved',
      text: `${commissionLabel(event)} was approved. Review POPWAM for the full record.`,
      pushBody: 'A commission record was approved.',
      smsBody: 'POPWAM: A commission record was approved.',
    }, { includeSms: true }),
  }),

  [NOTIFICATION_EVENT_NAMES.COMMISSION_REJECTED]: (event) => ({
    id: 'commission-rejected',
    channels: createChannels(event, {
      subject: 'Commission rejected',
      title: 'Commission rejected',
      text: `${commissionLabel(event)} was rejected. ${reason(event)}`,
      pushBody: 'A commission record was rejected.',
      smsBody: 'POPWAM: A commission record was rejected.',
    }, { includeSms: true }),
  }),

  [NOTIFICATION_EVENT_NAMES.INVENTORY_MARKED_SOLD]: (event) => ({
    id: 'inventory-marked-sold',
    channels: createChannels(event, {
      subject: 'Inventory marked sold',
      title: 'Inventory marked sold',
      text: `${unitLabel(event)} in ${projectLabel(event)} was marked sold.`,
      pushBody: 'A unit was marked sold.',
      smsBody: 'POPWAM: A unit was marked sold.',
    }, { includeSms: true }),
  }),
};

function createTeam2DealCommissionNotificationTemplate(event) {
  const builder = TEMPLATE_BUILDERS[event.eventName];
  return builder ? builder(event) : null;
}

module.exports = {
  TEMPLATE_BUILDERS,
  createTeam2DealCommissionNotificationTemplate,
};

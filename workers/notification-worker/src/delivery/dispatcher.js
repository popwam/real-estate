const { createNotificationTemplate } = require('../templates');

async function dispatchNotificationEvent(event, options) {
  const { logger, providers, retryPolicy, deadLetterSink } = options;
  const template = createNotificationTemplate(event);

  if (!template) {
    logger.warn('No notification template registered for event', {
      eventName: event.eventName,
    });
    return {
      status: 'ignored',
      eventName: event.eventName,
      deliveries: [],
    };
  }

  const deliveries = [];

  for (const channel of template.channels) {
    const provider = providers[channel.type];

    if (!provider) {
      logger.warn('No provider registered for notification channel', {
        channel: channel.type,
        eventName: event.eventName,
      });
      continue;
    }

    try {
      const result = await provider.send(channel.message);
      deliveries.push({
        channel: channel.type,
        status: 'sent',
        provider: result.provider,
        messageId: result.messageId,
      });
    } catch (error) {
      deliveries.push({
        channel: channel.type,
        status: 'failed',
        error: error.message,
      });

      await retryPolicy.recordFailure(event, error, {
        channel: channel.type,
      });
      await deadLetterSink.record(event, error, {
        channel: channel.type,
      });
    }
  }

  logger.info('Notification dispatch completed', {
    eventName: event.eventName,
    deliveries,
  });

  return {
    status: 'processed',
    eventName: event.eventName,
    templateId: template.id,
    deliveries,
  };
}

module.exports = {
  dispatchNotificationEvent,
};

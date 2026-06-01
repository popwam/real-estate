const { NOTIFICATION_EVENT_NAMES } = require('../../../_shared/events');
const { createDeadLetterSink } = require('../delivery/dead-letter');
const { dispatchNotificationEvent } = require('../delivery/dispatcher');
const { createDevelopmentProviders } = require('../delivery/providers');
const { createRetryPolicy } = require('../delivery/retry-policy');

const SUPPORTED_NOTIFICATION_EVENTS = Object.values(NOTIFICATION_EVENT_NAMES);

async function handleNotificationEvent(event, logger) {
  if (!SUPPORTED_NOTIFICATION_EVENTS.includes(event.eventName)) {
    logger.warn('Notification event ignored because it is unsupported', {
      eventName: event.eventName,
    });
    return;
  }

  const result = await dispatchNotificationEvent(event, {
    logger,
    providers: createDevelopmentProviders(logger),
    retryPolicy: createRetryPolicy(logger),
    deadLetterSink: createDeadLetterSink(logger),
  });

  logger.info('Notification event handled', {
    eventName: event.eventName,
    result,
  });

  return result;
}

module.exports = {
  SUPPORTED_NOTIFICATION_EVENTS,
  handleNotificationEvent,
};

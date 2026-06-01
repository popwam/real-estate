function createDeadLetterSink(logger) {
  return {
    async record(event, error, context = {}) {
      logger.warn('Dead-letter placeholder recorded notification failure', {
        eventName: event.eventName,
        entityType: event.entityType,
        entityId: event.entityId,
        error: error.message,
        context,
      });
    },
  };
}

module.exports = {
  createDeadLetterSink,
};

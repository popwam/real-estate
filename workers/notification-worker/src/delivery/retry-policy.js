function createRetryPolicy(logger) {
  return {
    maxAttempts: Number(process.env.NOTIFICATION_MAX_ATTEMPTS || 3),

    async recordFailure(event, error, context = {}) {
      logger.warn('Retry placeholder recorded notification failure', {
        eventName: event.eventName,
        entityType: event.entityType,
        entityId: event.entityId,
        error: error.message,
        maxAttempts: this.maxAttempts,
        context,
      });
    },
  };
}

module.exports = {
  createRetryPolicy,
};

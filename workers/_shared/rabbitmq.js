function createRabbitMqClient(config, logger) {
  return {
    async connect() {
      if (!config.rabbitmq.enabled) {
        logger.info('RabbitMQ disabled; running in placeholder mode', {
          exchange: config.rabbitmq.exchange,
        });
        return;
      }

      logger.warn('RabbitMQ client placeholder is not connected to a broker yet', {
        url: config.rabbitmq.url,
        exchange: config.rabbitmq.exchange,
      });
    },

    async subscribe(queueName, eventNames, handler) {
      logger.info('Subscription registered in placeholder mode', {
        queueName,
        eventNames,
        handler: handler.name || 'anonymous',
      });
    },

    async close() {
      logger.info('RabbitMQ placeholder closed');
    },
  };
}

module.exports = {
  createRabbitMqClient,
};

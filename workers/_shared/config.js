const DEFAULT_RABBITMQ_URL = 'amqp://localhost:5672';

function getWorkerConfig(workerName) {
  return {
    workerName,
    environment: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
    rabbitmq: {
      url: process.env.RABBITMQ_URL || DEFAULT_RABBITMQ_URL,
      enabled: process.env.RABBITMQ_ENABLED === 'true',
      exchange: process.env.RABBITMQ_EXCHANGE || 'popwam.events',
    },
  };
}

module.exports = {
  getWorkerConfig,
};

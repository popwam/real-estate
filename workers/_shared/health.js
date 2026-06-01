function buildHealth(workerName, config) {
  return {
    status: 'ok',
    service: workerName,
    environment: config.environment,
    rabbitmq: {
      enabled: config.rabbitmq.enabled,
      exchange: config.rabbitmq.exchange,
    },
    checkedAt: new Date().toISOString(),
  };
}

module.exports = {
  buildHealth,
};

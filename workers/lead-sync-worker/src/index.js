const { getWorkerConfig } = require('../../_shared/config');
const { buildHealth } = require('../../_shared/health');
const { createLogger } = require('../../_shared/logger');
const { createRabbitMqClient } = require('../../_shared/rabbitmq');

const WORKER_NAME = 'lead-sync-worker';
const QUEUE_NAME = 'lead-sync';
const PLANNED_INTEGRATIONS = ['meta', 'tiktok', 'google'];

async function start(options = {}) {
  const config = getWorkerConfig(WORKER_NAME);
  const logger = createLogger(WORKER_NAME);
  const rabbitmq = createRabbitMqClient(config, logger);

  logger.info('Starting lead sync worker skeleton', {
    plannedIntegrations: PLANNED_INTEGRATIONS,
  });

  await rabbitmq.connect();
  await rabbitmq.subscribe(QUEUE_NAME, [], async () => {
    logger.info('Lead sync placeholder received');
  });

  if (options.once) {
    await rabbitmq.close();
    logger.info('Lead sync worker start check completed');
  }
}

async function main() {
  const command = process.argv[2] || 'health';
  const once = process.argv.includes('--once');
  const config = getWorkerConfig(WORKER_NAME);

  if (command === 'health') {
    console.log(JSON.stringify(buildHealth(WORKER_NAME, config), null, 2));
    return;
  }

  if (command === 'start') {
    await start({ once });
    return;
  }

  console.error(`Unknown command: ${command}`);
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

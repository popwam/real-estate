const { getWorkerConfig } = require('../../_shared/config');
const { buildHealth } = require('../../_shared/health');
const { createLogger } = require('../../_shared/logger');
const { createRabbitMqClient } = require('../../_shared/rabbitmq');
const {
  SUPPORTED_NOTIFICATION_EVENTS,
  handleNotificationEvent,
} = require('./handlers/notification-events');
const { getSampleEvent, SAMPLE_EVENTS } = require('./samples/sample-events');

const WORKER_NAME = 'notification-worker';
const QUEUE_NAME = 'notifications';

async function start(options = {}) {
  const config = getWorkerConfig(WORKER_NAME);
  const logger = createLogger(WORKER_NAME);
  const rabbitmq = createRabbitMqClient(config, logger);

  logger.info('Starting notification worker', {
    supportedEvents: SUPPORTED_NOTIFICATION_EVENTS,
  });

  await rabbitmq.connect();
  await rabbitmq.subscribe(QUEUE_NAME, SUPPORTED_NOTIFICATION_EVENTS, (event) =>
    handleNotificationEvent(event, logger),
  );

  if (options.once) {
    await rabbitmq.close();
    logger.info('Notification worker start check completed');
  }
}

async function main() {
  const command = process.argv[2] || 'health';
  const sampleName = process.argv[3] || 'organization-approved';
  const once = process.argv.includes('--once');
  const config = getWorkerConfig(WORKER_NAME);
  const logger = createLogger(WORKER_NAME);

  if (command === 'health') {
    console.log(JSON.stringify(buildHealth(WORKER_NAME, config), null, 2));
    return;
  }

  if (command === 'start') {
    await start({ once });
    return;
  }

  if (command === 'sample') {
    const event = getSampleEvent(sampleName);

    if (!event) {
      console.error(
        `Unknown sample event: ${sampleName}. Available: ${Object.keys(
          SAMPLE_EVENTS,
        ).join(', ')}`,
      );
      process.exitCode = 1;
      return;
    }

    const result = await handleNotificationEvent(event, logger);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.error(`Unknown command: ${command}`);
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

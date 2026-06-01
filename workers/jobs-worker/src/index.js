const { getWorkerConfig } = require('../../_shared/config');
const { buildHealth } = require('../../_shared/health');
const { createLogger } = require('../../_shared/logger');
const { createRabbitMqClient } = require('../../_shared/rabbitmq');
const { runClaimExpiryJob } = require('./jobs/claim-expiry');

const WORKER_NAME = 'jobs-worker';
const QUEUE_NAME = 'scheduled-jobs';
const PLANNED_JOBS = [
  'claim-expiry',
  'subscription-expiry',
  'document-expiry-alerts',
  'domain-verification',
  'saved-search-alerts',
];

async function start(options = {}) {
  const config = getWorkerConfig(WORKER_NAME);
  const logger = createLogger(WORKER_NAME);
  const rabbitmq = createRabbitMqClient(config, logger);

  logger.info('Starting jobs worker skeleton', {
    plannedJobs: PLANNED_JOBS,
  });

  await rabbitmq.connect();
  await rabbitmq.subscribe(QUEUE_NAME, [], async () => {
    logger.info('Job event placeholder received');
  });

  if (options.once) {
    await rabbitmq.close();
    logger.info('Jobs worker start check completed');
  }
}

async function main() {
  const command = process.argv[2] || 'health';
  const once = process.argv.includes('--once');
  const dryRun = process.argv.includes('--dry-run') || !process.argv.includes('--apply');
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

  if (command === 'claim-expiry') {
    const result = await runClaimExpiryJob({
      logger,
      dryRun,
    });
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

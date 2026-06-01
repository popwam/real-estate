function getClaimExpiryConfig() {
  return {
    enabled: process.env.CLAIM_EXPIRY_ENABLED === 'true',
    lookbackMinutes: Number(process.env.CLAIM_EXPIRY_LOOKBACK_MINUTES || 1440),
    batchSize: Number(process.env.CLAIM_EXPIRY_BATCH_SIZE || 100),
  };
}

async function runClaimExpiryJob(options = {}) {
  const { logger, dryRun = true } = options;
  const config = getClaimExpiryConfig();

  logger.info('Lead claim expiry job skeleton started', {
    dryRun,
    config,
  });

  logger.info('Lead claim expiry intended query', {
    model: 'LeadClaim',
    where: {
      status: 'ACTIVE',
      expiresAt: '<= now()',
    },
    orderBy: {
      expiresAt: 'asc',
    },
    take: config.batchSize,
    lookbackMinutes: config.lookbackMinutes,
  });

  if (dryRun) {
    logger.info('Lead claim expiry dry-run complete; no database mutation performed');
    return {
      status: 'dry-run',
      mutated: false,
      config,
    };
  }

  logger.warn(
    'Lead claim expiry mutation is not implemented because no safe worker DB abstraction exists yet',
  );

  return {
    status: 'not-implemented',
    mutated: false,
    config,
  };
}

module.exports = {
  getClaimExpiryConfig,
  runClaimExpiryJob,
};

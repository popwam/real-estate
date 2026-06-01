function createLogger(service) {
  function write(level, message, meta) {
    const entry = {
      level,
      service,
      message,
      timestamp: new Date().toISOString(),
      ...(meta ? { meta } : {}),
    };

    const line = JSON.stringify(entry);
    if (level === 'error') {
      console.error(line);
      return;
    }
    console.log(line);
  }

  return {
    debug: (message, meta) => write('debug', message, meta),
    info: (message, meta) => write('info', message, meta),
    warn: (message, meta) => write('warn', message, meta),
    error: (message, meta) => write('error', message, meta),
  };
}

module.exports = {
  createLogger,
};

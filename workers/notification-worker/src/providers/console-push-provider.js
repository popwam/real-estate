/**
 * Push provider contract:
 * send({ to, title, body, data? }) -> Promise<{ provider, messageId }>
 */
function createConsolePushProvider(logger) {
  return {
    name: 'console-push',

    async send(message) {
      const messageId = `console-push-${Date.now()}`;
      logger.info('Console push provider output', {
        messageId,
        to: message.to,
        title: message.title,
        body: message.body,
        data: message.data,
      });

      return {
        provider: this.name,
        messageId,
      };
    },
  };
}

module.exports = {
  createConsolePushProvider,
};

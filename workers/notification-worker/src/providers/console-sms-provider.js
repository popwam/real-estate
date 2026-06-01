/**
 * SMS provider contract placeholder:
 * send({ to, body, metadata? }) -> Promise<{ provider, messageId }>
 */
function createConsoleSmsProvider(logger) {
  return {
    name: 'console-sms',

    async send(message) {
      const messageId = `console-sms-${Date.now()}`;
      logger.info('Console SMS provider output', {
        messageId,
        to: message.to,
        body: message.body,
        metadata: message.metadata,
      });

      return {
        provider: this.name,
        messageId,
      };
    },
  };
}

module.exports = {
  createConsoleSmsProvider,
};

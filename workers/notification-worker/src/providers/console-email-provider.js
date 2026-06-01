/**
 * Email provider contract:
 * send({ to, subject, text, html?, metadata? }) -> Promise<{ provider, messageId }>
 */
function createConsoleEmailProvider(logger) {
  return {
    name: 'console-email',

    async send(message) {
      const messageId = `console-email-${Date.now()}`;
      logger.info('Console email provider output', {
        messageId,
        to: message.to,
        subject: message.subject,
        text: message.text,
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
  createConsoleEmailProvider,
};

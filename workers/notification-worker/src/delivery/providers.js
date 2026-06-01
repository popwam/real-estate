const { createConsoleEmailProvider } = require('../providers/console-email-provider');
const { createConsolePushProvider } = require('../providers/console-push-provider');
const { createConsoleSmsProvider } = require('../providers/console-sms-provider');

function createDevelopmentProviders(logger) {
  return {
    email: createConsoleEmailProvider(logger),
    push: createConsolePushProvider(logger),
    sms: createConsoleSmsProvider(logger),
  };
}

module.exports = {
  createDevelopmentProviders,
};

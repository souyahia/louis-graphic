const bunyan = require('bunyan');

const logger = bunyan.createLogger({
  name: 'louis-graphic-logger',
});

module.exports = logger;
const path = require('path');
const nconf = require('nconf');

const config = nconf.argv()
  .env('__')
  .file({
    file: path.join(__dirname, 'config.json'),
  });

module.exports = config;
'use strict';

let PRODUCTION = process.env.NODE_ENV === 'production';
let TEST = process.env.NODE_ENV === 'test';

let config = {};

config.currentEnv = process.env.NODE_ENV || 'development';

config.webServer = {
  port: normalizePort(process.env.PORT || 3000),
  host: process.env.HOST || 'localhost'
};

config.mongodb = {
  port: process.env.MONGODB_PORT || 27017,
  host: process.env.MONGODB_HOST || 'localhost',
  db: 'data_plug_dropbox'
};

config.dbox = {
  appKey: process.env.DROPBOX_APP_KEY,
  appSecret: process.env.DROPBOX_APP_SECRET
};

config.market = {
  host: process.env.MARKET_DOMAIN,
  id: process.env.MARKET_ID,
  accessToken: process.env.MARKET_ACCESS_TOKEN
};

config.hat = {
  username: process.env.HAT_USER,
  password: process.env.HAT_PASSWORD
};

config.updateService = {
  dbCheckInterval: 10 * 60 * 1000,
  repeatInterval: 60 * 1000
};

if (TEST) config.webServer.port = 5525;

const protocol = process.env.SECURE === 'true' ? 'https' : 'http';

config.webServerURL = protocol + '://' + config.webServer.host;

config.dbURL = 'mongodb://' + config.mongodb.host + ':' + config.mongodb.port +
'/' + config.mongodb.db + '_' + config.currentEnv;

config.market.url = protocol + '://' + config.market.host + '/api/dataplugs/' + config.market.id +
'/connect';

module.exports = config;

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}
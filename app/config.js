var PRODUCTION = process.env.NODE_ENV === 'production';
var TEST = process.env.NODE_ENV === 'test';

var config = {};
config.currentEnv = process.env.NODE_ENV || 'development';

config.webServer = {
  port: normalizePort(process.env.PORT || 3000),
  host: process.env.HOST || 'localhost'
};

config.mongodb = {
  port: process.env.MONGODB_PORT || 27017,
  host: process.env.MONGODB_HOST || 'localhost',
  db: 'hat_sync'
};

config.dbox = {
  appKey: process.env.DROPBOX_APP_KEY,
  appSecret: process.env.DROPBOX_APP_SECRET
};

config.market = {
  host: 'marketsquare.hubofallthings.net',
  id: process.env.MARKET_ID,
  accessToken: process.env.MARKET_ACCESS_TOKEN
};

config.hat = {
  username: process.env.HAT_USER,
  password: process.env.HAT_PASSWORD
};

if (TEST) config.webServer.port = 5525;

config.webServerURL = 'http://' + config.webServer.host + ':' + config.webServer.port;

config.dbURL = 'mongodb://' + config.mongodb.host + ':' + config.mongodb.port +
'/' + config.mongodb.db + '_' + config.currentEnv;

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
var Agenda = require('agenda');
var agenda = new Agenda({ db: { address: 'mongodb://localhost:27017/facebook_agenda' } });
var fbToHat = require('../middleware/fbToHat');
var Accounts = require('../models/accounts');

var updateShedule = {
  posts: '1 hour',
  events: '1 day',
  profile: '1 month'
};

module.exports.addJob = function(node, hatAccessToken) {
  console.log(typeof node);
  var taskName = 'update facebook ' + node + ' for ' + hatAccessToken;
  agenda.define(taskName, function(job, done) {
    Accounts.findOne({ hat_token: hatAccessToken }, function(err, account) {
      fbToHat.updateRun(node, account.hat_token, account.graph_access_token, account['last_'+node+'_update'], done);
    });
  });
  agenda.every(updateShedule[node], taskName);
};

agenda.start();
'use strict';

const request = require('request');
const qs = require('qs');

const config = require('../config');

exports.getAccessToken = (hatHost, callback) => {
  const reqOptions = {
    url: 'http://' + hatHost + '/users/access_token',
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    qs: {
      username: config.hat.username,
      password: config.hat.password
    },
    json: true
  };

  request.get(reqOptions, (err, res, body) => {
    if (err) return callback(err);

    return callback(null, body.accessToken);
  });
};
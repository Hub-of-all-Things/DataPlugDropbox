'use strict';

const request = require('request');
const qs = require('qs');

const config = require('../config');

exports.exchangeCodeForToken = (code, callback) => {
  const tokenRequestOptions = {
    url: 'https://api.dropboxapi.com/1/oauth2/token',
    form: {
      code: code,
      grant_type: 'authorization_code',
      client_id: config.dbox.appKey,
      client_secret: config.dbox.appSecret,
      redirect_uri: config.webServerURL + '/dropbox/authenticate'
    }
  };

  request.post(tokenRequestOptions, (err, res, body) => {
    if (err) return callback(err);

    const accessToken = JSON.parse(body).access_token;

    return callback(null, accessToken);
  });
};
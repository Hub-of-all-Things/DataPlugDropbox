'use strict';

const request = require('request');
const qs = require('qs');
const _ = require('lodash');

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

exports.getAccountId = (accessToken, callback) => {
  var requestOptions = {
    url: 'https://api.dropboxapi.com/2/users/get_current_account',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'Content-Type': 'application/json'
    },
    body: null,
    json: true
  };

  request.post(requestOptions, function (err, response, body) {
    if (err) return callback(err);

    return callback(null, body.account_id);
  });
};

exports.getAllFolders = (accessToken, callback) => {
  var requestOptions = {
    url: 'https://api.dropboxapi.com/2/files/list_folder',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'Content-Type': 'application/json'
    },
    body: {
      path: '',
      recursive: false
    },
    json: true
  };

  request.post(requestOptions, function (err, response, body) {
    if (err) return callback(err);

    var folderList = _.filter(body.entries, { '.tag': 'folder'} );

    return callback(null, folderList);
  });
};

exports.getFolderContent = (accessToken, folder, callback) => {
  var requestOptions = {
    url: 'https://api.dropboxapi.com/2/files/list_folder',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'Content-Type': 'application/json'
    },
    body: {
      path: folder.folderName,
      recursive: folder.recursive,
      include_media_info: true
    },
    json: true
  };

  if (folder.cursor) {
    requestOptions.url += '/continue';
    requestOptions.body = { cursor: folder.cursor },
  }

  request.post(requestOptions, (err, response, body) => {
    if (err) return callback(err);

    folder.cursor = body.cursor;
    const filesOnlyArray = _.filter(body.entries, { '.tag': 'file'} );

    callback(null, filesOnlyArray);
  });
};


'use strict';

const request = require('request');
const qs = require('qs');
const _ = require('lodash');

const config = require('../config');

let internals = {};

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
      recursive: true
    },
    json: true
  };

  request.post(requestOptions, function (err, response, body) {
    if (err) return callback(err);

    let folderTree;

    try { folderTree = internals.generateFolderTree(body); }
    catch (e) { return callback(e); }

    return callback(null, folderTree);
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
      recursive: true,
      include_media_info: true
    },
    json: true
  };

  if (folder.cursor) {
    requestOptions.url += '/continue';
    requestOptions.body = { cursor: folder.cursor };
  }

  request.post(requestOptions, (err, response, body) => {
    if (err) return callback(err);

    if (body.entries && body.cursor) {
      folder.cursor = body.cursor;
      const photoArray = internals.filterByType(body.entries, 'photo');
      const validPhotoArray = internals.modifyInvalidKeys(photoArray);

      return callback(null, validPhotoArray);
    } else {
      return callback(new Error('Invalid response from Dropbox'));
    }


  });
};

internals.filterByType = (array, type) => {
  return array.filter((obj) => {
    if (obj['media_info'] && obj['media_info']['metadata']
      && obj['media_info']['metadata']['.tag'] === type) {
      return true;
    } else {
      return false;
    }
  });
};

internals.modifyInvalidKeys = (array) => {
  return array.map((obj) => {
    const str = JSON.stringify(obj);
    const cleanStr = str.replace(/"\.tag":/g, '"tag":');
    const cleanObj = JSON.parse(cleanStr);

    return cleanObj;
  });
};

internals.generateFolderTree = (body) => {
  if (!body.entries || !Array.isArray(body.entries)) {
    throw new Error('Invalid data returned from dropbox.');
  }

  const folderEntries = body.entries.filter((entry) => {
    return entry['.tag'] === 'folder';
  });

  const folderPaths = folderEntries.map((entry) => {
    return entry['path_lower'].substr(1).split('/');
  });

  return folderPaths.reduce((memo, path) => {
    return internals.processPath(memo, path);
  }, []);
};

internals.processPath = (treeNode, path) => {
  const nodeName = path[0];
  const rest = path.slice(1);

  let node = treeNode.find((node) => {
    return node.text === nodeName;
  });

  if (!node) {
    node = { text: nodeName };
    treeNode.push(node);
  }

  if (rest.length > 0) {
    if (node.nodes) {
      node.nodes = internals.processPath(node.nodes, rest);
    } else {
      node.nodes = internals.processPath([], rest);
    }
  }

  return treeNode;
};


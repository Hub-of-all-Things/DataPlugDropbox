
var request = require('request');
var async = require('async');
var fbReqGen = require('./config/fbFields');
var hat = require('./hatRestApi');
var models = require('./models');
var config = require('./config');
var helpers = require('./helpers');
var _ = require('lodash');

var internals = {};

internals.asyncify = function(f) {
  return function _asyncify() {
    var args = Array.prototype.slice.call(arguments, 0);
    var argsWithoutLast = args.slice(0, -1);
    var callback = args[args.length-1];

    var result, error;

    try {
      result = f.apply(this, argsWithoutLast);
    } catch (e) {
      error = e;
    }

    setTimeout(function () {
      callback(error, result);
    }, 0);
  };
};

exports.syncModelData = function (dataSource, dboxAccount, callback) {

  async.eachSeries(dboxAccount.folderList, async.apply(internals.syncSingleModelData, dataSource), function done(err) {
    if (err) return callback(err);

    dataSource.lastUpdated = new Date();

    console.log(dataSource);

    helpers.updateDataSource(dataSource, function (err, savedDataSource) {
      if (err) return callback(err);

      return callback(null, savedDataSource);
    });
  });
};

internals.syncSingleModelData = function (dataSource, folder, callback) {
  if (folder.cursor) {
    internals.getNewItemsInFolder(dataSource, folder, function (err, dataSourceWithData) {
      if (err) return callback(err);

      dataSourceWithData = hat.transformObjectToHat(dataSourceWithData);

      hat.createRecords(dataSourceWithData, function (err, cleanDataSource) {
        if (err) return callback(err);

        return callback(null, cleanDataSource);
      });
    });
  } else {
    internals.getDboxFolderContent(dataSource, folder, function (err, dataSourceWithData) {
      if (err) return callback(err);

      dataSourceWithData = hat.transformObjectToHat(dataSourceWithData);

      hat.createRecords(dataSourceWithData, function (err, cleanDataSource) {
        if (err) return callback(err);

        return callback(null, cleanDataSource);
      });
    });
  }
};

internals.getDboxFolderContent = function (dataSource, folder, callback) {
  var requestOptions = {
    url: 'https://api.dropboxapi.com/2/files/list_folder',
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + dataSource.sourceAccessToken,
      'Content-Type': 'application/json'
    },
    body: {
      path: folder.folderName,
      recursive: folder.recursive,
      include_media_info: true
    },
    json: true
  };

  request(requestOptions, function (err, response, body) {
    if (err) return callback(err);

    folder.cursor = body.cursor;
    var filesOnlyArray = _.filter(body.entries, { '.tag': 'file'} );
    dataSource.data = filesOnlyArray;

    callback(null, dataSource);
  });
};

internals.getNewItemsInFolder = function (dataSource, folder, callback) {
  var requestOptions = {
    url: 'https://api.dropboxapi.com/2/files/list_folder/continue',
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + dataSource.sourceAccessToken,
      'Content-Type': 'application/json'
    },
    body: {
      cursor: folder.cursor,
    },
    json: true
  };

  request(requestOptions, function (err, response, body) {
    if (err) return callback(err);

    folder.cursor = body.cursor;
    var filesOnlyArray = _.filter(body.entries, { '.tag': 'file'} );
    dataSource.data = filesOnlyArray;

    callback(null, dataSource);
  });
};

exports.findModelOrCreate = function (dataSource, callback) {

  hat.setUrl(dataSource.hatHost);
  hat.setAccessToken(dataSource.hatAccessToken);

  procedure = [
    async.apply(hat.getDataSourceId, dataSource),
    hat.getDataSourceModel
  ];

  async.waterfall(procedure, function (err, dataSourceWithRawModel) {

    if (err && err.code === 'ECONNREFUSED') return callback(err);

    if (err) {

      return hat.createDataSourceModel(dataSource, function (error, dataSourceWithRawModel) {
        // TO DO:
        // if (error) TRY AGAIN
        var updatedDataSource = hat.mapDataSourceModelIds(dataSourceWithRawModel);

        return callback(null, updatedDataSource);
      });

    }

    var updatedDataSource = hat.mapDataSourceModelIds(dataSourceWithRawModel);

    return callback(null, updatedDataSource);

  });

};

exports.exchangeCodeForToken = function (code, callback) {
  var tokenRequestOptions = {
    url: 'https://api.dropboxapi.com/1/oauth2/token',
    form: {
      code: code,
      grant_type: 'authorization_code',
      client_id: config.dbox.appKey,
      client_secret: config.dbox.appSecret,
      redirect_uri: config.webServerURL + '/dropbox/authenticate'
    }
  };

  request.post(tokenRequestOptions, function (err, response, body) {
    if (err) return callback(err);

    var accessToken = JSON.parse(body).access_token;

    return callback(null, accessToken);
  });
};

exports.getUserAccountId = function (accessToken, callback) {
  var requestOptions = {
    url: 'https://api.dropboxapi.com/2/users/get_current_account',
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'Content-Type': 'application/json'
    },
    body: null,
    json: true
  };

  request(requestOptions, function (err, response, body) {
    if (err) return callback(err);

    return callback(null, body.account_id);
  });
};

exports.getAllDboxFolder = function (accessToken, callback) {
  var requestOptions = {
    url: 'https://api.dropboxapi.com/2/files/list_folder',
    method: 'POST',
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

  request(requestOptions, function (err, response, body) {
    if (err) return callback(err);

    var folderList = _.filter(body.entries, { '.tag': 'folder'} );

    return callback(null, folderList);
  });
};

exports.processAllChangedAccounts = function (accounts) {
  async.eachSeries(accounts, internals.processAccount, function (err) {
    if (err) return console.log(err);
    return console.log('Sucessful update.');
  });
};

internals.processAccount = function (account, callback) {
  helpers.getDboxAccountById(account, function (err, dboxAccount) {
    if (err) return callback(err);
    exports.syncModelData(dboxAccount.dataSource, dboxAccount, function (err) {
      if (err) return callback(err);
      helpers.updateDboxAccount(dboxAccount, function (err, savedDboxAccount) {
          if (err) return callback(err);
      });
    });
  });
};
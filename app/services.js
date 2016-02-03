
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
}

exports.addUpdateJob = function (name, source, hatAccessToken, frequency) {

  models.Accounts.find({ hatToken: data.hatAccessToken })
    .populate({ path: 'dataSources', match: { name: data.name, source: data.source } })
    .exec(function (err, accounts) {

      var sourceData = accounts[0].dataSources[0];

      internals.getGraphNode(sourceData.name, sourceData.sourceAccessToken, sourceData.lastUpdated, function (err, fbData, lastUpdated) {

        if (_.isArray(fbData) && fbData.length === 0) {
          return done();
        }

        var hatRecord = hat.transformObjectToHat(data.name, fbData, sourceData.hatIdMapping);

        console.log(accounts);
        hat.createRecords(hatRecord, data.hatAccessToken, function (err) {
          if (err) return;

          sourceData.lastUpdated = lastUpdated;
          sourceData.save(function (err) {
            done();
          });
        });
      });
    });

  var options = {
    name: name,
    source: source,
    hatAccessToken: hatAccessToken
  };

  agenda.every(frequency, jobName, options);

  agenda.start();
};

exports.syncModelData = function (dataSource, folderList, callback) {

  async.eachSeries(folderList, async.apply(internals.syncSingleModelData, dataSource), function done(err) {
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
  internals.getDboxFolderContent(dataSource, folder, function (err, dataSourceWithData) {
    if (err) return callback(err);

    dataSourceWithData = hat.transformObjectToHat(dataSourceWithData);

    hat.createRecords(dataSourceWithData, function (err, cleanDataSource) {
      if (err) return callback(err);

      return callback(null, cleanDataSource);
    });
  });
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

    var filesOnlyArray = _.filter(body.entries, { '.tag': 'file'} );
    dataSource.data = filesOnlyArray;

    callback(null, dataSource);
  });
};

internals.setupWebhook = function () {
  //TO-DO: Set-up Dropbox webhook
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
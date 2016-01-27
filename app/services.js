
var request = require('request');
var async = require('async');
var fbReqGen = require('./config/fbFields');
var hat = require('./hatRestApi');
var models = require('./models');
var config = require('./config');
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

exports.syncModelData = function (dboxAccessToken, hatAccessToken, folderList, callback) {

  async.eachSeries(folderList, async.apply(internals.syncSingleModelData, accessToken), function done() {

  });
};

internals.syncSingleModelData = async.compose(
  hat.createRecords,
  internals.asyncify(hat.transformObjectToHat),
  internals.getDboxFolderContent);

internals.retrieveDataSourceProperties

internals.getDboxFolderContent = function (accessToken, folder, callback) {
  var requestOptions = {
    url: 'https://api.dropboxapi.com/2/files/list_folder',
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'Content-Type': 'application/json'
    },
    body: {
      path: folder.folderName,
      recursive: folder.recursive
    },
    json: true
  };

  request(requestOptions, function (err, response, body) {
    if (err) return callback(err);

    var filesOnlyArray = _.filter(body.entries, { '.tag': 'file'} );

    callback(null, filesOnlyArray);
  });
};

internals.setupWebhook = function () {
  //TO-DO: Set-up Dropbox webhook
};

exports.findModelOrCreate = function (name, source, url, accessToken, dataSourceModelConfig, callback) {

  hat.setUrl(url);
  hat.setAccessToken(accessToken);

  procedure = [
    async.apply(hat.getDataSourceId, name, source),
    hat.getDataSourceModel
  ];

  async.waterfall(procedure, function (err, result) {

    if (err) {

      return hat.createDataSourceModel(dataSourceModelConfig, function (error, body) {
        // TO DO:
        // if (error) TRY AGAIN
        var hatIdMapping = hat.mapDataSourceModelIds(body, '');

        callback(null, hatIdMapping);
      });

    }

    var hatIdMapping = hat.mapDataSourceModelIds(result, '');

    callback(null, hatIdMapping);

  });

};
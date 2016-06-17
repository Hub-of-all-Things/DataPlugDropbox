'use strict';

const hat = require('hat-node-sdk');
const request = require('request');
const qs = require('qs');
const async = require('async');

const config = require('../config');
const db = require('../services/db.service');
const dbox = require('../services/dbox.service');

let internals = {};

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

exports.updateDataSource = (dataSource, folder, callback) => {
  if (!dataSource.hatIdMapping) {
    return callback(new Error('Updated cancelled. Inconsistent database record'));
  }

  const procedure = [
    async.apply(dbox.getFolderContent,
                dataSource.sourceAccessToken,
                folder),
    async.apply(internals.asyncTranformObjToHat,
                dataSource.hatIdMapping),
    async.apply(internals.createHatRecords,
                dataSource.hatHost,
                dataSource.hatAccessToken)
  ];

  async.waterfall(procedure, (err, records) => {
    if (err) {
      console.log('There has been a problem updating ' + dataSource.hatHost + ' at ' + Date.now());
      return callback(err);
    } else {
      return callback(null);
    }
  });
};

exports.mapOrCreateModel = (dataSource, callback) => {
  const client = new hat.Client('http://' + dataSource.hatHost, dataSource.hatAccessToken);

  if (!dataSource.dataSourceModelId) {
    client.getDataSourceId(dataSource.name, dataSource.source, (err, model) => {
      if (err) return callback(err);

      if (model && model.id) {
        db.updateDataSource({ dataSourceModelId: model.id }, dataSource, (err, savedDataSource) => {
          if (err) return callback(err);

          return exports.mapOrCreateModel(savedDataSource, callback);
        });
      } else {
        client.createDataSourceModel(dataSource.dataSourceModel, (err, createdModel) => {
          if (err) return callback(err);

          db.updateDataSource({ dataSourceModelId: createdModel.id }, dataSource, (err, savedDataSource) => {
            if (err) return callback(err);
            exports.mapOrCreateModel(savedDataSource, callback);
          });
        });
      }
    });
  } else if (!dataSource.hatIdMapping) {
    client.getDataSourceModel(dataSource.dataSourceModelId, (err, model) => {
      let hatIdMapping;

      try {
        hatIdMapping = hat.transform.mapDataSourceModelIds(model);
      } catch (e) {
        return callback(err);
      }

      db.updateDataSource({ hatIdMapping: hatIdMapping }, dataSource, callback);
    });
  } else {
    return callback(null);
  }
};

internals.asyncTranformObjToHat = (hatIdMapping, data, callback) => {
  try {
    const newHatRecords = hat.transform.transformObjToHat(data, hatIdMapping);
    return callback(null, newHatRecords);
  } catch (e) {
    return callback(e);
  }
};

internals.createHatRecords = (hatHost, hatAccessToken, records, callback) => {
  var client = new hat.Client('http://' + hatHost, hatAccessToken);
  client.createMultipleRecords(records, callback);
};
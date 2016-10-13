'use strict';

const hat = require('hat-node-sdk');
const request = require('request');
const qs = require('qs');
const async = require('async');
const jwt = require('jsonwebtoken')

const config = require('../config');
const dboxModels = require('../config/dboxHatModels');
const db = require('../services/db.service');
const dbox = require('../services/dbox.service');

let internals = {};

exports.verifyToken = (token, callback) => {
  const decodedToken = jwt.decode(token);

  if (!decodedToken) {
    return callback(new Error('Invalid JWT token.'));
  } else if (!decodedToken.iss) {
    return callback(new Error('JWT token does not contain valid "iss" field.'));
  }

  const reqUrl = `${config.protocol}://${decodedToken.iss}/publickey`;

  request.get(reqUrl, (err, res, publicKey) => {
    if (err) return callback(err);

    jwt.verify(token, publicKey, { algorithms: ['RS256'], ignoreExpiration: false }, (err, payload) => {
      if (err) return callback(null, false);

      return callback(null, true, payload.iss);
    });
  });
};

exports.getAccessToken = (hatHost, callback) => {
  const reqOptions = {
    url: config.protocol + '://' + hatHost + '/users/access_token',
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
    if (res.statusCode === 401 || res.statusCode === 500) return callback(body);

    return callback(null, body.accessToken);
  });
};

exports.updateMetadata = (hatDomain, sourceAccessToken, hatAccessToken, callback) => {
  const record = {
    access_token: sourceAccessToken,
    is_active: true
  };

  const client = new hat.Client(config.protocol + '://' + hatDomain, hatAccessToken);

  client.getOrCreateTable('metadata', 'dropbox_data_plug', dboxModels.metadata, (err, hatIdMapping) => {
    if (err) return callback(err);

    const formattedRecord = hat.transform.transformObjToHat(record, hatIdMapping);

    return client.createMultipleRecords(formattedRecord, callback);
  });

};

exports.updateDataSource = (dataSource, folder, callback) => {
  if (!dataSource.hatIdMapping) {
    return callback(new Error('Updated cancelled. Inconsistent database record'));
  }

  exports.getAccessToken(dataSource.hatHost, (err, hatAccessToken) => {
    if (err) return callback(err);

    const procedure = [
      async.apply(dbox.getFolderContent,
                  dataSource.sourceAccessToken,
                  folder),
      async.apply(internals.asyncTranformObjToHat,
                  dataSource.hatIdMapping),
      async.apply(internals.createHatRecords,
                  dataSource.hatHost,
                  hatAccessToken)
    ];

    async.waterfall(procedure, (err, records) => {
      if (err && err.message === 'No data to process') {
        console.log('[HAT service] Nothing to do.');
        return callback(null);
      } else if (err) {
        console.log('There has been a problem updating ' + dataSource.hatHost + ' at ' + Date.now());
        return callback(err);
      } else {
        return callback(null);
      }
    });
  });
};

exports.mapOrCreateModel = (dataSource, accessToken, callback) => {
  const client = new hat.Client(config.protocol + '://' + dataSource.hatHost, accessToken);

  if (!dataSource.dataSourceModelId) {
    client.getDataSourceId(dataSource.name, dataSource.source, (err, model) => {
      if (model && model.id) {
        db.updateDataSource({ dataSourceModelId: model.id }, dataSource, (err, savedDataSource) => {
          if (err) return callback(err);

          return exports.mapOrCreateModel(savedDataSource, accessToken, callback);
        });
      } else {
        client.createDataSourceModel(dataSource.dataSourceModel, (err, createdModel) => {
          if (err) return callback(err);

          db.updateDataSource({ dataSourceModelId: createdModel.id }, dataSource, (err, savedDataSource) => {
            if (err) return callback(err);
            exports.mapOrCreateModel(savedDataSource, accessToken, callback);
          });
        });
      }
    });
  } else if (!dataSource.hatIdMapping) {
    client.getDataSourceModel(dataSource.dataSourceModelId, (err, model) => {
      if (err) return callback(err);

      let hatIdMapping;

      try {
        hatIdMapping = hat.transform.mapDataSourceModelIds(model);
      } catch (e) {
        return callback(e);
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
  var client = new hat.Client(config.protocol + '://' + hatHost, hatAccessToken);
  client.createMultipleRecords(records, callback);
};
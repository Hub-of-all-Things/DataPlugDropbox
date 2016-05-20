'use strict';

const HatDataSource = require('../models/HatDataSource.model');
const UpdateJob = require('../models/UpdateJob.model');
const DboxAccount = require('../models/DboxAccount.model');
const config = require('../config');
const dboxHatModels = require('../config/dboxHatModels');

exports.countDataSources = (hatUrl, callback) => {
  return HatDataSource.count({ hatHost: hatUrl }, (err, count) => {
    if (err) return callback(err);
    return callback(null, count);
  });
};

exports.createDataSources = (names, source, hatHost, hatAT, sourceAT, callback) => {
  if (typeof names === 'string') names = [names];

  const newDbEntries = names.map((name) => {
    return {
      hatHost: hatHost,
      hatAccessToken: hatAT,
      name: name,
      source: source,
      sourceAccessToken: sourceAT,
      dataSourceModel: dboxHatModels[name],
      dataSourceModelId: null,
      hatIdMapping: null,
      updateFrequency: null,
      latestRecordDate: '1'
    };
  });

  return HatDataSource.create(newDbEntries, callback);
};

exports.createUpdateJobs = (dataSources, callback) => {
  if (typeof dataSources === 'string') dataSources = [dataSources];

  const currentTime = new Date();

  const newDbEntries = dataSources.map((dataSource) => {
    return {
      dataSource: dataSource._id,
      priority: 0,
      repeatInterval: null,
      createdAt: currentTime,
      lastModifiedAt: currentTime,
      lastRunAt: null,
      nextRunAt: new Date(currentTime.getTime() + 60 * 1000),
      lastSuccessAt: null,
      lastFailureAt: null,
      lockedAt: null
    };
  });

  return UpdateJob.create(newDbEntries, callback);
};

exports.createDboxAccount = (dataSourceId, accountId, subscribedFolders, callback) => {
  const newDbEntry = {
    dataSource: dataSourceId,
    accountId: accountId,
    subscribedFolders: subscribedFolders
  };

  return DboxAccount.create(newDbEntry, callback);
};
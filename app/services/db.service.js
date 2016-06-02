'use strict';

const HatDataSource = require('../models/HatDataSource.model');
const DboxFolder = require('../models/DboxFolder.model');
const config = require('../config');
const dboxHatModels = require('../config/dboxHatModels');

exports.countDataSources = (hatUrl, callback) => {
  return HatDataSource.count({ hatHost: hatUrl }, (err, count) => {
    if (err) return callback(err);
    return callback(null, count);
  });
};

exports.findDueJobs = (onQueueJobs, callback) => {
  return DboxFolder.find({ nextRunAt: { $lt: new Date() },
                          _id: { $nin: onQueueJobs } })
                  .populate('dataSource')
                  .exec(callback);
};

exports.lockJob = (jobId, callback) => {
  const docUpdate = {
    lastRunAt: new Date(),
    lockedAt: new Date()
  };

  return DboxFolder.findByIdAndUpdate(jobId, docUpdate, { new: true }, callback);
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

exports.createDboxFolder = (dataSourceId, accountId, subscribedFolders, callback) => {

  if (typeof subscribedFolders === 'string') subscribedFolders = [subscribedFolders];

  const currentTime = new Date();

  const newDbEntries = subscribedFolders.map((folder) => {
    return {
      dataSource: dataSourceId,
      accountId: accountId,
      folderName: folder.folderName,
      recursive: folder.recursive,
      cursor: folder.cursor,
      createdAt: currentTime,
      lastRunAt: null,
      nextRunAt: new Date(currentTime.getTime() + 60 * 1000),
      lastSuccessAt: null,
      lastFailureAt: null,
      lockedAt: null
    };
  });

  return DboxFolder.create(newDbEntries, callback);
};

exports.updateDataSource = (docUpdate, dataSource, callback) => {
  const dataSourceFindParams = {
    hatHost: dataSource.hatHost,
    name: dataSource.name,
    source: dataSource.source
  };

  return HatDataSource.findOneAndUpdate(dataSourceFindParams, docUpdate, { new: true }, callback);
};

exports.updateDboxFolder = (folder, isSuccess, nextRunAt, callback) => {
  if (typeof callback === 'undefined') {
    callback = nextRunAt;
    nextRunAt = null;
  }

  let docUpdate = {
    nextRunAt: nextRunAt,
    lockedAt: null
  };

  if (isSuccess) {
    docUpdate.lastSuccessAt = new Date();
  } else {
    docUpdate.lastFailureAt = new Date();
  }

  return DboxFolder.findByIdAndUpdate(folder._id, docUpdate, { new: true }, callback);
};

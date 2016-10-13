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

exports.getDboxFoldersByDomain = (domain, callback) => {
  return HatDataSource.find({ hatHost: domain }, (err, dataSource) => {
    if (err) return callback(err);

    DboxFolder.find({ 'dataSource': dataSource[0]._id })
      .populate('dataSource')
      .exec(callback);
  });
};

exports.deleteFoldersAndDataSources = (domain, callback) => {
  return HatDataSource.find({ hatHost: domain }, (err, dataSource) => {
    if (err) return callback(err);

    return DboxFolder.remove({ 'dataSource': dataSource[0]._id }, (err) => {
      if (err) return callback(err);

      return HatDataSource.remove({ hatHost: domain }, callback);
    });
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

exports.getAllDboxFoldersByAccount = (accountId, onQueueJobs, callback) => {
  return DboxFolder.find({ accountId: accountId,
                          _id: { $nin: onQueueJobs } })
                   .populate('dataSource')
                   .exec(callback);
};

exports.createDataSources = (names, source, hatHost, sourceAT, callback) => {
  if (typeof names === 'string') names = [names];

  HatDataSource.find({ hatHost: hatHost }, (err, dataSources) => {
    if (err) return callback(err);

    if (dataSources.length > 0) {
      return callback(null, dataSources);
    }

    const newDbEntries = names.map((name) => {
      return {
        hatHost: hatHost,
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
  });
};

exports.createDboxFolder = (dataSourceId, accountId, subscribedFolders, callback) => {

  if (typeof subscribedFolders === 'string') subscribedFolders = [subscribedFolders];

  const currentTime = new Date();

  const newDbEntries = subscribedFolders.map((folder) => {
    return {
      dataSource: dataSourceId,
      accountId: accountId,
      folderName: folder.folderName,
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
    cursor: folder.cursor,
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

/**
 * Database helper methods
 */

var _ = require('lodash');
var HatDataSource = require('./models').HatDataSource;
var DboxAccount = require('./models').SubscribedFolders;

var internals = {};

/**
 * @param {object} query
 */

exports.getDataSource = function(query, callback) {
  HatDataSource.findOne({ query }, function (err, dataSource) {
    if (err) return callback(err);
    return callback(null, dataSource);
  });
};

exports.getDataSourceOrCreate = function(query, callback) {
  HatDataSource.findOneAndUpdate(query, {}, { new: true, upsert: true }, function (err, dataSource) {
    if (err) return callback(err);
    return callback(null, dataSource);
  });
};

exports.updateDataSource = function (dataSource, callback) {
  HatDataSource.findByIdAndUpdate(dataSource._id, dataSource, function (err, savedDataSource) {
    if (err) return callback(err);
    return callback(null, savedDataSource);
  });
};

exports.getDboxAccountOrCreate = function (dataSourceId, callback) {
  DboxAccount.findOneAndUpdate({ dataSource: dataSourceId }, {}, { new: true, upsert: true }, function (err, dboxAccount) {
    if (err) return callback(err);
    return callback(null, dboxAccount);
  });
};

exports.updateDboxAccount = function (dboxAccount, callback) {
  DboxAccount.findByIdAndUpdate(dboxAccount._id, dboxAccount, function (err, savedDboxAccout) {
      if (err) return callback(err);
      return callback(null, savedDboxAccout);
  });
};

exports.validateUserInput = function (input) {
    if (!input) return [];
    if (typeof input === 'string') return [input];
    return input;
};

exports.formatFolderList = function(folderList, recursive) {
  return _.map(folderList, function (folder) {
    return {
      folderName: folder,
      recursive: recursive.indexOf(folder) >= 0,
      cursor: ''
    };
  });
};
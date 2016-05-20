// /**
//  * Database helper methods
//  */

// var _ = require('lodash');

// var internals = {};

// /**
//  * @param {object} query
//  */

// exports.getDataSource = function(query, callback) {
//   HatDataSource.findOne({ query }, function (err, dataSource) {
//     if (err) return callback(err);
//     return callback(null, dataSource);
//   });
// };

// exports.getDataSourceOrCreate = function(query, callback) {
//   HatDataSource.findOneAndUpdate(query, {}, { new: true, upsert: true }, function (err, dataSource) {
//     if (err) return callback(err);
//     return callback(null, dataSource);
//   });
// };

// exports.updateDataSource = function (dataSource, callback) {
//   HatDataSource.findByIdAndUpdate(dataSource._id, dataSource, function (err, savedDataSource) {
//     if (err) return callback(err);
//     return callback(null, savedDataSource);
//   });
// };

// exports.getDboxAccountOrCreate = function (dataSourceId, callback) {
//   DboxAccount.findOneAndUpdate({ dataSource: dataSourceId }, {}, { new: true, upsert: true }, function (err, dboxAccount) {
//     if (err) return callback(err);
//     return callback(null, dboxAccount);
//   });
// };

// exports.updateDboxAccount = function (dboxAccount, callback) {
//   DboxAccount.findByIdAndUpdate(dboxAccount._id, dboxAccount, function (err, savedDboxAccout) {
//       if (err) return callback(err);
//       return callback(null, savedDboxAccout);
//   });
// };

// exports.getDboxAccountById = function (accountId, callback) {
//   DboxAccount.findOne({ accountId: accountId })
//     .populate('dataSource')
//     .exec(function (err, dboxAccount) {
//       if (err) return callback(err);
//       return callback(null, dboxAccount);
//     });
// };

var internals = {};

exports.tranformFolderList = (folderList, isRecursive) => {
  safeFolderList = internals.normaliseReqParams(folderList);
  safeIsRecursive = internals.normaliseReqParams(isRecursive);

  return safeFolderList.map((folderName) => {
    return {
      folderName: folderName,
      recursive: safeIsRecursive.indexOf(folderName) >= 0,
      cursor: ''
    };
  });
};

internals.normaliseReqParams = (input) => {
    if (!input) return [];
    if (typeof input === 'string') return [input];
    return input;
};
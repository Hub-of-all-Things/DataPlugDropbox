/**
 * Database helper methods
 */

var HatDataSource = require('./models').HatDataSource;

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
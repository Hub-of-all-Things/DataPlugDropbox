'use strict';

const HatDataSource = require('../models/HatDataSource.model');
const config = require('../config');

exports.countDataSources = (hatUrl, callback) => {
  return HatDataSource.count({ hatHost: hatUrl }, (err, count) => {
    if (err) return callback(err);
    return callback(null, count);
  });
};
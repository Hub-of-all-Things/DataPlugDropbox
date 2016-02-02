'use strict';

/**
 * Load modules
 */

var qs = require('qs');
var request = require('request');
var _ = require('lodash');
var async = require('async');

/**
 * Define request configuration
 */

var internals = {};

internals.requestOptions = {
  mainUrl: null,
  url: null,
  qs: { access_token: null },
  method: 'GET',
  headers: {
    "User-Agent": "MyClient/1.0.0",
    "Accept": "application/json",
    "Host": "example.hatdex.org",
    "Content-Type": "application/json"
  },
  json: true
};

// Network methods
/****************/

exports.getDataSourceId = function (dataSource, callback) {

  internals.requestOptions.url = internals.requestOptions.mainUrl + '/table';
  internals.requestOptions.qs.name = dataSource.name;
  internals.requestOptions.qs.source = dataSource.source;

  request(internals.requestOptions, function (err, response, body) {

    internals.requestOptions.qs.name = null;
    internals.requestOptions.qs.source = null;
    var foundError = internals.handleErrors(err, response);

    if (!foundError) dataSource.sourceHatId = body.id;

    return callback(foundError, dataSource);

  });

};

exports.getDataSourceModel = function (dataSource, callback) {

  internals.requestOptions.url = internals.requestOptions.mainUrl + '/table/' + dataSource.sourceHatId;

  request(internals.requestOptions, function (err, response, body) {

    var foundError = internals.handleErrors(err, response);

    if (!foundError) dataSource.rawModelData = body;

    return callback(foundError, dataSource);

  });

};

exports.createDataSourceModel = function (dataSource, callback) {

  internals.requestOptions.url = internals.requestOptions.mainUrl + '/table';
  internals.requestOptions.method = 'POST';
  internals.requestOptions.body = dataSource.dataSourceModel;

  request(internals.requestOptions, function (err, response, body) {

    internals.requestOptions.method = 'GET';
    internals.requestOptions.body = null;
    var foundError = internals.handleErrors(err, response);

    if (!foundError) dataSource.rawModelData = body;

    return callback(foundError, dataSource);

  });
};

exports.createRecords = function (dataSource, callback) {

  internals.requestOptions.url = internals.requestOptions.mainUrl + '/record/values';
  internals.requestOptions.method = 'POST';
  internals.requestOptions.json = false;
  internals.requestOptions.qs.access_token = dataSource.hatAccessToken;
  internals.requestOptions.body = internals.normalizeJsonValueTypes(dataSource.data);

  request(internals.requestOptions, function (err, response, body) {

    internals.requestOptions.method = 'GET';
    internals.requestOptions.json = true;
    internals.requestOptions.body = null;
    var foundError = internals.handleErrors(err, response);

    if (!foundError) {
      console.log('Posted to HAT: ', JSON.parse(body));
      delete dataSource.data;
    } else {
      console.log('There has been and ERROR ERROR');
    }

    return callback(foundError, dataSource);

  });

};

// Data transformation methods
/****************************/

exports.mapDataSourceModelIds = function (dataSource) {

  var hatIdMappingArray = internals.mapDataSourceModelIds(dataSource.rawModelData, '');
  var hatIdMappingObject = _.zipObject(hatIdMappingArray);

  dataSource.hatIdMapping = hatIdMappingObject;
  delete dataSource.rawModelData;

  return dataSource;
};

internals.mapDataSourceModelIds = function (table, prefix) {
  if (prefix !== '')
    prefix = prefix + '_';

  var tableMapping = _.map(table.fields, function(field) {
    return [prefix + field.name, field.id];
  });

  if (table.subTables && table.subTables.length > 0) {

    var subTableMapping = _.map(table.subTables, function(subTable) {
      return internals.mapDataSourceModelIds(subTable, prefix+subTable.name);
    });

    var flattenedSubTableMapping = _.flatten(subTableMapping);
  }

  return tableMapping.concat(flattenedSubTableMapping);
};

/**
 * Transforms given JSON structures into valid HAT records
 * Will fail if appropriate ID mapping is not provided
 * Currently object values of Array type are not supported
 * @param {string} name
 * @param {object | array} jsonObject
 * @param {object} hatIdMapping
 * @returns {array | null} HAT record objects
 */

exports.transformObjectToHat = function (dataSource) {

  if (_.isArray(dataSource.data)) {

    dataSource.data = _.map(dataSource.data, function (node) {

      var values = internals.generateHatValues(node, dataSource.hatIdMapping, '');

      return {
        record: { name: dataSource.name },
        values: values
      };

    });

    return dataSource;

  } else if (_.isObject(dataSource.data)) {

    var values = internals.generateHatValues(dataSource.data, dataSource.hatIdMapping, '');

    dataSource.data = [{
      record: { name: dataSource.name },
      values: values
    }];

    return dataSource;

  }

  throw 'Provided data format is invalid';

};

/**
 * Converts single object node to HAT record values
 * Operates recursively
 * Currently object values of Array type are not supported
 * @param {object} node
 * @param {object} hatIdMapping
 * @param {string} prefix
 * @returns {object} HAT record object
 */

internals.generateHatValues = function (node, hatIdMapping, prefix) {

  if (prefix !== '')
    prefix = prefix + '_';

  var convertedData = _.map(node, function (value, key) {

    if (typeof value === 'object') {
      // Use lodash to check for arrays
      // if (typeof value === 'array') {
      //   return _.map(value, function(valueItem) {
      //     internals.generateHatValues(valueItem, hatIdMapping, prefix+key)
      //   })
      // }
      // FIXME: next prefix should be prefix_key
      return internals.generateHatValues(value, hatIdMapping, prefix+key);

    } else {

      if (hatIdMapping[prefix+key] === 'undefined') throw 'There was something wrong with ID mapping';

      if (key === '.tag') key = 'tag';

      var newHatValue = {
        value: value,
        field: {
          id: hatIdMapping[prefix+key],
          name: key
        }
      };

      return newHatValue;
    }

  });

  var flattenedValues = _.flattenDeep(convertedData);

  return flattenedValues;

};

// Helper methods
/***************/

internals.handleErrors = function (err, response) {

  if (err) return err;

  switch (response.statusCode) {
    case 404:
      var newError = new Error('[HAT Response] Requested data source model not found');
      newError.status = response.statusCode;
      return newError;

    default:
      return null;
  }
};

internals.jsonTypeRules = function (key, value) {

  if ((typeof value === 'number' && key !== 'id') || typeof value === 'boolean') {
    return value.toString();
  } else {
    return value;
  }

};

internals.normalizeJsonValueTypes = function (obj) {
  return JSON.stringify(obj, internals.jsonTypeRules);
};

// Accessor methods
/*****************/

/**
 * Sets all request options
 * Maps directly to 'request' module configuration object
 * @param {Object} options
 */

exports.setOptions = function (options) {
  if (typeof options === 'object') internals.requestOptions = options;

  return this;
};

/**
 * Gets all request options
 * @returns the request options object
 */

exports.getOptions = function () {
  return internals.requestOptions;
};

/**
 * Sets the access token
 * @param {string} token
 */

exports.setAccessToken = function (token) {
  internals.requestOptions.qs.access_token = token;

  return this;
};

/**
 * Gets the access token
 * @returns the access token
 */

exports.getAccessToken = function () {
  return internals.requestOptions.qs.access_token;
};

/**
 * Sets HAT base URL
 * @param {string} url
 */

exports.setUrl = function (url) {
  // TODO: validate url format
  internals.requestOptions.mainUrl = url + '/data';

  return this;
};

/**
 * Gets HAT base URL
 * @returns the HAT base URL
 */

exports.getUrl = function() {
  return internals.requestOptions.url;
};




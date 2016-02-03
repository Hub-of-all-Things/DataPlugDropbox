var expect = require('chai').expect;
var sampleData = require('./helpers/sampleData');
var hat = require('../app/hatRestApi');

describe('HAT helper functions', function() {

  it('retrieves ID mappings from data source model', function() {
    var mockDataSource = {
      rawModelData: sampleData.sampleDataSourceModel
    };

    var expectedResult = {
      hatIdMapping: sampleData.hatIdMapping
    };

    var testIdMapping = hat.mapDataSourceModelIds(mockDataSource);
    expect(testIdMapping).to.eql(expectedResult);
  });

  it('converts simple objects to HAT data structures', function() {
    var mockDataSource = {
      name: 'givenString',
      hatIdMapping: sampleData.hatIdMapping,
      data: sampleData.simpleDataSample
    };

    var expectedResult = {
      name: 'givenString',
      hatIdMapping: sampleData.hatIdMapping,
      data: sampleData.simpleHatRecord
    };

    var transformedData = hat.transformObjectToHat(mockDataSource);
    expect(transformedData).to.deep.equal(expectedResult);
  });

  it('converts nested objects to HAT data structures', function() {
    var mockDataSource = {
      name: 'givenString',
      hatIdMapping: sampleData.hatIdMapping,
      data: sampleData.sampleFacebookData
    };

    var expectedResult = {
      name: 'givenString',
      hatIdMapping: sampleData.hatIdMapping,
      data: sampleData.hatRecord
    };

    var transformedData = hat.transformObjectToHat(mockDataSource);
    expect(transformedData).to.deep.equal(expectedResult);
  });

  it('converts arrays of objects to HAT data structure', function() {
    var transformedData = hat.transformObjectToHat('givenString', sampleDataArray, hatIdMapping);
    expect(transformedData).to.deep.equal(hatRecordArray);
  });

});












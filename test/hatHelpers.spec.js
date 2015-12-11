var expect = require('chai').expect;
var hat = require('../libs/hatRestApi');

describe('HAT Transformer', function() {

  it('retrieves ID mappings from data source model', function() {
    var testIdMapping = hat.mapDataSourceModelIds(sampleDataSourceModel, '');
    expect(testIdMapping).to.eql(hatIdMapping);
  });

  it('convert simple objects to HAT data structures', function() {
    var transformedData = hat.transformObjectToHat(sampleData, hatIdMapping, '');
    expect(transformedData).to.deep.equal(sampleHatRecord);
  });

  it('convert nested objects to HAT data structures', function() {
    var transformedData = hat.transformObjectToHat(sampleFacebookData, hatIdMapping, '');
    expect(transformedData).to.deep.equal(hatRecord);
  });

});

var sampleDataSourceModel = {
  "id": 1,
  "name": "events",
  "source": "facebook",
  "fields": [
    { "id": 1, "name": "description" },
    { "id": 2, "name": "name" },
    { "id": 8, "name": "rsvp_status" }
  ],
  "subTables": [
    {
      "id": 2,
      "name": "place",
      "source": "facebook",
      "fields": [
        { "id": 3, "name": "name" }
      ],
      "subTables": [
        {
          "id": 3,
          "name": "location",
          "source": "facebook",
          "fields": [
            { "id": 4, "name": "city" },
            { "id": 5, "name": "country" },
            { "id": 6, "name": "latitude" },
            { "id": 7, "name": "longitude" }
          ],
          "subTables": []
        }
      ]
    }
  ]
}

var sampleData = {
  "name": "Kitchen data",
  "description": "Data from my kitchen"
};

var sampleHatRecord = [{
  "value": "Kitchen data",
  "field": { "name": "name", "id": 2 }
}, {
  "value": "Data from my kitchen",
  "field": { "name": "description", "id": 1 }
}];


var sampleFacebookData = {
  "description": "Best event in my life!",
  "name": "Christmas dinner",
  "place": {
    "name": "Cosy restaurant in London center",
    "location": {
      "city": "London",
      "country": "United Kingdom",
      "latitude": 51.507222,
      "longitude": -0.1275
    }
  },
  "rsvp_status": "attending"
};

var hatIdMapping = {
  "_description": 1,
  "_name": 2,
  "place_name": 3,
  "location_city": 4,
  "location_country": 5,
  "location_latitude": 6,
  "location_longitude": 7,
  "_rsvp_status": 8
};

var hatRecord = [{
  "value": "Best event in my life!",
  "field": { "name": "description", "id": 1 }
}, {
  "value": "Christmas dinner",
  "field": { "name": "name", "id": 2 }
}, {
  "value": "Cosy restaurant in London center",
  "field": { "name": "name", "id": 3 }
}, {
  "value": "London",
  "field": { "name": "city", "id": 4 }
}, {
  "value": "United Kingdom",
  "field": { "name": "country", "id": 5 }
}, {
  "value": 51.507222,
  "field": { "name": "latitude", "id": 6 }
}, {
  "value": -0.1275,
  "field": { "name": "longitude", "id": 7 }
}, {
  "value": "attending",
  "field": { "name": "rsvp_status", "id": 8 }
}];
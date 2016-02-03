exports.simpleDataSample = {
  name: "Kitchen data",
  description: "Data from my kitchen"
};

exports.simpleHatRecord =
[{
  record: { "name": "givenString" },
  values:
  [{
    value: "Kitchen data",
    field: { "name": "name", "id": 2 }
    }, {
    value: "Data from my kitchen",
    field: { "name": "description", "id": 1 }
  }]
}];

exports.hatIdMapping = {
  "description": 1,
  "name": 2,
  "place_name": 3,
  "place_location_city": 4,
  "place_location_country": 5,
  "place_location_latitude": 6,
  "place_location_longitude": 7,
  "rsvp_status": 8
};

exports.sampleDataSourceModel = {
  id: 1,
  name: "events",
  source: "facebook",
  fields: [
    { id: 1, name: "description" },
    { id: 2, name: "name" },
    { id: 8, name: "rsvp_status" }
  ],
  subTables: [
    {
      id: 2,
      name: "place",
      source: "facebook",
      fields: [
        { id: 3, name: "name" }
      ],
      subTables: [
        {
          id: 3,
          name: "location",
          source: "facebook",
          fields: [
            { id: 4, name: "city" },
            { id: 5, name: "country" },
            { id: 6, name: "latitude" },
            { id: 7, name: "longitude" }
          ],
          subTables: []
        }
      ]
    }
  ]
};

exports.hatRecord = [{
  "record": { "name": 'givenString' },
  "values":
  [{
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
  }]
}];

exports.sampleFacebookData = {
  description: "Best event in my life!",
  name: "Christmas dinner",
  place: {
    name: "Cosy restaurant in London center",
    location: {
      city: "London",
      country: "United Kingdom",
      latitude: 51.507222,
      longitude: -0.1275
    }
  },
  rsvp_status: "attending"
};
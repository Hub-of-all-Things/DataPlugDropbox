var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var HatDataSourceSchema = new Schema({
  hatHost:            { type: String, required: true },
  hatAccessToken:     { type: String, required: true },
  name:               { type: String, required: true },
  source:             { type: String, required: true },
  sourceAccessToken:  String,
  dataSourceModel:    Schema.Types.Mixed,
  dataSourceModelId:  Number,
  hatIdMapping:       Schema.Types.Mixed,
  updateFrequency:    String,
  latestRecordDate:   String
});

module.exports = mongoose.model('HatDataSource', HatDataSourceSchema);
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var HatDataSourceSchema = new Schema({
  hatAccessToken: String,
  hatHost: String,
  name: { type: String, required: true },
  source: { type: String, required: true },
  sourceHatId: Number,
  sourceAccessToken: String,
  dataSourceModel: Schema.Types.Mixed,
  hatIdMapping: Schema.Types.Mixed,
  updateFrequency: String,
  lastUpdated: String,
});

var FolderSchema = new Schema({
    folderName: { type: String, required: true },
    recursive: { type: Boolean, default: false }
});

var SubscribedFoldersSchema = new Schema({
  source: { type: Schema.Types.ObjectId, ref: 'HatDataSource' },
  folderList: [FolderSchema]
});

exports.HatDataSource = mongoose.model('HatDataSource', HatDataSourceSchema);
exports.SubscribedFolders = mongoose.model('SubscribedFolders', SubscribedFoldersSchema);
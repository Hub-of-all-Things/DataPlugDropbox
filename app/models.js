var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AccountsSchema = new Schema({
  hatToken: String,
  hatBaseUrl: String,
  dataSources: [{ type: Schema.Types.ObjectId, ref: 'HatDataSource' }]
});

var HatDataSourceSchema = new Schema({
  name: { type: String, required: true },
  source: { type: String, required: true },
  sourceAccessToken: String,
  dataSourceModel: Schema.Types.Mixed,
  hatIdMapping: Schema.Types.Mixed,
  frequency: String,
  lastUpdated: { type: String },
});

var FolderSchema = new Schema({
    folderName: { type: String, required: true },
    recursive: { type: Boolean, default: false }
});

var SubscribedFoldersSchema = new Schema({
  accountId: { type: Schema.Types.ObjectId, ref: 'Accounts' },
  folderList: [FolderSchema]
});

exports.HatDataSource = mongoose.model('HatDataSource', HatDataSourceSchema);
exports.Accounts = mongoose.model('Accounts', AccountsSchema);
exports.SubscribedFolders = mongoose.model('SubscribedFolders', SubscribedFoldersSchema);
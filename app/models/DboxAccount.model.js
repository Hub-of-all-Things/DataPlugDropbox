const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FolderSchema = new Schema({
  folderName: { type: String, required: true },
  recursive:  { type: Boolean, default: false },
  cursor:     { type: String }
});

const DboxAccountSchema = new Schema({
  dataSource:        { type: Schema.Types.ObjectId, ref: 'HatDataSource' },
  accountId:         String,
  subscribedFolders: [FolderSchema]
});

module.exports = mongoose.model('DboxAccount', DboxAccountSchema);
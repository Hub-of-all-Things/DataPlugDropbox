'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DboxFolderSchema = new Schema({
  dataSource:     { type: Schema.Types.ObjectId, ref: 'HatDataSource' },
  accountId:      { type: String },
  folderName:     { type: String, required: true },
  recursive:      { type: Boolean, default: false },
  cursor:         { type: String },
  createdAt:      { type: Date },
  lastRunAt:      { type: Date },
  nextRunAt:      { type: Date },
  lastSuccessAt:  { type: Date },
  lastFailureAt:  { type: Date },
  lockedAt:       { type: Date }
});

module.exports = mongoose.model('DboxFolder', DboxFolderSchema);
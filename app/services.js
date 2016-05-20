
exports.syncModelData = function (dataSource, dboxAccount, callback) {

  async.eachSeries(dboxAccount.folderList, async.apply(internals.syncSingleModelData, dataSource), function done(err) {
    if (err) return callback(err);

    dataSource.lastUpdated = new Date();

    console.log(dataSource);

    helpers.updateDataSource(dataSource, function (err, savedDataSource) {
      if (err) return callback(err);

      return callback(null, savedDataSource);
    });
  });
};

exports.processAllChangedAccounts = function (accounts) {
  async.eachSeries(accounts, internals.processAccount, function (err) {
    if (err) return console.log(err);
    return console.log('Sucessful update.');
  });
};

internals.processAccount = function (account, callback) {
  helpers.getDboxAccountById(account, function (err, dboxAccount) {
    if (err) return callback(err);
    exports.syncModelData(dboxAccount.dataSource, dboxAccount, function (err) {
      if (err) return callback(err);
      helpers.updateDboxAccount(dboxAccount, function (err, savedDboxAccount) {
          if (err) return callback(err);
      });
    });
  });
};
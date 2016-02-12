var express = require('express');
var router = express.Router();
var request = require('request');
var qs = require('qs');
var _ = require('lodash');
var models = require('./models');
var services = require('./services');
var dboxConfig = require('./config/dboxHatModels');
var config = require('./config');
var helpers = require('./helpers');

router.get('/dropbox', function (req, res, next) {
  // TODO: implement method to validate access token for given url

  if (!req.query.hatAccessToken || !req.query.hatUrl) {
    res.render('error',
              { status: 500,
                message: 'Invalid HAT credentials provided. Please speak to your HAT administrator about this issue.' });
  }

  var query = { hatAccessToken: req.query.hatAccessToken,
                hatHost: req.query.hatUrl,
                name: 'files',
                source: 'dropbox' };

  helpers.getDataSourceOrCreate(query, function (err, dataSource) {

    if (err) return res.render('error',
      { status: 500,
        message: 'Internal server error' });

    helpers.getDboxAccountOrCreate(dataSource._id, function (err, dboxAccount) {

      if (err) return res.render('error',
        { status: 500,
          message: 'Internal server error' });

      req.session.dataSource = dataSource;
      req.session.dboxAccount = dboxAccount;
      res.render('index', {
        title: 'Welcome to HAT Dropbox Pictures Data Plug',
        stepInformation: 'Step 1 - Authorise us to access your private Dropbox data',
        dropboxAppKey: config.dbox.appKey,
        redirectUri: config.webServerURL + '/dropbox/authenticate' });
    });
  });
});

router.get('/dropbox/authenticate', function (req, res, next) {

  if (!req.query.code) {
    return res.render('error',
      { status: 500,
        message: 'Authentication with dropbox failed. Please start again.' });
  }

  services.exchangeCodeForToken(req.query.code, function (err, accessToken) {
    if (err) return res.render('error',
      { status: 500,
        message: 'Dropbox authentication failed.' });

    req.session.dataSource.sourceAccessToken = accessToken;

    // Workaround for a bug in a session module
    req.session.save(function (err) {
      res.redirect('/dropbox/sync');
    });
  });
});

router.get('/dropbox/sync', function (req, res, next) {
  services.getUserAccountId(req.session.dataSource.sourceAccessToken, function (err, accountId) {
    if (err) return res.render('error', { message: 'Dropbox API cannot be contacted at this moment.' });

    req.session.dboxAccount.accountId = accountId;

    console.log(12123141, req.session.dboxAccount);

    services.getAllDboxFolder(req.session.dataSource.sourceAccessToken, function (err, folderList) {
      if (err) return res.render('error',
        { status: 500,
          message: 'Dropbox API cannot be contacted at this moment.'});

      return res.render('services', {
        title: 'HAT Dropbox Data Plug',
        stepInformation: 'Step 2 - Schedule record synchronisation',
        hatServicesLink: config.webServerURL + '/services',
        folderList: folderList });
    });
  });
});

router.post('/dropbox/services', function (req, res, next) {

  if (!req.body.folderList) {
    return res.render('error',
      { status: 500,
        message: 'Please select at least one folder for synchronisation' });
  }

  var folderList = helpers.validateUserInput(req.body.folderList);
  var recursive = helpers.validateUserInput(req.body.recursive);

  var formattedFolderList = helpers.formatFolderList(folderList, recursive);

  req.session.dboxAccount.folderList = formattedFolderList;
  req.session.dataSource.dataSourceModel = dboxConfig['files'];

  services.findModelOrCreate(req.session.dataSource, function (err, dataSource) {

    if (err) return res.render('error',
      { status: 500,
        message: 'Failed to create data source model' });

    dataSource.lastUpdated = '1';

    helpers.updateDataSource(dataSource, function (err, savedDataSource) {

      if (err) return res.render('error',
        { status: 500,
          message: 'Could not save data source information' });

      services.syncModelData(savedDataSource, req.session.dboxAccount, function (err, updatedSavedDataSource) {
        if (err) return res.render('error',
          { status: 500,
            message: 'There has been and error during update process. Please try again.' });

        helpers.updateDboxAccount(req.session.dboxAccount, function (err, savedDboxAccount) {
          if (err) return res.render('error',
            { status: 500,
              message: 'Failed to save selected folders. Please try again' });

          return res.send('Hoorey, sync completed!');
        });
      });
    });
  });
});

// Allows Dropbox to verify our webhook
router.get('/dropbox/webhook', function (req, res, next) {
  return res.send(req.query.challenge);
});

router.post('/dropbox/webhook', function (req, res, next) {
  var accountsWithChange = req.body.list_folder.accounts;
  services.processAllChangedAccounts(accountsWithChange);
  return res.send('');
});

module.exports = router;
var express = require('express');
var router = express.Router();
var request = require('request');
var qs = require('qs');
var _ = require('lodash');
var models = require('./models');
var services = require('./services');
var dboxConfig = require('./config/dboxHatModels');
var config = require('./config');

router.get('/dropbox', function (req, res, next) {

  // TODO: implement method to validate access token for given url
  if (req.query.hatAccessToken && req.query.hatUrl) {

    var query = { hatToken: req.query.hatAccessToken, hatBaseUrl: req.query.hatUrl };

    models.Accounts.findOneAndUpdate(query, {}, { new: true, upsert: true },
      function(err, account) {
        if (err) return res.render('error', { message: err });

        req.session.hatAccessToken = account.hatToken;
        req.session.hatUrl = account.hatBaseUrl;
        req.session.accountId = account._id;
        res.render('index', {
          title: 'Welcome to HAT Dropbox Pictures Data Plug',
          stepInformation: 'Step 1 - Authorise us to access your private Dropbox data',
          dropboxAppKey: config.dbox.appKey,
          redirectUri: config.webServerURL + '/dropbox/authenticate' });

    });

  } else {
    res.send("Sorry, provided access token or hat url address are not valid. Please try again.");
  }

});

router.get('/dropbox/authenticate', function (req, res, next) {

  if (req.query.code) {

    var tokenRequestOptions = {
      url: 'https://api.dropboxapi.com/1/oauth2/token',
      form: {
        code: req.query.code,
        grant_type: 'authorization_code',
        client_id: config.dbox.appKey,
        client_secret: config.dbox.appSecret,
        redirect_uri: config.webServerURL + '/dropbox/authenticate'
      }
    };

    request.post(tokenRequestOptions, function (err, response, body) {
        if (err) return res.send('Dropbox authentication failed.');

        var parsedBody = JSON.parse(body);
        req.session.dboxAccessToken = parsedBody.access_token;

        // Workaround for a bug in a session module
        req.session.save(function (err) {
          res.redirect('/dropbox/sync');
        });

    });

  } else {
    res.send('Authentication with dropbox failed. Please start again.');
  }

});

router.get('/dropbox/sync', function (req, res, next) {
  var requestOptions = {
    url: 'https://api.dropboxapi.com/2/files/list_folder',
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + req.session.dboxAccessToken,
      'Content-Type': 'application/json'
    },
    body: {
      path: '',
      recursive: false
    },
    json: true
  };

  request(requestOptions, function (err, response, body) {
    if (err) return res.send('Dropbox API cannot be contacted at this moment.');

    var folderList = _.filter(body.entries, { '.tag': "folder"} );

    res.render('services', {
      title: 'HAT Dropbox Data Plug',
      stepInformation: 'Step 2 - Schedule record synchronisation',
      hatServicesLink: config.webServerURL + '/services',
      folderList: folderList });
    });
});

router.post('/dropbox/services', function (req, res, next) {

  try {
    var folderList = req.body.folderList;
    if (typeof folderList === 'string') folderList = [folderList];
    var recursive = req.body.recursive;
    if (typeof recursive === 'string') recursive = [recursive];
  } catch (e) {
    console.log(e);
  }

  var formattedFolderList = _.map(folderList, function (folder) {
    return {
      folderName: folder,
      recursive: recursive.indexOf(folder) >= 0
    };
  });

  var dbFileEntry = new models.SubscribedFolders({
    accountId: req.session.accountId,
    folderList: formattedFolderList
  });

  dbFileEntry.save(function (err, entry) {
    if (err) return res.send('There has been an error');

    console.log('Folder list successfully saved.');
  });

  services.findModelOrCreate('files', 'dropbox', req.session.hatUrl, req.session.hatAccessToken, dboxConfig['files'], function (err, hatIdMapping) {

    console.log('ID mapping saved successfully');
    var hatDataSource = {
      name: 'files',
      source: 'dropbox',
      sourceAccessToken: req.session.dboxAccessToken,
      dataSourceModel: dboxConfig['files'],
      hatIdMapping: hatIdMapping,
      lastUpdated: '1'
    }

    var dbEntry = new models.HatDataSource(hatDataSource);
    console.log("Saving to db:", dbEntry);
    dbEntry.save(function (err, result) {
      if (err) return console.log(err);

      models.Accounts.findByIdAndUpdate(
        req.session.accountId,
        { $push: { 'dataSources': result._id } },
        { safe: true, upsert: true, new: true },
        function(err, newAccount) {

          return res.send('Valio');
        }
        );
    });
  });

});

module.exports = router;

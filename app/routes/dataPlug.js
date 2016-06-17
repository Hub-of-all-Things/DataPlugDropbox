'use strict';

const express = require('express');
const router = express.Router();

const config = require('../config');
const errors = require('../errors');

const db = require('../services/db.service');
const hat = require('../services/hat.service');
const dbox = require('../services/dbox.service');
const market = require('../services/market.service');
const update = require('../services/update.service');

router.get('/', (req, res, next) => {
  return res.render('dataPlugLanding', { hatHost: req.query.hat });
});

router.post('/hat', (req, res, next) => {
  if (!req.body['hat_url']) return next();

  req.session.hatUrl = req.body['hat_url'];

  market.connectHat(req.session.hatUrl, (err) => {

    if (err) return next();

    hat.getAccessToken(req.session.hatUrl, (err, hatAccessToken) => {

      if (err) return next();

      req.session.hatAccessToken = hatAccessToken;

      db.countDataSources(req.session.hatUrl, (err, count) => {
        if (err) return next();

        if (count === 0) {
          return res.render('dboxAuthoriseLanding', {
            dboxAppKey: config.dbox.appKey,
            redirectUri: config.webServerURL + '/dropbox/authenticate',
          });
        } else {
          return res.render('dataPlugStats');
        }
      });
    });
  });

}, errors.renderErrorPage);

router.get('/options', (req, res, next) => {
  dbox.getAccountId(req.session.sourceAccessToken, (err, accountId) => {
    if (err) return next();

    req.session.dboxAccountId = accountId;

    dbox.getAllFolders(req.session.sourceAccessToken, (err, folderTree) => {
      if (err) return next();

      return res.render('syncOptions', { folderTree: folderTree });
    });
  });
}, errors.renderErrorPage);

router.post('/options', (req, res, next) => {
  const folderList = req.body['folders[]'];

  if (!folderList) return res.json({ status: 400, message: 'Submission not valid' });

  const formattedFolderList = folderList.map(folderPath => {
    return { folderName: folderPath, cursor: '' };
  });

  db.createDataSources('photos',
                       'dropbox',
                       req.session.hatUrl,
                       req.session.hatAccessToken,
                       req.session.sourceAccessToken,
                       (err, savedEntries) => {
    if (err) return next();

    db.createDboxFolder(savedEntries[0]._id,
                        req.session.dboxAccountId,
                        formattedFolderList,
                        (err, savedDboxAcc) => {
      if (err) return next();

      update.addInitJob(savedEntries[0]);
      return res.json({ status: 200, message: 'ok' });
    });
  });
}, errors.renderErrorPage);

router.get('/confirm', (req, res, next) => {
  return res.render('confirmation');
});

module.exports = router;
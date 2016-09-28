'use strict';

const express = require('express');
const router = express.Router();

const config = require('../config');
const errors = require('../errors');
const helpers = require('../helpers');

const db = require('../services/db.service');
const hat = require('../services/hat.service');
const dbox = require('../services/dbox.service');
const market = require('../services/market.service');
const update = require('../services/update.service');

const dropboxLoginForm = require('../views/dboxLoginForm.marko');
const accountStatsPage = require('../views/accountStats.marko');
const plugConfigurationPage = require('../views/plugConfiguration.marko');
const confirmationPage = require('../views/confirmationPage.marko');

router.use(helpers.authMiddleware);

router.get('/main', (req, res, next) => {
  market.connectHat(req.session.hat.domain, (err) => {
    if (err) {
      console.log(`[ERROR][${new Date()}]`, err);
      req.dataplug = { statusCode: '502' };
      return next();
    }

    hat.getAccessToken(req.session.hat.domain, (err, hatAccessToken) => {
      if (err) {
        console.log(`[ERROR][${new Date()}]`, err);
        req.dataplug = { statusCode: '401' };
        return next();
      }

      req.session.hat.accessToken = hatAccessToken;

      db.countDataSources(req.session.hat.domain, (err, count) => {
        if (err) {
          console.log(`[ERROR][${new Date()}]`, err);
          req.dataplug = { statusCode: '500' };
          return next();
        }

        if (count === 0) {
          return res.marko(dropboxLoginForm, {
            hat: req.session.hat,
            dboxAppKey: config.dbox.appKey,
            redirectUri: config.webServerURL + '/dropbox/authenticate',
          });
        } else {
          db.getDboxFoldersByDomain(req.session.hat.domain, (err, dboxFolders) => {
            req.session.dbox.accessToken = dboxFolders[0].dataSource.sourceAccessToken;

            let activeFolders = dboxFolders.map(folder => folder.folderName);

            req.session.activeFolders = activeFolders;

            return res.marko(accountStatsPage, {
              dataStats: dboxFolders,
              hat: req.session.hat
            });
          });
        }
      });
    });
  });

}, errors.renderErrorPage);

router.get('/options', (req, res, next) => {
  console.log(req.session);
  dbox.getAccountId(req.session.dbox.accessToken, (err, accountId) => {
    if (err) {
      console.log(`[ERROR][${new Date()}]`, err);
      req.dataplug = { statusCode: '502' };
      return next();
    }

    req.session.dbox.accountId = accountId;

    dbox.getAllFolders(req.session.dbox.accessToken, req.session.activeFolders, (err, folderTree) => {
      if (err) {
        console.log(`[ERROR][${new Date()}]`, err);
        req.dataplug = { statusCode: '502' };
        return next();
      }

      return res.marko(plugConfigurationPage, {
        hat: req.session.hat,
        folderTree: folderTree
      });
    });
  });
}, errors.renderErrorPage);

router.post('/options', (req, res, next) => {
  let folderList = req.body['folders[]'];

  if (!folderList) return res.json({ status: 400, message: 'Submission not valid' });

  if (!Array.isArray(folderList)) folderList = [folderList];

  const formattedFolderList = folderList.map(folderPath => {
    return { folderName: folderPath, cursor: '' };
  });

  db.createDataSources('photos',
                       'dropbox',
                       req.session.hat.domain,
                       req.session.dbox.accessToken,
                       (err, savedEntries) => {
    if (err) {
      console.log(`[ERROR][${new Date()}]`, err);
      return res.json({ status: 500, message: 'Internal server error'});
    }

    db.createDboxFolder(savedEntries[0]._id,
                        req.session.dbox.accountId,
                        formattedFolderList,
                        (err, savedDboxAcc) => {
      if (err) {
        console.log(`[ERROR][${new Date()}]`, err);
        return res.json({ status: 500, message: 'Internal server error'});
      }

      update.addInitJob(savedEntries[0]);
      update.addMetadataJob(req.session.hat.domain, req.session.dbox.accessToken, req.session.hat.accessToken);
      return res.json({ status: 200, message: 'ok' });
    });
  });
}, errors.renderErrorPage);

router.get('/confirm', (req, res, next) => {
  return res.marko(confirmationPage, {
      hat: req.session.hat,
      rumpelLink: 'https://rumpel.hubofallthings.com/',
      mainText: `The Data Plug has been set up to synchronize data between Facebook and your personal HAT.`,
      note: `It may take up to 5 minutes before the data appears on Rumpel.`
  });
});

module.exports = router;
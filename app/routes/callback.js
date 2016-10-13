'use strict';

const express = require('express');
const router = express.Router();
const async = require('async');

const dbox = require('../services/dbox.service');
const db = require('../services/db.service');
const update = require('../services/update.service');
const errors = require('../errors');

const revokeConfirmPage = require('../views/confirmationPage.marko');

router.get('/authenticate', (req, res, next) => {
  if (!req.query.code) {
    console.log(`[ERROR][${new Date()}] Dropbox redirected without the Code variable`);
    req.dataplug = { statusCode: '502' };
    return next();
  }

  dbox.exchangeCodeForToken(req.query.code, (err, sourceAccessToken) => {
    if (err) {
      console.log(`[ERROR][${new Date()}]`, err);
      req.dataplug = { statusCode: '502' };
      return next();
    }

    req.session.dbox = {
      accessToken: sourceAccessToken
    };

    req.session.save((err) => {
      res.redirect('/dataplug/options');
    });
  });
}, errors.renderErrorPage);

router.get('/revoke', (req, res, next) => {
  dbox.revokeToken(req.session.dbox.accessToken, (err) => {
    if (err) {
      console.log(`[ERROR][${new Date()}]`, err);
      req.dataplug = { statusCode: '502' };
      return next();
    }

    req.session.dbox.accessToken = '';

    db.deleteFoldersAndDataSources(req.session.hat.domain, (err) => {
      if (err) {
        console.log(`[ERROR][${new Date()}]`, err);
        req.dataplug = { statusCode: '500' };
        return next();
      }

      req.session.activeFolders = [];

      return res.marko(revokeConfirmPage, {
        hat: req.session.hat,
        rumpelLink: 'https://rumpel.hubofallthings.com/',
        mainText: `You have successfully logged out of Dropbox and fully deauthorised access to your folders.`,
        note: ``
      });
    });
  });
}, errors.renderErrorPage);

router.get('/webhook', (req, res, next) => {
  console.log(`[DBOX Webhook][${new Date()}] Checked connection.`);
  return res.send(req.query.challenge);
});

router.post('/webhook', (req, res, next) => {
  if (req.body.list_folder && req.body.list_folder.accounts) {
    const changedAccounts = req.body.list_folder.accounts;

    console.log(`[DBOX Webhook][${new Date()}] Posted update with ${changedAccounts.length} accounts`);
    async.eachSeries(changedAccounts, update.addNewJobsByAccount, (err) => {
      console.log('[DBOX Webhook] ...did something...');
      if (err) {
        console.log(`[ERROR][${new Date()}] Webhook failed to submit update jobs`);
        return;
      }

      return res.send('');
    });
  }
});

module.exports = router;
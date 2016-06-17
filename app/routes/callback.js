'use strict';

const express = require('express');
const router = express.Router();
const async = require('async');

const dbox = require('../services/dbox.service');
const update = require('../services/update.service');
const errors = require('../errors');

router.get('/authenticate', (req, res, next) => {
  if (!req.query.code) return next();

  dbox.exchangeCodeForToken(req.query.code, (err, sourceAccessToken) => {
    if (err) return next();

    req.session.sourceAccessToken = sourceAccessToken;

    req.session.save((err) => {
      res.redirect('/dataplug/options');
    });
  });
}, errors.renderErrorPage);

router.get('/webhook', (req, res, next) => {
  return res.send(req.query.challenge);
});

router.post('/webhook', (req, res, next) => {
  if (req.body.list_folder && req.body.list_folder.accounts) {
    const changedAccounts = req.body.list_folder.accounts;
    async.series(changedAccounts, update.addNewJobsByAccount, (err) => {
      if (err) return;

      return res.send('');
    });
  }
});

module.exports = router;
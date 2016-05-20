'use strict';

const express = require('express');
const router = express.Router();

const config = require('../config');
const errors = require('../errors');

const db = require('../services/db.service');
const hat = require('../services/hat.service');
const market = require('../services/market.service');

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
  res.send('SUCCESS');
});

module.exports = router;
'use strict';

const express = require('express');
const router = express.Router();

const dbox = require('../services/dbox.service');
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

module.exports = router;
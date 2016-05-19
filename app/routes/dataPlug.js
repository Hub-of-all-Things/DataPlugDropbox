'use strict';

const express = require('express');
const router = express.Router();
const errors = require('../errors');

router.get('/', (req, res, next) => {
  return res.render('dataPlugLanding', { hatHost: req.query.hat });
});

module.exports = router;
'use strict';

const express = require('express');
const router = express.Router();

const indexPage = require('../views/index.marko');

router.get('/', (req, res, next) => {
  res.marko(indexPage, {
    hat: req.session.hat
  });
});

module.exports = router;
'use strict';

exports.createSessionData = (req, res, next) => {
  if (req.session.hat) {
    return next();
  } else {
    req.session.hat = {
      authenticated: false,
      domain: '',
      url: ''
    };

    return next();
  }
}

exports.authMiddleware = (req, res, next) => {
  if (req.session.hat.authenticated === true) {
    return next();
  } else {
    return res.redirect('/hat/login');
  }
};
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

    return req.session.save(function(err) {
      return res.redirect('/hat/login');
    });
  }
}
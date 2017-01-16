'use strict';

var url = require('url');

var Default = require('./DefaultService');

module.exports.post = function post (req, res, next) {
  Default.post(req.swagger.params, res, next);
};

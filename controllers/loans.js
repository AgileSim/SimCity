'use strict';

const context = require('request-context');

var self = {
  get: function get(req, res, next) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(context.get('session:data').data.products.loans, null, 2));
  }
}
module.exports = self;

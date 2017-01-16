'use strict';
let _ = require("lodash");

let self = {

  load: function(config) {
    if(config.dataPath) self.dataPath = config.dataPath
      else throw "Error! Missing data path parameter!";
    if(config.logLevel) self.logLevel = config.logLevel
      else self.logLevel = 'silent';
    if(config.port) self.port = config.port
      else self.port = 8000;
  }

}

module.exports = self;

'use strict';

const log = require('winston');
const crypto = require('crypto')
const sims = require.main.require('./lib/sims');
const sessions = require.main.require('./lib/sessions');

var getNewSessionid = function(userId, password) {
  return crypto.createHash('sha1').update(Date() + userId + password + Math.random().toString()).digest('hex');
}

module.exports = {
  post: (req, res) => {

    log.debug(">>>>> Got authenticate.post!")

    let found = sims.collection.where((user) => {
      if(user.credentials.username === req.body.username
          && user.credentials.password === req.body.password) {
        return true;
      }
    })

    if(found && found.length > 0) {
      log.debug(`User <${req.body.username}> authenticated!`)
      res.statusCode = 200;
      let sessionId = getNewSessionid(req.body.username, req.body.password);
      res.setHeader('session', sessionId)
      sessions.create(sessionId, found[0], Date.now())
    } else {
      log.debug(`User <${req.body.username}> access not granted!`)
      res.statusCode = 403;
    }

    res.end();

  }
}

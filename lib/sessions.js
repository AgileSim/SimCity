'use strict';

const log = require('winston');
const loki = require('lokijs');

const TIMEOUT = 150 * 1000;
const COLLECTOR_INTERVAL = 60 * 1000;

let self = {

  db: undefined,
  collection: undefined,

  initialize: () => {
    self.db = new loki("SessionDb");
    self.collection = self.db.addCollection('sessions');
    log.debug("Session database initializated.")

    //Sessions collector
    setInterval(self.collect, COLLECTOR_INTERVAL);
  },
  manage: (req, res, next) => {
    switch(req.url){
      case '/authenticate':
        next();
        break;
      default:
        if(!req.headers.session) {
          log.debug(`Got ${req.url} without session header. Forbbiden.`)
          res.statusCode = 403;
          res.end();
        } else {
          let found = self.collection.findOne({"id": req.headers.session});
          if(found) {
            log.debug(`Session id ${req.headers.session} found. Access granted.`)
            this.session = found;
            next();
          } else {
            log.debug(`Session id ${req.headers.session} not found. Forbbiden.`)
            res.statusCode = 403;
            res.end();
          }
        }
    }
  },
  create: (sessionId, data) => {
    self.collection.insert({id: sessionId, data: data, 'timeStamp': Date.now()})
    log.debug(`Session created for user <${data.credentials.username}>.`)
  },
  destroy: (sessionId) => {

  },
  update: (sessionId, data) => {

  },
  collect: () => {
    log.debug("Starting collector. Active sessions: " + self.collection.count())
    self.collection.removeWhere((session) => (session.timeStamp + TIMEOUT < Date.now()));
    log.debug("Ending collector. Active sessions: " + self.collection.count())
  }

}

module.exports = self;

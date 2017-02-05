'use strict';

let DataStore = require('lokijs');
let fs = require('fs');
let path = require('path');
let log = require('winston');
let decache = require('decache');

function loadUsersDataFiles(dataPath) {
  let basePath = (dataPath.endsWith("/")) ? dataPath.slice(0, dataPath.length -1) : dataPath;
  let usersPath = 'people';
  let composedPath = path.resolve(`${basePath}/${usersPath}`);
  log.debug(`Users data path: ${composedPath}`);

  let docs = loadUsersFromFolderRecursively(composedPath);
  log.debug(`Loaded ${docs.length} users`)

  return docs;
}

function loadUsersFromFolderRecursively(composedPath) {
  let users = [];
  fs.readdirSync(composedPath).forEach(function (fileName) {
    let filePath = `${composedPath}/${fileName}`;
    let stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      users = users.concat(loadUsersFromFolderRecursively(filePath));
    } else if (filePath.endsWith(".js") || filePath.endsWith(".json")) {
      log.debug(`Loading file: ${filePath}`);
      let user;
      try {
        decache(filePath);
        user = require(filePath);
      } catch (error) {
        log.error(`[error] Unable to load user <${filePath}> file.`);
        log.error(`[error] ${error}`);
      }
      if (user) {
        users.push(user);
      }
    } else {
      log.warn(`[warning] Skipping file: ${fileRelativePath}`);
    }
  });
  return users;
}

function loadDocs(collection, docs) {
  docs.forEach(function(doc) {
    try {
      log.debug(`Loading userId <${doc.id}> with username <${doc.credentials.username}>`);
      collection.insert(doc, function (err, doc) {
        if (err) {
          log.error("[error] Unable to insert user into collection");
          log.error("[error] " + err);
        }
      });
    } catch(error) {
      log.error("[error] loadDocs catched: " + error);
      throw error;
    }
  });
};

function loadUsersCollection(dataPath) {
  let docs = loadUsersDataFiles(dataPath);
  log.debug("Loading users collection...");
  if (Array.isArray(docs) && docs.length) {
    try {
      loadDocs(dbHandler.collection, docs);
    } catch(e) {
      log.error(e);
      throw e;
    }
  } else {
    throw("Error! Can NOT find users data inside path <" + dataPath + ">")
  }
};

function reloadUsersCollection(dataPath) {
  dbHandler.sims.removeDataOnly();
  loadUsersCollection(dataPath);
};


let dbHandler = {
  db: undefined,
  collection: undefined,

  create: function () {
    this.db = new DataStore('simcity');
    this.collection = this.db.addCollection('sims');
  },

  load: function (dataPath) {
    if (this.db == undefined || this.collection == undefined) {
      dbHandler.create();
    }
    loadUsersCollection(dataPath)
  },

}

module.exports = dbHandler;

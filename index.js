'use strict';

const app = require('connect')();
const http = require('http');
const cors = require('cors');
const swaggerTools = require('swagger-tools');
const jsyaml = require('js-yaml');
const fs = require('fs');
const log = require("winston");
const path = require("path");
const context = require('request-context');

var config = require.main.require("./lib/config")
var sims = require.main.require("./lib/sims")
var sessions = require.main.require("./lib/sessions")

let main = function main(argv) {

  // swaggerRouter configuration
  var options = {
    swaggerUi: '/swagger.json',
    controllers: './controllers',
    useStubs: false // Conditionally turn on stubs (mock mode)
  };

  // The Swagger document (require it, build it programmatically, fetch it from a URL, ...)
  var spec = fs.readFileSync('./api/swagger/swagger.yaml', 'utf8');
  var swaggerDoc = jsyaml.safeLoad(spec);

  //Load users data
  sims.load(config.dataPath);

  //Initialize session database
  sessions.initialize();

  // Initialize the Swagger middleware
  swaggerTools.initializeMiddleware(swaggerDoc, function (middleware) {

    // wrap requests in the 'request' namespace (can be any string)
    app.use(context.middleware('session'));

    //Session Manager
    app.use(sessions.manage)  ;

    // Interpret Swagger resources and attach metadata to request - must be first in swagger-tools middleware chain
    app.use(middleware.swaggerMetadata());

    // Validate Swagger requests
    app.use(middleware.swaggerValidator());

    // Route validated requests to appropriate controller
    app.use(middleware.swaggerRouter(options));

    // Serve the Swagger documents and Swagger UI
    app.use(middleware.swaggerUi());

    // Start the server
    http.createServer(app).listen(config.port, function () {
      log.info('Your server is listening on port %d (http://localhost:%d)', config.port, config.port);
      log.info('Docs available on http://localhost:%d/docs', config.port);
    });
  });
}

if (require.main === module) {

  let argv = require('minimist')(process.argv.slice(2));

  //help
  if(argv.h || argv.help) {
    console.log("Usage:");
    console.log("   npm start -- --config=<path-to-config-file>");
    return 0;
  }

  if(!argv.config) {
    console.log("Error! Missing config file.")
    console.log("Usage:");
    console.log("   npm start -- [-h|--help] --config=<path_to_config_file>");
    return 1
  }

  let configFileName = path.normalize(__dirname + '/' + argv.config);
  log.info("Loading config file: " + configFileName);
  //parsing config file
  try {
    if(fs.lstatSync(configFileName).isFile()) {
      config.load(require(__dirname + '/' + argv.config));
    } else {
      throw `Error! ${configFileName} it's not a file`;
    }
  }
  catch(e) {
    log.error("Can't open file: " + configFileName)
    throw e
  }

  //logger level
  if(config.logLevel) {
    log.info("Setting log level to: " + config.logLevel);
    log.level = config.logLevel;
  } else {
    log.level='silent';
  }

  main(process.argv.slice(2, process.argv.length));
}

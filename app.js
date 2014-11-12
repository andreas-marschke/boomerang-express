"use strict";
// requirements
var conf = require("node-conf"),
    http = require("http"),
    https = require("https"),
    fs = require("fs"),
    path = require("path"),
    bunyan = require("bunyan"),
    express = require("express"),
    Filters = require("./lib/filters"),
    Middlewares = require("./lib/middlewares"),
    Backends = require("./lib/backends"),
    Boomerang = require("./lib/boomerang"),
    routes = require("./lib/routes");

var config = conf.load(process.env.NODE_ENV);
var app = express();



if ( typeof config.server === "undefined" ) {
    var error = new Error("Error could not parse configuration!");
    console.error(error);
    process.exit(1);
}

var datastoreLogger = bunyan.createLogger({
    name: "boomerang-express-datastore",
    immediate: true,
    streams: [{
	stream: process.stdout,
	level: config.log.datastore.level.toString() || "debug"
    }]
});

var filterLogger = bunyan.createLogger({
    name: "boomerang-express-filter",
    immediate: true,
    streams: [{
	stream: process.stdout,
	level: config.log.filter.level.toString() || "debug"
    }]
});

var appLogger = bunyan.createLogger({
    name: "boomerang-express-application",
    immediate: true,
    streams: [{
	stream: process.stdout,
	level: config.log.application.level.toString() || "debug"
    }]
});

new Backends(config.datastore, datastoreLogger).on("open",main)
    .on("dbOpenError",handleError)
    .on("error",handleError);

function handleError(error) {
    datastoreLogger.fatal( { error: error }, error);
    process.exit();
}

function main(dsInstance) {


    app.use(new Middlewares(config));
    app.use(function(req, res, next) {
	res.ds = dsInstance;
	res.log = appLogger;
	res.filter = new Filters(config.filter, filterLogger);
	next();
    });
    app.use(Boomerang);
    app.use(routes);




    config.server.listeners.forEach(startListener);
}

function postStartup () {
    if(typeof config.security !== "undefined") {
	appLogger.info({context: config.security},"Dropping to security context " + (config.security.user || "boomerang") + ":" + (config.security.group || "boomerang"));
	process.setgid(config.security.group || "boomerang");
	process.setuid(config.security.user || "boomerang");
    } else {
	appLogger.info({context: { user: "boomerang", group: "boomerang" }},"Dropping to security context boomerang:boomerang");
	process.setgid("boomerang");
	process.setuid("boomerang");
    }
}

function startListener(listener) {
    if (listener.protocol === "http" ) {
	appLogger.info({ listener: listener }, "Starting HTTP Application Server");
	httpListener(listener);
    } else if (listener.protocol === "https" ) {
	appLogger.info({ listener: listener }, "Starting HTTPS Application Server");
	httpsListener(listener);
    }
}

function httpListener (listener) {
    var server = http.createServer(app);
    server.listen(listener.port, listener.listen, postStartup);
}

function httpsListener (listener) {
    var server = https.createServer({
	key: fs.readFileSync(path.resolve(listener.key)),
	cert: fs.readFileSync(path.resolve(listener.cert))
    },app);

    server.listen(listener.port, listener.listen, postStartup);
}

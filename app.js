"use strict";

var conf = require("node-conf"),
    http = require("http"),
    https = require("https"),
    fs = require("fs"),
    path = require("path"),
    express = require("express"),
    cluster = require("cluster"),
    Logging = require("./lib/logging"),
    Filters = require("./lib/filters"),
    Middlewares = require("./lib/middlewares"),
    Datastore = require("./lib/datastore"),
    Boomerang = require("./lib/boomerang");

var numCpus = require("os").cpus().length;
var config = conf.load(process.env.NODE_ENV);
var app;

if ( typeof config.server === "undefined" ) {
    var error = new Error("Error could not parse configuration!");
    console.error(error);
    process.exit(1);
}

var logging = new Logging(config.log);
var filters = new Filters(config.filter, logging.filterLogger);

function handleError(error) {
    logging.datastoreLogger.fatal( { error: error }, error);
    process.exit();
}

function main(dsInstance) {
    var boomerang = new Boomerang(config, dsInstance, filters, logging.appLogger);
    app = express();
    app.use(boomerang.router());
    app.use(logging.webLogger);
    app.use(new Middlewares(config));
    config.server.listeners.forEach(startListener);
}

function postStartup () {
    if(typeof config.security !== "undefined") {
	logging.appLogger.info({context: config.security}, "Dropping to security context " + (config.security.user || "boomerang") + ":" + (config.security.group || "boomerang"));
	process.setgid(config.security.group || "boomerang");
	process.setuid(config.security.user || "boomerang");
    } else {
	logging.appLogger.info({context: { user: "boomerang", group: "boomerang" }}, "Dropping to security context boomerang:boomerang");
	process.setgid("boomerang");
	process.setuid("boomerang");
    }
}

function startListener(listener) {
    if (listener.protocol === "http" ) {
	logging.appLogger.info({ listener: listener }, "Starting HTTP Application Server");
	httpListener(listener);
    } else if (listener.protocol === "https" ) {
	logging.appLogger.info({ listener: listener }, "Starting HTTPS Application Server");
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
    }, app);

    server.listen(listener.port, listener.listen, postStartup);
}

if (cluster.isMaster) {

    var forks = 0;
    if (config.server.threads) {
	if (config.server.threads > numCpus) {
	    forks = numCpus;
	} else {
	    forks = config.server.threads;
	}
    } else {
	forks = 1;
    }


    for (var i = 0; i < forks; i++) {
	cluster.fork();
    }
} else {

    var ds = new Datastore(config.datastore, logging.datastoreLogger);
    if (ds.init(config.datastore.active)) {
	main(ds);
    } else {
	handleError(new Error("Could not initialize the Datastore"));
    }
}

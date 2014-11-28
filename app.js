"use strict";

var conf = require("node-conf"),
    http = require("http"),
    https = require("https"),
    cluster = require("cluster"),
    fs = require("fs"),
    path = require("path"),
    bunyan = require("bunyan"),
    express = require("express"),
    Filters = require("./lib/filters"),
    Middlewares = require("./lib/middlewares"),
    Datastore = require("./lib/datastore"),
    Boomerang = require("./lib/boomerang");

var config = conf.load(process.env.NODE_ENV);
var app;

if ( typeof config.server === "undefined" ) {
    var error = new Error("Error could not parse configuration!");
    console.error(error);
    process.exit(1);
}

var datastoreLogger = bunyan.createLogger({
    name: "boomerang-express-datastore",
    immediate: false,
    streams: [{
	stream: process.stdout,
	level: config.log.datastore.level.toString() || "debug"
    }]
});

var filterLogger = bunyan.createLogger({
    name: "boomerang-express-filter",
    immediate: false,
    streams: [{
	stream: process.stdout,
	level: config.log.filter.level.toString() || "debug"
    }]
});

var appLogger = bunyan.createLogger({
    name: "boomerang-express-application",
    immediate: false,
    streams: [{
	stream: process.stdout,
	level: config.log.application.level.toString() || "debug"
    }]
});

function handleError(error) {
    datastoreLogger.fatal( { error: error }, error);
    process.exit();
}

function main(dsInstance) {

    app = new Middlewares(config);

    var filters = new Filters(config.filter, filterLogger);
    var boomerang = new Boomerang(config, dsInstance, filters, appLogger);

    app.use(boomerang.router());

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


var ds = new Datastore(config.datastore, datastoreLogger);

if (ds.init(config.datastore.active)) {
    main(ds);
} else {
    handleError(new Error("Could not initialize the Datastore"));
}

// requirements

var conf = require('node-conf'),
    http = require('http'),
    https = require('https'),
    fs = require('fs'),
    path = require('path'),
    config = conf.load(process.env.NODE_ENV),
    bunyan = require('bunyan'),
    express = require('express'),
    app = express(),
    Filters = require('./lib/filters'),
    Middlewares = require ('./lib/middlewares'),
    Backends = require('./lib/backends');

// combine all the servers listed in configuration into one big server-url
if ( typeof config.server === "undefined" ) {
    console.error("Error could not parse configuration!");
    return;
}

var streams = [{
    stream: process.stdout,
    level: 'debug'
}];

var datastoreLogger = bunyan.createLogger({
    name: "boomerang-express-datastore",
    immediate: true,
    streams: streams
});

var filterLogger = bunyan.createLogger({
    name: "boomerang-express-filter",
    immediate: true,
    streams: streams
});

var appLogger = bunyan.createLogger({
    name: "boomerang-express-application",
    immediate: false,
    streams: streams
});


var ds = new Backends(config.datastore, datastoreLogger).on("open",main)
    .on('dbOpenError',handleError)
    .on('error',handleError);

function handleError(error) {

    datastoreLogger.error( error );
    process.exit();
};

function main() {
    new Middlewares(config,app);
    var filter = new Filters(config.data,filterLogger);

    app.settings.ds = ds,
    app.settings.log = appLogger,
    app.settings.filter = filter;

    var routes = require('./lib/routes');
    app.use(routes);

    config.server.listeners.forEach(startListener,app);
};

function postStartup(data) {
    app.settings.log.info("Server Started");
    if(typeof config.security !== "undefined") {
	app.settings.log.info({context: config.security},"Dropping to security context " + (config.security.user || "boomerang") + ":" + (config.security.group || "boomerang"));
	process.setuid(config.security.user || "boomerang");
	process.setgid(config.security.group || "boomerang");
    } else {
	app.settings.log.info({context: { user: "boomerang", group: "boomerang" }},"Dropping to security context boomerang:boomerang");
	process.setuid("boomerang");
	process.setgid("boomerang");
    }

};

function startListener(listener) {
    if (listener.protocol === "http" ) {
	httpListener(listener,this);
    } else if (listener.protocol === "https" ) {
	httpsListener(listener,this);
    }
};

function httpListener (listener, application) {
    var server = http.createServer(application);
    server.listen(listener.port, listener.listen, postStartup);
};

function httpsListener (listener, application) {
    var server = https.createServer({
	key: fs.readFileSync(path.resolve(listener.key)),
	cert: fs.readFileSync(path.resolve(listener.cert))
    },application);

    server.listen(listener.port, listener.listen, postStartup);
};

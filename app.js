// requirements

var conf = require('node-conf'),
    http = require('http'),
    https = require('https'),
    fs = require('fs'),
    path = require('path'),
    config = conf.load(process.env.NODE_ENV),
    bunyan = require('bunyan'),
    Backends = require('./lib/backends');

// combine all the servers listed in configuration into one big server-url
if ( typeof config.server === "undefined" ) {
    console.error("Error could not parse configuration!");
    return;
}

var logger = bunyan.createLogger({
    name: "boomerang-express-datastore",
    immediate: true,
    streams: [{
	stream: process.stdout,
	level: 'debug'
    }]
});

var ds = new Backends(config.datastore, logger).on("open",function(){

    var express = require('express');
    var app = express();

    var Middlewares = require ('./lib/middlewares');
    new Middlewares(config,app);

    app.settings.ds = ds;
    app.settings.log = bunyan.createLogger({
	name: "boomerang-express-application",
	immediate: false,
	streams: [{
	    stream: process.stdout,
	    level: 'debug'
	}]
    });

    app.settings.data = config.data;

    var routes = require('./lib/routes');
    app.use(routes);

    for ( var i = 0; i < config.server.listeners.length; i++) {
	if (config.server.listeners[i].protocol === "http" ) {

	    var x = i;
	    var server = http.createServer(app);
	    server.listen(
		config.server.listeners[i].port,
		config.server.listeners[i].listen,
		function() {
		    app.settings.log.info({
			message: "HTTP-Server up!",
			port: config.server.listeners[x].port,
			ip: config.server.listeners[x].listen
		    });
		});
	} else if (config.server.listeners[i].protocol === "https" ) {

	    var p = i;

	    var server = https.createServer({
		key: fs.readFileSync(path.resolve(config.server.listeners[i].key)),
		cert: fs.readFileSync(path.resolve(config.server.listeners[i].cert))
	    },app);

	    server.listen(
		config.server.listeners[i].port,
		config.server.listeners[i].listen,
		function(){
		    app.settings.log.info({
			message: "HTTPS-Server up!",
			port: config.server.listeners[p].port,
			ip: config.server.listeners[p].listen,
			key: config.server.listeners[p].key,
			cert: config.server.listeners[p].cert
		    });
		});
	}
    }
}).on('dbOpenError',function(exception) {
    logger.error( exception );
    process.exit();
}).on('error',function(error) {

    logger.error( error );
    process.exit();
});

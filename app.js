// requirements

var MongoClient = require('mongodb').MongoClient,
    conf = require('node-conf'),
    http = require('http'),
    https = require('https'),
    fs = require('fs'),
    path = require('path'),
    bodyParser = require("body-parser"),
    cookieParser = require("cookie-parser"),
    cookieSession =  require("cookie-session"),
    bunyan = require('bunyan'),
    Static = require('serve-static'),
    config = conf.load(process.env.NODE_ENV);

// combine all the servers listed in configuration into one big server-url
var buildMongoUrl = function(db,servers,credentials,options) {
    var url = "mongodb://";
    //var url = "mongodb://" + credentials.user  + ":" + credentials.password  + "@";
    for (var i = 0; i < servers.length; i++) {
	url += servers[i].host + ":" + (servers[i].port || "27017");
	if (i !== (servers.length - 1)) {
	    url += ",";
	} else {
	    url += "/" + db + "?" + options;
	}
    }
    return url;
};


if ( typeof config.server === "undefined" ) {
    console.error("Error could not parse configuration!");
    return;
}

var url="";

var url = buildMongoUrl(
    config.mongodb.db,
    config.mongodb.servers,
    config.mongodb.credentials,
    config.mongodb.options
);

MongoClient.connect(url,{
    strict: true,
    db : { native_parser : false },
    server : {
	socketOptions : {
	    connectTimeoutMS: 400
	},
	autoreconnect: true
    }
},function(err,db){
    if (err !== null) {
	console.log(err);
	process.exit(1);
    }

    var express = require('express');
    var app = express();

    app.use(Static('public'));

    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.text({ extended: true, inflate: true })); 
    app.use(bodyParser.json({ strict: true , type: "text/plain"})); 

    app.use(cookieParser('boomerangexpress'));
    app.use(cookieSession({ 
	name: "boomerangexpress",
	key: "boomerangexpress",
	keys: ["boomerangexpress"],
	secret: "boomerangexpress"
    }));
    
    app.use(require('express-bunyan-logger')({
	name: "boomerang-express",
	immediate: false,
	parseUA: true,
	serializers: {
	    req: function (req) { 
		return { 
		    method: req.method,
		    url: req.url,
		    headers: req.headers
		};
	    },
	    res: function () {
		return null;
	    },
	    "user-agent": function (ua) {
		return { 
		    browser: ua.family,
		    version: [ua.major,ua.minor,ua.patch].join("."),
		    device: ua.device.family,
		    os: ua.os.family
		};
	    },
	    body: function () { return null; },
	    "req-headers":  function () { return null; }
	},
	streams: [{
	    stream: process.stdout,
	    level: 'info'	    
	}]
    }));

    app.settings.db = db;
    app.settings.data = config.data;
    app.settings.logger = bunyan.createLogger({
	name: "boomerang-express",
	immediate: true,
	streams: [{
	    stream: process.stdout,
	    level: 'debug'
	}]
    });

    var routes = require('./lib/routes');
    app.use(routes);
    
    for ( var i = 0; i < config.server.listeners.length; i++) {
	if (config.server.listeners[i].protocol === "http" ) {
	    var server = http.createServer(app);
	    server.listen(
		config.server.listeners[i].port,
		config.server.listeners[i].listen,
		function() { app.settings.logger.info("HTTP-Server up!"); });
	} else if (config.server.listeners[i].protocol === "https" ) {

	    var server = https.createServer({
		key: fs.readFileSync(path.resolve(config.server.listeners[i].key)),
		cert: fs.readFileSync(path.resolve(config.server.listeners[i].cert))
	    },app);

	    server.listen(
		config.server.listeners[i].port,
		config.server.listeners[i].listen,
		function(){ app.settings.logger.info("HTTPS-Server up!"); });
	}
    }
});


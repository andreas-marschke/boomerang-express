// requirements

var MongoClient = require('mongodb').MongoClient,
    conf = require('node-conf'),
    http = require('http'),
    https = require('https'),
    fs = require('fs'),
    path = require('path')
    config = conf.load(process.env.NODE_ENV);

// combine all the servers listed in configuration into one big server-url
var buildMongoUrl = function(db,servers,credentials,options) {
    var url = "mongodb://" + credentials.user  + ":" + credentials.password  + "@";
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

    app.use(express.urlencoded());
    app.use(express.json());
    app.use(express.cookieParser('boomerang-express'));
    app.use(express.logger());
    app.use(express.cookieSession());
    app.use(express.static('public'))
    app.settings.db = db;

    var routes = require('./lib/routes');
    app.use(routes);

    for ( var i = 0; i < config.server.listeners.length; i++) {
	if (config.server.listeners[i].protocol === "http" ) {
	    var server = http.createServer(app);
	    server.listen(
		config.server.listeners[i].port,
		config.server.listeners[i].listen,
		function(){ console.log("HTTP-Server up!"); });
	} else if (config.server.listeners[i].protocol === "https" ) {

	    var server = https.createServer({
		key: fs.readFileSync(path.resolve(config.server.listeners[i].key)),
		cert: fs.readFileSync(path.resolve(config.server.listeners[i].cert))
	    },app);

	    server.listen(
		config.server.listeners[i].port,
		config.server.listeners[i].listen,
		function(){
		    console.log("HTTPS-Server up!");
		});
	}
    }
});




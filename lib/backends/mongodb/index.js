"use strict";

var Server = require("mongodb").Server,
    Database = require("mongodb").Db,
    ObjectId = require("mongodb").ObjectID,
    ReadPreference = require("mongodb").ReadPreference,
    EventEmitter = require("events").EventEmitter,
    MongoClient = require("mongodb").MongoClient,
    Logger = require("mongodb").Logger,
    util = require("util"),
    url = require("url");

var Datastore = module.exports = function Datastore (options, logger) {

    this.config = options || {};

    EventEmitter.call(this);

    if (typeof (logger) === "object") {
	this.log = logger;
    } else {
	this.log = console;
    }

    var dbConfig = this.createConfig(this.config);

    try {
	var that = this;
	var mc = new MongoClient();

	mc.connect(dbConfig.url, dbConfig, function(err, db){
	    if ( err !== null) {
		that.emit("dbOpenError",err);
	    } else {
		that.log.info("Successfully connected to Database")
		that._database = db;
		that.emit("open",that);
	    }
	});
    } catch (ex) {
	this.emit("dbOpenError",ex);
    }

    return this;
};

util.inherits(Datastore,EventEmitter);

Datastore.prototype.handleError = function(err) {
    this.log.error({ fullErr: err }, err.message);
};

Datastore.prototype.collectionExists = function(type, user, collection, site, callback) {
    var that = this;

    this._database.collection("webcollections", { strict: true }, function(err, webcollections) {

	if (err !== null)   {
	    that.handleError(err);
	    callback(false);
	    return;
	}

	that.log.debug({ type: type, owner: user, collectionName: collection, site: site}, "looking for collection in database");

	webcollections.find({ owner: user, name: collection }).toArray(function (err, documents) {
	    that.log.info({ document: documents, err: err } , "Found one document in collection")

	    if (err !== null) {
		that.handleError(err);
		callback(false);
		return false;
	    }

	    var document;
	    if (documents.length == 0) {
		that.log.warn({ owner: user, collectionName: collection }, "Could not find a matching collection for requested data");
		return null;
	    } else {
		document = documents[0];
	    }

	    that.log.debug({recieved: site, found: document}, "Running location check...");

	    var locationResult = document.locations.filter(function(location){
		var locationParsed = url.parse(location.url);
		if(location.shared === false && locationParsed.host === site.host) {

		    that.log.debug({recieved: locationParsed.host, site: site.host },
				   "Found matching location");

		    return true;
		} else if (location.shared === true && locationParsed.host === site.host) {
		    if (locationParsed.hostname === site.host) {
			that.log.debug({recieved: locationParsed.host, site: site.host },
				       "Found matching location (hostname)");
			var urlRegexed = location.url.replace('*','.*');

			var re = new RegExp(urlRegexed, 'gi');
			if ( re.match(site.path) > -1 ) {
			    that.log.debug({recieved: location.url, site: site, match: re.match(site.path) },
					   "Found matching location (parameters)");
			    return true;
			} else {
			    return false;
			}
		    }
		    return true;
		}
	    });

	    that.log.debug({results: locationResult}, "Location Check Results");

	    var collectionResult = document.types.filter(function(typeValue)  {
		if (typeValue === type ) {

		    that.log.debug({match: { rType: type, sType: typeValue }}, "Found collection match!");
		    return true;

		} else {
		    return false;
		}
	    });

	    if (locationResult.length > 0 && collectionResult.length > 0) {
		that.log.debug({
		    matches: {
			collection: collectionResult,
			location: locationResult
		    }
		}, "Insertion Request matched requirements will return true");

		callback( true, type + "_" + document._id.toString() );
	    } else {
		that.log.debug({
		    matches: {
			collection: collectionResult,
			location: locationResult
		    }
		}, "Insertion Request does not match requirements will return false");
		callback(false);
	    }
	});
    });
};

Datastore.prototype.insert = function(type, user, collection, url, data) {
    var that = this;

    this.collectionExists(type, user, collection, url, function(exists, collectionName) {
	if (exists) {
	    that.log.trace({ collectionName: collectionName, data: data, type: type}, "Collection exists insert into " + collectionName );
	    that.insertIntoCollection(collectionName, data, type);
	} else {
	    that.log.info({ collection: collectionName, exists: exists }, "Collection did not exist returning null!");
	    return null;
	}
    });
};

Datastore.prototype.insertIntoCollection = function(collection, data, type){

    var that = this;

    this.log.info({ collection: collection, type: type, datakeys: Object.keys(data).join(",") }, "Got handed collection: " + collection + " will write to it...");

    this._database.collection(collection, {w: 1,strict: true},function(err, userCollection) {

	if(err != null ) {
	    that.handleError(err);
	    return;
	}

	that.log.info("inserting into: " + collection);

	userCollection.insertOne(data, function(err, result) {
	    that.log.info({ err: err}, "Insertion done, callback in effect");

	    if (typeof(err) !== "undefined") {
	    that.handleError(err);
		return;
	    }
	    that.log.debug("Insertion successful");
	    that.emit(type + "Inserted", result);
	});

    });
};

Datastore.prototype.handleError = function(message) {
    if (message instanceof String) {
	var error = new Error(message);
	this.log.fatal(error,message);
	return;
    } else if(message instanceof Error) {
	this.log.fatal(message,message.message);
    }
};

Datastore.prototype.toOID = function (id) {
    return new ObjectId(id);
};

Datastore.prototype.createConfig = function(config) {

    var serverOptions = {
	socketOptions: {
	    noDelay: true,
	    keepAlive: 100,
	    connectTimeoutMS: 200,
	    socketTimeoutMS: 200
	},
	logger: null,
	auto_reconnect: true,
	disableDriverBSONSizeCheck: false
    };

    if (typeof config.server !== "undefined" ) {

	if (typeof config.server.secure !== "undefined" ) {
	    if (config.server.secure) {
		serverOptions.ssl = true;
		serverOptions.sslCA = config.server.secure.ca || null;
		serverOptions.sslKey = config.server.secure.key || null;
		serverOptions.sslPass = config.server.secure.pass || null;
	    } else {
		serverOptions.ssl = false;
	    }
	}
    }

    if (typeof config.options !== "undefined") {
	serverOptions.poolSize = config.options.poolSize || 5;
    }


    var host, port, stats, buffer, dbName;

    if ( typeof config.server !== "undefined" ) {
	host = config.server.host || "localhost";
	port = config.server.port || 27017;
	dbName = config.db || "test";
    } else {
	host = "localhost";
	port = 27017;
	dbName = "test";
    }

    if (typeof config.options !== "undefined" ) {
	stats = config.options.stats || false;
	buffer = config.options.buffer || 100;
    } else {
	stats = false;
	buffer = 100;
    }

    var dbOptions = {
	w: 1,
	wtimeout: 0,
	fsync: false,
	j: false,
	readPreference: ReadPreference.NEAREST,
	native_parser: true,
	forceServerObjectId: true,
	recordQueryStats: stats,
	logger: null,
	promoteLongs: false,
	bufferMaxEntries: buffer
    };
    var url = "mongodb://" + host + ":" + port + "/" + dbName;

    return {
	db: dbOptions,
	server: serverOptions,
	url: url
    };
}

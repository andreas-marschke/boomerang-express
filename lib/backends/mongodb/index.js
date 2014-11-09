"use strict";

var Server = require("mongodb").Server,
    Database = require("mongodb").Db,
    ObjectId = require("mongodb").ObjectID,
    ReadPreference = require("mongodb").ReadPreference,
    EventEmitter = require("events").EventEmitter,
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

    var serverOptions = {
	socketOptions: {
	    noDelay: true,
	    keepAlive: 100,
	    connectTimeoutMS: 200,
	    socketTimeoutMS: 200
	},
	logger: logger || null,
	auto_reconnect: true,
	disableDriverBSONSizeCheck: false
    };

    if (typeof this.config.server !== "undefined" ) {

	if (typeof this.config.server.secure !== "undefined" ) {
	    if (this.config.server.secure) {
		serverOptions.ssl = true;
		serverOptions.sslCA = this.config.server.secure.ca || null;
		serverOptions.sslKey = this.config.server.secure.key || null;
		serverOptions.sslPass = this.config.server.secure.pass || null;
	    } else {
		serverOptions.ssl = false;
	    }
	}
    }

    if (typeof this.config.options !== "undefined") {
	serverOptions.poolSize = this.config.options.poolSize || 5;
    }

    var db = createDb(this.config, serverOptions);

    try {
	var that = this;
	db.open(function(err, _db){
	    if(err !== null) {
		that.emit("dbOpenError",err);
		return;
	    } else {
		that._database = _db;
		that.emit("open",that);
	    }
	});
    } catch (ex) {
	this.emit("dbOpenError",ex);
    }

    return this;
};

util.inherits(Datastore,EventEmitter);

Datastore.prototype.collectionExists = function(type, user, collection, site, callback) {
    var that = this;
    this._database.collection("collections",function(err, collections) {
	if (err !== null)   {
	    that.log.handleError(err);
	    callback(false);
	    return;
	}
	collections.findOne({ owner: user, name: collection}, function (err, collectionObject) {
	    if (typeof (err) !== "undefined")   {
		that.handleError(err);
		callback(false);
		return false;
	    }

	    var locationResult = collectionObject.locations.filter(function(location){
		var locationParsed = url.parse(location.url);
		if(location.shared === false && locationParsed.host === site.host) {
		    return true;
		} else if (location.shared === true && locationParsed.host === site.host) {
		    // XXX: TODO: Add shared features
		    return true;
		}
	    });

	    var collectionResult = collectionObject.types.filter(function(typeValue)  {
		if (typeValue === type ) {
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
		}, "Insertion Request matches requirements will return true");

		callback( true, type + "_" + collectionObject._id.toString() );
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
    this.log.debug({ args: arguments }, "Insertion requested!");
    var that = this;

    this.collectionExists(type, user, collection, url, function(exists, collection) {
	if (! exists) {
	    return;
	} else {
	    that._insertIntoCollection(collection, data, type);
	}
    });
};

Datastore.prototype._insertIntoCollection = function(collection, data, type){
    var that = this;
    this._database.collection(collection, {strict: true}, function(err, data_collection){
	if(err != null) {
	    that.handleError(err);
	    return;
	}

	data_collection.insert(data, {keepGoing: true, fullResult: true}, function(err, result) {
	    if (err != null) {
		that.handleError(err);
		return;
	    }
	    that.emit(type + "Inserted", result);
	});
    });
};

Datastore.prototype.handleError = function(message) {
    if (message instanceof String) {
	var error = new Error(message);
	this.log.warn(error);
	return;
    } else if(message instanceof Error) {
	this.log.error(message);
    }
};

Datastore.prototype.toOID = function (id) {
    return new ObjectId(id);
};

function createDb(config, serverOptions) {
    var host, port, stats, buffer;

    if ( typeof config.server !== "undefined" ) {
	host = config.server.host || "localhost";
	port = config.server.port || 27017;
    } else {
	host = "localhost";
	port = 27017;
    }

    if (typeof config.options !== "undefined" ) {
	stats = config.options.stats || false;
	buffer = config.options.buffer || 100;
    } else {
	stats = false;
	buffer = 100;
    }

    var server = new Server( host || "localhost", port, serverOptions);

    return new Database((config.db || "test"), server, {
	w: 0,
	wtimeout: 0,
	fsync: false,
	j: false,
	readPreference: ReadPreference.NEAREST,
	native_parser: true,
	forceServerObjectId: false,
	recordQueryStats: stats,
	logger: null,
	promoteLongs: false,
	bufferMaxEntries: buffer
    });
}

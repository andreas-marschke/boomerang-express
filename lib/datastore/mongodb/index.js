"use strict";
/* eslint-disable no-underscore-dangle */

var base = require("../../base"),
    ObjectId = require("mongodb").ObjectID,
    ReadPreference = require("mongodb").ReadPreference,
    MongoClient = require("mongodb").MongoClient;

function Backend (config, logger) {
    base.call(this, logger);
    this.config = this.createConfig(config || {});

    this.collections = {};
    this.init();

    return this;
}

Backend.prototype.init = function() {

    try {
	var mc = new MongoClient();

	mc.connect(this.config.url, this.db, function(err, db){
	    if (err) {
		this.log.trace(err);
		return err;
	    }
	    return this.db = db;
	}.bind(this));

	return true;
    } catch (ex) {
	this.log.trace(ex);
	return ex;
    }

    return true;
};

Backend.prototype.insert = function(type, user, collection, data, callback) {

    data.collection = collection;

    var dbCollectionName = type + "_" + user;
    this.collectionCursor(dbCollectionName, function(err, collection){
	if (err) {
	    callback(err);
	    this.log.trace(err);
	    return null;
	}

	collection.insert(data, function(err, result) {
	    if (err) {
		this.log.trace(err);
		return null;
	    }
	    callback(result._id);
	    return null;
	});
	return null;
    }.bind(this));
};

Backend.prototype.webcollections = function(user, callback) {
    this.collectionCursor("webcollections", function(err, collection) {
	collection.find({owner: user}).toArray(function(err, result) {
	    callback(result);
	}.bind(this));
    }.bind(this));
};

Backend.prototype.collectionCursor = function(dbCollectionName, callback) {
    this.log.debug("Fetching collection Cursor for collection: " + dbCollectionName);

    if ( typeof (this.collections[dbCollectionName]) === "undefined") {
	this.log.debug("Collection cursor doesn't exit will fetch cursor for: " + dbCollectionName);
	this.db.collection(dbCollectionName, { strict: false }, function(err, collection) {

	    this.log.debug("Collection Cursor got returned by mongodb!");
	    if (err) {
		callback(err);
		return this.log.trace(err);
	    }

	    this.log.debug("No Errors were reported will return collection cursor");

	    this.collections[dbCollectionName] = collection;
	    callback(null, collection);

	    return null;
	}.bind(this));
    } else {
	this.log.debug("Found existing collection cursor for: " + dbCollectionName);
	callback(null, this.collections[dbCollectionName]);
    }
};

Backend.prototype.createConfig = function(config) {
    /* eslint-disable camelcase */
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
    var mongoUrl = "mongodb://" + host + ":" + port + "/" + dbName;

    return {
	db: dbOptions,
	server: serverOptions,
	url: mongoUrl
    };
};

module.exports = Backend;

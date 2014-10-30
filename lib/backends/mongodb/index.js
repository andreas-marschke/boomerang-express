var Server = require('mongodb').Server,
    Database = require('mongodb').Db,
    ObjectId = require('mongodb').ObjectID,
    ReadPreference = require('mongodb').ReadPreference,
    EventEmitter = require('events').EventEmitter,
    util = require('util'),
    ERROR_CODES = require("./../errorcodes.js");

var Datastore = module.exports = function Datastore (options,logger) {

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
	    serverOptions.ssl = this.config.server.secure ? true :  false,
	    serverOptions.sslCA = this.config.server.secure.ca || null,
	    serverOptions.sslKey = this.config.server.secure.key || null,
	    serverOptions.sslPass = this.config.server.secure.pass || null;
	}
    }

    if (typeof this.config.options !== "undefined") {
	serverOptions.poolSize = this.config.options.poolSize || 5;
    }
    
    
    var internal = this;
    var db = this.db(this.config, serverOptions);
    
    try {
	db.open(function(err,_db){ 
	    if(err !== null) {
		internal.emit('dbOpenError',err);
		return;
	    } else {
		internal._database = _db;
		internal.emit('open',internal);
	    }
	});
    } catch (ex) { 

	this.emit("dbOpenError",ex);
    }
    
    return this;
};
util.inherits(Datastore,EventEmitter);

Datastore.prototype.collectionExists = function(type,id,callback) { 
    var that = this;
    this.log.info({ message: "Info: checking for collection: '" + type + "' for id: '" + id  + "'"});
    this._database.collectionNames(type + "_" + id,{ namesOnly: this.config.db},function (err,collectionName) { 
	if (collectionName.length > 0 ) {
	    callback(true,type + "_" + id);
	} else {
	    
	    var error = new Error("ERROR: No '"+ type + "' collection found with id: '" + id + "'");
	    error.code = ERROR_CODES.NO_COLLECTION_FOUND;
	    
	    that.log.error(error);

	    callback(false);
	}
    });
};

Datastore.prototype.insert = function(type,id,data) {
    var that = this;
    this.collectionExists(type,id,function(exists,collectionName) { 

	if (! exists ) {

	    var error = new Error ("ERROR: Tried to insert on a non-existant collection");
	    error.id = id;
	    error.code = ERROR_CODES.NO_COLLECTION_FOUND;

	    that.log.error(error);
	    
	    return;

	} else {
	    this._database.collection(collectionName,{strict: true},function(err,collection){ 
		if (typeof err !== "undefined") {
		    var error = new Error("ERROR: Tried to insert on a existing collection, still failed");
		    
		    error.id = id,
		    error.code = ERROR_CODES.DATABASE_ERROR,
		    error.parent_error = err;
		    
		    that.log.error(error);

		    return ;
		}
		
		collection.insert(data,function(err,result) { 
		    that.emit(type + "Inserted",result._id);
		});
	    });
	}
    });
	    
};

Datastore.prototype.toOID = function (id) {
    return new ObjectId(id);
}

Datastore.prototype.db = function(config,serverOptions) {
    var host, port, stats, buffer;
    
    if ( typeof config.server !== "undefined" ) {
	host = config.server.host || "localhost",
	port = config.server.port || 27017;
    } else {
	host = "localhost",
	port = 27017;
    }
    
    if (typeof config.options !== "undefined" ) {
	stats = config.options.stats || false,
	buffer = config.options.buffer || 100;
    } else {
	stats = false,
	buffer = 100;
    }

    var server = new Server ( host || "localhost", port, serverOptions);
    
    return db = new Database(config.db || "test", server,{
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
};

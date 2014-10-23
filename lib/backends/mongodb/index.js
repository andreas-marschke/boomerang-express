/*
  // backends.mongodb: 
  
  var Backend = require("./lib/backends");
  
  var backend = new Backend(config.datastore,function(err,db) {
     // do whatever you want
  });
  
  process.exit(0);
 */

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
    }

    var _serverOptions = {
	ssl: this.config.server.secure ? true : false,
	sslCA: this.config.server.secure.ca || null,
	sslKey: this.config.server.secure.key || null,
	sslPass: this.config.server.secure.pass || null,
	poolSize: this.config.options.poolSize || 5,
	socketOptions: {
	    noDelay: true,
	    keepAlive: 100,
	    connectTimeoutMS: 400,
	    socketTimeoutMS: 400
	},
	logger: logger || null,
	auto_reconnect: true,
	disableDriverBSONSizeCheck: false
    };


    var server = new Server (this.config.server.host || "localhost", this.config.server.port || 27017,_serverOptions);
    
    var db = new Database(this.config.db || "test", server,{
	w: 0,
	wtimeout: 0,
	fsync: false,
	j: false,
	readPreference: ReadPreference.NEAREST,
	native_parser: true,
	forceServerObjectId: false,
	recordQueryStats: this.config.options.stats || false,
	logger: logger || null,
	promoteLongs: false,
	bufferMaxEntries: this.config.options.buffer
    });
        
    var internal = this;
    
    db.open(function(err,_db){ 
	if(err !== null) {
	    internal.emit('error',err);
	    return;
	} else {
	    internal._database = _db;
	    internal.emit('open',internal);
	}
    });
    
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
	    
	    that.log.error({ Error: { 
		message: "ERROR: No '"+ type + "' collection found with id: '" + id + "'",
		code: ERROR_CODES.NO_COLLECTION_FOUND
	    }});

	    callback(false);
	}
    });
};

Datastore.prototype.insert = function(type,id,data) {
    var that = this;
    this.collectionExists(type,id,function(exists,collectionName) { 

	if (! exists ) {
	    var error = { 
		message: "ERROR: Tried to insert on a non-existant collection",
		id: id,
		code: ERROR_CODES.NO_COLLECTION_FOUND,
	    };

	    that.log.error(error);
	    

	    return;

	} else {
	    this._database.collection(collectionName,{strict: true},function(err,collection){ 
		if (typeof err !== "undefined") {
		    that.log({ 
			message: "ERROR: Tried to insert on a existing collection, still failed",
			id: id,
			code: ERROR_CODES.DATABASE_ERROR,
			error: err
		    });
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

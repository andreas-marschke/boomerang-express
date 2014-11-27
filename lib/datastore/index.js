"use strict";

var base = require("../base"),
    validation = require("./validation.js");

function Datastore (options, logger) {

    base.call(this, logger);
    this.config = options;

    return this;
}

Datastore.prototype.init = function(datastore) {
    var Backend;
    try {
	Backend = require("./" + datastore + "/index.js");
    } catch(ex) {
	if (ex.code === "MODULE_NOT_FOUND") {
	    this.log.fatal("ERROR: No Datastore backend found for " + datastore);
	}
	return false;
    }

    try {
	this.log.debug("Trying to load Database Driver...", datastore);
	this.engine = new Backend(this.config[datastore], this.log);

    } catch(ex) {
	this.log.fatal({exception: ex },"ERROR: Initializing the backend failed!");
	return false;
    }

    return true;
};

Datastore.prototype.insert = function(type, user, collection, data, callback) {
    return this.engine.insert(type, user, collection, data, callback);
};

Datastore.prototype.exists = function(type, user, collection, referrer, callback) {

    this.engine.webcollections(user, function(collections) {

	this.log.debug("Webcollections returned by webcollections()", collections.map(this.joinedCollectionName));

	var collectionFilter = collections.filter(validation.collectionName.bind(this, collection));

	this.log.debug("Webcollections filtered by Name: ", collectionFilter.map(this.joinedCollectionName).join(",") );

	if (collectionFilter.length === 0 ) {
	    this.log.info("Could not find a valid webcollection matching the given collection name");
	    callback(false);
	    return 0;
	}

	var typesFilter = collectionFilter.filter(validation.types.bind(this, type));

	if (typesFilter.length === 0) {
	    this.log.info("Could not find a valid webcollection matching the given type name");
	    callback(false);
	    return 0;
	}

	var locationFilter = typesFilter.filter(function(webcollection) {
	    return webcollection.locations.filter(validation.location.bind(this, referrer)).length > 0;
	}.bind(this));

	if (locationFilter.length === 0) {
	    this.log.info("Could not find a valid webcollection matching the given location");
	    callback(false);
	    return 0;
	} else {
	    callback(true);
	    return 0;
	}
	return 0;
    }.bind(this));
};

Datastore.prototype.joinedCollectionName = function(c){ return "id: " + (c._id || c.id || c.name) + " name: " + c.name; };

module.exports = Datastore;

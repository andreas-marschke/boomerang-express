"use strict";

var base = require("../base");

function Datastore (options, logger) {

    base.call(this, logger);
    this.config = options;

    var result = this.init(this.config.active);

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

Datastore.prototype.insert = function(type, user, collection, data) {
    return this.engine.insert(type, user, collection, data);
};

Datastore.prototype.exists = function(type, user, collection, referrer, callback) {

    this.engine.webcollections(user, collection, function(collections) {
	this.log.debug("Webcollections returned by webcollections()", collections);
	var filter = collections.filter(function(collection) {
	    var location = collection.locations.filter(this.locationExists.bind(this,site));
	}, this);
    });
};

Datastore.prototype.locationExists = function(site, location) {

};

module.exports = Datastore;

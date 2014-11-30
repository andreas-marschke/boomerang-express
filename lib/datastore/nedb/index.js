"use strict";

var base = require("../../base"),
    path = require("path"),
    fs = require("fs"),
    NeDB = require("nedb");

function Backend (config, logger) {

    base.call(this,logger);
    this.config = config || {};

    this.init();
    return this;
}

Backend.prototype.init = function() {

    if (typeof this.config.directory === "string") {

	var dbPath = path.resolve(this.config.directory);

	this.log.debug("resolved database path is: " + dbPath);
	this.log.debug("Database path exists? ", fs.existsSync(dbPath));
	if (fs.existsSync(dbPath)) {
	    this.loadDirectory();
	    return true;
	}
    }

    return false;
};

Backend.prototype.loadDirectory = function() {
    var files = fs.readdirSync(this.config.directory);

    if (files instanceof Error) {
	throw files;
    }

    if (files.length === 0) {
	throw Error("Error: NeDB: no files in database directory!", "NO_FILES_IN_DIRECTORY");
    }

    var dbFiles = files.filter(function(file) { return file.match(/\.db$/g) !== null; });
    this.engine = {};

    dbFiles.forEach(function(file) {
	this.log.debug({ file: file }, "Loading Database off of: " + file);

	this.engine[file.split(".db")[0]] = new NeDB({
	    filename: this.config.directory + "/" + file,
	    inMemoryOnly: false,
	    autoload: true
	});
    }, this);

    return null;
};

Backend.prototype.insert = function(type, user, collection, data, callback) {
    if(typeof this.engine[type + "_" + user] === "undefined") {
	throw new Error("Collection not found!");
    }

    if (typeof collection === "undefined") {
	throw new Error("No collection defined!");
    }
    data.collection = collection;
    this.engine[type + "_" + user].insert(data, function(err, docs) {
	if (err) {
	    this.log.trace(err);
	}
	if (typeof (callback) === "function") {
	    callback(docs._id);
	}
    }.bind(this));

    return true;
};

Backend.prototype.webcollections = function(user, callback) {
    if (typeof user === "undefined") {
	return [];
    }

    this.engine.webcollections.find({ owner: user }, function(err, docs) {
	if (err !== null) {
	    throw err;
	}
	callback(docs);
    });
    return null;
};

module.exports = Backend;

"use strict";

module.exports = {
    directoryContents: [
	"beacon_0000.db",
	"users.db",
	"webcollections.db",
	"tmp.data",
	"code.log",
	"trash.xml"
    ],
    expectedContents: [
	"beacon_0000",
	"users",
	"webcollections"
    ],
    databases: {
	beacon_0000: [],
	webcollections: [{
	    "_id" : "d34db33f",
	    "types" : [
		"beacon",
		"click",
		"resource",
		"form"
	    ],
	    "name" : "demo-webpage",
	    "owner" : "0000",
	    "locations" : [{
		"url" : "http://localhost:4000",
		"shared" : false
	    }]
	}],
	users: [{
	    "_id" : "0000",
	    "name" : "user",
	    "via" : "local"
	}]
    },
    fsMockEmpty: {
	readdirSync: function() {
	    return module.exports.directoryContents ;
	},
	mkdirP: function(path, auth, callback) {
	    callback();
	},
	mkdir: function(path, auth, callback) {
	    callback();
	},
	exists: function(path, callback) {
	    callback(true);
	},
	readFile: function(path, opts, callback) {
	    callback(null, "");
	},
	unlink: function(path, callback) {
	    callback(null);
	},
	rename: function(oldName, newName, callback) {
	    callback();
	},
	writeFile: function(filename, data, opts, callback) {
	    if (typeof opts === "function") {
		opts();
	    } else {
		callback();
	    }
	},
	appendFile: function(filname, data, opts, callback) {
	    if (typeof opts === "function") {
		opts();
	    } else {
		callback();
	    }
	}
    },
    pathMockWebcollections:  {
	resolve: function() {
	    return "/some/path/that/doesn't/exist";
	},
	dirname: function() {
	    return "/some/path/that/doesn't/exist";
	}
    },
    fsMockWebcollections: {
	readdirSync: function() {
	    return module.exports.directoryContents ;
	},
	mkdirP: function(path, auth, callback) {
	    callback();
	},
	mkdir: function(path, auth, callback) {
	    callback();
	},
	exists: function(path, callback) {
	    callback(true);
	},
	existsSync: function() {
	    return true;
	},
	readFile: function(path, opts, callback) {
	    if (path.match("webcollections.db")) {
		callback(null, JSON.stringify(module.exports.databases.webcollections[0]));
	    } else if (path.match("users.db")) {
		callback(null, JSON.stringify(module.exports.databases.users));
	    } else {
		callback(null, "");
	    }
	},
	unlink: function(path, callback) {
	    callback(null);
	},
	rename: function(oldName, newName, callback) {
	    callback();
	},
	writeFile: function(filename, data, opts, callback) {
	    if (typeof opts === "function") {
		opts();
	    } else {
		callback();
	    }
	},
	appendFile: function(filname, data, opts, callback) {
	    if (typeof opts === "function") {
		opts();
	    } else {
		callback();
	    }
	}
    }
};

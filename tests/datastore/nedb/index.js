/* global it, describe, beforeEach, afterEach */
"use strict";

var mockery = require("mockery"),
    SilentLogger = require("../../SilentLogger"),
    fixtures = require("../fixtures.js");

var assert = require("chai").assert;
var expect = require("chai").expect;

describe("Datastore Backend - NeDB:", function() {

    beforeEach(function(){
	mockery.enable({
	    warnOnReplace: false,
	    warnOnUnregistered: false,
	    useCleanCache: true
	});
    });

    afterEach(function() {
	mockery.resetCache();
	mockery.deregisterAll();
	mockery.disable();
    });

    it("Should work on require()", function(){
	require("../../../lib/datastore/nedb");
    });

    it("Should create an instance of the Datastore Backend", function(){
	var Backend = require("../../../lib/datastore/nedb");
	var backend = new Backend();

	assert.instanceOf(backend,Backend, "instance is not a Backend");
    });

    it("Should fail on initialization without configuration", function(){
	var Backend = require("../../../lib/datastore/nedb");
	var backend = new Backend();

	expect(backend.init).to.throw(Error);
    });

    it("Should fail on non-existant directory", function(){
	mockery.registerMock("fs", {
	    existsSync: function() {
		return false;
	    }
	});

	var Backend = require("../../../lib/datastore/nedb");
	var backend = new Backend({ "directory": "/some/directory/that/doesn't/exist" }, SilentLogger);

	assert.isFalse(backend.init());
    });

    it("Should throw the error given as a return from fs.readdirSync", function(){

	var errorThrown = new Error("File not found!");

	mockery.registerMock("fs", {
	    readdirSync: function() {
		return errorThrown;
	    }
	});

	var Backend = require("../../../lib/datastore/nedb");
	var backend = new Backend({
	    nedb: {
		"directory": "/some/directory/that/doesn't/exist"
	    }
	}, SilentLogger);

	expect(backend.loadDirectory).to.throw(Error);
    });

    it("Should load directory contents from directory matching *.db as NeDB files", function(){

	mockery.registerMock("fs", {
	    readdirSync: function() {
		return fixtures.directoryContents;
	    }
	});

	function NeDB() {
	    this.loadDatabase = function() {
		return ;
	    };

	    return this;
	}

	mockery.registerMock("nedb", NeDB);

	var Backend = require("../../../lib/datastore/nedb");
	var backend = new Backend({
	    nedb: {
		"directory": "/some/directory/that/doesn't/exist"
	    }
	}, SilentLogger);

	backend.loadDirectory();

	var keys = Object.keys(backend.engine);
	assert.deepEqual(fixtures.expectedContents, keys);

	keys.forEach(function(k) {
	    assert.instanceOf(backend.engine[k], NeDB, "Engine Objects are not an instance of mocked NeDB");
	});
    });

    it("Should throw an Error if no files have been found in the database directory", function(){
	mockery.registerMock("fs", {
	    readdirSync: function() {
		return [];
	    }
	});

	function NeDB() {
	    this.loadDatabase = function() {
		return ;
	    };

	    return this;
	}

	mockery.registerMock("nedb", NeDB);

	var Backend = require("../../../lib/datastore/nedb");
	var backend = new Backend({
	    nedb: {
		"directory": "/some/directory/that/doesn't/exist"
	    }
	}, SilentLogger);

	expect(backend.loadDirectory).to.throw(Error);
    });

    it("Should throw an error 'Collection not found!' when we pass no arguments", function(){
	mockery.registerMock("fs", {
	    readdirSync: function() {
		return fixtures.directoryContents;
	    }
	});

	function NeDB() {
	    this.loadDatabase = function() {
		return {};
	    };
	    this.insert = function() {

	    };
	    return this;
	}

	mockery.registerMock("nedb", NeDB);

	var Backend = require("../../../lib/datastore/nedb");
	var backend = new Backend({
	    nedb: {
		"directory": "/some/directory/that/doesn't/exist"
	    }
	}, SilentLogger);

	backend.loadDirectory("/some/directory/that/doesn't/exist");
	expect(backend.insert).to.throw(Error);
    });

    it("Should throw an error when no collection and data is given", function(){
	mockery.registerMock("fs", {
	    readdirSync: function() {
		return fixtures.directoryContents;
	    }
	});

	function NeDB() {
	    this.loadDatabase = function() {
		return {};
	    };
	    this.insert = function() {

	    };
	    return this;
	}

	mockery.registerMock("nedb", NeDB);

	var Backend = require("../../../lib/datastore/nedb");
	var backend = new Backend({
	    nedb: {
		"directory": "/some/directory/that/doesn't/exist"
	    }
	}, SilentLogger);

	backend.loadDirectory("/some/directory/that/doesn't/exist");
	expect(backend.insert.bind(backend,"beacon", "0000")).to.throw(Error);
    });

    it("Should return an id string on insertion callback", function(done){

	mockery.registerMock("fs", fixtures.fsMockEmpty);

	var Backend = require("../../../lib/datastore/nedb");
	var backend = new Backend({
	    nedb: {
		"directory": "/some/directory/that/doesn't/exist"
	    }
	}, SilentLogger);

	backend.loadDirectory("/some/directory/that/doesn't/exist");

	var data = { };

	backend.insert("beacon", "0000", "demo-webpage", data, function(id) {
	    assert.isString(id);
	    done();
	});
    });

    it("Should throw an error if reading data failed", function(){
	mockery.registerMock("fs", fixtures.fsMockWebcollections);

	var Backend = require("../../../lib/datastore/nedb");
	var backend = new Backend({ "directory": "/some/directory/that/doesn't/exist" }, SilentLogger);

	backend.loadDirectory("/some/directory/that/doesn't/exist");

    });

    it("Should return the webcollection document for a specific user when queried", function(done){
	mockery.registerMock("fs", fixtures.fsMockWebcollections);

	var Backend = require("../../../lib/datastore/nedb");
	var backend = new Backend({"directory": "/some/directory/that/doesn't/exist" }, SilentLogger);

	backend.loadDirectory("/some/directory/that/doesn't/exist");

	backend.webcollections("0000", function(collection) {
	    assert.deepEqual(collection, fixtures.databases.webcollections);
	    done();
	});
    });

});

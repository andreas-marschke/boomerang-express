"use strict";
/* global it, describe, before, after */

var mockery = require("mockery"),
    fixtures = require("./fixtures"),
    urlParse = require("url").parse,
    SilentLogger = require("../SilentLogger"),
    LoudLogger = require("../LoudLogger");

var assert = require("chai").assert;
var expect = require("chai").expect;

describe("Datastore", function() {

    after(function() {
	mockery.deregisterAll();
    });

    it("Should work on require()", function(){
	require("../../lib/datastore");
    });

    it("Should create a Datastore object", function(){
	var Datastore = require("../../lib/datastore");
	var datastore = new Datastore({},SilentLogger);

	assert.instanceOf(datastore, Datastore, "Datastore instance");
    });

    it("Should return false on non-existing sites", function(done){

//	mockery.registerMock('fs', fixtures.fsMockWebcollections);
//	mockery.registerMock('path', fixtures.pathMockWebcollections);

	var Datastore = require("../../lib/datastore");
	var datastore = new Datastore({
	    "active": "nedb",
	    nedb: {
		"directory": "/some/directory/that/doesn't/exist"
	    }
	},LoudLogger);

	console.log(datastore);

	var url = urlParse("http://www.example.org");
	console.log("typeof engine: ",typeof datastore.engine);
	datastore.exists("beacon", "0001", "webpage", url, function() {
	    console.log("arguments on callback for exists", arguments);
	});

    });
});

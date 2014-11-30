/* global it, describe, beforeEach, afterEach */
"use strict";
var mockery = require("mockery"),
    urlParse = require("url").parse,
    SilentLogger = require("../SilentLogger");

var assert = require("chai").assert;

describe("Datastore Validation:", function() {

    beforeEach(function(){
	mockery.enable({
	    warnOnReplace: false,
	    warnOnUnregistered: false,
	    useCleanCache: true
	});
    });

    afterEach(function() {
	mockery.deregisterAll();
    });

    it("Should work on require()", function(){
	require("../../lib/datastore/validation");
    });

    it("Should validate if the collection and webcollection match", function(){
	var bindableObject = {
	    log: SilentLogger
	};

	var validation = require("../../lib/datastore/validation");
	var testableFn = validation.collectionName.bind(bindableObject);

	assert.isTrue(testableFn("application", { name: "application" }));
	assert.isFalse(testableFn("application2", { name: "application" }));
    });

    it("Should validate types from the webcollection against requested", function(){
	var bindableObject = {
	    log: SilentLogger
	};

	var validation = require("../../lib/datastore/validation");
	var testableFn = validation.types.bind(bindableObject);

	assert.isTrue(testableFn("beacon", { types: ["beacon", "form", "click", "resource"]}));
	assert.isFalse(testableFn("code", { types: ["beacon", "form", "click", "resource"]}));
    });

    it("Should validate url locations", function(){
	var bindableObject = {
	    log: SilentLogger
	};

	var validation = require("../../lib/datastore/validation");
	var testableFn = validation.location.bind(bindableObject);

	var simpleSite = urlParse("http://www.example.org/web/code/coolsite/index.html");
	assert.isTrue(testableFn(simpleSite, {url: "http://www.example.org"}));

	var wrongSite = urlParse("http://www.test.org/web/code/coolsite/index.html");
	assert.isFalse(testableFn(wrongSite, {url: "http://www.example.org"}));

	var emptySite = urlParse("");
	assert.isFalse(testableFn(emptySite, {url: "http://www.example.org"}));

	var portSwitch = urlParse("http://localhost:4001/www/shop20");
	assert.isFalse(testableFn(portSwitch, {url: "http://localhost:4000/www/shop20"}));
    });
});

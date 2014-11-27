"use strict";
/* global it, describe */
/* eslint-disable no-unused-vars */

var assert = require("chai").assert;
var SilentLogger = require("../SilentLogger");

describe("Filters", function() {
    it("Should work on require()",function(){

	require("../../lib/filters");
    });

    it("Should instantiate a Filters Object", function(){
	var Filters = require("../../lib/filters");
	var filters = new Filters();

	assert.instanceOf(filters, Filters, "Is an instance of Filters");
    });

    it("Should have a config object containing our defined config", function() {
	var Filters = require("../../lib/filters");

	var config = { foo: "bar" };
	var configExpect = { foo: "bar", key: "abcdefghijklmnop" };

	var filters = new Filters(config);

	assert.deepEqual(filters.config, configExpect);
    });

    it("Should have a console.log object if no logger is given", function(){
	var log = console.log;
	var Filters = require("../../lib/filters");
	var filters = new Filters({}, console);

	assert.deepEqual(filters.log, console, "Logging Mechanism matches added");
    });

    it("Should keep empty string as empty string when testing on safeNumeric", function(){
	var Filters = require("../../lib/filters");
	var filters = new Filters({}, SilentLogger);
	var expected = "";

	assert.equal(filters.safeNumeric(""),expected);
    });
});

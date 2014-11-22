/* global it, describe */

var assert = require("chai").assert;
var SilentLogger = require("../util");

describe("Filters", function() {
    it("Should work on require()",function(){
	/* eslint-disable no-unused-vars */
	var Filters = require("../../lib/filters");
    });

    it("Should instantiate a Filters Object", function(){
	var Filters = require("../../lib/filters");
	var filters = new Filters();

	assert.instanceOf(filters, Filters, "Is an instance of Filters");
    });

    it("Should have a config object containing our defined config", function() {
	var Filters = require("../../lib/filters");

	var config = { foo: "bar" };
	var config_expect = { foo: "bar", key: "abcdefghijklmnop" };

	var filters = new Filters(config);

	assert.deepEqual(filters.config, config_expect);
    });

    it("Should have a console.log object if no logger is given", function(){
	var log = console.log;
	var Filters = require("../../lib/filters");
	var filters = new Filters({}, console);

	assert.deepEqual(filters.log, console, "Logging Mechanism matches added");
    });

    require("./munge");
    require("./inflate");
    require("./serializeHeaders");
    require("./serializeTimers");

    it("Should keep empty string as empty string when testing on safeNumeric", function(){
	var Filters = require("../../lib/filters");
	var filters = new Filters({}, SilentLogger);
	var expected = "";

	assert.equal(filters.safeNumeric(""),expected);
    });



});

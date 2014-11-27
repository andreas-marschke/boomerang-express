"use strict";
/* global it, describe */
/* eslint-disable camelcase */

var assert = require("chai").assert;
var SilentLogger = require("../SilentLogger");

describe("serializeTimers()", function() {
    it("Should serialize customtiming string", function(){
	var Filters = require("../../lib/filters");
	var filters = new Filters({}, SilentLogger);

	var original = "t_body|102,t_navigation|0,t_scripts|100,t_domloaded|376";
	var expected = {
	    t_body: 102,
	    t_navigation: 0,
	    t_scripts: 100,
	    t_domloaded: 376
	};
	assert.deepEqual(filters.serializeTimers(original),expected);
    });

    it("Should serialize customtiming string", function(){
	var Filters = require("../../lib/filters");
	var filters = new Filters({}, SilentLogger);

	var original = "t_body|102,t_navigation|0,t_scripts|,t_domloaded|376";
	var expected = {
	    t_body: 102,
	    t_navigation: 0,
	    t_scripts: NaN,
	    t_domloaded: 376
	};

	assert.deepEqual(filters.serializeTimers(original), expected);
    });

    it("Should return an empty customTiming Object when empty string has been passed", function(){
	var Filters = require("../../lib/filters");
	var filters = new Filters({}, SilentLogger);

	var original = "";
	var expected = {};

	assert.deepEqual(filters.serializeTimers(original), expected);
    });
});

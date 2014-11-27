"use strict";
/* global it, describe */

var assert = require("chai").assert;
var SilentLogger = require("../SilentLogger");

describe("Filters serialize():", function() {
    it("Should return an empty object on calling serialize with no arguments", function(){
	var Filters = require("../../lib/filters");
	var filters = new Filters({}, SilentLogger);

	assert.deepEqual(filters.serialize(),{});
    });

    it("Should generate a valid beacon data object, even if no data was given", function(){
	var Filters = require("../../lib/filters");
	var filters = new Filters({}, SilentLogger);
	var expected = {
	    agent: {},
	    cookies: {},
	    customTiming: {},
	    headers: {},
	    page: "none",
	    state: "none"
	};

	var actual = filters.serialize(null, null, null, null, null);

	delete actual.created;
	delete actual.ip;
	assert.deepEqual(actual, expected);
    });

    it("Should work on a comple request", function(){
	var Filters = require("../../lib/filters");
	var filters = new Filters({}, SilentLogger);
	var fs = require("fs");

	var str = fs.readFileSync("./tests/filters/data.json");
	var data = JSON.parse(str);

	var r = filters.serialize(data.restiming[0]);
	delete r.created;
	delete r.ip;
	assert.deepEqual(r, data.restimingExpected);
    });

    it("Should honor dnt if set in the configuration options", function(){
	var Filters = require("../../lib/filters");
	var filters = new Filters({dnt: true }, SilentLogger);
	assert.deepEqual(filters.serialize({},{dnt: 1}),{});
    });

    it("Should serilize plugins if in data object", function(){
	var Filters = require("../../lib/filters");
	var filters = new Filters({dnt: true }, SilentLogger);

	var original = { plugins: "A,B,C" },
	    expected = {
		plugins: [ "A", "B", "C" ],
		agent: {},
		cookies: {},
		customTiming: {},
		headers: {},
		page: "none",
		state: "none"
	    };

	var actual = filters.serialize(original);

	delete actual.created;
	delete actual.ip;
	assert.deepEqual(actual, expected);
    });

    it("Should sanitze cookies should they have dots in them using inflate", function(){

	var Filters = require("../../lib/filters");
	var filters = new Filters({dnt: true }, SilentLogger);

	var cookies = { "boomerang.sig": "abc" },
	    expected = {
		agent: {},
		cookies: { boomerang: { sig: "abc"}},
		customTiming: {},
		headers: {}
	    };

	var actual = filters.serialize({},{},{},"",{}, cookies);

	delete actual.created;
	delete actual.ip;

	assert.deepEqual(actual.cookies, expected.cookies);


    });
});

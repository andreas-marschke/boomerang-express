"use strict";
/* global it, describe */

var assert = require("chai").assert;
var SilentLogger = require("../SilentLogger");

describe("Filters inflate():", function() {
    it("Should return an object with object values that are also objects", function(){
	var Filters = require("../../lib/filters");
	var filters = new Filters({}, SilentLogger);

	var original = {
	    "v": "0.3",
	    "d": "f",
	    "x": 233,
	    "rt.start": "navigation",
	    "rt.tstart": "1416611176218",
	    "rt.bstart": 1416611176374,
	    "rt.end": 1416611176650
	};

	var expected = {
	    "v": "0.3",
	    "d": "f",
	    "x": 233,
	    rt: {
		start: "navigation",
		tstart: 1416611176218,
		bstart: 1416611176374,
		end: 1416611176650
	    }
	};

	var actual = filters.inflate(original);

	assert.deepEqual(actual, expected);
    });

    it("Split Keys into objects", function(){
	var Filters = require("../../lib/filters");
	var filters = new Filters({}, SilentLogger);

	var original = {
	    "rt.start": "navigation",
	    "rt.tstart": "1416611176218",
	    "rt.bstart": 1416611176374,
	    "rt.end": 1416611176650,
	    "dt.string": "string",
	    "dt.numeric": "string"
	};

	var expected = {
	    rt: {
		start: "navigation",
		tstart: 1416611176218,
		bstart: 1416611176374,
		end: 1416611176650
	    },
	    dt: {
		string: "string",
		numeric: "string"
	    }
	};

	assert.deepEqual(filters.inflate(original), expected);
    });
});

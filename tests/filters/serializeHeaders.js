"use strict";
/* global it, describe */

var assert = require("chai").assert;
var SilentLogger = require("../SilentLogger");

describe("serializeHeaders()",  function() {
    it("Should fail gracefully if given null, undefined, '', {} or [] as headers", function(){
	var Filters = require("../../lib/filters");
	var filters = new Filters({}, SilentLogger);

	assert.deepEqual(filters.serializeHeaders(null), {});
	assert.deepEqual(filters.serializeHeaders(undefined), {});
	assert.deepEqual(filters.serializeHeaders(""), {});
	assert.deepEqual(filters.serializeHeaders(0), {});
	assert.deepEqual(filters.serializeHeaders({}), {});
	assert.deepEqual(filters.serializeHeaders([]), {});
    });

    it("Should serialize simple headers properly", function(){
	var Filters = require("../../lib/filters");
	var filters = new Filters({}, SilentLogger);

	var headers = { "x-special-header": "special" };
	var expected = { "x-special-header": "special" };

	var actual = filters.serializeHeaders(headers);

	assert.deepEqual(actual, expected);
    });

    it("Should NOT serialize 'user-agent' as is taken care of by require('useragent') in middlewares", function(){
	var Filters = require("../../lib/filters");
	var filters = new Filters({}, SilentLogger);

	var headers = { "user-agent": "Some Cool Browser" };
	var expected = { };

	var actual = filters.serializeHeaders(headers);

	assert.deepEqual(actual, expected);
    });

    it("Should NOT serialize 'cookie' as is taken care of by require('cookieParser') in middlewares", function(){
	var Filters = require("../../lib/filters");
	var filters = new Filters({}, SilentLogger);

	var headers = { "cookie": "Cookieeees" };
	var expected = { };

	var actual = filters.serializeHeaders(headers);

	assert.deepEqual(actual, expected);
    });


    it("Should serialize and split 'accept' headers", function(){
	var Filters = require("../../lib/filters");
	var filters = new Filters({}, SilentLogger);

	var headers = { "accept-encoding": "gzip,deflate,sdch",
			"accept-language": "de-DE,de;q=0.8,en-US;q=0.6,en;q=0.4" };
	var expected = {"accept-encoding": ["gzip", "deflate", "sdch"],
			"accept-language": ["de-DE", { name: "de", "rank": "0.8"}, {name: "en-US", rank: "0.6"}, {name: "en", rank: "0.4"}]};

	var actual = filters.serializeHeaders(headers);

	assert.deepEqual(actual, expected);
    });

    it("Should serialize non-standard 'accept-*' headers as well", function(){
	var Filters = require("../../lib/filters");
	var filters = new Filters({}, SilentLogger);

	var headers = { "accept-somevalue": "a,b,c" };
	var expected = {"accept-somevalue": ["a", "b", "c"]};

	var actual = filters.serializeHeaders(headers);
	assert.deepEqual(actual, expected);
    });

});

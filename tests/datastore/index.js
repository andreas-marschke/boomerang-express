/* global it, describe, beforeEach, afterEach */
"use strict";

var mockery = require("mockery"),
    fixtures = require("./fixtures"),
    urlParse = require("url").parse,
    SilentLogger = require("../SilentLogger");

var assert = require("chai").assert;

describe("Datastore Core:", function() {

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
    require("../../lib/datastore");
  });

  it("Should create a Datastore object", function(){
    var Datastore = require("../../lib/datastore");
    var datastore = new Datastore({}, SilentLogger);

    assert.instanceOf(datastore, Datastore, "Datastore instance");
  });

  it("Should return false on non-existing sites", function(done){

    mockery.registerMock("fs", fixtures.fsMockWebcollections);
    mockery.registerMock("path", fixtures.pathMockWebcollections);

    var Datastore = require("../../lib/datastore");
    var datastore = new Datastore({
      "active": "nedb",
      nedb: {
        "directory": "/some/directory/that/doesn't/exist"
      }
    }, SilentLogger);

    datastore.init("nedb");

    var url = urlParse("http://www.example.org");

    datastore.exists("beacon", "", "", url, function(exists) {
      assert.isFalse(exists);
      done();
    });
  });

  it("Should return true on existing sites", function(done){

    mockery.registerMock("fs", fixtures.fsMockWebcollections);
    mockery.registerMock("path", fixtures.pathMockWebcollections);

    var Datastore = require("../../lib/datastore");
    var datastore = new Datastore({
      "active": "nedb",
      nedb: {
        "directory": "/some/directory/that/doesn't/exist"
      }
    }, SilentLogger);

    var url = urlParse("http://localhost:4000/shop/article/1.23");
    datastore.init("nedb");
    datastore.exists("beacon", "0000", "demo-webpage", url, function(exists) {
      assert.isTrue(exists);
      done();
    });
  });

  it("Should return true on an existing site with a query string", function(done){
    mockery.registerMock("fs", fixtures.fsMockWebcollections);
    mockery.registerMock("path", fixtures.pathMockWebcollections);

    var Datastore = require("../../lib/datastore");
    var datastore = new Datastore({
      "active": "nedb",
      nedb: {
        "directory": "/some/directory/that/doesn't/exist"
      }
    }, SilentLogger);

    var url = urlParse("http://localhost:4000/shop/article/1.23?query=this&some=more");
    datastore.init("nedb");
    datastore.exists("beacon", "0000", "demo-webpage", url, function(exists) {
      assert.isTrue(exists);
      done();
    });
  });
});

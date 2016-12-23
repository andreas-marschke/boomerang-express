/* global it, describe, beforeEach, afterEach */
"use strict";

var mockery = require("mockery");

var assert = require("chai").assert;

describe("Datastore Backend - MongoDB:", function() {

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
    require("../../../lib/datastore/mongodb");
  });

  it.skip("Should create an instance of the Datastore Backend", function(){

    var Backend = require("../../../lib/datastore/mongodb");
    var backend = new Backend();

    assert.instanceOf(backend, Backend, "instance is not a Backend");
  });

});

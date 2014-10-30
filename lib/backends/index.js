var util = require("util"),
    fs = require("fs"),
    path = require("path"),
    EventEmitter = require('events').EventEmitter;

var Datastore = module.exports = function (options,logger) {
       
    EventEmitter.call(this);

    if (typeof (logger) === "object") { 
	this.log = logger;
    } else {
	this.log = console;
    }

    if (typeof(options) !== "undefined" && typeof(options.active) === "string" ) {
	
	var config = options[options.active];

	try { 
	    var Backend = require ("./" + options.active + "/index.js");
	    return new Backend(config, logger);
	} catch (ex) {
	    this.emit('error',ex);
	    return this;
	}
    } else {
	
    }
    
    return this;
}

util.inherits(Datastore,EventEmitter);;

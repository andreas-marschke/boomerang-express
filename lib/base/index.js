"use strict";
/*
 Logging utility Function called by Objects to create this.log function
*/

function Logging(logger) {
    if (typeof (logger) === "object") {
	this.log = logger;
    } else {
	this.log = console;

	// "polyfill debug()",
	this.log.debug = console.info;
	this.log.fatal = console.error;
    }
}

module.exports = Logging;

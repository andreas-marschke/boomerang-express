"use strict";

var bunyan = require("bunyan");

function Logging(config) {

    this.datastoreLogger = bunyan.createLogger({
	name: "boomerang-express-datastore",
	immediate: false,
	streams: [{
	    stream: process.stdout,
	    level: config.datastore.level.toString() || "debug"
	}]
    });

    this.filterLogger = bunyan.createLogger({
	name: "boomerang-express-filter",
	immediate: false,
	streams: [{
	    stream: process.stdout,
	    level: config.filter.level.toString() || "debug"
	}]
    });

    this.appLogger = bunyan.createLogger({
	name: "boomerang-express-application",
	immediate: false,
	streams: [{
	    stream: process.stdout,
	    level: config.application.level.toString() || "debug"
	}]
    });

    this.webLogger = require("express-bunyan-logger")({
	name: "boomerang-express-web",
	immediate: false,
	parseUA: false,
	serializers: {
	    req: function (req) {
		return {
		    method: req.method,
		    headers: req.headers
		};
	    },
	    res: function () { return null; },
	    body: function () { return null; },
	    "req-headers": function () { return null; }
	},
	streams: [{
	    stream: process.stdout,
	    level: config.web.level || "info"
	}]
    });
    return this;
}

module.exports = Logging;

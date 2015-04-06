"use strict";
var os = require("os");
var bunyan = require("bunyan");
var logstash, elasticsearch;

var msgobj = {
    name: "boomerang-preflight",
    immediate: true,
    v: "0",
    hostname: os.hostname(),
    pid: process.pid,
    level: 30
};

try {
    logstash = require("bunyan-logstash");
} catch(ex) {
    msgobj.msg = "Warning: 'bunyan-logstash' required for logging to logstash failed to require!";
    process.stdout.write(JSON.stringify(msgobj,  null, 2) + "\n");
    logstash = null;
}

try {
    elasticsearch = require("bunyan-elasticsearch");
} catch(ex) {
    msgobj.msg = "Warning: 'bunyan-elasticsearch' required for logging to elasticsearch failed to require!";

    process.stdout.write(JSON.stringify(msgobj, null, 2) + "\n");
    elasticsearch = null;
}

function Logging(config) {

    this.config = this.checkConfig(config || {});

    this.datastoreLogger = bunyan.createLogger({
	name: "boomerang-express-datastore",
	immediate: config.datastore.immediate || false,
	streams:  this.streams(this.config.options, this.config.datastore.level)

    });

    this.filterLogger = bunyan.createLogger({
	name: "boomerang-express-filter",
	immediate: config.filter.immediate || false,
	streams: this.streams(this.config.options, this.config.filter.level)

    });

    this.appLogger = bunyan.createLogger({
	name: "boomerang-express-application",
	immediate: config.application.immediate || false,
	streams: this.streams(this.config.options, this.config.application.level)
    });

    this.webLogger = require("express-bunyan-logger")({
	name: "boomerang-express-web",
	immediate: config.web.immediate || false,
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
	streams: this.streams(this.config.options, this.config.web.level)
    });
    return this;
}

Logging.prototype.streams = function(options, level) {
    return options.active.map(function(active) {
	switch (active) {
	case "stdout":
	    return {
		level: level,
		stream: process.stdout
	    };
	    break;
	case "logstash":
	    if (typeof logstash === "object") {
		return {
		    level: level,
		    type: "raw",
		    stream: logstash.createStream({
			level: level,
			host: options.logstash.host,
			port: options.logstash.port,
			application: "boomerang-express",
			tags: options.logstash.tags,
			legacy: false
		    })
		};
		break;
	    }
	default:
	    return {
		level: level,
		stream: process.stdout
	    };
	    break;
	}
    });
};

Logging.prototype.checkConfig = function(config) {

    if(typeof config.datastore === "undefined") {
	config.datastore = {};
    }

    if (typeof config.datastore.level === "undefined") {
	config.datastore.level = "debug";
    }

    if(typeof config.application === "undefined") {
	config.application = {};
    }

    if (typeof config.application.level === "undefined") {
	config.application.level = "debug";
    }

    if(typeof config.web === "undefined") {
	config.web = {};
    }

    if (typeof config.web.level === "undefined") {
	config.web.level = "debug";
    }

    if (typeof config.options === "undefined") {
	config.options = {};
	config.options.active = ["stdout"];
    } else {
	if (typeof config.options.active === "undefined") {
	    config.options.active = ["stdout"];
	}
    }

    return config;
};


module.exports = Logging;
